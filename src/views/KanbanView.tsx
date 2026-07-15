import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { TaskCardContent } from '@/components/kanban/TaskCard';
import { TaskEditor } from '@/components/modals/TaskEditor';
import { TagManager } from '@/components/modals/TagManager';
import { useStore } from '@/store/useStore';
import { COLUMNS } from '@/lib/constants';
import type { Task } from '@/types';

export function KanbanView() {
  const tasks = useStore((s) => s.tasks);
  const moveTask = useStore((s) => s.moveTask);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState('todo');
  const [tagManagerOpen, setTagManagerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const findTask = (id: string) => tasks.find((t) => t.id === id);

  const resolveOverColumn = (overId: string): string | null => {
    const overTask = findTask(overId);
    if (overTask) return overTask.columnId;
    return COLUMNS.some((c) => c.id === overId) ? overId : null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(findTask(String(event.active.id)) ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const task = findTask(activeId);
    if (!task) return;
    const overColumnId = resolveOverColumn(overId);
    if (!overColumnId || task.columnId === overColumnId) return;

    const overTask = findTask(overId);
    moveTask(activeId, overColumnId, overTask ? overId : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const task = findTask(activeId);
    const overTask = findTask(overId);
    if (task && overTask && task.columnId === overTask.columnId) {
      moveTask(activeId, task.columnId, overId);
    }
  };

  const openCreate = (columnId: string) => {
    setEditingTask(null);
    setDefaultColumnId(columnId);
    setEditorOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setEditorOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tablero Kanban</h1>
          <p className="text-sm text-muted-foreground">
            Arrastra las tarjetas entre columnas. Máximo 3 tareas en progreso.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setTagManagerOpen(true)}>
          <Settings2 className="size-4" />
          Etiquetas
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTask(null)}
      >
        <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-2">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasks.filter((t) => t.columnId === column.id)}
              onTaskClick={openEdit}
              onAddTask={() => openCreate(column.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <TaskCardContent
              task={activeTask}
              className="rotate-2 opacity-80 shadow-2xl shadow-black/50"
            />
          )}
        </DragOverlay>
      </DndContext>

      <TaskEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        task={editingTask}
        defaultColumnId={defaultColumnId}
      />
      <TagManager open={tagManagerOpen} onOpenChange={setTagManagerOpen} />
    </div>
  );
}
