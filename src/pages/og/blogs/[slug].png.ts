import type { APIRoute, GetStaticPaths } from 'astro';
import { renderOgImage } from '../../../lib/og.ts';
import { formatDate, getPosts, type Post } from '../../../lib/posts.ts';

export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts.filter((post) => !post.data.cover).map((post) => ({ params: { slug: post.data.slug }, props: { post } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { title, date, tags } = (props.post as Post).data;
  return new Response(await renderOgImage({ title, subtitle: formatDate(date), tags }), {
    headers: { 'Content-Type': 'image/png' },
  });
};
