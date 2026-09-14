import type { ReactNode } from 'react';
import { cx } from './tokens.js';

export interface SegmentedControlOption {
    value: string;
    label: ReactNode;
    /** Needed when the label is a glyph rather than words. */
    ariaLabel?: string;
    disabled?: boolean;
}

export interface SegmentedControlProps {
    options: SegmentedControlOption[];
    /** The selected option's `value`. Pass `null` for a group with no selection — the zoom control, say. */
    value?: string | null;
    onChange?: (value: string) => void;
    /** `md` (30px) for view switchers, `sm` (26px) for compact toolbars. */
    size?: 'md' | 'sm';
    /** Names the group for assistive tech, e.g. "Vista". */
    ariaLabel?: string;
    className?: string;
}

/**
 * A tinted track holding two or more buttons, one of which reads as selected —
 * the planner's Calendario / Semana view switcher. With `value={null}` the same
 * track works as a plain button group (the zoom − / + pair).
 */
export function SegmentedControl({
    options,
    value = null,
    onChange,
    size = 'md',
    ariaLabel,
    className,
}: SegmentedControlProps) {
    return (
        <div
            className={cx('pl-segmented', `pl-segmented--${size}`, className)}
            role="group"
            aria-label={ariaLabel}
        >
            {options.map((o) => {
                const active = value !== null && o.value === value;
                return (
                    <button
                        key={o.value}
                        type="button"
                        aria-label={o.ariaLabel}
                        aria-pressed={value === null ? undefined : active}
                        disabled={o.disabled}
                        onClick={() => onChange?.(o.value)}
                        className={cx('pl-segmented__option', active && 'pl-segmented__option--active')}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}
