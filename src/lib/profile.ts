import { BASE_VIEW_IDS } from '@/lib/constants';
import type { Profile, ViewId } from '@/types';

/** Convierte una fila de la tabla `profiles` (snake_case) en un Profile. */
export function mapProfileRow(row: Record<string, unknown>, fallbackEmail = ''): Profile {
  const rawViews = Array.isArray(row.enabled_views) ? (row.enabled_views as unknown[]) : [];
  const enabledViews = rawViews.filter((v): v is ViewId => BASE_VIEW_IDS.includes(v as ViewId));
  return {
    id: String(row.id),
    email: typeof row.email === 'string' ? row.email : fallbackEmail,
    role: row.role === 'admin' ? 'admin' : 'user',
    enabledViews: enabledViews.length ? enabledViews : [...BASE_VIEW_IDS],
    active: row.active !== false,
    createdAt: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}
