import { useEffect, useState } from 'react';
import { Loader2, PanelLeft } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/views/Dashboard';
import { KanbanView } from '@/views/KanbanView';
import { TimeboxView } from '@/views/TimeboxView';
import { CalendarView } from '@/views/CalendarView';
import { RoadmapView } from '@/views/RoadmapView';
import { AdminView } from '@/views/AdminView';
import { LoginView } from '@/views/LoginView';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { useSession } from '@/store/useSession';
import { VIEW_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { NavId, Profile, ViewId } from '@/types';

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
  const mode = useSession((s) => s.mode);
  const profile = useSession((s) => s.profile);
  const init = useSession((s) => s.init);
  const signOut = useSession((s) => s.signOut);

  useEffect(() => {
    init();
  }, [init]);

  if (mode === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (mode === 'login' || !profile) {
    return (
      <>
        <LoginView />
        <Toaster position="bottom-right" richColors />
      </>
    );
  }

  return (
    <AppShell profile={profile} isGuest={mode === 'guest'} onSignOut={() => void signOut()} />
  );
}

function AppShell({
  profile,
  isGuest,
  onSignOut,
}: {
  profile: Profile;
  isGuest: boolean;
  onSignOut: () => void;
}) {
  const isAdmin = profile.role === 'admin';
  const enabledViews = profile.enabledViews;
  const [activeView, setActiveView] = useState<NavId>(enabledViews[0] ?? (isAdmin ? 'admin' : 'dashboard'));
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  );

  const isAdminView = activeView === 'admin';
  const canRenderView = !isAdminView && enabledViews.includes(activeView as ViewId);
  const ActiveView = canRenderView ? VIEWS[activeView as ViewId] : null;
  const title = isAdminView ? 'Administración' : VIEW_LABELS[activeView as ViewId] ?? 'LifeOS';

  const handleNavigate = (view: NavId) => {
    setActiveView(view);
    // En móvil, navegar cierra el drawer.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        enabledViews={enabledViews}
        isAdmin={isAdmin}
        isGuest={isGuest}
        email={profile.email}
        onSignOut={onSignOut}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={cn(
          'flex h-screen flex-col transition-[margin] duration-200',
          sidebarOpen && 'md:ml-56'
        )}
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 py-2 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? 'Ocultar panel' : 'Mostrar panel'}
          >
            <PanelLeft className="size-5" />
          </Button>
          <span className="text-sm font-semibold">{title}</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isAdminView && isAdmin ? (
            <AdminView />
          ) : ActiveView ? (
            <ActiveView onNavigate={setActiveView} />
          ) : (
            <div className="flex h-full items-center justify-center py-16 text-sm text-muted-foreground">
              No tienes vistas habilitadas. Contacta al administrador.
            </div>
          )}
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
