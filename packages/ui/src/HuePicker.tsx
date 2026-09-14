import { HUE_SWATCHES, cx } from './tokens.js';
import { Swatch } from './Swatch.js';

export interface HuePickerProps {
    /** The currently chosen hue. */
    value: number;
    onChange: (hue: number) => void;
    /** Defaults to the eight planner category hues (`HUE_SWATCHES`). */
    hues?: number[];
    /** Cell side in px. */
    size?: number;
    /** Names the group for assistive tech. */
    ariaLabel?: string;
    className?: string;
}

/** The row of category colors a user picks from when naming a category. */
export function HuePicker({
    value,
    onChange,
    hues = HUE_SWATCHES,
    size = 26,
    ariaLabel = 'Color',
    className,
}: HuePickerProps) {
    return (
        <div className={cx('pl-hue-picker', className)} role="group" aria-label={ariaLabel}>
            {hues.map((h) => (
                <Swatch
                    key={h}
                    hue={h}
                    shape="tile"
                    size={size}
                    selected={h === value}
                    onClick={() => onChange(h)}
                    ariaLabel={`Hue ${h}`}
                />
            ))}
        </div>
    );
}
