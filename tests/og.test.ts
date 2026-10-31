import sharp from 'sharp';
import { expect, test } from 'vitest';
import { renderOgImage } from '../src/lib/og.ts';

test('renders a 1200x630 png', async () => {
  const png = await renderOgImage({ title: 'Getting Started on NodeJS', subtitle: '2014-07-23', tags: ['nodejs'] });
  const meta = await sharp(png).metadata();
  expect([meta.format, meta.width, meta.height]).toEqual(['png', 1200, 630]);
});

test('renders with only a title and with a very long title', async () => {
  for (const title of ['Hi', 'A very long post title '.repeat(12)]) {
    const meta = await sharp(await renderOgImage({ title })).metadata();
    expect([meta.width, meta.height]).toEqual([1200, 630]);
  }
});
