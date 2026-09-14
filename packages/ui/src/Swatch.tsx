import type { CSSProperties } from 'react';
import { cx, hueVars } from './tokens.js';

export interface SwatchProps {
    /** A category hue (0–360). `null` renders the neutral gray used for "sin categoría". */
    hue: number | null;
    /** `dot` for an inline marker, `tile` for a picker cell, `bar` for a full-width strip. */
    shape?: 'dot' | 'tile' | 'bar';
    /** Square side in px for `dot`/`tile`, height in px for `bar`. */
    size?: number;
    /** Draws the double-ring selection halo used by HuePicker. */
    selected?: boolean;
    onClick?: () => void;
    /** Accessible name. Required when `onClick` is given, since the swatch has no text. */
    ariaLabel?: string;
    className?: string;
    style?: CSSProperties;
}

/**
 * A block of one category color — the dot beside a category name, a cell in the
 * hue picker, or the strip across the top of a CategoryCard. Renders as a
 * `<button>` when clickable and a `<div>` otherwise.
 */
export function Swatch({
    hue,
    shape = 'dot',
    size,
    selected = false,
    onClick,
    ariaLabel,
    className,
    style,
}: SwatchProps) {
    const px = size ?? (shape === 'bar' ? 4 : shape === 'tile' ? 26 : 14);
    const sizing: CSSProperties = shape === 'bar' ? { height: px } : { width: px, height: px };
    const props = {
        className: cx('pl-swatch', `pl-swatch--${shape}`, selected && 'pl-swatch--selected', onClick && 'pl-swatch--clickable', className),
        style: { ...hueVars(hue), ...sizing, ...style } as CSSProperties,
    };

    if (onClick) {
        return <button type="button" aria-label={ariaLabel} aria-pressed={selected} onClick={onClick} {...props} />;
    }
    return <div aria-label={ariaLabel} {...props} />;
}
