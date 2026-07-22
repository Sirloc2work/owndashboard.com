import { useState } from 'react';
import { Zap, LogIn, Compass, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useSession } from '@/store/useSession';
import { isSupabaseConfigured } from '@/lib/supabase';

export function LoginView() {
  const signIn = useSession((s) => s.signIn);
  const enterGuest = useSession((s) => s.enterGuest);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Ingresa tu email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // El cambio de vista lo maneja el listener de sesión.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex items-center gap-2">
            <Zap className="size-7 text-primary" />
            <span className="text-2xl font-bold tracking-tight">LifeOS</span>
          </div>
          <CardTitle>Bienvenido</CardTitle>
          <CardDescription>Inicia sesión o explora el demo como invitado.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={!isSupabaseConfigured || loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={!isSupabaseConfigured || loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={!isSupabaseConfigured || loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              Iniciar sesión
            </Button>
          </form>

          {!isSupabaseConfigured && (
            <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              El inicio de sesión no está disponible: falta configurar Supabase. Puedes explorar
              el demo como invitado.
            </p>
          )}

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">o</span>
            <Separator className="flex-1" />
          </div>

          <Button variant="outline" className="w-full" onClick={enterGuest} disabled={loading}>
            <Compass className="size-4" />
            Explorar como invitado
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            En modo invitado nada se guarda: los cambios se descartan al salir.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
