import { useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { computeProgress, type Granularity } from '@/lib/progress';
import { getPaletteEntry } from '@/lib/constants';
import { cn } from '@/lib/utils';

const TABS: { key: Granularity; label: string }[] = [
  { key: 'dia', label: 'Día' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mes' },
];

export function ProgressChart() {
  const completions = useStore((s) => s.completions);
  const tags = useStore((s) => s.tags);
  const [g, setG] = useState<Granularity>('dia');

  const stats = computeProgress(completions, g);
  const maxBucket = Math.max(1, ...stats.buckets.map((b) => b.score));
  const maxTag = Math.max(1, ...stats.byTag.map((t) => t.score));

  return (
    <div className="space-y-3">
      {/* Selector de granularidad */}
      <div className="flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setG(t.key)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              g === t.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Totales + mejora */}
      <div className="flex items-end gap-4">
        <div>
          <p className="text-2xl font-bold tabular-nums leading-none">{stats.totalCount}</p>
          <p className="text-xs text-muted-foreground">tareas</p>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums leading-none">{stats.totalScore}</p>
          <p className="text-xs text-muted-foreground">puntos</p>
        </div>
        {stats.deltaPct !== null && (
          <span
            className={cn(
              'ml-auto flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium',
              stats.deltaPct >= 0
                ? 'border-green-500/40 bg-green-500/15 text-green-400'
                : 'border-red-500/40 bg-red-500/15 text-red-400'
            )}
            title="Variación del último periodo vs el anterior"
          >
            {stats.deltaPct >= 0 ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {Math.abs(stats.deltaPct)}%
          </span>
        )}
      </div>

      {/* Barras por periodo */}
      <div className="flex h-24 items-end gap-1">
        {stats.buckets.map((b) => (
          <div key={b.key} className="flex flex-1 flex-col items-center justify-end gap-1">
            <div
              className="w-full rounded-t bg-primary/70"
              style={{ height: `${Math.max(2, (b.score / maxBucket) * 100)}%` }}
              title={`${b.count} tareas · ${b.score} pts`}
            />
            <span className="w-full truncate text-center text-[9px] text-muted-foreground first-letter:uppercase">
              {b.label}
            </span>
          </div>
        ))}
      </div>

      {/* Desglose por etiqueta */}
      {stats.byTag.length > 0 && (
        <div className="space-y-1.5 border-t border-border/60 pt-2">
          <p className="text-xs font-medium text-muted-foreground">Por etiqueta</p>
          {stats.byTag.slice(0, 5).map((t) => {
            const tag = tags.find((x) => x.id === t.tagId);
            return (
              <div key={t.tagId} className="flex items-center gap-2">
                <span className="w-24 shrink-0 truncate text-xs">{tag?.name ?? 'Sin etiqueta'}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      tag ? getPaletteEntry(tag.color).swatchClass : 'bg-primary/50'
                    )}
                    style={{ width: `${(t.score / maxTag) * 100}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {t.count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
