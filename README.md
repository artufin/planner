This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## App overview

Planner is a single-page academic planner: month/week calendar, a weekly planning
board (to-dos), courses ("categorías") grouped into custom groups, per-course
weekly schedules, and a settings area for groups/categories/event types/time
divisions. The whole app lives under `src/features/planner/` and renders at `/`
(`src/app/page.tsx`), matching the [Claude Design mockup](https://claude.ai/design/p/039cb8ef-8459-4251-bbec-b31427417c91)
it was built from.

```
src/features/planner/
  types.ts        domain types (Group, Course, ScheduleItem, PlannerEvent, PlannerTask, ...)
  constants.ts     seed/default data, hue swatches, weekday/month labels
  utils.ts          pure date/color/lookup helpers
  schemas.ts         zod schemas for the 4 modal forms
  styles.ts            shared inline-style tokens (colors, buttons, inputs)
  store.ts              zustand store: domain data + navigation/modal UI state
  useToday.ts             today, frozen at mount
  components/
    PlannerApp.tsx, Sidebar.tsx, TopBar.tsx
    views/       MonthView, WeekView, PlanningView, CoursesListView, CourseView, SettingsView
    modals/      EventModal, TaskModal, ScheduleModal, CourseModal
```

## Persistence: localStorage, not a database

All planner data (groups, courses, schedule, events, tasks, completion state,
time divisions) lives in a Zustand store persisted to the browser's
`localStorage` (see `src/features/planner/store.ts`, key `planner-storage`).
There is no backend call on the golden path — the app works fully offline.

## Library decisions

The project was refactored from an earlier FullCalendar + Prisma skeleton to
match the mockup above. Some previously-installed dependencies are no longer
wired into the app; they're kept installed (not removed) in case a future
iteration reintroduces server-backed sync, but they're currently dead weight:

- **Prisma / `@prisma/client`** — the mockup and this refactor use
  `localStorage` exclusively for persistence. `prisma/schema.prisma` and
  `src/lib/prisma.ts` are untouched but unused. The old `src/app/api/events`
  route was removed: it called `new PrismaClient()` with no datasource
  configured, which Prisma 7 rejects at construction time, and Next.js
  evaluates API routes during `next build`'s page-data-collection step — so
  the dead route failed production builds outright. If server persistence is
  added later, the `Event` Prisma model will also need reshaping to match
  `PlannerEvent`/`PlannerTask` (courseId, y/m/d fields, event types) — it
  currently reflects the old, discarded data model.
- **`@tanstack/react-query`** — there's no server data fetching in this
  client-only app, so `Providers.tsx`/`queryClient.ts` wrap the tree but have
  nothing to do right now.

`@fullcalendar/*` (react, daygrid, timegrid, interaction) was removed
outright rather than kept dead: the mockup's month and week grids are fully
custom (multi-day event bars with hover tooltips, a week view with
user-configurable, non-uniform time divisions, independent zoom, and
per-occurrence schedule exceptions) which doesn't map cleanly onto
FullCalendar's plugin model, so the calendar views were hand-built instead
(`components/views/MonthView.tsx`, `WeekView.tsx`) and nothing in the app
imports FullCalendar anymore.

Actively used, and why:

- **Zustand** — single store for both domain data and UI/navigation state
  (current view, open modals, month/week offsets), persisted via
  `zustand/middleware`'s `persist` (domain data only — navigation and modal
  state are intentionally excluded so a reload never reopens a stale modal).
- **React Hook Form + Zod** — the four entity forms (event, task, class
  schedule, course) validate through `zodResolver` against the schemas in
  `schemas.ts`.
- **Tailwind CSS** — available for base styling; the planner UI itself
  mirrors the mockup's `oklch()`-based inline styles directly (course colors
  are computed per-hue at runtime, which isn't expressible as static
  Tailwind utility classes).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
