import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/views/Dashboard';
import { KanbanView } from '@/views/KanbanView';
import { TimeboxView } from '@/views/TimeboxView';
import { CalendarView } from '@/views/CalendarView';
import { RoadmapView } from '@/views/RoadmapView';
import { Toaster } from '@/components/ui/sonner';
import type { ViewId } from '@/types';

export interface ViewProps {
  onNavigate: (view: ViewId) => void;
}

const VIEWS: Record<ViewId, React.ComponentType<ViewProps>> = {
  dashboard: Dashboard,
  kanban: KanbanView,
  timebox: TimeboxView,
  calendar: CalendarView,
  roadmap: RoadmapView,
};

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const ActiveView = VIEWS[activeView];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="ml-56 h-screen overflow-y-auto p-6">
        <ActiveView onNavigate={setActiveView} />
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
