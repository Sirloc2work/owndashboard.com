import { useState } from 'react';
import { Pencil } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RoadmapPhaseEditor } from '@/components/modals/RoadmapPhaseEditor';
import { useStore } from '@/store/useStore';
import type { RoadmapPhase } from '@/types';

export function RoadmapView() {
  const roadmapPhases = useStore((s) => s.roadmapPhases);
  const [editingPhase, setEditingPhase] = useState<RoadmapPhase | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const openEditor = (phase: RoadmapPhase) => {
    setEditingPhase(phase);
    setEditorOpen(true);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plan Estratégico</h1>
        <p className="text-sm text-muted-foreground">
          Roadmap a 9 meses en tres fases. Edita títulos y enfoques cuando tu estrategia
          evolucione.
        </p>
      </div>

      <Accordion type="single" collapsible defaultValue={roadmapPhases[0]?.id}>
        {roadmapPhases.map((phase) => (
          <AccordionItem key={phase.id} value={phase.id}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {phase.phaseNumber}
                </span>
                <div>
                  <p className="font-semibold">{phase.title}</p>
                  <Badge variant="secondary" className="mt-0.5 text-xs">
                    {phase.duration}
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pl-11">
                <p className="text-sm text-muted-foreground">{phase.description}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {phase.focusAreas.map((fa, i) => (
                    <Card key={i} className="gap-0 border-border/60 py-3">
                      <CardContent className="px-3">
                        <p className="text-sm font-medium">{fa.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{fa.detail}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={() => openEditor(phase)}>
                  <Pencil className="size-3.5" />
                  Editar fase
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <RoadmapPhaseEditor open={editorOpen} onOpenChange={setEditorOpen} phase={editingPhase} />
    </div>
  );
}
