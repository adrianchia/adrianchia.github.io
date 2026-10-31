import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { parse } from 'yaml';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { syncNotion } from '../scripts/sync-notion.ts';
import { SyncError } from '../scripts/notion/types.ts';
import fullJson from './fixtures/notion/page-full.json' with { type: 'json' };
import creditJson from './fixtures/notion/page-credit.json' with { type: 'json' };

let contentDir: string, publicDir: string, root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'sync-test-'));
  contentDir = join(root, 'content');
  publicDir = join(root, 'public');
});
afterEach(() => rm(root, { recursive: true, force: true }));

const rt = (s: string) => ({ type: 'text', text: { content: s, link: null }, plain_text: s, href: null,
  annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' } });
const para = (s: string) => ({ object: 'block', id: 'b' + s.length, type: 'paragraph', has_children: false, paragraph: { rich_text: [rt(s)] } });

function page(src: unknown, id: string, slug: string, title: string) {
  const p = structuredClone(src) as any;
  p.id = id;
  p.properties.Slug.rich_text[0].plain_text = slug;
  p.properties.Title.title[0].plain_text = title;
  return p;
}
function fakeClient(pages: any[], bodies: Record<string, any[]>): any {
  return {
    databases: { retrieve: async () => ({ data_sources: [{ id: 'ds' }] }) },
    dataSources: { query: async () => ({ object: 'list', results: pages, has_more: false, next_cursor: null }) },
    blocks: { children: { list: async (a: any) => ({ object: 'list', results: bodies[a.block_id] ?? [], has_more: false, next_cursor: null }) } },
  };
}
const download = async (_u: string, destBase: string) => {
  await sharp({ create: { width: 10, height: 10, channels: 3, background: '#0f0' } }).png().toFile(destBase + '.png');
  return destBase + '.png';
};
const mk = (pages: any[], bodies: Record<string, any[]>) =>
  ({ client: fakeClient(pages, bodies), databaseId: 'db', contentDir, publicDir, download });

const s1 = () => page(fullJson, 's1', 'first-post', 'First: a "quoted" title');
const s2 = () => page(creditJson, 's2', 'photo-post', 'Photo post');

test('writes one markdown file per published post with frontmatter', async () => {
  const body = 'word '.repeat(250);
  const res = await syncNotion(mk([s1(), s2()], {
    s1: [para(body), { object: 'block', id: 'im', type: 'image', has_children: false,
      image: { type: 'external', external: { url: 'https://h/pic.png?sig=1' }, caption: [] } }],
    s2: [para('Hello')],
  }));
  expect(res.count).toBe(2);
  const raw = await readFile(join(contentDir, 'first-post.md'), 'utf8');
  const fm = parse(raw.split('---')[1]!);
  expect(fm).toMatchObject({ title: 'First: a "quoted" title', slug: 'first-post', date: '2014-07-23',
    tags: ['nodejs', 'express'], readingMinutes: 2, cover: null, coverCredit: null });
  expect(fm.description).toMatch(/^word word/);
  expect(raw).toMatch(/!\[pic\.png\]\(\/images\/posts\/first-post\/[0-9a-f]{16}\.png\)/);
  const fm2 = parse((await readFile(join(contentDir, 'photo-post.md'), 'utf8')).split('---')[1]!);
  expect(fm2).toMatchObject({ description: 'A description', cover: '/og/covers/photo-post.jpg',
    coverCredit: { text: 'Photo by Jane Doe, CC BY 2.0', url: 'https://example.com/p' } });
  expect(existsSync(join(publicDir, 'og/covers/photo-post.jpg'))).toBe(true);
});

test('sync removes posts no longer published', async () => {
  await mkdir(contentDir, { recursive: true });
  await writeFile(join(contentDir, 'old-post.md'), '---\ntitle: x\n---');
  await mkdir(join(publicDir, 'images/posts/old-post'), { recursive: true });
  await mkdir(join(publicDir, 'og/covers'), { recursive: true });
  await writeFile(join(publicDir, 'og/covers/old-post.jpg'), 'x');
  await syncNotion(mk([s1()], { s1: [para('hi')] }));
  expect(existsSync(join(contentDir, 'old-post.md'))).toBe(false);
  expect(existsSync(join(publicDir, 'images/posts/old-post'))).toBe(false);
  expect(existsSync(join(publicDir, 'og/covers/old-post.jpg'))).toBe(false);
  expect(await readdir(contentDir)).toEqual(['first-post.md']);
});

test('stops on invalid slug before writing anything', async () => {
  await mkdir(contentDir, { recursive: true });
  await writeFile(join(contentDir, 'keep.md'), 'x');
  const bad = page(fullJson, 'bad', 'Bad Slug', 'Bad');
  await expect(syncNotion(mk([s1(), bad], {}))).rejects.toThrow(SyncError);
  expect(await readdir(contentDir)).toEqual(['keep.md']);
});
