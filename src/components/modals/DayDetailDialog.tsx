import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarPlus, CalendarRange, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImportantDateEditor } from '@/components/modals/ImportantDateEditor';
import { useStore } from '@/store/useStore';
import { getPaletteEntry } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ImportantDate } from '@/types';

interface DayDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fecha a mostrar en formato 'yyyy-MM-dd'; null si no hay selección. */
  date: string | null;
  /** Si se pasa, muestra un botón para abrir la semana de esta fecha en el Horario. */
  onGoToSchedule?: (date: string) => void;
}

export function DayDetailDialog({
  open,
  onOpenChange,
  date,
  onGoToSchedule,
}: DayDetailDialogProps) {
  const importantDates = useStore((s) => s.importantDates);
  const deleteImportantDate = useStore((s) => s.deleteImportantDate);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ImportantDate | null>(null);

  const events = date
    ? importantDates.filter((event) => event.date === date)
    : [];

  const formattedDate = date
    ? format(parseISO(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    : '';

  const openCreate = () => {
    setEditingEvent(null);
    setEditorOpen(true);
  };

  const openEdit = (event: ImportantDate) => {
    setEditingEvent(event);
    setEditorOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="first-letter:uppercase">{formattedDate}</DialogTitle>
            <DialogDescription>
              {events.length === 0
                ? 'No hay fechas importantes anotadas para este día.'
                : `${events.length} ${events.length === 1 ? 'evento anotado' : 'eventos anotados'}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {events.map((event) => {
              const palette = getPaletteEntry(event.category);
              return (
                <div
                  key={event.id}
                  className={cn('space-y-2 rounded-lg border p-3', palette.borderClass, palette.bgClass)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{event.title}</p>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(event)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-red-400"
                        onClick={() => {
                          deleteImportantDate(event.id);
                          toast.success(`"${event.title}" eliminada`);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                  <Badge
                    variant="outline"
                    className={cn('text-[10px]', palette.bgClass, palette.textClass, palette.borderClass)}
                  >
                    {palette.label}
                  </Badge>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={openCreate}>
              <CalendarPlus className="size-4" />
              Agregar fecha importante
            </Button>
            {onGoToSchedule && date && (
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => {
                  onGoToSchedule(date);
                  onOpenChange(false);
                }}
              >
                <CalendarRange className="size-4" />
                Ver esta semana en el Horario
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ImportantDateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        event={editingEvent}
        defaultDate={date ?? undefined}
      />
    </>
  );
}
