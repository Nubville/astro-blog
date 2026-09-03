// Applies a saved theme choice before first paint. See BaseLayout.astro
// for why this must run synchronously this early — and why it's an
// external file rather than an inline <script>: the site's CSP is
// script-src 'self' (no 'unsafe-inline'), so an inline script here gets
// silently blocked in production even though it runs fine in local dev
// (astro dev doesn't enforce netlify.toml's headers). As a same-origin
// file this needs no CSP exception at all.
(function () {
  // TODO: revert to 'paper' once Horde's had its run as the default.
  var DEFAULT_THEME = 'horde';
  try {
    var stored = localStorage.getItem('ag-theme');
    document.documentElement.dataset.theme = stored || DEFAULT_THEME;
  } catch {
    document.documentElement.dataset.theme = DEFAULT_THEME;
  }
})();
