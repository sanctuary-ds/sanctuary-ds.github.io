import palette from '@sanctuary-ds/tokens/palette';

// Theme axes for the site, generated from the core's palette export, including
// the window modes and the starting glazing and window.

const title = (id: string) => id[0].toUpperCase() + id.slice(1);

export const axes = {
  flavor: Object.entries(palette.flavors).map(([id, flavor]) => ({ id, name: flavor.name })),
  accent: Object.keys(palette.pigments).map((id) => ({ id, name: title(id) })),
  glazing: Object.entries(palette.glazings).map(([id, glazing]) => ({ id, name: glazing.name })),
  window: Object.entries(palette.windowModes).map(([id, mode]) => ({ id, name: mode.name })),
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

// The theme a first-time visitor sees: the core's default flavor with its own
// accent. Check the flavor first, since its accent is looked up from it.
const defaultFlavor = palette.defaultFlavor;
if (!(defaultFlavor in palette.flavors)) {
  throw new Error(`The core's default flavor "${defaultFlavor}" is not one of its flavors: ${options.flavor.join(', ')}.`);
}

export const defaultTheme: Record<Axis, string> = {
  flavor: defaultFlavor,
  accent: palette.flavors[defaultFlavor as keyof typeof palette.flavors].accent,
  glazing: palette.defaultGlazing,
  window: palette.defaultWindow,
};

// The same guard for the whole starting theme: if the core's defaults ever stop
// matching its own values, fail the build rather than render "undefined".
for (const [axis, value] of Object.entries(defaultTheme) as [Axis, string][]) {
  if (!options[axis].includes(value)) {
    throw new Error(`The default ${axis} "${value}" is not one of the core's ${axis} values: ${options[axis].join(', ')}.`);
  }
}
