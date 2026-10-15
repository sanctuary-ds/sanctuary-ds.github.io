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

// The theme a first-time visitor sees: the core's default flavor with its own accent.
export const defaultTheme: Record<Axis, string> = {
  flavor: palette.defaultFlavor,
  accent: palette.flavors[palette.defaultFlavor as keyof typeof palette.flavors].accent,
  glazing: 'pot-metal',
  window: 'mono',
};
