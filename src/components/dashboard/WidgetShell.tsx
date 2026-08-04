import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Maximize2, Minimize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardWidget } from '@/types';

interface WidgetShellProps {
  widget: DashboardWidget;
  editing: boolean;
  onRemove: () => void;
  onToggleSize: () => void;
  children: React.ReactNode;
}

export function WidgetShell({ widget, editing, onRemove, onToggleSize, children }: WidgetShellProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !editing,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative',
        widget.size === 'wide' && 'md:col-span-2',
        isDragging && 'z-10 opacity-60'
      )}
    >
      {editing && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-0.5 rounded-md bg-background/80 p-0.5 ring-1 ring-border backdrop-blur">
          <button
            type="button"
            onClick={onToggleSize}
            title={widget.size === 'wide' ? 'Hacer pequeño' : 'Hacer ancho'}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
          >
            {widget.size === 'wide' ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Quitar widget"
            className="rounded p-1 text-muted-foreground hover:text-red-400"
          >
            <X className="size-3.5" />
          </button>
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="Arrastrar para reordenar"
            className="cursor-grab rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="size-3.5" />
          </button>
        </div>
      )}
      <div className={cn(editing && 'pointer-events-none select-none')}>{children}</div>
    </div>
  );
}
