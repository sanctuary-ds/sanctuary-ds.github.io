// Copies values to the clipboard and says so in the page's toast. A button with
// data-copy copies that value; one with data-copy-current copies the text of its
// child for the current flavor ([data-for-flavor]), the one the page shows.

export function initCopy(): void {
  const toast = document.querySelector<HTMLElement>('[data-toast]');
  let timer: number | undefined;

  const say = (message: string) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-open');
    window.clearTimeout(timer);
    timer = window.setTimeout(() => toast.classList.remove('is-open'), 1600);
  };

  document.addEventListener('click', async (event) => {
    const trigger = (event.target as Element).closest<HTMLElement>('[data-copy], [data-copy-current]');
    if (!trigger) return;
    const flavor = document.documentElement.getAttribute('data-san-flavor');
    const value = trigger.dataset.copy ?? trigger.querySelector(`[data-for-flavor="${flavor}"]`)?.textContent;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      say(`Copied ${value}`);
    } catch {
      // No clipboard (an insecure page, or permission refused): show the value so
      // it can be copied by hand.
      say(value);
    }
  });
}
