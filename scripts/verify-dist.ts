import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { LEGACY_SLUGS } from '../src/lib/legacy.ts';

const REQUIRED_FILES = [
  'CNAME',
  '.nojekyll',
  '.well-known/brave-rewards-verification.txt',
  'sw.js',
  'robots.txt',
  'rss.xml',
  'sitemap.xml',
  '404.html',
  'index.html',
  'about/index.html',
  'flashylight-privacy-policy/index.html',
  'tea-o-meter-privacy-policy/index.html',
];

const NOTION_URL_PATTERNS = ['prod-files-secure', 'secure.notion-static.com', 'X-Amz-Signature', 'amazonaws.com'];

const TEXT_OUTPUT = /\.(html|xml|js|json|css|txt|webmanifest)$/;
const SITE_ORIGIN = 'https://www.adrianchia.com';

async function readIfExists(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // directory does not exist
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

export async function verifyDist(distDir: string): Promise<string[]> {
  const problems: string[] = [];

  for (const file of REQUIRED_FILES) {
    if ((await readIfExists(join(distDir, file))) === null) problems.push(`Missing required file: ${file}`);
  }

  const cname = await readIfExists(join(distDir, 'CNAME'));
  if (cname !== null && cname.trim() !== 'www.adrianchia.com') {
    problems.push(`CNAME must be "www.adrianchia.com", found "${cname.trim()}"`);
  }

  const robots = await readIfExists(join(distDir, 'robots.txt'));
  if (robots !== null && !robots.includes('Sitemap: https://www.adrianchia.com/sitemap.xml')) {
    problems.push('robots.txt is missing the "Sitemap: https://www.adrianchia.com/sitemap.xml" line');
  }

  const home = await readIfExists(join(distDir, 'index.html'));
  if (home !== null && !/<meta property="og:image" content="https:\/\/www\.adrianchia\.com\/[^"]*"/.test(home)) {
    problems.push('index.html is missing an absolute og:image (https://www.adrianchia.com/...)');
  }

  for await (const path of walk(distDir)) {
    if (!TEXT_OUTPUT.test(path)) continue;
    const content = await readFile(path, 'utf8');
    for (const pattern of NOTION_URL_PATTERNS) {
      if (content.includes(pattern)) {
        problems.push(`Notion URL pattern "${pattern}" found in ${relative(distDir, path)}`);
      }
    }
  }

  for await (const path of walk(distDir)) {
    if (!path.endsWith('.html')) continue;
    const rel = relative(distDir, path).split(sep).join('/');
    const html = await readFile(path, 'utf8');
    for (const [, image] of html.matchAll(/<meta property="og:image" content="([^"]*)"/g)) {
      if (!image.startsWith(`${SITE_ORIGIN}/`)) continue;
      const file = decodeURIComponent(image.slice(SITE_ORIGIN.length).split(/[?#]/)[0]);
      if ((await readIfExists(join(distDir, file))) === null) problems.push(`${rel} og:image points to missing file ${file}`);
    }
  }

  const postSlugs: string[] = [];
  for await (const path of walk(join(distDir, 'blogs'))) {
    const rel = relative(distDir, path).split(sep).join('/');
    if (!/^blogs\/[^/]+\/index\.html$/.test(rel)) continue;
    postSlugs.push(rel.split('/')[1]);
    const html = await readFile(path, 'utf8');
    if (!/<meta property="og:type" content="article"/.test(html)) problems.push(`${rel} is missing og:type article`);
    if (!/<meta property="article:published_time" content="[^"]+"/.test(html)) {
      problems.push(`${rel} is missing article:published_time`);
    }
    for (const [, src] of html.matchAll(/<img\b[^>]*?\ssrc="(\/[^"]*)"/g)) {
      const file = decodeURIComponent(src.split(/[?#]/)[0]);
      if ((await readIfExists(join(distDir, file))) === null) problems.push(`${rel} references missing image ${src}`);
    }
  }

  const rss = await readIfExists(join(distDir, 'rss.xml'));
  if (rss !== null) {
    const items = (rss.match(/<item[\s>]/g) ?? []).length;
    if (items !== postSlugs.length) problems.push(`rss.xml has ${items} items but dist has ${postSlugs.length} post pages`);
  }

  const sitemap = await readIfExists(join(distDir, 'sitemap.xml'));
  if (sitemap !== null) {
    const locs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    for (const slug of postSlugs) {
      if (!locs.includes(`${SITE_ORIGIN}/blogs/${slug}/`)) problems.push(`sitemap.xml is missing /blogs/${slug}/`);
    }
    for (const slug of LEGACY_SLUGS) {
      if (locs.includes(`${SITE_ORIGIN}/${slug}/`)) problems.push(`sitemap.xml contains legacy root url /${slug}/`);
    }
    if (locs.some((loc) => loc.endsWith('/404.html') || loc.endsWith('/404/'))) {
      problems.push('sitemap.xml contains the 404 page');
    }
  }

  for (const slug of LEGACY_SLUGS) {
    const rel = `${slug}/index.html`;
    const html = await readIfExists(join(distDir, rel));
    if (html === null) {
      problems.push(`Missing legacy redirect for ${slug} (${rel})`);
      continue;
    }
    if (!/http-equiv="refresh"/i.test(html)) problems.push(`${rel} is missing a meta refresh redirect`);
    if (!html.includes(`<link rel="canonical" href="https://www.adrianchia.com/blogs/${slug}/"`)) {
      problems.push(`${rel} is missing canonical https://www.adrianchia.com/blogs/${slug}/`);
    }
  }

  return problems;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = await verifyDist(process.argv[2] ?? 'dist');
  if (problems.length > 0) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log('dist OK');
}
