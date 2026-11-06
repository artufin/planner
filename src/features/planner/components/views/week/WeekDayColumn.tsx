'use client';

import { useRef, useState, type CSSProperties } from 'react';
import { useDndMonitor, type DragMoveEvent, type DragOverEvent } from '@dnd-kit/core';
import { cx } from '@planner/ui';
import { usePlannerStore } from '../../../store';
import { minutesToTime } from '../../../utils';
import {
    accepts,
    dragPointerY,
    dropY,
    durationOf,
    snap,
    useActiveDrag,
    usePlannerDroppable,
    type DragItem,
    type TimelineTarget,
} from '../../../dnd';
import { DAY_MINUTES, type WeekDay } from './model';
import { WeekBlock } from './WeekBlock';
import { WeekDeadline } from './WeekDeadline';
import s from '../WeekView.module.css';

interface WeekDayColumnProps {
    day: WeekDay;
    zoom: number;
    /** Right-hand columns open their tooltips toward the left. */
    alignEnd: boolean;
    /** Tops (px) of the user's time divisions, ruled across the paper. */
    divisionTops: number[];
    paperStyle: CSSProperties;
}

/** Where a drag over this column would land: start and length in minutes (length 0 = a due time). */
interface Preview {
    start: number;
    length: number;
}

/** One day of the hour grid: a drop zone whose height is a time of day, and the blocks laid on it. */
export function WeekDayColumn({ day, zoom, alignEnd, divisionTops, paperStyle }: WeekDayColumnProps) {
    const openEventModalNew = usePlannerStore((st) => st.openEventModalNew);
    const ppm = zoom / 60;

    const columnRef = useRef<HTMLDivElement | null>(null);
    const target: TimelineTarget = {
        kind: 'timeline',
        date: day.dateIso,
        label: `${day.name} ${day.dayNum}`,
        /** The column's top edge is 00:00; its live rect already accounts for scrolling. */
        minuteAt: (clientY) => {
            const el = columnRef.current;
            return el ? (clientY - el.getBoundingClientRect().top) / ppm : 0;
        },
    };
    const droppableId = `week-col:${day.dateIso}`;
    const { setNodeRef, isOver, isCandidate } = usePlannerDroppable(droppableId, target);
    const active = useActiveDrag();
    const dragActive = active !== null;
    const unavailable = active !== null && active.kind !== 'resize' && !isCandidate;

    const [preview, setPreview] = useState<Preview | null>(null);
    const clearPreview = () => setPreview(null);
    /** Mirrors what the provider will do on drop (same Y, same snapping and clamping), so the slot shown is where it lands. */
    const track = (e: DragMoveEvent | DragOverEvent) => {
        const item = (e.active.data.current as DragItem | undefined) ?? null;
        if (!item || item.kind === 'resize' || e.over?.id !== droppableId || !accepts(item, target)) {
            clearPreview();
            return;
        }
        const y = dropY(item, {
            pointerY: dragPointerY(e.activatorEvent, e.delta.y),
            top: e.active.rect.current.translated?.top ?? 0,
        });
        const dueOnly = item.kind === 'event' && item.event.start === null && item.event.end !== null;
        const length = dueOnly ? 0 : durationOf(item);
        const latest = item.kind === 'event' ? DAY_MINUTES - 1 - Math.min(length, DAY_MINUTES - 1) : DAY_MINUTES - length;
        const start = Math.min(Math.max(0, snap(target.minuteAt(y))), latest);
        setPreview((p) => (p && p.start === start && p.length === length ? p : { start, length }));
    };
    useDndMonitor({ onDragMove: track, onDragOver: track, onDragEnd: clearPreview, onDragCancel: clearPreview });

    const attach = (node: HTMLDivElement | null) => {
        columnRef.current = node;
        setNodeRef(node);
    };

    return (
        <div
            ref={attach}
            className={cx(s.day, day.isToday && s.dayToday, isOver && s.dayOver, unavailable && s.dayUnavailable)}
            style={paperStyle}
            onDoubleClick={() => openEventModalNew(null, day.dateIso)}
        >
            {divisionTops.map((top) => (
                <div key={top} className={s.division} style={{ top }} />
            ))}

            {day.blocks.map((block) => (
                <WeekBlock key={block.key} block={block} date={day.dateIso} zoom={zoom} alignEnd={alignEnd} dragActive={dragActive} />
            ))}

            {day.deadlines.map((mark) => (
                <WeekDeadline key={mark.key} mark={mark} date={day.dateIso} zoom={zoom} alignEnd={alignEnd} dragActive={dragActive} />
            ))}

            {isOver && preview && (
                <div
                    className={cx(s.preview, preview.length === 0 && s.previewDue)}
                    style={{ top: preview.start * ppm, height: preview.length === 0 ? undefined : Math.max(6, preview.length * ppm - 2) }}
                    aria-hidden="true"
                >
                    <span className={s.previewTime}>
                        {preview.length === 0
                            ? minutesToTime(preview.start)
                            : `${minutesToTime(preview.start)}–${minutesToTime(preview.start + preview.length)}`}
                    </span>
                </div>
            )}
        </div>
    );
}
