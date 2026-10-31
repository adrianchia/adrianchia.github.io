import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { expect, test } from 'vitest';
import { verifyDist } from '../scripts/verify-dist.ts';
import { LEGACY_SLUGS } from '../src/lib/legacy.ts';

async function makeDist(files: Record<string, string> = {}): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'dist-'));
  for (const [name, content] of Object.entries(files)) {
    const path = join(dir, name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content);
  }
  return dir;
}

const redirectStub = (slug: string) =>
  `<!doctype html><title>Redirecting to: /blogs/${slug}/</title><meta http-equiv="refresh" content="0;url=/blogs/${slug}/"><link rel="canonical" href="https://www.adrianchia.com/blogs/${slug}/">`;

function rssXml(items: number): string {
  return `<rss><channel>${'<item><title>t</title></item>'.repeat(items)}</channel></rss>`;
}

function sitemapXml(slugs: string[], extra: string[] = []): string {
  const urls = ['/', '/blogs/', '/about/', ...slugs.map((s) => `/blogs/${s}/`), ...extra];
  return `<urlset>${urls.map((u) => `<url><loc>https://www.adrianchia.com${u}</loc></url>`).join('')}</urlset>`;
}

/** A dist with the given post pages, matching rss and sitemap. */
function withPosts(slugs: string[], html = GOOD_POST): Record<string, string> {
  return {
    ...GOOD,
    ...Object.fromEntries(slugs.map((s) => [`blogs/${s}/index.html`, html])),
    'rss.xml': rssXml(slugs.length),
    'sitemap.xml': sitemapXml(slugs),
  };
}

const GOOD: Record<string, string> = {
  'about/index.html': '<html></html>',
  'flashylight-privacy-policy/index.html': '<html></html>',
  'tea-o-meter-privacy-policy/index.html': '<html></html>',
  ...Object.fromEntries(LEGACY_SLUGS.map((slug) => [`${slug}/index.html`, redirectStub(slug)])),
  CNAME: 'www.adrianchia.com\n',
  '.nojekyll': '',
  '.well-known/brave-rewards-verification.txt': 'x',
  'sw.js': '',
  'robots.txt': 'User-agent: *\nSitemap: https://www.adrianchia.com/sitemap.xml\n',
  '404.html': '<html></html>',
  'index.html': '<html><head><meta property="og:image" content="https://www.adrianchia.com/og/site.png"></head></html>',
  'og/site.png': 'png',
  'rss.xml': rssXml(0),
  'sitemap.xml': sitemapXml([]),
};

test('reports missing required files', async () => {
  const problems = (await verifyDist(await makeDist())).join('\n');
  for (const f of ['CNAME', '.nojekyll', '.well-known/brave-rewards-verification.txt', 'sw.js', 'robots.txt', '404.html', 'index.html', 'about/index.html', 'flashylight-privacy-policy/index.html', 'tea-o-meter-privacy-policy/index.html'])
    expect(problems).toContain(f);
});

test('accepts a complete dist', async () => {
  expect(await verifyDist(await makeDist(GOOD))).toEqual([]);
});

test('rejects wrong CNAME', async () => {
  const problems = await verifyDist(await makeDist({ ...GOOD, CNAME: 'adrianchia.github.io' }));
  expect(problems).toContainEqual(expect.stringContaining('CNAME'));
});

test('requires sitemap line in robots.txt', async () => {
  const problems = await verifyDist(await makeDist({ ...GOOD, 'robots.txt': 'User-agent: *\n' }));
  expect(problems).toContainEqual(expect.stringContaining('robots.txt'));
});

test('flags Notion signed URLs in any html/xml file', async () => {
  const dir = await makeDist({
    ...GOOD,
    'about/index.html':
      '<img src="https://prod-files-secure.s3.us-west-2.amazonaws.com/x.png?X-Amz-Signature=abc">',
  });
  expect(await verifyDist(dir)).toContainEqual(expect.stringMatching(/Notion URL.*about\/index\.html/));
});

test('requires an absolute og:image on the homepage', async () => {
  const dir = await makeDist({
    ...GOOD,
    'index.html': '<html><head><meta property="og:image" content="/og/site.png"></head></html>',
  });
  expect(await verifyDist(dir)).toContainEqual(expect.stringMatching(/index\.html.*og:image/));
});

const GOOD_POST =
  '<html><head><meta property="og:type" content="article"><meta property="article:published_time" content="2020-08-28T00:00:00.000Z"></head><body></body></html>';

test('accepts a well-formed post page', async () => {
  expect(await verifyDist(await makeDist(withPosts(['x'])))).toEqual([]);
});

test('flags post page without article og:type', async () => {
  const html = GOOD_POST.replace('content="article"', 'content="website"');
  const problems = await verifyDist(await makeDist(withPosts(['x'], html)));
  expect(problems).toContainEqual(expect.stringMatching(/blogs\/x\/index\.html.*og:type/));
});

test('flags post page without article:published_time', async () => {
  const html = GOOD_POST.replace(/<meta property="article:published_time"[^>]*>/, '');
  const problems = await verifyDist(await makeDist(withPosts(['x'], html)));
  expect(problems).toContainEqual(expect.stringMatching(/blogs\/x\/index\.html.*article:published_time/));
});

test('flags post image missing from dist', async () => {
  const html = GOOD_POST.replace('<body>', '<body><img src="/images/posts/x/a.png">');
  const problems = await verifyDist(await makeDist(withPosts(['x'], html)));
  expect(problems).toContainEqual(expect.stringContaining('/images/posts/x/a.png'));
});

test('accepts post image present in dist and ignores external images', async () => {
  const html = GOOD_POST.replace('<body>', '<body><img src="/images/posts/x/a.png"><img src="https://example.com/b.png">');
  const dir = await makeDist({ ...withPosts(['x'], html), 'images/posts/x/a.png': 'png' });
  expect(await verifyDist(dir)).toEqual([]);
});

test('does not treat the blogs index as a post page', async () => {
  expect(await verifyDist(await makeDist({ ...GOOD, 'blogs/index.html': '<html></html>' }))).toEqual([]);
});

test('flags legacy slug without redirect', async () => {
  const { ['2014-06-16-welcome-to-my-blog/index.html']: _, ...rest } = GOOD;
  const problems = await verifyDist(await makeDist(rest));
  expect(problems).toContainEqual(expect.stringContaining('2014-06-16-welcome-to-my-blog'));
});

test('flags legacy page that lacks refresh or canonical', async () => {
  const slug = '2014-06-16-welcome-to-my-blog';
  const noRefresh = await verifyDist(
    await makeDist({ ...GOOD, [`${slug}/index.html`]: redirectStub(slug).replace(/<meta http-equiv[^>]*>/, '') }),
  );
  expect(noRefresh).toContainEqual(expect.stringMatching(/refresh/));
  const badCanonical = await verifyDist(
    await makeDist({ ...GOOD, [`${slug}/index.html`]: redirectStub(slug).replace('www.adrianchia.com', 'example.com') }),
  );
  expect(badCanonical).toContainEqual(expect.stringMatching(/canonical/));
});

test('flags Notion signed URLs in js and other text outputs', async () => {
  const dir = await makeDist({ ...GOOD, 'assets/app.js': 'fetch("https://x.com/a?X-Amz-Signature=abc")' });
  expect(await verifyDist(dir)).toContainEqual(expect.stringMatching(/Notion URL.*assets\/app\.js/));
});

test('flags og:image that does not exist in dist', async () => {
  const { ['og/site.png']: _, ...rest } = GOOD;
  expect(await verifyDist(await makeDist(rest))).toContainEqual(expect.stringMatching(/index\.html.*\/og\/site\.png/));
});

test('flags rss/post count mismatch', async () => {
  const dist = { ...withPosts(['a', 'b']), 'rss.xml': rssXml(1) };
  expect(await verifyDist(await makeDist(dist))).toContainEqual(expect.stringMatching(/rss\.xml.*1.*2/));
});

test('flags sitemap missing a post page', async () => {
  const dist = { ...withPosts(['a', 'b']), 'sitemap.xml': sitemapXml(['a']) };
  expect(await verifyDist(await makeDist(dist))).toContainEqual(expect.stringContaining('/blogs/b/'));
});

test('flags sitemap containing a legacy root url', async () => {
  const slug = '2014-06-16-welcome-to-my-blog';
  const dist = { ...GOOD, 'sitemap.xml': sitemapXml([], [`/${slug}/`]) };
  expect(await verifyDist(await makeDist(dist))).toContainEqual(expect.stringContaining(slug));
});

test('flags sitemap containing 404.html', async () => {
  const dist = { ...GOOD, 'sitemap.xml': sitemapXml([], ['/404.html']) };
  expect(await verifyDist(await makeDist(dist))).toContainEqual(expect.stringContaining('404'));
});

test('flags missing rss.xml and sitemap.xml', async () => {
  const { ['rss.xml']: _a, ['sitemap.xml']: _b, ...rest } = GOOD;
  const problems = (await verifyDist(await makeDist(rest))).join('\n');
  expect(problems).toContain('rss.xml');
  expect(problems).toContain('sitemap.xml');
});
