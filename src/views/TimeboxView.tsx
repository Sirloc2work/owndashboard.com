import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  MapPin,
  Plus,
  StickyNote,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TimeBlockEditor } from '@/components/modals/TimeBlockEditor';
import { CopyWeekDialog } from '@/components/modals/CopyWeekDialog';
import { DayDetailDialog } from '@/components/modals/DayDetailDialog';
import { useStore } from '@/store/useStore';
import { DAYS, getPaletteEntry } from '@/lib/constants';
import {
  getWeekDates,
  getWeekKey,
  parseLocalDate,
  shiftWeek,
  toDateKey,
  weekLabel,
} from '@/lib/date';
import { cn } from '@/lib/utils';
import type { ScheduleEntry } from '@/types';

export function TimeboxView() {
  const weekKey = useStore((s) => s.scheduleWeekKey);
  const setScheduleWeekKey = useStore((s) => s.setScheduleWeekKey);
  const hours = useStore((s) => s.hours);
  const cells = useStore((s) => s.weekSchedules[weekKey]);
  const importantDates = useStore((s) => s.importantDates);
  const addHour = useStore((s) => s.addHour);
  const removeHour = useStore((s) => s.removeHour);

  const [editor, setEditor] = useState<{ day: string; hour: string; entry: ScheduleEntry | null }>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [dayDetail, setDayDetail] = useState<string | null>(null);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [addHourOpen, setAddHourOpen] = useState(false);
  const [newHour, setNewHour] = useState('');

  const weekDates = getWeekDates(weekKey);
  const dateKeys = weekDates.map(toDateKey);
  const todayKey = toDateKey(new Date());
  const todayIndex = dateKeys.indexOf(todayKey);

  const getEntry = (day: string, hour: string) => cells?.[`${day}|${hour}`] ?? null;

  const openEditor = (day: string, hour: string, entry: ScheduleEntry | null) => {
    setEditor({ day, hour, entry });
    setEditorOpen(true);
  };

  const openDay = (dateKey: string) => {
    setDayDetail(dateKey);
    setDayDetailOpen(true);
  };

  const handleWeekJump = (value: string) => {
    if (value) setScheduleWeekKey(getWeekKey(parseLocalDate(value)));
  };

  const handleAddHour = () => {
    if (!newHour) {
      toast.error('Elige una hora');
      return;
    }
    if (hours.includes(newHour)) {
      toast.error('Esa hora ya existe en el horario');
      return;
    }
    addHour(newHour);
    toast.success(`Hora ${newHour} agregada`);
    setNewHour('');
    setAddHourOpen(false);
  };

  const handleRemoveHour = (hour: string) => {
    if (hours.length <= 1) {
      toast.error('Debe quedar al menos una hora');
      return;
    }
    removeHour(hour);
    toast.success(`Hora ${hour} quitada`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Horario Semanal</h1>
          <p className="text-sm font-medium text-primary first-letter:uppercase">
            {weekLabel(weekKey)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScheduleWeekKey(shiftWeek(weekKey, -1))}
              title="Semana anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScheduleWeekKey(getWeekKey(new Date()))}
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScheduleWeekKey(shiftWeek(weekKey, 1))}
              title="Semana siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Label htmlFor="week-jump" className="text-xs text-muted-foreground">
              Ir a
            </Label>
            <Input
              id="week-jump"
              type="date"
              value={dateKeys[0]}
              onChange={(e) => handleWeekJump(e.target.value)}
              className="h-9 w-[9.5rem]"
            />
          </div>

          <Popover open={addHourOpen} onOpenChange={setAddHourOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="size-4" />
                Agregar hora
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 space-y-2">
              <Label htmlFor="new-hour">Nueva franja horaria</Label>
              <Input
                id="new-hour"
                type="time"
                value={newHour}
                onChange={(e) => setNewHour(e.target.value)}
              />
              <Button size="sm" className="w-full" onClick={handleAddHour}>
                Agregar al horario
              </Button>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" onClick={() => setCopyOpen(true)}>
            <Copy className="size-4" />
            Copiar semana
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Haz clic en cualquier bloque para editar su actividad, lugar y descripción. La columna del
        día actual aparece resaltada.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border/70">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/60 hover:bg-card/60">
              <TableHead className="w-16 text-center font-semibold">Hora</TableHead>
              {DAYS.map((day, i) => {
                const isToday = i === todayIndex;
                const dayEvents = importantDates.filter((e) => e.date === dateKeys[i]);
                return (
                  <TableHead
                    key={day}
                    className={cn(
                      'min-w-32 text-center align-top font-semibold',
                      isToday && 'border-x-2 border-t-2 border-primary bg-primary/10'
                    )}
                  >
                    <div className="py-1">
                      <span className={cn(isToday && 'text-primary')}>{day}</span>
                      <span className="block text-xs font-normal text-muted-foreground">
                        {format(weekDates[i], 'd MMM', { locale: es })}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.map((event) => {
                            const palette = getPaletteEntry(event.category);
                            return (
                              <button
                                key={event.id}
                                type="button"
                                onClick={() => openDay(dateKeys[i])}
                                title={event.title}
                                className={cn(
                                  'block w-full truncate rounded border px-1 py-0.5 text-[10px] font-medium',
                                  palette.bgClass,
                                  palette.textClass,
                                  palette.borderClass
                                )}
                              >
                                {event.title}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {hours.map((hour, hourIdx) => {
              const isLastRow = hourIdx === hours.length - 1;
              return (
                <TableRow key={hour} className="hover:bg-transparent">
                  <TableCell className="group text-center text-xs font-medium text-muted-foreground tabular-nums">
                    <div className="flex items-center justify-center gap-1">
                      {hour}
                      <button
                        type="button"
                        onClick={() => handleRemoveHour(hour)}
                        title="Quitar esta hora"
                        className="text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  </TableCell>
                  {DAYS.map((day, i) => {
                    const isToday = i === todayIndex;
                    const entry = getEntry(day, hour);
                    const palette = entry ? getPaletteEntry(entry.category) : null;
                    return (
                      <TableCell
                        key={day}
                        className={cn(
                          'p-1',
                          isToday && 'border-x-2 border-primary bg-primary/5',
                          isToday && isLastRow && 'border-b-2'
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => openEditor(day, hour, entry)}
                          className={cn(
                            'w-full rounded-md border px-2 py-1.5 text-left text-xs leading-tight transition-transform hover:scale-[1.03] hover:brightness-125',
                            entry
                              ? palette!.cellClass
                              : 'border-transparent text-muted-foreground/40 hover:border-border'
                          )}
                        >
                          <span className="flex items-start justify-between gap-1">
                            <span className="font-medium">{entry ? entry.activity : 'Libre'}</span>
                            {entry?.description && (
                              <StickyNote className="mt-0.5 size-3 shrink-0 opacity-70" />
                            )}
                          </span>
                          {entry?.place && (
                            <span className="mt-0.5 flex items-center gap-0.5 text-[10px] opacity-75">
                              <MapPin className="size-2.5 shrink-0" />
                              <span className="truncate">{entry.place}</span>
                            </span>
                          )}
                        </button>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {todayIndex === -1 && (
        <Badge variant="secondary" className="text-xs">
          Estás viendo una semana distinta a la actual.
        </Badge>
      )}

      <TimeBlockEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        weekKey={weekKey}
        day={editor?.day ?? null}
        hour={editor?.hour ?? null}
        entry={editor?.entry ?? null}
      />
      <CopyWeekDialog open={copyOpen} onOpenChange={setCopyOpen} targetWeekKey={weekKey} />
      <DayDetailDialog open={dayDetailOpen} onOpenChange={setDayDetailOpen} date={dayDetail} />
    </div>
  );
}
