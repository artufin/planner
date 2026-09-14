---
category: Surfaces
---

# Modal

A centered card over a dimmed backdrop, with a title row and a close button. Body children are laid out in a 12px flex column, so form rows stack without any spacing of their own.

Widths: the planner uses 380px for most forms (the default) and 340px for the shorter category form. The card caps at the viewport and scrolls internally, so a long form stays usable on a short screen.

`asForm` renders the card as a `<form>`, which is what makes a `type="submit"` button in the footer commit it. That is the planner's standard shape for an editing dialog:

```jsx
<Modal
  asForm
  title="Nueva tarea"
  onClose={close}
  onSubmit={handleSubmit(onSubmit)}
  footer={<><span /><Button type="submit">Guardar</Button></>}
>
  <TextField label="Título" placeholder="ej. Repasar materia" {...register('title')} />
  <SelectField label="Categoría" options={categoryOptions} {...register('categoryId')} />
  <Checkbox label="Incluir fecha límite" {...register('hasDeadline')} />
</Modal>
```

The footer is `justify-content: space-between`. With two children — a `danger` button and the submit — they split to the edges. With only a submit, pass an empty `<span />` first so it still sits right.

Editing an existing record adds the destructive action:

```jsx
footer={
  <>
    <Button variant="danger" onClick={remove}>Eliminar</Button>
    <Button type="submit">Guardar</Button>
  </>
}
```

`open={false}` renders nothing, so a caller that already conditions on state can omit `open` entirely. Clicking the backdrop closes it unless you pass `closeOnOverlayClick={false}`.
