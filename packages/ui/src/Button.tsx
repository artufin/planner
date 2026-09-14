import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './tokens.js';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
    /**
     * `primary` is the one filled accent button in a view — the commit action.
     * `secondary` and `danger` are outlined; `ghost` is chromeless, for
     * low-emphasis actions sitting inside a toolbar or a card.
     */
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    /** `md` (34px) is the default; `sm` (28px) is for toolbars and card footers. */
    size?: 'md' | 'sm';
    children?: ReactNode;
}

/**
 * The planner's text button. Defaults to `type="button"` so it never submits a
 * form by accident — pass `type="submit"` for the commit action in a Modal.
 */
export function Button({
    variant = 'primary',
    size = 'md',
    type = 'button',
    className,
    children,
    ...rest
}: ButtonProps) {
    return (
        <button
            type={type}
            className={cx('pl-btn', `pl-btn--${variant}`, `pl-btn--${size}`, className)}
            {...rest}
        >
            {children}
        </button>
    );
}
