// Wires the lectern: theme buttons set the core attributes on <html> and keep
// the choice, and on phones the "Light" button folds the controls in and out.
import { STORAGE_KEY } from '../data/theme-storage';

// How long the light takes to move across the page after a change; the CSS
// transition only runs when the visitor allows motion.
const SHIFT_MS = 900;

export function initLectern(): void {
  const root = document.documentElement;
  const lectern = document.querySelector<HTMLElement>('.lectern');
  if (!lectern) return;
  let shiftTimer: number | undefined;

  const sync = () => {
    for (const button of lectern.querySelectorAll<HTMLElement>('[data-set]')) {
      const [axis, value] = button.dataset.set!.split(':');
      button.setAttribute('aria-pressed', String(root.getAttribute(`data-san-${axis}`) === value));
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
      // reload would fall back to the new flavor's own accent and look different;
      // unless the accent itself is a preview, which must stay out of storage.
      const accentIsPreview = new URLSearchParams(window.location.search).has('accent');
      if (axis === 'flavor' && !saved.accent && !accentIsPreview) {
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
      shiftTimer = window.setTimeout(() => root.classList.remove('is-shifting'), SHIFT_MS);
      root.setAttribute(`data-san-${axis}`, value);
      sync();
    }
    save(axis, value);
    dropPreview(axis);
  };

  lectern.addEventListener('click', (event) => {
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
