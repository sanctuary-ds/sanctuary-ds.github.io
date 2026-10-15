import palette from '@sanctuary-ds/tokens/palette';

// Theme axes for the site, generated from the core's palette export. Only the
// window modes and the starting glazing and window are written here: the core
// does not publish them yet.

const WINDOW_MODES = ['mono', 'harmonic'] as const;

const title = (id: string) => id[0].toUpperCase() + id.slice(1);

export const axes = {
  flavor: Object.entries(palette.flavors).map(([id, flavor]) => ({ id, name: flavor.name })),
  accent: Object.keys(palette.pigments).map((id) => ({ id, name: title(id) })),
  glazing: Object.entries(palette.glazings).map(([id, glazing]) => ({ id, name: glazing.name })),
  window: WINDOW_MODES.map((id) => ({ id, name: title(id) })),
};

export type Axis = keyof typeof axes;

export { STORAGE_KEY } from './theme-storage';

// The valid values of each axis, and each flavor's own accent, for the script
// that restores the theme before the first paint.
export const options = Object.fromEntries(
  Object.entries(axes).map(([axis, values]) => [axis, values.map(({ id }) => id)]),
) as Record<Axis, string[]>;

export const flavorAccents = Object.fromEntries(
  Object.entries(palette.flavors).map(([id, flavor]) => [id, flavor.accent]),
);

// The restore script trusts these values; fail the build rather than ship a
// flavor whose own accent is not a pigment.
for (const [flavor, accent] of Object.entries(flavorAccents)) {
  if (!options.accent.includes(accent)) {
    throw new Error(`Flavor "${flavor}" names accent "${accent}", which is not a pigment in the core palette.`);
  }
}

// The theme a first-time visitor sees: the core's default flavor with its own accent.
export const defaultTheme: Record<Axis, string> = {
  flavor: palette.defaultFlavor,
  accent: palette.flavors[palette.defaultFlavor as keyof typeof palette.flavors].accent,
  glazing: 'pot-metal',
  window: 'mono',
};

// The same guard for the starting theme: glazing and window are written here,
// so a renamed value in the core must fail the build, not render "undefined".
for (const [axis, value] of Object.entries(defaultTheme) as [Axis, string][]) {
  if (!options[axis].includes(value)) {
    throw new Error(`The default ${axis} "${value}" is not one of the core's ${axis} values: ${options[axis].join(', ')}.`);
  }
}
