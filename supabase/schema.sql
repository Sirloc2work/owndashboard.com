-- LifeOS · Esquema Supabase (multiusuario, auth + roles, admin vía RLS)
-- Ejecutar en el SQL Editor. Es idempotente: puede correrse varias veces.

-- ── Perfiles ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('admin','user')),
  enabled_views text[] not null default array['dashboard','kanban','timebox','calendar','roadmap'],
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Estado de LifeOS por usuario (blob JSONB con los 6 slices del store) ─────
create table if not exists public.lifeos_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.lifeos_state enable row level security;

-- ── ¿El usuario actual es admin? ────────────────────────────────────────────
-- SECURITY DEFINER: corre como el dueño de la función y NO dispara las policies
-- de profiles, evitando recursión de RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

-- ── RLS: estado (cada usuario, su propia fila) ──────────────────────────────
drop policy if exists "own_state_select" on public.lifeos_state;
create policy "own_state_select" on public.lifeos_state
  for select using (auth.uid() = user_id);

drop policy if exists "own_state_insert" on public.lifeos_state;
create policy "own_state_insert" on public.lifeos_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "own_state_update" on public.lifeos_state;
create policy "own_state_update" on public.lifeos_state
  for update using (auth.uid() = user_id);

-- ── RLS: perfil ─────────────────────────────────────────────────────────────
-- El usuario lee su propio perfil; el admin lee/gestiona todos.
drop policy if exists "own_profile_select" on public.profiles;
create policy "own_profile_select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "admin_select_all" on public.profiles;
create policy "admin_select_all" on public.profiles
  for select using (public.is_admin());

drop policy if exists "admin_insert_all" on public.profiles;
create policy "admin_insert_all" on public.profiles
  for insert with check (public.is_admin());

drop policy if exists "admin_update_all" on public.profiles;
create policy "admin_update_all" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_delete_all" on public.profiles;
create policy "admin_delete_all" on public.profiles
  for delete using (public.is_admin());

-- ── Privilegios de tabla (RLS decide las filas; el rol necesita el GRANT) ────
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update on public.lifeos_state to authenticated;

-- ── Alta automática de perfil al crear un usuario en Auth ───────────────────
-- Así, cuando el admin crea un usuario (desde la app o el dashboard de Supabase),
-- su perfil aparece solo con valores por defecto (rol 'user', todas las vistas).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, enabled_views, active)
  values (
    new.id,
    coalesce(new.email, ''),
    'user',
    array['dashboard','kanban','timebox','calendar','roadmap'],
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Bootstrap del primer admin ──────────────────────────────────────────────
-- Crea el usuario en Authentication → Users (Auto Confirm) y luego márcalo admin:
--
-- insert into public.profiles (id, email, role)
-- select id, email, 'admin' from auth.users where email = 'admin@tudominio.com'
-- on conflict (id) do update set role = 'admin', active = true;
