import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import sharp from 'sharp';

export type Downloader = (url: string, destBase: string) => Promise<string>;

const TYPE_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
};

export const fetchDownloader: Downloader = async (url, destBase) => {
  const u = new URL(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${u.origin}${u.pathname}`);
  let ext = extname(u.pathname).toLowerCase();
  if (!ext) ext = TYPE_EXT[(res.headers.get('content-type') ?? '').split(';')[0]!.trim()] ?? '';
  const dest = destBase + ext;
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
};

export function imageBaseName(url: string): string {
  const u = new URL(url);
  return createHash('sha256').update(u.origin + u.pathname).digest('hex').slice(0, 16);
}

const IMG_RE = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;

export async function localizeImages(
  markdown: string,
  slug: string,
  publicDir: string,
  download: Downloader,
): Promise<string> {
  const dir = join(publicDir, 'images', 'posts', slug);
  const local = new Map<string, string>();
  for (const match of markdown.matchAll(IMG_RE)) {
    const url = match[2]!;
    if (local.has(url)) continue;
    await mkdir(dir, { recursive: true });
    const name = imageBaseName(url);
    const written = await download(url, join(dir, name));
    local.set(url, `/images/posts/${slug}/${name}${extname(written)}`);
  }
  return markdown.replace(IMG_RE, (_m, alt: string, url: string) => `![${alt}](${local.get(url)})`);
}

export async function writeCover(
  url: string,
  slug: string,
  publicDir: string,
  download: Downloader,
): Promise<string> {
  const outDir = join(publicDir, 'og', 'covers');
  await mkdir(outDir, { recursive: true });
  const tmp = await mkdtemp(join(tmpdir(), 'cover-'));
  try {
    const src = await download(url, join(tmp, 'cover'));
    await sharp(src).resize(1200, 630, { fit: 'cover' }).jpeg().toFile(join(outDir, `${slug}.jpg`));
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
  return `/og/covers/${slug}.jpg`;
}
