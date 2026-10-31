import type { APIRoute } from 'astro';
import { SITE_URL } from '../config.ts';
import { formatDate, getPosts, postUrl } from '../lib/posts.ts';
import { groupByTag } from '../lib/tags.ts';

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Legacy root slugs and /404.html are deliberately absent: the redirect stubs are noindex.
export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const entries: { path: string; lastmod?: string }[] = [
    { path: '/' },
    { path: '/blogs/' },
    { path: '/about/' },
    { path: '/tags/' },
    ...groupByTag(posts).map((g) => ({ path: `/tags/${g.slug}/` })),
    ...posts.map((p) => ({ path: postUrl(p.data.slug), lastmod: formatDate(p.data.date) })),
    { path: '/flashylight-privacy-policy/' },
    { path: '/tea-o-meter-privacy-policy/' },
  ];
  const urls = entries
    .map(
      ({ path, lastmod }) =>
        `  <url><loc>${escapeXml(SITE_URL + path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
    )
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
