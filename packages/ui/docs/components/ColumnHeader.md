---
category: Planner
---

# ColumnHeader

The chip at the top of a planning-board column: a tracked label, an optional day number, and an add button.

`active` tints the whole chip in the accent color — how the board marks today. The add button picks up the accent tone automatically when the header is active.

```jsx
<ColumnHeader label="BACKLOG" onAdd={() => newTask(null)} />

<ColumnHeader label="LUN" value={14} onAdd={() => newTask(date)} />

<ColumnHeader label="MIÉ" value={16} active onAdd={() => newTask(date)} />
```

A full column is the header plus a scrolling stack of `TaskCard`s:

```jsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pl-space-md)', minHeight: 0 }}>
  <ColumnHeader label="LUN" value={14} onAdd={addTask} />
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pl-space-sm)', overflowY: 'auto', flex: 1, minHeight: 0 }}>
    {tasks.map((t) => <TaskCard key={t.id} title={t.title} hue={t.hue} onToggle={() => toggle(t)} />)}
  </div>
</div>
```

Pass `children` to put something other than the add button on the right — a count, say.
