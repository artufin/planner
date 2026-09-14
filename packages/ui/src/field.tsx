import type { ReactNode } from 'react';
import { cx } from './tokens.js';

/**
 * Internal label/hint/error shell shared by TextField, SelectField and the
 * labelled form of TimeInput. Not exported from the package — the fields are
 * the public API.
 */
export function FieldShell({
    id,
    label,
    hint,
    error,
    className,
    children,
}: {
    id: string;
    label?: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={cx('pl-field', error && 'pl-field--invalid', className)}>
            {label != null && (
                <label className="pl-field__label" htmlFor={id}>
                    {label}
                </label>
            )}
            {children}
            {error != null ? (
                <div className="pl-field__error">{error}</div>
            ) : hint != null ? (
                <div className="pl-field__hint">{hint}</div>
            ) : null}
        </div>
    );
}
