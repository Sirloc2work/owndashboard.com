import { createContext, useContext } from 'react';
import type { ViewId } from '@/types';

interface DashboardCtxValue {
  onNavigate: (view: ViewId) => void;
  onOpenDay: (date: string) => void;
}

export const DashboardContext = createContext<DashboardCtxValue>({
  onNavigate: () => {},
  onOpenDay: () => {},
});

export const useDashboardCtx = () => useContext(DashboardContext);
