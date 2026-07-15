import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TimeBlockEditor } from '@/components/modals/TimeBlockEditor';
import { useStore } from '@/store/useStore';
import { DAYS, HOURS, getPaletteEntry } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { TimeBlock } from '@/types';

export function TimeboxView() {
  const timeBlocks = useStore((s) => s.timeBlocks);
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const blockMap = new Map(timeBlocks.map((b) => [`${b.day}|${b.hour}`, b]));

  const openEditor = (block: TimeBlock) => {
    setEditingBlock(block);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Horario Semanal</h1>
        <p className="text-sm text-muted-foreground">
          Timeboxing de 06:00 a 21:00. Haz clic en cualquier celda para editarla.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/70">
        <Table>
          <TableHeader>
            <TableRow className="bg-card/60 hover:bg-card/60">
              <TableHead className="w-16 text-center font-semibold">Hora</TableHead>
              {DAYS.map((day) => (
                <TableHead key={day} className="min-w-28 text-center font-semibold">
                  {day}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {HOURS.map((hour) => (
              <TableRow key={hour} className="hover:bg-transparent">
                <TableCell className="text-center text-xs font-medium text-muted-foreground tabular-nums">
                  {hour}
                </TableCell>
                {DAYS.map((day) => {
                  const block = blockMap.get(`${day}|${hour}`);
                  if (!block) return <TableCell key={day} />;
                  const palette = getPaletteEntry(block.category);
                  const isFree = block.activity === 'Libre';
                  return (
                    <TableCell key={day} className="p-1">
                      <button
                        type="button"
                        onClick={() => openEditor(block)}
                        className={cn(
                          'w-full rounded-md border px-2 py-1.5 text-left text-xs leading-tight transition-transform hover:scale-[1.03] hover:brightness-125',
                          isFree
                            ? 'border-transparent text-muted-foreground/40 hover:border-border'
                            : palette.cellClass
                        )}
                      >
                        {block.activity}
                      </button>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TimeBlockEditor open={editorOpen} onOpenChange={setEditorOpen} block={editingBlock} />
    </div>
  );
}
