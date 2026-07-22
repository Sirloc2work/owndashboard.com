import { supabase } from '@/lib/supabase';
import { useStore, getLifeOSData } from '@/store/useStore';
import { buildStarterData } from '@/lib/demoSeed';
import type { LifeOSData } from '@/types';

const TABLE = 'lifeos_state';
const DEBOUNCE_MS = 800;

function isLifeOSData(v: unknown): v is LifeOSData {
  if (!v || typeof v !== 'object') return false;
  const d = v as Record<string, unknown>;
  return (
    Array.isArray(d.tags) &&
    Array.isArray(d.tasks) &&
    Array.isArray(d.hours) &&
    Array.isArray(d.roadmapPhases) &&
    Array.isArray(d.importantDates) &&
    typeof d.weekSchedules === 'object' &&
    d.weekSchedules !== null
  );
}

/**
 * Carga el estado del usuario desde la BD y lo hidrata en el store. Si la cuenta
 * es nueva (sin fila), inicializa con `buildStarterData` y crea la fila.
 */
export async function loadUserState(userId: string): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  if (data && isLifeOSData(data.data)) {
    useStore.getState().hydrate(data.data);
  } else {
    const starter = buildStarterData();
    useStore.getState().hydrate(starter);
    await supabase
      .from(TABLE)
      .upsert({ user_id: userId, data: starter, updated_at: new Date().toISOString() });
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let unsubscribe: (() => void) | null = null;

async function persist(userId: string, data: LifeOSData): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from(TABLE)
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
  if (error) console.error('Error guardando el estado en la base de datos:', error.message);
}

/** Suscribe el store a la BD: cada cambio en los 6 slices se guarda (debounced). */
export function startAutosave(userId: string): void {
  stopAutosave();
  let prev = getLifeOSData(useStore.getState());
  unsubscribe = useStore.subscribe((state) => {
    const next = getLifeOSData(state);
    const changed = (Object.keys(next) as (keyof LifeOSData)[]).some((k) => next[k] !== prev[k]);
    if (!changed) return;
    prev = next;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      void persist(userId, next);
    }, DEBOUNCE_MS);
  });
}

export function stopAutosave(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
}
