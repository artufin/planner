---
category: Surfaces
---

# SectionDivider

A horizontal rule with its heading notched into it — how the planner groups categories by group name on the categories screen.

The label paints over the page background to punch its hole in the rule, so place it on `--pl-color-page-bg`. On a white card the notch will not read correctly.

```jsx
<SectionDivider label="Universidad" />

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--pl-space-2xl)' }}>
  {categories.map((c) => (
    <CategoryCard key={c.id} name={c.name} hue={c.hue} meta={pendingLabel(c)} onClick={() => select(c.id)} />
  ))}
</div>
```

Give the divider `margin: 28px 0 14px` between groups, and drop the top margin on the first one.
