import { expect, test } from 'vitest';
import type { Post } from '../src/lib/posts.ts';
import { groupByTag, tagSlug } from '../src/lib/tags.ts';

function p(slug: string, tags: string[], date = '2020-01-01'): Post {
  return { id: slug, collection: 'posts', data: { slug, tags, date: new Date(date) } } as unknown as Post;
}

test('tagSlug matches the old Gatsby URLs', () => {
  for (const t of ['android-studio', 'android', 'aws', 'etl', 'express', 'integration', 'java', 'jdk', 'mulesoft', 'nodejs', 'security', 'sso'])
    expect(tagSlug(t)).toBe(t);
  expect(tagSlug('Android Studio')).toBe('android-studio');
});

test('groupByTag merges tags with the same slug', () => {
  const g = groupByTag([p('a', ['Node.js'], '2020-01-02'), p('b', ['node js'], '2020-01-01')]);
  expect(g).toHaveLength(1);
  expect(g[0].slug).toBe('node-js');
  expect(g[0].names).toEqual(['Node.js', 'node js']);
  expect(g[0].posts.map((x) => x.id)).toEqual(['a', 'b']);
});

test('ignores leading/trailing whitespace and empty tags', () =>
  expect(groupByTag([p('a', [' aws ', ''])]).map((g) => g.slug)).toEqual(['aws']));

test('sorts groups by slug and posts newest first', () => {
  const g = groupByTag([p('old', ['b', 'a'], '2019-01-01'), p('new', ['b'], '2021-01-01')]);
  expect(g.map((x) => x.slug)).toEqual(['a', 'b']);
  expect(g[1].posts.map((x) => x.id)).toEqual(['new', 'old']);
});
