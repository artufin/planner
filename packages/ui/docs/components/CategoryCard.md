---
category: Planner
---

# CategoryCard

A category tile for the categories grid: a color strip across the top, the name, and a count line tinted to match the category.

`hue` drives both the strip and the meta line; `null` is the neutral treatment. With `onClick` it renders as a real `<button>`, so keyboard users reach it.

```jsx
<CategoryCard name="Álgebra Lineal" hue={255} meta="3 pendientes" onClick={() => select(id)} />
```

The full grid, grouped by `SectionDivider`:

```jsx
<SectionDivider label="Universidad" />
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--pl-space-2xl)' }}>
  <CategoryCard name="Álgebra Lineal" hue={255} meta="3 pendientes" onClick={open} />
  <CategoryCard name="Física" hue={20} meta="Sin pendientes" onClick={open} />
  <CategoryCard name="Historia" hue={120} meta="1 pendiente" onClick={open} />
</div>
```

Write `meta` the way the planner does: "Sin pendientes" at zero, otherwise "N pendiente" / "N pendientes".
