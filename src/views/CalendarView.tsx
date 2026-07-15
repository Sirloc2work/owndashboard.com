import { useMemo, useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MiniMonth } from '@/components/calendar/MiniMonth';
import { DayDetailDialog } from '@/components/modals/DayDetailDialog';
import { ImportantDateEditor } from '@/components/modals/ImportantDateEditor';
import { useStore } from '@/store/useStore';
import { getWeekKey, parseLocalDate } from '@/lib/date';
import type { ImportantDate, ViewId } from '@/types';

function toDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function CalendarView({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const importantDates = useStore((s) => s.importantDates);
  const setScheduleWeekKey = useStore((s) => s.setScheduleWeekKey);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [creatorOpen, setCreatorOpen] = useState(false);

  const todayStr = toDateStr(new Date());

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ImportantDate[]>();
    for (const event of importantDates) {
      const list = map.get(event.date);
      if (list) list.push(event);
      else map.set(event.date, [event]);
    }
    return map;
  }, [importantDates]);

  const eventsInYear = importantDates.filter((e) => e.date.startsWith(`${year}-`)).length;

  const openDay = (date: string) => {
    setSelectedDate(date);
    setDayDialogOpen(true);
  };

  const goToScheduleWeek = (date: string) => {
    setScheduleWeekKey(getWeekKey(parseLocalDate(date)));
    onNavigate('timebox');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendario Anual</h1>
          <p className="text-sm text-muted-foreground">
            Fechas importantes del año. Haz clic en cualquier día para ver o anotar eventos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-16 text-center text-lg font-bold tabular-nums">{year}</span>
          <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight className="size-4" />
          </Button>
          <Button size="sm" onClick={() => setCreatorOpen(true)}>
            <CalendarPlus className="size-4" />
            Nueva Fecha
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {eventsInYear === 0
          ? `Sin fechas anotadas en ${year}.`
          : `${eventsInYear} ${eventsInYear === 1 ? 'fecha anotada' : 'fechas anotadas'} en ${year}.`}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }, (_, month) => (
          <MiniMonth
            key={month}
            year={year}
            month={month}
            eventsByDate={eventsByDate}
            todayStr={todayStr}
            onDayClick={openDay}
          />
        ))}
      </div>

      <DayDetailDialog
        open={dayDialogOpen}
        onOpenChange={setDayDialogOpen}
        date={selectedDate}
        onGoToSchedule={goToScheduleWeek}
      />
      <ImportantDateEditor
        open={creatorOpen}
        onOpenChange={setCreatorOpen}
        event={null}
        defaultDate={todayStr}
      />
    </div>
  );
}
