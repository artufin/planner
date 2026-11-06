'use client';

import { useState, type CSSProperties } from 'react';
import { cx, hueVars } from '@planner/ui';
import { usePlannerStore } from '../../../store';
import { usePlannerDraggable, type EventDrag } from '../../../dnd';
import type { DeadlineMark } from './model';
import { justDragged } from './dragState';
import { WeekTooltip } from './WeekTooltip';
import s from '../WeekView.module.css';

interface WeekDeadlineProps {
    mark: DeadlineMark;
    date: string;
    zoom: number;
    alignEnd: boolean;
    dragActive: boolean;
}

/**
 * A deliverable: a line in the category colour at its due time, with the time
 * and title written above it. The draggable node is the line itself, so its top
 * edge is the due time — wherever it's dropped, that height becomes the new one.
 */
export function WeekDeadline({ mark, date, zoom, alignEnd, dragActive }: WeekDeadlineProps) {
    const openEventModalEdit = usePlannerStore((st) => st.openEventModalEdit);
    const [hover, setHover] = useState(false);

    const label = (
        <>
            <span className={s.deadlineTime}>{mark.due}</span>
            <span className={s.deadlineTitle}>{mark.title}</span>
        </>
    );
    const item: EventDrag = {
        kind: 'event',
        event: mark.event,
        fromDate: date,
        label: mark.title,
        hue: mark.hue,
        overlay: (
            <div className={cx(s.deadline, s.deadlineOverlay)} style={hueVars(mark.hue) as CSSProperties}>
                <span className={s.deadlineLabel}>{label}</span>
                <span className={s.deadlineRule} aria-hidden="true" />
            </div>
        ),
    };
    const { setNodeRef, handleProps, isDragging } = usePlannerDraggable(`event:${mark.event.id}:${date}`, item);

    const top = (mark.dueMin / 60) * zoom;
    const tipBelow = top < 80;

    return (
        <>
            <div
                ref={setNodeRef}
                {...handleProps}
                className={cx(s.deadline, isDragging && s.deadlinePlaceholder)}
                style={{ ...hueVars(mark.hue), top: top - 1 } as CSSProperties}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onDoubleClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className={s.deadlineLabel}
                    aria-label={`Entrega: ${mark.title}, a las ${mark.due}`}
                    onClick={() => {
                        if (!justDragged()) openEventModalEdit(mark.event.id);
                    }}
                    onFocus={() => setHover(true)}
                    onBlur={() => setHover(false)}
                >
                    {label}
                </button>
                <span className={s.deadlineRule} aria-hidden="true" />
            </div>
            {hover && !dragActive && !isDragging && (
                <WeekTooltip
                    info={mark}
                    className={cx(alignEnd ? s.tipAtSlipEnd : s.tipAtSlip, tipBelow && s.tipBelow)}
                    style={{ '--col': 0, '--cols': 1, top: tipBelow ? top + 8 : top - 20 } as CSSProperties}
                />
            )}
        </>
    );
}
