/**
 * The category palette: sixteen colors tuned by hand in OKLCH instead of one
 * formula applied to any hue.
 *
 * How it was curated (re-run these checks before adding or changing a color):
 * - Each solid has at least 3:1 contrast on white (it marks things), and the
 *   category text color on its soft tint reaches 7.8:1 or more.
 * - Any two solids are at least ΔE 0.073 apart in OKLab, so neighbours read as
 *   different colors, not shades of one.
 * - None sits on a color the UI already gives a meaning: the ink blue of text,
 *   the red pen of "vencido" and "ahora", the gray of "sin categoría". That is
 *   why there is no plain red.
 * - Light and dark versions of the same family (Pasto / Bosque, Turquesa /
 *   Petróleo, Naranja / Café) differ mostly in lightness, which also survives
 *   color blindness better than a hue shift.
 * Sixteen colors can't all stay apart for every kind of color vision, so the
 * picker also says when a choice looks like a color another category already
 * uses (`similarColors`) and suggests the most distinct free one (`suggestHue`).
 *
 * `key` is the number stored in `Category.hue`. It stays close to the real hue
 * angle so a category whose key isn't in the palette still renders sensibly
 * through the generic formula in tokens.ts.
 */
export interface CategoryColor {
    key: number;
    name: string;
    /** OKLCH of the solid color. */
    l: number;
    c: number;
    h: number;
    /** Kept so existing categories render well, but not offered for new picks. */
    retired?: boolean;
}

/** In picker order: around the color wheel from wine to brown. */
export const CATEGORY_PALETTE: readonly CategoryColor[] = [
    { key: 10, name: 'Vino', l: 0.44, c: 0.135, h: 8 },
    { key: 340, name: 'Rosa', l: 0.64, c: 0.18, h: 354 },
    { key: 315, name: 'Orquídea', l: 0.585, c: 0.17, h: 324 },
    { key: 300, name: 'Violeta', l: 0.53, c: 0.165, h: 298 },
    { key: 280, name: 'Índigo', l: 0.48, c: 0.15, h: 278 },
    { key: 255, name: 'Azul', l: 0.58, c: 0.14, h: 252 },
    { key: 235, name: 'Celeste', l: 0.65, c: 0.105, h: 232 },
    { key: 212, name: 'Petróleo', l: 0.45, c: 0.07, h: 214 },
    { key: 190, name: 'Turquesa', l: 0.6, c: 0.1, h: 194 },
    { key: 165, name: 'Menta', l: 0.64, c: 0.13, h: 165 },
    { key: 145, name: 'Pasto', l: 0.545, c: 0.145, h: 142 },
    { key: 150, name: 'Bosque', l: 0.41, c: 0.08, h: 158 },
    { key: 120, name: 'Oliva', l: 0.6, c: 0.115, h: 108 },
    { key: 70, name: 'Ámbar', l: 0.665, c: 0.14, h: 72 },
    { key: 50, name: 'Naranja', l: 0.64, c: 0.165, h: 47 },
    { key: 55, name: 'Café', l: 0.47, c: 0.065, h: 52 },
    /** The old palette's red. Too close to the red pen to offer again. */
    { key: 20, name: 'Rojo', l: 0.55, c: 0.17, h: 22, retired: true },
];

const BY_KEY = new Map(CATEGORY_PALETTE.map((p) => [p.key, p]));

/** The palette entry for a stored hue, if it is one. */
export function categoryColor(hue: number | null | undefined): CategoryColor | undefined {
    return hue == null ? undefined : BY_KEY.get(hue);
}

/** The keys offered for new picks. */
export const HUE_SWATCHES: number[] = CATEGORY_PALETTE.filter((p) => !p.retired).map((p) => p.key);

/** "Azul", or "Color 123" for a hue outside the palette. */
export function colorName(hue: number | null): string {
    if (hue === null) return 'Sin color';
    return categoryColor(hue)?.name ?? `Color ${hue}`;
}

// ---------------------------------------------------------------------------
// Distances. OKLCH → linear sRGB → OKLab, plus a deuteranopia simulation
// (Machado et al. 2009, full severity) since that's the most common type.

type Vec3 = [number, number, number];

function solidLch(hue: number): Vec3 {
    const p = categoryColor(hue);
    return p ? [p.l, p.c, p.h] : [0.57, 0.15, hue];
}

function lchToLinearRgb([L, C, h]: Vec3): Vec3 {
    const a = C * Math.cos((h * Math.PI) / 180);
    const b = C * Math.sin((h * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const clamp = (x: number) => Math.min(1, Math.max(0, x));
    return [
        clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
        clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
        clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    ];
}

function linearRgbToLab([r, g, b]: Vec3): Vec3 {
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [
        0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ];
}

const DEUTAN = [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
];

function deutan([r, g, b]: Vec3): Vec3 {
    return DEUTAN.map((row) => Math.min(1, Math.max(0, row[0] * r + row[1] * g + row[2] * b))) as Vec3;
}

function dist(a: Vec3, b: Vec3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * How different two category colors look: the OKLab distance, counting a
 * deuteranope's view too (whichever is smaller wins, scaled so the two are
 * comparable). Below ~0.09 they're easy to mix up at chip size.
 */
export function colorDistance(a: number, b: number): number {
    const ra = lchToLinearRgb(solidLch(a));
    const rb = lchToLinearRgb(solidLch(b));
    const normal = dist(linearRgbToLab(ra), linearRgbToLab(rb));
    const cvd = dist(linearRgbToLab(deutan(ra)), linearRgbToLab(deutan(rb)));
    return Math.min(normal, cvd * 2.5);
}

const SIMILAR_BELOW = 0.09;

/** The entries of `used` whose color is easy to confuse with `hue`. */
export function similarColors<T extends { hue: number }>(hue: number, used: readonly T[]): T[] {
    return used.filter((u) => u.hue === hue || colorDistance(hue, u.hue) < SIMILAR_BELOW);
}

/** The palette color that stands furthest from every color in `used` — the default for a new category. */
export function suggestHue(used: readonly number[]): number {
    let best = HUE_SWATCHES[0];
    let bestScore = -1;
    for (const key of HUE_SWATCHES) {
        const score = used.length === 0 ? 1 : Math.min(...used.map((u) => (u === key ? 0 : colorDistance(key, u))));
        if (score > bestScore) {
            best = key;
            bestScore = score;
        }
    }
    return best;
}
