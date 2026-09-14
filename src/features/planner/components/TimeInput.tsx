'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent } from 'react';

const clampHour = (n: number) => Math.min(23, Math.max(0, n));
const clampMinute = (n: number) => Math.min(59, Math.max(0, n));
const pad = (n: number) => String(n).padStart(2, '0');

/** Plain text inputs have no intrinsic width like the native time widget did — fall back to a fixed width sized for "HH:MM" unless the caller sets its own (e.g. `width: '100%'` in a flex column). */
const defaultStyle: CSSProperties = { width: 72, textAlign: 'center' };

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

/** Always renders/accepts 24h "HH:MM", regardless of browser or OS locale — replaces the native `<input type="time">` picker. */
export function TimeInput({
    value,
    onChange,
    style,
    id,
}: {
    value: string;
    onChange: (value: string) => void;
    style?: CSSProperties;
    id?: string;
}) {
    const [text, setText] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const pendingCaret = useRef<number | null>(null);

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

    return (
        <input
            ref={inputRef}
            id={id}
            type="text"
            inputMode="numeric"
            placeholder="HH:MM"
            value={text}
            onChange={handleChange}
            onBlur={commit}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            maxLength={5}
            style={{ ...defaultStyle, ...style, fontVariantNumeric: 'tabular-nums' }}
        />
    );
}
