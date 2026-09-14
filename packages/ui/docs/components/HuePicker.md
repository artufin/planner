---
category: Planner
---

# HuePicker

The row of category colors a user picks from when naming a category. Defaults to the eight planner hues (`HUE_SWATCHES`); the selected cell gets a double-ring halo in its own color.

```jsx
<HuePicker value={hue} onChange={setHue} />
```

In the category form, under a label:

```jsx
<Modal asForm title="Nueva categoría" width={340} onClose={close} onSubmit={save}
  footer={<><span /><Button type="submit">Guardar</Button></>}>
  <TextField label="Nombre" placeholder="ej. Álgebra Lineal" {...register('name')} />
  <SelectField label="Grupo" options={groupOptions} value={groupId} onChange={onGroupChange} />
  <div>
    <div className="pl-field__label">Color</div>
    <HuePicker value={hue} onChange={(h) => setValue('hue', h)} />
  </div>
</Modal>
```

Pass `hues` to offer a different set, and `size` to change the cell side (26px by default).
