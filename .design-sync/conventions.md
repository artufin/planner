# Building with Planner UI

## Setup

There is no provider and no theme context. Import the stylesheet once at the root and every component is styled:

```jsx
import '@planner/ui/styles.css';
```

Without it the components render as unstyled HTML. There is nothing else to wrap.

## The styling idiom

Components carry their own `pl-`-prefixed classes from `styles.css` — you render the component, you don't write its classes. For **your own** layout glue, style with the CSS custom properties: they are this system's vocabulary, and every one is defined in `tokens/tokens.css`.

| family | names |
|---|---|
| surfaces | `--pl-color-page-bg`, `--pl-color-surface`, `--pl-color-sidebar-bg`, `--pl-color-chip-bg`, `--pl-color-control-bg` |
| text | `--pl-color-text`, `--pl-color-text-strong`, `--pl-color-text-nav`, `--pl-color-text-secondary`, `--pl-color-field-text`, `--pl-color-label`, `--pl-color-muted`, `--pl-color-muted-light`, `--pl-color-text-faint` |
| lines | `--pl-color-border`, `--pl-color-border-strong`, `--pl-color-rule`, `--pl-color-checkbox-border` |
| accent | `--pl-color-accent`, `--pl-color-accent-soft-bg`, `--pl-color-accent-text` |
| status | `--pl-color-danger-border`, `--pl-color-danger-text`, `--pl-color-warn-text`, `--pl-color-now-line`, `--pl-color-tooltip-bg` |
| category | `--pl-cat-solid`, `--pl-cat-soft`, `--pl-cat-text` |
| type | `--pl-font-sans`, `--pl-text-2xs` `--pl-text-xs` `--pl-text-sm` `--pl-text-md` `--pl-text-lg` `--pl-text-xl`, `--pl-weight-normal` `--pl-weight-medium` `--pl-weight-semibold` `--pl-weight-bold` |
| space | `--pl-space-2xs` `--pl-space-xs` `--pl-space-sm` `--pl-space-md` `--pl-space-lg` `--pl-space-xl` `--pl-space-2xl` `--pl-space-3xl` `--pl-space-4xl` |
| radius | `--pl-radius-xs` `--pl-radius-sm` `--pl-radius-md` `--pl-radius-lg` `--pl-radius-xl` `--pl-radius-2xl` |
| elevation | `--pl-shadow-raised`, `--pl-shadow-overlay` |

Colors are oklch. Don't hardcode a hex or an oklch literal — there is a token for every color this system uses.

One class is meant to be used directly: `pl-field__label`, for labelling a control that isn't one of the field components (a `HuePicker`, say) so it matches the labels around it.

## Category color is a hue, not a name

Categories are identified by a **hue** — a number from 0 to 360 — so the palette is open-ended rather than a fixed enum. `TaskCard`, `CategoryCard`, `Swatch` and `HuePicker` all take a `hue` prop; `null` means "no category" and renders a neutral gray. The eight canonical hues are exported as `HUE_SWATCHES`.

To tint your own element, spread `hueVars(hue)` onto it and read the three category tokens:

```jsx
import { hueVars } from '@planner/ui';

<div style={{ ...hueVars(255), borderLeft: '3px solid var(--pl-cat-solid)', background: 'var(--pl-cat-soft)' }}>
  <span style={{ color: 'var(--pl-cat-text)' }}>Álgebra Lineal</span>
</div>
```

Also exported, for the cases where a value has to be computed in JS: `solidColor(hue)`, `softColor(hue)`, `softTextColor(hue)`, the `colors` object, and `cx` for joining class names.

## Language

The planner's interface is in Spanish. Write labels, placeholders, button text and `aria-label`s in Spanish unless asked otherwise.

## Where the truth is

- `styles.css` — the full stylesheet. Read it before styling anything unusual.
- `tokens/tokens.css` — the token block on its own.
- `components/<group>/<Name>/<Name>.prompt.md` — per-component usage with worked examples.

## An idiomatic composition

A planning-board column — library components for the parts, tokens for the layout around them:

```jsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pl-space-md)', minHeight: 0 }}>
  <ColumnHeader label="MIÉ" value={16} active onAdd={addTask} />
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pl-space-sm)', overflowY: 'auto', flex: 1, minHeight: 0 }}>
    <TaskCard title="Repasar Álgebra" hue={255} onToggle={toggle} onOpen={open} />
    <TaskCard title="Entregar informe" hue={20} deadlineLabel="16 mar" deadlineTone="soon" onToggle={toggle} />
    <TaskCard title="Leer capítulo 4" hue={120} done onToggle={toggle} />
  </div>
</div>
```
