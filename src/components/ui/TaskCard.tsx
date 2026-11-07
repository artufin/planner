import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from 'react';
import { cx, hueVars } from './tokens';

/** How close a task's deadline is — drives the color of the deadline label. */
export type DeadlineTone = 'overdue' | 'soon' | 'normal';

export interface TaskCardProps {
    title: ReactNode;
    /** The task's category hue. `null` renders the neutral "sin categoría" treatment. */
    hue: number | null;
    /** Ticks the box and strikes the title through, the way you'd cross it out on paper. */
    done?: boolean;
    /** Short deadline label, e.g. "vence 12 mar". */
    deadlineLabel?: ReactNode;
    /** `overdue` reads in red pen, `soon` amber, `normal` pencil gray. */
    deadlineTone?: DeadlineTone;
    /** The category's name, shown under the title next to a dot in its color. */
    categoryLabel?: ReactNode;
    /** A start time, e.g. "10:00", set before the title. */
    timeLabel?: ReactNode;
    /** Toggles the checkbox. Omit for a read-only card. */
    onToggle?: () => void;
    /** Opens the task. Omit for a read-only card. */
    onOpen?: () => void;
    /** Shows the grab cursor and lift-on-hover. Wire the actual dragging through `ref` + `dragHandleProps`. */
    draggable?: boolean;
    /** Spread on the card root — the drag library's listeners and ARIA attributes. */
    dragHandleProps?: HTMLAttributes<HTMLDivElement>;
    /** The card's spot while its copy is being dragged: drawn as a faint outline. */
    placeholder?: boolean;
    /** The copy that follows the pointer while dragging: lifted and tilted. */
    lifted?: boolean;
    ref?: Ref<HTMLDivElement>;
    className?: string;
    style?: CSSProperties;
}

/**
 * A task as a slip of paper on the planning board: a checkbox drawn in the
 * category's color, the title, and an optional line with the category name and
 * the deadline.
 */
export function TaskCard({
    title,
    hue,
    done = false,
    deadlineLabel,
    deadlineTone = 'normal',
    categoryLabel,
    timeLabel,
    onToggle,
    onOpen,
    draggable = false,
    dragHandleProps,
    placeholder = false,
    lifted = false,
    ref,
    className,
    style,
}: TaskCardProps) {
    const hasMeta = categoryLabel != null || deadlineLabel != null;
    const content = (
        <>
            <span className="pl-task-card__title">
                {timeLabel != null && <span className="pl-task-card__time">{timeLabel}</span>}
                <span className="pl-task-card__title-text">{title}</span>
            </span>
            {hasMeta && (
                <span className="pl-task-card__meta">
                    {categoryLabel != null && <span className="pl-task-card__category">{categoryLabel}</span>}
                    {deadlineLabel != null && (
                        <span className={cx('pl-task-card__deadline', `pl-task-card__deadline--${deadlineTone}`)}>
                            {deadlineLabel}
                        </span>
                    )}
                </span>
            )}
        </>
    );

    return (
        <div
            ref={ref}
            {...dragHandleProps}
            className={cx(
                'pl-task-card',
                done && 'pl-task-card--done',
                draggable && 'pl-task-card--draggable',
                placeholder && 'pl-task-card--placeholder',
                lifted && 'pl-task-card--lifted',
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
                disabled={!onToggle}
                className="pl-task-card__check"
            >
                <svg className="pl-task-card__tick" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3.2 8.6 6.6 11.8 12.9 4.4" />
                </svg>
            </button>
            {onOpen ? (
                <button type="button" className="pl-task-card__body" onClick={onOpen}>
                    {content}
                </button>
            ) : (
                <div className="pl-task-card__body">{content}</div>
            )}
        </div>
    );
}
