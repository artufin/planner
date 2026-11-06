import type { ReactNode } from 'react';
import { cx } from './tokens.js';

export interface SectionDividerProps {
    /** The heading, set semi-condensed in ink on the left of the rule. */
    label: ReactNode;
    /** Quiet trailing text at the end of the rule, e.g. "4 categorías". */
    aside?: ReactNode;
    /** Renders the label as `<h2>`–`<h4>` so the section shows up in the document outline. Omit for a plain `<div>`. */
    level?: 2 | 3 | 4;
    className?: string;
}

/**
 * A section heading written on a ruled line: the label on the left, the rule
 * running out to the right, an optional aside at its end. Works on any surface
 * (page or sheet) — nothing paints over the rule.
 */
export function SectionDivider({ label, aside, level, className }: SectionDividerProps) {
    const Label = level ? (`h${level}` as const) : 'div';
    return (
        <div className={cx('pl-section-divider', className)}>
            <Label className="pl-section-divider__label">{label}</Label>
            <div className="pl-section-divider__rule" aria-hidden="true" />
            {aside != null && <div className="pl-section-divider__aside">{aside}</div>}
        </div>
    );
}
