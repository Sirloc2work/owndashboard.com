import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/views/Dashboard';
import { KanbanView } from '@/views/KanbanView';
import { TimeboxView } from '@/views/TimeboxView';
import { CalendarView } from '@/views/CalendarView';
import { RoadmapView } from '@/views/RoadmapView';
import { AdminView } from '@/views/AdminView';
import { LoginView } from '@/views/LoginView';
import { Toaster } from '@/components/ui/sonner';
import { useSession } from '@/store/useSession';
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

  const isAdminView = activeView === 'admin';
  const canRenderView = !isAdminView && enabledViews.includes(activeView as ViewId);
  const ActiveView = canRenderView ? VIEWS[activeView as ViewId] : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        enabledViews={enabledViews}
        isAdmin={isAdmin}
        isGuest={isGuest}
        email={profile.email}
        onSignOut={onSignOut}
      />
      <main className="ml-56 h-screen overflow-y-auto p-6">
        {isAdminView && isAdmin ? (
          <AdminView />
        ) : ActiveView ? (
          <ActiveView onNavigate={setActiveView} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No tienes vistas habilitadas. Contacta al administrador.
          </div>
        )}
      </main>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
