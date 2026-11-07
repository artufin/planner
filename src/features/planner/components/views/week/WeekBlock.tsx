'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { cx, hueVars } from '@/components/ui';
import { usePlannerStore } from '../../../store';
import { useUpdateTask } from '@/lib/api/tasks';
import { toast } from '../../../toast/toast';
import { minutesToTime } from '../../../utils';
import { SNAP_MINUTES, snap, usePlannerDraggable, type EventDrag, type OccurrenceDrag, type ResizeDrag, type TaskDrag } from '../../../dnd';
import { COMPACT_HEIGHT, DAY_MINUTES, MIN_SLIP_HEIGHT, type GridBlock } from './model';
import { justDragged } from './dragState';
import { WeekTooltip } from './WeekTooltip';
import s from '../WeekView.module.css';

const KIND_CLASS = { class: s.slipClass, event: s.slipEvent, task: s.slipTask } as const;

function TaskCheck({ done, onToggle }: { done: boolean; onToggle?: () => void }) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={done}
            aria-label={done ? 'Marcar como pendiente' : 'Marcar como hecha'}
            className={s.check}
            onClick={onToggle}
            disabled={!onToggle}
        >
            <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.2 8.6 6.6 11.8 12.9 4.4" />
            </svg>
        </button>
    );
}

interface WeekBlockProps {
    block: GridBlock;
    date: string;
    /** px per hour. */
    zoom: number;
    /** Right-hand columns open their tooltip toward the left. */
    alignEnd: boolean;
    /** Something is being dragged somewhere: no tooltips. */
    dragActive: boolean;
}

/** A class, event or task on the hour grid: opens on click, moves by dragging, stretches from its bottom edge. */
export function WeekBlock({ block, date, zoom, alignEnd, dragActive }: WeekBlockProps) {
    const openEventModalEdit = usePlannerStore((st) => st.openEventModalEdit);
    const openScheduleModalOccurrence = usePlannerStore((st) => st.openScheduleModalOccurrence);
    const openTaskModalEdit = usePlannerStore((st) => st.openTaskModalEdit);
    const updateTask = useUpdateTask();
    const [hover, setHover] = useState(false);

    const ppm = zoom / 60;
    const done = block.kind === 'task' && block.task.done;
    const movable = block.kind !== 'event' || !block.overnight;
    const kindClass = KIND_CLASS[block.kind];

    const body = (timeLabel: string): ReactNode => (
        <>
            <span className={s.slipTitle}>{block.title}</span>
            {block.subtitle && <span className={s.slipSub}>{block.subtitle}</span>}
            <span className={s.slipTime}>{timeLabel}</span>
        </>
    );

    const overlay = (
        <div className={cx(s.slip, kindClass, s.slipOverlay, done && s.slipDone)} style={hueVars(block.hue) as CSSProperties}>
            {block.kind === 'task' && <TaskCheck done={done} />}
            <div className={s.slipBody}>{body(block.timeLabel)}</div>
        </div>
    );
    const base = { label: block.title, hue: block.hue, overlay };
    let id: string;
    let item: TaskDrag | EventDrag | OccurrenceDrag;
    if (block.kind === 'task') {
        id = `task:${block.task.id}`;
        item = { ...base, kind: 'task', task: block.task };
    } else if (block.kind === 'event') {
        id = `event:${block.event.id}:${date}`;
        item = { ...base, kind: 'event', event: block.event, fromDate: date };
    } else {
        id = `occ:${block.scheduleId}:${date}`;
        item = {
            ...base,
            kind: 'occurrence',
            scheduleId: block.scheduleId,
            date,
            start: block.start,
            end: block.end,
            titleOverride: block.titleOverride,
            previous: block.previous,
        };
    }
    const { setNodeRef, handleProps, isDragging } = usePlannerDraggable(id, item, !movable);

    const resizeItem: ResizeDrag = {
        kind: 'resize',
        of: item,
        date,
        startMin: block.startMin,
        endMin: block.endMin,
        pxPerMinute: ppm,
        label: `Hora de término de ${block.title}`,
        hue: block.hue,
    };
    const {
        setNodeRef: setHandleRef,
        handleProps: resizeHandleProps,
        transform: resizeTransform,
    } = usePlannerDraggable(`resize:${id}`, resizeItem, !movable);

    /** While the bottom edge is dragged, draw the end the drop will produce (snapped, at least 15 min). */
    const resizing = resizeTransform !== null;
    const endMin = resizing
        ? Math.min(DAY_MINUTES - 1, Math.max(block.startMin + SNAP_MINUTES, snap(block.endMin + resizeTransform.y / ppm)))
        : block.endMin;
    const timeLabel = resizing ? `${minutesToTime(block.startMin)}–${minutesToTime(endMin)}` : block.timeLabel;

    const top = block.startMin * ppm;
    const height = Math.max(MIN_SLIP_HEIGHT, (endMin - block.startMin) * ppm - 2);
    const compact = height < COMPACT_HEIGHT;
    const metaLines = 1 + (block.subtitle ? 1 : 0);
    const lines = Math.max(1, Math.floor((height - 8 - metaLines * 13) / 14.4));
    const position = { '--col': block.col, '--cols': block.cols };
    const tipBelow = top < 64;

    const open = () => {
        if (justDragged()) return;
        if (block.kind === 'task') openTaskModalEdit(block.task.id);
        else if (block.kind === 'event') openEventModalEdit(block.event.id);
        else openScheduleModalOccurrence(block.scheduleId, date);
    };

    const toggle =
        block.kind === 'task'
            ? () => updateTask.mutate({ id: block.task.id, done: !block.task.done }, { onError: toast.error })
            : undefined;

    return (
        <>
            <div
                ref={setNodeRef}
                {...handleProps}
                className={cx(
                    s.slip,
                    kindClass,
                    compact && s.slipCompact,
                    block.cols > 1 && s.slipSplit,
                    done && s.slipDone,
                    !movable && s.slipFixed,
                    isDragging && s.slipPlaceholder,
                    resizing && s.slipResizing,
                )}
                style={{ ...hueVars(block.hue), ...position, '--lines': lines, top, height } as CSSProperties}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onDoubleClick={(e) => e.stopPropagation()}
            >
                {block.kind === 'task' && <TaskCheck done={done} onToggle={toggle} />}
                <button
                    type="button"
                    className={s.slipBody}
                    onClick={open}
                    onFocus={() => setHover(true)}
                    onBlur={() => setHover(false)}
                >
                    {body(timeLabel)}
                </button>
                {movable && (
                    <div
                        ref={setHandleRef}
                        {...resizeHandleProps}
                        className={s.resize}
                        aria-label={`Cambiar la hora de término de ${block.title}`}
                    />
                )}
            </div>
            {hover && !dragActive && !isDragging && (
                <WeekTooltip
                    info={block}
                    className={cx(alignEnd ? s.tipAtSlipEnd : s.tipAtSlip, tipBelow && s.tipBelow)}
                    style={{ ...position, top: tipBelow ? top + height + 6 : top - 6 } as CSSProperties}
                />
            )}
        </>
    );
}
