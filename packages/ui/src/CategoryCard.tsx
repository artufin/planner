import type { CSSProperties, ReactNode } from 'react';
import { cx, hueVars } from './tokens.js';

export interface CategoryCardProps {
    name: ReactNode;
    /** The category hue, painting the strip and the meta line. `null` is the neutral treatment. */
    hue: number | null;
    /** Secondary line under the name, e.g. "3 pendientes". */
    meta?: ReactNode;
    onClick?: () => void;
    className?: string;
    style?: CSSProperties;
}

/**
 * A category tile for the categories grid: a color strip across the top, the
 * name, and a count line tinted to match. Renders as a `<button>` when
 * `onClick` is given, so keyboard users reach it.
 */
export function CategoryCard({ name, hue, meta, onClick, className, style }: CategoryCardProps) {
    const inner = (
        <>
            <div className="pl-category-card__strip" />
            <div className="pl-category-card__name">{name}</div>
            {meta != null && <div className="pl-category-card__meta">{meta}</div>}
        </>
    );
    const props = {
        className: cx('pl-category-card', onClick && 'pl-category-card--clickable', className),
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
