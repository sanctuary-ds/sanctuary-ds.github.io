import palette from '@sanctuary-ds/tokens/palette' with { type: 'json' };

// Some light effects (the hero's beams, the rose window's cast) blend with the
// stone behind them: added light on dark flavors, tinted shade on light ones.
// The palette says which flavors are light (flavors.<id>.scheme), so the site
// generates one rule per flavor instead of inventing a theme attribute of its
// own. Every flavor sets both values, so a dark flavor nested in a light page
// gets its own blend back.
const BLEND = {
  dark: { blend: 'screen', castOpacity: '0.6' },
  light: { blend: 'multiply', castOpacity: '0.5' },
} as const;

export const schemeStyles = Object.entries(palette.flavors)
  .map(([id, flavor]) => {
    // A scheme the site does not know would otherwise pass silently as dark.
    if (!(flavor.scheme in BLEND)) {
      throw new Error(`Flavor "${id}" has scheme "${flavor.scheme}"; the site knows ${Object.keys(BLEND).join(' and ')}.`);
    }
    const { blend, castOpacity } = BLEND[flavor.scheme as keyof typeof BLEND];
    return `[data-san-flavor="${id}"]{--site-light-blend:${blend};--site-cast-opacity:${castOpacity};}`;
  })
  .join('');
