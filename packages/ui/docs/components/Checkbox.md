---
category: Controls
---

# Checkbox

A checkbox and its text on one clickable row. The whole row is the `<label>`, so the text toggles the box.

This is how the planner's modals gate optional sections — checking the box reveals the fields it controls.

```jsx
<Checkbox label="Incluir horario" checked={hasTime} onChange={(e) => setHasTime(e.target.checked)} />

{hasTime && (
  <div style={{ display: 'flex', gap: 'var(--pl-space-lg)' }}>
    <TimeInput label="Hora inicio" value={start} onChange={setStart} />
    <TimeInput label="Hora término" value={end} onChange={setEnd} />
  </div>
)}
```

`className` goes to the `<input>`; `labelClassName` to the wrapping row.
