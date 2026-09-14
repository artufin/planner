import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cx } from './tokens.js';
import { FieldShell } from './field.js';

export interface SelectFieldOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    /** Convenience over writing `<option>` children; ignored when `children` is given. */
    options?: SelectFieldOption[];
    /** Prepends a blank-valued option, for "none selected". */
    placeholder?: string;
    fieldClassName?: string;
}

/** A labelled `<select>` wearing the same shell as TextField. */
export function SelectField({
    label,
    hint,
    error,
    options,
    placeholder,
    fieldClassName,
    className,
    id,
    children,
    ...rest
}: SelectFieldProps) {
    const autoId = useId();
    const selectId = id ?? autoId;
    return (
        <FieldShell id={selectId} label={label} hint={hint} error={error} className={fieldClassName}>
            <select id={selectId} className={cx('pl-input', className)} {...rest}>
                {placeholder != null && <option value="">{placeholder}</option>}
                {children ??
                    options?.map((o) => (
                        <option key={o.value} value={o.value} disabled={o.disabled}>
                            {o.label}
                        </option>
                    ))}
            </select>
        </FieldShell>
    );
}
