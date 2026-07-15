import { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useStore } from '@/store/useStore';
import { COLOR_PALETTE } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TagManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLOR_PALETTE.map((color) => (
        <button
          key={color.key}
          type="button"
          title={color.label}
          onClick={() => onChange(color.key)}
          className={cn(
            'flex size-6 items-center justify-center rounded-full transition-transform hover:scale-110',
            color.swatchClass,
            value === color.key && 'ring-2 ring-white/80 ring-offset-2 ring-offset-background'
          )}
        >
          {value === color.key && <Check className="size-3.5 text-white" />}
        </button>
      ))}
    </div>
  );
}

export function TagManager({ open, onOpenChange }: TagManagerProps) {
  const tags = useStore((s) => s.tags);
  const addTag = useStore((s) => s.addTag);
  const updateTag = useStore((s) => s.updateTag);
  const deleteTag = useStore((s) => s.deleteTag);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('red');

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) {
      toast.error('El nombre de la etiqueta no puede estar vacío');
      return;
    }
    addTag(name, newColor);
    setNewName('');
    toast.success(`Etiqueta "${name}" creada`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gestor de Etiquetas</DialogTitle>
          <DialogDescription>
            Crea, edita o elimina las etiquetas de tu sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className={cn('space-y-2 rounded-lg border p-3', tag.borderClass, tag.bgClass)}
            >
              <div className="flex items-center gap-2">
                <Input
                  value={tag.name}
                  onChange={(e) => updateTag(tag.id, { name: e.target.value })}
                  className="h-8 bg-background/60"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-red-400"
                  onClick={() => {
                    deleteTag(tag.id);
                    toast.success(`Etiqueta "${tag.name}" eliminada`);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <ColorPicker
                value={tag.color}
                onChange={(key) => updateTag(tag.id, { colorKey: key })}
              />
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium">Nueva etiqueta</p>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nombre de la etiqueta…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="h-8"
            />
            <Button size="sm" onClick={handleCreate}>
              <Plus className="size-4" />
              Crear
            </Button>
          </div>
          <ColorPicker value={newColor} onChange={setNewColor} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
