import { kebabCase } from 'lodash-es';
import { sortPosts, type Post } from './posts.ts';

export function tagSlug(tag: string): string {
  return kebabCase(tag);
}

export interface TagGroup {
  slug: string;
  names: string[];
  posts: Post[];
}

/** Groups posts by tag slug, so spellings like `Node.js` and `node js` share one group. Sorted by slug. */
export function groupByTag(posts: Post[]): TagGroup[] {
  const groups = new Map<string, TagGroup>();
  for (const post of posts) {
    for (const raw of post.data.tags) {
      const name = raw.trim();
      const slug = tagSlug(name);
      if (!slug) continue;
      let group = groups.get(slug);
      if (!group) groups.set(slug, (group = { slug, names: [], posts: [] }));
      if (!group.names.includes(name)) group.names.push(name);
      if (!group.posts.includes(post)) group.posts.push(post);
    }
  }
  return [...groups.values()]
    .map((g) => ({ ...g, posts: sortPosts(g.posts) }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}
