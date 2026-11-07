import { HUE_SWATCHES, cx } from './tokens';
import { colorName, similarColors } from './palette';
import { Swatch } from './Swatch';

/** A color another category already has. */
export interface UsedHue {
    hue: number;
    /** The category's name, e.g. "Química". */
    label: string;
}

export interface HuePickerProps {
    /** The currently chosen hue (a palette key). */
    value: number;
    onChange: (hue: number) => void;
    /** Defaults to the curated category palette (`HUE_SWATCHES`). */
    hues?: number[];
    /** Colors other categories use: marked on their swatch, and named when the choice looks like one of them. */
    used?: UsedHue[];
    /** Cell side in px. */
    size?: number;
    /** Names the group for assistive tech. */
    ariaLabel?: string;
    className?: string;
}

function listNames(names: string[]): string {
    if (names.length <= 1) return names.join('');
    return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
}

/**
 * The category color grid. Each color has a name; colors already taken carry
 * a small mark, and a choice that's easy to confuse with another category's
 * color says so underneath.
 */
export function HuePicker({ value, onChange, hues = HUE_SWATCHES, used = [], size = 28, ariaLabel = 'Color', className }: HuePickerProps) {
    /** A category saved with a color that's no longer offered keeps it, shown first. */
    const options = hues.includes(value) ? hues : [value, ...hues];
    const lookalikes = similarColors(value, used);
    const exact = lookalikes.filter((u) => u.hue === value).map((u) => u.label);
    const near = lookalikes.filter((u) => u.hue !== value).map((u) => u.label);

    return (
        <div className={cx('pl-hue-picker', className)}>
            <div className="pl-hue-picker__grid" role="group" aria-label={ariaLabel}>
                {options.map((h) => {
                    const takenBy = used.filter((u) => u.hue === h).map((u) => u.label);
                    const name = colorName(h);
                    const label = takenBy.length > 0 ? `${name}, lo usa ${listNames(takenBy)}` : name;
                    return (
                        <span key={h} className="pl-hue-picker__cell" title={label}>
                            <Swatch hue={h} shape="tile" size={size} selected={h === value} onClick={() => onChange(h)} ariaLabel={label} />
                            {takenBy.length > 0 && <span className="pl-hue-picker__taken" aria-hidden="true" />}
                        </span>
                    );
                })}
            </div>
            <p className="pl-hue-picker__caption" aria-live="polite">
                <span className="pl-hue-picker__name">{colorName(value)}</span>
                {exact.length > 0 ? (
                    <span className="pl-hue-picker__warn">Es el mismo color de {listNames(exact)}.</span>
                ) : near.length > 0 ? (
                    <span className="pl-hue-picker__warn">Se parece al color de {listNames(near)}.</span>
                ) : null}
            </p>
        </div>
    );
}
