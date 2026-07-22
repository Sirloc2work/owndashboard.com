import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { mapProfileRow } from '@/lib/profile';
import type { Profile, Role, ViewId } from '@/types';

/** El admin gestiona usuarios directamente vía RLS (sin backend/serverless). */
export type AdminUser = Profile;

export interface CreateUserInput {
  email: string;
  password: string;
  role: Role;
  enabledViews: ViewId[];
}

export interface UpdateUserInput {
  id: string;
  role?: Role;
  enabledViews?: ViewId[];
  active?: boolean;
}

function requireClient() {
  if (!supabase) throw new Error('Supabase no está configurado.');
  return supabase;
}

/** Lista todas las cuentas (la policy admin_select_all lo permite si eres admin). */
export async function listUsers(): Promise<AdminUser[]> {
  const client = requireClient();
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapProfileRow(row));
}

export async function updateUser(input: UpdateUserInput): Promise<AdminUser> {
  const client = requireClient();
  const updates: Record<string, unknown> = {};
  if (input.role !== undefined) updates.role = input.role;
  if (input.enabledViews !== undefined) updates.enabled_views = input.enabledViews;
  if (input.active !== undefined) updates.active = input.active;

  const { data, error } = await client
    .from('profiles')
    .update(updates)
    .eq('id', input.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapProfileRow(data);
}

/** Borra el perfil (bloquea el acceso). La cuenta de Auth se elimina desde el dashboard. */
export async function deleteUser(id: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('profiles').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Crea una cuenta con signUp en un cliente aparte (persistSession: false) para no
 * tocar la sesión del admin. El trigger crea el perfil; luego se ajustan rol/vistas.
 * Requiere que "Confirm email" esté DESACTIVADO en Supabase para que el usuario
 * pueda entrar de inmediato (si no, quedará pendiente de confirmación).
 */
export async function createUser(input: CreateUserInput): Promise<AdminUser> {
  const client = requireClient();
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const signupClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await signupClient.auth.signUp({
    email: input.email,
    password: input.password,
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('No se pudo crear el usuario.');

  const { data: profile, error: upErr } = await client
    .from('profiles')
    .upsert({
      id: data.user.id,
      email: input.email,
      role: input.role,
      enabled_views: input.enabledViews,
      active: true,
    })
    .select()
    .single();
  if (upErr) throw new Error(upErr.message);
  return mapProfileRow(profile);
}
