# Roadmap

The public site of Sanctuary, served at <https://sanctuary-ds.github.io/>. It introduces the design system, lets people try it live, gathers the ports and documents everything. The site is also the largest demonstration of the system: every page is styled by Sanctuary itself.

This document is the brief for whoever builds the site. Read it before changing anything, and change it when a decision below is taken.

## Principles

- **Ship only what exists.** No page appears before what it documents is real. Planned parts of the ecosystem may be listed, disabled, and point to `/roadmap`, which says honestly what is planned.
- **Generate, do not copy.** Anything derived from the core (token tables, colour swatches, contrast pairs) is generated at build time from the core package, never written by hand.
- **The core owns the design.** The site consumes tokens; it never defines colours, contrast or token names of its own. A missing token is requested in the core, not patched here.
- **Small, reviewable steps.** Each phase lands as one pull request made of small Conventional Commits.

## Stack

| Piece | Choice | Reason |
|-------|--------|--------|
| Generator | [Astro](https://astro.build/), static output | No server; content in Markdown and MDX |
| Search | [Pagefind](https://pagefind.app/), indexed at build time | Static, no external service |
| UI | Astro components styled with the Sanctuary stylesheet | No UI framework until the Lit components exist; then the site uses them |
| Deploy | GitHub Pages through `withastro/action` | Official action, no extra hosting |
| Package manager | pnpm | Same as the core |
| Fonts | Self-hosted through Astro's Fonts API, with Google Fonts as the source | Downloaded at build time and served from the site: no third-party request per visit, preloading and metric-matched fallbacks |

[Starlight](https://starlight.astro.build/) was tried and rejected: its interface did not fit the system, and fighting its defaults cost more than building the pages.

## Contract with the core

The core lives in [`sanctuary-ds/sanctuary`](https://github.com/sanctuary-ds/sanctuary) and is consumed as `@sanctuary-ds/tokens`.

| Consumes | Export | Used for |
|----------|--------|----------|
| Stylesheet | `@sanctuary-ds/tokens/css` | All site styling and theming |
| Palette | `@sanctuary-ds/tokens/palette` | Theme axes and their defaults, the fonts to host, playground, swatches, port previews |
| DTCG tokens | `@sanctuary-ds/tokens/tokens/*` | The generated token reference |
| Port list | To be defined with the ports milestone | Gallery and search |

Rules:

- Until the core is on npm, depend on it through git, pinned to a commit: `"@sanctuary-ds/tokens": "github:sanctuary-ds/sanctuary#<commit>"`. The built files are committed in the core, so no build runs on install.
- The core publishes `0.1.0` to npm when this site reaches phase 3, because the token reference fixes token names as public API. Switch the dependency then.
- Updating the core version is its own commit, reviewed for visual changes.
- Theming uses the core's attributes on `<html>`: `data-san-flavor`, `data-san-accent`, `data-san-glazing` and `data-san-window`. The site never invents its own theme attributes.
- Token names are the core's public API. See its [versioning rules](https://github.com/sanctuary-ds/sanctuary/blob/main/docs/ecosystem.md#versioning).

## Visual direction

The site speaks the visual language of the core showcase: the lectern header with its theme controls, the hero with the rose window, numbered section heads and panels. Three other directions (Nave, Scriptorium and Lantern) were prototyped and discarded.

The showcase moves from the core into this repository: it becomes `/playground`, and its pieces (the lectern, the rose window, the section heads and panels) become site components. The core keeps the tokens, the stylesheet, the palette and the ports. Whether a flavor is light or dark comes from `palette` (`flavors.*.scheme`), so the site needs no theme attribute of its own. The decision is still to be recorded in the core's `docs/ecosystem.md`, as the working agreement requires.

| Area | Content |
|------|---------|
| Header | The brand links home; the navigation lists the chapels, in the same order and state as on the home page. The GitHub link is an icon at the end of the first row, set apart from the chapels, and opens in a new tab. On phones the theme controls fold behind a "Light" button so the facade fills the first screen |
| Home | "The facade and the chapels". The facade is the showcase hero filling the first screen. The nave is three or four short steps, each a key idea with a live demo that links to its playground section. The chapels are one card per part of the ecosystem (Playground, Docs, Roadmap, then Components, Ports, Changelog); a planned chapel is shown disabled and points to `/roadmap`. One list builds both the chapels and the header, and a chapel becomes available in the same commit that ships its page |
| Playground | The showcase moved from the core, complete, with its eight sections (Flavors, Pigments, Glazing, Windows, Components, Light, Foundations, Ricing) and an index to them. Components and Ricing are previews; `/components` and `/ports` come later |
| Docs | Text pages: getting started, foundations, token reference. Nothing duplicated from the playground |

## Site map

```text
/                      Home: the facade, the nave and the chapels
/playground            The showcase, complete, with an index to its sections
/roadmap               What exists and what is planned
/docs/getting-started  Install and first use
/docs/philosophy       The design language
/docs/foundations/*    Colour, type, shape, light, motion
/docs/tokens           Generated token reference
/docs/accessibility    Contrast and motion guarantees
/docs/guides/*         Theming an app, writing a port
/ports                 Gallery with search and filters      (blocked)
/ports/<app>           Preview and install steps per port   (blocked)
/changelog             Changes per version                  (blocked)
/components            The Lit library                      (blocked)
```

Routes are English and unprefixed. Spanish arrives later under `/es/`, so no existing URL changes.

## Phases

Each phase is deployable on its own.

### Phase 1: Skeleton

- [x] Choose the visual direction: build two or three page prototypes with the Sanctuary stylesheet and pick one in the browser. Chosen: the core showcase (see [Visual direction](#visual-direction)).
- [x] Astro project, static output, pnpm, Node version matching the core.
- [x] Astro i18n configured with `en` as the default locale and no prefix, so phase 4 adds a locale without moving pages.
- [x] Core dependency pinned through git; stylesheet loaded globally.
- [x] Site-wide theme switcher (flavor, accent, glazing, window) that persists the choice and respects `prefers-reduced-motion`.
- [x] CI: install with a frozen lockfile, build, check internal links.
- [x] Deploy to GitHub Pages with one page live.

### Phase 2: Home, playground and roadmap

- [x] Deploy only when the site changes: Markdown files at the repository root (README, ROADMAP) do not trigger a deploy.
- [x] Fonts: choose Google Fonts or self-hosted, together with the core, and load them site-wide. This decision was scheduled for phase 1; chosen: self-hosted (see [Stack](#stack)).
- [x] Light-flavor styles generated from `palette` (`flavors.*.scheme`), replacing the showcase's `data-scheme` attribute.
- [x] Home page: the facade, the nave and the chapels.
- [x] Playground: the showcase moved from the core, complete, with an index to its eight sections and shareable query strings.
- [ ] `/roadmap` page.

### Phase 3: Documentation

- [ ] Getting started, philosophy, foundations, accessibility, guides.
- [ ] Token reference generated from the DTCG files.
- [ ] Pagefind search.
- [ ] Automated accessibility check in CI.
- [ ] Switch to `@sanctuary-ds/tokens` from npm once `0.1.0` is published.

### Phase 4: Spanish

- [ ] Spanish locale under `/es/`, with a language switcher.

### Phase 5: Unblocked by other repositories

| Section | Blocked by |
|---------|------------|
| `/ports` | The ports milestone: which apps, which repositories, and how the port list is published |
| `/changelog` | Published versions of the core |
| `/components` | The Lit component library |

## Open decisions

| Decision | When |
|----------|------|
| How the port list reaches the site (a file in the core, or the GitHub API) | Ports milestone |

## Working agreement

- Implementation happens in a session opened in this repository. Cross-repository decisions are made in the core and recorded in its [`docs/ecosystem.md`](https://github.com/sanctuary-ds/sanctuary/blob/main/docs/ecosystem.md); this document is updated to match.
- Commits are signed and follow Conventional Commits (`type(scope): subject`), with no emoji.
- Work happens on a branch per phase and merges through a pull request.
