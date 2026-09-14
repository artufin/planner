---
category: Planner
---

# TaskCard

A task as it appears on the planning board: tinted in its category color with a colored left edge, a checkbox, the title, and an optional deadline.

`hue` is the task's category hue; `null` renders the neutral "sin categoría" gray. `done` dims the card and strikes the title through. The title truncates with an ellipsis, so a long one never breaks the column.

```jsx
<TaskCard
  title="Repasar Álgebra Lineal"
  hue={255}
  deadlineLabel="12 mar"
  onToggle={toggle}
  onOpen={open}
/>
```

`deadlineTone` colors the deadline label by urgency — `overdue` reads red, `soon` amber, `normal` gray:

```jsx
<TaskCard title="Entregar informe" hue={20} deadlineLabel="9 mar" deadlineTone="overdue" onToggle={toggle} />
<TaskCard title="Leer capítulo 4" hue={120} done onToggle={toggle} />
```

On the planning board the cards are drag sources:

```jsx
<TaskCard
  title={task.title}
  hue={category.hue}
  done={task.done}
  draggable
  onDragStart={(e) => e.dataTransfer.setData('application/x-planner-task-id', task.id)}
  onToggle={() => toggle(task)}
  onOpen={() => openTask(task)}
/>
```

Stack them in a 6px gap column under a `ColumnHeader`.
