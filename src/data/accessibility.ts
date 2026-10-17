import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import palette from '@sanctuary-ds/tokens/palette' with { type: 'json' };

// The guarantees of the accessibility page, computed from the core at build
// time: the contrast of every pairing the core tests, in every flavor, and the
// tokens its stylesheet stops under reduced motion.

type Flavor = { name: string; colors: Record<string, { hex: string }> };
const flavors = palette.flavors as Record<string, Flavor>;
const pigments = Object.keys(palette.pigments);

// WCAG 2 relative luminance and contrast ratio, from sRGB hex.
const channel = (value: number) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((start) => channel(parseInt(hex.slice(start, start + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

const stones = ['surface-sunken', 'surface', 'surface-raised-1', 'surface-raised-2', 'surface-raised-3', 'surface-raised-4'];

// Each pairing the core's tests promise, as foreground and background color
// names in a flavor's palette. <p> runs over every pigment.
interface Pairing {
  text: string;
  minimum: number;
  pairs: [string, string][];
}

const forPigments = (make: (p: string) => [string, string][]) => pigments.flatMap(make);

export const pairings: Pairing[] = [
  { text: 'text, text-muted and text-subtle on every stone', minimum: 4.5, pairs: ['text', 'text-muted', 'text-subtle'].flatMap((text) => stones.map((stone): [string, string] => [text, stone])) },
  { text: 'glass-<p> on every stone but surface-sunken', minimum: 4.5, pairs: forPigments((p) => stones.slice(1).map((stone): [string, string] => [`glass-${p}`, stone])) },
  { text: 'glass-<p>-ink on every stone', minimum: 4.5, pairs: forPigments((p) => stones.map((stone): [string, string] => [`glass-${p}-ink`, stone])) },
  { text: 'glass-<p>-ink on its pane', minimum: 4.5, pairs: forPigments((p) => [[`glass-${p}-ink`, `glass-${p}-pane`]]) },
  { text: 'glass-<p>-on on its glass', minimum: 4.5, pairs: forPigments((p) => [[`glass-${p}-on`, `glass-${p}`]]) },
  { text: 'glass-<p>-on-pane on its pane', minimum: 4.5, pairs: forPigments((p) => [[`glass-${p}-on-pane`, `glass-${p}-pane`]]) },
  { text: 'The focus halo: glass-<p> against surface', minimum: 3, pairs: forPigments((p) => [[`glass-${p}`, 'surface']]) },
];

// The lowest ratio of a pairing in a flavor, and the pair that gives it.
export const lowest = (pairing: Pairing, flavor: string) => {
  const colors = flavors[flavor].colors;
  return pairing.pairs
    .map(([fg, bg]) => ({ fg, bg, ratio: contrast(colors[fg].hex, colors[bg].hex) }))
    .reduce((low, pair) => (pair.ratio < low.ratio ? pair : low));
};

// Rounded down, so a ratio is never shown higher than it is.
export const ratioText = (ratio: number) => `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;

// The custom properties the stylesheet sets inside its reduced-motion rule.
const require = createRequire(import.meta.url);
const stylesheet = readFileSync(require.resolve('@sanctuary-ds/tokens/css'), 'utf8');
const reduced = stylesheet.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/);
if (!reduced) throw new Error('The core stylesheet has no prefers-reduced-motion: reduce rule.');
export const stilled = [...reduced[1].matchAll(/(--san-[a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => ({ name, value: value.trim() }));
