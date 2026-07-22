import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';

export const BASE_VIEW_IDS = ['dashboard', 'kanban', 'timebox', 'calendar', 'roadmap'];

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * URL base del proyecto. Se prefiere VITE_SUPABASE_URL (la del cliente) para que
 * la validación del token vaya SIEMPRE contra el proyecto que emitió la sesión, y
 * se limpian barras finales o un `/rest/v1` colado por error.
 */
function resolveUrl(): string {
  const raw = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (!raw) throw new HttpError(500, 'Falta VITE_SUPABASE_URL / SUPABASE_URL en el servidor.');
  return raw.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

/** Cliente con service_role: bypassa RLS. Solo en el servidor. */
export function serviceClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new HttpError(500, 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.');
  }
  return createClient(resolveUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getBearer(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return null;
  const match = header.match(/^Bearer (.+)$/);
  return match ? match[1] : null;
}

/**
 * Valida el JWT del llamante y confirma que es un admin activo.
 * Se valida vía PostgREST + RLS (la misma vía que usa el cliente y que SÍ acepta
 * los JWT ES256 de las nuevas llaves de firma), en vez de auth.getUser(), que
 * falla al no reconocer el `kid` de la firma asimétrica.
 */
export async function requireAdmin(req: VercelRequest): Promise<{ id: string }> {
  const token = getBearer(req);
  if (!token) throw new HttpError(401, 'Falta el token de autenticación.');

  const url = resolveUrl();
  const anon = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!anon) {
    throw new HttpError(500, 'Falta VITE_SUPABASE_ANON_KEY en el servidor.');
  }

  // Cliente con la anon key + el token del usuario: PostgREST valida el JWT y la
  // policy own_profile_select devuelve solo la fila del propio llamante.
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error } = await userClient
    .from('profiles')
    .select('id, role, active')
    .single();

  if (error || !profile) {
    console.error('[requireAdmin] validación falló:', error?.message, 'host:', new URL(url).host);
    throw new HttpError(401, `Token inválido: ${error?.message ?? 'sin perfil'} [srv host: ${new URL(url).host}]`);
  }
  if (profile.role !== 'admin' || profile.active === false) {
    throw new HttpError(403, 'Acceso restringido a administradores.');
  }
  return { id: String(profile.id) };
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

/** Huella de diagnóstico: host, tipo de service key, largo y hash (para ver si cambió). */
function diag(): string {
  let host = 'sin-url';
  try {
    host = new URL(resolveUrl()).host;
  } catch {
    /* ignore */
  }
  const keyKind = (k: string) =>
    !k
      ? 'VACÍA'
      : k.startsWith('sb_secret')
        ? 'sb_secret'
        : k.startsWith('sb_publishable')
          ? 'sb_publishable'
          : k.startsWith('eyJ')
            ? 'legacy-JWT'
            : 'otro';
  const sk = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const ak = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
  let hash = 0;
  for (let i = 0; i < sk.length; i++) hash = (hash * 31 + sk.charCodeAt(i)) >>> 0;
  const fp = sk ? hash.toString(16) : '—';
  return `[host ${host} · service ${keyKind(sk)} len ${sk.length} fp ${fp} · anon ${keyKind(ak)}]`;
}

/** Todos los usuarios admin-DTO (une perfiles con auth para el último acceso). */
export async function fetchAllAdminUsers(admin: SupabaseClient): Promise<AdminUserDto[]> {
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new HttpError(500, `profiles: ${error.message} ${diag()}`);

  const { data: authList, error: authErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (authErr) throw new HttpError(500, `auth.listUsers: ${authErr.message} ${diag()}`);
  const lastSignInById = new Map<string, string | null>();
  for (const u of authList?.users ?? []) {
    lastSignInById.set(u.id, u.last_sign_in_at ?? null);
  }

  return (profiles ?? []).map((p) => mapRow(p, lastSignInById.get(String(p.id)) ?? null));
}
