# Planner

A personal academic planner: month and week calendar, a weekly planning board
for to-dos, subjects ("materias") organised into groups, recurring class
schedules, and a settings area for all of it. Single user, Spanish UI.

Next.js (App Router) on the front, Next.js route handlers + Prisma + Postgres
behind it, a shared password in front of both.

## Getting started

Requirements: Node, pnpm (the version is pinned in `package.json`'s
`packageManager`), and a Postgres database.

```bash
pnpm install
cp .env.example .env        # then fill it in, see below
pnpm prisma generate
pnpm prisma migrate deploy  # or `migrate dev` while changing the schema
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be sent to
`/login` first.

| variable | what it is |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `APP_PASSWORD` | the shared password `/login` asks for |
| `AUTH_SECRET` | key that signs the session cookie (`openssl rand -base64 32`) |

Scripts: `pnpm dev`, `pnpm build` (runs `prisma generate` first),
`pnpm start`, `pnpm lint`.

## Layout

```
src/
  app/
    page.tsx              renders PlannerApp (client-only)
    login/                password form
    api/                  route handlers, one folder per resource
  middleware.ts           session check for every page and API route
  components/
    Providers.tsx         React Query provider
    ui/                   UI primitives (Button, Modal, TextField, TaskCard, ...)
                          plus tokens.ts, palette.ts and styles.css
  lib/
    prisma.ts             Prisma client (pg adapter)
    auth.ts               password check + signed session cookie
    queryClient.ts
    api/                  client hooks and server helpers per resource
  features/planner/
    store.ts              zustand: navigation and modal state only
    useUrlState.ts        mirrors navigation into the query string
    useShortcuts.ts       keyboard shortcuts
    schemas.ts            zod schemas for the modal forms
    utils.ts, constants.ts
    components/
      PlannerApp, Sidebar, TopBar, BacklogTray, dialogs
      views/              MonthView, WeekView (+ week/), PlanningView,
                          CategoriesListView, CategoryView, SettingsView
      modals/             EventModal, TaskModal, ScheduleModal, CategoryModal
    dnd/                  drag & drop across all views (dnd-kit)
    toast/                toasts
prisma/
  schema.prisma, migrations/
docs/
  model.md                data model and the decisions behind it
```

## Data

Everything lives in Postgres: `Group`, `Category`, `ScheduleItem`,
`ScheduleException`, `PlannerEvent`, `PlannerTask`, `TimeDivision`. See
[`docs/model.md`](docs/model.md) for what each field means and why it is
shaped the way it is.

A few conventions run through the whole stack:

- **Dates and times are strings on the wire.** Postgres `DATE`/`TIME` columns
  come out of Prisma as `Date` objects; the API converts them to
  `'YYYY-MM-DD'` / `'HH:MM'` in one place (`lib/api/serialize.ts`,
  `lib/api/dto.ts`). `lib/api/types.ts` holds the wire shapes the app uses.
  A `null` time means "no time".
- **Recurring classes are computed, not stored.** A `ScheduleItem` is a
  weekly or biweekly rule. Occurrences are expanded on the client for the
  range being shown, and a `ScheduleException` cancels or edits a single
  occurrence by date.
- **Deadline events are derived from shape.** An event with an end time and
  no start time reads as a due time, not a block.

## How the client talks to the server

- `lib/api/<resource>.ts` exposes React Query hooks (`useEvents`,
  `useCreateTask`, `useUpdateScheduleItem`, ...). Mutations update the cached
  list optimistically and roll back on error (`lib/api/optimistic.ts`), so a
  dragged card stays where it was dropped.
- Route handlers in `app/api/` validate input with zod
  (`lib/api/validators.ts`) and map Prisma errors to readable responses
  (`lib/api/errors.ts`).
- Zustand (`features/planner/store.ts`) holds only UI state: current view,
  month/week offset, week zoom, selected category, and which modal is open.
  The navigation part is mirrored into the URL in Spanish
  (`?vista=semana&semana=1`), so back/forward and reloads work. A few UI
  preferences (collapsed sidebar, week tray, last quick-add category) are kept in
  `localStorage`.

## Auth

Single user, no accounts. `POST /api/login` checks the password against
`APP_PASSWORD` and sets an HMAC-signed, httpOnly cookie that lasts 30 days.
`middleware.ts` verifies it on every request: pages redirect to `/login`,
API routes answer `401`. If `APP_PASSWORD` or `AUTH_SECRET` is missing, the
app stays locked.

## Styling

`src/components/ui/styles.css` defines the tokens (`--pl-*` custom
properties) and the styles for the UI primitives. Feature components use CSS
Modules next to each file. Category colors are generated from a hue angle at
runtime (`tokens.ts`, `palette.ts`). The font is Archivo, loaded through
`next/font` in `app/layout.tsx`; its width axis is what makes headings and
numbers condensed.

## Main libraries

- **Next.js 16 / React 19**, with the React Compiler enabled.
- **Prisma 7** with `@prisma/adapter-pg`.
- **@tanstack/react-query** for server state.
- **Zustand** for UI state.
- **React Hook Form + Zod** for the forms. Zod also validates the API.
- **dnd-kit** for drag & drop in the month, week and planning views.

The calendar views are built by hand. FullCalendar was used early on and
removed, because the week view (untimed/deadline strip, custom
non-uniform time divisions, zoom, per-occurrence exceptions) didn't fit
its plugin model.
