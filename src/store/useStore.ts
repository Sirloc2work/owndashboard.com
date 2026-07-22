import { create } from 'zustand';
import type {
  ImportantDate,
  LifeOSData,
  RoadmapPhase,
  ScheduleEntry,
  Tag,
  Task,
} from '@/types';
import { HOURS, getPaletteEntry } from '@/lib/constants';
import { getWeekKey } from '@/lib/date';

function makeTag(id: string, name: string, colorKey: string): Tag {
  const palette = getPaletteEntry(colorKey);
  return {
    id,
    name,
    color: palette.key,
    bgClass: palette.bgClass,
    textClass: palette.textClass,
    borderClass: palette.borderClass,
  };
}

/** Estado base vacío (cuenta recién hidratada / logout). No incluye seed de contenido. */
export function createEmptyData(): LifeOSData {
  return {
    tags: [],
    tasks: [],
    hours: [...HOURS],
    weekSchedules: { [getWeekKey(new Date())]: {} },
    roadmapPhases: [],
    importantDates: [],
  };
}

interface LifeOSState extends LifeOSData {
  /** Semana visible en el Horario. Estado de sesión, no se persiste ni sincroniza. */
  scheduleWeekKey: string;

  addTag: (name: string, colorKey: string) => void;
  updateTag: (id: string, updates: { name?: string; colorKey?: string }) => void;
  deleteTag: (id: string) => void;

  addTask: (data: {
    title: string;
    description?: string;
    columnId: string;
    tagIds: string[];
  }) => void;
  updateTask: (
    id: string,
    updates: Partial<Pick<Task, 'title' | 'description' | 'columnId' | 'tagIds'>>
  ) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, toColumnId: string, overTaskId: string | null) => void;

  setScheduleWeekKey: (weekKey: string) => void;
  setScheduleEntry: (weekKey: string, day: string, hour: string, entry: ScheduleEntry) => void;
  clearScheduleEntry: (weekKey: string, day: string, hour: string) => void;
  copyWeek: (fromWeekKey: string, toWeekKey: string) => void;
  addHour: (hour: string) => void;
  removeHour: (hour: string) => void;

  updatePhase: (
    id: string,
    updates: Partial<Omit<RoadmapPhase, 'id' | 'phaseNumber'>>
  ) => void;

  addImportantDate: (data: Omit<ImportantDate, 'id'>) => void;
  updateImportantDate: (id: string, updates: Partial<Omit<ImportantDate, 'id'>>) => void;
  deleteImportantDate: (id: string) => void;

  /** Reemplaza los 6 slices de datos (hidratación desde BD / demo / reset). */
  hydrate: (data: LifeOSData) => void;
}

const initial = createEmptyData();

export const useStore = create<LifeOSState>()((set) => ({
  ...initial,
  scheduleWeekKey: getWeekKey(new Date()),

  addTag: (name, colorKey) =>
    set((state) => ({
      tags: [...state.tags, makeTag(crypto.randomUUID(), name, colorKey)],
    })),

  updateTag: (id, updates) =>
    set((state) => ({
      tags: state.tags.map((tag) => {
        if (tag.id !== id) return tag;
        const next = { ...tag, name: updates.name ?? tag.name };
        if (updates.colorKey) {
          const palette = getPaletteEntry(updates.colorKey);
          next.color = palette.key;
          next.bgClass = palette.bgClass;
          next.textClass = palette.textClass;
          next.borderClass = palette.borderClass;
        }
        return next;
      }),
    })),

  deleteTag: (id) =>
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id),
      tasks: state.tasks.map((task) =>
        task.tagIds.includes(id)
          ? { ...task, tagIds: task.tagIds.filter((tid) => tid !== id) }
          : task
      ),
    })),

  addTask: (data) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          id: crypto.randomUUID(),
          title: data.title,
          description: data.description,
          columnId: data.columnId,
          tagIds: data.tagIds,
          updatedAt: Date.now(),
        },
      ],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates, updatedAt: Date.now() } : task
      ),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),

  moveTask: (taskId, toColumnId, overTaskId) =>
    set((state) => {
      const tasks = [...state.tasks];
      const fromIdx = tasks.findIndex((t) => t.id === taskId);
      if (fromIdx === -1) return state;
      const originalOverIdx = overTaskId
        ? tasks.findIndex((t) => t.id === overTaskId)
        : -1;
      const task = tasks[fromIdx];
      const columnChanged = task.columnId !== toColumnId;
      const moved: Task = {
        ...task,
        columnId: toColumnId,
        updatedAt: columnChanged ? Date.now() : task.updatedAt,
      };
      tasks.splice(fromIdx, 1);

      let insertIdx: number;
      if (originalOverIdx !== -1) {
        const postOverIdx = tasks.findIndex((t) => t.id === overTaskId);
        // Arrastrando hacia abajo se inserta después del elemento destino,
        // hacia arriba se inserta antes (semántica de arrayMove).
        insertIdx = fromIdx < originalOverIdx ? postOverIdx + 1 : postOverIdx;
      } else {
        let lastOfColumn = -1;
        tasks.forEach((t, i) => {
          if (t.columnId === toColumnId) lastOfColumn = i;
        });
        insertIdx = lastOfColumn + 1;
      }
      tasks.splice(insertIdx, 0, moved);
      return { tasks };
    }),

  setScheduleWeekKey: (weekKey) => set({ scheduleWeekKey: weekKey }),

  setScheduleEntry: (weekKey, day, hour, entry) =>
    set((state) => {
      const week = { ...(state.weekSchedules[weekKey] ?? {}) };
      week[`${day}|${hour}`] = entry;
      return { weekSchedules: { ...state.weekSchedules, [weekKey]: week } };
    }),

  clearScheduleEntry: (weekKey, day, hour) =>
    set((state) => {
      const week = { ...(state.weekSchedules[weekKey] ?? {}) };
      delete week[`${day}|${hour}`];
      return { weekSchedules: { ...state.weekSchedules, [weekKey]: week } };
    }),

  copyWeek: (fromWeekKey, toWeekKey) =>
    set((state) => {
      const src = state.weekSchedules[fromWeekKey];
      if (!src) return state;
      const clone: Record<string, ScheduleEntry> = {};
      for (const key in src) clone[key] = { ...src[key] };
      return { weekSchedules: { ...state.weekSchedules, [toWeekKey]: clone } };
    }),

  addHour: (hour) =>
    set((state) =>
      state.hours.includes(hour)
        ? state
        : { hours: [...state.hours, hour].sort() }
    ),

  removeHour: (hour) =>
    set((state) => ({ hours: state.hours.filter((h) => h !== hour) })),

  updatePhase: (id, updates) =>
    set((state) => ({
      roadmapPhases: state.roadmapPhases.map((phase) =>
        phase.id === id ? { ...phase, ...updates } : phase
      ),
    })),

  addImportantDate: (data) =>
    set((state) => ({
      importantDates: [...state.importantDates, { ...data, id: crypto.randomUUID() }],
    })),

  updateImportantDate: (id, updates) =>
    set((state) => ({
      importantDates: state.importantDates.map((event) =>
        event.id === id ? { ...event, ...updates } : event
      ),
    })),

  deleteImportantDate: (id) =>
    set((state) => ({
      importantDates: state.importantDates.filter((event) => event.id !== id),
    })),

  hydrate: (data) =>
    set({
      tags: data.tags,
      tasks: data.tasks,
      hours: data.hours,
      weekSchedules: data.weekSchedules,
      roadmapPhases: data.roadmapPhases,
      importantDates: data.importantDates,
      scheduleWeekKey: getWeekKey(new Date()),
    }),
}));

/** Snapshot de los 6 slices de datos para sincronizar con la BD. */
export function getLifeOSData(state: LifeOSState): LifeOSData {
  return {
    tags: state.tags,
    tasks: state.tasks,
    hours: state.hours,
    weekSchedules: state.weekSchedules,
    roadmapPhases: state.roadmapPhases,
    importantDates: state.importantDates,
  };
}
