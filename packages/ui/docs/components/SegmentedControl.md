---
category: Controls
---

# SegmentedControl

A tinted track holding two or more buttons, one of which reads as selected — the planner's Calendario / Semana view switcher. The selected option gets a white pill and a soft shadow.

```jsx
<SegmentedControl
  ariaLabel="Vista"
  value={view}
  onChange={setView}
  options={[
    { value: 'month', label: 'Calendario' },
    { value: 'week', label: 'Semana' },
  ]}
/>
```

With `value={null}` the same track works as a plain button group with no selected state — how the zoom control is built:

```jsx
<SegmentedControl
  ariaLabel="Zoom"
  size="sm"
  value={null}
  onChange={(v) => (v === 'out' ? zoomOut() : zoomIn())}
  options={[
    { value: 'out', label: '−', ariaLabel: 'Alejar' },
    { value: 'in', label: '+', ariaLabel: 'Acercar' },
  ]}
/>
```

Give glyph-only options an `ariaLabel`. Sizes: `md` (30px) for view switchers, `sm` (26px) for compact toolbars.
