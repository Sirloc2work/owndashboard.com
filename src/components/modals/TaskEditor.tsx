import { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { COLUMNS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface TaskEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tarea a editar; null para crear una nueva. */
  task: Task | null;
  /** Columna por defecto al crear. */
  defaultColumnId?: string;
}

export function TaskEditor({ open, onOpenChange, task, defaultColumnId }: TaskEditorProps) {
  const tags = useStore((s) => s.tags);
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(defaultColumnId ?? 'todo');
  const [tagIds, setTagIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '');
      setDescription(task?.description ?? '');
      setColumnId(task?.columnId ?? defaultColumnId ?? 'todo');
      setTagIds(task?.tagIds ?? []);
    }
  }, [open, task, defaultColumnId]);

  const toggleTag = (tagId: string) => {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error('El título no puede estar vacío');
      return;
    }
    if (task) {
      updateTask(task.id, { title: trimmed, description, columnId, tagIds });
      toast.success('Tarea actualizada');
    } else {
      addTask({ title: trimmed, description, columnId, tagIds });
      toast.success('Tarea creada');
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!task) return;
    deleteTask(task.id);
    toast.success('Tarea eliminada');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
          <DialogDescription>
            {task ? 'Modifica los detalles de la tarea.' : 'Crea una nueva tarea en el tablero.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Título</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué hay que hacer?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Descripción</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles opcionales…"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Columna</Label>
            <Select value={columnId} onValueChange={setColumnId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLUMNS.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const selected = tagIds.includes(tag.id);
                return (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}>
                    <Badge
                      variant="outline"
                      className={cn(
                        'cursor-pointer transition-opacity',
                        tag.bgClass,
                        tag.textClass,
                        tag.borderClass,
                        selected ? 'opacity-100 ring-1 ring-white/40' : 'opacity-40 hover:opacity-70'
                      )}
                    >
                      {tag.name}
                    </Badge>
                  </button>
                );
              })}
              {tags.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay etiquetas. Créalas desde el Gestor de Etiquetas.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {task ? (
            <Button variant="ghost" className="text-red-400 hover:text-red-300" onClick={handleDelete}>
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
