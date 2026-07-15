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
import { cn } from '@/lib/utils';
import type { TimeBlock } from '@/types';

interface TimeBlockEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: TimeBlock | null;
}

export function TimeBlockEditor({ open, onOpenChange, block }: TimeBlockEditorProps) {
  const updateTimeBlock = useStore((s) => s.updateTimeBlock);

  const [activity, setActivity] = useState('');
  const [category, setCategory] = useState('gray');

  useEffect(() => {
    if (open && block) {
      setActivity(block.activity);
      setCategory(block.category);
    }
  }, [open, block]);

  const handleSave = () => {
    if (!block) return;
    updateTimeBlock(block.id, activity.trim() || 'Libre', category);
    toast.success(`Bloque de ${block.day} ${block.hour} actualizado`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Editar Bloque — {block?.day} {block?.hour}
          </DialogTitle>
          <DialogDescription>Cambia la actividad o su categoría de color.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="block-activity">Actividad</Label>
            <Input
              id="block-activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="p. ej. Estudio de IA — Deep Work"
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
