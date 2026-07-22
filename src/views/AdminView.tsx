import { useEffect, useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserFormDialog } from '@/components/modals/UserFormDialog';
import { BASE_VIEW_IDS, VIEW_LABELS } from '@/lib/constants';
import { isSupabaseConfigured } from '@/lib/supabase';
import { listUsers, deleteUser, type AdminUser } from '@/lib/adminApi';

export function AdminView() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { users } = await listUsers();
      setUsers(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured) void load();
    else setLoading(false);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditing(user);
    setEditorOpen(true);
  };

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`¿Eliminar la cuenta de ${user.email}? Esta acción es irreversible.`)) {
      return;
    }
    try {
      await deleteUser(user.id);
      toast.success('Usuario eliminado');
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ShieldCheck className="size-6 text-primary" />
            Administración
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las cuentas y el acceso a las vistas de cada usuario.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="size-4" />
            Recargar
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Nuevo usuario
          </Button>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          El backend no está configurado. Define las variables de Supabase para gestionar
          usuarios.
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 px-1 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando usuarios…
        </div>
      )}

      {error && !loading && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error} (las funciones <code>/api/admin/*</code> solo corren en el despliegue de Vercel,
          no en el dev local).
        </p>
      )}

      {!loading && !error && isSupabaseConfigured && (
        <div className="rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Vistas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? 'Admin' : 'Usuario'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {user.enabledViews.length === BASE_VIEW_IDS.length
                        ? 'Todas'
                        : user.enabledViews.map((v) => VIEW_LABELS[v]).join(', ') || 'Ninguna'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.active
                          ? 'border-green-500/40 text-green-400'
                          : 'border-zinc-500/40 text-zinc-400'
                      }
                    >
                      {user.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(user)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDelete(user)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No hay usuarios todavía.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <UserFormDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        user={editing}
        onSaved={(saved) => {
          setUsers((prev) => {
            const exists = prev.some((u) => u.id === saved.id);
            return exists ? prev.map((u) => (u.id === saved.id ? saved : u)) : [...prev, saved];
          });
        }}
      />
    </div>
  );
}
