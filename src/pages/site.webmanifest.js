import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

// A dynamic endpoint rather than a static public/site.webmanifest file, so
// the CMS-editable title/description in src/data/site.json flow through
// here the same way they do into <meta> tags and the RSS feed.
export async function GET() {
  const manifest = {
    name: SITE_TITLE,
    short_name: 'Andrew Garman',
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    theme_color: '#2a1e10', // mirrors --ink from paper.css
    background_color: '#f6f1e7', // mirrors --paper from paper.css
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
