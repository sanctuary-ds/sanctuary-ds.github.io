import * as palette from '@sanctuary-ds/tokens/palette';
import { entriesOf, keysOf } from './objects';

// The playground's pigment ramps and the flavor roles, from the core palette.
// Which tone a flavor uses as each glass, and which hex a role has, depend on the
// flavor. Instead of a script that redraws them on every change, each element
// lists the flavors it belongs to, and one CSS rule per flavor picks them out.
// The page is right from the first paint and costs nothing at run time.

const flavors = keysOf(palette.flavors);

const title = (id: string) => id[0].toUpperCase() + id.slice(1);

export const ramps = entriesOf(palette.pigments).map(([id, pigment]) => ({
  id,
  name: title(id),
  note: pigment.note,
  tones: entriesOf(pigment.tones).map(([tone, hex]) => ({
    tone,
    hex,
    // The flavors that use this tone as the pigment's glass.
    glassIn: flavors.filter((flavor) => palette.flavors[flavor].colors[`glass-${id}`].hex === hex).join(' '),
  })),
}));

// Stone, lead and ink: the roles every flavor re-tones, from the deepest surface
// to the strongest text.
const ROLE_NAMES: palette.ColorName[] = [
  'surface-sunken', 'surface', 'surface-raised-1', 'surface-raised-2', 'surface-raised-3', 'surface-raised-4',
  'lead-soft', 'lead', 'lead-strong', 'lead-came', 'text-disabled', 'text-subtle', 'text-muted', 'text',
];

export const roles = ROLE_NAMES.map((role) => ({
  role,
  hexes: flavors.map((flavor) => {
    const hex = palette.flavors[flavor].colors[role]?.hex;
    // A role the core renamed or dropped would otherwise show an empty swatch.
    if (!hex) throw new Error(`Flavor "${flavor}" has no color "${role}" in the core palette.`);
    return { flavor, hex };
  }),
}));

// One selector per flavor, scoped to <html>, where the visitor's flavor lives.
const perFlavor = (selector: (flavor: string) => string) =>
  flavors.map((flavor) => `:root[data-san-flavor="${flavor}"] ${selector(flavor)}`).join(',');

export const pigmentStyles =
  // The tone the current flavor uses as its glass is outlined and numbered.
  `${perFlavor((flavor) => `.tone[data-glass-in~="${flavor}"]`)}{outline:var(--san-border-width-came) solid var(--san-text);outline-offset:1px;z-index:1;}` +
  `${perFlavor((flavor) => `.tone[data-glass-in~="${flavor}"] span`)}{opacity:0.9;}` +
  // Only the current flavor's hex is shown.
  `${perFlavor((flavor) => `[data-for-flavor]:not([data-for-flavor="${flavor}"])`)}{display:none;}`;
