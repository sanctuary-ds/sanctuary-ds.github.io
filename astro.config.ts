import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { defineConfig, fontProviders } from 'astro/config';
import * as palette from '@sanctuary-ds/tokens/palette';
import * as pagefind from 'pagefind';
import { entriesOf } from './src/data/objects';

// The core publishes, for each type role (display, text, mono, inscription), the
// family, weights, styles and fallbacks it is designed with. Astro downloads them
// from Google Fonts at build time and serves them from the site itself, so
// visitors never send requests to a third party. Each role gets the CSS variable
// --font-<role>, which src/data/fonts.ts bridges onto the core's
// --san-font-family-<role> (inlined by Base.astro).
// Astro wants at least one weight and one style per family, and only the CSS
// font styles; the core types them as plain lists of numbers and strings. A role
// the core publishes outside that shape fails the build here, by name.
const STYLES = ['normal', 'italic', 'oblique'] as const;
type Style = (typeof STYLES)[number];
const isStyle = (style: string): style is Style => (STYLES as readonly string[]).includes(style);
const nonEmpty = <T>(list: readonly T[], what: string): [T, ...T[]] => {
  const [first, ...rest] = list;
  if (list.length === 0) throw new Error(`The core lists no ${what}.`);
  return [first, ...rest];
};
const stylesOf = (role: string, styles: readonly string[]) =>
  nonEmpty(
    styles.map((style) => {
      if (!isStyle(style)) throw new Error(`The core lists the font style "${style}" for ${role}, which is not a CSS font style.`);
      return style;
    }),
    `font styles for ${role}`,
  );

const google = fontProviders.google();
const fonts = entriesOf(palette.fonts).map(([role, font]) => ({
  name: font.family,
  cssVariable: `--font-${role}` as const,
  provider: google,
  weights: nonEmpty(font.weights, `font weights for ${role}`),
  styles: stylesOf(role, font.styles),
  // The core's own fallbacks, then its generic family, from which Astro builds a
  // metric-matched fallback.
  fallbacks: [...font.fallbacks, font.generic],
}));

// Search: once Astro has written the site, Pagefind indexes the main content of
// every page (marked data-pagefind-body) into dist/pagefind, which the search
// dialog in the header loads. A failure stops the build rather than shipping a
// site whose search is broken. Pagefind is imported with the config, not inside
// the hook: a TypeScript config is loaded through Vite's module runner, which is
// closed by the time astro:build:done runs.
const search: AstroIntegration = {
  name: 'pagefind',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const { index, errors } = await pagefind.createIndex();
      if (!index) throw new Error(`Pagefind could not start: ${errors.join('; ')}`);
      const added = await index.addDirectory({ path: fileURLToPath(dir) });
      if (added.errors.length) throw new Error(`Pagefind could not index the site: ${added.errors.join('; ')}`);
      const written = await index.writeFiles({ outputPath: fileURLToPath(new URL('pagefind/', dir)) });
      if (written.errors.length) throw new Error(`Pagefind could not write its index: ${written.errors.join('; ')}`);
      await pagefind.close();
      logger.info(`Indexed ${added.page_count} pages for search.`);
    },
  },
};

// Static output is Astro's default. The site is a user site
// (sanctuary-ds.github.io), so it is served from the root and needs no `base`.
export default defineConfig({
  site: 'https://sanctuary-ds.github.io',
  // English is the default and stays unprefixed (/docs, not /en/docs), so adding
  // Spanish later under /es/ moves no existing URL.
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  fonts,
  // Code blocks stay plain text styled with the tokens (src/layouts/Doc.astro): a
  // fixed highlighting theme would ignore the flavor and could fail its contrast.
  markdown: { syntaxHighlight: false },
  // MDX lets a docs page place components among its Markdown, so tables derived
  // from the core are generated from its palette instead of copied by hand. It
  // inherits the markdown settings above. The sitemap lists every page for
  // search engines, from `site`; robots.txt points to it.
  integrations: [mdx(), sitemap(), search],
});
