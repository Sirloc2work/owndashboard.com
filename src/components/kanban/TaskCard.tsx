import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { BLOCKED_ALERT_MS, BLOCKED_COLUMN_ID } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

export function isStaleBlocked(task: Task): boolean {
  return (
    task.columnId === BLOCKED_COLUMN_ID && Date.now() - task.updatedAt > BLOCKED_ALERT_MS
  );
}

/** Contenido presentacional de la tarjeta; reutilizado por el DragOverlay. */
export function TaskCardContent({ task, className }: { task: Task; className?: string }) {
  const tags = useStore((s) => s.tags);
  const taskTags = tags.filter((tag) => task.tagIds.includes(tag.id));
  const stale = isStaleBlocked(task);

  return (
    <Card className={cn('cursor-grab gap-0 border-border/80 py-3 select-none', className)}>
      <CardContent className="space-y-2 px-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm leading-snug font-medium">{task.title}</p>
          {stale && (
            <AlertTriangle
              className="size-4 shrink-0 animate-pulse text-red-500"
              aria-label="Bloqueada por más de 48 horas"
            />
          )}
        </div>
        {task.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
        )}
        {taskTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {taskTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className={cn('text-[10px]', tag.bgClass, tag.textClass, tag.borderClass)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: 'task', task } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <TaskCardContent task={task} className={cn(isDragging && 'opacity-30')} />
    </div>
  );
}
