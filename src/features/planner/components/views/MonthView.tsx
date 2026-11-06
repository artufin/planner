'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type RefObject } from 'react';
import { useDndMonitor } from '@dnd-kit/core';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useEvents } from '@/lib/api/events';
import { useTasks, useUpdateTask } from '@/lib/api/tasks';
import { cx, hueVars } from '@planner/ui';
import { MONTH_NAMES, NO_CATEGORY_LABEL } from '../../constants';
import {
    categoryById,
    compareByDeadline,
    dateToInput,
    eventsForDate,
    getMonthAnchor,
    inputToDate,
    isDeadlineEvent,
    isOvernightEvent,
    isUntimedEvent,
    mondayOfWeek,
    sameDate,
    tasksForDate,
    timeToMinutes,
} from '../../utils';
import { useToday } from '../../useToday';
import { toast } from '../../toast/toast';
import {
    useActiveDrag,
    usePlannerDraggable,
    usePlannerDroppable,
    type DayTarget,
    type EventDrag,
    type TaskDrag,
} from '../../dnd';
import { taskDeadline } from '../PlannerTaskCard';
import type { Category, PlannerEvent, PlannerTask } from '@/lib/api/types';
import s from './MonthView.module.css';

/** Sentence-case weekday names — the shared WEEKDAY_LABELS constant is all-caps. */
const WEEKDAY_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const WEEKDAY_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

/** Vertical budget of a cell, in px — must match MonthView.module.css (padding + head, chip height + gap). */
const CELL_CHROME = 4 + 30 + 4;
const CHIP_PITCH = 18 + 2;

/** untimed = no times at all; deadline = only an end time ("entrega"); timed = has a start. */
type ChipKind = 'untimed' | 'timed' | 'deadline';

interface EventEntry {
    type: 'event';
    event: PlannerEvent;
    hue: number | null;
    kind: ChipKind;
    /** What the compact chip shows: the start time, or the due time for a deadline. */
    time: string | null;
    /** Spoken name and hover text, with the time and category spelled out. */
    label: string;
    sortKey: number;
}

interface TaskEntry {
    type: 'task';
    task: PlannerTask;
    hue: number;
    label: string;
    /** Not done and either overdue or left behind on a past day — written in red pen. */
    late: boolean;
}

type Entry = EventEntry | TaskEntry;

interface Cell {
    date: Date;
    dayNum: number;
    dateIso: string;
    col: number;
    inMonth: boolean;
    isToday: boolean;
    longDate: string;
    /** Events first (by time), then pending tasks, then the ones already done. */
    entries: Entry[];
}

interface Week {
    cells: Cell[];
}

/** What a chip can ask the view to do. */
interface ChipActions {
    openEvent: (id: string) => void;
    openTask: (id: string) => void;
    toggleTask: (task: PlannerTask) => void;
}

function dayAndMonth(iso: string): string {
    const { m, d } = inputToDate(iso);
    return `${d} de ${MONTH_NAMES[m]}`;
}

function toEventEntry(ev: PlannerEvent, categories: Category[]): EventEntry {
    const category = categoryById(categories, ev.categoryId);
    const categoryName = category?.name ?? NO_CATEGORY_LABEL;
    const base = { type: 'event' as const, event: ev, hue: category?.hue ?? null };
    if (isUntimedEvent(ev)) {
        return { ...base, kind: 'untimed', time: null, label: `${ev.title}, sin hora, ${categoryName}`, sortKey: -1 };
    }
    if (isDeadlineEvent(ev)) {
        return {
            ...base,
            kind: 'deadline',
            time: ev.end,
            label: `Entrega: ${ev.title}, a las ${ev.end}, ${categoryName}`,
            sortKey: timeToMinutes(ev.end),
        };
    }
    const when = !ev.end
        ? `a las ${ev.start}`
        : isOvernightEvent(ev)
          ? `desde las ${ev.start} hasta el ${dayAndMonth(ev.endDate)} a las ${ev.end}`
          : `de ${ev.start} a ${ev.end}`;
    return { ...base, kind: 'timed', time: ev.start, label: `${ev.title}, ${when}, ${categoryName}`, sortKey: timeToMinutes(ev.start) };
}

function toTaskEntry(task: PlannerTask, category: Category, today: Date, todayIso: string): TaskEntry {
    const deadline = taskDeadline(task, today);
    const leftBehind = !task.done && task.assignedDate !== null && task.assignedDate < todayIso;
    const parts = [`Tarea: ${task.title}`];
    if (task.start) parts.push(task.end ? `de ${task.start} a ${task.end}` : `a las ${task.start}`);
    if (task.done) parts.push('hecha');
    else {
        if (leftBehind) parts.push('sin hacer');
        if (deadline) parts.push(deadline.label);
    }
    parts.push(category.name);
    return {
        type: 'task',
        task,
        hue: category.hue,
        label: parts.join(', '),
        late: !task.done && (leftBehind || deadline?.tone === 'overdue'),
    };
}

function compareTasks(a: PlannerTask, b: PlannerTask): number {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const byTime = (a.start ? timeToMinutes(a.start) : 9999) - (b.start ? timeToMinutes(b.start) : 9999);
    return byTime || compareByDeadline(a, b);
}

function buildMonthWeeks(
    categories: Category[],
    events: PlannerEvent[],
    tasks: PlannerTask[],
    today: Date,
    monthOffset: number,
): Week[] {
    const md = getMonthAnchor(today, monthOffset);
    const year = md.getFullYear();
    const month = md.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - startWeekday);
    const todayIso = dateToInput(today.getFullYear(), today.getMonth(), today.getDate());

    const weeks: Week[] = [];
    for (let w = 0; w < 6; w++) {
        const cells: Cell[] = [];
        for (let col = 0; col < 7; col++) {
            const dt = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + w * 7 + col);
            const dateIso = dateToInput(dt.getFullYear(), dt.getMonth(), dt.getDate());
            /** The month grid has no multi-day display: an overnight event shows on its start day only. */
            const dayEvents = eventsForDate(events, categories, dateIso)
                .filter((ev) => ev.startDate === dateIso)
                .map((ev) => toEventEntry(ev, categories))
                .sort((a, b) => a.sortKey - b.sortKey);
            const dayTasks = tasksForDate(tasks, categories, dateIso)
                .sort(compareTasks)
                .map((t) => toTaskEntry(t, categoryById(categories, t.categoryId)!, today, todayIso));
            cells.push({
                date: dt,
                dayNum: dt.getDate(),
                dateIso,
                col,
                inMonth: dt.getMonth() === month,
                isToday: sameDate(dt, today),
                longDate: `${WEEKDAY_LONG[col]} ${dt.getDate()} de ${MONTH_NAMES[dt.getMonth()]}`,
                entries: [...dayEvents, ...dayTasks],
            });
        }
        weeks.push({ cells });
    }
    return weeks;
}

function entryKey(entry: Entry): string {
    return entry.type === 'event' ? `event:${entry.event.id}` : `task:${entry.task.id}`;
}

/** "+3 más" under some chips; "4 eventos" / "4 tareas" when not even one chip fits. */
function moreLabel(hidden: Entry[], anyVisible: boolean): string {
    if (anyVisible) return `+${hidden.length} más`;
    if (hidden.every((e) => e.type === 'event')) return `${hidden.length} eventos`;
    if (hidden.every((e) => e.type === 'task')) return `${hidden.length} tareas`;
    return `Ver ${hidden.length}`;
}

/**
 * Chips open on Enter, like any button; Space picks them up for a keyboard
 * drag. The drag listeners would otherwise take both keys.
 */
function enterOpens<P extends object>(props: P): P {
    const startDrag = (props as { onKeyDown?: (e: KeyboardEvent) => void }).onKeyDown;
    if (!startDrag) return props;
    return {
        ...props,
        onKeyDown: (e: KeyboardEvent) => {
            if (e.key !== 'Enter') startDrag(e);
        },
    };
}

function PlusIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}

interface ChipProps<E extends Entry> {
    entry: E;
    date: string;
    /** The "+N más" list repeats chips that are also in the cell; their drag ids must differ. */
    inPopover: boolean;
    actions: ChipActions;
    hintId: string;
}

function EventChip({ entry, date, inPopover, actions, hintId }: ChipProps<EventEntry>) {
    const ev = entry.event;
    const item: EventDrag = { kind: 'event', event: ev, fromDate: date, label: ev.title, hue: entry.hue };
    const { setNodeRef, handleProps, isDragging } = usePlannerDraggable(
        `event:${ev.id}:${date}${inPopover ? ':popover' : ''}`,
        item,
    );
    const kindClass = entry.kind === 'untimed' ? s.chipUntimed : entry.kind === 'deadline' ? s.chipDeadline : s.chipTimed;
    return (
        <button
            ref={setNodeRef}
            type="button"
            {...enterOpens(handleProps)}
            aria-describedby={hintId}
            className={cx(s.chip, kindClass, isDragging && s.chipLifted)}
            style={hueVars(entry.hue) as CSSProperties}
            title={entry.label}
            aria-label={entry.label}
            onClick={() => actions.openEvent(ev.id)}
            onDoubleClick={(e) => e.stopPropagation()}
        >
            {entry.kind === 'timed' && <span className={s.dot} aria-hidden="true" />}
            {entry.kind === 'deadline' && <span className={s.diamond} aria-hidden="true" />}
            {entry.time && <span className={s.chipTime}>{entry.time}</span>}
            <span className={s.chipTitle}>{ev.title}</span>
        </button>
    );
}

function TaskChip({ entry, inPopover, actions, hintId }: ChipProps<TaskEntry>) {
    const task = entry.task;
    const item: TaskDrag = { kind: 'task', task, label: task.title, hue: entry.hue };
    const { setNodeRef, handleProps, isDragging } = usePlannerDraggable(`task:${task.id}${inPopover ? ':popover' : ''}`, item);
    return (
        <div
            ref={setNodeRef}
            className={cx(s.chip, s.chipTask, task.done && s.chipDone, entry.late && s.chipLate, isDragging && s.chipLifted)}
            style={hueVars(entry.hue) as CSSProperties}
            onDoubleClick={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                role="checkbox"
                aria-checked={task.done}
                aria-label={task.done ? `Marcar ${task.title} como pendiente` : `Marcar ${task.title} como hecha`}
                className={s.check}
                onClick={() => actions.toggleTask(task)}
            >
                <span className={s.checkBox} aria-hidden="true">
                    <svg className={s.tick} viewBox="0 0 12 12">
                        <path d="M2.5 6.5 L5 9 L9.5 3" pathLength={16} />
                    </svg>
                </span>
            </button>
            {/* The title is the drag handle, so the checkbox keeps its own click. */}
            <button
                type="button"
                {...enterOpens(handleProps)}
                aria-describedby={hintId}
                className={s.taskOpen}
                title={entry.label}
                aria-label={entry.label}
                onClick={() => actions.openTask(task.id)}
            >
                {task.start && !task.done && <span className={s.chipTime}>{task.start}</span>}
                <span className={s.chipTitle}>{task.title}</span>
            </button>
        </div>
    );
}

function EntryChip(props: ChipProps<Entry>) {
    const { entry } = props;
    return entry.type === 'event' ? <EventChip {...props} entry={entry} /> : <TaskChip {...props} entry={entry} />;
}

interface MonthCellProps {
    cell: Cell;
    weekIndex: number;
    capacity: number;
    isOpen: boolean;
    popoverRef: RefObject<HTMLDivElement | null>;
    onToggleMore: (dateIso: string, trigger: HTMLButtonElement) => void;
    onClosePopover: () => void;
    onNewEvent: (dateIso: string) => void;
    onShowWeek: (date: Date) => void;
    actions: ChipActions;
    hintId: string;
}

/** One day: a drop target for anything dragged onto it, with its chips and the "+N más" list. */
function MonthCell({
    cell,
    weekIndex,
    capacity,
    isOpen,
    popoverRef,
    onToggleMore,
    onClosePopover,
    onNewEvent,
    onShowWeek,
    actions,
    hintId,
}: MonthCellProps) {
    const target: DayTarget = { kind: 'day', date: cell.dateIso, label: cell.longDate };
    const { setNodeRef, isOver } = usePlannerDroppable(`month-day:${cell.dateIso}`, target);

    const overflowing = cell.entries.length > capacity;
    const visible = overflowing ? cell.entries.slice(0, capacity - 1) : cell.entries;
    const hidden = cell.entries.slice(visible.length);

    return (
        <div
            ref={setNodeRef}
            className={cx(s.cell, !cell.inMonth && s.cellOut, cell.isToday && s.cellToday, isOver && s.cellOver)}
            onDoubleClick={() => onNewEvent(cell.dateIso)}
        >
            <div className={s.cellHead}>
                <span
                    className={cx('pl-display', s.dayNum, cell.isToday && 'pl-marker')}
                    aria-label={cell.isToday ? `Hoy, ${cell.longDate}` : cell.longDate}
                >
                    {cell.dayNum}
                </span>
                <button
                    type="button"
                    className={s.addBtn}
                    aria-label={`Nuevo evento el ${cell.longDate}`}
                    title="Nuevo evento"
                    onClick={() => onNewEvent(cell.dateIso)}
                    onDoubleClick={(e) => e.stopPropagation()}
                >
                    <PlusIcon />
                </button>
            </div>
            <div className={s.chips}>
                {visible.map((entry) => (
                    <EntryChip
                        key={entryKey(entry)}
                        entry={entry}
                        date={cell.dateIso}
                        inPopover={false}
                        actions={actions}
                        hintId={hintId}
                    />
                ))}
                {overflowing && (
                    <button
                        type="button"
                        className={cx(s.more, isOpen && s.moreOpen)}
                        aria-expanded={isOpen}
                        aria-haspopup="dialog"
                        onClick={(e) => onToggleMore(cell.dateIso, e.currentTarget)}
                        onDoubleClick={(e) => e.stopPropagation()}
                    >
                        {moreLabel(hidden, visible.length > 0)}
                    </button>
                )}
            </div>
            {isOpen && (
                <div
                    ref={popoverRef}
                    role="dialog"
                    aria-label={cell.longDate}
                    tabIndex={-1}
                    className={cx(s.popover, cell.col >= 5 && s.popoverRight, weekIndex >= 3 && s.popoverUp)}
                    onDoubleClick={(e) => e.stopPropagation()}
                >
                    <div className={s.popHead}>
                        <span className={cx('pl-display', s.popNum, cell.isToday && 'pl-marker')}>{cell.dayNum}</span>
                        <span className={s.popDate}>
                            {WEEKDAY_LONG[cell.col]}
                            <span className={s.popMonth}>
                                {MONTH_NAMES[cell.date.getMonth()]} {cell.date.getFullYear()}
                            </span>
                        </span>
                        <button type="button" className={s.popClose} aria-label="Cerrar" onClick={onClosePopover}>
                            <CloseIcon />
                        </button>
                    </div>
                    <div className={s.popList}>
                        {cell.entries.map((entry) => (
                            <EntryChip
                                key={entryKey(entry)}
                                entry={entry}
                                date={cell.dateIso}
                                inPopover
                                actions={actions}
                                hintId={hintId}
                            />
                        ))}
                    </div>
                    <div className={s.popFoot}>
                        <button type="button" className={s.popWeekBtn} onClick={() => onShowWeek(cell.date)}>
                            Ver la semana
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MonthView() {
    const { data: categories = [] } = useCategories();
    const { data: events = [] } = useEvents();
    const { data: tasks = [] } = useTasks();
    const updateTask = useUpdateTask();
    const monthOffset = usePlannerStore((st) => st.monthOffset);
    const openEventModalNew = usePlannerStore((st) => st.openEventModalNew);
    const openEventModalEdit = usePlannerStore((st) => st.openEventModalEdit);
    const openTaskModalEdit = usePlannerStore((st) => st.openTaskModalEdit);
    const today = useToday();
    const dragging = useActiveDrag() !== null;
    const hintId = useId();

    // React Compiler memoizes this derivation; no manual useMemo needed.
    const weeks = buildMonthWeeks(categories, events, tasks, today, monthOffset);

    /** How many chip rows fit in a cell depends on the viewport — measure a row instead of hardcoding two. */
    const weeksRef = useRef<HTMLDivElement>(null);
    const [rowHeight, setRowHeight] = useState<number | null>(null);
    useEffect(() => {
        const el = weeksRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => setRowHeight(entry.contentRect.height / 6));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const capacity = rowHeight === null ? 3 : Math.max(1, Math.floor((rowHeight - CELL_CHROME + 2) / CHIP_PITCH));

    /** The "+N más" popover: one open day at a time, closed by Escape, a click outside, or its close button. */
    const [openDay, setOpenDay] = useState<string | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    useEffect(() => {
        if (!openDay) return;
        popoverRef.current?.focus();
        const onPointerDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
            setOpenDay(null);
        };
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            setOpenDay(null);
            triggerRef.current?.focus();
        };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [openDay]);

    /**
     * A chip dragged out of the popover leaves it hidden (it would cover the
     * days around it) for the length of the drag; once dropped, it closes.
     */
    useDndMonitor({
        onDragEnd: () => setOpenDay(null),
        onDragCancel: () => setOpenDay(null),
    });

    const toggleMore = (dateIso: string, trigger: HTMLButtonElement) => {
        if (openDay === dateIso) {
            setOpenDay(null);
            return;
        }
        triggerRef.current = trigger;
        setOpenDay(dateIso);
    };

    const closePopover = () => {
        setOpenDay(null);
        triggerRef.current?.focus();
    };

    const actions: ChipActions = {
        openEvent: (id) => {
            setOpenDay(null);
            openEventModalEdit(id);
        },
        openTask: (id) => {
            setOpenDay(null);
            openTaskModalEdit(id);
        },
        toggleTask: (task) => updateTask.mutate({ id: task.id, done: !task.done }, { onError: toast.error }),
    };

    const newEvent = (dateIso: string) => openEventModalNew(null, dateIso);

    /** Jumps to the week view showing `date`. The store's goToWeek takes no offset, so set both fields directly. */
    const showWeekOf = (date: Date) => {
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const weekOffset = Math.round((mondayOfWeek(date).getTime() - mondayOfWeek(todayMidnight).getTime()) / (7 * 86400000));
        setOpenDay(null);
        usePlannerStore.setState({ view: 'week', weekOffset });
    };

    return (
        <div className={cx(s.root, dragging && s.dragging)}>
            <p id={hintId} className={s.srOnly}>
                Enter lo abre. Para llevarlo a otro día, presiona espacio, muévelo con las flechas y vuelve a presionar espacio
                para soltarlo. Escape cancela.
            </p>
            <div className={s.weekdays}>
                {WEEKDAY_SHORT.map((wd, i) => (
                    <div key={wd} className={cx(s.weekday, i >= 5 && s.weekdayWeekend)}>
                        {wd}
                    </div>
                ))}
            </div>
            <div ref={weeksRef} className={s.weeks}>
                {weeks.map((week, wi) => (
                    <div key={wi} className={s.week}>
                        {week.cells.map((cell) => (
                            <MonthCell
                                key={cell.dateIso}
                                cell={cell}
                                weekIndex={wi}
                                capacity={capacity}
                                isOpen={openDay === cell.dateIso}
                                popoverRef={popoverRef}
                                onToggleMore={toggleMore}
                                onClosePopover={closePopover}
                                onNewEvent={newEvent}
                                onShowWeek={showWeekOf}
                                actions={actions}
                                hintId={hintId}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
