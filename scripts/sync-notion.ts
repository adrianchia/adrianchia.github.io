import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Client } from '@notionhq/client';
import { stringify } from 'yaml';
import { fetchDownloader, localizeImages, writeCover } from './notion/images.ts';
import type { Downloader } from './notion/images.ts';
import { pageToPostMeta, queryPublishedPages, validatePosts } from './notion/map.ts';
import { excerpt, pageToMarkdown, readingMinutes } from './notion/markdown.ts';
import { SyncError } from './notion/types.ts';

export interface SyncOptions {
  client: Client;
  databaseId: string;
  contentDir: string;
  publicDir: string;
  download: Downloader;
}

export async function syncNotion(opts: SyncOptions): Promise<{ count: number }> {
  const { client, databaseId, contentDir, publicDir, download } = opts;

  const pages = await queryPublishedPages(client, databaseId);
  // An empty result is almost always misconfiguration (renamed status, wrong database); never wipe the site for it.
  if (pages.length === 0) throw new SyncError('No Published posts found in Notion; refusing to replace existing content');
  const metas = pages.map(pageToPostMeta);
  validatePosts(metas);

  await rm(contentDir, { recursive: true, force: true });
  await rm(join(publicDir, 'images', 'posts'), { recursive: true, force: true });
  await rm(join(publicDir, 'og', 'covers'), { recursive: true, force: true });
  await mkdir(contentDir, { recursive: true });

  for (const meta of metas) {
    const raw = await pageToMarkdown(client, meta.notionId);
    const body = await localizeImages(raw, meta.slug, publicDir, download);
    const cover = meta.coverUrl ? await writeCover(meta.coverUrl, meta.slug, publicDir, download) : null;
    const frontmatter = {
      title: meta.title,
      slug: meta.slug,
      date: meta.date,
      tags: meta.tags,
      description: meta.description ?? excerpt(body),
      readingMinutes: readingMinutes(body),
      cover,
      coverCredit: meta.coverCredit,
    };
    // Quote every string so titles with colons/quotes and date-like values stay strings.
    const yaml = stringify(frontmatter, { defaultStringType: 'QUOTE_DOUBLE', defaultKeyType: 'PLAIN' });
    await writeFile(join(contentDir, `${meta.slug}.md`), `---\n${yaml}---\n\n${body}`);
  }
  return { count: metas.length };
}

if (import.meta.main) {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) {
    console.error('Missing NOTION_TOKEN / NOTION_DATABASE_ID (see .env.example)');
    process.exit(1);
  }
  try {
    const { count } = await syncNotion({
      client: new Client({ auth: token }),
      databaseId,
      contentDir: 'src/content/posts',
      publicDir: 'public',
      download: fetchDownloader,
    });
    console.log(`Synced ${count} posts from Notion`);
  } catch (err) {
    if (err instanceof SyncError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}
