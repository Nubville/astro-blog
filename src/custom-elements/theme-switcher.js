// <theme-switcher> — wraps a native <select> that swaps the site's
// design-token theme by setting data-theme on <html> and persisting
// the choice. The FOUC-prevention script in BaseLayout.astro applies
// any stored theme before first paint; this element just needs to
// react to future changes and keep the <select> in sync with
// whatever is already active.
const STORAGE_KEY = 'ag-theme';

customElements.define(
  'theme-switcher',
  class extends HTMLElement {
    connectedCallback() {
      const select = this.querySelector('select');
      if (!select) return;

      const known = [...select.options].map((option) => option.value);
      const active = document.documentElement.dataset.theme;

      select.value = known.includes(active) ? active : known[0];

      select.addEventListener('change', () => {
        const theme = select.value;
        document.documentElement.dataset.theme = theme;

        // Lazy-loads this theme's own heading/code font if nothing has
        // already fetched it — see theme-init.js, which defines this
        // and calls it once on initial load for whatever theme was
        // already active.
        window.__loadThemeFonts?.(theme);

        try {
          localStorage.setItem(STORAGE_KEY, theme);
        } catch {
          // Storage unavailable (private browsing, quota, etc.) — the
          // theme still applies for this page load, it just won't
          // persist to the next one.
        }
      });
    }
  }
);
