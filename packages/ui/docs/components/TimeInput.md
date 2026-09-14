---
category: Controls
---

# TimeInput

Always renders and accepts 24h `"HH:MM"`, regardless of browser or OS locale — the planner's replacement for the native `<input type="time">` picker, which changes shape between locales and platforms.

Typing is free-form digits: it formats as you go, clamps hours to 23 and minutes to 59, and keeps the caret where you were typing rather than snapping to the end. `onChange` fires on blur with a normalized value, and only when the value actually changed.

Standalone it is sized for `"HH:MM"` (72px). Given a `label` it renders inside the field shell and stretches to fill its column, so it lines up with `TextField` in a form.

```jsx
<TimeInput value={start} onChange={setStart} />
```

Two of them side by side, as the event and task modals use it:

```jsx
<div style={{ display: 'flex', gap: 'var(--pl-space-lg)' }}>
  <div style={{ flex: 1 }}>
    <TimeInput label="Hora inicio" value={start} onChange={setStart} />
  </div>
  <div style={{ flex: 1 }}>
    <TimeInput label="Hora término" value={end} onChange={setEnd} />
  </div>
</div>
```

With `react-hook-form`, drive it through a `Controller` — it is a controlled component, not a native input.
