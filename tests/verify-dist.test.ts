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
  expect(await verifyDist(await makeDist({ ...GOOD, 'blogs/x/index.html': GOOD_POST }))).toEqual([]);
});

test('flags post page without article og:type', async () => {
  const html = GOOD_POST.replace('content="article"', 'content="website"');
  const problems = await verifyDist(await makeDist({ ...GOOD, 'blogs/x/index.html': html }));
  expect(problems).toContainEqual(expect.stringMatching(/blogs\/x\/index\.html.*og:type/));
});

test('flags post page without article:published_time', async () => {
  const html = GOOD_POST.replace(/<meta property="article:published_time"[^>]*>/, '');
  const problems = await verifyDist(await makeDist({ ...GOOD, 'blogs/x/index.html': html }));
  expect(problems).toContainEqual(expect.stringMatching(/blogs\/x\/index\.html.*article:published_time/));
});

test('flags post image missing from dist', async () => {
  const html = GOOD_POST.replace('<body>', '<body><img src="/images/posts/x/a.png">');
  const problems = await verifyDist(await makeDist({ ...GOOD, 'blogs/x/index.html': html }));
  expect(problems).toContainEqual(expect.stringContaining('/images/posts/x/a.png'));
});

test('accepts post image present in dist and ignores external images', async () => {
  const html = GOOD_POST.replace('<body>', '<body><img src="/images/posts/x/a.png"><img src="https://example.com/b.png">');
  const dir = await makeDist({ ...GOOD, 'blogs/x/index.html': html, 'images/posts/x/a.png': 'png' });
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
