import { useEffect, useId, useRef, type FormEventHandler, type ReactNode } from 'react';
import { cx } from './tokens';
import { IconButton } from './IconButton';

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
    /** Pressing Escape closes the modal. On by default. */
    closeOnEscape?: boolean;
    closeLabel?: string;
    className?: string;
    children?: ReactNode;
}

const FOCUSABLE_FIELD = 'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled)';

/**
 * A sheet of notebook paper over a dimmed backdrop, with a title row and close
 * button. Body children are laid out in a 12px flex column, so form rows stack
 * without any spacing of their own.
 *
 * On open it moves focus to the first field (or the sheet itself), closes on
 * Escape, and hands focus back to whatever had it when it closes.
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
    closeOnEscape = true,
    closeLabel = 'Cerrar',
    className,
    children,
}: ModalProps) {
    const titleId = useId();
    const cardRef = useRef<HTMLElement | null>(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!open) return;
        const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const card = cardRef.current;
        if (card && !card.contains(document.activeElement)) {
            const field = card.querySelector<HTMLElement>(FOCUSABLE_FIELD);
            (field ?? card).focus({ preventScroll: true });
        }
        return () => {
            if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
        };
    }, [open]);

    useEffect(() => {
        if (!open || !closeOnEscape) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !e.defaultPrevented) {
                e.preventDefault();
                onCloseRef.current();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, closeOnEscape]);

    if (!open) return null;

    const body = (
        <>
            <div className="pl-modal__header">
                <h2 className="pl-modal__title" id={titleId}>
                    {title}
                </h2>
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
            aria-labelledby={titleId}
            onClick={closeOnOverlayClick ? (e) => { if (e.target === e.currentTarget) onClose(); } : undefined}
        >
            {asForm ? (
                <form
                    ref={(el) => { cardRef.current = el; }}
                    className={cardClass}
                    style={cardStyle}
                    onSubmit={onSubmit}
                    tabIndex={-1}
                >
                    {body}
                </form>
            ) : (
                <div
                    ref={(el) => { cardRef.current = el; }}
                    className={cardClass}
                    style={cardStyle}
                    tabIndex={-1}
                >
                    {body}
                </div>
            )}
        </div>
    );
}
