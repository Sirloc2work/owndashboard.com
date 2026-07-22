import type { VercelRequest, VercelResponse } from '@vercel/node';
import { serviceClient, requireAdmin, HttpError } from '../_lib.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido.');
    const admin = serviceClient();
    const caller = await requireAdmin(req, admin);

    const { id } = (req.body ?? {}) as { id?: string };
    if (!id) throw new HttpError(400, 'Falta el id del usuario.');
    if (id === caller.id) throw new HttpError(400, 'No puedes eliminar tu propia cuenta.');

    // El borrado en auth.users cascada a profiles y lifeos_state (FK on delete cascade).
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new HttpError(400, error.message);

    res.status(200).json({ ok: true });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    res.status(status).json({ error: e instanceof Error ? e.message : 'Error interno.' });
  }
}
