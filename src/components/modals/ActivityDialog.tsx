import { useEffect, useState } from 'react';
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
import { COLOR_PALETTE, DAYS } from '@/lib/constants';
import { shiftWeek } from '@/lib/date';
import { cn } from '@/lib/utils';

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Semana base (la visible en el Horario). */
  weekKey: string;
}

export function ActivityDialog({ open, onOpenChange, weekKey }: ActivityDialogProps) {
  const hours = useStore((s) => s.hours);
  const addActivityBlock = useStore((s) => s.addActivityBlock);

  const [activity, setActivity] = useState('');
  const [place, setPlace] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('blue');
  const [days, setDays] = useState<string[]>([]);
  const [fromHour, setFromHour] = useState('');
  const [toHour, setToHour] = useState('');
  const [repeatWeeks, setRepeatWeeks] = useState('0');

  useEffect(() => {
    if (open) {
      setActivity('');
      setPlace('');
      setDescription('');
      setCategory('blue');
      setDays([]);
      setFromHour(hours[0] ?? '');
      setToHour(hours[hours.length - 1] ?? '');
      setRepeatWeeks('0');
    }
  }, [open, hours]);

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleSave = () => {
    const trimmed = activity.trim();
    if (!trimmed) {
      toast.error('Escribe el nombre de la actividad');
      return;
    }
    if (days.length === 0) {
      toast.error('Elige al menos un día');
      return;
    }
    if (!fromHour || !toHour || fromHour >= toHour) {
      toast.error('El rango horario no es válido (la hora de fin debe ser posterior)');
      return;
    }
    const rangeHours = hours.filter((h) => h >= fromHour && h < toHour);
    if (rangeHours.length === 0) {
      toast.error('El rango no cubre ninguna franja del horario');
      return;
    }

    const weeks = Math.max(0, Math.min(52, Number(repeatWeeks) || 0));
    const weekKeys = [weekKey];
    for (let i = 1; i <= weeks; i++) weekKeys.push(shiftWeek(weekKey, i));

    addActivityBlock({
      weekKeys,
      days,
      hours: rangeHours,
      entry: {
        activity: trimmed,
        category,
        place: place.trim() || undefined,
        description: description.trim() || undefined,
      },
    });

    const weekMsg = weeks > 0 ? ` en ${weeks + 1} semanas` : '';
    toast.success(`Actividad agregada a ${days.length} día(s)${weekMsg}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva actividad</DialogTitle>
          <DialogDescription>
            Rellena varios bloques de una vez: elige los días y el rango de horas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="act-name">Actividad</Label>
            <Input
              id="act-name"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="p. ej. Gimnasio, Deep Work, Clases…"
            />
          </div>

          <div className="space-y-2">
            <Label>Días</Label>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((day) => {
                const selected = days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                      selected
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Desde</Label>
              <Select value={fromHour} onValueChange={setFromHour}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Select value={toHour} onValueChange={setToHour}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Se rellenan las franjas desde la hora de inicio hasta la de fin (sin incluir la última).
          </p>

          <div className="space-y-2">
            <Label htmlFor="act-place">Lugar</Label>
            <Input
              id="act-place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="p. ej. Casa / Oficina / Universidad"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="act-desc">Descripción</Label>
            <Textarea
              id="act-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas u objetivo del bloque…"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-2">
              <Label htmlFor="act-repeat">Repetir (semanas)</Label>
              <Input
                id="act-repeat"
                type="number"
                min={0}
                max={52}
                value={repeatWeeks}
                onChange={(e) => setRepeatWeeks(e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            0 = solo esta semana. Con N, se repite también en las próximas N semanas.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
