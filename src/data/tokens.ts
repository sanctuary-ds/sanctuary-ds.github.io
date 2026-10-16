import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

// Every token of the core, read at build time from its DTCG files through the
// resolver document, the same way a token pipeline would. A token's custom
// property is its path joined with hyphens; a group's `$root` token takes the
// group's own name (accent.$root is --san-accent). Typography tokens also have a
// `-tracking` property, from their letter spacing. The few tokens the format
// cannot express are read from the stylesheet instead (see cssOnly).

const require = createRequire(import.meta.url);
const packageRoot = dirname(require.resolve('@sanctuary-ds/tokens/package.json'));
const tokensDir = join(packageRoot, 'tokens');
const stylesheet = readFileSync(require.resolve('@sanctuary-ds/tokens/css'), 'utf8');

type Json = Record<string, any>;
const readJson = (file: string): Json => JSON.parse(readFileSync(join(tokensDir, file), 'utf8'));

export interface Token {
  /** The custom property, such as --san-surface-raised-1. */
  name: string;
  /** The first segment of the DTCG path, such as surface. */
  group: string;
  /** The second segment, such as ruby in glass.ruby.lume, when there is one. */
  subgroup?: string;
  type: string;
  description?: string;
  /** The value, the same in every flavor. */
  value?: string;
  /** The value in each flavor, for tokens that change with it. */
  byFlavor?: Record<string, string>;
  /** A color to show beside the value, when the token is one. */
  swatch?: string | Record<string, string>;
}

const nameOf = (path: string[]) => `--san-${path.filter((part) => part !== '$root').join('-')}`;
// An alias shows the token it reads without the --san- prefix, which keeps the
// per-flavor columns narrow: {pigment.ruby.600} is pigment-ruby-600.
const aliasName = (reference: string) => nameOf(reference.slice(1, -1).split('.')).replace('--san-', '');
const isAlias = (value: unknown): value is string => typeof value === 'string' && /^\{.+\}$/.test(value);

const dimension = ({ value, unit }: { value: number; unit: string }) => `${value}${unit}`;
const color = (value: Json) => (value.alpha === undefined ? value.hex : `${value.hex} at ${Math.round(value.alpha * 100)}%`);
const reference = (value: unknown) => (isAlias(value) ? aliasName(value) : String(value));

// A token's value as text, by its DTCG type.
const format = (type: string, value: any): string => {
  if (isAlias(value)) return aliasName(value);
  switch (type) {
    case 'color':
      return color(value);
    case 'dimension':
    case 'duration':
      return dimension(value);
    case 'fontFamily':
      return value.join(', ');
    case 'cubicBezier':
      return `cubic-bezier(${value.join(', ')})`;
    case 'shadow':
      return value
        .map((layer: Json) => [layer.offsetX, layer.offsetY, layer.blur, layer.spread].map(dimension).join(' ') + ` ${reference(layer.color)}`)
        .join(', ');
    case 'gradient':
      return value.map((stop: Json) => `${reference(stop.color)} ${stop.position * 100}%`).join(', ');
    case 'typography':
      return `${reference(value.fontWeight)} ${dimension(value.fontSize)}/${value.lineHeight} ${reference(value.fontFamily)}`;
    default:
      return String(value);
  }
};

interface Leaf {
  path: string[];
  type: string;
  description?: string;
  value: any;
}

// What a group's own $description says, by the group's custom property prefix
// (--san-state: "Opacity of the content color..."), shown once above its tokens.
export const groupNotes: Record<string, string> = {};

// The tokens of one file, each with the type it inherits from its groups when
// it has none of its own.
const leaves = (node: Json, path: string[] = [], type?: string): Leaf[] => {
  const ownType = node.$type ?? type;
  if ('$value' in node) return [{ path, type: ownType, description: node.$description, value: node.$value }];
  // A file's own description (a flavor's blurb) belongs to no group.
  if (node.$description && path.length > 0) groupNotes[nameOf(path)] = node.$description;
  return Object.entries(node)
    .filter(([key]) => !key.startsWith('$') || key === '$root')
    .flatMap(([key, child]) => leaves(child, [...path, key], ownType));
};

const resolver = readJson('sanctuary.resolver.json');
const sources = (refs: { $ref: string }[]) => refs.flatMap(({ $ref }) => leaves(readJson($ref)));

const shared = Object.values(resolver.sets as Record<string, { sources: { $ref: string }[] }>).flatMap((set) => sources(set.sources));
const flavorContexts = resolver.modifiers.flavor.contexts as Record<string, { $ref: string }[]>;
export const flavors = Object.keys(flavorContexts);
const perFlavor = Object.fromEntries(flavors.map((flavor) => [flavor, sources(flavorContexts[flavor])]));

const tokens: Token[] = [];
const add = (leaf: Leaf, token: Partial<Token>) =>
  tokens.push({ name: nameOf(leaf.path), group: leaf.path[0], subgroup: leaf.path.length > 2 ? leaf.path[1] : undefined, type: leaf.type, description: leaf.description, ...token });

// The hex a color token shows in a flavor, following aliases through the
// shared sets and that flavor's own tokens.
const byPath = (list: Leaf[]) => new Map(list.map((leaf) => [leaf.path.join('.'), leaf]));
const sharedByPath = byPath(shared);
const flavorByPath = Object.fromEntries(flavors.map((flavor) => [flavor, byPath(perFlavor[flavor])]));
const hexOf = (value: unknown, flavor?: string): string | undefined => {
  if (!isAlias(value)) return (value as Json)?.hex;
  const path = value.slice(1, -1);
  const target = (flavor && flavorByPath[flavor].get(path)) || sharedByPath.get(path);
  return target && target.type === 'color' ? hexOf(target.value, flavor) : undefined;
};

for (const leaf of shared) {
  // A shared alias can land on a flavor's glass (danger is glass-ruby): it gets
  // a swatch only when it shows the same color in every flavor.
  const hexes = leaf.type === 'color' ? new Set(flavors.map((flavor) => hexOf(leaf.value, flavor))) : new Set();
  add(leaf, { value: format(leaf.type, leaf.value), swatch: hexes.size === 1 ? [...hexes][0] : undefined });
  if (leaf.type === 'typography') {
    tokens.push({ name: `${nameOf(leaf.path)}-tracking`, group: leaf.path[0], type: 'dimension', value: dimension(leaf.value.letterSpacing) });
  }
}

// Flavor tokens: the same paths in every flavor file, each with its own value.
const first = perFlavor[flavors[0]];
for (const [index, leaf] of first.entries()) {
  const values = Object.fromEntries(flavors.map((flavor) => [flavor, perFlavor[flavor][index]]));
  for (const [flavor, other] of Object.entries(values)) {
    if (other.path.join('.') !== leaf.path.join('.')) throw new Error(`Flavor "${flavor}" lists ${other.path.join('.')} where ${flavors[0]} lists ${leaf.path.join('.')}.`);
  }
  add(leaf, {
    byFlavor: Object.fromEntries(flavors.map((flavor) => [flavor, format(leaf.type, values[flavor].value)])),
    swatch: leaf.type === 'color' ? Object.fromEntries(flavors.map((flavor) => [flavor, hexOf(values[flavor].value, flavor)!])) : undefined,
  });
}

// The tokens the DTCG format cannot express (color functions, clip paths):
// computed by the stylesheet from the flavor, accent, glazing and window. The
// value shown is the first declaration, the one before any attribute applies.
const dtcgNames = new Set(tokens.map(({ name }) => name));
const declarations = [...stylesheet.matchAll(/(--san-[a-z0-9-]+):\s*([^;]+);/g)];
const cssOnlyNames = [...new Set(declarations.map(([, name]) => name))].filter((name) => !dtcgNames.has(name));
export const cssOnly: Token[] = cssOnlyNames.map((name) => ({
  name,
  group: 'css',
  type: 'css',
  value: declarations.find(([, declared]) => declared === name)![2].replace(/\s+/g, ' ').trim(),
}));

export { tokens };

// The sections of the reference, in order. Every DTCG group must belong to one,
// so a group the core adds later fails the build instead of going missing.
export const sections = [
  { id: 'stone', title: 'Stone, ink and lead', groups: ['surface', 'text', 'lead', 'umbra', 'scrim'] },
  { id: 'glass', title: 'Glass', groups: ['glass'] },
  { id: 'accent', title: 'Accent', groups: ['accent'] },
  { id: 'status', title: 'Status', groups: ['danger', 'warning', 'success', 'info'] },
  { id: 'syntax', title: 'Syntax', groups: ['syntax'] },
  { id: 'terminal', title: 'Terminal', groups: ['ansi'] },
  { id: 'windows', title: 'Named windows', groups: ['window'] },
  { id: 'pigments', title: 'Pigments', groups: ['pigment'] },
  { id: 'space', title: 'Space and size', groups: ['space', 'size', 'breakpoint'] },
  { id: 'shape', title: 'Shape', groups: ['radius', 'border'] },
  { id: 'type', title: 'Type', groups: ['font', 'type'] },
  { id: 'motion', title: 'Motion', groups: ['duration', 'ease'] },
  { id: 'light', title: 'Light', groups: ['elevation', 'blur'] },
  { id: 'state', title: 'State and layers', groups: ['state', 'layer'] },
];

const placed = new Set(sections.flatMap(({ groups }) => groups));
const unplaced = [...new Set(tokens.map(({ group }) => group))].filter((group) => !placed.has(group));
if (unplaced.length) throw new Error(`The token reference has no section for the group(s) ${unplaced.join(', ')}.`);

export const tokensOf = (groups: string[]) => tokens.filter(({ group }) => groups.includes(group));
