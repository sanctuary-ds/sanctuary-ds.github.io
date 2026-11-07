// The value of an ARIA state such as aria-pressed or aria-selected, written out
// as the attribute holds it. String(boolean) is typed as any string; this is
// typed as the two values the attribute accepts.
export const ariaBoolean = (value: boolean): 'true' | 'false' => (value ? 'true' : 'false');
