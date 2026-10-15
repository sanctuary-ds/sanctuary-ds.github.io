import palette from '@sanctuary-ds/tokens/palette';

// One entry per type role the core publishes. astro.config.mjs registers each
// role's fonts under --font-<role>; Base.astro outputs them with <Font>.

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
