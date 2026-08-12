// Step 1 of the GitHub OAuth handshake for Sveltia CMS (Decap/Netlify CMS
// compatible protocol). Redirects the /admin popup to GitHub's authorize
// screen; GitHub sends the user back to /callback with a one-time code.
//
// Requires GITHUB_OAUTH_CLIENT_ID + GITHUB_OAUTH_CLIENT_SECRET set in the
// Netlify site's environment variables, from a GitHub OAuth App whose
// callback URL is https://www.andrewgarman.com/callback.

export default async (req) => {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;

  if (!clientId) {
    return new Response('Missing GITHUB_OAUTH_CLIENT_ID environment variable', { status: 500 });
  }

  const { origin } = new URL(req.url);
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');

  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', `${origin}/callback`);
  authorizeUrl.searchParams.set('scope', 'repo,user');
  authorizeUrl.searchParams.set('state', crypto.randomUUID());

  return new Response(null, {
    status: 302,
    headers: { Location: authorizeUrl.toString() },
  });
};
