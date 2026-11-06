import type { DragItem, DropPoint, DropTarget, EventDrag, OccurrenceDrag, TaskDrag } from './types';
import { addDaysIso, daysBetween, minutesToTime, timeToMinutes } from '../utils';
import { MONTH_NAMES } from '../constants';

export const SNAP_MINUTES = 15;
const DAY = 24 * 60;
const DEFAULT_DURATION = 60;

/** Whether `item` may land on `target` — use it to light up only valid drop zones. */
export function accepts(item: DragItem | null | undefined, target: DropTarget): boolean {
    if (!item || item.kind === 'resize') return false;
    if (item.kind === 'occurrence') return target.kind === 'timeline' && target.date === item.date;
    if (item.kind === 'event') return target.kind !== 'backlog';
    return true;
}

/**
 * The Y a timeline drop is measured at: blocks already on the grid keep the
 * offset they were grabbed at (their top edge), cards coming from a list land
 * where the pointer is.
 */
export function dropY(item: DragItem, point: DropPoint): number {
    const fromList = item.kind === 'task' && (item.task.start === null || item.task.assignedDate === null);
    return fromList && point.pointerY !== null ? point.pointerY : point.top;
}

export function snap(minutes: number): number {
    return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

/** Start and length of a timed item, in minutes. Untimed items get a one-hour block. */
export function durationOf(item: TaskDrag | EventDrag | OccurrenceDrag): number {
    if (item.kind === 'occurrence') return timeToMinutes(item.end) - timeToMinutes(item.start);
    if (item.kind === 'task') {
        const { start, end } = item.task;
        return start && end ? Math.max(SNAP_MINUTES, timeToMinutes(end) - timeToMinutes(start)) : DEFAULT_DURATION;
    }
    const ev = item.event;
    if (ev.start === null || ev.end === null) return DEFAULT_DURATION;
    return daysBetween(ev.startDate, ev.endDate) * DAY + timeToMinutes(ev.end) - timeToMinutes(ev.start);
}

/** "al jueves 12", "a hoy", "a mañana" — for the undo note. */
export function dayPhrase(iso: string, todayIso: string): string {
    const diff = daysBetween(todayIso, iso);
    if (diff === 0) return 'a hoy';
    if (diff === 1) return 'a mañana';
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const weekday = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][dt.getDay()];
    return Math.abs(diff) <= 6 ? `al ${weekday} ${d}` : `al ${d} de ${MONTH_NAMES[m - 1]}`;
}

/** Event fields after moving it so it starts at `startMin` on `date`, keeping its length. */
export function eventAt(item: EventDrag, date: string, startMin: number) {
    const ev = item.event;
    if (ev.start === null && ev.end !== null) {
        /** A deadline has only a due time; the drop height sets that. */
        return { startDate: date, endDate: date, start: null, end: minutesToTime(startMin) };
    }
    const length = durationOf(item);
    /** Ending exactly at midnight is stored as 23:59 of the same day, not 00:00 of the next. */
    const endAbs = startMin + length;
    const end = endAbs % DAY === 0 ? endAbs - 1 : endAbs;
    return {
        startDate: date,
        endDate: addDaysIso(date, Math.floor(end / DAY)),
        start: minutesToTime(startMin),
        end: minutesToTime(end % DAY),
    };
}

export { DAY };
