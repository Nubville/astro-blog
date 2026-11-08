// Turns src/data/series.json, the one place a series is defined, into what
// the pages need. A post never says which series it belongs to: its part
// number, the "of 7", and its previous and next links are all worked out here
// at build time, so adding a part is one new line in series.json.

import seriesData from './data/series.json';

interface PostModule {
  url: string;
  frontmatter: { title: string; pubDate: string | Date; description?: string };
}

export interface SeriesPart {
  number: number;
  title: string;
  url: string;
  pubDate: string;
  description?: string;
}

export interface Series {
  slug: string;
  title: string;
  description: string;
  parts: SeriesPart[];
}

export interface PostSeries {
  series: Series;
  part: SeriesPart;
  previous?: SeriesPart;
  next?: SeriesPart;
}

const slugOf = (url: string) => url.replace(/\/$/, '').split('/').pop() ?? '';

/** Every series, including any too short to show yet. A bad series.json fails the build. */
function readSeries(): Series[] {
  // Must stay inside the function. Posts import the layout, which imports this
  // file, so at the top level the bundled build sees every post as undefined.
  const postModules = import.meta.glob<PostModule>('./pages/posts/*.{md,mdx}', { eager: true });
  const posts = new Map(Object.values(postModules).map((post) => [slugOf(post.url), post]));

  return Object.entries(seriesData).map(([slug, { title, description, posts: postSlugs }]) => ({
    slug,
    title,
    description,
    parts: postSlugs.map((postSlug, index) => {
      const post = posts.get(postSlug);
      if (!post) throw new Error(`series.json: "${slug}" lists "${postSlug}", which isn't a post.`);

      // A post can be shared between series, but can only hold one place in each.
      if (postSlugs.indexOf(postSlug) !== index)
        throw new Error(`series.json: "${slug}" lists "${postSlug}" more than once.`);

      return {
        number: index + 1,
        title: post.frontmatter.title,
        url: post.url,
        pubDate: post.frontmatter.pubDate.toString().slice(0, 10),
        description: post.frontmatter.description,
      };
    }),
  }));
}

/** A one-post series has nothing to navigate, so it stays hidden until a second part exists. */
export function getAllSeries(): Series[] {
  return readSeries().filter((series) => series.parts.length > 1);
}

/**
 * Where a post sits in every series it belongs to, in series.json order. Empty
 * if it isn't in one. A shared post has its own part number and neighbours in
 * each series. Takes a URL or pathname.
 */
export function getPostSeries(url: string): PostSeries[] {
  const postSlug = slugOf(url);

  return getAllSeries().flatMap((series) => {
    const index = series.parts.findIndex((part) => slugOf(part.url) === postSlug);
    if (index === -1) return [];

    return {
      series,
      part: series.parts[index],
      previous: series.parts[index - 1],
      next: series.parts[index + 1],
    };
  });
}
