import palette from '@sanctuary-ds/tokens/palette' with { type: 'json' };

// The chapels: one per part of the ecosystem. This one list builds both the
// gallery on the home page and the header navigation, so the two never drift.
// A chapel becomes `available` in the same commit that ships its page; until
// then it is shown disabled and points to the roadmap.

export interface Chapel {
  name: string;
  title: string;
  text: string;
  href: string;
  cta: string;
  /** A pigment that tints this chapel's glass; none follows the visitor's accent. */
  accent?: string;
  available: boolean;
}

// Where planned chapels point until the site's own /roadmap page ships.
export const ROADMAP_HREF = 'https://github.com/sanctuary-ds/sanctuary-ds.github.io/blob/main/ROADMAP.md';

export const chapels: Chapel[] = [
  {
    name: 'Playground',
    title: 'Every axis, live',
    text: 'The full showcase: flavors, pigments, glazing, windows, components, light, foundations and ricing.',
    href: '/playground',
    cta: 'Enter the playground',
    available: false,
  },
  {
    name: 'Docs',
    title: 'Build with the tokens',
    text: 'Getting started, the foundations and the generated token reference.',
    href: '/docs',
    cta: 'Read the docs',
    accent: 'gilt',
    available: false,
  },
  {
    name: 'Roadmap',
    title: 'What stands and what is planned',
    text: 'An honest account of what is built and what comes next.',
    href: '/roadmap',
    cta: 'See the roadmap',
    accent: 'viridian',
    available: false,
  },
  {
    name: 'Components',
    title: 'The Lit library',
    text: 'Web components that read the same tokens, for any framework or none.',
    href: '/components',
    cta: 'Browse components',
    accent: 'ruby',
    available: false,
  },
  {
    name: 'Ports',
    title: 'Onto the desktop',
    text: 'Themes for terminals, bars and window managers, with a preview of each.',
    href: '/ports',
    cta: 'Find your app',
    accent: 'amethyst',
    available: false,
  },
  {
    name: 'Changelog',
    title: 'Every version',
    text: 'What changed in each release of the core, and why.',
    href: '/changelog',
    cta: 'Read the changelog',
    accent: 'azure',
    available: false,
  },
];

// An accent the core does not have would leave a chapel's glass untinted.
for (const { name, accent } of chapels) {
  if (accent && !(accent in palette.pigments)) {
    throw new Error(`Chapel "${name}" names accent "${accent}", which is not a pigment in the core palette.`);
  }
}
