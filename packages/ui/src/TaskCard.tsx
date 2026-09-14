import type { CSSProperties, DragEventHandler, ReactNode } from 'react';
import { cx, hueVars } from './tokens.js';

/** How close a task's deadline is — drives the color of the deadline label. */
export type DeadlineTone = 'overdue' | 'soon' | 'normal';

export interface TaskCardProps {
    title: ReactNode;
    /** The task's category hue. `null` renders the neutral "sin categoría" treatment. */
    hue: number | null;
    /** Dims the card and strikes the title through. */
    done?: boolean;
    /** Short deadline label, e.g. "12 mar". */
    deadlineLabel?: ReactNode;
    /** `overdue` reads red, `soon` amber, `normal` gray. */
    deadlineTone?: DeadlineTone;
    /** Toggles the checkbox. Omit for a read-only card. */
    onToggle?: () => void;
    /** Opens the task. Omit for a read-only card. */
    onOpen?: () => void;
    draggable?: boolean;
    onDragStart?: DragEventHandler<HTMLDivElement>;
    className?: string;
    style?: CSSProperties;
}

/**
 * A task as it appears in the planning board: tinted in its category color with
 * a colored left edge, a checkbox, the title, and an optional deadline.
 */
export function TaskCard({
    title,
    hue,
    done = false,
    deadlineLabel,
    deadlineTone = 'normal',
    onToggle,
    onOpen,
    draggable = false,
    onDragStart,
    className,
    style,
}: TaskCardProps) {
    return (
        <div
            draggable={draggable}
            onDragStart={onDragStart}
            className={cx(
                'pl-task-card',
                done && 'pl-task-card--done',
                draggable && 'pl-task-card--draggable',
                className,
            )}
            style={{ ...hueVars(hue), ...style } as CSSProperties}
        >
            <button
                type="button"
                role="checkbox"
                aria-checked={done}
                aria-label={done ? 'Marcar como pendiente' : 'Marcar como hecha'}
                onClick={onToggle}
                className="pl-task-card__check"
            />
            <div className="pl-task-card__body" onClick={onOpen}>
                <div className="pl-task-card__row">
                    <span className="pl-task-card__title">{title}</span>
                    {deadlineLabel != null && (
                        <span className={cx('pl-task-card__deadline', `pl-task-card__deadline--${deadlineTone}`)}>
                            {deadlineLabel}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
