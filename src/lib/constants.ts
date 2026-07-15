import type { ColorKey, Column } from '@/types';

export interface PaletteEntry {
  key: ColorKey;
  label: string;
  swatchClass: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  cellClass: string;
}

// Clases literales completas para que el extractor estático de Tailwind las detecte.
export const COLOR_PALETTE: PaletteEntry[] = [
  {
    key: 'red',
    label: 'Rojo',
    swatchClass: 'bg-red-500',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/40',
    cellClass: 'bg-red-500/15 text-red-300 border-red-500/30',
  },
  {
    key: 'blue',
    label: 'Azul',
    swatchClass: 'bg-blue-500',
    bgClass: 'bg-blue-500/15',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500/40',
    cellClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
  {
    key: 'purple',
    label: 'Morado',
    swatchClass: 'bg-purple-500',
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/40',
    cellClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  {
    key: 'green',
    label: 'Verde',
    swatchClass: 'bg-green-500',
    bgClass: 'bg-green-500/15',
    textClass: 'text-green-400',
    borderClass: 'border-green-500/40',
    cellClass: 'bg-green-500/15 text-green-300 border-green-500/30',
  },
  {
    key: 'yellow',
    label: 'Amarillo',
    swatchClass: 'bg-yellow-500',
    bgClass: 'bg-yellow-500/15',
    textClass: 'text-yellow-400',
    borderClass: 'border-yellow-500/40',
    cellClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  },
  {
    key: 'gray',
    label: 'Gris',
    swatchClass: 'bg-zinc-400',
    bgClass: 'bg-zinc-500/15',
    textClass: 'text-zinc-300',
    borderClass: 'border-zinc-500/40',
    cellClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  },
  {
    key: 'orange',
    label: 'Naranja',
    swatchClass: 'bg-orange-500',
    bgClass: 'bg-orange-500/15',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500/40',
    cellClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  },
  {
    key: 'cyan',
    label: 'Cían',
    swatchClass: 'bg-cyan-500',
    bgClass: 'bg-cyan-500/15',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/40',
    cellClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  {
    key: 'pink',
    label: 'Rosa',
    swatchClass: 'bg-pink-500',
    bgClass: 'bg-pink-500/15',
    textClass: 'text-pink-400',
    borderClass: 'border-pink-500/40',
    cellClass: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  },
];

export function getPaletteEntry(key: string): PaletteEntry {
  return COLOR_PALETTE.find((c) => c.key === key) ?? COLOR_PALETTE[5];
}

export const COLUMNS: Column[] = [
  { id: 'todo', title: 'Por Hacer' },
  { id: 'in-progress', title: 'En Progreso', wipLimit: 3 },
  { id: 'blocked', title: 'Bloqueada' },
  { id: 'done', title: 'Hecho' },
];

export const IN_PROGRESS_COLUMN_ID = 'in-progress';
export const BLOCKED_COLUMN_ID = 'blocked';

export const DAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

// 06:00 a 21:00
export const HOURS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 6;
  return `${String(h).padStart(2, '0')}:00`;
});

export const BLOCKED_ALERT_MS = 48 * 60 * 60 * 1000;
