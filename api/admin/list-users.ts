import type { VercelRequest, VercelResponse } from '@vercel/node';
import { serviceClient, requireAdmin, fetchAllAdminUsers, HttpError } from '../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const admin = serviceClient();
    await requireAdmin(req, admin);
    const users = await fetchAllAdminUsers(admin);
    res.status(200).json({ users });
  } catch (e) {
    console.error('[api/admin/list-users] error:', e);
    const status = e instanceof HttpError ? e.status : 500;
    res.status(status).json({ error: e instanceof Error ? e.message : 'Error interno.' });
  }
}
