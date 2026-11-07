import type { ReactNode } from 'react';
import { cx } from './tokens';

/**
 * Internal label/hint/error shell shared by TextField, SelectField and the
 * labelled form of TimeInput. Not exported from the package — the fields are
 * the public API.
 */
export function FieldShell({
    id,
    label,
    optional,
    hint,
    error,
    className,
    children,
}: {
    id: string;
    label?: ReactNode;
    /** Adds a quiet "opcional" note after the label. */
    optional?: boolean;
    hint?: ReactNode;
    error?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    const hintId = `${id}-note`;
    return (
        <div className={cx('pl-field', error && 'pl-field--invalid', className)}>
            {label != null && (
                <label className="pl-field__label" htmlFor={id}>
                    {label}
                    {optional && <span className="pl-field__optional">opcional</span>}
                </label>
            )}
            {children}
            {error != null ? (
                <div className="pl-field__error" id={hintId} role="alert">
                    {error}
                </div>
            ) : hint != null ? (
                <div className="pl-field__hint" id={hintId}>
                    {hint}
                </div>
            ) : null}
        </div>
    );
}

/** The `aria-describedby` a field's control should carry, matching the note FieldShell renders. */
export function fieldNoteId(id: string, hint: ReactNode, error: ReactNode): string | undefined {
    return error != null || hint != null ? `${id}-note` : undefined;
}
