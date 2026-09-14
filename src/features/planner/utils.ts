import type { Category, PlannerEvent, PlannerTask, ScheduleException, ScheduleItem } from '@/lib/api/types';
import { MONTH_NAMES } from './constants';
import type { ViewName } from './types';

/** A schedule slot's title, falling back to the category name when left blank. */
export function scheduleTitleFor(s: Pick<ScheduleItem, 'title'>, category: Category): string {
    return s.title.trim() || category.name;
}

/** A null hue means "sin categoría" — rendered in neutral gray instead of a category color. */
export function solidColor(hue: number | null): string {
    return hue === null ? 'oklch(62% 0.012 95)' : `oklch(56% 0.16 ${hue})`;
}

export function softColor(hue: number | null): string {
    return hue === null ? 'oklch(94% 0.004 95)' : `oklch(93% 0.035 ${hue})`;
}

export function softTextColor(hue: number | null): string {
    return hue === null ? 'oklch(40% 0.01 95)' : `oklch(38% 0.1 ${hue})`;
}

export function sameDate(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function pad2(n: number): string {
    return n < 10 ? '0' + n : '' + n;
}

export function timeToMinutes(t: string | null | undefined): number {
    if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

export function dateToInput(y: number, m: number, d: number): string {
    return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

export function inputToDate(value: string): { y: number; m: number; d: number } {
    const [y, m, d] = value.split('-').map(Number);
    return { y, m: m - 1, d };
}

/** Day-granularity timestamp, safe for range comparisons. */
export function dval(y: number, m: number, d: number): number {
    return new Date(y, m, d).getTime();
}

/** Same as `dval`, from an ISO 'YYYY-MM-DD' string. */
export function isoDval(iso: string): number {
    const { y, m, d } = inputToDate(iso);
    return dval(y, m, d);
}

export function categoryById(categories: Category[], id: string | null | undefined): Category | undefined {
    return categories.find((c) => c.id === id);
}

export function eventCoversDate(ev: PlannerEvent, dateIso: string): boolean {
    return dateIso >= ev.startDate && dateIso <= ev.endDate;
}

export function isMultiDay(ev: PlannerEvent): boolean {
    return ev.startDate !== ev.endDate;
}

/** A multi-day event with real start and end times (crosses midnight) — excluded from all-day banners, shown as a normal item on its start day only. */
export function isOvernightEvent(ev: PlannerEvent): boolean {
    return isMultiDay(ev) && ev.start !== null && ev.end !== null;
}

/** An event with only an end time (no start) reads as a due time rather than a scheduled block — that's what marks it as a deliverable/deadline. */
export function isDeadlineEvent(ev: Pick<PlannerEvent, 'start' | 'end'>): boolean {
    return ev.start === null && ev.end !== null;
}

/** Whether `ev` should render as a normal (non-banner) single-day item on the given date — true for same-day events, and for an overnight event's start day only. */
export function appliesAsSingleDayEvent(ev: PlannerEvent, dateIso: string): boolean {
    if (!isMultiDay(ev)) return true;
    return isOvernightEvent(ev) && ev.startDate === dateIso;
}

export interface RecurringInstance {
    id: string;
    scheduleId: string;
    y: number;
    m: number;
    d: number;
    categoryId: string;
    title: string;
    start: string;
    end: string;
}

/** Whether a schedule slot occurs on the given date, honoring its date range and weekly/biweekly interval. */
export function scheduleAppliesOn(s: ScheduleItem, dt: Date): boolean {
    if (s.weekday !== dt.getDay()) return false;
    const dtTime = dval(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const start = inputToDate(s.startDate);
    const startTime = dval(start.y, start.m, start.d);
    if (dtTime < startTime) return false;
    if (s.endDate) {
        const end = inputToDate(s.endDate);
        if (dtTime > dval(end.y, end.m, end.d)) return false;
    }
    if (s.interval === 2) {
        const diffDays = Math.round((dtTime - startTime) / 86400000);
        if (Math.floor(diffDays / 7) % 2 !== 0) return false;
    }
    return true;
}

export function recurringForRange(
    schedule: ScheduleItem[],
    categories: Category[],
    startDate: Date,
    days: number,
    exceptions: ScheduleException[] = [],
): RecurringInstance[] {
    const out: RecurringInstance[] = [];
    for (let i = 0; i < days; i++) {
        const dt = new Date(startDate);
        dt.setDate(startDate.getDate() + i);
        const dateIso = dateToInput(dt.getFullYear(), dt.getMonth(), dt.getDate());
        schedule
            .filter((s) => scheduleAppliesOn(s, dt) && categoryById(categories, s.categoryId))
            .forEach((s) => {
                const exception = exceptions.find((e) => e.scheduleId === s.id && e.date === dateIso);
                if (exception?.cancelled) return;
                out.push({
                    id: 'inst-' + s.id + '-' + dt.getTime(),
                    scheduleId: s.id,
                    y: dt.getFullYear(),
                    m: dt.getMonth(),
                    d: dt.getDate(),
                    categoryId: s.categoryId,
                    title: exception?.title ?? s.title,
                    start: exception?.start ?? s.start,
                    end: exception?.end ?? s.end,
                });
            });
    }
    return out;
}

/** An event is shown when it has no category at all, or when its category still exists. */
export function eventIsVisible(ev: PlannerEvent, categories: Category[]): boolean {
    return ev.categoryId === null || !!categoryById(categories, ev.categoryId);
}

export function eventsForDate(events: PlannerEvent[], categories: Category[], dateIso: string): PlannerEvent[] {
    return events.filter((e) => eventCoversDate(e, dateIso) && eventIsVisible(e, categories));
}

export function tasksForDate(tasks: PlannerTask[], categories: Category[], dateIso: string): PlannerTask[] {
    return tasks.filter((t) => t.assignedDate === dateIso && categoryById(categories, t.categoryId));
}

/** Tasks created but not yet assigned to a day. */
export function backlogTasks(tasks: PlannerTask[], categories: Category[]): PlannerTask[] {
    return tasks.filter((t) => t.assignedDate === null && categoryById(categories, t.categoryId));
}

export type DeadlineTone = 'overdue' | 'soon' | 'normal';

/** Short "12 ago"-style label plus an urgency tone, for surfacing a task's deadline on its card. */
export function deadlineInfo(deadline: string, today: Date): { label: string; tone: DeadlineTone } {
    const { y, m, d } = inputToDate(deadline);
    const diffDays = Math.round((dval(y, m, d) - dval(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
    const label = `${d} ${MONTH_NAMES[m].slice(0, 3)}`;
    const tone: DeadlineTone = diffDays < 0 ? 'overdue' : diffDays <= 2 ? 'soon' : 'normal';
    return { label, tone };
}

/** Orders tasks by urgency: overdue/soonest deadlines first, undated ones last. */
export function compareByDeadline(a: Pick<PlannerTask, 'deadline'>, b: Pick<PlannerTask, 'deadline'>): number {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0;
}

export function mondayOfWeek(date: Date): Date {
    const dow = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((dow + 6) % 7));
    return monday;
}

export function getWeekStart(today: Date, weekOffset: number): Date {
    const monday = mondayOfWeek(today);
    const start = new Date(monday);
    start.setDate(monday.getDate() + weekOffset * 7);
    return start;
}

export function getMonthAnchor(today: Date, monthOffset: number): Date {
    return new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
}

export function getRangeLabel(view: ViewName, today: Date, monthOffset: number, weekOffset: number): string {
    if (view === 'week' || view === 'planning') {
        const weekStart = getWeekStart(today, weekOffset);
        const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
        return `${weekStart.getDate()} – ${weekEnd.getDate()} de ${MONTH_NAMES[weekStart.getMonth()]}`;
    }
    const md = getMonthAnchor(today, monthOffset);
    return `${MONTH_NAMES[md.getMonth()]} ${md.getFullYear()}`;
}
