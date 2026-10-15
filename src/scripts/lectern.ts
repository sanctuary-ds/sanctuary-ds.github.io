// Wires the lectern: theme buttons set the core attributes on <html>, and on
// phones the "Light" button folds the controls in and out.

export function initLectern(): void {
  const root = document.documentElement;
  const lectern = document.querySelector<HTMLElement>('.lectern');
  if (!lectern) return;

  const sync = () => {
    for (const button of lectern.querySelectorAll<HTMLElement>('[data-set]')) {
      const [axis, value] = button.dataset.set!.split(':');
      button.setAttribute('aria-pressed', String(root.getAttribute(`data-san-${axis}`) === value));
    }
  };

  lectern.addEventListener('click', (event) => {
    const target = event.target as Element;
    const setter = target.closest<HTMLElement>('[data-set]');
    if (setter) {
      const [axis, value] = setter.dataset.set!.split(':');
      root.setAttribute(`data-san-${axis}`, value);
      sync();
    }
    const toggle = target.closest('.lectern__toggle');
    if (toggle) {
      const open = lectern.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    }
  });

  sync();
}
