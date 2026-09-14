import type { InputHTMLAttributes, ReactNode } from 'react';
import { cx } from './tokens.js';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    /** The clickable text beside the box. The whole row is the label. */
    label: ReactNode;
    /** Class for the wrapping `<label>`; `className` still goes to the `<input>`. */
    labelClassName?: string;
}

/**
 * A checkbox and its text on one clickable row — how the planner's modals
 * toggle optional sections ("Incluir horario", "Incluir fecha límite").
 */
export function Checkbox({ label, labelClassName, className, disabled, ...rest }: CheckboxProps) {
    return (
        <label className={cx('pl-checkbox', disabled && 'pl-checkbox--disabled', labelClassName)}>
            <input
                type="checkbox"
                className={cx('pl-checkbox__input', className)}
                disabled={disabled}
                {...rest}
            />
            <span>{label}</span>
        </label>
    );
}
