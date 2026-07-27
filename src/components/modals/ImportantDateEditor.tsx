import { useEffect, useState } from 'react';
import { addMonths, addWeeks, addYears } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { COLOR_PALETTE } from '@/lib/constants';
import { parseLocalDate, toDateKey } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { ImportantDate } from '@/types';

type Frequency = 'none' | 'weekly' | 'monthly' | 'yearly';

interface ImportantDateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Evento a editar; null para crear uno nuevo. */
  event: ImportantDate | null;
  /** Fecha por defecto al crear ('yyyy-MM-dd'). */
  defaultDate?: string;
}

export function ImportantDateEditor({
  open,
  onOpenChange,
  event,
  defaultDate,
}: ImportantDateEditorProps) {
  const addImportantDate = useStore((s) => s.addImportantDate);
  const addImportantDates = useStore((s) => s.addImportantDates);
  const updateImportantDate = useStore((s) => s.updateImportantDate);
  const deleteImportantDate = useStore((s) => s.deleteImportantDate);

  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('red');
  const [frequency, setFrequency] = useState<Frequency>('none');
  const [repeatCount, setRepeatCount] = useState('4');

  useEffect(() => {
    if (open) {
      setDate(event?.date ?? defaultDate ?? new Date().toISOString().slice(0, 10));
      setTitle(event?.title ?? '');
      setDescription(event?.description ?? '');
      setCategory(event?.category ?? 'red');
      setFrequency('none');
      setRepeatCount('4');
    }
  }, [open, event, defaultDate]);

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error('El título no puede estar vacío');
      return;
    }
    if (!date) {
      toast.error('Debes elegir una fecha');
      return;
    }
    if (event) {
      updateImportantDate(event.id, { date, title: trimmed, description, category });
      toast.success('Fecha importante actualizada');
    } else if (frequency !== 'none') {
      const count = Math.max(1, Math.min(60, Number(repeatCount) || 1));
      const base = parseLocalDate(date);
      const step = frequency === 'weekly' ? addWeeks : frequency === 'monthly' ? addMonths : addYears;
      const events = Array.from({ length: count }, (_, k) => ({
        date: k === 0 ? date : toDateKey(step(base, k)),
        title: trimmed,
        description,
        category,
      }));
      addImportantDates(events);
      toast.success(`${count} fechas creadas`);
    } else {
      addImportantDate({ date, title: trimmed, description, category });
      toast.success('Fecha importante creada');
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!event) return;
    deleteImportantDate(event.id);
    toast.success('Fecha importante eliminada');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? 'Editar Fecha Importante' : 'Nueva Fecha Importante'}</DialogTitle>
          <DialogDescription>
            {event
              ? 'Modifica los detalles del evento.'
              : 'Anota un evento o hito en tu calendario anual.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idate-date">Fecha</Label>
            <Input
              id="idate-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idate-title">Título</Label>
            <Input
              id="idate-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="p. ej. Deadline paper Binarias"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idate-description">Descripción</Label>
            <Textarea
              id="idate-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles, contexto, qué debe estar listo…"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOR_PALETTE.map((color) => (
                  <SelectItem key={color.key} value={color.key}>
                    <span className="flex items-center gap-2">
                      <span className={cn('size-3 rounded-full', color.swatchClass)} />
                      {color.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!event && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Repetir</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No repetir</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {frequency !== 'none' && (
                <div className="space-y-2">
                  <Label htmlFor="idate-count">Nº de veces</Label>
                  <Input
                    id="idate-count"
                    type="number"
                    min={1}
                    max={60}
                    value={repeatCount}
                    onChange={(e) => setRepeatCount(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {event ? (
            <Button
              variant="ghost"
              className="text-red-400 hover:text-red-300"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
