import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Files are written by scripts/sync-notion.ts (or copied from tests/fixtures/posts by build:fixtures).
const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/posts', generateId: ({ data }) => String(data.slug) }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    description: z.string(),
    readingMinutes: z.number(),
    cover: z.string().nullable(),
    coverCredit: z.object({ text: z.string(), url: z.string().nullable() }).nullable(),
  }),
});

export const collections = { posts };
