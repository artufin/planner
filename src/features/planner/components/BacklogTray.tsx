'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { cx, hueVars } from '@planner/ui';
import { usePlannerStore } from '../store';
import { useCategories } from '@/lib/api/categories';
import { useCreateTask, useTasks } from '@/lib/api/tasks';
import type { PlannerTask } from '@/lib/api/types';
import { backlogTasks, categoryById, compareByDeadline, dateToInput, mondayOfWeek } from '../utils';
import { useToday } from '../useToday';
import { toast } from '../toast/toast';
import { usePlannerDroppable, useActiveDrag, accepts, type BacklogTarget } from '../dnd';
import { PlannerTaskCard } from './PlannerTaskCard';
import s from './BacklogTray.module.css';

const LAST_CATEGORY_KEY = 'planner:quick-add-category';
const BACKLOG: BacklogTarget = { kind: 'backlog', label: 'Por planificar' };

interface TrayGroup {
    key: string;
    label: string;
    tone?: 'overdue';
    tasks: PlannerTask[];
}

function readLastCategory(): string | null {
    try {
        return window.localStorage.getItem(LAST_CATEGORY_KEY);
    } catch {
        return null;
    }
}

function writeLastCategory(id: string) {
    try {
        window.localStorage.setItem(LAST_CATEGORY_KEY, id);
    } catch {
        /* storage blocked — the select just resets next time */
    }
}

function isoOf(d: Date): string {
    return dateToInput(d.getFullYear(), d.getMonth(), d.getDate());
}

interface BacklogTrayProps {
    className?: string;
    /** Shows a close button in the header (the week view's side panel). */
    onClose?: () => void;
}

/**
 * "Por planificar": undated tasks grouped by how soon they're due, with a
 * quick-add line on top. Tasks dragged out of it get a day; tasks dropped on
 * it lose theirs.
 */
export default function BacklogTray({ className, onClose }: BacklogTrayProps) {
    const { data: categories = [] } = useCategories();
    const { data: tasks = [] } = useTasks();
    const createTask = useCreateTask();
    const openCategoryModalNew = usePlannerStore((st) => st.openCategoryModalNew);
    const today = useToday();
    const { setNodeRef, isOver } = usePlannerDroppable('backlog', BACKLOG);
    const dragging = accepts(useActiveDrag(), BACKLOG);

    const [draft, setDraft] = useState('');
    const [pickedCategoryId, setPickedCategoryId] = useState<string | null>(() =>
        typeof window === 'undefined' ? null : readLastCategory(),
    );

    const quickCategoryId =
        pickedCategoryId && categoryById(categories, pickedCategoryId) ? pickedCategoryId : (categories[0]?.id ?? '');
    const quickCategory = categoryById(categories, quickCategoryId);

    /** Grouped relative to today, not to the week on screen. */
    const todayIso = isoOf(today);
    const monday = mondayOfWeek(today);
    const endOfThisWeek = isoOf(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6));
    const pending = backlogTasks(tasks, categories)
        .filter((t) => !t.done)
        .sort(compareByDeadline);
    const groups: TrayGroup[] = [
        { key: 'overdue', label: 'Vencidas', tone: 'overdue', tasks: pending.filter((t) => t.deadline !== null && t.deadline < todayIso) },
        {
            key: 'week',
            label: 'Vencen esta semana',
            tasks: pending.filter((t) => t.deadline !== null && t.deadline >= todayIso && t.deadline <= endOfThisWeek),
        },
        { key: 'later', label: 'Más adelante', tasks: pending.filter((t) => t.deadline !== null && t.deadline > endOfThisWeek) },
        { key: 'none', label: 'Sin plazo', tasks: pending.filter((t) => t.deadline === null) },
    ];
    const trayGroups = groups.filter((g) => g.tasks.length > 0);
    const trayDone = backlogTasks(tasks, categories).filter((t) => t.done);
    const trayCount = pending.length;

    const submitDraft = (e: FormEvent) => {
        e.preventDefault();
        const title = draft.trim();
        if (!title || !quickCategoryId) return;
        createTask.mutate(
            { categoryId: quickCategoryId, eventId: null, title, assignedDate: null, deadline: null, start: null, end: null, done: false },
            { onSuccess: () => setDraft(''), onError: toast.error },
        );
    };

    const renderTask = (t: PlannerTask) => (
        <li key={t.id}>
            <PlannerTaskCard task={t} category={categoryById(categories, t.categoryId)!} today={today} showTime={false} />
        </li>
    );

    return (
        <aside
            ref={setNodeRef}
            className={cx(s.tray, dragging && s.dragging, isOver && s.over, className)}
            aria-label="Tareas por planificar"
        >
            <header className={s.trayHead}>
                <h2 className={cx('pl-display', s.trayTitle)}>Por planificar</h2>
                <div className={s.headActions}>
                    <span className={s.trayCount}>{trayCount === 1 ? '1 tarea' : `${trayCount} tareas`}</span>
                    {onClose && (
                        <button type="button" className={s.close} onClick={onClose} aria-label="Cerrar Por planificar">
                            <svg viewBox="0 0 16 16" aria-hidden="true">
                                <path d="M4 4l8 8M12 4l-8 8" />
                            </svg>
                        </button>
                    )}
                </div>
            </header>

            {categories.length > 0 ? (
                <form className={s.quickAdd} onSubmit={submitDraft} style={hueVars(quickCategory?.hue ?? null) as CSSProperties}>
                    <input
                        className={s.quickInput}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Anota una tarea y presiona Enter"
                        aria-label="Nueva tarea por planificar"
                        maxLength={200}
                    />
                    <label className={s.quickCategory}>
                        <span className={s.quickDot} aria-hidden="true" />
                        <select
                            value={quickCategoryId}
                            onChange={(e) => {
                                setPickedCategoryId(e.target.value);
                                writeLastCategory(e.target.value);
                            }}
                            aria-label="Categoría de la nueva tarea"
                        >
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </form>
            ) : (
                <p className={s.trayHint}>
                    Las tareas se ordenan por categoría.{' '}
                    <button type="button" className={s.linkButton} onClick={openCategoryModalNew}>
                        Crea tu primera categoría
                    </button>{' '}
                    para empezar a anotarlas.
                </p>
            )}

            <div className={s.trayScroll}>
                {trayGroups.map((g) => (
                    <section key={g.key}>
                        <h3 className={cx(s.groupLabel, g.tone === 'overdue' && s.groupOverdue)}>
                            {g.label}
                            <span className={s.groupCount}>{g.tasks.length}</span>
                        </h3>
                        <ul className={s.stack}>{g.tasks.map(renderTask)}</ul>
                    </section>
                ))}

                {trayCount === 0 && categories.length > 0 && (
                    <p className={s.trayEmpty}>
                        Nada por planificar. Anota arriba lo que tengas pendiente, o arrastra aquí una tarea para sacarla de su día.
                    </p>
                )}

                {trayDone.length > 0 && (
                    <details className={s.doneGroup}>
                        <summary>
                            Hechas sin fecha <span className={s.groupCount}>{trayDone.length}</span>
                        </summary>
                        <ul className={s.stack}>{trayDone.map(renderTask)}</ul>
                    </details>
                )}
            </div>
            <div className={s.dropHint} aria-hidden="true">
                Suelta aquí para quitarle el día
            </div>
        </aside>
    );
}
