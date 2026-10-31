import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { RSS_TITLE, SITE_DESCRIPTION, SITE_URL } from '../config.ts';
import { getPosts, postUrl } from '../lib/posts.ts';

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  return rss({
    title: RSS_TITLE,
    description: SITE_DESCRIPTION,
    site: SITE_URL,
    items: posts.map(({ data }) => ({
      title: data.title,
      pubDate: data.date,
      link: postUrl(data.slug),
      description: data.description,
    })),
  });
};
