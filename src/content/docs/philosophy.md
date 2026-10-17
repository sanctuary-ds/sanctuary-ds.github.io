---
title: Philosophy
description: "The design language: a dark building lit through colored glass."
section: start
order: 2
---

Sanctuary treats an interface as a dark building lit through colored glass. Surfaces are stone and stay quiet; color is light and is spent sparingly, where it means something.

## The one idea

A cathedral is mostly darkness. The windows read as intense because the stone around them does not compete. Sanctuary applies that ratio to interfaces: about nine parts stone to one part glass.

| Principle | In practice |
|-----------|-------------|
| Stone is quiet | Surfaces are near-neutral with a faint tint. No decorative gradients on stone. |
| Color is light | Saturated color marks action, state and focus. It is never wallpaper. |
| Light is cast | Glass colors its surroundings: glows, pooled color, tinted focus. |
| Lead holds it together | Dark, definite lines separate panes. Borders are structure, not decoration. |
| Chiaroscuro | Contrast between surface levels is wide; mid-grays are avoided. |

## The four materials

Every token belongs to one of four materials.

| Material | Role | Tokens |
|----------|------|--------|
| **Stone** | Surfaces, from the sunken floor to the most raised panel | `surface`, `surface-sunken`, `surface-raised-1` to `surface-raised-4` |
| **Ink** | Text. Warm vellum on dark stone, cool ink on pale stone | `text`, `text-muted`, `text-subtle`, `text-disabled` |
| **Lead** | Borders and dividers; `lead-came` is the near-black line between panes | `lead-soft`, `lead`, `lead-strong`, `lead-came` |
| **Glass** | Color: twelve pigments, each with six roles per flavor | `accent`, one `glass-` family per pigment, status and syntax aliases |

Ink is tinted against the stone on purpose: warm text on cool stone is what candlelight looks like, and it keeps long reading comfortable.

## Three axes and a setting

The building stays the same; how you see it changes along three axes.

- **Flavor** is the hour at which you stand in the nave: dawn, dusk, night or deep night. It sets the stone, the ink, the lead and the shadow.
- **Accent** is the pigment that does the precise work: actions, focus and selection.
- **Glazing** is how the accent is held: solid, as a thin glowing layer, or as a colored line on stone.

The **window** is a setting of the light, not a fourth axis. It shapes the light that is cast (heroes, glows, progress) and always follows the accent, so cast light and controls tell one color story.

## What Sanctuary is not

Blackletter is deliberately absent. The system is about the atmosphere of the building, not medieval costume.

| Compared with | Shared idea | Difference |
|---------------|-------------|------------|
| Catppuccin | Flavors and accents as modular axes; ports for everything | Tonal ramps instead of one color per name; a third axis (glazing) and cast light that follows the accent; chiaroscuro instead of pastel |
| Material Design | Tiered tokens, tonal palettes, systemic type, shape, motion, state layers | Elevation as illumination with colored cast light; arch shapes; stone, not paper |
