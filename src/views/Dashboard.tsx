import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { Check, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DayDetailDialog } from '@/components/modals/DayDetailDialog';
import { useStore } from '@/store/useStore';
import { WIDGET_REGISTRY } from '@/components/dashboard/registry';
import { WidgetShell } from '@/components/dashboard/WidgetShell';
import { WidgetGallery } from '@/components/dashboard/WidgetGallery';
import { DashboardContext } from '@/components/dashboard/DashboardContext';
import { getWeekKey, parseLocalDate } from '@/lib/date';
import type { ViewId, WidgetId } from '@/types';

export function Dashboard({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const widgets = useStore((s) => s.dashboardWidgets);
  const setWidgets = useStore((s) => s.setDashboardWidgets);
  const setScheduleWeekKey = useStore((s) => s.setScheduleWeekKey);

  const [editing, setEditing] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onOpenDay = (date: string) => {
    setSelectedDate(date);
    setDayOpen(true);
  };
  const goToScheduleWeek = (date: string) => {
    setScheduleWeekKey(getWeekKey(parseLocalDate(date)));
    onNavigate('timebox');
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = widgets.findIndex((w) => w.id === String(active.id));
    const to = widgets.findIndex((w) => w.id === String(over.id));
    if (from < 0 || to < 0) return;
    setWidgets(arrayMove(widgets, from, to));
  };

  const removeWidget = (id: WidgetId) => setWidgets(widgets.filter((w) => w.id !== id));
  const toggleSize = (id: WidgetId) =>
    setWidgets(
      widgets.map((w) => (w.id === id ? { ...w, size: w.size === 'wide' ? 'sm' : 'wide' } : w))
    );
  const addWidget = (id: WidgetId) => {
    setWidgets([...widgets, { id, size: 'sm' }]);
    setGalleryOpen(false);
  };

  const present = new Set(widgets.map((w) => w.id));
  const available = (Object.keys(WIDGET_REGISTRY) as WidgetId[]).filter((id) => !present.has(id));

  return (
    <DashboardContext.Provider value={{ onNavigate, onOpenDay }}>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Tu centro de control diario.</p>
          </div>
          <div className="flex gap-2">
            {editing && (
              <Button variant="outline" size="sm" onClick={() => setGalleryOpen(true)}>
                <Plus className="size-4" />
                Añadir
              </Button>
            )}
            <Button
              variant={editing ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? <Check className="size-4" /> : <Pencil className="size-4" />}
              {editing ? 'Listo' : 'Editar'}
            </Button>
          </div>
        </div>

        {editing && (
          <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            Arrastra el asa para reordenar · usa los controles de cada widget para redimensionar o
            quitar · <strong>Añadir</strong> abre el catálogo.
          </p>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              {widgets.map((w) => {
                const def = WIDGET_REGISTRY[w.id];
                if (!def) return null;
                const Comp = def.Component;
                return (
                  <WidgetShell
                    key={w.id}
                    widget={w}
                    editing={editing}
                    onRemove={() => removeWidget(w.id)}
                    onToggleSize={() => toggleSize(w.id)}
                  >
                    <Comp />
                  </WidgetShell>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {widgets.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No hay widgets. Pulsa <strong>Editar → Añadir</strong> para agregar.
          </p>
        )}
      </div>

      <WidgetGallery
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        available={available}
        onAdd={addWidget}
      />
      <DayDetailDialog
        open={dayOpen}
        onOpenChange={setDayOpen}
        date={selectedDate}
        onGoToSchedule={goToScheduleWeek}
      />
    </DashboardContext.Provider>
  );
}
