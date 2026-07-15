import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, CalendarClock, Settings2, Target } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TagManager } from '@/components/modals/TagManager';
import { useStore } from '@/store/useStore';
import {
  COLUMNS,
  DAYS,
  IN_PROGRESS_COLUMN_ID,
  getPaletteEntry,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

export function Dashboard() {
  const now = useNow();
  const tasks = useStore((s) => s.tasks);
  const timeBlocks = useStore((s) => s.timeBlocks);
  const roadmapPhases = useStore((s) => s.roadmapPhases);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);

  // getDay(): 0 = Domingo; DAYS empieza en Lunes.
  const currentDay = DAYS[(now.getDay() + 6) % 7];
  const currentHour = `${String(now.getHours()).padStart(2, '0')}:00`;
  const currentBlock = timeBlocks.find(
    (b) => b.day === currentDay && b.hour === currentHour
  );
  const blockPalette = currentBlock ? getPaletteEntry(currentBlock.category) : null;

  const inProgressColumn = COLUMNS.find((c) => c.id === IN_PROGRESS_COLUMN_ID);
  const wipLimit = inProgressColumn?.wipLimit ?? 3;
  const wipCount = tasks.filter((t) => t.columnId === IN_PROGRESS_COLUMN_ID).length;
  const wipExceeded = wipCount > wipLimit;

  const activePhase = roadmapPhases[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Tu centro de control diario.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setTagManagerOpen(true)}>
          <Settings2 className="size-4" />
          Etiquetas
        </Button>
      </div>

      {/* Banner de tiempo */}
      <Card className="border-primary/20 bg-gradient-to-r from-card to-primary/5">
        <CardContent className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <p className="text-4xl font-bold tabular-nums tracking-tight">
              {format(now, 'HH:mm:ss')}
            </p>
            <p className="text-sm text-muted-foreground first-letter:uppercase">
              {format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <CalendarClock className="hidden size-10 text-muted-foreground/40 sm:block" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Bloque actual */}
        <Card className={cn('border', blockPalette?.borderClass)}>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5" />
              Bloque Actual · {currentDay} {currentHour}
            </CardDescription>
            <CardTitle className="text-xl">
              {currentBlock ? currentBlock.activity : 'Fuera de horario — Descanso'}
            </CardTitle>
          </CardHeader>
          {blockPalette && currentBlock && (
            <CardContent>
              <Badge
                variant="outline"
                className={cn(
                  blockPalette.bgClass,
                  blockPalette.textClass,
                  blockPalette.borderClass
                )}
              >
                {blockPalette.label}
              </Badge>
            </CardContent>
          )}
        </Card>

        {/* Control WIP */}
        <Card className={cn(wipExceeded && 'border-red-500 shadow-[0_0_14px_rgba(239,68,68,0.3)]')}>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Activity className="size-3.5" />
              Control WIP · En Progreso
            </CardDescription>
            <CardTitle
              className={cn('text-4xl tabular-nums', wipExceeded && 'text-red-400')}
            >
              {wipCount}
              <span className="text-lg text-muted-foreground"> / {wipLimit}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-xs', wipExceeded ? 'text-red-400' : 'text-muted-foreground')}>
              {wipExceeded
                ? '⚠ Límite superado: termina antes de empezar algo nuevo.'
                : 'Dentro del límite. Mantén el foco.'}
            </p>
          </CardContent>
        </Card>

        {/* Foco de fase */}
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Target className="size-3.5" />
              Foco de Fase · {activePhase?.duration}
            </CardDescription>
            <CardTitle className="text-xl">{activePhase?.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-3 text-xs text-muted-foreground">
              {activePhase?.description}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enfoques de la fase activa */}
      {activePhase && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Enfoques de la Fase {activePhase.phaseNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activePhase.focusAreas.map((fa, i) => (
              <div key={i}>
                {i > 0 && <Separator className="mb-3" />}
                <p className="text-sm font-medium">{fa.title}</p>
                <p className="text-xs text-muted-foreground">{fa.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <TagManager open={tagManagerOpen} onOpenChange={setTagManagerOpen} />
    </div>
  );
}
