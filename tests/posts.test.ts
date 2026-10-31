import { expect, test } from 'vitest';
import { formatDate, getAdjacent, postUrl, sortPosts, type Post } from '../src/lib/posts.ts';

function p(slug: string, date: string): Post {
  return { id: slug, collection: 'posts', data: { slug, date: new Date(date) } } as unknown as Post;
}

test('getAdjacent picks neighbours by date', () => {
  const posts = [p('c', '2020-08-28'), p('b', '2020-05-16'), p('a', '2014-06-16')];
  expect(getAdjacent(posts, 'b')).toEqual({ newer: posts[0], older: posts[2] });
  expect(getAdjacent(posts, 'a').older).toBeNull();
  expect(getAdjacent(posts, 'c').newer).toBeNull();
});

test('getAdjacent returns nulls for an unknown slug', () =>
  expect(getAdjacent([p('a', '2020-01-01')], 'zzz')).toEqual({ newer: null, older: null }));

test('formatDate is UTC YYYY-MM-DD', () => expect(formatDate(new Date('2014-07-23T02:07:52-05:00'))).toBe('2014-07-23'));

test('postUrl builds /blogs/<slug>/', () =>
  expect(postUrl('2014-07-23-getting-started-on-nodejs')).toBe('/blogs/2014-07-23-getting-started-on-nodejs/'));

test('sortPosts orders newest first and breaks ties by slug', () => {
  const sorted = sortPosts([p('a', '2014-06-16'), p('d', '2020-05-16'), p('c', '2020-08-28'), p('b', '2020-05-16')]);
  expect(sorted.map((x) => x.id)).toEqual(['c', 'b', 'd', 'a']);
});
