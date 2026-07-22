import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BASE_VIEW_IDS, VIEW_LABELS } from '@/lib/constants';
import { createUser, updateUser, type AdminUser } from '@/lib/adminApi';
import type { Role, ViewId } from '@/types';

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Usuario a editar; null para crear uno nuevo. */
  user: AdminUser | null;
  onSaved: (user: AdminUser) => void;
}

export function UserFormDialog({ open, onOpenChange, user, onSaved }: UserFormDialogProps) {
  const isEdit = user !== null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [active, setActive] = useState(true);
  const [enabledViews, setEnabledViews] = useState<ViewId[]>([...BASE_VIEW_IDS]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(user?.email ?? '');
      setPassword('');
      setRole(user?.role ?? 'user');
      setActive(user?.active ?? true);
      setEnabledViews(user?.enabledViews ?? [...BASE_VIEW_IDS]);
    }
  }, [open, user]);

  const toggleView = (view: ViewId) => {
    setEnabledViews((prev) =>
      prev.includes(view) ? prev.filter((v) => v !== view) : [...prev, view]
    );
  };

  const handleSave = async () => {
    if (!isEdit) {
      if (!email.trim() || !password) {
        toast.error('Email y contraseña son obligatorios.');
        return;
      }
      if (password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
    }
    setSaving(true);
    try {
      if (isEdit && user) {
        const saved = await updateUser({
          id: user.id,
          role,
          enabledViews,
          active,
        });
        toast.success('Usuario actualizado');
        onSaved(saved);
      } else {
        const saved = await createUser({
          email: email.trim(),
          password,
          role,
          enabledViews,
        });
        toast.success('Usuario creado');
        onSaved(saved);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifica el rol o el acceso a vistas.'
              : 'Crea una cuenta y define su acceso a las vistas.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@email.com"
              disabled={isEdit}
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="user-password">Contraseña</Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground">
                Para que pueda entrar de inmediato, "Confirm email" debe estar desactivado en
                Supabase (Authentication → Providers → Email).
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Vistas habilitadas</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {BASE_VIEW_IDS.map((view) => (
                <label
                  key={view}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={enabledViews.includes(view)}
                    onChange={() => toggleView(view)}
                  />
                  {VIEW_LABELS[view]}
                </label>
              ))}
            </div>
          </div>

          {isEdit && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Cuenta activa
            </label>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
