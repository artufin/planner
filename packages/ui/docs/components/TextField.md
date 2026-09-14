---
category: Controls
---

# TextField

A labelled text input — the form row used throughout the planner's modals. Accepts every prop a native `<input>` does, including `type="date"`.

`label` sits above in the small tracked label style. `hint` is an explanatory line below; `error` replaces the hint and turns the border red. The label is wired to the input with a generated id, so clicking it focuses the field.

```jsx
<TextField label="Título" placeholder="ej. Repasar materia" {...register('title')} />
```

With a hint that explains what an empty value means:

```jsx
<TextField
  label="Fecha (opcional)"
  type="date"
  hint="Sin fecha, la tarea queda en el backlog hasta que le asignes un día."
  {...register('date')}
/>
```

Validation state:

```jsx
<TextField label="Nombre" value={name} onChange={onChange} error="El nombre es obligatorio" />
```

`className` goes to the `<input>`; use `fieldClassName` to lay out the wrapper (e.g. `style={{ flex: 1 }}` on a row of two fields).
