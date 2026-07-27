import {
  CalendarClock,
  CalendarDays,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Map,
  PanelLeftClose,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { NavId, ViewId } from '@/types';

interface SidebarProps {
  activeView: NavId;
  onNavigate: (view: NavId) => void;
  enabledViews: ViewId[];
  isAdmin: boolean;
  isGuest: boolean;
  email: string;
  onSignOut: () => void;
  /** Drawer visible u oculto. */
  open: boolean;
  /** Cerrar/ocultar el panel. */
  onClose: () => void;
}

const NAV_ITEMS: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
  { id: 'timebox', label: 'Horario', icon: CalendarClock },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  { id: 'roadmap', label: 'Roadmap', icon: Map },
];

export function Sidebar({
  activeView,
  onNavigate,
  enabledViews,
  isAdmin,
  isGuest,
  email,
  onSignOut,
  open,
  onClose,
}: SidebarProps) {
  const items = NAV_ITEMS.filter((item) => enabledViews.includes(item.id));

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-border bg-sidebar transition-transform duration-200',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex items-center gap-2 px-5 py-5">
        <Zap className="size-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">LifeOS</span>
        {isGuest && (
          <Badge variant="secondary" className="text-[10px]">
            Invitado
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-7 text-muted-foreground"
          onClick={onClose}
          title="Ocultar panel"
        >
          <PanelLeftClose className="size-4" />
        </Button>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {items.map((item) => {
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

        {isAdmin && (
          <button
            onClick={() => onNavigate('admin')}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              activeView === 'admin'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
            )}
          >
            <ShieldCheck className="size-4" />
            Administración
          </button>
        )}
      </nav>

      <div className="mt-auto flex flex-col gap-2 px-3 py-4">
        <p className="truncate px-2 text-xs text-muted-foreground" title={email}>
          {email}
        </p>
        <Button variant="ghost" size="sm" className="justify-start" onClick={onSignOut}>
          <LogOut className="size-4" />
          {isGuest ? 'Salir del demo' : 'Cerrar sesión'}
        </Button>
      </div>
    </aside>
  );
}
