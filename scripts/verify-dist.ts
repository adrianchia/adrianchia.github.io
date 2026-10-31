import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const REQUIRED_FILES = [
  'CNAME',
  '.nojekyll',
  '.well-known/brave-rewards-verification.txt',
  'sw.js',
  'robots.txt',
  '404.html',
  'index.html',
];

const NOTION_URL_PATTERNS = ['prod-files-secure', 'secure.notion-static.com', 'X-Amz-Signature', 'amazonaws.com'];

async function readIfExists(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
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
    if (!/\.(html|xml)$/.test(path)) continue;
    const content = await readFile(path, 'utf8');
    for (const pattern of NOTION_URL_PATTERNS) {
      if (content.includes(pattern)) {
        problems.push(`Notion URL pattern "${pattern}" found in ${relative(distDir, path)}`);
      }
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
