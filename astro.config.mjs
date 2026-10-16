import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';
import palette from '@sanctuary-ds/tokens/palette' with { type: 'json' };

// The core publishes, for each type role (display, text, mono, inscription), the
// family, weights, styles and fallbacks it is designed with. Astro downloads them
// from Google Fonts at build time and serves them from the site itself, so
// visitors never send requests to a third party. Each role gets the CSS variable
// --font-<role>, which src/data/fonts.ts bridges onto the core's
// --san-font-family-<role> (inlined by Base.astro).
const google = fontProviders.google();
const fonts = Object.entries(palette.fonts).map(([role, font]) => ({
  name: font.family,
  cssVariable: `--font-${role}`,
  provider: google,
  weights: font.weights,
  styles: font.styles,
  // The core's own fallbacks, then its generic family, from which Astro builds a
  // metric-matched fallback.
  fallbacks: [...font.fallbacks, font.generic],
}));

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
  integrations: [mdx(), sitemap()],
});
