---
category: Controls
---

# SelectField

A labelled `<select>` wearing the same shell as `TextField` — same label, hint, error and border treatment, so the two stack cleanly in one form.

Pass `options` for the common case, or `<option>` children when you need groups or custom markup. `placeholder` prepends a blank-valued option for "none selected".

```jsx
<SelectField
  label="Categoría"
  options={categories.map((c) => ({ value: c.id, label: c.name }))}
  {...register('categoryId')}
/>
```

Optional association, where an empty value is legitimate:

```jsx
<SelectField
  label="Asociar a evento (opcional)"
  placeholder="Ninguno"
  options={events.map((e) => ({ value: e.id, label: e.title }))}
  {...register('eventId')}
/>
```
