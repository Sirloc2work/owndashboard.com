import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/store/useStore';
import type { FocusArea, RoadmapPhase } from '@/types';

interface RoadmapPhaseEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phase: RoadmapPhase | null;
}

export function RoadmapPhaseEditor({ open, onOpenChange, phase }: RoadmapPhaseEditorProps) {
  const updatePhase = useStore((s) => s.updatePhase);

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);

  useEffect(() => {
    if (open && phase) {
      setTitle(phase.title);
      setDuration(phase.duration);
      setDescription(phase.description);
      setFocusAreas(phase.focusAreas.map((fa) => ({ ...fa })));
    }
  }, [open, phase]);

  const updateFocusArea = (index: number, updates: Partial<FocusArea>) => {
    setFocusAreas((prev) =>
      prev.map((fa, i) => (i === index ? { ...fa, ...updates } : fa))
    );
  };

  const handleSave = () => {
    if (!phase) return;
    const trimmed = title.trim();
    if (!trimmed) {
      toast.error('El título de la fase no puede estar vacío');
      return;
    }
    updatePhase(phase.id, {
      title: trimmed,
      duration,
      description,
      focusAreas: focusAreas.filter((fa) => fa.title.trim() || fa.detail.trim()),
    });
    toast.success(`Fase ${phase.phaseNumber} actualizada`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Fase {phase?.phaseNumber}</DialogTitle>
          <DialogDescription>
            Ajusta tu estrategia: título, duración, descripción y enfoques.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phase-title">Título</Label>
            <Input id="phase-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phase-duration">Duración</Label>
            <Input
              id="phase-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="p. ej. Días 1-90"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phase-description">Descripción</Label>
            <Textarea
              id="phase-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Áreas de enfoque</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFocusAreas((prev) => [...prev, { title: '', detail: '' }])}
              >
                <Plus className="size-4" />
                Agregar
              </Button>
            </div>
            {focusAreas.map((fa, index) => (
              <div key={index} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={fa.title}
                    onChange={(e) => updateFocusArea(index, { title: e.target.value })}
                    placeholder="Título del enfoque"
                    className="h-8"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-red-400"
                    onClick={() => setFocusAreas((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Textarea
                  value={fa.detail}
                  onChange={(e) => updateFocusArea(index, { detail: e.target.value })}
                  placeholder="Detalle…"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
