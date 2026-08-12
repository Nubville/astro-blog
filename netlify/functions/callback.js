// Step 2 of the GitHub OAuth handshake for Sveltia CMS. GitHub redirects
// here with a one-time code; this exchanges it for an access token and
// hands the token back to the /admin popup window via postMessage, using
// the same handshake Decap/Netlify CMS's GitHub backend expects.

export default async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('Missing GITHUB_OAUTH_CLIENT_ID/SECRET environment variables', {
      status: 500,
    });
  }

  if (!code) {
    return new Response('Missing OAuth code', { status: 400 });
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
    return respond('error', {
      message: tokenData.error_description ?? 'GitHub did not return an access token.',
    });
  }

  return respond('success', { token: tokenData.access_token, provider: 'github' });
};

function respond(status, payload) {
  // The popup posts a handshake message first; the opener echoes it back,
  // and only then does the popup send the real result. This two-step
  // dance is what Decap/Sveltia's GitHub backend listens for.
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;

  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Authenticating…</title></head>
  <body>
    <script>
      (function () {
        function receiveMessage(e) {
          window.opener.postMessage(${JSON.stringify(message)}, e.origin);
          window.removeEventListener('message', receiveMessage, false);
        }
        window.addEventListener('message', receiveMessage, false);
        window.opener.postMessage('authorizing:github', '*');
      })();
    </script>
  </body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
