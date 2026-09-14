import type { ReactNode } from 'react';
import { cx } from './tokens.js';
import { IconButton } from './IconButton.js';

export interface ColumnHeaderProps {
    /** The tracked small-caps label — "BACKLOG", "LUN". */
    label: ReactNode;
    /** Optional bolder value beside the label, e.g. a day number. */
    value?: ReactNode;
    /** Tints the header in the accent color — how the planning board marks today. */
    active?: boolean;
    /** Shows the `+` button at the right edge. */
    onAdd?: () => void;
    addLabel?: string;
    className?: string;
    children?: ReactNode;
}

/**
 * The chip at the top of a planning-board column: a label, an optional day
 * number, and an add button. Pass `children` to put something other than the
 * add button on the right.
 */
export function ColumnHeader({
    label,
    value,
    active = false,
    onAdd,
    addLabel = 'Agregar',
    className,
    children,
}: ColumnHeaderProps) {
    return (
        <div className={cx('pl-column-header', active && 'pl-column-header--active', className)}>
            <div className="pl-column-header__labels">
                <div className="pl-column-header__label">{label}</div>
                {value != null && <div className="pl-column-header__value">{value}</div>}
            </div>
            {children ??
                (onAdd && (
                    <IconButton
                        size="xs"
                        variant="plain"
                        tone={active ? 'accent' : 'muted'}
                        aria-label={addLabel}
                        onClick={onAdd}
                    >
                        +
                    </IconButton>
                ))}
        </div>
    );
}
