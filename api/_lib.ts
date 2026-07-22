import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';

export const BASE_VIEW_IDS = ['dashboard', 'kanban', 'timebox', 'calendar', 'roadmap'];

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Cliente con service_role: bypassa RLS. Solo en el servidor. */
export function serviceClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new HttpError(500, 'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor.');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getBearer(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return null;
  const match = header.match(/^Bearer (.+)$/);
  return match ? match[1] : null;
}

/** Valida el JWT del llamante y confirma que es un admin activo. */
export async function requireAdmin(req: VercelRequest, admin: SupabaseClient): Promise<User> {
  const token = getBearer(req);
  if (!token) throw new HttpError(401, 'Falta el token de autenticación.');

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    console.error('[requireAdmin] getUser falló:', error?.message, error);
    throw new HttpError(401, `Token inválido: ${error?.message ?? 'sin usuario'}`);
  }

  const { data: profile, error: profErr } = await admin
    .from('profiles')
    .select('role, active')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profErr) {
    console.error('[requireAdmin] error consultando profiles:', profErr.message);
    throw new HttpError(500, `Error consultando perfil: ${profErr.message}`);
  }
  if (!profile || profile.role !== 'admin' || profile.active === false) {
    throw new HttpError(403, 'Acceso restringido a administradores.');
  }
  return data.user;
}

export function sanitizeViews(input: unknown): string[] {
  if (!Array.isArray(input)) return [...BASE_VIEW_IDS];
  const filtered = input.filter((v) => typeof v === 'string' && BASE_VIEW_IDS.includes(v));
  return filtered.length ? (filtered as string[]) : [];
}

interface AdminUserDto {
  id: string;
  email: string;
  role: string;
  enabledViews: string[];
  active: boolean;
  createdAt: string;
  lastSignInAt: string | null;
}

function mapRow(row: Record<string, unknown>, lastSignInAt: string | null): AdminUserDto {
  return {
    id: String(row.id),
    email: typeof row.email === 'string' ? row.email : '',
    role: row.role === 'admin' ? 'admin' : 'user',
    enabledViews: sanitizeViews(row.enabled_views),
    active: row.active !== false,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
    lastSignInAt,
  };
}

/** Un usuario admin-DTO por id (perfil + último acceso de auth). */
export async function buildAdminUser(
  admin: SupabaseClient,
  id: string
): Promise<AdminUserDto> {
  const { data: profile, error } = await admin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !profile) throw new HttpError(404, 'Perfil no encontrado.');
  const { data: authUser } = await admin.auth.admin.getUserById(id);
  return mapRow(profile, authUser?.user?.last_sign_in_at ?? null);
}

/** Todos los usuarios admin-DTO (une perfiles con auth para el último acceso). */
export async function fetchAllAdminUsers(admin: SupabaseClient): Promise<AdminUserDto[]> {
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new HttpError(500, error.message);

  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const lastSignInById = new Map<string, string | null>();
  for (const u of authList?.users ?? []) {
    lastSignInById.set(u.id, u.last_sign_in_at ?? null);
  }

  return (profiles ?? []).map((p) => mapRow(p, lastSignInById.get(String(p.id)) ?? null));
}
