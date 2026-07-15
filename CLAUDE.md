# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server (default: http://localhost:5173)
npm run build      # tsc -b && vite build — must pass with zero TS errors
npm run lint       # oxlint
npm run preview    # serve the production build from dist/
```

There is no test suite. Verification is done via `npm run build` plus manual/browser checks.

Note: this repo lives in the `life-os-dynamic/` subdirectory of the `ownspreadsheet` workspace; the parent's `.claude/launch.json` defines a `life-os-dev` preview server config.

## What this is

"LifeOS" — a Spanish-language personal productivity SPA (no backend) with five views: Dashboard, Kanban board with WIP limits, weekly timeboxing grid, annual calendar of important dates, and a 9-month strategic roadmap. All UI text is in Spanish.

## Architecture

**Single Zustand store = the entire app state.** [src/store/useStore.ts](src/store/useStore.ts) holds `tags`, `tasks`, `hours`, `weekSchedules`, `roadmapPhases`, `importantDates` (calendar events with `date: 'yyyy-MM-dd'` strings, compared lexicographically), plus `scheduleWeekKey` (the week currently shown in the Horario), all mutation actions, and the seed data. It uses the `persist` middleware with localStorage key `lifeos-storage` (**version 2**). Consequences:

- Changing persisted type shapes requires bumping the persist `version` and writing a `migrate` (see the v1→v2 migration that converts the old flat `timeBlocks` into the current week of `weekSchedules`). Seed data only applies to fresh browsers.
- `scheduleWeekKey` is session state, excluded from persistence via `partialize` — the Horario always opens on the current week. If you add a new persisted slice you MUST add it to `partialize` or it won't be saved.
- Components never own domain state; they read slices via `useStore((s) => ...)` and call store actions.

**Weekly schedule model** (the Horario). `weekSchedules: Record<weekKey, Record<'day|hour', ScheduleEntry>>` where `weekKey` is the Monday's date (`'yyyy-MM-dd'`, via `getWeekKey` in [src/lib/date.ts](src/lib/date.ts)). Only cells the user edited are stored; a missing cell renders "Libre". New weeks start blank; `copyWeek(from, to)` clones a previous/specific week's cells (the "usar configuración de otra semana" flow). `hours` is a global sorted list applying to every week (custom hours can be added/removed). `ScheduleEntry` has `activity`, `category` (palette key), optional `place` and `description`. The current-day column is highlighted only when viewing the week containing today (`toDateKey(new Date())`). All week math (Monday-start) lives in `src/lib/date.ts` — reuse `getWeekKey`/`getWeekDates`/`shiftWeek`/`weekLabel`/`parseLocalDate`, never `new Date('yyyy-MM-dd')` (that parses as UTC).

**Calendar ⇄ Horario sync.** Both use `toDateKey(new Date())` as the shared "today". The Horario header shows each day's important dates (filtered from `importantDates` by that column's date) as clickable markers opening `DayDetailDialog`. `DayDetailDialog` takes an optional `onGoToSchedule(date)` prop (passed from Calendar and Dashboard, not from the Horario itself) that sets `scheduleWeekKey` to that date's week and navigates to `timebox`. Views that navigate receive `onNavigate` from `App.tsx` (typed `ViewProps`).

**No router.** `App.tsx` switches views with a local `activeView: ViewId` state; the sidebar ([src/components/layout/Sidebar.tsx](src/components/layout/Sidebar.tsx)) calls `onNavigate`. Views live in `src/views/`, modals in `src/components/modals/` (all are controlled shadcn `Dialog`s receiving `open`/`onOpenChange`).

**Colors are a fixed 9-entry palette** in [src/lib/constants.ts](src/lib/constants.ts) (`COLOR_PALETTE`). Every entry carries complete literal Tailwind class strings (`bg-red-500/15`, etc.) because Tailwind v4 statically extracts classes — **never construct Tailwind class names dynamically**. Tag objects denormalize their palette classes (`bgClass`/`textClass`/`borderClass`); `updateTag` with a `colorKey` recomputes them via `getPaletteEntry`. A `ScheduleEntry` `category` is a palette key, not a tag id (robust to tag deletion).

**Kanban business rules** (all driven by constants in `src/lib/constants.ts`):
- Columns are fixed config (`COLUMNS`); only tasks are dynamic. `in-progress` has `wipLimit: 3` — a column renders a red border/glow when `tasks.length > wipLimit`.
- A task in `blocked` for over 48h (`BLOCKED_ALERT_MS`, compared against `task.updatedAt`) shows a pulsing `AlertTriangle`. This depends on `updatedAt` being refreshed on every `updateTask` and on **column change** (not same-column reorder) in `moveTask` — preserve that invariant.

**Drag & drop uses @dnd-kit exclusively** (react-beautiful-dnd is prohibited). The pattern in [src/views/KanbanView.tsx](src/views/KanbanView.tsx): `onDragOver` handles cross-column moves, `onDragEnd` handles same-column reorder, both via the store's `moveTask(taskId, toColumnId, overTaskId)` which implements arrayMove insertion semantics (drag down → insert after target, drag up → before). `PointerSensor` has `activationConstraint: { distance: 6 }` so plain clicks still open the TaskEditor. `DragOverlay` renders the presentational `TaskCardContent` (separate from the sortable `TaskCard` wrapper).

## Stack constraints

- **React 19** — shadcn/ui v4 components use ref-as-prop (no `forwardRef`). Do not downgrade to React 18; it silently breaks Radix dialog refs (outside-click, focus management).
- **Tailwind v4** via the `@tailwindcss/vite` plugin — there is no `tailwind.config.*`; the theme lives in `src/index.css` (`@theme`, oklch CSS variables from shadcn's radix-nova preset).
- **shadcn/ui**: components are vendored into `src/components/ui/`; add more with `npx shadcn@latest add <name>`. Toasts use **sonner** (`toast()` from `'sonner'`, `<Toaster />` mounted in `App.tsx`) — the old shadcn `toast` component no longer exists.
- **Strict dark mode, no white flash**: `index.html` hardcodes `class="dark"` and inline `background-color` on `<html>`/`<body>`. There is no light theme.
- **TypeScript 6**: `baseUrl` is deprecated — the `@/*` alias is defined with `paths` alone (in both `tsconfig.json` and `tsconfig.app.json`) plus `resolve.alias` in `vite.config.ts`. `erasableSyntaxOnly` is on: no enums/namespaces.
- Dates use `date-fns` with the `es` locale. Week grids start on Monday: convert JS `getDay()` with `(getDay() + 6) % 7` to index into `DAYS`.
