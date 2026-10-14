import { defineConfig } from 'astro/config';

// Static output is Astro's default. The site is a user site
// (sanctuary-ds.github.io), so it is served from the root and needs no `base`.
export default defineConfig({
  site: 'https://sanctuary-ds.github.io',
});
