/**
 * View-local helpers for the subject (category) screens: "what's next" facts
 * derived from the schedule, events and tasks of one category.
 */
import type { PlannerEvent, PlannerTask, ScheduleException, ScheduleItem } from '@/lib/api/types';
import { MONTH_NAMES } from '../../constants';
import { dateToInput, dval, inputToDate, isDeadlineEvent, scheduleAppliesOn, timeToMinutes } from '../../utils';

/** Monday-first weekday order, as JS `getDay()` numbers. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const WEEKDAY_SHORT: Record<number, string> = { 0: 'dom', 1: 'lun', 2: 'mar', 3: 'mié', 4: 'jue', 5: 'vie', 6: 'sáb' };
export const WEEKDAY_LONG: Record<number, string> = {
    0: 'domingo',
    1: 'lunes',
    2: 'martes',
    3: 'miércoles',
    4: 'jueves',
    5: 'viernes',
    6: 'sábado',
};

export function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function todayIso(today: Date): string {
    return dateToInput(today.getFullYear(), today.getMonth(), today.getDate());
}

/** Whole days from `today` to an ISO date (negative = in the past). */
export function daysFrom(today: Date, iso: string): number {
    return Math.round((isoToDval(iso) - dval(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
}

function isoToDval(iso: string): number {
    const { y, m, d } = inputToDate(iso);
    return dval(y, m, d);
}

/** "12 nov" */
export function shortDate(iso: string): string {
    const { m, d } = inputToDate(iso);
    return `${d} ${MONTH_NAMES[m].slice(0, 3)}`;
}

/** "hoy", "mañana", "jueves" within the week, otherwise "12 nov". Lower-case; capitalize at the call site when it opens a sentence. */
export function relativeDay(iso: string, today: Date): string {
    const diff = daysFrom(today, iso);
    if (diff === 0) return 'hoy';
    if (diff === 1) return 'mañana';
    if (diff === -1) return 'ayer';
    if (diff > 1 && diff < 7) {
        const { y, m, d } = inputToDate(iso);
        return WEEKDAY_LONG[new Date(y, m, d).getDay()];
    }
    return shortDate(iso);
}

export interface NextClass {
    scheduleId: string;
    dateIso: string;
    start: string;
    end: string;
    title: string;
}

/**
 * The next class still to come from `now`, honoring date ranges, biweekly
 * slots and per-date exceptions (cancellations and moved times). Today's
 * classes count until they end. `nowMinutes` null (server render) treats every
 * class today as still ahead.
 */
export function findNextClass(
    schedule: ScheduleItem[],
    exceptions: ScheduleException[],
    today: Date,
    nowMinutes: number | null,
    horizonDays = 28,
): NextClass | null {
    if (schedule.length === 0) return null;
    for (let i = 0; i < horizonDays; i++) {
        const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        const dateIso = dateToInput(dt.getFullYear(), dt.getMonth(), dt.getDate());
        const candidates = schedule
            .filter((s) => scheduleAppliesOn(s, dt))
            .map((s) => {
                const ex = exceptions.find((e) => e.scheduleId === s.id && e.date === dateIso);
                if (ex?.cancelled) return null;
                return { scheduleId: s.id, dateIso, start: ex?.start ?? s.start, end: ex?.end ?? s.end, title: ex?.title ?? s.title };
            })
            .filter((c): c is NextClass => c !== null)
            .filter((c) => i > 0 || nowMinutes === null || timeToMinutes(c.end) > nowMinutes)
            .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
        if (candidates.length > 0) return candidates[0];
    }
    return null;
}

export interface Deliverable {
    kind: 'event' | 'task';
    id: string;
    title: string;
    dateIso: string;
    /** Due time, for deadline events that carry one. */
    time: string | null;
}

/**
 * The nearest thing due from today on: a deadline-shaped event (end time, no
 * start) or the deadline of a task still pending.
 */
export function findNextDeliverable(events: PlannerEvent[], tasks: PlannerTask[], today: Date): Deliverable | null {
    const from = todayIso(today);
    const fromEvents: Deliverable[] = events
        .filter((e) => isDeadlineEvent(e) && e.endDate >= from)
        .map((e) => ({ kind: 'event', id: e.id, title: e.title, dateIso: e.endDate, time: e.end }));
    const fromTasks: Deliverable[] = tasks
        .filter((t) => !t.done && t.deadline !== null && t.deadline >= from)
        .map((t) => ({ kind: 'task', id: t.id, title: t.title, dateIso: t.deadline as string, time: null }));
    const all = [...fromEvents, ...fromTasks].sort(
        (a, b) => a.dateIso.localeCompare(b.dateIso) || timeToMinutes(a.time ?? '23:59') - timeToMinutes(b.time ?? '23:59'),
    );
    return all[0] ?? null;
}

/** Pending tasks whose deadline has already passed. */
export function countOverdue(tasks: PlannerTask[], today: Date): number {
    const from = todayIso(today);
    return tasks.filter((t) => !t.done && t.deadline !== null && t.deadline < from).length;
}

export function plural(n: number, one: string, many: string): string {
    return `${n} ${n === 1 ? one : many}`;
}
