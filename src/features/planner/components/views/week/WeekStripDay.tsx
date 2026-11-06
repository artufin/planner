'use client';

import { useState, type CSSProperties } from 'react';
import { cx, hueVars } from '@planner/ui';
import { usePlannerStore } from '../../../store';
import { useUpdateTask } from '@/lib/api/tasks';
import { toast } from '../../../toast/toast';
import { useActiveDrag, usePlannerDraggable, usePlannerDroppable, type DayTarget, type EventDrag, type TaskDrag } from '../../../dnd';
import type { StripChip, WeekDay } from './model';
import { justDragged } from './dragState';
import { WeekTooltip } from './WeekTooltip';
import s from '../WeekView.module.css';

interface StripChipViewProps {
    chip: StripChip;
    date: string;
    alignEnd: boolean;
    dragActive: boolean;
}

function StripChipView({ chip, date, alignEnd, dragActive }: StripChipViewProps) {
    const openEventModalEdit = usePlannerStore((st) => st.openEventModalEdit);
    const openTaskModalEdit = usePlannerStore((st) => st.openTaskModalEdit);
    const updateTask = useUpdateTask();
    const [hover, setHover] = useState(false);

    const base = { label: chip.title, hue: chip.hue };
    const isTask = chip.kind === 'task';
    const done = chip.kind === 'task' && chip.task.done;
    const item: TaskDrag | EventDrag =
        chip.kind === 'task' ? { ...base, kind: 'task', task: chip.task } : { ...base, kind: 'event', event: chip.event, fromDate: date };
    const id = chip.kind === 'task' ? `task:${chip.task.id}` : `event:${chip.event.id}:${date}`;
    const { setNodeRef, handleProps, isDragging } = usePlannerDraggable(id, item);

    const open = () => {
        if (justDragged()) return;
        if (chip.kind === 'task') openTaskModalEdit(chip.task.id);
        else openEventModalEdit(chip.event.id);
    };

    return (
        <div className={s.stripItem}>
            <div
                ref={setNodeRef}
                {...handleProps}
                className={cx(s.stripChip, isTask && s.stripTask, done && s.stripDone, isDragging && s.stripPlaceholder)}
                style={hueVars(chip.hue) as CSSProperties}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                {chip.kind === 'task' && (
                    <button
                        type="button"
                        role="checkbox"
                        aria-checked={done}
                        aria-label={done ? 'Marcar como pendiente' : 'Marcar como hecha'}
                        className={s.check}
                        onClick={() => updateTask.mutate({ id: chip.task.id, done: !chip.task.done }, { onError: toast.error })}
                    >
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path d="M3.2 8.6 6.6 11.8 12.9 4.4" />
                        </svg>
                    </button>
                )}
                <button
                    type="button"
                    className={s.stripBody}
                    onClick={open}
                    onFocus={() => setHover(true)}
                    onBlur={() => setHover(false)}
                >
                    {chip.title}
                </button>
            </div>
            {hover && !dragActive && !isDragging && <WeekTooltip info={chip} className={cx(s.tipStrip, alignEnd && s.tipStripEnd)} />}
        </div>
    );
}

interface WeekStripDayProps {
    day: WeekDay;
    alignEnd: boolean;
}

/** One day of the strip above the grid. Whatever lands here keeps its day and loses its time. */
export function WeekStripDay({ day, alignEnd }: WeekStripDayProps) {
    const target: DayTarget = { kind: 'day', date: day.dateIso, label: `${day.name} ${day.dayNum}, sin hora`, clearTime: true };
    const { setNodeRef, isOver } = usePlannerDroppable(`week-strip:${day.dateIso}`, target);
    const dragActive = useActiveDrag() !== null;

    return (
        <div ref={setNodeRef} className={cx(s.stripDay, day.isToday && s.stripDayToday, isOver && s.stripDayOver)}>
            {day.strip.map((chip) => (
                <StripChipView key={chip.key} chip={chip} date={day.dateIso} alignEnd={alignEnd} dragActive={dragActive} />
            ))}
        </div>
    );
}
