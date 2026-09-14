import type { ReactNode } from 'react';
import { cx } from './tokens.js';

export interface SectionDividerProps {
    /** Sits inset over the rule, in small caps-tracked type. */
    label: ReactNode;
    className?: string;
}

/**
 * A horizontal rule with its heading notched into it — how the planner groups
 * categories on the categories screen. The label paints over the page
 * background, so place it on `--pl-color-page-bg`, not on a white card.
 */
export function SectionDivider({ label, className }: SectionDividerProps) {
    return (
        <div className={cx('pl-section-divider', className)}>
            <div className="pl-section-divider__rule" />
            <div className="pl-section-divider__label">{label}</div>
        </div>
    );
}
