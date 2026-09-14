# design-sync notes — @planner/ui

## What this repo is

The planner is a Next.js **app**. `packages/ui` (`@planner/ui`) was created during the first sync by extracting the app's real UI vocabulary — the oklch palette and style constants that used to live in `src/features/planner/styles.ts`, plus the presentational shapes already in the modals, `TopBar`, `PlanningView` and `CategoriesListView`. Nothing in it was invented.

**The app consumes the library.** `src/features/planner/styles.ts` and the app's local `TimeInput` were deleted in the same session; every UI file imports from `@planner/ui`, and `layout.tsx` imports `@planner/ui/styles.css` before `globals.css`. There is one source of truth for design values, so a change to the DS reaches the app directly — and a careless change breaks it. Run `npm run build` after any DS edit.

`src/features/planner/utils.ts` re-exports `solidColor`/`softColor`/`softTextColor`/`DeadlineTone`, and `constants.ts` re-exports `HUE_SWATCHES`, both from `@planner/ui`, so app callers keep a single import path. The definitions live only in the DS.

## Layout and build

- DS package: `packages/ui`, built by `node packages/ui/build.mjs` (`cfg.buildCmd`). That runs the repo's `tsc` against `packages/ui/tsconfig.json`, copies `src/styles.css` to `dist/`, and **extracts the `:root` block into `dist/tokens.css`** so the token layer ships as its own file without being duplicated by hand.
- `"workspaces": ["packages/*"]` was added to the root `package.json` during this sync. It exists so `node_modules/@planner/ui` resolves — `cfg.tokensPkg` needs the package reachable from `node_modules`, and `copyTokens` returns nothing without it. Don't remove it.
- Converter invocation:

```sh
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --entry ./packages/ui/dist/index.js --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle
```

`--node-modules` is the repo root (the workspace symlink means `react` resolves there).

## Toolchain

- **playwright must be 1.62.0.** This machine's `ms-playwright` cache has chromium builds 1228 and 1234; 1.62.0 pins 1234, 1.61.0 pins 1228, and latest (1.63.0) pins 1243, which is **not** cached and would trigger a ~200MB download. Install with `npm i playwright@1.62.0` inside `.ds-sync/`.
- Component grouping (`controls` / `surfaces` / `planner`) comes from the `category:` frontmatter in `packages/ui/docs/components/<Name>.md`. Without those docs everything collapses into one `general` group. `cfg.guidelinesGlob` is pinned to `docs/guides/**/*.md` precisely so the default `docs/*.md` pattern does not sweep the component docs into `guidelines/`.

## Known render warns

Check new warn lines against this list — anything not here is new.

- **`[GRID_OVERFLOW]` on `Modal`** ("stories position content outside their cells (fixed/portal)"). Triaged as benign, and deliberately **not** remedied with `cardMode: single`. `Modal`'s backdrop is `position: fixed`, which the checker detects structurally; the preview wraps each story in a `Stage` that sets `transform: translateZ(0)`, and per CSS spec a transformed ancestor becomes the containing block for `position: fixed` descendants — so the overlay provably cannot escape. Verified in `_screenshots/review/surfaces__Modal.png`: both stories render whole. `cardMode: column` is kept so both stories stay visible.
- **`[FONT_REMOTE]` for "Manrope"** — intentional, see Fonts below.

## Fonts

`styles.css` pulls Manrope from Google Fonts with an `@import`, which is what `[FONT_REMOTE]` reports. The planner app serves its own self-hosted copy through `next/font` and exposes it as `--font-manrope`, so the DS declares:

```css
--pl-font-sans: var(--font-manrope, "Manrope"), system-ui, -apple-system, sans-serif;
```

**The fallback inside `var()` is load-bearing.** An undefined custom property with no fallback makes the whole `font-family` declaration invalid at computed-value time — so writing `var(--font-manrope)` bare silently drops the typeface everywhere except inside the app. That bug was present in the first build and fixed before upload; don't reintroduce it.

`styles.css` also sets `font-family` on `:root`. Without it, any markup the design agent writes itself (headings, layout glue — anything not carrying a `pl-` class) falls back to the browser's serif default while the components beside it render in Manrope. This was caught in `Swatch`'s title stories on the first pass.

## Re-sync risks

- **The app depends on this package.** `packages/ui/dist/` is gitignored, so `npm run dev` and `npm run build` both run `build:ui` first — don't remove that from the root `package.json` scripts or a fresh clone fails to compile. A breaking change to a component's props breaks the app at build time, which is the intended behaviour, but it means DS edits are app edits: always `npm run build` before considering a DS change done.
- **`colors` (JS) and the `--pl-*` custom properties (CSS) are two hand-maintained mirrors** in `packages/ui/src/tokens.ts` and `packages/ui/src/styles.css`. Nothing checks that they agree — `colors.checkboxBorder` was missing for a while and only surfaced when the app needed it. Add to both when adding a token.
- **The remote font `@import`.** Designs render Manrope from Google Fonts at runtime. If that host is unreachable in the render environment, every design falls back to `system-ui` and nothing fails loudly. Self-hosting the woff2 via `cfg.extraFonts` would remove the dependency.
- **Preview content is Spanish** and mirrors real planner vocabulary. Keep it that way — the design agent imitates these examples, and the product's UI is Spanish.
- **`Modal`'s preview depends on the `Stage` wrapper.** If someone simplifies `.design-sync/previews/Modal.tsx` and drops the `transform`, the modal will escape its card again and the cards will look broken. The `[GRID_OVERFLOW]` warn is the only signal, and it is already on the known list — so it would not read as new. Check the screenshot if that file changes.
- **Only partially verified:** hover, focus and drag states. The render check is static, so `:hover` rules, the focus ring on `.pl-input`, and `TaskCard`'s `draggable` behaviour were never exercised.
- **Upload did not happen on the first run.** The session had no design-system authorization (`/design-login` cannot run non-interactively), so the bundle was built, validated and graded locally but never pushed, and `.design-sync/config.json` carries no `projectId` yet. The next run picks a project from scratch — see the base skill §1.
