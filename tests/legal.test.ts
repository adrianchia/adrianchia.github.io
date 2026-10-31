import { readFile } from 'node:fs/promises';
import { parse } from 'node-html-parser';
import { expect, test } from 'vitest';
import { LEGACY_SLUGS, legacyRedirects } from '../src/lib/legacy.ts';

const read = (path: string) => readFile(path, 'utf8');

function extractBody(html: string): string {
  const body = parse(html).querySelector('[data-custom-class="body"]');
  if (!body) throw new Error('no [data-custom-class="body"] element');
  return body.outerHTML;
}

function legalText(html: string): string {
  const root = parse(html);
  for (const el of root.querySelectorAll('style, script')) el.remove();
  return root.textContent.replace(/\s+/g, ' ').trim();
}

test('privacy policy text is unchanged from the live site', async () => {
  for (const name of ['flashylight-privacy-policy', 'tea-o-meter-privacy-policy']) {
    const oldBody = extractBody(await read(`tests/fixtures/legacy/${name}.html`));
    const text = legalText(await read(`src/legal/${name}.html`));
    expect(text.length).toBeGreaterThan(1000);
    expect(text).toBe(legalText(oldBody));
  }
});

test('legacy redirects map root slugs to /blogs/ slugs', () => {
  const redirects = legacyRedirects();
  expect(Object.keys(redirects)).toHaveLength(LEGACY_SLUGS.length);
  expect(redirects['/2014-06-16-welcome-to-my-blog/']).toBe('/blogs/2014-06-16-welcome-to-my-blog/');
});
