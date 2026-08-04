import {
  Activity,
  CalendarClock,
  CalendarDays,
  Clock,
  Flame,
  KanbanSquare,
  LayoutGrid,
  ListTodo,
  Target,
  TrendingUp,
} from 'lucide-react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/store/useStore';
import {
  COLUMNS,
  DAYS,
  IN_PROGRESS_COLUMN_ID,
  PRIORITY_RANK,
  getPaletteEntry,
  getPriorityMeta,
} from '@/lib/constants';
import { getActiveHour, getWeekKey, toDateKey } from '@/lib/date';
import { cn } from '@/lib/utils';
import { useNow } from '@/components/dashboard/useNow';
import { useDashboardCtx } from '@/components/dashboard/DashboardContext';
import { ProgressChart } from '@/components/dashboard/ProgressChart';
import type { ReactElement } from 'react';
import type { ScheduleEntry, WidgetId } from '@/types';

// ── Cálculo compartido de bloque actual / siguiente ─────────────────────────
function useBlocks() {
  const now = useNow(30000);
  const weekSchedules = useStore((s) => s.weekSchedules);
  const hours = useStore((s) => s.hours);

  const currentDay = DAYS[(now.getDay() + 6) % 7];
  const currentWeekKey = getWeekKey(now);
  const currentHour = getActiveHour(hours, now);
  const currentBlock = currentHour
    ? weekSchedules[currentWeekKey]?.[`${currentDay}|${currentHour}`] ?? null
    : null;

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const toMinutes = (h: string) => {
    const [hh, mm] = h.split(':').map(Number);
    return hh * 60 + mm;
  };
  let nextBlock: { hour: string; entry: ScheduleEntry } | null = null;
  for (const h of [...hours].sort()) {
    if (toMinutes(h) <= nowMinutes) continue;
    const entry = weekSchedules[currentWeekKey]?.[`${currentDay}|${h}`];
    if (entry) {
      nextBlock = { hour: h, entry };
      break;
    }
  }
  return { currentDay, currentHour, currentBlock, nextBlock };
}

// ── Widgets ─────────────────────────────────────────────────────────────────
function RelojWidget() {
  const now = useNow(1000);
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <Clock className="size-8 shrink-0 text-primary/70" />
        <div>
          <p className="text-2xl font-bold tabular-nums tracking-tight">{format(now, 'HH:mm:ss')}</p>
          <p className="text-xs text-muted-foreground first-letter:uppercase">
            {format(now, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function BloqueActualWidget() {
  const { currentDay, currentHour, currentBlock } = useBlocks();
  const palette = currentBlock ? getPaletteEntry(currentBlock.category) : null;
  return (
    <Card className={cn('border', palette?.borderClass)}>
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          <CalendarClock className="size-3.5" />
          Ahora · {currentDay}
          {currentHour ? ` ${currentHour}` : ''}
        </CardDescription>
        <CardTitle className="text-lg">
          {currentBlock ? currentBlock.activity : 'Fuera de horario — Descanso'}
        </CardTitle>
      </CardHeader>
      {palette && currentBlock && (
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn(palette.bgClass, palette.textClass, palette.borderClass)}>
            {palette.label}
          </Badge>
          {currentBlock.place && (
            <span className="text-xs text-muted-foreground">📍 {currentBlock.place}</span>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function BloqueSiguienteWidget() {
  const { nextBlock } = useBlocks();
  const palette = nextBlock ? getPaletteEntry(nextBlock.entry.category) : null;
  return (
    <Card className={cn('border', palette?.borderClass)}>
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          <CalendarClock className="size-3.5" />
          Siguiente{nextBlock ? ` · empieza ${nextBlock.hour}` : ''}
        </CardDescription>
        <CardTitle className="text-lg">
          {nextBlock ? nextBlock.entry.activity : 'Sin más bloques hoy'}
        </CardTitle>
      </CardHeader>
      {palette && nextBlock && (
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn(palette.bgClass, palette.textClass, palette.borderClass)}>
            {palette.label}
          </Badge>
          {nextBlock.entry.place && (
            <span className="text-xs text-muted-foreground">📍 {nextBlock.entry.place}</span>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function ControlWipWidget() {
  const tasks = useStore((s) => s.tasks);
  const wipLimit = COLUMNS.find((c) => c.id === IN_PROGRESS_COLUMN_ID)?.wipLimit ?? 3;
  const wipCount = tasks.filter((t) => t.columnId === IN_PROGRESS_COLUMN_ID).length;
  const exceeded = wipCount > wipLimit;
  return (
    <Card className={cn(exceeded && 'border-red-500 shadow-[0_0_14px_rgba(239,68,68,0.3)]')}>
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          <Activity className="size-3.5" />
          Control WIP · En Progreso
        </CardDescription>
        <CardTitle className={cn('text-4xl tabular-nums', exceeded && 'text-red-400')}>
          {wipCount}
          <span className="text-lg text-muted-foreground"> / {wipLimit}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn('text-xs', exceeded ? 'text-red-400' : 'text-muted-foreground')}>
          {exceeded
            ? '⚠ Límite superado: termina antes de empezar algo nuevo.'
            : 'Dentro del límite. Mantén el foco.'}
        </p>
      </CardContent>
    </Card>
  );
}

function FocoFaseWidget() {
  const phase = useStore((s) => s.roadmapPhases)[0];
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          <Target className="size-3.5" />
          Foco de Fase · {phase?.duration}
        </CardDescription>
        <CardTitle className="text-xl">{phase?.title ?? 'Sin fase definida'}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-xs text-muted-foreground">{phase?.description}</p>
      </CardContent>
    </Card>
  );
}

function EnfoquesFaseWidget() {
  const phase = useStore((s) => s.roadmapPhases)[0];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Enfoques de la Fase {phase?.phaseNumber ?? ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(phase?.focusAreas ?? []).map((fa, i) => (
          <div key={i}>
            {i > 0 && <Separator className="mb-3" />}
            <p className="text-sm font-medium">{fa.title}</p>
            <p className="text-xs text-muted-foreground">{fa.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ProximasFechasWidget() {
  const importantDates = useStore((s) => s.importantDates);
  const { onOpenDay } = useDashboardCtx();
  const now = new Date();
  const todayStr = toDateKey(now);
  const upcoming = importantDates
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const relative = (dateStr: string) => {
    const diff = differenceInCalendarDays(parseISO(dateStr), now);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    return `En ${diff} días`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <CalendarDays className="size-4 text-muted-foreground" />
          Próximas Fechas Importantes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {upcoming.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay fechas próximas anotadas. Agrégalas desde la vista Calendario.
          </p>
        )}
        {upcoming.map((event) => {
          const palette = getPaletteEntry(event.category);
          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onOpenDay(event.date)}
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
                {relative(event.date)}
              </Badge>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

function ProgresoWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <TrendingUp className="size-4 text-muted-foreground" />
          Progreso de Tareas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ProgressChart />
      </CardContent>
    </Card>
  );
}

function ResumenKanbanWidget() {
  const tasks = useStore((s) => s.tasks);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <KanbanSquare className="size-4 text-muted-foreground" />
          Resumen Kanban
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {COLUMNS.map((col) => {
          const count = tasks.filter((t) => t.columnId === col.id).length;
          return (
            <div key={col.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{col.title}</span>
              <span className="font-semibold tabular-nums">{count}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function TareasUrgentesWidget() {
  const tasks = useStore((s) => s.tasks);
  const pending = tasks
    .filter((t) => t.columnId !== 'done')
    .sort(
      (a, b) =>
        PRIORITY_RANK[b.urgency ?? 'media'] - PRIORITY_RANK[a.urgency ?? 'media'] ||
        PRIORITY_RANK[b.importance ?? 'media'] - PRIORITY_RANK[a.importance ?? 'media']
    )
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <ListTodo className="size-4 text-muted-foreground" />
          Tareas Urgentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay tareas pendientes. 🎉</p>
        )}
        {pending.map((t) => {
          const urg = getPriorityMeta(t.urgency);
          return (
            <div key={t.id} className="flex items-center gap-2">
              <Badge variant="outline" className={cn('gap-1 text-[10px]', urg.badgeClass)}>
                <Flame className="size-2.5" />
                {urg.label}
              </Badge>
              <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── Registro ────────────────────────────────────────────────────────────────
interface WidgetDef {
  icon: typeof Clock;
  Component: () => ReactElement;
}

export const WIDGET_REGISTRY: Record<WidgetId, WidgetDef> = {
  reloj: { icon: Clock, Component: RelojWidget },
  'bloque-actual': { icon: CalendarClock, Component: BloqueActualWidget },
  'bloque-siguiente': { icon: CalendarClock, Component: BloqueSiguienteWidget },
  'control-wip': { icon: Activity, Component: ControlWipWidget },
  'foco-fase': { icon: Target, Component: FocoFaseWidget },
  'enfoques-fase': { icon: LayoutGrid, Component: EnfoquesFaseWidget },
  'proximas-fechas': { icon: CalendarDays, Component: ProximasFechasWidget },
  progreso: { icon: TrendingUp, Component: ProgresoWidget },
  'resumen-kanban': { icon: KanbanSquare, Component: ResumenKanbanWidget },
  'tareas-urgentes': { icon: ListTodo, Component: TareasUrgentesWidget },
};
