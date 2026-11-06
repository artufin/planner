import type { Category, PlannerEvent, PlannerTask, ScheduleException } from '@/lib/api/types';
import { NO_CATEGORY_LABEL } from '../../../constants';
import {
    categoryById,
    dateToInput,
    eventsForDate,
    isDeadlineEvent,
    isOvernightEvent,
    isUntimedEvent,
    sameDate,
    scheduleTitleFor,
    tasksForDate,
    timeToMinutes,
    type RecurringInstance,
} from '../../../utils';
import { taskDeadline } from '../../PlannerTaskCard';

export const DAY_MINUTES = 24 * 60;
/** A task or event with a start but no end is drawn (and moved) as a one-hour block. */
export const DEFAULT_MINUTES = 60;
/** Below this height a block collapses to a single "time, title" line. */
export const COMPACT_HEIGHT = 34;
export const MIN_SLIP_HEIGHT = 20;

/** Sentence-case weekday names — the shared WEEKDAY_LABELS constant is all-caps. */
const WEEKDAY_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const WEEKDAY_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

/** What the hover/focus tooltip shows, for every kind of item in the view. */
export interface TipInfo {
    title: string;
    time: string | null;
    categoryName: string;
    location: string | null;
    hue: number | null;
    /** An extra line, e.g. a task's "vence 12 nov". */
    note?: string | null;
}

interface BlockBase extends TipInfo {
    key: string;
    subtitle?: string;
    timeLabel: string;
    startMin: number;
    /** Where the block is drawn to; 24:00 for the first half of an overnight event. */
    endMin: number;
    /** Side-by-side layout among overlapping blocks: this block's column and the cluster's column count. */
    col: number;
    cols: number;
}

/** One session of a recurring class, printed into the timetable. */
export interface ClassBlock extends BlockBase {
    kind: 'class';
    scheduleId: string;
    start: string;
    end: string;
    /** The session's exception as it stands — what a move keeps (title) and what undo restores (times). */
    titleOverride: string | null;
    previous: { start: string | null; end: string | null } | null;
}

export interface EventBlock extends BlockBase {
    kind: 'event';
    event: PlannerEvent;
    /** Crosses midnight: drawn on both days, clickable but not draggable. */
    overnight: boolean;
}

export interface TaskBlock extends BlockBase {
    kind: 'task';
    task: PlannerTask;
}

export type GridBlock = ClassBlock | EventBlock | TaskBlock;

/** An event with only an end time, drawn as a line at its due time. */
export interface DeadlineMark extends TipInfo {
    key: string;
    event: PlannerEvent;
    due: string;
    dueMin: number;
}

/** A chip in the strip above the grid: an untimed event, or a task planned for the day without a time. */
export type StripChip = TipInfo & { key: string } & ({ kind: 'event'; event: PlannerEvent } | { kind: 'task'; task: PlannerTask });

export interface WeekDay {
    /** "lun" — the column header. */
    label: string;
    /** "lunes" — for drop-target names read aloud. */
    name: string;
    dayNum: number;
    dateIso: string;
    isToday: boolean;
    isPast: boolean;
    blocks: GridBlock[];
    deadlines: DeadlineMark[];
    strip: StripChip[];
}

/**
 * Column packing for overlapping blocks: sort by start, group transitively
 * overlapping blocks into clusters, give each block the first column that is
 * free at its start; every block in a cluster shares the cluster's column count.
 * Blocks shorter than `minMinutes` reserve that much, since that's how tall they're drawn.
 */
export function packColumns<T extends BlockBase>(items: T[], minMinutes: number): T[] {
    const visualEnd = (b: T) => Math.max(b.endMin, b.startMin + minMinutes);
    const sorted = [...items].sort((a, b) => a.startMin - b.startMin || visualEnd(b) - visualEnd(a));
    const out: T[] = [];
    let cluster: T[] = [];
    let colEnds: number[] = [];
    let clusterEnd = -Infinity;
    const flush = () => {
        for (const block of cluster) block.cols = colEnds.length;
        cluster = [];
        colEnds = [];
        clusterEnd = -Infinity;
    };
    for (const item of sorted) {
        const end = visualEnd(item);
        if (cluster.length > 0 && item.startMin >= clusterEnd) flush();
        let col = colEnds.findIndex((e) => e <= item.startMin);
        if (col === -1) {
            col = colEnds.length;
            colEnds.push(end);
        } else {
            colEnds[col] = end;
        }
        const block = { ...item, col, cols: 1 };
        cluster.push(block);
        out.push(block);
        clusterEnd = Math.max(clusterEnd, end);
    }
    flush();
    return out;
}

interface BuildWeekInput {
    weekStart: Date;
    today: Date;
    events: PlannerEvent[];
    tasks: PlannerTask[];
    categories: Category[];
    recurring: RecurringInstance[];
    exceptions: ScheduleException[];
    /** Grid scale in px per hour — short blocks are drawn taller than their length, and packing must know. */
    zoom: number;
}

function isoOf(d: Date): string {
    return dateToInput(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Everything the week view draws, day by day. */
export function buildWeek({ weekStart, today, events, tasks, categories, recurring, exceptions, zoom }: BuildWeekInput): WeekDay[] {
    const todayIso = isoOf(today);
    const minMinutes = (MIN_SLIP_HEIGHT / zoom) * 60;
    const days: WeekDay[] = [];

    for (let i = 0; i < 7; i++) {
        const dt = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
        const dateIso = isoOf(dt);
        const blocks: GridBlock[] = [];
        const deadlines: DeadlineMark[] = [];
        const stripEvents: StripChip[] = [];
        const stripTasks: StripChip[] = [];

        // Classes
        for (const r of recurring) {
            if (r.y !== dt.getFullYear() || r.m !== dt.getMonth() || r.d !== dt.getDate()) continue;
            const c = categoryById(categories, r.categoryId)!;
            const exception = exceptions.find((e) => e.scheduleId === r.scheduleId && e.date === dateIso);
            const startMin = timeToMinutes(r.start);
            const timeLabel = `${r.start}–${r.end}`;
            blocks.push({
                kind: 'class',
                key: `${dateIso}:${r.id}`,
                scheduleId: r.scheduleId,
                start: r.start,
                end: r.end,
                titleOverride: exception?.title ?? null,
                previous: exception ? { start: exception.start, end: exception.end } : null,
                title: scheduleTitleFor(r, c),
                subtitle: r.title.trim() ? c.name : undefined,
                categoryName: c.name,
                location: null,
                hue: c.hue,
                time: timeLabel,
                timeLabel,
                startMin,
                endMin: Math.max(startMin + 15, timeToMinutes(r.end)),
                col: 0,
                cols: 1,
            });
        }

        // Events
        for (const ev of eventsForDate(events, categories, dateIso)) {
            const c = categoryById(categories, ev.categoryId);
            const tip = {
                title: ev.title,
                categoryName: c?.name ?? NO_CATEGORY_LABEL,
                location: ev.location,
                hue: c?.hue ?? null,
            };
            if (isUntimedEvent(ev)) {
                stripEvents.push({ ...tip, kind: 'event', key: `strip:${dateIso}:${ev.id}`, event: ev, time: 'sin hora' });
                continue;
            }
            if (isDeadlineEvent(ev)) {
                /** A due time belongs to one day only: the day it's due. */
                if (ev.endDate !== dateIso) continue;
                deadlines.push({
                    ...tip,
                    key: `${dateIso}:${ev.id}`,
                    event: ev,
                    due: ev.end!,
                    dueMin: timeToMinutes(ev.end),
                    time: `entrega ${ev.end}`,
                });
                continue;
            }
            const overnight = isOvernightEvent(ev);
            let startMin: number;
            let endMin: number;
            let timeLabel: string;
            if (overnight && ev.startDate === dateIso) {
                startMin = timeToMinutes(ev.start);
                endMin = DAY_MINUTES;
                timeLabel = `desde ${ev.start}`;
            } else if (overnight && ev.endDate === dateIso) {
                startMin = 0;
                endMin = timeToMinutes(ev.end);
                timeLabel = `hasta ${ev.end}`;
            } else if (overnight) {
                startMin = 0;
                endMin = DAY_MINUTES;
                timeLabel = 'todo el día';
            } else {
                startMin = timeToMinutes(ev.start);
                endMin = ev.end !== null ? Math.max(startMin + 15, timeToMinutes(ev.end)) : startMin + DEFAULT_MINUTES;
                timeLabel = ev.end !== null ? `${ev.start}–${ev.end}` : (ev.start ?? '');
            }
            blocks.push({
                ...tip,
                kind: 'event',
                key: `${dateIso}:${ev.id}`,
                event: ev,
                overnight,
                time: timeLabel,
                timeLabel,
                startMin,
                endMin,
                col: 0,
                cols: 1,
            });
        }

        // Tasks
        for (const task of tasksForDate(tasks, categories, dateIso)) {
            const c = categoryById(categories, task.categoryId)!;
            const tip = {
                title: task.title,
                categoryName: c.name,
                location: null,
                hue: c.hue,
                note: taskDeadline(task, today)?.label ?? null,
            };
            if (task.start === null) {
                stripTasks.push({ ...tip, kind: 'task', key: `strip:task:${task.id}`, task, time: 'sin hora' });
                continue;
            }
            const startMin = timeToMinutes(task.start);
            const endMin = task.end !== null ? Math.max(startMin + 15, timeToMinutes(task.end)) : startMin + DEFAULT_MINUTES;
            const timeLabel = task.end !== null ? `${task.start}–${task.end}` : task.start;
            blocks.push({
                ...tip,
                kind: 'task',
                key: `task:${task.id}`,
                task,
                time: timeLabel,
                timeLabel,
                startMin,
                endMin: Math.min(DAY_MINUTES, endMin),
                col: 0,
                cols: 1,
            });
        }

        stripTasks.sort((a, b) => Number(a.kind === 'task' && a.task.done) - Number(b.kind === 'task' && b.task.done));
        deadlines.sort((a, b) => a.dueMin - b.dueMin);

        days.push({
            label: WEEKDAY_SHORT[i],
            name: WEEKDAY_LONG[i],
            dayNum: dt.getDate(),
            dateIso,
            isToday: sameDate(dt, today),
            isPast: dateIso < todayIso,
            blocks: packColumns(blocks, minMinutes),
            deadlines,
            strip: [...stripEvents, ...stripTasks],
        });
    }
    return days;
}
