---
category: Controls
---

# IconButton

A square button holding a single glyph. Always give it an `aria-label` — there is no text to name it.

Sizes: `md` (28px) for toolbar arrows, `sm` (26px) for a modal close, `xs` (20px) for the inline add on a `ColumnHeader`.

Variants: `outline` (white with a border — standalone toolbar buttons), `solid` (white, borderless — inside a tinted `SegmentedControl`-style track), `plain` (transparent — chromeless glyphs).

`tone` tints the glyph: `default`, `muted`, or `accent`. Use `accent` when the surrounding chip is in the accent color.

```jsx
<IconButton aria-label="Semana anterior" onClick={goPrev}>‹</IconButton>
<IconButton aria-label="Semana siguiente" onClick={goNext}>›</IconButton>
```

The `+` that adds an item to a column:

```jsx
<IconButton size="xs" variant="plain" tone="muted" aria-label="Nueva tarea" onClick={addTask}>+</IconButton>
```

`close` swaps in the oversized glyph used by a modal header — `Modal` already renders its own, so you rarely set this yourself.
