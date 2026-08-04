import { create } from 'zustand';
import type {
  CompletionEvent,
  DashboardWidget,
  ImportantDate,
  LifeOSData,
  Priority,
  RoadmapPhase,
  ScheduleEntry,
  Tag,
  Task,
} from '@/types';
import { DEFAULT_WIDGETS, HOURS, getPaletteEntry } from '@/lib/constants';
import { getWeekKey } from '@/lib/date';

const DONE_COLUMN_ID = 'done';

/** Ajusta el historial de completadas cuando una tarea entra o sale de 'done'. */
function completionsAfterMove(
  completions: CompletionEvent[],
  fromColumnId: string,
  toColumnId: string,
  t: Task
): CompletionEvent[] {
  const wasDone = fromColumnId === DONE_COLUMN_ID;
  const willDone = toColumnId === DONE_COLUMN_ID;
  if (!wasDone && willDone) {
    return [
      ...completions,
      {
        id: crypto.randomUUID(),
        taskId: t.id,
        completedAt: Date.now(),
        urgency: t.urgency ?? 'media',
        importance: t.importance ?? 'media',
        tagIds: [...t.tagIds],
        title: t.title,
      },
    ];
  }
  if (wasDone && !willDone) {
    // Quitar el evento más reciente de esa tarea (deshacer el completado).
    for (let i = completions.length - 1; i >= 0; i--) {
      if (completions[i].taskId === t.id) {
        return completions.filter((_, idx) => idx !== i);
      }
    }
  }
  return completions;
}

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
    completions: [],
    dashboardWidgets: [...DEFAULT_WIDGETS],
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
    urgency?: Priority;
    importance?: Priority;
  }) => void;
  updateTask: (
    id: string,
    updates: Partial<
      Pick<Task, 'title' | 'description' | 'columnId' | 'tagIds' | 'urgency' | 'importance'>
    >
  ) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, toColumnId: string, overTaskId: string | null) => void;

  setScheduleWeekKey: (weekKey: string) => void;
  setScheduleEntry: (weekKey: string, day: string, hour: string, entry: ScheduleEntry) => void;
  clearScheduleEntry: (weekKey: string, day: string, hour: string) => void;
  /** Rellena la misma actividad en varias semanas × días × franjas de una vez. */
  addActivityBlock: (params: {
    weekKeys: string[];
    days: string[];
    hours: string[];
    entry: ScheduleEntry;
  }) => void;
  copyWeek: (fromWeekKey: string, toWeekKey: string) => void;
  addHour: (hour: string) => void;
  removeHour: (hour: string) => void;

  updatePhase: (
    id: string,
    updates: Partial<Omit<RoadmapPhase, 'id' | 'phaseNumber'>>
  ) => void;

  addImportantDate: (data: Omit<ImportantDate, 'id'>) => void;
  /** Inserta varias fechas importantes de una vez (repetición de eventos). */
  addImportantDates: (events: Omit<ImportantDate, 'id'>[]) => void;
  updateImportantDate: (id: string, updates: Partial<Omit<ImportantDate, 'id'>>) => void;
  deleteImportantDate: (id: string) => void;

  /** Reemplaza el layout de widgets del dashboard (añadir/quitar/ordenar/tamaño). */
  setDashboardWidgets: (list: DashboardWidget[]) => void;

  /** Reemplaza los slices de datos (hidratación desde BD / demo / reset). */
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
          urgency: data.urgency ?? 'media',
          importance: data.importance ?? 'media',
          updatedAt: Date.now(),
        },
      ],
    })),

  updateTask: (id, updates) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === id);
      if (!task) return state;
      const columnChanged =
        updates.columnId !== undefined && updates.columnId !== task.columnId;
      const merged = { ...task, ...updates };
      const completions = columnChanged
        ? completionsAfterMove(state.completions, task.columnId, updates.columnId!, merged)
        : state.completions;
      return {
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...merged, updatedAt: Date.now() } : t
        ),
        completions,
      };
    }),

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
      const completions = columnChanged
        ? completionsAfterMove(state.completions, task.columnId, toColumnId, task)
        : state.completions;
      return { tasks, completions };
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

  addActivityBlock: ({ weekKeys, days, hours, entry }) =>
    set((state) => {
      const weekSchedules = { ...state.weekSchedules };
      for (const wk of weekKeys) {
        const week = { ...(weekSchedules[wk] ?? {}) };
        for (const day of days) {
          for (const hour of hours) {
            week[`${day}|${hour}`] = { ...entry };
          }
        }
        weekSchedules[wk] = week;
      }
      return { weekSchedules };
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

  addImportantDates: (events) =>
    set((state) => ({
      importantDates: [
        ...state.importantDates,
        ...events.map((e) => ({ ...e, id: crypto.randomUUID() })),
      ],
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

  setDashboardWidgets: (list) => set({ dashboardWidgets: list }),

  hydrate: (data) =>
    set({
      tags: data.tags,
      tasks: data.tasks,
      hours: data.hours,
      weekSchedules: data.weekSchedules,
      roadmapPhases: data.roadmapPhases,
      importantDates: data.importantDates,
      // Retrocompatible: datos antiguos sin estas slices toman valores por defecto.
      completions: data.completions ?? [],
      dashboardWidgets: data.dashboardWidgets?.length
        ? data.dashboardWidgets
        : [...DEFAULT_WIDGETS],
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
    completions: state.completions,
    dashboardWidgets: state.dashboardWidgets,
  };
}
