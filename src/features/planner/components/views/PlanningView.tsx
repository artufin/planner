'use client';

import { useMemo, useState } from 'react';
import { ColumnHeader, TaskCard, colors } from '@planner/ui';
import { usePlannerStore } from '../../store';
import { useCategories } from '@/lib/api/categories';
import { useTasks, useUpdateTask } from '@/lib/api/tasks';
import { WEEKDAY_LABELS } from '../../constants';
import type { PlannerTask } from '@/lib/api/types';
import {
    backlogTasks,
    compareByDeadline,
    categoryById,
    dateToInput,
    deadlineInfo,
    getWeekStart,
    sameDate,
    tasksForDate,
    timeToMinutes,
} from '../../utils';
import { useToday } from '../../useToday';

const TASK_DRAG_MIME = 'application/x-planner-task-id';

const columnStyle = (active: boolean) => ({
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    minHeight: 0,
    borderRadius: 10,
    outline: active ? `2px dashed ${colors.accent}` : '2px dashed transparent',
    outlineOffset: 2,
});

const stackStyle = { display: 'flex', flexDirection: 'column' as const, gap: 6, overflowY: 'auto' as const, flex: 1, minHeight: 0 };
const emptyStyle = { fontSize: 11, color: colors.textFaint, padding: '8px 4px' };

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

    /** Every task on this board renders the same way; only the column it sits in differs. */
    const renderTask = (t: PlannerTask) => {
        const category = categoryById(categories, t.categoryId)!;
        const deadline = t.deadline ? deadlineInfo(t.deadline, today) : null;
        return (
            <TaskCard
                key={t.id}
                title={t.title}
                hue={category.hue}
                done={t.done}
                deadlineLabel={deadline?.label}
                deadlineTone={deadline?.tone}
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData(TASK_DRAG_MIME, t.id);
                    e.dataTransfer.effectAllowed = 'move';
                }}
                onToggle={() => updateTask.mutate({ id: t.id, done: !t.done })}
                onOpen={() => openTaskModalEdit(t.id)}
            />
        );
    };

    /** Shared drag handlers — `zone` identifies the column, `assignedDate` is what a drop writes. */
    const dropHandlers = (zone: DropZone, assignedDate: string | null) => ({
        onDragOver: (e: React.DragEvent) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (dragOverZone !== zone) setDragOverZone(zone);
        },
        onDragLeave: (e: React.DragEvent) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setDragOverZone((cur) => (cur === zone ? null : cur));
            }
        },
        onDrop: (e: React.DragEvent) => {
            e.preventDefault();
            setDragOverZone(null);
            const taskId = e.dataTransfer.getData(TASK_DRAG_MIME);
            if (taskId) updateTask.mutate({ id: taskId, assignedDate });
        },
    });

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(7,1fr)', gap: 12, padding: '20px 24px', minWidth: 1080, height: '100%' }}>
            <div {...dropHandlers('backlog', null)} style={columnStyle(dragOverZone === 'backlog')}>
                <ColumnHeader label="BACKLOG" addLabel="Nueva tarea" onAdd={() => openTaskModalNew(null, null)} />
                <div style={stackStyle}>
                    {backlog.map(renderTask)}
                    {backlog.length === 0 && <div style={emptyStyle}>Sin tareas pendientes de asignar</div>}
                </div>
            </div>
            {planningDays.map((day, i) => (
                <div key={i} {...dropHandlers(i, dateToInput(day.y, day.m, day.d))} style={columnStyle(dragOverZone === i)}>
                    <ColumnHeader
                        label={day.label}
                        value={day.dayNum}
                        active={day.isToday}
                        addLabel="Nueva tarea"
                        onAdd={() => openTaskModalNew(null, dateToInput(day.y, day.m, day.d))}
                    />
                    <div style={stackStyle}>
                        {day.tasks.map(renderTask)}
                        {day.tasks.length === 0 && <div style={emptyStyle}>Sin pendientes</div>}
                    </div>
                </div>
            ))}
        </div>
    );
}
