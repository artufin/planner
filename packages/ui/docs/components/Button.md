---
category: Controls
---

# Button

The planner's text button. Four variants across two heights.

- `primary` — the one filled accent button in a view. The commit action: "Guardar", "+ Agregar evento". Never put two in the same row.
- `secondary` — outlined, white. The ordinary action.
- `danger` — outlined in red. Destructive only: "Eliminar".
- `ghost` — chromeless. Low emphasis, inside a toolbar or a card.

Sizes: `md` (34px, the default) for modal footers and page-level actions; `sm` (28px) for toolbars and card footers.

It defaults to `type="button"`, so it never submits a form by accident. Inside a `<Modal asForm>`, the commit button needs `type="submit"` explicitly.

```jsx
<Button onClick={openEventModal}>+ Agregar evento</Button>

<Button variant="secondary" size="sm" onClick={edit}>Editar categoría</Button>

<Button variant="danger" size="sm" onClick={remove}>Eliminar</Button>
```

A modal footer pairs a destructive action with the commit:

```jsx
<Modal
  asForm
  title="Editar tarea"
  onClose={close}
  onSubmit={save}
  footer={
    <>
      <Button variant="danger" onClick={remove}>Eliminar</Button>
      <Button type="submit">Guardar</Button>
    </>
  }
>
  {fields}
</Modal>
```

When there is no destructive action, the footer still needs the submit pushed right — pass an empty `<span />` as the first child, since the footer is `justify-content: space-between`.
