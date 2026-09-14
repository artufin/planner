import type { FormEventHandler, ReactNode } from 'react';
import { cx } from './tokens.js';
import { IconButton } from './IconButton.js';

export interface ModalProps {
    /** Set `false` to render nothing. Defaults to open, so a caller that already conditions on state can omit it. */
    open?: boolean;
    title: ReactNode;
    onClose: () => void;
    /** Card width in px. The planner uses 380 for most forms and 340 for the category form. */
    width?: number;
    /** The action row pinned under the body — typically a danger button on the left and a submit on the right. */
    footer?: ReactNode;
    /** Renders the card as a `<form>`, so a `type="submit"` button in the footer commits it. */
    asForm?: boolean;
    onSubmit?: FormEventHandler<HTMLFormElement>;
    /** Clicking the dimmed backdrop closes the modal. */
    closeOnOverlayClick?: boolean;
    closeLabel?: string;
    className?: string;
    children?: ReactNode;
}

/**
 * A centered card over a dimmed backdrop, with a title row and close button.
 * Body children are laid out in a 12px flex column, so form rows stack without
 * any spacing of their own.
 */
export function Modal({
    open = true,
    title,
    onClose,
    width,
    footer,
    asForm = false,
    onSubmit,
    closeOnOverlayClick = true,
    closeLabel = 'Cerrar',
    className,
    children,
}: ModalProps) {
    if (!open) return null;

    const body = (
        <>
            <div className="pl-modal__header">
                <div className="pl-modal__title">{title}</div>
                <IconButton size="sm" variant="plain" tone="muted" close aria-label={closeLabel} onClick={onClose}>
                    ×
                </IconButton>
            </div>
            {children}
            {footer != null && <div className="pl-modal__footer">{footer}</div>}
        </>
    );

    const cardClass = cx('pl-modal__card', className);
    const cardStyle = width != null ? { width } : undefined;

    return (
        <div
            className="pl-modal"
            role="dialog"
            aria-modal="true"
            onClick={closeOnOverlayClick ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
        >
            {asForm ? (
                <form className={cardClass} style={cardStyle} onSubmit={onSubmit}>
                    {body}
                </form>
            ) : (
                <div className={cardClass} style={cardStyle}>
                    {body}
                </div>
            )}
        </div>
    );
}
