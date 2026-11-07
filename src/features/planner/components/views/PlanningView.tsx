'use client';

import type { CSSProperties } from 'react';
import { cx, hueVars } from '@/components/ui';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useEvents } from '@/lib/api/events';
import { useSchedule, useScheduleExceptions } from '@/lib/api/schedule';
import { useTasks } from '@/lib/api/tasks';
import type { Category, PlannerEvent, PlannerTask } from '@/lib/api/types';
import { MONTH_NAMES } from '../../constants';
import {
    categoryById,
    compareByDeadline,
    dateToInput,
    eventsForDate,
    getWeekStart,
    isDeadlineEvent,
    isOvernightEvent,
    isUntimedEvent,
    recurringForRange,
    sameDate,
    scheduleTitleFor,
    tasksForDate,
    timeToMinutes,
    type RecurringInstance,
} from '../../utils';
import { useNowMinutes, useToday } from '../../useToday';
import { useActiveDrag, usePlannerDroppable, type DayTarget } from '../../dnd';
import BacklogTray from '../BacklogTray';
import { PlannerTaskCard } from '../PlannerTaskCard';
import s from './PlanningView.module.css';

const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

/** The ribbon under each day's number covers 07:00–23:00. */
const RIBBON_START = 7 * 60;
const RIBBON_END = 23 * 60;
/** "Free hours" are counted inside a waking window narrower than the ribbon. */
const FREE_START = 8 * 60;
const FREE_END = 22 * 60;

interface Busy {
    key: string;
    title: string;
    hue: number | null;
    from: number;
    to: number;
    kind: 'class' | 'event';
    label: string;
}

interface DayNote {
    id: string;
    title: string;
    hue: number | null;
    time: string | null;
}

interface PlanningDay {
    index: number;
    iso: string;
    name: string;
    dayNum: number;
    monthShort: string | null;
    isToday: boolean;
    isPast: boolean;
    busy: Busy[];
    dues: DayNote[];
    allDay: DayNote[];
    freeHours: number;
    tasks: PlannerTask[];
    done: number;
}

function dayIso(d: Date): string {
    return dateToInput(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Minutes of `[from, to)` intervals that fall inside the window, overlaps counted once. */
function coveredMinutes(intervals: { from: number; to: number }[], winFrom: number, winTo: number): number {
    const clipped = intervals
        .map((i) => ({ from: Math.max(i.from, winFrom), to: Math.min(i.to, winTo) }))
        .filter((i) => i.to > i.from)
        .sort((a, b) => a.from - b.from);
    let total = 0;
    let curFrom = -1;
    let curTo = -1;
    for (const i of clipped) {
        if (i.from > curTo) {
            if (curTo > curFrom) total += curTo - curFrom;
            curFrom = i.from;
            curTo = i.to;
        } else {
            curTo = Math.max(curTo, i.to);
        }
    }
    if (curTo > curFrom) total += curTo - curFrom;
    return total;
}

function formatHours(h: number): string {
    return Number.isInteger(h) ? String(h) : h.toFixed(1).replace('.', ',');
}

function busyFor(
    iso: string,
    recurring: RecurringInstance[],
    events: PlannerEvent[],
    categories: Category[],
    date: Date,
): Busy[] {
    const classes: Busy[] = recurring
        .filter((r) => r.y === date.getFullYear() && r.m === date.getMonth() && r.d === date.getDate())
        .map((r) => {
            const c = categoryById(categories, r.categoryId)!;
            return {
                key: r.id,
                title: scheduleTitleFor(r, c),
                hue: c.hue,
                from: timeToMinutes(r.start),
                to: timeToMinutes(r.end),
                kind: 'class' as const,
                label: `${r.start}–${r.end}`,
            };
        });
    const timed: Busy[] = eventsForDate(events, categories, iso)
        .filter((ev) => ev.start !== null)
        .map((ev) => {
            const hue = categoryById(categories, ev.categoryId)?.hue ?? null;
            if (isOvernightEvent(ev)) {
                const isStartDay = ev.startDate === iso;
                return {
                    key: ev.id,
                    title: ev.title,
                    hue,
                    from: isStartDay ? timeToMinutes(ev.start) : 0,
                    to: isStartDay ? 24 * 60 : timeToMinutes(ev.end),
                    kind: 'event' as const,
                    label: isStartDay ? `desde ${ev.start}` : `hasta ${ev.end}`,
                };
            }
            const from = timeToMinutes(ev.start);
            return {
                key: ev.id,
                title: ev.title,
                hue,
                from,
                to: ev.end !== null ? timeToMinutes(ev.end) : from + 60,
                kind: 'event' as const,
                label: ev.end !== null ? `${ev.start}–${ev.end}` : `${ev.start}`,
            };
        });
    return [...classes, ...timed].sort((a, b) => a.from - b.from);
}

export default function PlanningView() {
    const { data: categories = [] } = useCategories();
    const { data: tasks = [] } = useTasks();
    const { data: events = [] } = useEvents();
    const { data: schedule = [] } = useSchedule();
    const { data: exceptions = [] } = useScheduleExceptions();
    const weekOffset = usePlannerStore((st) => st.weekOffset);
    const today = useToday();
    const nowMinutes = useNowMinutes();
    const dragging = useActiveDrag() !== null;

    const weekStart = getWeekStart(today, weekOffset);
    const todayIso = dayIso(today);

    // React Compiler memoizes these derivations; no manual useMemo needed.
    const recurring = recurringForRange(schedule, categories, weekStart, 7, exceptions);
    const days: PlanningDay[] = WEEKDAY_NAMES.map((name, i) => {
        const date = addDays(weekStart, i);
        const iso = dayIso(date);
        const dayEvents = eventsForDate(events, categories, iso);
        const busy = busyFor(iso, recurring, events, categories, date);
        const dues = dayEvents
            .filter((ev) => isDeadlineEvent(ev))
            .map((ev) => ({ id: ev.id, title: ev.title, hue: categoryById(categories, ev.categoryId)?.hue ?? null, time: ev.end }))
            .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
        const allDay = dayEvents
            .filter((ev) => isUntimedEvent(ev))
            .map((ev) => ({ id: ev.id, title: ev.title, hue: categoryById(categories, ev.categoryId)?.hue ?? null, time: null }));
        const freeMinutes = FREE_END - FREE_START - coveredMinutes(busy, FREE_START, FREE_END);
        const dayTasks = tasksForDate(tasks, categories, iso).sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1;
            const byTime = (a.start ? timeToMinutes(a.start) : 9999) - (b.start ? timeToMinutes(b.start) : 9999);
            return byTime || compareByDeadline(a, b);
        });
        return {
            index: i,
            iso,
            name,
            dayNum: date.getDate(),
            monthShort: i === 0 || date.getDate() === 1 ? MONTH_NAMES[date.getMonth()].slice(0, 3) : null,
            isToday: sameDate(date, today),
            isPast: iso < todayIso,
            busy,
            dues,
            allDay,
            freeHours: Math.round(freeMinutes / 30) / 2,
            tasks: dayTasks,
            done: dayTasks.filter((t) => t.done).length,
        };
    });

    return (
        <div className={cx(s.board, dragging && s.isDragging)}>
            <BacklogTray />
            <div className={s.week}>
                {days.map((day) => (
                    <PlanningDayColumn key={day.iso} day={day} categories={categories} today={today} nowMinutes={nowMinutes} />
                ))}
            </div>
        </div>
    );
}

interface PlanningDayColumnProps {
    day: PlanningDay;
    categories: Category[];
    today: Date;
    nowMinutes: number | null;
}

function PlanningDayColumn({ day, categories, today, nowMinutes }: PlanningDayColumnProps) {
    const openTaskModalNew = usePlannerStore((st) => st.openTaskModalNew);
    const openEventModalEdit = usePlannerStore((st) => st.openEventModalEdit);
    const target: DayTarget = { kind: 'day', date: day.iso, label: `${day.name} ${day.dayNum}` };
    const { setNodeRef, isOver } = usePlannerDroppable(`planning-day:${day.iso}`, target);
    const pending = day.tasks.length - day.done;

    return (
        <section
            ref={setNodeRef}
            className={cx(s.day, day.isToday && s.today, day.isPast && s.past, isOver && s.over)}
            aria-label={`${day.name} ${day.dayNum}`}
        >
            <header className={s.dayHead}>
                <div className={s.dayNameRow}>
                    <span className={s.dayName}>{day.isToday ? 'hoy' : day.name}</span>
                    {day.tasks.length > 0 &&
                        (day.isPast && pending > 0 ? (
                            <span className={s.tallyLate}>{pending} sin hacer</span>
                        ) : (
                            <span className={cx(s.tally, pending === 0 && s.tallyDone)}>
                                {day.done} de {day.tasks.length}
                            </span>
                        ))}
                </div>
                <div className={s.dayNumRow}>
                    <span className={cx('pl-display', s.dayNum, day.isToday && 'pl-marker')}>{day.dayNum}</span>
                    {day.monthShort && <span className={s.month}>{day.monthShort}</span>}
                </div>

                <div
                    className={s.ribbon}
                    role="img"
                    aria-label={
                        day.busy.length === 0 ? 'Sin clases ni eventos con hora' : day.busy.map((b) => `${b.title} ${b.label}`).join(', ')
                    }
                >
                    {day.busy.map((b) => {
                        const from = Math.max(b.from, RIBBON_START);
                        const to = Math.min(b.to, RIBBON_END);
                        if (to <= from) return null;
                        return (
                            <span
                                key={b.key}
                                className={cx(s.segment, b.kind === 'event' && s.segmentEvent)}
                                title={`${b.title}, ${b.label}`}
                                style={
                                    {
                                        ...hueVars(b.hue),
                                        left: `${((from - RIBBON_START) / (RIBBON_END - RIBBON_START)) * 100}%`,
                                        width: `${((to - from) / (RIBBON_END - RIBBON_START)) * 100}%`,
                                    } as CSSProperties
                                }
                            />
                        );
                    })}
                    {day.dues.map((d) => {
                        const at = timeToMinutes(d.time);
                        if (at < RIBBON_START || at > RIBBON_END) return null;
                        return (
                            <span
                                key={d.id}
                                className={s.dueTick}
                                title={`Entrega: ${d.title}, ${d.time}`}
                                style={{ left: `${((at - RIBBON_START) / (RIBBON_END - RIBBON_START)) * 100}%` }}
                            />
                        );
                    })}
                    {day.isToday && nowMinutes !== null && nowMinutes > RIBBON_START && nowMinutes < RIBBON_END && (
                        <span
                            className={s.nowTick}
                            style={{ left: `${((nowMinutes - RIBBON_START) / (RIBBON_END - RIBBON_START)) * 100}%` }}
                        />
                    )}
                </div>
                <div className={s.free} title="Horas sin clases ni eventos entre las 8:00 y las 22:00">
                    {day.freeHours === 0 ? 'Sin horas libres' : `${formatHours(day.freeHours)} h libres`}
                </div>

                {(day.dues.length > 0 || day.allDay.length > 0) && (
                    <ul className={s.notes}>
                        {day.dues.map((d) => (
                            <li key={d.id}>
                                <button
                                    type="button"
                                    className={s.due}
                                    style={hueVars(d.hue) as CSSProperties}
                                    onClick={() => openEventModalEdit(d.id)}
                                >
                                    <span className={s.dueTime}>{d.time}</span>
                                    <span className={s.noteTitle}>{d.title}</span>
                                </button>
                            </li>
                        ))}
                        {day.allDay.map((n) => (
                            <li key={n.id}>
                                <button
                                    type="button"
                                    className={s.allDay}
                                    style={hueVars(n.hue) as CSSProperties}
                                    onClick={() => openEventModalEdit(n.id)}
                                >
                                    <span className={s.noteTitle}>{n.title}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </header>

            <div className={s.dayBody}>
                {day.tasks.length > 0 && (
                    <ul className={s.stack}>
                        {day.tasks.map((t) => (
                            <li key={t.id}>
                                <PlannerTaskCard task={t} category={categoryById(categories, t.categoryId)!} today={today} />
                            </li>
                        ))}
                    </ul>
                )}
                <button
                    type="button"
                    className={s.addTask}
                    onClick={() => openTaskModalNew(null, day.iso)}
                    aria-label={`Nueva tarea para el ${day.name} ${day.dayNum}`}
                >
                    <span aria-hidden="true">+</span> Tarea
                </button>
            </div>
        </section>
    );
}
