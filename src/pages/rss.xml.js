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
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items,
  });
}
