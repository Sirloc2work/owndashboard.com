import { format, getDay, getDaysInMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { getPaletteEntry } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ImportantDate } from '@/types';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

interface MiniMonthProps {
  year: number;
  /** Mes 0-11. */
  month: number;
  eventsByDate: Map<string, ImportantDate[]>;
  todayStr: string;
  onDayClick: (date: string) => void;
}

export function MiniMonth({ year, month, eventsByDate, todayStr, onDayClick }: MiniMonthProps) {
  const firstOfMonth = new Date(year, month, 1);
  // Lunes como primer día de la semana.
  const leadingBlanks = (getDay(firstOfMonth) + 6) % 7;
  const daysInMonth = getDaysInMonth(firstOfMonth);
  const monthName = format(firstOfMonth, 'MMMM', { locale: es });

  return (
    <div className="rounded-xl border border-border/70 bg-card/40 p-3">
      <p className="pb-2 text-center text-sm font-semibold first-letter:uppercase">
        {monthName}
      </p>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i} className="pb-1 text-[10px] font-medium text-muted-foreground">
            {label}
          </span>
        ))}
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const events = eventsByDate.get(dateStr);
          const palette = events?.length ? getPaletteEntry(events[0].category) : null;
          const isToday = dateStr === todayStr;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onDayClick(dateStr)}
              title={events?.map((e) => e.title).join(' · ')}
              className={cn(
                'flex aspect-square items-center justify-center rounded-md text-xs tabular-nums transition-colors',
                palette
                  ? cn(palette.bgClass, palette.textClass, 'border font-semibold', palette.borderClass)
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                isToday && 'ring-2 ring-primary'
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
