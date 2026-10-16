---
title: Getting started
description: Install the tokens, load the stylesheet and choose a look.
section: start
order: 1
---

Sanctuary ships as design tokens: CSS custom properties, the same values as JSON, and DTCG files for design tools. This page takes you from nothing to a themed page.

## Install

```sh
pnpm add @sanctuary-ds/tokens
```

## Load the stylesheet

With a bundler (Vite, Astro, webpack), import the stylesheet once:

```js
import '@sanctuary-ds/tokens/css';
```

Without a build step, link it from a CDN that serves npm packages:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sanctuary-ds/tokens@0.1/dist/css/sanctuary.css">
```

The stylesheet only defines custom properties. It styles no elements, so nothing on your page changes until you use a token.

## Choose a look

Four attributes set the look. Put them on `<html>` for the whole page:

```html
<html data-san-flavor="vespers" data-san-accent="amber" data-san-glazing="flashed">
```

| Attribute | Values | What it changes |
|-----------|--------|-----------------|
| `data-san-flavor` | `lauds` (dawn, light), `vespers` (dusk), `compline` (night, default), `matins` (deep night) | Stone, ink, lead and shadow. Every pigment is re-toned to stay legible. |
| `data-san-accent` | `ruby` `ember` `amber` `gilt` `verdure` `viridian` `azure` `cobalt` `indigo` `amethyst` `murrey` `rose` | Which pigment does the precise work: actions, focus, selection. Without it, each flavor uses its own. |
| `data-san-glazing` | `pot-metal` (solid, default), `flashed` (translucent, glowing), `grisaille` (line only) | How the accent is rendered on a filled element. |
| `data-san-window` | `mono` (default), `harmonic` | The light that is cast: gradients, glows, heroes. `mono` uses the accent alone; `harmonic` leads it with its two neighbours on the hue wheel. |

Any element can carry these attributes, so a card can sit in another flavor or accent than its page. To compare looks before you choose, try them in the [playground](/playground).

## Use the tokens

Every token is a custom property prefixed `--san-`. A button that follows the accent and the glazing:

```css
.button {
  background: var(--san-glaze-sheen), var(--san-glaze-bg);
  color: var(--san-glaze-fg);
  border: var(--san-border-width-hairline) solid var(--san-glaze-border);
  border-radius: var(--san-radius-sm);
  box-shadow: var(--san-glaze-glow), var(--san-elevation-1);
  backdrop-filter: var(--san-glaze-blur);
  font: var(--san-type-label-lg);
  letter-spacing: var(--san-type-label-lg-tracking);
}
.button:focus-visible { box-shadow: var(--san-halo); }
```

Change any attribute and the button follows, with no change to your CSS.

## The palette as data

The resolved colours are also available as JSON, for scripts and build steps:

```js
import palette from '@sanctuary-ds/tokens/palette' with { type: 'json' };
```

The DTCG files under `tokens/` in the package serve design tools and token pipelines.

## Fonts

Sanctuary names its fonts but does not ship them. Each family keeps its own licence; load them from your own host or a font service.
