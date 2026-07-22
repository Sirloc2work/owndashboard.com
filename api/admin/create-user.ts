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
    await requireAdmin(req);
    const admin = serviceClient();

    const { email, password, role, enabledViews } = (req.body ?? {}) as {
      email?: string;
      password?: string;
      role?: string;
      enabledViews?: unknown;
    };
    if (!email || !password) throw new HttpError(400, 'Email y contraseña son obligatorios.');

    const roleVal = role === 'admin' ? 'admin' : 'user';
    const views = sanitizeViews(enabledViews);

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr || !created.user) {
      throw new HttpError(400, createErr?.message ?? 'No se pudo crear el usuario.');
    }

    const { error: profErr } = await admin.from('profiles').insert({
      id: created.user.id,
      email,
      role: roleVal,
      enabled_views: views,
      active: true,
    });
    if (profErr) {
      // Evitar usuario huérfano en auth si falla el perfil.
      await admin.auth.admin.deleteUser(created.user.id);
      throw new HttpError(400, profErr.message);
    }

    const user = await buildAdminUser(admin, created.user.id);
    res.status(200).json({ user });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    res.status(status).json({ error: e instanceof Error ? e.message : 'Error interno.' });
  }
}
