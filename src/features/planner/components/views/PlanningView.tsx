'use client';

import { useMemo, useState } from 'react';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useTasks, useUpdateTask } from '@/lib/api/tasks';
import { colors } from '../../styles';
import { WEEKDAY_LABELS } from '../../constants';
import type { Category, PlannerTask } from '@/lib/api/types';
import {
    backlogTasks,
    compareByDeadline,
    categoryById,
    dateToInput,
    deadlineInfo,
    getWeekStart,
    sameDate,
    solidColor,
    softColor,
    softTextColor,
    tasksForDate,
    timeToMinutes,
} from '../../utils';
import { useToday } from '../../useToday';

const TASK_DRAG_MIME = 'application/x-planner-task-id';

function TaskCard({
    task,
    category,
    done,
    today,
    onToggle,
    onOpen,
}: {
    task: PlannerTask;
    category: Category;
    done: boolean;
    today: Date;
    onToggle: () => void;
    onOpen: () => void;
}) {
    const deadline = task.deadline ? deadlineInfo(task.deadline, today) : null;
    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData(TASK_DRAG_MIME, task.id);
                e.dataTransfer.effectAllowed = 'move';
            }}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '9px 10px',
                borderRadius: 8,
                borderLeft: `3px solid ${solidColor(category.hue)}`,
                background: softColor(category.hue),
                opacity: done ? 0.5 : undefined,
                cursor: 'grab',
            }}
        >
            <div
                onClick={onToggle}
                style={{
                    width: 15,
                    height: 15,
                    marginTop: 1,
                    borderRadius: 4,
                    flex: 'none',
                    cursor: 'pointer',
                    border: `1.5px solid ${done ? solidColor(category.hue) : 'oklch(75% 0.01 95)'}`,
                    background: done ? solidColor(category.hue) : 'transparent',
                }}
            />
            <div onClick={onOpen} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: 1.3,
                        textDecoration: done ? 'line-through' : undefined,
                        color: done ? 'oklch(50% 0.01 95)' : softTextColor(category.hue),
                    }}
                >
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                    {deadline && (
                        <span style={{ flex: 'none', fontSize: 10.5, fontWeight: 600, color: colors.muted }}>{deadline.label}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

type DropZone = 'backlog' | number;

export default function PlanningView() {
    const { data: categories = [] } = useCategories();
    const { data: tasks = [] } = useTasks();
    const updateTask = useUpdateTask();
    const weekOffset = usePlannerStore((s) => s.weekOffset);
    const openTaskModalEdit = usePlannerStore((s) => s.openTaskModalEdit);
    const openTaskModalNew = usePlannerStore((s) => s.openTaskModalNew);
    const today = useToday();
    const [dragOverZone, setDragOverZone] = useState<DropZone | null>(null);

    const weekStart = useMemo(() => getWeekStart(today, weekOffset), [today, weekOffset]);

    const backlog = useMemo(
        () => backlogTasks(tasks, categories).sort((a, b) => compareByDeadline(a, b)),
        [tasks, categories],
    );

    const planningDays = useMemo(() => {
        const out = [];
        for (let i = 0; i < 7; i++) {
            const dt = new Date(weekStart);
            dt.setDate(weekStart.getDate() + i);
            const dayTasks = tasksForDate(tasks, categories, dateToInput(dt.getFullYear(), dt.getMonth(), dt.getDate())).sort(
                (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
            );
            out.push({
                label: WEEKDAY_LABELS[i],
                dayNum: dt.getDate(),
                y: dt.getFullYear(),
                m: dt.getMonth(),
                d: dt.getDate(),
                isToday: sameDate(dt, today),
                tasks: dayTasks,
            });
        }
        return out;
    }, [weekStart, tasks, categories, today]);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7,1fr)', gap: 12, padding: '20px 24px', minWidth: 1080, height: '100%' }}>
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverZone !== 'backlog') setDragOverZone('backlog');
                }}
                onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                        setDragOverZone((cur) => (cur === 'backlog' ? null : cur));
                    }
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOverZone(null);
                    const taskId = e.dataTransfer.getData(TASK_DRAG_MIME);
                    if (taskId) updateTask.mutate({ id: taskId, assignedDate: null });
                }}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    minHeight: 0,
                    borderRadius: 10,
                    outline: dragOverZone === 'backlog' ? `2px dashed ${colors.accent}` : '2px dashed transparent',
                    outlineOffset: 2,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: colors.chipBg,
                    }}
                >
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: colors.muted }}>BACKLOG</div>
                    <button
                        onClick={() => openTaskModalNew(null, null)}
                        style={{
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: 15,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: colors.muted,
                        }}
                    >
                        +
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flex: 1, minHeight: 0 }}>
                    {backlog.map((t) => (
                        <TaskCard
                            key={t.id}
                            task={t}
                            category={categoryById(categories, t.categoryId)!}
                            done={t.done}
                            today={today}
                            onToggle={() => updateTask.mutate({ id: t.id, done: !t.done })}
                            onOpen={() => openTaskModalEdit(t.id)}
                        />
                    ))}
                    {backlog.length === 0 && <div style={{ fontSize: 11, color: 'oklch(68% 0.005 95)', padding: '8px 4px' }}>Sin tareas pendientes de asignar</div>}
                </div>
            </div>
            {planningDays.map((day, i) => (
                <div
                    key={i}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverZone !== i) setDragOverZone(i);
                    }}
                    onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                            setDragOverZone((cur) => (cur === i ? null : cur));
                        }
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOverZone(null);
                        const taskId = e.dataTransfer.getData(TASK_DRAG_MIME);
                        if (taskId) updateTask.mutate({ id: taskId, assignedDate: dateToInput(day.y, day.m, day.d) });
                    }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        minHeight: 0,
                        borderRadius: 10,
                        outline: dragOverZone === i ? `2px dashed ${colors.accent}` : '2px dashed transparent',
                        outlineOffset: 2,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 8,
                            background: day.isToday ? colors.accentSoftBg : colors.chipBg,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: colors.muted }}>{day.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: day.isToday ? colors.accentText : 'oklch(30% 0.01 95)' }}>{day.dayNum}</div>
                        </div>
                        <button
                            onClick={() => openTaskModalNew(null, dateToInput(day.y, day.m, day.d))}
                            style={{
                                width: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 6,
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: 15,
                                fontWeight: 700,
                                lineHeight: 1,
                                color: day.isToday ? colors.accentText : colors.muted,
                            }}
                        >
                            +
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flex: 1, minHeight: 0 }}>
                        {day.tasks.map((t) => (
                            <TaskCard
                                key={t.id}
                                task={t}
                                category={categoryById(categories, t.categoryId)!}
                                done={t.done}
                                today={today}
                                onToggle={() => updateTask.mutate({ id: t.id, done: !t.done })}
                                onOpen={() => openTaskModalEdit(t.id)}
                            />
                        ))}
                        {day.tasks.length === 0 && <div style={{ fontSize: 11, color: 'oklch(68% 0.005 95)', padding: '8px 4px' }}>Sin pendientes</div>}
                    </div>
                </div>
            ))}
        </div>
    );
}
