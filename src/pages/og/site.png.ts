import type { APIRoute } from 'astro';
import { SITE_TITLE, TAGLINE } from '../../config.ts';
import { renderOgImage } from '../../lib/og.ts';

export const GET: APIRoute = async () =>
  new Response(await renderOgImage({ title: SITE_TITLE, subtitle: TAGLINE }), {
    headers: { 'Content-Type': 'image/png' },
  });
