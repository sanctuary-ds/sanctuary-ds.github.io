---
title: Writing a port
description: Theme a desktop application from the palette, for every flavor.
section: guides
order: 2
---

A port is a theme for one application outside the browser: a terminal, a bar, a window manager. Each port reads one file, `palette.json`, and writes the application's own format for every flavor. The resolved colors are already there, so a port needs no color maths and no token pipeline.

## The idea on the desktop

A port carries the same materials as a page:

| Concept | On the desktop |
|---------|----------------|
| Stone | Terminal and bar backgrounds |
| Ink | Text and the terminal foreground |
| Lead | Inactive window borders, gaps |
| Accent | Active window border, cursor, focused workspace |
| Flashed glazing | Blur and transparency of the compositor, tinted by the accent |
| Cast | Colored window shadow or glow on the active window |
| Window | Wallpaper and lock-screen gradients |

## Read the palette

Install the tokens and import the palette:

```sh
pnpm add @sanctuary-ds/tokens
```

```js
import palette from '@sanctuary-ds/tokens/palette' with { type: 'json' };
```

`palette.flavors` holds each flavor with its `name`, its `hour`, its `scheme` (`light` or `dark`) and its `colors`: every color token, named as in CSS without the `--san-` prefix, each with its `hex`. Among them are the sixteen terminal colors, `ansi-black` to `ansi-bright-white`, chosen for each flavor. `accent` is the flavor's own accent; `palette.pigments` lists the twelve pigments, for a port that lets its user pick another.

## Write one theme per flavor

This script writes a kitty theme for each flavor:

```js
// build.js: writes themes/sanctuary-<flavor>.conf from the Sanctuary palette.
import { mkdirSync, writeFileSync } from 'node:fs';
import palette from '@sanctuary-ds/tokens/palette' with { type: 'json' };

const ansi = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

mkdirSync('themes', { recursive: true });
for (const [id, flavor] of Object.entries(palette.flavors)) {
  const color = (name) => flavor.colors[name].hex;
  const lines = [
    `# Sanctuary ${flavor.name} (${flavor.hour})`,
    `foreground ${color('text')}`,
    `background ${color('surface')}`,
    `selection_foreground ${color('text')}`,
    `selection_background ${color('surface-raised-4')}`,
    `cursor ${color('accent')}`,
    `cursor_text_color ${color('accent-on')}`,
    `url_color ${color('accent-ink')}`,
    `active_border_color ${color('accent')}`,
    `inactive_border_color ${color('lead')}`,
    ...ansi.map((name, index) => `color${index} ${color(`ansi-${name}`)}`),
    ...ansi.map((name, index) => `color${index + 8} ${color(`ansi-bright-${name}`)}`),
  ];
  writeFileSync(`themes/sanctuary-${id}.conf`, `${lines.join('\n')}\n`);
}
```

Run it with `node build.js` on Node 22 or later. The same loop fits any format: change the lines, keep the names.

## Choose colors by role

- Backgrounds are stone: `surface`, with `surface-sunken` for tab bars and wells, and the raised levels for selections and popups.
- Text is ink: `text`, then `text-muted` and `text-subtle` for what matters less.
- Borders are lead: `lead` for inactive borders, the accent for the active one.
- Accent text, such as links, uses `accent-ink`; content on an accent fill uses `accent-on`.

These pairings keep the contrast the [accessibility page](/docs/accessibility) guarantees. A port that pairs other colors should check its own.

## State the palette version

Pin the exact version of `@sanctuary-ds/tokens` that a port was built from, and say it in the port's README, so users know which palette it matches.

## Where ports live

Each port will live in its own repository under the [sanctuary-ds organization](https://github.com/sanctuary-ds), as the site's [roadmap](/roadmap) plans. Until then, the core drafts ports for kitty, Ghostty, Alacritty, base16, GTK CSS and Hyprland in its [`ports/` directory](https://github.com/sanctuary-ds/tokens/tree/main/ports); they have not yet been checked on a real desktop.
