import palette from '@sanctuary-ds/tokens/palette';

// One entry per type role the core publishes. astro.config.mjs registers each
// role's fonts under --font-<role>; Base.astro outputs them with <Font> and the
// bridge below.

// The body text is what a visitor reads first, so its regular weight is preloaded.
const PRELOADED_ROLE = 'text';
const PRELOADED_WEIGHT = 400;

export const fontRoles = Object.entries(palette.fonts).map(([role, font]) => ({
  cssVariable: `--font-${role}` as const,
  preload:
    role === PRELOADED_ROLE && font.weights.includes(PRELOADED_WEIGHT)
      ? [{ weight: PRELOADED_WEIGHT, style: 'normal' }]
      : false,
}));

// The core's family tokens (--san-font-family-<role>) name bare families, but
// Astro suffixes the families it hosts. Point every role's token at its hosted
// family and metric-matched fallback. ':root:root' outranks the core's ':root',
// so the bridge applies whatever order the stylesheets load in.
export const fontBridge = `:root:root{${Object.keys(palette.fonts)
  .map((role) => `--san-font-family-${role}:var(--font-${role});`)
  .join('')}}`;
