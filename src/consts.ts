// Site-wide identity. Used for <title>, meta descriptions, social cards,
// the RSS feed, and structured data.
//
// The editorial fields below (title, author, description, default social
// image, links) live in src/data/site.json so they're editable through the
// CMS. SITE_URL stays hardcoded here — it drives canonical URLs, the
// sitemap, and og:image resolution, so it shouldn't be editable outside a
// deploy.

import site from './data/site.json';

export const SITE_URL = 'https://www.andrewgarman.com';

export const SITE_TITLE = site.title;
export const SITE_AUTHOR = site.author;

export const SITE_DESCRIPTION = site.description;

/** Falls back onto any page that does not supply its own social image. */
export const DEFAULT_SOCIAL_IMAGE = site.defaultSocialImage;
export const DEFAULT_SOCIAL_IMAGE_ALT = site.defaultSocialImageAlt;

export const LINKS = site.links;
