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
 * The box is drawn and ticked with a pen stroke; the native input stays on
 * top of it (transparent), so keyboard, forms and `register()` work unchanged.
 */
export function Checkbox({ label, labelClassName, className, disabled, ...rest }: CheckboxProps) {
    return (
        <label className={cx('pl-checkbox', disabled && 'pl-checkbox--disabled', labelClassName)}>
            <span className="pl-checkbox__control">
                <input
                    type="checkbox"
                    className={cx('pl-checkbox__input', className)}
                    disabled={disabled}
                    {...rest}
                />
                <span className="pl-checkbox__box" aria-hidden="true" />
                <svg className="pl-checkbox__tick" viewBox="0 0 19 19" aria-hidden="true">
                    <path d="M2.5 10.5 L6.5 15 L17 2.5" pathLength={26} />
                </svg>
            </span>
            <span>{label}</span>
        </label>
    );
}
