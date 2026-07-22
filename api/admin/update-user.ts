import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  serviceClient,
  requireAdmin,
  buildAdminUser,
  sanitizeViews,
  HttpError,
} from '../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido.');
    const admin = serviceClient();
    await requireAdmin(req, admin);

    const { id, role, enabledViews, active, password } = (req.body ?? {}) as {
      id?: string;
      role?: string;
      enabledViews?: unknown;
      active?: unknown;
      password?: string;
    };
    if (!id) throw new HttpError(400, 'Falta el id del usuario.');

    if (password) {
      const { error } = await admin.auth.admin.updateUserById(id, { password });
      if (error) throw new HttpError(400, error.message);
    }

    const updates: Record<string, unknown> = {};
    if (role !== undefined) updates.role = role === 'admin' ? 'admin' : 'user';
    if (enabledViews !== undefined) updates.enabled_views = sanitizeViews(enabledViews);
    if (active !== undefined) updates.active = Boolean(active);

    if (Object.keys(updates).length > 0) {
      const { error } = await admin.from('profiles').update(updates).eq('id', id);
      if (error) throw new HttpError(400, error.message);
    }

    const user = await buildAdminUser(admin, id);
    res.status(200).json({ user });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    res.status(status).json({ error: e instanceof Error ? e.message : 'Error interno.' });
  }
}
