import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from './tokens.js';
import { FieldShell, fieldNoteId } from './field.js';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    /** Sits above the input in the small label style. */
    label?: ReactNode;
    /** Marks the field as optional with a quiet "opcional" beside the label. */
    optional?: boolean;
    /** Explanatory line under the input. Hidden while `error` is set. */
    hint?: ReactNode;
    /** Replaces the hint and inks the bottom line red. */
    error?: ReactNode;
    /** Class for the wrapper; `className` still goes to the `<input>`. */
    fieldClassName?: string;
}

/**
 * A labelled text input — the form row used throughout the planner's modals.
 * Works for any `type` the platform input supports, including `date`.
 */
export function TextField({ label, optional, hint, error, fieldClassName, className, id, ...rest }: TextFieldProps) {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
        <FieldShell id={inputId} label={label} optional={optional} hint={hint} error={error} className={fieldClassName}>
            <input
                id={inputId}
                className={cx('pl-input', className)}
                aria-invalid={error != null ? true : undefined}
                aria-describedby={fieldNoteId(inputId, hint, error)}
                {...rest}
            />
        </FieldShell>
    );
}
