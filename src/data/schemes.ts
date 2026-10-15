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
    const { blend, castOpacity } = BLEND[flavor.scheme === 'light' ? 'light' : 'dark'];
    return `[data-san-flavor="${id}"]{--site-light-blend:${blend};--site-cast-opacity:${castOpacity};}`;
  })
  .join('');
