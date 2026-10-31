import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** Newest first; posts on the same date are ordered by slug. */
export function sortPosts(posts: Post[]): Post[] {
  return [...posts].sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime() || a.data.slug.localeCompare(b.data.slug),
  );
}

export async function getPosts(): Promise<Post[]> {
  return sortPosts(await getCollection('posts'));
}

/** `posts` must be sorted newest first, as returned by getPosts. */
export function getAdjacent(posts: Post[], slug: string): { newer: Post | null; older: Post | null } {
  const i = posts.findIndex((post) => post.data.slug === slug);
  if (i === -1) return { newer: null, older: null };
  return { newer: posts[i - 1] ?? null, older: posts[i + 1] ?? null };
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function postUrl(slug: string): string {
  return `/blogs/${slug}/`;
}
