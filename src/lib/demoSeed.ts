import type {
  ImportantDate,
  LifeOSData,
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

const demoTags: Tag[] = [
  makeTag('tag-trabajo', 'Trabajo', 'blue'),
  makeTag('tag-salud', 'Salud', 'green'),
  makeTag('tag-aprendizaje', 'Aprendizaje', 'purple'),
  makeTag('tag-personal', 'Personal', 'orange'),
  makeTag('tag-finanzas', 'Finanzas', 'cyan'),
  makeTag('tag-hogar', 'Hogar', 'gray'),
];

/** Persona demo: alguien orientado a la productividad y el orden. */
function buildDemoTasks(now: number): Task[] {
  return [
    {
      id: 'demo-task-1',
      title: 'Preparar presentación trimestral',
      description: 'Resultados del trimestre y objetivos del siguiente para la reunión de equipo.',
      columnId: 'todo',
      tagIds: ['tag-trabajo'],
      updatedAt: now,
    },
    {
      id: 'demo-task-2',
      title: 'Reservar chequeo médico anual',
      columnId: 'todo',
      tagIds: ['tag-salud'],
      updatedAt: now,
    },
    {
      id: 'demo-task-3',
      title: 'Planificar viaje de vacaciones',
      description: 'Comparar destinos, presupuesto y fechas de diciembre.',
      columnId: 'todo',
      tagIds: ['tag-personal'],
      updatedAt: now,
    },
    {
      id: 'demo-task-4',
      title: 'Investigar plan de ahorro e inversión',
      columnId: 'todo',
      tagIds: ['tag-finanzas'],
      updatedAt: now,
    },
    {
      id: 'demo-task-5',
      title: 'Curso de inglés B2 — módulo 4',
      description: 'Completar lecciones y práctica de speaking de la semana.',
      columnId: 'in-progress',
      tagIds: ['tag-aprendizaje'],
      updatedAt: now,
    },
    {
      id: 'demo-task-6',
      title: 'Rutina de gimnasio 3x por semana',
      columnId: 'in-progress',
      tagIds: ['tag-salud'],
      updatedAt: now,
    },
    {
      id: 'demo-task-7',
      title: 'Lanzar side-project: landing + MVP',
      description: 'Construir la landing y un MVP funcional para validar la idea.',
      columnId: 'in-progress',
      tagIds: ['tag-personal', 'tag-aprendizaje'],
      updatedAt: now,
    },
    {
      id: 'demo-task-8',
      title: 'Firmar contrato con proveedor',
      description: 'A la espera de la revisión legal antes de firmar.',
      columnId: 'blocked',
      tagIds: ['tag-trabajo'],
      updatedAt: now - 72 * 60 * 60 * 1000,
    },
    {
      id: 'demo-task-9',
      title: 'Declaración de impuestos',
      columnId: 'done',
      tagIds: ['tag-finanzas'],
      updatedAt: now,
    },
    {
      id: 'demo-task-10',
      title: 'Renovar pasaporte',
      columnId: 'done',
      tagIds: ['tag-personal'],
      updatedAt: now,
    },
    {
      id: 'demo-task-11',
      title: 'Meal prep semanal',
      columnId: 'done',
      tagIds: ['tag-hogar'],
      updatedAt: now,
    },
  ];
}

const weekdaySchedule: Record<string, { activity: string; category: string }> = {
  '06:00': { activity: 'Rutina matinal y meditación', category: 'gray' },
  '07:00': { activity: 'Ejercicio', category: 'green' },
  '08:00': { activity: 'Desayuno y preparación', category: 'gray' },
  '09:00': { activity: 'Trabajo — Deep Work', category: 'blue' },
  '10:00': { activity: 'Trabajo — Deep Work', category: 'blue' },
  '11:00': { activity: 'Reuniones de equipo', category: 'blue' },
  '12:00': { activity: 'Correo y gestión', category: 'blue' },
  '13:00': { activity: 'Almuerzo', category: 'gray' },
  '14:00': { activity: 'Trabajo — Foco', category: 'blue' },
  '15:00': { activity: 'Trabajo — Foco', category: 'blue' },
  '16:00': { activity: 'Aprendizaje — Inglés', category: 'purple' },
  '17:00': { activity: 'Side-project', category: 'orange' },
  '18:00': { activity: 'Gimnasio / caminata', category: 'green' },
  '19:00': { activity: 'Cena', category: 'gray' },
  '20:00': { activity: 'Lectura / hobby', category: 'orange' },
  '21:00': { activity: 'Descanso', category: 'gray' },
};

const saturdaySchedule: Record<string, { activity: string; category: string }> = {
  '08:00': { activity: 'Rutina matinal', category: 'gray' },
  '09:00': { activity: 'Deporte al aire libre', category: 'green' },
  '10:00': { activity: 'Side-project', category: 'orange' },
  '11:00': { activity: 'Side-project', category: 'orange' },
  '13:00': { activity: 'Almuerzo', category: 'gray' },
  '15:00': { activity: 'Aprendizaje — Curso', category: 'purple' },
  '16:00': { activity: 'Tiempo personal', category: 'orange' },
  '18:00': { activity: 'Social / amigos', category: 'orange' },
};

const sundaySchedule: Record<string, { activity: string; category: string }> = {
  '09:00': { activity: 'Meal prep', category: 'gray' },
  '10:00': { activity: 'Hogar y orden', category: 'gray' },
  '11:00': { activity: 'Finanzas — revisión semanal', category: 'cyan' },
  '13:00': { activity: 'Almuerzo familiar', category: 'gray' },
  '16:00': { activity: 'Planificación de la semana', category: 'blue' },
  '17:00': { activity: 'Lectura', category: 'orange' },
  '20:00': { activity: 'Descanso', category: 'gray' },
};

function buildDemoWeekCells(): Record<string, ScheduleEntry> {
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

const demoImportantDates: ImportantDate[] = [
  {
    id: 'demo-date-1',
    date: '2026-07-28',
    title: 'Presentación trimestral',
    description: 'Exponer resultados y objetivos ante el equipo.',
    category: 'blue',
  },
  {
    id: 'demo-date-2',
    date: '2026-08-10',
    title: 'Chequeo médico anual',
    category: 'green',
  },
  {
    id: 'demo-date-3',
    date: '2026-08-22',
    title: 'Cumpleaños de mamá',
    category: 'pink',
  },
  {
    id: 'demo-date-4',
    date: '2026-09-05',
    title: 'Inicio del curso avanzado de inglés',
    category: 'purple',
  },
  {
    id: 'demo-date-5',
    date: '2026-09-18',
    title: 'Fiestas Patrias',
    description: 'Feriado — descanso y recalibración.',
    category: 'gray',
  },
  {
    id: 'demo-date-6',
    date: '2026-10-15',
    title: 'Deadline lanzamiento del side-project',
    description: 'Publicar la landing y abrir el MVP a los primeros usuarios.',
    category: 'orange',
  },
  {
    id: 'demo-date-7',
    date: '2026-11-20',
    title: 'Revisión anual de finanzas',
    category: 'cyan',
  },
  {
    id: 'demo-date-8',
    date: '2026-12-20',
    title: 'Viaje de vacaciones',
    category: 'orange',
  },
];

const demoRoadmap: RoadmapPhase[] = [
  {
    id: 'demo-phase-1',
    phaseNumber: 1,
    title: 'Corto plazo — Hábitos y bases',
    duration: 'Días 1-90',
    description:
      'Construir los cimientos: instalar rutinas sostenibles de salud, un sistema de productividad y orden financiero antes de escalar proyectos.',
    focusAreas: [
      { title: 'Salud', detail: 'Rutina estable de ejercicio y sueño; chequeo médico al día.' },
      { title: 'Trabajo', detail: 'Sistema de productividad (timeboxing + kanban) en marcha.' },
      { title: 'Finanzas', detail: 'Presupuesto mensual y fondo de emergencia.' },
    ],
  },
  {
    id: 'demo-phase-2',
    phaseNumber: 2,
    title: 'Mediano plazo — Proyectos en marcha',
    duration: 'Días 91-180',
    description:
      'Con las bases firmes, subir la ambición: profundizar el aprendizaje y llevar el proyecto personal de idea a producto.',
    focusAreas: [
      { title: 'Aprendizaje', detail: 'De inglés B2 a C1; certificación en curso.' },
      { title: 'Personal', detail: 'MVP del side-project construido y validado.' },
      { title: 'Trabajo', detail: 'Liderar un proyecto clave del equipo.' },
    ],
  },
  {
    id: 'demo-phase-3',
    phaseNumber: 3,
    title: 'Largo plazo — Consolidación',
    duration: 'Días 181-270',
    description:
      'Cosechar lo construido: lanzar al público, empezar a invertir y fijar una meta física ambiciosa que consolide el nuevo ritmo de vida.',
    focusAreas: [
      { title: 'Personal', detail: 'Lanzamiento público del side-project.' },
      { title: 'Finanzas', detail: 'Primeras inversiones con el ahorro acumulado.' },
      { title: 'Salud', detail: 'Meta física: completar un medio maratón.' },
    ],
  },
];

/** Estado completo de LifeOS para el modo invitado (efímero, no persiste). */
export function buildDemoData(): LifeOSData {
  const now = Date.now();
  const weekSchedules: WeekSchedules = { [getWeekKey(new Date())]: buildDemoWeekCells() };
  return {
    tags: demoTags,
    tasks: buildDemoTasks(now),
    hours: [...HOURS],
    weekSchedules,
    roadmapPhases: demoRoadmap,
    importantDates: demoImportantDates,
  };
}

/**
 * Estado inicial de una cuenta real recién creada: lienzo limpio (sin tareas,
 * etiquetas, fechas ni horario), pero con la plantilla de roadmap para que la
 * vista sea usable desde el primer día (el Roadmap solo permite editar fases).
 */
export function buildStarterData(): LifeOSData {
  return {
    tags: [],
    tasks: [],
    hours: [...HOURS],
    weekSchedules: { [getWeekKey(new Date())]: {} },
    roadmapPhases: demoRoadmap,
    importantDates: [],
  };
}
