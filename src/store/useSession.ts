import { create } from 'zustand';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { BASE_VIEW_IDS } from '@/lib/constants';
import { useStore, createEmptyData } from '@/store/useStore';
import { buildDemoData } from '@/lib/demoSeed';
import { loadUserState, startAutosave, stopAutosave } from '@/lib/syncState';
import { mapProfileRow } from '@/lib/profile';
import type { Profile } from '@/types';

type Mode = 'loading' | 'login' | 'authenticated' | 'guest';

/** Perfil sintético del invitado: ve todas las vistas, sin rol admin. */
const GUEST_PROFILE: Profile = {
  id: 'guest',
  email: 'invitado',
  role: 'user',
  enabledViews: [...BASE_VIEW_IDS],
  active: true,
  createdAt: new Date().toISOString(),
};

interface SessionState {
  mode: Mode;
  session: Session | null;
  profile: Profile | null;
  /** Suscribe a los cambios de auth de Supabase. Llamar una vez al montar. */
  init: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  enterGuest: () => void;
  signOut: () => Promise<void>;
}

export const useSession = create<SessionState>()((set, get) => {
  async function loadProfile(userId: string, email: string): Promise<Profile> {
    if (!supabase) return { ...GUEST_PROFILE, id: userId, email };
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    // Todo usuario debe tener perfil (el trigger lo crea al alta). Si falta, se
    // deniega el acceso en vez de asumir permisos.
    if (!data) {
      throw new Error('Tu cuenta no tiene un perfil asignado. Contacta al administrador.');
    }
    return mapProfileRow(data, email);
  }

  async function applySession(session: Session): Promise<void> {
    const email = session.user.email ?? '';
    const profile = await loadProfile(session.user.id, email);
    if (!profile.active) {
      if (supabase) await supabase.auth.signOut();
      set({ mode: 'login', session: null, profile: null });
      throw new Error('Esta cuenta está desactivada. Contacta al administrador.');
    }
    await loadUserState(session.user.id);
    startAutosave(session.user.id);
    set({ session, profile, mode: 'authenticated' });
  }

  return {
    mode: 'loading',
    session: null,
    profile: null,

    init: () => {
      if (!supabase) {
        set({ mode: 'login' });
        return;
      }
      let applying = false;
      // Red de seguridad: si en unos segundos seguimos en "loading" (evento que no
      // llega o sesión que no resuelve), mostrar el login en vez de colgarse.
      setTimeout(() => {
        if (get().mode === 'loading') set({ mode: 'login' });
      }, 6000);
      supabase.auth.onAuthStateChange((event, session) => {
        // No pisar el modo invitado con eventos de auth.
        if (get().mode === 'guest') return;
        if (event === 'SIGNED_OUT') {
          stopAutosave();
          useStore.getState().hydrate(createEmptyData());
          set({ mode: 'login', session: null, profile: null });
          return;
        }
        if (session && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
          // Ya autenticado con la misma sesión: evitar re-hidratar en refresh de token.
          if (get().mode === 'authenticated' && get().session?.user.id === session.user.id) {
            return;
          }
          if (applying) return;
          applying = true;
          // Importante: diferir las llamadas a Supabase FUERA del callback de auth.
          // Llamar supabase.from(...) dentro del callback provoca un deadlock por el
          // lock interno de gotrue (la sesión autentica pero nunca carga el perfil).
          setTimeout(() => {
            applySession(session)
              .catch((e) => {
                console.error('Error aplicando la sesión:', e);
                // No dejar la app colgada en "loading": limpiar la sesión rota y
                // volver al login para que el usuario pueda reintentar.
                stopAutosave();
                useStore.getState().hydrate(createEmptyData());
                if (supabase) void supabase.auth.signOut();
                set({ mode: 'login', session: null, profile: null });
                toast.error(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
              })
              .finally(() => {
                applying = false;
              });
          }, 0);
        } else if (event === 'INITIAL_SESSION' && !session) {
          set({ mode: 'login' });
        }
      });
    },

    signIn: async (email, password) => {
      if (!supabase) {
        throw new Error('El backend no está configurado.');
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error('Credenciales inválidas.');
      // La hidratación ocurre en el listener onAuthStateChange (SIGNED_IN).
    },

    enterGuest: () => {
      stopAutosave();
      useStore.getState().hydrate(buildDemoData());
      set({ mode: 'guest', session: null, profile: { ...GUEST_PROFILE } });
    },

    signOut: async () => {
      stopAutosave();
      const wasGuest = get().mode === 'guest';
      useStore.getState().hydrate(createEmptyData());
      if (supabase && !wasGuest) {
        await supabase.auth.signOut();
      }
      set({ mode: 'login', session: null, profile: null });
    },
  };
});
