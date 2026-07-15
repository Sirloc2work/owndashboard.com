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

/** Contenido de una celda del horario (un día + hora dentro de una semana). */
export interface ScheduleEntry {
  activity: string;
  /** Clave de COLOR_PALETTE. */
  category: string;
  place?: string;
  description?: string;
}

/** Mapa de celdas de una semana, indexado por `${day}|${hour}`. */
export type WeekCells = Record<string, ScheduleEntry>;

/** Horarios por semana, indexados por clave de semana (Lunes 'yyyy-MM-dd'). */
export type WeekSchedules = Record<string, WeekCells>;

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

export interface ImportantDate {
  id: string;
  /** Fecha en formato 'yyyy-MM-dd'. */
  date: string;
  title: string;
  description?: string;
  /** Clave de COLOR_PALETTE. */
  category: string;
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

export type ViewId = 'dashboard' | 'kanban' | 'timebox' | 'calendar' | 'roadmap';
