import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './tokens.js';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    /** `md` (28px) for toolbar arrows, `sm` (26px) for a modal close, `xs` (20px) for an inline add. */
    size?: 'md' | 'sm' | 'xs';
    /** `outline` for standalone toolbar buttons, `solid` inside a tinted control group, `plain` for chromeless glyphs. */
    variant?: 'outline' | 'solid' | 'plain';
    tone?: 'default' | 'muted' | 'accent';
    /** Renders the oversized close glyph used in a Modal header. */
    close?: boolean;
    /** Required — the glyph carries no text, so the button needs its own name. */
    'aria-label': string;
    children?: ReactNode;
}

/**
 * A square button holding a single glyph — the nav arrows, zoom controls, modal
 * close, and the `+` on a ColumnHeader. Always give it an `aria-label`.
 */
export function IconButton({
    size = 'md',
    variant = 'outline',
    tone = 'default',
    close = false,
    type = 'button',
    className,
    children,
    ...rest
}: IconButtonProps) {
    return (
        <button
            type={type}
            className={cx(
                'pl-icon-btn',
                `pl-icon-btn--${size}`,
                `pl-icon-btn--${variant}`,
                `pl-icon-btn--tone-${tone}`,
                close && 'pl-icon-btn--close',
                className,
            )}
            {...rest}
        >
            {children}
        </button>
    );
}
