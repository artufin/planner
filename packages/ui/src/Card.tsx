import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './tokens.js';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    /** `md` (14px) is the default; `sm` (10px) for dense grids. */
    padding?: 'md' | 'sm';
    /** Adds the pointer cursor and hover lift for a card that is itself a link or button. */
    interactive?: boolean;
    children?: ReactNode;
}

/** The planner's plain white surface: 1px border, 10px radius, flex column. */
export function Card({ padding = 'md', interactive = false, className, children, ...rest }: CardProps) {
    return (
        <div
            className={cx('pl-card', `pl-card--${padding}`, interactive && 'pl-card--interactive', className)}
            {...rest}
        >
            {children}
        </div>
    );
}
