'use client';

import { useMemo, type CSSProperties } from 'react';
import { Button, cx, hueVars } from '@/components/ui';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useGroups } from '@/lib/api/groups';
import { useSchedule, useScheduleExceptions } from '@/lib/api/schedule';
import { useEvents } from '@/lib/api/events';
import { useTasks, useUpdateTask } from '@/lib/api/tasks';
import type { Category, PlannerEvent, PlannerTask, ScheduleItem } from '@/lib/api/types';
import { MONTH_NAMES } from '../../constants';
import { categoryById, compareByDeadline, deadlineInfo, inputToDate, isDeadlineEvent, scheduleTitleFor, timeToMinutes } from '../../utils';
import { useNowMinutes, useToday } from '../../useToday';
import {
    WEEK_ORDER,
    WEEKDAY_LONG,
    WEEKDAY_SHORT,
    capitalize,
    countOverdue,
    daysFrom,
    findNextClass,
    findNextDeliverable,
    plural,
    relativeDay,
    shortDate,
    todayIso,
} from './subjectInsights';
import { toast } from '../../toast/toast';
import s from './CategoryView.module.css';

export default function CategoryView() {
    const { data: categories = [], isSuccess: categoriesLoaded } = useCategories();
    const goToCategoriesList = usePlannerStore((st) => st.goToCategoriesList);
    const { data: groups = [] } = useGroups();
    const selectedCategoryId = usePlannerStore((st) => st.selectedCategoryId);
    const { data: schedule = [] } = useSchedule();
    const { data: exceptions = [] } = useScheduleExceptions();
    const { data: events = [] } = useEvents();
    const { data: tasks = [] } = useTasks();
    const openScheduleModalNew = usePlannerStore((st) => st.openScheduleModalNew);
    const openEventModalNew = usePlannerStore((st) => st.openEventModalNew);
    const openTaskModalNew = usePlannerStore((st) => st.openTaskModalNew);
    const today = useToday();
    const nowMinutes = useNowMinutes();

    const category = categoryById(categories, selectedCategoryId);
    const group = groups.find((g) => g.id === category?.groupId);

    const slots = useMemo(() => schedule.filter((x) => x.categoryId === selectedCategoryId), [schedule, selectedCategoryId]);
    const catEvents = useMemo(() => events.filter((e) => e.categoryId === selectedCategoryId), [events, selectedCategoryId]);
    const catTasks = useMemo(() => tasks.filter((t) => t.categoryId === selectedCategoryId), [tasks, selectedCategoryId]);

    const nextClass = useMemo(() => findNextClass(slots, exceptions, today, nowMinutes), [slots, exceptions, today, nowMinutes]);
    const nextDue = useMemo(() => findNextDeliverable(catEvents, catTasks, today), [catEvents, catTasks, today]);
    const pending = catTasks.filter((t) => !t.done).length;
    const overdue = countOverdue(catTasks, today);

    if (!category) {
        // Reached through an old link or the back button after it was deleted.
        if (!categoriesLoaded) return null;
        return (
            <div className={s.page}>
                <div className={s.empty}>
                    <p>Esta categoría ya no existe.</p>
                    <Button variant="secondary" size="sm" onClick={goToCategoriesList}>
                        Ver categorías
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={s.page} style={hueVars(category.hue) as CSSProperties}>
            <header className={s.header}>
                <span className={s.headerTab} aria-hidden="true" />
                <p className={s.groupName}>{group ? group.name : 'Sin grupo'}</p>
                <h1 className={cx('pl-display', s.title)}>{category.name}</h1>
                <dl className={s.facts}>
                    <div className={s.fact}>
                        <dt>Pendientes</dt>
                        <dd className={cx('pl-display', s.factNumber)}>{pending}</dd>
                    </div>
                    {overdue > 0 && (
                        <div className={cx(s.fact, s.factDanger)}>
                            <dt>Atrasadas</dt>
                            <dd className={cx('pl-display', s.factNumber)}>{overdue}</dd>
                        </div>
                    )}
                    <div className={s.fact}>
                        <dt>Próxima clase</dt>
                        <dd className={s.factText}>
                            {nextClass ? `${capitalize(relativeDay(nextClass.dateIso, today))}, ${nextClass.start}` : 'Sin clases próximas'}
                        </dd>
                    </div>
                    <div className={s.fact}>
                        <dt>Próxima entrega</dt>
                        <dd className={s.factText}>
                            {nextDue ? (
                                <>
                                    {capitalize(relativeDay(nextDue.dateIso, today))}
                                    <span className={s.factSub}>{nextDue.title}</span>
                                </>
                            ) : (
                                'Nada a la vista'
                            )}
                        </dd>
                    </div>
                </dl>
            </header>

            <section className={s.section} aria-labelledby="cat-schedule">
                <div className={s.sectionHead}>
                    <h2 id="cat-schedule" className={s.sectionTitle}>
                        Horario semanal
                    </h2>
                    {slots.length > 0 && (
                        <Button variant="secondary" size="sm" onClick={() => openScheduleModalNew(category.id)}>
                            Agregar clase
                        </Button>
                    )}
                </div>
                {slots.length > 0 ? (
                    <Timetable slots={slots} category={category} today={today} />
                ) : (
                    <div className={s.empty}>
                        <p>Todavía no hay clases de {category.name} en tu horario. Agrégalas y aparecerán cada semana en el calendario.</p>
                        <Button variant="secondary" size="sm" onClick={() => openScheduleModalNew(category.id)}>
                            Agregar clase
                        </Button>
                    </div>
                )}
            </section>

            <div className={s.columns}>
                <section className={s.section} aria-labelledby="cat-tasks">
                    <div className={s.sectionHead}>
                        <h2 id="cat-tasks" className={s.sectionTitle}>
                            Tareas
                            {catTasks.length > 0 && (
                                <span className={s.sectionCount}>
                                    {pending} de {catTasks.length} {pending === 1 ? 'pendiente' : 'pendientes'}
                                </span>
                            )}
                        </h2>
                        <Button size="sm" onClick={() => openTaskModalNew(category.id)}>
                            Nueva tarea
                        </Button>
                    </div>
                    <TaskList tasks={catTasks} events={catEvents} today={today} categoryName={category.name} />
                </section>

                <section className={s.section} aria-labelledby="cat-events">
                    <div className={s.sectionHead}>
                        <h2 id="cat-events" className={s.sectionTitle}>
                            Eventos
                        </h2>
                        <Button variant="secondary" size="sm" onClick={() => openEventModalNew(category.id)}>
                            Agregar evento
                        </Button>
                    </div>
                    <EventList events={catEvents} today={today} />
                </section>
            </div>
        </div>
    );
}

/* ---- weekly timetable strip ------------------------------------------------ */

interface PlacedSlot {
    slot: ScheduleItem;
    lane: number;
    lanes: number;
}

/** Splits a day's classes into side-by-side lanes so overlapping ones don't cover each other. */
function placeDay(daySlots: ScheduleItem[]): PlacedSlot[] {
    const sorted = [...daySlots].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
    const laneEnds: number[] = [];
    const placed = sorted.map((slot) => {
        const start = timeToMinutes(slot.start);
        let lane = laneEnds.findIndex((end) => end <= start);
        if (lane === -1) lane = laneEnds.length;
        laneEnds[lane] = timeToMinutes(slot.end);
        return { slot, lane, lanes: 0 };
    });
    return placed.map((p) => ({ ...p, lanes: laneEnds.length }));
}

function Timetable({ slots, category, today }: { slots: ScheduleItem[]; category: Category; today: Date }) {
    const openScheduleModalEdit = usePlannerStore((st) => st.openScheduleModalEdit);
    const todayStr = todayIso(today);

    // At least three hours wide, never past midnight on either side.
    const earliest = Math.floor(Math.min(...slots.map((x) => timeToMinutes(x.start))) / 60);
    const latest = Math.ceil(Math.max(...slots.map((x) => timeToMinutes(x.end))) / 60);
    const toHour = Math.min(24, Math.max(latest, earliest + 3));
    const fromHour = Math.max(0, Math.min(earliest, toHour - 3));
    const span = (toHour - fromHour) * 60;
    const pct = (minutes: number) => ((minutes - fromHour * 60) / span) * 100;
    const step = toHour - fromHour > 10 ? 2 : 1;
    const hours: number[] = [];
    for (let h = fromHour; h <= toHour; h += step) hours.push(h);

    // Weekends only get a row when something happens on them.
    const days = WEEK_ORDER.filter((d) => (d !== 0 && d !== 6) || slots.some((x) => x.weekday === d));

    return (
        <div className={s.timetable}>
            <div className={s.ttAxis} aria-hidden="true">
                {hours.map((h) => (
                    <span key={h} className={s.ttHour} style={{ left: `${pct(h * 60)}%` }}>
                        {h}h
                    </span>
                ))}
            </div>
            {days.map((d) => {
                const isToday = today.getDay() === d;
                const placed = placeDay(slots.filter((x) => x.weekday === d));
                return (
                    <div key={d} className={s.ttRow}>
                        <span className={s.ttDay}>
                            <span className={cx(isToday && 'pl-marker')}>{capitalize(WEEKDAY_SHORT[d])}</span>
                        </span>
                        <div className={s.ttTrack}>
                            {hours.map((h) => (
                                <span key={h} className={s.ttLine} style={{ left: `${pct(h * 60)}%` }} aria-hidden="true" />
                            ))}
                            {placed.map(({ slot, lane, lanes }) => {
                                const title = scheduleTitleFor(slot, category);
                                const custom = slot.title.trim() !== '';
                                const ended = slot.endDate !== null && slot.endDate < todayStr;
                                const label =
                                    `Editar clase: ${WEEKDAY_LONG[d]} de ${slot.start} a ${slot.end}` +
                                    (custom ? `, ${title}` : '') +
                                    (slot.interval === 2 ? ', cada dos semanas' : '') +
                                    (ended ? ', ya terminó' : '');
                                return (
                                    <button
                                        key={slot.id}
                                        type="button"
                                        className={cx(s.ttBlock, slot.interval === 2 && s.ttBiweekly, ended && s.ttEnded)}
                                        style={{
                                            left: `${pct(timeToMinutes(slot.start))}%`,
                                            width: `${pct(timeToMinutes(slot.end)) - pct(timeToMinutes(slot.start))}%`,
                                            top: `calc(${(lane / lanes) * 100}% + 3px)`,
                                            height: `calc(${100 / lanes}% - 6px)`,
                                        }}
                                        title={`${title}, ${slot.start}–${slot.end}${slot.interval === 2 ? ' (cada dos semanas)' : ''}`}
                                        aria-label={label}
                                        onClick={() => openScheduleModalEdit(slot.id)}
                                    >
                                        <span className={s.ttTime}>
                                            {slot.start}–{slot.end}
                                        </span>
                                        {custom && <span className={s.ttTitle}>{title}</span>}
                                        {slot.interval === 2 && <span className={s.ttTitle}>c/2 sem</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* ---- tasks ------------------------------------------------------------------ */

function sortPending(a: PlannerTask, b: PlannerTask): number {
    const byDeadline = compareByDeadline(a, b);
    if (byDeadline !== 0) return byDeadline;
    if (a.assignedDate === b.assignedDate) return 0;
    if (a.assignedDate === null) return 1;
    if (b.assignedDate === null) return -1;
    return a.assignedDate.localeCompare(b.assignedDate);
}

function TaskList({ tasks, events, today, categoryName }: { tasks: PlannerTask[]; events: PlannerEvent[]; today: Date; categoryName: string }) {
    const pending = useMemo(() => tasks.filter((t) => !t.done).sort(sortPending), [tasks]);
    const done = useMemo(() => tasks.filter((t) => t.done), [tasks]);

    if (tasks.length === 0) {
        return (
            <div className={s.empty}>
                <p>No hay tareas de {categoryName}. Anota la próxima lectura, ejercicio o entrega para no perderle la pista.</p>
            </div>
        );
    }

    return (
        <>
            {pending.length > 0 ? (
                <ul className={s.list}>
                    {pending.map((t) => (
                        <TaskRow key={t.id} task={t} events={events} today={today} />
                    ))}
                </ul>
            ) : (
                <p className={s.allDone}>
                    <span className="pl-marker">Todo al día.</span> No te queda nada pendiente en esta categoría.
                </p>
            )}
            {done.length > 0 && (
                <details className={s.doneGroup}>
                    <summary>{plural(done.length, 'hecha', 'hechas')}</summary>
                    <ul className={s.list}>
                        {done.map((t) => (
                            <TaskRow key={t.id} task={t} events={events} today={today} />
                        ))}
                    </ul>
                </details>
            )}
        </>
    );
}

function TaskRow({ task, events, today }: { task: PlannerTask; events: PlannerEvent[]; today: Date }) {
    const updateTask = useUpdateTask();
    const openTaskModalEdit = usePlannerStore((st) => st.openTaskModalEdit);
    const linkedEvent = task.eventId ? events.find((e) => e.id === task.eventId) : undefined;
    const deadline = task.deadline && !task.done ? deadlineInfo(task.deadline, today) : null;

    let when = 'Sin día asignado';
    if (task.assignedDate) {
        when = capitalize(relativeDay(task.assignedDate, today)) + (task.start ? `, ${task.start}` : '');
    }

    return (
        <li className={cx(s.task, task.done && s.taskDone)}>
            <button
                type="button"
                role="checkbox"
                aria-checked={task.done}
                aria-label={task.done ? `Marcar «${task.title}» como pendiente` : `Marcar «${task.title}» como hecha`}
                className={s.check}
                onClick={() => updateTask.mutate({ id: task.id, done: !task.done }, { onError: toast.error })}
            >
                <svg viewBox="0 0 16 16" aria-hidden="true" className={s.checkMark}>
                    <path d="M3.5 8.5l3 3 6-7" />
                </svg>
            </button>
            <button type="button" className={s.taskBody} onClick={() => openTaskModalEdit(task.id)}>
                <span className={s.taskTitle}>{task.title}</span>
                <span className={s.taskMeta}>
                    <span>{when}</span>
                    {deadline && (
                        <span className={cx(deadline.tone === 'overdue' && s.toneOverdue, deadline.tone === 'soon' && s.toneSoon)}>
                            {deadline.tone === 'overdue' ? `Venció el ${deadline.label}` : `Entrega ${deadline.label}`}
                        </span>
                    )}
                    {linkedEvent && <span className={s.chip}>{linkedEvent.title}</span>}
                </span>
            </button>
        </li>
    );
}

/* ---- events ----------------------------------------------------------------- */

function eventTimeLabel(e: PlannerEvent): string {
    if (e.start && e.end) return `${e.start}–${e.end}`;
    if (e.start) return `Desde las ${e.start}`;
    if (e.end) return `Hasta las ${e.end}`;
    return 'Todo el día';
}

function EventList({ events, today }: { events: PlannerEvent[]; today: Date }) {
    const todayStr = todayIso(today);
    const upcoming = useMemo(
        () => events.filter((e) => e.endDate >= todayStr).sort((a, b) => a.startDate.localeCompare(b.startDate) || timeToMinutes(a.start) - timeToMinutes(b.start)),
        [events, todayStr],
    );
    const past = useMemo(() => events.filter((e) => e.endDate < todayStr).sort((a, b) => b.startDate.localeCompare(a.startDate)), [events, todayStr]);

    if (events.length === 0) {
        return (
            <div className={s.empty}>
                <p>Sin eventos todavía. Agrega parciales, entregas o salidas de campo y los verás aquí y en el calendario.</p>
            </div>
        );
    }

    return (
        <>
            {upcoming.length > 0 ? (
                <ul className={s.list}>
                    {upcoming.map((e) => (
                        <EventRow key={e.id} event={e} today={today} />
                    ))}
                </ul>
            ) : (
                <p className={s.allDone}>No hay eventos por delante.</p>
            )}
            {past.length > 0 && (
                <details className={s.doneGroup}>
                    <summary>{plural(past.length, 'evento pasado', 'eventos pasados')}</summary>
                    <ul className={s.list}>
                        {past.map((e) => (
                            <EventRow key={e.id} event={e} today={today} past />
                        ))}
                    </ul>
                </details>
            )}
        </>
    );
}

function EventRow({ event, today, past = false }: { event: PlannerEvent; today: Date; past?: boolean }) {
    const openEventModalEdit = usePlannerStore((st) => st.openEventModalEdit);
    const { m, d } = inputToDate(event.startDate);
    const isToday = event.startDate <= todayIso(today) && event.endDate >= todayIso(today);
    const soon = !past && daysFrom(today, event.startDate) <= 2;
    const deadline = isDeadlineEvent(event);

    return (
        <li>
            <button type="button" className={cx(s.event, past && s.eventPast)} onClick={() => openEventModalEdit(event.id)}>
                <span className={cx(s.eventDate, isToday && s.eventDateToday)}>
                    <span className={cx('pl-display', s.eventDay)}>{d}</span>
                    <span className={s.eventMonth}>{MONTH_NAMES[m].slice(0, 3)}</span>
                </span>
                <span className={s.eventBody}>
                    <span className={s.eventTitle}>
                        {deadline && <span className={s.chip}>Entrega</span>}
                        {event.title}
                    </span>
                    <span className={s.taskMeta}>
                        {!past && soon && <span className={s.eventWhen}>{capitalize(relativeDay(event.startDate, today))}</span>}
                        <span>{eventTimeLabel(event)}</span>
                        {event.endDate !== event.startDate && <span>Termina el {shortDate(event.endDate)}</span>}
                        {event.location && <span>{event.location}</span>}
                    </span>
                </span>
            </button>
        </li>
    );
}
