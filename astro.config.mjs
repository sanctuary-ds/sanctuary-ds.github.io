import { defineConfig, fontProviders } from 'astro/config';

// The families the core's type tokens name, with the weights and styles the site
// uses. Astro downloads them from Google Fonts at build time and serves them from
// the site itself, so visitors never send requests to a third party.
const google = fontProviders.google();
const fonts = [
  { name: 'Cormorant Garamond', cssVariable: '--font-display', weights: [400, 500, 600], styles: ['normal'], fallbacks: ['serif'] },
  { name: 'Cormorant Garamond', cssVariable: '--font-display', weights: [500], styles: ['italic'], fallbacks: ['serif'] },
  { name: 'Hanken Grotesk', cssVariable: '--font-text', weights: [400, 500, 600], styles: ['normal'], fallbacks: ['sans-serif'] },
  { name: 'JetBrains Mono', cssVariable: '--font-mono', weights: [400, 500], styles: ['normal'], fallbacks: ['monospace'] },
  { name: 'Cinzel', cssVariable: '--font-inscription', weights: [500, 600], styles: ['normal'], fallbacks: ['serif'] },
].map((font) => ({ ...font, provider: google }));

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
});
