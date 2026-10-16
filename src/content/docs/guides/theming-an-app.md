---
title: Theming an app
description: Start from the visitor's system, let them choose, keep the choice, and theme part of a page.
section: guides
order: 1
---

[Getting started](/docs/getting-started) loads the stylesheet and sets a look. This guide covers what an app needs around that: a first flavor that matches the visitor's system, a choice that sticks, and parts of a page in another look.

## Paint the page with the tokens

The stylesheet defines tokens and styles nothing, so give the page its stone and ink:

```css
body {
  margin: 0;
  background: var(--san-surface);
  color: var(--san-text);
  font: var(--san-type-body-md);
  letter-spacing: var(--san-type-body-md-tracking);
}
```

Each flavor also sets `color-scheme`, so form controls and scrollbars follow it: light in Lauds, dark in the others.

## Choose the first flavor

Without an attribute the page shows Compline, the default. To start from the visitor's system instead, set the flavor in a small script in `<head>`, before the page is painted, so it never flashes the wrong one:

```html
<script>
  let flavor;
  try {
    flavor = localStorage.getItem('flavor');
  } catch {
    // Storage is blocked: fall back to the system.
  }
  flavor ??= matchMedia('(prefers-color-scheme: light)').matches ? 'lauds' : 'compline';
  document.documentElement.dataset.sanFlavor = flavor;
</script>
```

`dataset.sanFlavor` writes the `data-san-flavor` attribute. A saved choice wins over the system, so a visitor who picked Vespers keeps it.

## Let the visitor choose

Changing the look is setting an attribute; the tokens follow at once. Save the choice for the next visit:

```js
function setLook(axis, value) {
  document.documentElement.setAttribute(`data-san-${axis}`, value);
  try {
    localStorage.setItem(axis, value);
  } catch {
    // Storage is blocked: the look still changes for this visit.
  }
}

setLook('flavor', 'vespers');
setLook('accent', 'amber');
```

The same works for `glazing` and `window`. Restore them in the `<head>` script the way it restores the flavor. Offer the choice with real buttons or a select, and say which one is current, for example with `aria-pressed`.

## Theme part of a page

Any element can carry the attributes, so a card or a sidebar can sit in another look than its page:

```html
<aside data-san-flavor="lauds" data-san-accent="ruby" class="note">
  A pale note on a dark page.
</aside>
```

The tokens change inside the element, but a background painted by an ancestor does not, so give the element its own stone and ink:

```css
.note {
  background: var(--san-surface);
  color: var(--san-text);
}
```

## Build components on roles, not pigments

Read the roles that follow the theme (`accent`, `glaze-*`, `surface-*`, `text-*`, `lead-*`), not a pigment's ramp. A pigment tone read directly stays the same in every flavor, so it loses its contrast when the flavor changes.

To let a component be adjusted without forking it, give it its own custom properties that default to the system's:

```css
.card {
  --card-radius: var(--san-radius-md);
  border-radius: var(--card-radius);
}

.card.is-square {
  --card-radius: var(--san-radius-none);
}
```

## Respect the visitor

- Under `prefers-reduced-motion: reduce` every duration token is zero. Time your transitions with them, and stop your own animations under the same media query.
- Focus rings use `--san-halo` on `:focus-visible`.
- Keep text on the pairings the [accessibility page](/docs/accessibility) guarantees.
