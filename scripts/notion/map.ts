import { collectPaginatedAPI } from '@notionhq/client';
import type { Client, PageObjectResponse } from '@notionhq/client';
import { SyncError } from './types.ts';
import type { PostMeta } from './types.ts';

export const PROPS = {
  title: 'Title',
  slug: 'Slug',
  status: 'Status',
  date: 'Published Date',
  tags: 'Tags',
  description: 'Description',
  coverCredit: 'Cover Credit',
} as const;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Prop = PageObjectResponse['properties'][string];
type RichText = Array<{ plain_text: string; href: string | null }>;

function prop(page: PageObjectResponse, name: string): Prop | undefined {
  return page.properties[name];
}

function richText(p: Prop | undefined): RichText {
  if (!p) return [];
  if (p.type === 'title') return p.title;
  if (p.type === 'rich_text') return p.rich_text;
  return [];
}

const plain = (rt: RichText) => rt.map((t) => t.plain_text).join('');

export function isPublished(page: PageObjectResponse): boolean {
  const p = prop(page, PROPS.status);
  return p?.type === 'select' && p.select?.name === 'Published';
}

function label(page: PageObjectResponse): string {
  const title = plain(richText(prop(page, PROPS.title))).trim();
  return title ? `"${title}" (${page.id})` : `(untitled, ${page.id})`;
}

export function pageToPostMeta(page: PageObjectResponse): PostMeta {
  const title = plain(richText(prop(page, PROPS.title))).trim();
  if (!title) throw new SyncError(`Notion page ${page.id} has no Title`);

  const slug = plain(richText(prop(page, PROPS.slug))).trim();
  if (!slug) throw new SyncError(`Post ${label(page)} has no Slug`);

  const dateProp = prop(page, PROPS.date);
  const start = dateProp?.type === 'date' ? dateProp.date?.start : undefined;
  if (!start) throw new SyncError(`Post ${label(page)} has no Published Date`);

  const tagsProp = prop(page, PROPS.tags);
  const tags = tagsProp?.type === 'multi_select' ? tagsProp.multi_select.map((t) => t.name) : [];

  const description = plain(richText(prop(page, PROPS.description))).trim() || null;

  let coverUrl: string | null = null;
  if (page.cover) {
    coverUrl = page.cover.type === 'external' ? page.cover.external.url : page.cover.file.url;
  }

  const credit = richText(prop(page, PROPS.coverCredit));
  const creditText = plain(credit).trim();
  const coverCredit = creditText
    ? { text: creditText, url: credit.find((t) => t.href)?.href ?? null }
    : null;

  return {
    notionId: page.id,
    title,
    slug,
    date: start.slice(0, 10),
    tags,
    description,
    coverUrl,
    coverCredit,
  };
}

export function validatePosts(posts: PostMeta[]): void {
  const problems: string[] = [];
  const seen = new Map<string, PostMeta>();
  for (const post of posts) {
    if (!SLUG_RE.test(post.slug)) {
      problems.push(`Invalid slug ${JSON.stringify(post.slug)} on "${post.title}" (${post.notionId})`);
    }
    const first = seen.get(post.slug);
    if (first) {
      problems.push(`Duplicate slug ${JSON.stringify(post.slug)} on "${first.title}" and "${post.title}"`);
    } else {
      seen.set(post.slug, post);
    }
  }
  if (problems.length) throw new SyncError(problems.join('\n'));
}

export async function queryPublishedPages(
  client: Client,
  databaseId: string,
): Promise<PageObjectResponse[]> {
  const db = await client.databases.retrieve({ database_id: databaseId });
  const dataSourceId = 'data_sources' in db ? db.data_sources[0]?.id : undefined;
  if (!dataSourceId) {
    throw new SyncError(`Notion database ${databaseId} has no data source (is the integration connected to it?)`);
  }
  const results = await collectPaginatedAPI(client.dataSources.query, {
    data_source_id: dataSourceId,
    filter: { property: PROPS.status, select: { equals: 'Published' } },
  });
  return results.filter((r): r is PageObjectResponse => r.object === 'page' && 'properties' in r).filter(isPublished);
}
