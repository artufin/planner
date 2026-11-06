import type { CSSProperties, ReactNode } from 'react';
import { cx, hueVars } from './tokens.js';

export interface CategoryCardProps {
    name: ReactNode;
    /** The category hue, painting the divider tab and the meta line. `null` is the neutral treatment. */
    hue: number | null;
    /** Secondary line under the name, e.g. "3 pendientes". */
    meta?: ReactNode;
    /**
     * Extra facts beside the name (next class, next deliverable, counts…). They
     * sit to the right on a wide row and wrap under the name when it's narrow.
     * Rendered inside a `<button>` when clickable, so pass inline content (spans).
     */
    details?: ReactNode;
    /**
     * `slip` (default) is a standalone paper slip with its own border and shadow.
     * `row` is flush — no border or shadow, just a rule underneath — for stacking
     * several subjects on one sheet, like the dividers of a ring binder.
     */
    variant?: 'slip' | 'row';
    onClick?: () => void;
    className?: string;
    style?: CSSProperties;
}

/**
 * A subject as a notebook divider: a colored tab down the left edge, the name
 * in semi-condensed type, a tinted meta line and optional details. Renders as a
 * `<button>` when `onClick` is given, so keyboard users reach it.
 */
export function CategoryCard({ name, hue, meta, details, variant = 'slip', onClick, className, style }: CategoryCardProps) {
    const inner = (
        <>
            <span className="pl-category-card__tab" aria-hidden="true" />
            <span className="pl-category-card__main">
                <span className="pl-category-card__name">{name}</span>
                {meta != null && <span className="pl-category-card__meta">{meta}</span>}
            </span>
            {details != null && <span className="pl-category-card__details">{details}</span>}
        </>
    );
    const props = {
        className: cx(
            'pl-category-card',
            `pl-category-card--${variant}`,
            onClick && 'pl-category-card--clickable',
            className,
        ),
        style: { ...hueVars(hue), ...style } as CSSProperties,
    };

    if (onClick) {
        return (
            <button type="button" onClick={onClick} {...props}>
                {inner}
            </button>
        );
    }
    return <div {...props}>{inner}</div>;
}
