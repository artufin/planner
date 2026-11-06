import { categoryColor } from './palette.js';

/**
 * The planner palette, as JS values mirroring the `--pl-color-*` custom
 * properties in `styles.css`. Prefer the CSS variables in stylesheets; these
 * exist for the cases where a value has to be computed in JS.
 */
export const colors = {
    pageBg: 'oklch(98.4% 0.006 235)',
    surface: '#fff',
    ink: 'oklch(27% 0.075 264)',
    text: 'oklch(27% 0.075 264)',
    textStrong: 'oklch(30% 0.07 264)',
    textSecondary: 'oklch(42% 0.05 262)',
    textNav: 'oklch(36% 0.06 262)',
    textFaint: 'oklch(71% 0.02 250)',
    sidebarBg: 'oklch(96.4% 0.011 245)',
    border: 'oklch(90.5% 0.017 238)',
    borderStrong: 'oklch(85.5% 0.022 240)',
    rule: 'oklch(83% 0.025 240)',
    grid: 'oklch(93.6% 0.02 228)',
    margin: 'oklch(78% 0.1 22)',
    checkboxBorder: 'oklch(70% 0.035 258)',
    accent: 'oklch(38% 0.15 266)',
    accentSoftBg: 'oklch(94.5% 0.028 262)',
    accentText: 'oklch(33% 0.13 266)',
    highlight: 'oklch(93.5% 0.165 106)',
    highlightSoft: 'oklch(97% 0.07 106)',
    highlightStrong: 'oklch(89% 0.185 104)',
    muted: 'oklch(55% 0.03 256)',
    mutedLight: 'oklch(62% 0.025 255)',
    label: 'oklch(50% 0.035 258)',
    dangerBorder: 'oklch(87% 0.06 27)',
    dangerText: 'oklch(52% 0.2 27)',
    dangerSoftBg: 'oklch(96.8% 0.022 27)',
    warnText: 'oklch(54% 0.14 62)',
    chipBg: 'oklch(95.6% 0.011 245)',
    fieldText: 'oklch(28% 0.07 264)',
    controlBg: 'oklch(94% 0.013 245)',
    nowLine: 'oklch(57% 0.21 27)',
    tooltipBg: 'oklch(25% 0.075 264)',
} as const;

export { CATEGORY_PALETTE, HUE_SWATCHES, categoryColor, colorName, colorDistance, similarColors, suggestHue } from './palette.js';
export type { CategoryColor } from './palette.js';

/**
 * Category colors. A hue that is a palette key (see palette.ts) gets its
 * hand-tuned color; anything else falls back to one formula on the hue angle.
 * A null hue means "no category" — rendered in neutral gray.
 */
export function solidColor(hue: number | null): string {
    if (hue === null) return 'oklch(62% 0.02 255)';
    const p = categoryColor(hue);
    return p ? `oklch(${p.l} ${p.c} ${p.h})` : `oklch(57% 0.15 ${hue})`;
}

/** The tinted background that pairs with `solidColor`. */
export function softColor(hue: number | null): string {
    if (hue === null) return 'oklch(95% 0.008 250)';
    const p = categoryColor(hue);
    return p ? `oklch(95.5% ${Math.min(0.026, p.c * 0.18).toFixed(3)} ${p.h})` : `oklch(95% 0.032 ${hue})`;
}

/** Readable text on top of `softColor` (and on white). */
export function softTextColor(hue: number | null): string {
    if (hue === null) return 'oklch(40% 0.03 258)';
    const p = categoryColor(hue);
    return p ? `oklch(40% ${Math.min(0.085, p.c * 0.65).toFixed(3)} ${p.h})` : `oklch(37% 0.1 ${hue})`;
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
