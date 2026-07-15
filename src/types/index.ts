export interface Tag {
  id: string;
  name: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  columnId: string;
  tagIds: string[];
  updatedAt: number;
}

export interface TimeBlock {
  id: string;
  day: string;
  hour: string;
  activity: string;
  category: string;
}

export interface FocusArea {
  title: string;
  detail: string;
}

export interface RoadmapPhase {
  id: string;
  phaseNumber: number;
  title: string;
  duration: string;
  description: string;
  focusAreas: FocusArea[];
}

export interface Column {
  id: string;
  title: string;
  wipLimit?: number;
}

export type ColorKey =
  | 'red'
  | 'blue'
  | 'purple'
  | 'green'
  | 'yellow'
  | 'gray'
  | 'orange'
  | 'cyan'
  | 'pink';

export type ViewId = 'dashboard' | 'kanban' | 'timebox' | 'roadmap';
