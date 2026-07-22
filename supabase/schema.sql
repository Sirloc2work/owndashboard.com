-- LifeOS · Esquema Supabase (multiusuario con auth y roles)
-- Ejecutar en el SQL Editor del proyecto Supabase.

-- ── Perfiles ──────────────────────────────────────────────────────────────
-- Rol y acceso a vistas los controla el admin. Vive separado de los datos del
-- usuario para que este no pueda auto-otorgarse vistas ni el rol admin.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('admin','user')),
  enabled_views text[] not null default array['dashboard','kanban','timebox','calendar','roadmap'],
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Estado de LifeOS por usuario ──────────────────────────────────────────
-- Blob JSONB con los 6 slices persistidos del store (tags, tasks, hours,
-- weekSchedules, roadmapPhases, importantDates).
create table if not exists public.lifeos_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.lifeos_state enable row level security;

-- ── RLS: estado ───────────────────────────────────────────────────────────
-- Cada usuario lee/escribe SOLO su propia fila.
drop policy if exists "own_state_select" on public.lifeos_state;
create policy "own_state_select" on public.lifeos_state
  for select using (auth.uid() = user_id);

drop policy if exists "own_state_insert" on public.lifeos_state;
create policy "own_state_insert" on public.lifeos_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "own_state_update" on public.lifeos_state;
create policy "own_state_update" on public.lifeos_state
  for update using (auth.uid() = user_id);

-- ── RLS: perfil ───────────────────────────────────────────────────────────
-- Un usuario lee su propio perfil; NO puede modificar su rol ni enabled_views.
-- La gestión de perfiles por el admin usa service_role (bypassa RLS) desde las
-- funciones serverless /api/admin/*, por eso no hay policy de escritura aquí.
drop policy if exists "own_profile_select" on public.profiles;
create policy "own_profile_select" on public.profiles
  for select using (auth.uid() = id);

-- ── Bootstrap del primer admin ────────────────────────────────────────────
-- 1) Crea el usuario en Authentication → Users (o con la API).
-- 2) Inserta su perfil como admin (reemplaza el UUID y el email):
--
-- insert into public.profiles (id, email, role)
-- values ('00000000-0000-0000-0000-000000000000', 'admin@tudominio.com', 'admin')
-- on conflict (id) do update set role = 'admin', active = true;
