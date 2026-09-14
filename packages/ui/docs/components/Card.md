---
category: Surfaces
---

# Card

The planner's plain white surface: a 1px border, 10px radius, and a flex column inside. The generic container for anything that is not already a `CategoryCard` or a `TaskCard`.

`padding` is `md` (14px, the default) or `sm` (10px) for dense grids. `interactive` adds the pointer cursor and hover lift for a card that is itself a link or a button.

```jsx
<Card>
  <div style={{ fontSize: 'var(--pl-text-lg)', fontWeight: 'var(--pl-weight-bold)' }}>Resumen</div>
  <div style={{ fontSize: 'var(--pl-text-sm)', color: 'var(--pl-color-muted)' }}>4 eventos esta semana</div>
</Card>
```

In a grid:

```jsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--pl-space-2xl)' }}>
  {items.map((i) => <Card key={i.id} interactive onClick={() => open(i)}>{i.name}</Card>)}
</div>
```
