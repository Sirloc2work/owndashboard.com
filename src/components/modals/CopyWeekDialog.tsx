import { CalendarClock, Copy } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/store/useStore';
import { shiftWeek, weekLabel } from '@/lib/date';

interface CopyWeekDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Semana destino que se rellenará con la copia. */
  targetWeekKey: string;
}

export function CopyWeekDialog({ open, onOpenChange, targetWeekKey }: CopyWeekDialogProps) {
  const weekSchedules = useStore((s) => s.weekSchedules);
  const copyWeek = useStore((s) => s.copyWeek);

  // Semanas con al menos una celda, distintas de la actual, más recientes primero.
  const availableWeeks = Object.keys(weekSchedules)
    .filter((key) => key !== targetWeekKey && Object.keys(weekSchedules[key]).length > 0)
    .sort((a, b) => b.localeCompare(a));

  const prevWeekKey = shiftWeek(targetWeekKey, -1);
  const prevHasData = Object.keys(weekSchedules[prevWeekKey] ?? {}).length > 0;

  const doCopy = (fromWeekKey: string) => {
    if (!weekSchedules[fromWeekKey] || Object.keys(weekSchedules[fromWeekKey]).length === 0) {
      toast.error('Esa semana está vacía, no hay nada que copiar');
      return;
    }
    copyWeek(fromWeekKey, targetWeekKey);
    toast.success('Configuración copiada a esta semana');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Usar configuración de otra semana</DialogTitle>
          <DialogDescription>
            Copia los bloques de una semana anterior a{' '}
            <span className="font-medium text-foreground">{weekLabel(targetWeekKey)}</span>. Se
            sobrescribe lo que tenga esta semana.
          </DialogDescription>
        </DialogHeader>

        <Button
          variant="outline"
          className="w-full justify-start"
          disabled={!prevHasData}
          onClick={() => doCopy(prevWeekKey)}
        >
          <CalendarClock className="size-4" />
          Semana anterior
          {!prevHasData && <span className="ml-auto text-xs text-muted-foreground">(vacía)</span>}
        </Button>

        {availableWeeks.length > 0 && (
          <>
            <Separator />
            <p className="text-sm font-medium">Elegir una semana específica</p>
            <div className="space-y-1.5">
              {availableWeeks.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => doCopy(key)}
                  className="flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left text-sm transition-colors hover:border-border hover:bg-accent/50"
                >
                  <Copy className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{weekLabel(key)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {Object.keys(weekSchedules[key]).length} bloques
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
