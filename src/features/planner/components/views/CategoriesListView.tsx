'use client';

import { useMemo } from 'react';
import { Button, CategoryCard, SectionDivider, cx } from '@/components/ui';
import { usePlannerStore } from '../../store';
import { useGroups } from '@/lib/api/groups';
import { useCategories } from '@/lib/api/categories';
import { useTasks } from '@/lib/api/tasks';
import { useEvents } from '@/lib/api/events';
import { useSchedule, useScheduleExceptions } from '@/lib/api/schedule';
import type { Category } from '@/lib/api/types';
import { isDeadlineEvent, timeToMinutes } from '../../utils';
import { useNowMinutes, useToday } from '../../useToday';
import {
    WEEK_ORDER,
    WEEKDAY_LONG,
    capitalize,
    countOverdue,
    daysFrom,
    findNextClass,
    findNextDeliverable,
    plural,
    relativeDay,
    type Deliverable,
    type NextClass,
} from './subjectInsights';
import s from './CategoriesListView.module.css';

interface SubjectRow {
    category: Category;
    weekdaysLabel: string;
    nextClass: NextClass | null;
    nextDue: Deliverable | null;
    pending: number;
    overdue: number;
}

/** "Lunes y miércoles", "Martes, jueves y viernes" — the days a subject meets, Monday first. */
function weekdaysLabel(weekdays: number[]): string {
    const names = WEEK_ORDER.filter((d) => weekdays.includes(d)).map((d) => WEEKDAY_LONG[d]);
    if (names.length === 0) return 'Sin horario';
    if (names.length === 1) return capitalize(names[0]);
    return capitalize(`${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`);
}

export default function CategoriesListView() {
    const { data: groups = [] } = useGroups();
    const { data: categories = [], isPending: categoriesPending } = useCategories();
    const { data: tasks = [] } = useTasks();
    const { data: events = [] } = useEvents();
    const { data: schedule = [] } = useSchedule();
    const { data: exceptions = [] } = useScheduleExceptions();
    const selectCategory = usePlannerStore((st) => st.selectCategory);
    const openCategoryModalNew = usePlannerStore((st) => st.openCategoryModalNew);
    const today = useToday();
    const nowMinutes = useNowMinutes();

    const rows = useMemo(
        () =>
            categories.map((c): SubjectRow => {
                const slots = schedule.filter((x) => x.categoryId === c.id);
                const catTasks = tasks.filter((t) => t.categoryId === c.id);
                return {
                    category: c,
                    weekdaysLabel: weekdaysLabel(slots.map((x) => x.weekday)),
                    nextClass: findNextClass(slots, exceptions, today, nowMinutes),
                    nextDue: findNextDeliverable(
                        events.filter((e) => e.categoryId === c.id),
                        catTasks,
                        today,
                    ),
                    pending: catTasks.filter((t) => !t.done).length,
                    overdue: countOverdue(catTasks, today),
                };
            }),
        [categories, schedule, tasks, events, exceptions, today, nowMinutes],
    );

    const sections = useMemo(() => {
        const known = new Set(groups.map((g) => g.id));
        const out = groups
            .map((g) => ({ id: g.id, name: g.name, rows: rows.filter((r) => r.category.groupId === g.id) }))
            .filter((g) => g.rows.length > 0);
        const loose = rows.filter((r) => r.category.groupId === null || !known.has(r.category.groupId));
        if (loose.length > 0) out.push({ id: '__none', name: 'Sin grupo', rows: loose });
        return out;
    }, [groups, rows]);

    const totals = useMemo(() => {
        const dueThisWeek = rows.reduce((n, r) => {
            const catEvents = events.filter((e) => e.categoryId === r.category.id);
            const catTasks = tasks.filter((t) => t.categoryId === r.category.id);
            const due = [
                ...catEvents.filter(isDeadlineEvent).map((e) => e.endDate),
                ...catTasks.filter((t) => !t.done && t.deadline !== null).map((t) => t.deadline as string),
            ];
            return n + due.filter((iso) => daysFrom(today, iso) >= 0 && daysFrom(today, iso) < 7).length;
        }, 0);
        return {
            pending: rows.reduce((n, r) => n + r.pending, 0),
            overdue: rows.reduce((n, r) => n + r.overdue, 0),
            dueThisWeek,
        };
    }, [rows, events, tasks, today]);

    if (categoriesPending) return null;

    if (categories.length === 0) {
        return (
            <div className={s.page}>
                <div className={s.empty}>
                    <h2 className={cx('pl-display', s.emptyTitle)}>Tu cuaderno está en blanco</h2>
                    <p className={s.emptyText}>
                        Crea una categoría por cada materia y aquí verás de un vistazo su próxima clase, lo que hay que entregar y
                        las tareas que te quedan.
                    </p>
                    <Button onClick={openCategoryModalNew}>Crear la primera categoría</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={s.page}>
            <dl className={s.summary}>
                <div className={s.stat}>
                    <dt className={s.statLabel}>{totals.pending === 1 ? 'tarea pendiente' : 'tareas pendientes'}</dt>
                    <dd className={cx('pl-display', s.statValue)}>{totals.pending}</dd>
                </div>
                {totals.overdue > 0 && (
                    <div className={cx(s.stat, s.statDanger)}>
                        <dt className={s.statLabel}>{totals.overdue === 1 ? 'atrasada' : 'atrasadas'}</dt>
                        <dd className={cx('pl-display', s.statValue)}>{totals.overdue}</dd>
                    </div>
                )}
                <div className={s.stat}>
                    <dt className={s.statLabel}>{totals.dueThisWeek === 1 ? 'entrega en 7 días' : 'entregas en 7 días'}</dt>
                    <dd className={cx('pl-display', s.statValue)}>{totals.dueThisWeek}</dd>
                </div>
            </dl>

            {sections.map((sec) => (
                <section key={sec.id} className={s.group} aria-label={sec.name}>
                    <SectionDivider level={2} label={sec.name} aside={plural(sec.rows.length, 'categoría', 'categorías')} />
                    <div className={s.sheet}>
                        {sec.rows.map((r) => (
                            <CategoryCard
                                key={r.category.id}
                                variant="row"
                                name={r.category.name}
                                hue={r.category.hue}
                                meta={r.weekdaysLabel}
                                onClick={() => selectCategory(r.category.id)}
                                details={<SubjectFacts row={r} today={today} nowMinutes={nowMinutes} />}
                            />
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

/** The three facts on a subject row. Spans only — they render inside the row's button. */
function SubjectFacts({ row, today, nowMinutes }: { row: SubjectRow; today: Date; nowMinutes: number | null }) {
    const { nextClass, nextDue, pending, overdue } = row;

    let classValue = <span className={s.factNone}>Sin clases próximas</span>;
    if (nextClass) {
        const isToday = daysFrom(today, nextClass.dateIso) === 0;
        const inProgress = isToday && nowMinutes !== null && timeToMinutes(nextClass.start) <= nowMinutes;
        classValue = inProgress ? (
            <span className={s.factValue}>
                <span className="pl-marker">En clase</span> hasta {nextClass.end}
            </span>
        ) : (
            <span className={s.factValue}>
                <span className={s.factStrong}>{capitalize(relativeDay(nextClass.dateIso, today))}</span> {nextClass.start}
            </span>
        );
    }

    let dueValue = <span className={s.factNone}>Nada a la vista</span>;
    if (nextDue) {
        const diff = daysFrom(today, nextDue.dateIso);
        dueValue = (
            <span className={s.factValue}>
                <span className={cx(s.factStrong, diff <= 2 && s.toneSoon)}>{capitalize(relativeDay(nextDue.dateIso, today))}</span>{' '}
                <span className={s.factTitle}>{nextDue.title}</span>
            </span>
        );
    }

    return (
        <>
            <span className={cx(s.fact, s.factClass)}>
                <span className={s.factLabel}>Próxima clase</span>
                {classValue}
            </span>
            <span className={cx(s.fact, s.factDue)}>
                <span className={s.factLabel}>Próxima entrega</span>
                {dueValue}
            </span>
            <span className={cx(s.fact, s.factCount)}>
                {pending === 0 ? (
                    <span className={s.countDone}>Al día</span>
                ) : (
                    <>
                        <span className={cx('pl-display', s.countValue)}>{pending}</span>
                        <span className={s.factLabel}>{pending === 1 ? 'pendiente' : 'pendientes'}</span>
                    </>
                )}
                {overdue > 0 && <span className={s.countOverdue}>{plural(overdue, 'atrasada', 'atrasadas')}</span>}
            </span>
        </>
    );
}
