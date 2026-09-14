---
category: Planner
---

# Swatch

A block of one category color. Three shapes cover everywhere the planner shows a category:

- `dot` — the inline marker beside a category name in a header or a list (14px).
- `tile` — a cell in the hue picker (26px).
- `bar` — a full-width strip, as across the top of a `CategoryCard` or on a multi-day event (4px tall).

`hue` is the category hue; `null` renders the neutral gray used for "sin categoría".

```jsx
<Swatch hue={255} />
<Swatch hue={null} />
<Swatch hue={20} shape="bar" />
```

Beside a title:

```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pl-space-lg)' }}>
  <Swatch hue={category.hue} />
  <div style={{ fontSize: 'var(--pl-text-xl)', fontWeight: 'var(--pl-weight-bold)' }}>{category.name}</div>
</div>
```

With `onClick` it renders a real `<button>` and needs an `ariaLabel`, since it has no text. `selected` draws the halo the hue picker uses.
