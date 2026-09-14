import {
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type ChangeEvent,
    type CSSProperties,
    type KeyboardEvent,
    type ReactNode,
} from 'react';
import { cx } from './tokens.js';
import { FieldShell } from './field.js';

const clampHour = (n: number) => Math.min(23, Math.max(0, n));
const clampMinute = (n: number) => Math.min(59, Math.max(0, n));
const pad = (n: number) => String(n).padStart(2, '0');

/** Formats free-typed digits into a partial "H", "HH", "HH:M", or "HH:MM" string, clamping each half as soon as it's complete. */
function formatTyped(digits: string): string {
    const h = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    let out = h.length === 2 ? pad(clampHour(parseInt(h, 10))) : h;
    if (digits.length > 2) {
        out += ':' + (m.length === 2 ? pad(clampMinute(parseInt(m, 10))) : m);
    }
    return out;
}

/** Reformatting inserts/removes the ":" out from under the caret, so React's default (snap-to-end) caret placement would make every edit — wherever it happens — look like it deleted the last character. This maps "N digits were before the caret" back onto the reformatted string instead, counting digits rather than raw characters. */
function caretForDigitCount(formatted: string, digitCount: number): number {
    let seen = 0;
    for (let i = 0; i < formatted.length; i++) {
        if (seen === digitCount) return i;
        if (/\d/.test(formatted[i])) seen++;
    }
    return formatted.length;
}

export interface TimeInputProps {
    /** 24h "HH:MM". Normalized on blur, so a partially typed value is fine mid-edit. */
    value: string;
    /** Fires on blur with a normalized "HH:MM", only when the value actually changed. */
    onChange: (value: string) => void;
    /** Renders the input inside a labelled field shell, full width. */
    label?: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    disabled?: boolean;
    id?: string;
    className?: string;
    style?: CSSProperties;
}

/**
 * Always renders and accepts 24h "HH:MM", regardless of browser or OS locale —
 * the planner's replacement for the native `<input type="time">` picker.
 * Standalone it is sized for "HH:MM"; given a `label` it stretches to fill its
 * column like any other field.
 */
export function TimeInput({
    value,
    onChange,
    label,
    hint,
    error,
    disabled,
    id,
    className,
    style,
}: TimeInputProps) {
    const [text, setText] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const pendingCaret = useRef<number | null>(null);
    const autoId = useId();
    const inputId = id ?? autoId;

    useEffect(() => {
        setText(value);
    }, [value]);

    useLayoutEffect(() => {
        if (pendingCaret.current !== null && inputRef.current) {
            inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
            pendingCaret.current = null;
        }
    }, [text]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const caret = e.target.selectionStart ?? raw.length;
        const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;
        const formatted = formatTyped(raw.replace(/\D/g, '').slice(0, 4));
        pendingCaret.current = caretForDigitCount(formatted, digitsBeforeCaret);
        setText(formatted);
    };

    const commit = () => {
        const digits = text.replace(/\D/g, '').padEnd(4, '0').slice(0, 4);
        const next = `${pad(clampHour(parseInt(digits.slice(0, 2), 10)))}:${pad(clampMinute(parseInt(digits.slice(2, 4), 10)))}`;
        setText(next);
        if (next !== value) onChange(next);
    };

    const input = (
        <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="numeric"
            placeholder="HH:MM"
            value={text}
            disabled={disabled}
            onChange={handleChange}
            onBlur={commit}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            maxLength={5}
            className={cx('pl-input', 'pl-input--time', className)}
            style={{ fontVariantNumeric: 'tabular-nums', ...style }}
        />
    );

    if (label == null && hint == null && error == null) return input;

    return (
        <FieldShell id={inputId} label={label} hint={hint} error={error}>
            {input}
        </FieldShell>
    );
}
