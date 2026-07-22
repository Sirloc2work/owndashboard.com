import { supabase } from '@/lib/supabase';
import type { Profile, Role, ViewId } from '@/types';

/** Usuario tal como lo devuelve el panel de admin (perfil + metadatos de auth). */
export interface AdminUser extends Profile {
  lastSignInAt: string | null;
}

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
  /** Nueva contraseña opcional (reset). */
  password?: string;
}

async function authedFetch<T>(path: string, body?: unknown): Promise<T> {
  if (!supabase) throw new Error('Backend no configurado.');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sesión no válida.');

  const res = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(json.error || `Error ${res.status}`);
  }
  return json;
}

export function listUsers(): Promise<{ users: AdminUser[] }> {
  return authedFetch<{ users: AdminUser[] }>('/api/admin/list-users');
}

export function createUser(input: CreateUserInput): Promise<{ user: AdminUser }> {
  return authedFetch<{ user: AdminUser }>('/api/admin/create-user', input);
}

export function updateUser(input: UpdateUserInput): Promise<{ user: AdminUser }> {
  return authedFetch<{ user: AdminUser }>('/api/admin/update-user', input);
}

export function deleteUser(id: string): Promise<{ ok: true }> {
  return authedFetch<{ ok: true }>('/api/admin/delete-user', { id });
}
