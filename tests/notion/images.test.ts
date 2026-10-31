import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { imageBaseName, localizeImages, writeCover } from '../../scripts/notion/images.ts';
import type { Downloader } from '../../scripts/notion/images.ts';

let tmp: string;
beforeEach(async () => { tmp = await mkdtemp(join(tmpdir(), 'img-test-')); });
afterEach(() => rm(tmp, { recursive: true, force: true }));

const calls: string[] = [];
const fakeDl: Downloader = async (url, destBase) => { calls.push(url); return destBase + '.png'; };
const failingDl: Downloader = async () => { throw new Error('boom'); };

test('rewrites images to local paths keyed by url without query', async () => {
  const out = await localizeImages('![a](https://prod-files-secure.s3.us-west-2.amazonaws.com/x/img.png?X-Amz-Signature=1)', 's', tmp, fakeDl);
  expect(out).toMatch(/^!\[a\]\(\/images\/posts\/s\/[0-9a-f]{16}\.png\)$/);
  expect(imageBaseName('https://h/x/img.png?a=1')).toBe(imageBaseName('https://h/x/img.png?a=2'));
  expect(imageBaseName('https://h/x/img.png')).not.toBe(imageBaseName('https://h/y/img.png'));
});
test('downloads a repeated url once and leaves non-image links alone', async () => {
  calls.length = 0;
  const md = '![a](https://h/i.png) text [l](https://h/i.png) ![b](https://h/i.png?z=1)';
  const out = await localizeImages(md, 's', tmp, fakeDl);
  expect(calls).toHaveLength(2); // different query strings are different urls; same name, same file
  expect(out).toContain('[l](https://h/i.png)');
});
test('download failure propagates', async () =>
  await expect(localizeImages('![a](https://h/x.png)', 's', tmp, failingDl)).rejects.toThrow());

test('writeCover resizes to 1200x630 jpeg', async () => {
  const png = await sharp({ create: { width: 50, height: 50, channels: 3, background: '#f00' } }).png().toBuffer();
  const dl: Downloader = async (_u, destBase) => {
    await writeFile(destBase + '.png', png);
    return destBase + '.png';
  };
  const p = await writeCover('https://example.com/c.png', 'slug', tmp, dl);
  expect(p).toBe('/og/covers/slug.jpg');
  const meta = await sharp(await readFile(join(tmp, 'og/covers/slug.jpg'))).metadata();
  expect([meta.width, meta.height, meta.format]).toEqual([1200, 630, 'jpeg']);
});
