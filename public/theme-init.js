// Applies a saved theme choice before first paint. See BaseLayout.astro
// for why this must run synchronously this early — and why it's an
// external file rather than an inline <script>: the site's CSP is
// script-src 'self' (no 'unsafe-inline'), so an inline script here gets
// silently blocked in production even though it runs fine in local dev
// (astro dev doesn't enforce netlify.toml's headers). As a same-origin
// file this needs no CSP exception at all.
//
// Also lazy-loads each theme's own heading/code font. fonts.css only
// carries the two families every theme shares unconditionally (Work
// Sans, Patrick Hand) — everything theme-specific is fetched here, on
// demand, so a visitor who never switches themes never downloads the
// other three themes' fonts. Keyed by exact Google Fonts family query
// segment (not by theme name) so switching between two themes that
// share a font — Lamplight and Horde both use Bricolage Grotesque and
// JetBrains Mono — never fetches it twice. theme-switcher.js calls
// this same function (via window.__loadThemeFonts) when the visitor
// switches themes after load.
var THEME_FONTS = {
  paper: ['family=Special+Elite'],
  lamplight: ['family=Bricolage+Grotesque:wght@400..800', 'family=JetBrains+Mono:wght@400;500;700'],
  horde: ['family=Bricolage+Grotesque:wght@400..800', 'family=JetBrains+Mono:wght@400;500;700'],
  wayfinder: ['family=Cabin+Sketch:wght@400;700', 'family=JetBrains+Mono:wght@400;500;700'],
};

function loadThemeFonts(theme) {
  var families = THEME_FONTS[theme];
  if (!families) return;
  families.forEach(function (family) {
    var id = 'theme-font-' + family.replace(/[^a-zA-Z0-9]/g, '');
    if (document.getElementById(id)) return;
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?' + family + '&display=swap';
    // Loaded as media="print" so the browser fetches it without treating it
    // as render-blocking (print doesn't apply to screen rendering), then
    // flipped to "all" once it's actually loaded. Lighthouse flagged this
    // link as part of a render-blocking chain off theme-init.js — fair,
    // since a plain rel="stylesheet" link blocks paint by default even
    // when injected by a script that's already running post-parse. There's
    // no downside to deferring it: the font itself already uses
    // display=swap, so the page was never waiting to avoid invisible text,
    // just needlessly waiting to paint at all.
    link.media = 'print';
    link.onload = function () {
      link.media = 'all';
    };
    document.head.appendChild(link);
  });
}
window.__loadThemeFonts = loadThemeFonts;

(function () {
  // TODO: revert to 'paper' once Horde's had its run as the default.
  var DEFAULT_THEME = 'horde';
  var theme;
  try {
    theme = localStorage.getItem('ag-theme') || DEFAULT_THEME;
  } catch {
    theme = DEFAULT_THEME;
  }
  document.documentElement.dataset.theme = theme;
  loadThemeFonts(theme);
})();
