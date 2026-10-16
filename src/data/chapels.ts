import palette from '@sanctuary-ds/tokens/palette' with { type: 'json' };

// The chapels: one per part of the ecosystem. This one list builds both the
// gallery on the home page and the header navigation, so the two never drift.
// A chapel becomes `available` in the same commit that ships its page; until
// then it is shown disabled and points to the roadmap chapel.

export interface Chapel {
  /** A stable key for code that needs one chapel; the name is display text. */
  id: string;
  name: string;
  title: string;
  text: string;
  href: string;
  cta: string;
  /** A pigment that tints this chapel's glass; none follows the visitor's accent. */
  accent?: string;
  available: boolean;
}

export const chapels: Chapel[] = [
  {
    id: 'playground',
    name: 'Playground',
    title: 'Every axis, live',
    text: 'The full showcase: flavors, pigments, glazing, windows, components, light, foundations and ricing.',
    href: '/playground',
    cta: 'Enter the playground',
    available: true,
  },
  {
    id: 'docs',
    name: 'Docs',
    title: 'Build with the tokens',
    text: 'Getting started, the foundations and the generated token reference.',
    href: '/docs',
    cta: 'Read the docs',
    accent: 'gilt',
    available: false,
  },
  {
    id: 'roadmap',
    name: 'Roadmap',
    title: 'What stands and what is planned',
    text: 'An honest account of what is built and what comes next.',
    href: '/roadmap',
    cta: 'See the roadmap',
    accent: 'viridian',
    available: true,
  },
  {
    id: 'components',
    name: 'Components',
    title: 'Sanctuary Web Components',
    text: 'Web components that read the same tokens, for any framework or none.',
    href: '/components',
    cta: 'Browse components',
    accent: 'ruby',
    available: false,
  },
  {
    id: 'ports',
    name: 'Ports',
    title: 'Onto the desktop',
    text: 'Themes for terminals, bars and window managers, with a preview of each.',
    href: '/ports',
    cta: 'Find your app',
    accent: 'amethyst',
    available: false,
  },
  {
    id: 'changelog',
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

// One chapel by id. An unknown id fails the build instead of quietly hiding
// whatever depended on it.
export const chapel = (id: string): Chapel => {
  const found = chapels.find((entry) => entry.id === id);
  if (!found) throw new Error(`No chapel "${id}"; the chapels are ${chapels.map((entry) => entry.id).join(', ')}.`);
  return found;
};
