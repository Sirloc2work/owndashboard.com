import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WIDGET_LABELS } from '@/lib/constants';
import { WIDGET_REGISTRY } from '@/components/dashboard/registry';
import type { WidgetId } from '@/types';

interface WidgetGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  available: WidgetId[];
  onAdd: (id: WidgetId) => void;
}

export function WidgetGallery({ open, onOpenChange, available, onAdd }: WidgetGalleryProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir widget</DialogTitle>
          <DialogDescription>Elige un widget para tu dashboard.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {available.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ya añadiste todos los widgets disponibles.
            </p>
          )}
          {available.map((id) => {
            const Icon = WIDGET_REGISTRY[id].icon;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onAdd(id)}
                className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50"
              >
                <Icon className="size-4 text-primary" />
                <span className="flex-1 text-sm font-medium">{WIDGET_LABELS[id]}</span>
                <Plus className="size-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
