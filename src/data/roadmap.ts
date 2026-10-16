import palette from '@sanctuary-ds/tokens/palette' with { type: 'json' };

// The public roadmap: what people can use today and what they can use later,
// by horizon and with no dates, as decided in the core (docs/ecosystem.md).
// Keep it to the real state of things: an item moves up only when it ships, and
// unvalidated ports are never available.

export const horizons = [
  { id: 'available', name: 'Available', note: 'Ready to use today.' },
  { id: 'in-progress', name: 'In progress', note: 'Being built now.' },
  { id: 'next', name: 'Next', note: 'The work that follows.' },
  { id: 'later', name: 'Later', note: 'Planned, after what comes next.' },
  { id: 'exploring', name: 'Exploring', note: 'Ideas under study, with no commitment.' },
] as const;

export type Horizon = (typeof horizons)[number]['id'];

const ORG = 'https://github.com/sanctuary-ds';

export const products = [
  {
    id: 'tokens',
    name: 'Sanctuary Tokens',
    text: 'The foundation: a CSS stylesheet, DTCG tokens and a resolved palette.json, with contrast checked by tests.',
    horizon: 'available',
    href: `${ORG}/tokens`,
  },
  {
    id: 'web-components',
    name: 'Sanctuary Web Components',
    text: 'A Lit library of components that read the same tokens and work in any framework, or none.',
    horizon: 'later',
  },
  {
    id: 'ports',
    name: 'Desktop ports',
    text: 'Sanctuary on the Linux desktop: one repository per application, and a generator for new ones.',
    horizon: 'next',
  },
  {
    id: 'site',
    name: 'This website',
    text: 'The showcase and the documentation, styled by Sanctuary itself.',
    horizon: 'available',
    href: `${ORG}/sanctuary-ds.github.io`,
  },
] as const satisfies readonly { id: string; name: string; text: string; horizon: Horizon; href?: string }[];

export type Product = (typeof products)[number]['id'];

const count = (table: object) => Object.keys(table).length;

export const items: { horizon: Horizon; product?: Product; text: string }[] = [
  {
    horizon: 'available',
    product: 'tokens',
    text: `A CSS stylesheet with ${count(palette.flavors)} flavors, ${count(palette.pigments)} accents and ${count(palette.glazings)} glazings, switched with three HTML attributes.`,
  },
  { horizon: 'available', product: 'tokens', text: 'DTCG design tokens and a plain palette.json for tools without a token pipeline.' },
  { horizon: 'available', product: 'tokens', text: 'WCAG AA contrast, checked by tests in every flavor; reduced motion respected.' },
  { horizon: 'available', product: 'site', text: 'This site: the home page, the playground and this roadmap.' },

  { horizon: 'in-progress', product: 'site', text: 'Documentation: getting started, philosophy, foundations and a generated token reference.' },
  { horizon: 'in-progress', product: 'site', text: 'Search across the site.' },

  { horizon: 'next', product: 'tokens', text: 'Install the tokens from npm (@sanctuary-ds/tokens 0.1.0).' },
  { horizon: 'next', product: 'ports', text: 'Ports for desktop applications such as mangowm, Waybar and foot, each with install steps and a screenshot.' },
  { horizon: 'next', product: 'site', text: 'A ports gallery on this site.' },
  { horizon: 'next', product: 'site', text: 'Documentation in Spanish.' },

  { horizon: 'later', product: 'web-components', text: 'Sanctuary Web Components, starting with buttons and form controls.' },
  { horizon: 'later', product: 'ports', text: 'A port generator so anyone can bring Sanctuary to a new app.' },
  { horizon: 'later', product: 'site', text: 'A changelog for every release.' },

  { horizon: 'exploring', product: 'tokens', text: 'Wide-gamut (Display P3) colors.' },
  { horizon: 'exploring', product: 'tokens', text: 'Integrations with other ecosystems, such as a Tailwind preset.' },
  // Not one of today's products: a possible new one.
  { horizon: 'exploring', text: 'Flutter widgets and theme, generated from the same palette.' },
];
