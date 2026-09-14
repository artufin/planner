/**
 * The planner palette, as JS values mirroring the `--pl-color-*` custom
 * properties in `styles.css`. Prefer the CSS variables in stylesheets; these
 * exist for the cases where a value has to be computed in JS.
 */
export const colors = {
    pageBg: 'oklch(98% 0.004 95)',
    surface: '#fff',
    text: 'oklch(22% 0.01 95)',
    textStrong: 'oklch(30% 0.01 95)',
    textSecondary: 'oklch(40% 0.01 95)',
    textNav: 'oklch(35% 0.01 95)',
    textFaint: 'oklch(68% 0.005 95)',
    sidebarBg: 'oklch(96.5% 0.005 95)',
    border: 'oklch(89% 0.004 95)',
    borderStrong: 'oklch(87% 0.004 95)',
    rule: 'oklch(85% 0.005 95)',
    checkboxBorder: 'oklch(75% 0.01 95)',
    accent: 'oklch(56% 0.16 255)',
    accentSoftBg: 'oklch(92% 0.02 255)',
    accentText: 'oklch(48% 0.16 255)',
    muted: 'oklch(55% 0.01 95)',
    mutedLight: 'oklch(60% 0.01 95)',
    label: 'oklch(50% 0.01 95)',
    dangerBorder: 'oklch(90% 0.03 25)',
    dangerText: 'oklch(50% 0.15 25)',
    warnText: 'oklch(52% 0.14 70)',
    chipBg: 'oklch(95% 0.004 95)',
    fieldText: 'oklch(25% 0.01 95)',
    controlBg: 'oklch(94% 0.004 95)',
    nowLine: 'oklch(58% 0.19 25)',
    tooltipBg: 'oklch(20% 0.01 95)',
} as const;

/** The eight category hues a user can pick from. */
export const HUE_SWATCHES = [255, 165, 70, 300, 20, 340, 190, 120];

/** A null hue means "no category" — rendered in neutral gray instead of a category color. */
export function solidColor(hue: number | null): string {
    return hue === null ? 'oklch(62% 0.012 95)' : `oklch(56% 0.16 ${hue})`;
}

/** The tinted background that pairs with `solidColor` at the same hue. */
export function softColor(hue: number | null): string {
    return hue === null ? 'oklch(94% 0.004 95)' : `oklch(93% 0.035 ${hue})`;
}

/** Readable text on top of `softColor` at the same hue. */
export function softTextColor(hue: number | null): string {
    return hue === null ? 'oklch(40% 0.01 95)' : `oklch(38% 0.1 ${hue})`;
}

/**
 * The three category colors as inline custom properties, for any element whose
 * class styles read `var(--pl-cat-solid)` / `--pl-cat-soft` / `--pl-cat-text`.
 */
export function hueVars(hue: number | null): Record<string, string> {
    return {
        '--pl-cat-solid': solidColor(hue),
        '--pl-cat-soft': softColor(hue),
        '--pl-cat-text': softTextColor(hue),
    };
}

/**
 * Joins class names, keeping only non-empty strings — so `cond && 'cls'` works
 * whatever `cond` is, including a ReactNode that happens to be `0`.
 */
export function cx(...parts: unknown[]): string {
    return parts.filter((p): p is string => typeof p === 'string' && p.length > 0).join(' ');
}
