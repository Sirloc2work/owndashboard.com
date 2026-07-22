# LifeOS

Espacio de trabajo personal de productividad (SPA en español) con cinco vistas:
**Dashboard**, **Kanban** (con límites WIP), **Horario** semanal (timeboxing),
**Calendario** anual de fechas importantes y **Roadmap** estratégico.

Es **multiusuario** con autenticación de Supabase (email/contraseña), datos
**aislados por usuario** y persistentes, un **modo invitado** con datos de demo
efímeros, y un **panel de administración** para gestionar cuentas y su acceso a
las vistas.

## Stack

React 19 · TypeScript · Vite · Tailwind v4 · shadcn/ui · Zustand · dnd-kit ·
date-fns · **Supabase** (Auth + Postgres + RLS). Desplegado en Vercel.

## Desarrollo local

```bash
npm install
npm run dev        # servidor Vite (http://localhost:5173)
npm run build      # tsc -b && vite build — debe pasar sin errores TS
npm run lint       # oxlint
npm run preview    # sirve el build de dist/
```

Variables de entorno (crea un `.env` en la raíz, ver [.env.example](.env.example)):

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

> Son las **únicas** dos variables necesarias. No se usa ninguna clave de
> servicio (`service_role`) ni funciones serverless. Sin estas variables, el
> login queda deshabilitado pero el **modo invitado** sigue funcionando.

## Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor** → ejecuta todo [supabase/schema.sql](supabase/schema.sql). Es
   idempotente (puede re-ejecutarse). Crea las tablas `profiles` y
   `lifeos_state`, las políticas RLS, la función `is_admin()` y un trigger que
   crea el perfil automáticamente al dar de alta un usuario.
3. **Project Settings → API** → copia *Project URL* y la clave *anon* para las
   variables de entorno (arriba y en Vercel).
4. **Bootstrap del primer admin**:
   - **Authentication → Users → Add user** (marca *Auto Confirm User*).
   - **SQL Editor**, con tu email:
     ```sql
     insert into public.profiles (id, email, role)
     select id, email, 'admin' from auth.users where email = 'admin@tudominio.com'
     on conflict (id) do update set role = 'admin', active = true;
     ```
5. (Opcional) Para que los usuarios creados desde la app puedan entrar de
   inmediato, desactiva la confirmación por correo en **Authentication →
   Sign In / Providers → Email → "Confirm email"**.

## Despliegue (Vercel)

- El repo está conectado a Vercel; cada push a `main` despliega a producción.
- **Root Directory** del proyecto: `life-os-dynamic/`.
- **Environment Variables**: define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
  Tras cambiarlas hay que **redeploy** (se hornean en el build).

## Administración de usuarios

El panel **Administración** (visible solo para admins) gestiona las cuentas
directamente contra la tabla `profiles`, autorizado por RLS con tu propia sesión
(sin backend):

- **Crear usuario**: email + contraseña + rol + vistas habilitadas. Requiere
  "Confirm email" desactivado para que pueda entrar de inmediato; si no, quedará
  pendiente de confirmación.
- **Editar**: cambiar rol (`admin`/`user`), las vistas a las que accede, y
  activar/desactivar la cuenta.
- **Quitar acceso** (🗑️): elimina el perfil, con lo que la cuenta deja de poder
  entrar.

Operaciones que se hacen desde el **dashboard de Supabase** (requieren
privilegios que no viven en el cliente):

- **Borrado total** de una cuenta: **Authentication → Users** → eliminar.
- **Reset de contraseña**: **Authentication → Users** → editar usuario.

## Modo invitado

Desde el login, **"Explorar como invitado"** carga una planificación de ejemplo
(persona orientada a la productividad, con metas de corto/medio/largo plazo) que
llena las cinco vistas. Todo ocurre en el navegador: **no se escribe en la base
de datos** y los cambios se **descartan al salir o refrescar**.

## Arquitectura

Para el detalle de arquitectura (store Zustand, sincronización con Supabase,
modelo de horario semanal, reglas del Kanban, paleta de colores, RLS y roles),
ver [CLAUDE.md](CLAUDE.md).
