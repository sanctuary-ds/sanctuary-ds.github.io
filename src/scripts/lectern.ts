// Wires the theme controls: any [data-set] button on the page (the lectern's,
// and the home page's live demos) sets a core attribute on <html> and keeps the
// choice; on phones the lectern's "Light" button folds its controls in and out.
// Keys F, A, G and W step through the axes, and every change is announced with a
// `sanctuary:themechange` event, so a section can follow the theme without
// knowing where the change came from.
import { STORAGE_KEY } from '../data/theme-storage';

// How long the light takes to move across the page after a change: the core's
// procession duration, the same token the CSS transition uses (global.css), read
// at run time so the two never drift. The transition only runs when the visitor
// allows motion.
const shiftMs = (root: HTMLElement): number => {
  const value = getComputedStyle(root).getPropertyValue('--san-duration-procession').trim();
  const amount = parseFloat(value);
  if (Number.isNaN(amount)) return 900;
  return value.endsWith('ms') ? amount : amount * 1000;
};

export function initLectern(): void {
  const root = document.documentElement;
  const lectern = document.querySelector<HTMLElement>('.lectern');
  if (!lectern) return;
  let shiftTimer: number | undefined;

  const sync = () => {
    for (const button of document.querySelectorAll<HTMLElement>('[data-set]')) {
      const [axis, value] = button.dataset.set!.split(':');
      button.setAttribute('aria-pressed', String(root.getAttribute(`data-san-${axis}`) === value));
    }
    // Clocks name the current flavor; each carries the names it may show.
    for (const clock of document.querySelectorAll<HTMLElement>('[data-clock]')) {
      try {
        const names: Record<string, string> = JSON.parse(clock.dataset.clock ?? '{}');
        const flavor = root.getAttribute('data-san-flavor') ?? '';
        if (names[flavor]) clock.textContent = names[flavor];
      } catch {
        // A malformed list leaves the clock as rendered.
      }
    }
  };

  // Save only the axis the visitor changed. The other axes on <html> may come
  // from a preview link (?flavor=vespers), and a preview must never replace the
  // visitor's own choice.
  const save = (axis: string, value: string) => {
    try {
      let saved: Record<string, string> = {};
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
        // Only a plain object is a saved theme; anything else is replaced.
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) saved = parsed as Record<string, string>;
      } catch {
        // Corrupt storage: start again from this change.
      }
      const change: Record<string, string> = { [axis]: value };
      // Changing the flavor keeps the accent on screen. Save that accent too, or a
      // reload could fall back to the new flavor's own accent and look different
      // (also when the saved accent is one the core no longer has); unless the
      // accent itself is a preview, which must stay out of storage.
      const accentIsPreview = new URLSearchParams(window.location.search).has('accent');
      if (axis === 'flavor' && !accentIsPreview) {
        change.accent = root.getAttribute('data-san-accent') ?? '';
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, ...change }));
    } catch {
      // Persisting is best effort: the theme still applies for this visit.
    }
  };

  // Once the visitor picks a value, the preview parameter for that axis no longer
  // applies; dropping it lets their choice survive a reload of the same link.
  const dropPreview = (axis: string) => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(axis)) return;
    url.searchParams.delete(axis);
    window.history.replaceState(window.history.state, '', url);
  };

  const set = (axis: string, value: string) => {
    const changed = root.getAttribute(`data-san-${axis}`) !== value;
    // Clicking the value a preview already shows is still a choice: keep it.
    const fromPreview = new URLSearchParams(window.location.search).has(axis);
    if (!changed && !fromPreview) return;
    if (changed) {
      root.classList.add('is-shifting');
      window.clearTimeout(shiftTimer);
      shiftTimer = window.setTimeout(() => root.classList.remove('is-shifting'), shiftMs(root));
      root.setAttribute(`data-san-${axis}`, value);
      sync();
      document.dispatchEvent(new CustomEvent('sanctuary:themechange', { detail: { axis, value } }));
    }
    save(axis, value);
    dropPreview(axis);
  };

  // A key steps to the next value of its axis, in the order the lectern lists
  // them. Ignored with modifier keys and while the visitor is typing.
  const KEYS: Record<string, string> = { f: 'flavor', a: 'accent', g: 'glazing', w: 'window' };
  document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, select, textarea, [contenteditable=""], [contenteditable="true"]')) return;
    const axis = KEYS[event.key.toLowerCase()];
    if (!axis) return;
    const values = [...lectern.querySelectorAll<HTMLElement>(`[data-set^="${axis}:"]`)].map((button) => button.dataset.set!.split(':')[1]);
    if (values.length === 0) return;
    const current = values.indexOf(root.getAttribute(`data-san-${axis}`) ?? '');
    set(axis, values[(current + 1) % values.length]);
  });

  // One listener for the whole page: a theme button may sit anywhere.
  document.addEventListener('click', (event) => {
    const target = event.target as Element;
    const setter = target.closest<HTMLElement>('[data-set]');
    if (setter) {
      const [axis, value] = setter.dataset.set!.split(':');
      set(axis, value);
    }
    const toggle = target.closest('.lectern__toggle');
    if (toggle) {
      const open = lectern.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    }
  });

  // The theme may have been restored before the first paint; reflect it.
  sync();
}
