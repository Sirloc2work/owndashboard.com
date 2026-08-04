import { format, subDays, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { PRIORITY_RANK } from '@/lib/constants';
import { getWeekKey, parseLocalDate, shiftWeek, toDateKey } from '@/lib/date';
import type { CompletionEvent } from '@/types';

export type Granularity = 'dia' | 'semana' | 'mes';

export interface Bucket {
  key: string;
  label: string;
  count: number;
  score: number;
}

export interface TagStat {
  tagId: string;
  count: number;
  score: number;
}

export interface ProgressStats {
  buckets: Bucket[];
  totalCount: number;
  totalScore: number;
  byTag: TagStat[];
  /** Variación de puntaje del último periodo vs el anterior (%). null si no computable. */
  deltaPct: number | null;
}

/** Puntaje de una tarea completada: urgencia × importancia (1–9). */
export function completionScore(ev: CompletionEvent): number {
  return PRIORITY_RANK[ev.urgency] * PRIORITY_RANK[ev.importance];
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Clave de bucket de un evento según la granularidad. */
function bucketKeyOf(ev: CompletionEvent, g: Granularity): string {
  const d = new Date(ev.completedAt);
  if (g === 'dia') return toDateKey(d);
  if (g === 'semana') return getWeekKey(d);
  return monthKey(d);
}

/** Construye la ventana de buckets (cronológica) para la granularidad. */
function windowBuckets(g: Granularity, now: Date): { key: string; label: string }[] {
  if (g === 'dia') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(now, 6 - i);
      return { key: toDateKey(d), label: format(d, 'EEE d', { locale: es }) };
    });
  }
  if (g === 'semana') {
    const cur = getWeekKey(now);
    return Array.from({ length: 8 }, (_, i) => {
      const wk = shiftWeek(cur, -(7 - i));
      return { key: wk, label: format(parseLocalDate(wk), 'd MMM', { locale: es }) };
    });
  }
  return Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return { key: monthKey(d), label: format(d, 'MMM', { locale: es }) };
  });
}

export function computeProgress(
  completions: CompletionEvent[],
  g: Granularity,
  now: Date = new Date()
): ProgressStats {
  const win = windowBuckets(g, now);
  const index = new Map(win.map((b, i) => [b.key, i]));
  const buckets: Bucket[] = win.map((b) => ({ key: b.key, label: b.label, count: 0, score: 0 }));
  const tagMap = new Map<string, TagStat>();
  let totalCount = 0;
  let totalScore = 0;

  for (const ev of completions) {
    const i = index.get(bucketKeyOf(ev, g));
    if (i === undefined) continue;
    const s = completionScore(ev);
    buckets[i].count += 1;
    buckets[i].score += s;
    totalCount += 1;
    totalScore += s;
    for (const tagId of ev.tagIds.length ? ev.tagIds : ['—']) {
      const t = tagMap.get(tagId) ?? { tagId, count: 0, score: 0 };
      t.count += 1;
      t.score += s;
      tagMap.set(tagId, t);
    }
  }

  const byTag = [...tagMap.values()].sort((a, b) => b.score - a.score);

  const last = buckets[buckets.length - 1]?.score ?? 0;
  const prev = buckets[buckets.length - 2]?.score ?? 0;
  const deltaPct = prev > 0 ? Math.round(((last - prev) / prev) * 100) : null;

  return { buckets, totalCount, totalScore, byTag, deltaPct };
}
