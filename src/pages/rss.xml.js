import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';

// Posts are Markdown pages under src/pages/posts/, not a content collection,
// so they're gathered with import.meta.glob rather than getCollection().
export async function GET(context) {
  const posts = Object.values(import.meta.glob('./posts/*.md', { eager: true }));

  const items = posts
    .map((post) => ({
      title: post.frontmatter.title,
      pubDate: post.frontmatter.pubDate,
      description: post.frontmatter.description,
      link: post.url,
    }))
    .sort((a, b) => {
      const byDate = new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      // Same tiebreak as index.astro/blog.astro — see the comment there.
      return byDate !== 0 ? byDate : b.link.localeCompare(a.link);
    });

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items,
  });
}
