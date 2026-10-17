import palette from '@sanctuary-ds/tokens/palette' with { type: 'json' };

// The tables of the foundations pages, built from the core's palette so they
// follow it. Each table is headers and rows of text; the first column names
// the thing (a flavor, a pigment, a role) and is set as code when it is an id.
// Only explanations that are design prose, not data, are written here.

export interface Table {
  /** What the table holds, for its scrolling region. */
  label: string;
  headers: string[];
  rows: string[][];
  /** Whether the first column holds ids, shown as code. */
  ids?: boolean;
}

type Flavor = { name: string; hour: string; scheme: string; blurb: string; accent: string; colors: Record<string, { hex: string }> };
type Pigment = { hue: number; note: string; tones: Record<string, string> };

const flavors = palette.flavors as Record<string, Flavor>;
const pigments = palette.pigments as Record<string, Pigment>;

const flavorsTable: Table = {
  label: 'Flavors',
  headers: ['Flavor', 'Hour', 'Scheme', 'Default accent', 'Character'],
  rows: Object.entries(flavors).map(([id, flavor]) => [
    id,
    flavor.hour,
    flavor.scheme,
    flavor.accent,
    flavor.blurb,
  ]),
  ids: true,
};

const pigmentsTable: Table = {
  label: 'Pigments',
  headers: ['Pigment', 'Hue', 'Note'],
  rows: Object.entries(pigments).map(([id, pigment]) => [id, `${pigment.hue}°`, pigment.note]),
  ids: true,
};

// What each glass role is for. The tone a flavor plays for each role is read
// from the palette below.
const roles = [
  { suffix: '', role: 'glass-<p>', purpose: 'The color itself: fills, icons, accent text' },
  { suffix: '-lume', role: '-lume', purpose: 'Light, not text: glow, hover, gradients' },
  { suffix: '-ink', role: '-ink', purpose: 'Accent text: links, and any text on panes or sunken stone' },
  { suffix: '-pane', role: '-pane', purpose: 'A tinted container' },
  { suffix: '-on', role: '-on', purpose: 'Content on the color' },
  { suffix: '-on-pane', role: '-on-pane', purpose: 'Content on the pane' },
];

// The tone of the ramp a flavor plays for a role, the same for every pigment;
// the build fails if one pigment disagrees, since the table would then lie.
const toneOf = (flavorId: string, suffix: string) => {
  const found = new Set(
    Object.entries(pigments).map(([id, pigment]) => {
      const hex = flavors[flavorId].colors[`glass-${id}${suffix}`].hex;
      const tone = Object.entries(pigment.tones).find(([, value]) => value === hex)?.[0];
      if (!tone) throw new Error(`glass-${id}${suffix} in ${flavorId} is not a tone of the ${id} ramp.`);
      return tone;
    }),
  );
  if (found.size !== 1) throw new Error(`The pigments disagree on the tone of glass${suffix} in ${flavorId}: ${[...found].join(', ')}.`);
  return [...found][0];
};

const glassRolesTable: Table = {
  label: 'Glass roles',
  headers: ['Role', 'Purpose', ...Object.values(flavors).map(({ name }) => name)],
  rows: roles.map(({ suffix, role, purpose }) => [role, purpose, ...Object.keys(flavors).map((id) => toneOf(id, suffix))]),
  ids: true,
};

type Named = { name: string; note: string };
const glazingsTable: Table = {
  label: 'Glazings',
  headers: ['Glazing', 'Name', 'Technique and rendering'],
  rows: Object.entries(palette.glazings as Record<string, Named>).map(([id, { name, note }]) => [
    id,
    name + (id === palette.defaultGlazing ? ' (default)' : ''),
    note,
  ]),
  ids: true,
};

const windowModesTable: Table = {
  label: 'Window modes',
  headers: ['Window', 'Name', 'Light from', 'Note'],
  rows: Object.entries(palette.windowModes as Record<string, Named & { source: string }>).map(([id, { name, source, note }]) => [
    id,
    name + (id === palette.defaultWindow ? ' (default)' : ''),
    source,
    note,
  ]),
  ids: true,
};

const namedWindowsTable: Table = {
  label: 'Named windows',
  headers: ['Window', 'Name', 'Pigments', 'Character'],
  rows: Object.entries(palette.windows as Record<string, Named & { stops: string[] }>).map(([id, { name, stops, note }]) => [
    `window-${id}`,
    name,
    stops.join(', '),
    note,
  ]),
  ids: true,
};

// Why each family plays its role: design prose, keyed by the palette's roles.
const fontReasons: Record<string, string> = {
  display: 'A high-contrast old-style serif: thin strokes read as light on dark stone. Display and headline type.',
  text: 'A plain, legible sans, so the serif stays special. Titles, body and labels.',
  mono: 'Shared with the terminal ports. Code.',
  inscription: 'Roman capitals, wide-tracked, for overlines only.',
};

type Font = { family: string; fallbacks: string[]; generic: string; weights: number[] };
const fontsTable: Table = {
  label: 'Font families',
  headers: ['Role', 'Family', 'Fallbacks', 'Weights', 'Why'],
  rows: Object.entries(palette.fonts as Record<string, Font>).map(([role, font]) => [
    role,
    font.family,
    [...font.fallbacks, font.generic].join(', '),
    font.weights.join(', '),
    fontReasons[role] ?? '',
  ]),
  ids: true,
};

export const tables = {
  flavors: flavorsTable,
  pigments: pigmentsTable,
  'glass-roles': glassRolesTable,
  glazings: glazingsTable,
  'window-modes': windowModesTable,
  'named-windows': namedWindowsTable,
  fonts: fontsTable,
};

export type TableName = keyof typeof tables;
