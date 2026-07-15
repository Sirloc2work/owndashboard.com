import { useEffect, useState } from 'react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, CalendarClock, CalendarDays, Settings2, Target } from 'lucide-react';
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
import { DayDetailDialog } from '@/components/modals/DayDetailDialog';
import { useStore } from '@/store/useStore';
import {
  COLUMNS,
  DAYS,
  IN_PROGRESS_COLUMN_ID,
  getPaletteEntry,
} from '@/lib/constants';
import { getActiveHour, getWeekKey, parseLocalDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { ViewId } from '@/types';

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return now;
}

export function Dashboard({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const now = useNow();
  const tasks = useStore((s) => s.tasks);
  const weekSchedules = useStore((s) => s.weekSchedules);
  const hours = useStore((s) => s.hours);
  const setScheduleWeekKey = useStore((s) => s.setScheduleWeekKey);
  const roadmapPhases = useStore((s) => s.roadmapPhases);
  const importantDates = useStore((s) => s.importantDates);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);

  // getDay(): 0 = Domingo; DAYS empieza en Lunes.
  const currentDay = DAYS[(now.getDay() + 6) % 7];
  const currentWeekKey = getWeekKey(now);
  // Franja actual según la lista de horas (soporta franjas personalizadas, no solo HH:00).
  const currentHour = getActiveHour(hours, now);
  const currentBlock = currentHour
    ? weekSchedules[currentWeekKey]?.[`${currentDay}|${currentHour}`] ?? null
    : null;
  const blockPalette = currentBlock ? getPaletteEntry(currentBlock.category) : null;

  const goToScheduleWeek = (date: string) => {
    setScheduleWeekKey(getWeekKey(parseLocalDate(date)));
    onNavigate('timebox');
  };

  const inProgressColumn = COLUMNS.find((c) => c.id === IN_PROGRESS_COLUMN_ID);
  const wipLimit = inProgressColumn?.wipLimit ?? 3;
  const wipCount = tasks.filter((t) => t.columnId === IN_PROGRESS_COLUMN_ID).length;
  const wipExceeded = wipCount > wipLimit;

  const activePhase = roadmapPhases[0];

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const upcomingDates = importantDates
    .filter((event) => event.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const relativeLabel = (dateStr: string): string => {
    const diff = differenceInCalendarDays(parseISO(dateStr), now);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    return `En ${diff} días`;
  };

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
              Bloque Actual · {currentDay}
              {currentHour ? ` ${currentHour}` : ''}
            </CardDescription>
            <CardTitle className="text-xl">
              {currentBlock ? currentBlock.activity : 'Fuera de horario — Descanso'}
            </CardTitle>
          </CardHeader>
          {blockPalette && currentBlock && (
            <CardContent className="space-y-1.5">
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
              {currentBlock.place && (
                <p className="text-xs text-muted-foreground">📍 {currentBlock.place}</p>
              )}
              {currentBlock.description && (
                <p className="text-xs text-muted-foreground">{currentBlock.description}</p>
              )}
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

      <div className="grid gap-4 md:grid-cols-2">
        {/* Próximas fechas importantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-base">
              <CalendarDays className="size-4 text-muted-foreground" />
              Próximas Fechas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {upcomingDates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay fechas próximas anotadas. Agrégalas desde la vista Calendario.
              </p>
            )}
            {upcomingDates.map((event) => {
              const palette = getPaletteEntry(event.category);
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    setSelectedDate(event.date);
                    setDayDialogOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-md border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-accent/50"
                >
                  <span className={cn('size-2.5 shrink-0 rounded-full', palette.swatchClass)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{event.title}</span>
                    <span className="block text-xs text-muted-foreground first-letter:uppercase">
                      {format(parseISO(event.date), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                  </span>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {relativeLabel(event.date)}
                  </Badge>
                </button>
              );
            })}
          </CardContent>
        </Card>

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
      </div>

      <TagManager open={tagManagerOpen} onOpenChange={setTagManagerOpen} />
      <DayDetailDialog
        open={dayDialogOpen}
        onOpenChange={setDayDialogOpen}
        date={selectedDate}
        onGoToSchedule={goToScheduleWeek}
      />
    </div>
  );
}
