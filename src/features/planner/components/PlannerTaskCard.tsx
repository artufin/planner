'use client';

import { TaskCard, type DeadlineTone } from '@/components/ui';
import type { Category, PlannerTask } from '@/lib/api/types';
import { usePlannerStore } from '../store';
import { useUpdateTask } from '@/lib/api/tasks';
import { toast } from '../toast/toast';
import { deadlineInfo } from '../utils';
import { usePlannerDraggable, type TaskDrag } from '../dnd';

/** "vence 12 nov" / "venció 3 nov" / "vence antes, 12 nov" — and how loud to say it. */
export function taskDeadline(
    task: Pick<PlannerTask, 'deadline' | 'assignedDate'>,
    today: Date,
): { label: string; tone: DeadlineTone } | null {
    if (!task.deadline) return null;
    const info = deadlineInfo(task.deadline, today);
    /** A task planned for after its own deadline is as urgent as an overdue one. */
    const lateForPlan = task.assignedDate !== null && task.assignedDate > task.deadline;
    if (lateForPlan) return { label: `vence antes, ${info.label}`, tone: 'overdue' };
    return { label: info.tone === 'overdue' ? `venció ${info.label}` : `vence ${info.label}`, tone: info.tone };
}

interface PlannerTaskCardProps {
    task: PlannerTask;
    category: Category;
    today: Date;
    /** Show the start time before the title (day lists). */
    showTime?: boolean;
}

/** A task slip that can be ticked, opened, and dragged anywhere in the planner. */
export function PlannerTaskCard({ task, category, today, showTime = true }: PlannerTaskCardProps) {
    const updateTask = useUpdateTask();
    const openTaskModalEdit = usePlannerStore((st) => st.openTaskModalEdit);
    const deadline = taskDeadline(task, today);

    const shared = {
        title: task.title,
        hue: category.hue,
        categoryLabel: category.name,
        timeLabel: showTime ? (task.start ?? undefined) : undefined,
        done: task.done,
        deadlineLabel: deadline?.label,
        deadlineTone: deadline?.tone,
        draggable: true,
    };

    const item: TaskDrag = { kind: 'task', task, label: task.title, hue: category.hue, overlay: <TaskCard {...shared} lifted /> };
    const { setNodeRef, handleProps, isDragging } = usePlannerDraggable(`task:${task.id}`, item);

    return (
        <TaskCard
            {...shared}
            ref={setNodeRef}
            dragHandleProps={handleProps}
            placeholder={isDragging}
            onToggle={() => updateTask.mutate({ id: task.id, done: !task.done }, { onError: toast.error })}
            onOpen={() => openTaskModalEdit(task.id)}
        />
    );
}
