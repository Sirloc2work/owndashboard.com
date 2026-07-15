import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ImportantDate,
  RoadmapPhase,
  ScheduleEntry,
  Tag,
  Task,
  WeekSchedules,
} from '@/types';
import { DAYS, HOURS, getPaletteEntry } from '@/lib/constants';
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

const seedTags: Tag[] = [
  makeTag('tag-ia', 'Estudio de IA', 'red'),
  makeTag('tag-astro-3c', 'Astro: 3 Cuerpos', 'blue'),
  makeTag('tag-astro-bin', 'Astro: Binarias', 'purple'),
  makeTag('tag-docencia', 'Docencia Base', 'green'),
  makeTag('tag-reemplazos', 'Docencia Reemplazos', 'yellow'),
  makeTag('tag-rutina', 'Rutina', 'gray'),
];

const now = Date.now();

const seedTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Diseñar arquitectura del pipeline RAG',
    description: 'Definir componentes, embeddings y estrategia de retrieval.',
    columnId: 'todo',
    tagIds: ['tag-ia'],
    updatedAt: now,
  },
  {
    id: 'task-2',
    title: 'Preparar clases de la semana',
    description: 'Planificación Waldorf: época actual y materiales.',
    columnId: 'todo',
    tagIds: ['tag-docencia'],
    updatedAt: now,
  },
  {
    id: 'task-3',
    title: 'Limpiar dataset de curvas de luz',
    columnId: 'todo',
    tagIds: ['tag-astro-bin'],
    updatedAt: now,
  },
  {
    id: 'task-4',
    title: 'Implementar prototipo del agente v0.1',
    description: 'MVP funcional con evaluación básica.',
    columnId: 'in-progress',
    tagIds: ['tag-ia'],
    updatedAt: now,
  },
  {
    id: 'task-5',
    title: 'Corregir evaluaciones de reemplazo',
    columnId: 'in-progress',
    tagIds: ['tag-reemplazos'],
    updatedAt: now,
  },
  {
    id: 'task-6',
    title: 'Revisión de ecuaciones del problema de 3 cuerpos',
    description: 'Esperando feedback del colaborador.',
    columnId: 'blocked',
    tagIds: ['tag-astro-3c'],
    updatedAt: now - 72 * 60 * 60 * 1000,
  },
  {
    id: 'task-7',
    title: 'Meal prep semanal',
    columnId: 'done',
    tagIds: ['tag-rutina'],
    updatedAt: now,
  },
  {
    id: 'task-8',
    title: 'Configurar entorno de simulaciones N-body',
    columnId: 'done',
    tagIds: ['tag-astro-bin'],
    updatedAt: now,
  },
];

// Esqueleto semanal: overrides sobre una grilla base "Libre".
const weekdaySchedule: Record<string, { activity: string; category: string }> = {
  '06:00': { activity: 'Rutina matinal', category: 'gray' },
  '07:00': { activity: 'Estudio de IA — Deep Work', category: 'red' },
  '08:00': { activity: 'Docencia — Clases', category: 'green' },
  '09:00': { activity: 'Docencia — Clases', category: 'green' },
  '10:00': { activity: 'Docencia — Clases', category: 'green' },
  '11:00': { activity: 'Docencia — Clases', category: 'green' },
  '12:00': { activity: 'Docencia — Clases', category: 'green' },
  '13:00': { activity: 'Almuerzo', category: 'gray' },
  '14:00': { activity: 'Planificación docente', category: 'green' },
  '15:00': { activity: 'Estudio de IA — Proyectos', category: 'red' },
  '16:00': { activity: 'Estudio de IA — Proyectos', category: 'red' },
  '17:00': { activity: 'Reemplazos / gestión académica', category: 'yellow' },
  '18:00': { activity: 'Astro — Investigación', category: 'blue' },
  '19:00': { activity: 'Cena y pausa', category: 'gray' },
  '20:00': { activity: 'Lectura / cierre del día', category: 'gray' },
  '21:00': { activity: 'Descanso', category: 'gray' },
};

const saturdaySchedule: Record<string, { activity: string; category: string }> = {
  '07:00': { activity: 'Rutina matinal', category: 'gray' },
  '08:00': { activity: 'Estudio de IA — Deep Work', category: 'red' },
  '09:00': { activity: 'Estudio de IA — Deep Work', category: 'red' },
  '10:00': { activity: 'Estudio de IA — Deep Work', category: 'red' },
  '11:00': { activity: 'Estudio de IA — Deep Work', category: 'red' },
  '13:00': { activity: 'Almuerzo', category: 'gray' },
  '15:00': { activity: 'Astro: Binarias — Simulaciones', category: 'purple' },
  '16:00': { activity: 'Astro: Binarias — Simulaciones', category: 'purple' },
  '17:00': { activity: 'Astro: Binarias — Análisis', category: 'purple' },
};

const sundaySchedule: Record<string, { activity: string; category: string }> = {
  '09:00': { activity: 'Meal Prep', category: 'gray' },
  '10:00': { activity: 'Doméstico y mantención', category: 'gray' },
  '13:00': { activity: 'Almuerzo', category: 'gray' },
  '16:00': { activity: 'Astro: 3 Cuerpos — Teoría', category: 'blue' },
  '17:00': { activity: 'Astro: 3 Cuerpos — Teoría', category: 'blue' },
  '18:00': { activity: 'Astro: 3 Cuerpos — Ecuaciones', category: 'blue' },
  '20:00': { activity: 'Planificación semanal', category: 'gray' },
};

/** Celdas sembradas para la semana actual (solo bloques con actividad definida). */
function buildSeedWeekCells(): Record<string, ScheduleEntry> {
  const cells: Record<string, ScheduleEntry> = {};
  for (const day of DAYS) {
    for (const hour of HOURS) {
      let override: { activity: string; category: string } | undefined;
      if (day === 'Sábado') override = saturdaySchedule[hour];
      else if (day === 'Domingo') override = sundaySchedule[hour];
      else override = weekdaySchedule[hour];
      if (override) {
        cells[`${day}|${hour}`] = { activity: override.activity, category: override.category };
      }
    }
  }
  return cells;
}

const CURRENT_WEEK_KEY = getWeekKey(new Date());

function buildSeedWeekSchedules(): WeekSchedules {
  return { [CURRENT_WEEK_KEY]: buildSeedWeekCells() };
}

const seedImportantDates: ImportantDate[] = [
  {
    id: 'idate-1',
    date: '2026-07-24',
    title: 'Entrega de notas — cierre de época',
    description: 'Cerrar evaluaciones del bloque Waldorf y entregar informes a coordinación.',
    category: 'green',
  },
  {
    id: 'idate-2',
    date: '2026-08-14',
    title: 'Deadline draft paper Binarias',
    description: 'Primer borrador completo del paper de binarias para revisión del colaborador.',
    category: 'purple',
  },
  {
    id: 'idate-3',
    date: '2026-09-18',
    title: 'Fiestas Patrias',
    description: 'Feriado — semana de descanso y recalibración.',
    category: 'gray',
  },
];

const seedRoadmap: RoadmapPhase[] = [
  {
    id: 'phase-1',
    phaseNumber: 1,
    title: 'Foco en Estudio de IA y Estabilidad Docente',
    duration: 'Días 1-90',
    description:
      'Establecer las bases: prototipado acelerado en el Estudio de IA mientras la docencia se ejecuta con estabilidad y Astro queda en modo mantenimiento.',
    focusAreas: [
      {
        title: 'Estudio de IA',
        detail: 'Prototipado y definición de arquitectura de modelos y agentes.',
      },
      {
        title: 'Docencia',
        detail: 'Ejecución docente Waldorf estable, sin sobrecarga de reemplazos.',
      },
      {
        title: 'Astronomía',
        detail: 'Modo mantenimiento: avance mínimo viable en 3 Cuerpos y Binarias.',
      },
    ],
  },
  {
    id: 'phase-2',
    phaseNumber: 2,
    title: 'Transición y Profundidad Analítica',
    duration: 'Días 91-180',
    description:
      'Pasar de prototipos a producción y liberar tiempo docente para atacar la investigación astronómica con profundidad.',
    focusAreas: [
      {
        title: 'Estudio de IA',
        detail: 'Proyectos en producción: escalabilidad, métricas y usuarios reales.',
      },
      {
        title: 'Astronomía',
        detail: 'Modo agresivo: redacción de papers y análisis de resultados.',
      },
      {
        title: 'Docencia',
        detail: 'Cierre ordenado del ciclo docente y traspaso de responsabilidades.',
      },
    ],
  },
  {
    id: 'phase-3',
    phaseNumber: 3,
    title: 'Consolidación del Sistema',
    duration: 'Días 181-270',
    description:
      'Auditar lo construido, publicar la ciencia y recalibrar el sistema personal para el siguiente ciclo.',
    focusAreas: [
      {
        title: 'Estudio de IA',
        detail: 'Auditoría temporal y de valor: qué escala, qué se corta.',
      },
      {
        title: 'Ciencia',
        detail: 'Envío de papers a journals científicos y difusión.',
      },
      {
        title: 'Personal',
        detail: 'Calibración personal: energía, rutinas y próximos objetivos.',
      },
    ],
  },
];

interface LifeOSState {
  tags: Tag[];
  tasks: Task[];
  /** Lista global y ordenada de franjas horarias (aplica a todas las semanas). */
  hours: string[];
  /** Horarios por semana; solo se guardan las celdas editadas de cada semana. */
  weekSchedules: WeekSchedules;
  /** Semana visible en el Horario. Estado de sesión, no se persiste. */
  scheduleWeekKey: string;
  roadmapPhases: RoadmapPhase[];
  importantDates: ImportantDate[];

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
}

export const useStore = create<LifeOSState>()(
  persist(
    (set) => ({
      tags: seedTags,
      tasks: seedTasks,
      hours: [...HOURS],
      weekSchedules: buildSeedWeekSchedules(),
      scheduleWeekKey: CURRENT_WEEK_KEY,
      roadmapPhases: seedRoadmap,
      importantDates: seedImportantDates,

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
    }),
    {
      name: 'lifeos-storage',
      version: 2,
      // scheduleWeekKey es estado de sesión: siempre arranca en la semana actual.
      partialize: (state) => ({
        tags: state.tags,
        tasks: state.tasks,
        hours: state.hours,
        weekSchedules: state.weekSchedules,
        roadmapPhases: state.roadmapPhases,
        importantDates: state.importantDates,
      }),
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Record<string, unknown>;
        if (version < 2) {
          // v1 guardaba un único `timeBlocks` (semana recurrente). Se migra a la
          // semana actual del modelo por-semana y se define la lista de horas.
          const oldBlocks = state.timeBlocks as
            | { day: string; hour: string; activity: string; category: string }[]
            | undefined;
          const cells: Record<string, ScheduleEntry> = {};
          if (Array.isArray(oldBlocks)) {
            for (const b of oldBlocks) {
              if (b.activity && b.activity !== 'Libre') {
                cells[`${b.day}|${b.hour}`] = { activity: b.activity, category: b.category };
              }
            }
          }
          delete state.timeBlocks;
          state.hours = [...HOURS];
          state.weekSchedules = { [CURRENT_WEEK_KEY]: cells };
        }
        return state;
      },
    }
  )
);
