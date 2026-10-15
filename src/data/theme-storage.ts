// Where the visitor's theme is kept in their browser. A module of its own, with
// no imports, so browser scripts can share it without bundling the palette.
export const STORAGE_KEY = 'sanctuary:theme';

// Whether the single-key theme shortcuts are on; "off" when the visitor turned
// them off (WCAG 2.1.4 asks that such shortcuts can be turned off).
export const SHORTCUTS_KEY = 'sanctuary:shortcuts';
