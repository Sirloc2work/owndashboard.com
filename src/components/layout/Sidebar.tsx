import {
  CalendarClock,
  CalendarDays,
  KanbanSquare,
  LayoutDashboard,
  Map,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewId } from '@/types';

interface SidebarProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
}

const NAV_ITEMS: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
  { id: 'timebox', label: 'Horario', icon: CalendarClock },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  { id: 'roadmap', label: 'Roadmap', icon: Map },
];

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 py-5">
        <Zap className="size-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">LifeOS</span>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto px-5 py-4 text-xs text-muted-foreground">
        Timeboxing · Kanban · Roadmap
      </div>
    </aside>
  );
}
