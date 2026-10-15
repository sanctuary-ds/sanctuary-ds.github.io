// Wires the lectern: theme buttons set the core attributes on <html> and keep
// the choice, and on phones the "Light" button folds the controls in and out.
import { STORAGE_KEY } from '../data/theme-storage';

const AXES = ['flavor', 'accent', 'glazing', 'window'] as const;

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

  const save = () => {
    const theme = Object.fromEntries(AXES.map((axis) => [axis, root.getAttribute(`data-san-${axis}`)]));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch {
      // Persisting is best effort: the theme still applies for this visit.
    }
  };

  const set = (axis: string, value: string) => {
    if (root.getAttribute(`data-san-${axis}`) === value) return;
    root.classList.add('is-shifting');
    window.clearTimeout(shiftTimer);
    shiftTimer = window.setTimeout(() => root.classList.remove('is-shifting'), SHIFT_MS);
    root.setAttribute(`data-san-${axis}`, value);
    sync();
    save();
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
