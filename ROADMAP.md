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

[Starlight](https://starlight.astro.build/) was tried and rejected: its interface did not fit the system, and fighting its defaults cost more than building the pages.

## Contract with the core

The core lives in [`sanctuary-ds/sanctuary`](https://github.com/sanctuary-ds/sanctuary) and is consumed as `@sanctuary-ds/tokens`.

| Consumes | Export | Used for |
|----------|--------|----------|
| Stylesheet | `@sanctuary-ds/tokens/css` | All site styling and theming |
| Palette | `@sanctuary-ds/tokens/palette` | Playground, swatches, port previews |
| DTCG tokens | `@sanctuary-ds/tokens/tokens/*` | The generated token reference |
| Port list | To be defined with the ports milestone | Gallery and search |

Rules:

- Until the core is on npm, depend on it through git, pinned to a commit: `"@sanctuary-ds/tokens": "github:sanctuary-ds/sanctuary#<commit>"`. The built files are committed in the core, so no build runs on install.
- The core publishes `0.1.0` to npm when this site reaches phase 3, because the token reference fixes token names as public API. Switch the dependency then.
- Updating the core version is its own commit, reviewed for visual changes.
- Theming uses the core's attributes on `<html>`: `data-san-flavor`, `data-san-accent`, `data-san-glazing` and `data-san-window`. The site never invents its own theme attributes.
- Token names are the core's public API. See its [versioning rules](https://github.com/sanctuary-ds/sanctuary/blob/main/docs/ecosystem.md#versioning).

## Site map

```text
/                      Home: what Sanctuary is, a live rose window
/playground            Every axis live (the core showcase, redesigned)
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

- [ ] Choose the visual direction: build two or three page prototypes with the Sanctuary stylesheet and pick one in the browser.
- [ ] Astro project, static output, pnpm, Node version matching the core.
- [ ] Astro i18n configured with `en` as the default locale and no prefix, so phase 4 adds a locale without moving pages.
- [ ] Core dependency pinned through git; stylesheet loaded globally.
- [ ] Site-wide theme switcher (flavor, accent, glazing, window) that persists the choice and respects `prefers-reduced-motion`.
- [ ] CI: install with a frozen lockfile, build, check internal links.
- [ ] Deploy to GitHub Pages with one page live.

### Phase 2: Home, playground and roadmap

- [ ] Home page.
- [ ] Playground rebuilt from the core showcase, including shareable query strings.
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
| Visual direction of the site | Start of phase 1 |
| How the port list reaches the site (a file in the core, or the GitHub API) | Ports milestone |
| Fonts: Google Fonts or self-hosted | Phase 1, together with the core's same open decision |

## Working agreement

- Implementation happens in a session opened in this repository. Cross-repository decisions are made in the core and recorded in its [`docs/ecosystem.md`](https://github.com/sanctuary-ds/sanctuary/blob/main/docs/ecosystem.md); this document is updated to match.
- Commits are signed and follow Conventional Commits (`type(scope): subject`), with no emoji.
- Work happens on a branch per phase and merges through a pull request.
