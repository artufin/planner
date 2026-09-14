'use client';

import { useMemo } from 'react';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useSchedule } from '@/lib/api/schedule';
import { useEvents } from '@/lib/api/events';
import { useTasks, useUpdateTask } from '@/lib/api/tasks';
import { colors, smallSecondaryButtonStyle } from '../../styles';
import { MONTH_NAMES, WEEKDAY_OPTIONS } from '../../constants';
import { compareByDeadline, categoryById, deadlineInfo, inputToDate, scheduleTitleFor, solidColor, softColor, softTextColor } from '../../utils';
import { useToday } from '../../useToday';

const rowStyle = { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: `1px solid ${colors.border}`, borderRadius: 10, background: '#fff', cursor: 'pointer' } as const;
const emptyBoxStyle = { padding: 14, textAlign: 'center' as const, color: 'oklch(60% 0.01 95)', fontSize: 12.5, border: `1px dashed ${colors.border}`, borderRadius: 10 };
const sectionHeaderStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as const;

export default function CategoryView() {
    const { data: categories = [] } = useCategories();
    const selectedCategoryId = usePlannerStore((s) => s.selectedCategoryId);
    const { data: schedule = [] } = useSchedule();
    const { data: events = [] } = useEvents();
    const { data: tasks = [] } = useTasks();
    const updateTask = useUpdateTask();
    const openScheduleModalNew = usePlannerStore((s) => s.openScheduleModalNew);
    const openScheduleModalEdit = usePlannerStore((s) => s.openScheduleModalEdit);
    const openEventModalNew = usePlannerStore((s) => s.openEventModalNew);
    const openEventModalEdit = usePlannerStore((s) => s.openEventModalEdit);
    const openTaskModalNew = usePlannerStore((s) => s.openTaskModalNew);
    const openTaskModalEdit = usePlannerStore((s) => s.openTaskModalEdit);
    const today = useToday();

    const category = categoryById(categories, selectedCategoryId);

    const categorySchedule = useMemo(
        () =>
            schedule
                .filter((s) => s.categoryId === selectedCategoryId)
                .sort((a, b) => a.weekday - b.weekday)
                .map((s) => ({ ...s, dayLabel: WEEKDAY_OPTIONS.find((w) => w.value === s.weekday)?.label ?? '' })),
        [schedule, selectedCategoryId],
    );

    const categoryEvents = useMemo(
        () =>
            events
                .filter((e) => e.categoryId === selectedCategoryId)
                .sort((a, b) => a.startDate.localeCompare(b.startDate))
                .map((e) => {
                    const hasStart = e.start !== null;
                    const hasEnd = e.end !== null;
                    const { m, d } = inputToDate(e.startDate);
                    const dateLabel =
                        `${d} de ${MONTH_NAMES[m]}` +
                        (hasStart && hasEnd ? ` · ${e.start}–${e.end}` : hasStart ? ` · ${e.start}` : hasEnd ? ` · hasta ${e.end}` : '');
                    return { ...e, dateLabel };
                }),
        [events, selectedCategoryId],
    );

    const categoryTasks = useMemo(
        () =>
            tasks
                .filter((t) => t.categoryId === selectedCategoryId)
                .sort((a, b) => {
                    if (a.assignedDate === null && b.assignedDate === null) return compareByDeadline(a, b);
                    if (a.assignedDate === null) return -1;
                    if (b.assignedDate === null) return 1;
                    return a.assignedDate.localeCompare(b.assignedDate);
                })
                .map((t) => {
                    const linkedEvent = t.eventId ? events.find((e) => e.id === t.eventId) : null;
                    const dateLabel =
                        t.assignedDate === null
                            ? 'Backlog'
                            : `${inputToDate(t.assignedDate).d} de ${MONTH_NAMES[inputToDate(t.assignedDate).m]}` + (t.start !== null ? ` · ${t.start}` : '');
                    const deadline = t.deadline ? deadlineInfo(t.deadline, today) : null;
                    return { ...t, dateLabel, linkedEvent, deadline };
                }),
        [tasks, selectedCategoryId, events, today],
    );
    const pending = categoryTasks.filter((t) => !t.done).length;
    const pendingCountLabel = `${pending} ${pending === 1 ? 'pendiente' : 'pendientes'} de ${categoryTasks.length}`;

    if (!category) return null;

    return (
        <div style={{ padding: '28px 32px', maxWidth: 760 }}>
            <div style={sectionHeaderStyle}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>Horario</div>
                <button onClick={() => openScheduleModalNew(selectedCategoryId)} style={smallSecondaryButtonStyle}>+ Agregar horario</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 26 }}>
                {categorySchedule.map((s) => (
                    <div key={s.id} onClick={() => openScheduleModalEdit(s.id)} style={rowStyle}>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{scheduleTitleFor(s, category)}</div>
                        <div style={{ fontSize: 11.5, color: colors.muted }}>{s.dayLabel} · {s.start}–{s.end}{s.interval === 2 ? ' · c/2 sem' : ''}</div>
                    </div>
                ))}
                {categorySchedule.length === 0 && <div style={emptyBoxStyle}>Sin clases programadas.</div>}
            </div>

            <div style={sectionHeaderStyle}>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>Eventos</div>
                <button onClick={() => openEventModalNew(selectedCategoryId)} style={smallSecondaryButtonStyle}>+ Agregar evento</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 26 }}>
                {categoryEvents.map((e) => (
                    <div key={e.id} onClick={() => openEventModalEdit(e.id)} style={rowStyle}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
                            <div style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{e.dateLabel}</div>
                        </div>
                    </div>
                ))}
                {categoryEvents.length === 0 && <div style={emptyBoxStyle}>Sin eventos en el calendario.</div>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.muted }}>{pendingCountLabel}</div>
                <button onClick={() => openTaskModalNew(selectedCategoryId)} style={{ height: 28, padding: '0 12px', borderRadius: 7, border: 'none', background: colors.accent, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    + Nueva tarea
                </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {categoryTasks.map((t) => {
                    const done = t.done;
                    return (
                        <div key={t.id} style={{ ...rowStyle, cursor: undefined, opacity: done ? 0.55 : undefined }}>
                            <div
                                onClick={() => updateTask.mutate({ id: t.id, done: !t.done })}
                                style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 5,
                                    flex: 'none',
                                    cursor: 'pointer',
                                    border: `1.5px solid ${done ? solidColor(category.hue) : 'oklch(80% 0.005 95)'}`,
                                    background: done ? solidColor(category.hue) : 'transparent',
                                }}
                            />
                            <div onClick={() => openTaskModalEdit(t.id)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                                <div style={{ fontSize: 13.5, fontWeight: 600, textDecoration: done ? 'line-through' : undefined, color: done ? colors.muted : 'oklch(25% 0.01 95)' }}>
                                    {t.title}
                                </div>
                                <div style={{ fontSize: 11.5, color: colors.muted, marginTop: 2, display: 'flex', gap: 6 }}>
                                    <span>{t.dateLabel}</span>
                                    {t.deadline && <span>{t.deadline.label}</span>}
                                </div>
                            </div>
                            {t.linkedEvent && (
                                <div style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: softColor(category.hue), color: softTextColor(category.hue), flex: 'none', whiteSpace: 'nowrap' }}>
                                    {t.linkedEvent.title}
                                </div>
                            )}
                        </div>
                    );
                })}
                {categoryTasks.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'oklch(60% 0.01 95)', fontSize: 13, border: `1px dashed ${colors.border}`, borderRadius: 10 }}>Sin tareas pendientes para esta categoría.</div>}
            </div>
        </div>
    );
}
