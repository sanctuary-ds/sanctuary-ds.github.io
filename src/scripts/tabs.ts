// Tabs that follow the ARIA tabs pattern: a click or the arrow keys select a tab
// and show its panel; Home and End jump to the first and last. Only the selected
// tab is in the Tab order (a roving tabindex), so the keyboard reaches the list
// once and moves inside it with the arrows.

export function initTabs(): void {
  for (const list of document.querySelectorAll<HTMLElement>('[role="tablist"]')) {
    const tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]')];

    const select = (chosen: HTMLElement) => {
      for (const tab of tabs) {
        const on = tab === chosen;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(tab.getAttribute('aria-controls') ?? '');
        if (panel) panel.hidden = !on;
      }
    };

    list.addEventListener('click', (event) => {
      const tab = (event.target as Element).closest<HTMLElement>('[role="tab"]');
      if (tab) select(tab);
    });

    list.addEventListener('keydown', (event) => {
      const current = tabs.indexOf(event.target as HTMLElement);
      if (current < 0) return;
      const target = {
        ArrowRight: (current + 1) % tabs.length,
        ArrowLeft: (current - 1 + tabs.length) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      select(tabs[target]);
      tabs[target].focus();
    });
  }
}
