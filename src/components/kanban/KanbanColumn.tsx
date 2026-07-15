import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/kanban/TaskCard';
import { cn } from '@/lib/utils';
import type { Column, Task } from '@/types';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
}

export function KanbanColumn({ column, tasks, onTaskClick, onAddTask }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id, data: { type: 'column' } });

  const wipExceeded = column.wipLimit !== undefined && tasks.length > column.wipLimit;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full min-h-0 w-72 shrink-0 flex-col rounded-xl border bg-card/40 transition-colors',
        wipExceeded
          ? 'border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.35)]'
          : 'border-border/70'
      )}
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{column.title}</h3>
          <Badge
            variant="secondary"
            className={cn('text-xs', wipExceeded && 'bg-red-500/20 text-red-400')}
          >
            {tasks.length}
            {column.wipLimit !== undefined && ` / ${column.wipLimit}`}
          </Badge>
        </div>
      </div>

      {wipExceeded && (
        <p className="px-3 pb-1 text-xs font-medium text-red-400">
          ⚠ Límite WIP superado — termina antes de empezar algo nuevo
        </p>
      )}

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      </SortableContext>

      <div className="p-3 pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={onAddTask}
        >
          <Plus className="size-4" />
          Nueva Tarea
        </Button>
      </div>
    </div>
  );
}
