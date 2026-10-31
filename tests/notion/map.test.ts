import { expect, test } from 'vitest';
import type { PageObjectResponse } from '@notionhq/client';
import { isPublished, pageToPostMeta, queryPublishedPages, validatePosts } from '../../scripts/notion/map.ts';
import { SyncError, type PostMeta } from '../../scripts/notion/types.ts';
import fullJson from '../fixtures/notion/page-full.json' with { type: 'json' };
import creditJson from '../fixtures/notion/page-credit.json' with { type: 'json' };

// Fixtures are trimmed PageObjectResponse samples, so cast through any.
const clone = (j: unknown) => structuredClone(j) as any;
const fullPage = clone(fullJson) as PageObjectResponse;
const withCredit = clone(creditJson) as PageObjectResponse;

function withSlug(s: string): PageObjectResponse {
  const p = clone(fullJson);
  p.properties.Slug.rich_text[0].plain_text = s;
  return p;
}
function withoutDate(): PageObjectResponse {
  const p = clone(fullJson);
  p.properties['Published Date'].date = null;
  return p;
}
function withoutTitle(): PageObjectResponse {
  const p = clone(fullJson);
  p.properties.Title.title = [];
  return p;
}
function withStatus(id: string, status: string): PageObjectResponse {
  const p = clone(fullJson);
  p.id = id;
  p.properties.Status.select.name = status;
  return p;
}
const meta = (o: Partial<PostMeta>): PostMeta => ({
  notionId: 'x', title: 'T', slug: 'ok', date: '2020-01-01', tags: [],
  description: null, coverUrl: null, coverCredit: null, ...o,
});

test('maps a full page', () => {
  expect(pageToPostMeta(fullPage)).toEqual({ notionId: 'p1', title: 'Getting Started on NodeJS',
    slug: '2014-07-23-getting-started-on-nodejs', date: '2014-07-23', tags: ['nodejs', 'express'],
    description: null, coverUrl: null, coverCredit: null });
});
test('maps description and cover url', () => {
  const m = pageToPostMeta(withCredit);
  expect(m.description).toBe('A description');
  expect(m.coverUrl).toBe('https://example.com/c.jpg');
});
test('trims slug whitespace', () => expect(pageToPostMeta(withSlug(' a-b ')).slug).toBe('a-b'));
test('rejects published page without date or title', () => {
  expect(() => pageToPostMeta(withoutDate())).toThrow(SyncError);
  expect(() => pageToPostMeta(withoutTitle())).toThrow(/p1/);
});
test('isPublished checks Status', () => {
  expect(isPublished(withStatus('a', 'Published'))).toBe(true);
  expect(isPublished(withStatus('a', 'Draft'))).toBe(false);
});
test('validates slug format', () => {
  for (const s of ['My Post', 'a/b', 'UPPER', '-x', 'x--y', ''])
    expect(() => validatePosts([meta({ slug: s })])).toThrow(SyncError);
  expect(() => validatePosts([meta({ slug: '2014-07-23-a-b' })])).not.toThrow();
});
test('rejects duplicate slugs naming both', () =>
  expect(() => validatePosts([meta({ slug: 'a', title: 'One' }), meta({ slug: 'a', title: 'Two' })])).toThrow(/One.*Two|Two.*One/));
test('reads cover credit text and link', () =>
  expect(pageToPostMeta(withCredit).coverCredit).toEqual({ text: 'Photo by Jane Doe, CC BY 2.0', url: 'https://example.com/p' }));

test('query filters Published and follows pagination', async () => {
  const calls: any[] = [];
  const fake: any = {
    databases: { retrieve: async (a: any) => { calls.push(['db', a]); return { data_sources: [{ id: 'ds1', name: 'x' }] }; } },
    dataSources: {
      query: async (a: any) => {
        calls.push(['q', a]);
        fake.lastFilter = a.filter;
        return a.start_cursor
          ? { object: 'list', results: [withStatus('p3', 'Published')], has_more: false, next_cursor: null }
          : { object: 'list', results: [withStatus('p1', 'Published'), withStatus('p2', 'Draft')], has_more: true, next_cursor: 'c1' };
      },
    },
  };
  const pages = await queryPublishedPages(fake, 'db');
  expect(fake.lastFilter).toEqual({ property: 'Status', select: { equals: 'Published' } });
  expect(calls[0]).toEqual(['db', { database_id: 'db' }]);
  expect(calls[1][1].data_source_id).toBe('ds1');
  expect(pages.map((p) => p.id)).toEqual(['p1', 'p3']);
});
