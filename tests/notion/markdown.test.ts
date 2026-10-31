import { expect, test, vi } from 'vitest';
import { excerpt, pageToMarkdown, readingMinutes } from '../../scripts/notion/markdown.ts';

const rt = (s: string) => ({
  type: 'text', text: { content: s, link: null }, plain_text: s, href: null,
  annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
});
const base = (type: string, body: object, extra: object = {}) =>
  ({ object: 'block', id: `${type}-id`, type, has_children: false, [type]: body, ...extra });

// Fake client: blocks.children.list returns blocks by parent id.
function fake(blocks: any[], children: Record<string, any[]> = {}): any {
  return {
    blocks: {
      children: {
        list: async (a: any) => ({
          object: 'list', results: a.block_id === 'p' ? blocks : (children[a.block_id] ?? []),
          has_more: false, next_cursor: null,
        }),
      },
    },
  };
}

const codeWithCaption = [base('code', { rich_text: [rt('const a = 1;')], caption: [rt('server.js')], language: 'javascript' })];
const plainCode = [base('code', { rich_text: [rt('hello')], caption: [], language: 'plain text' })];
const equations = [
  base('equation', { expression: 'E = mc^2' }),
  base('paragraph', { rich_text: [rt('inline '), { type: 'equation', equation: { expression: 'a^2' }, plain_text: 'a^2', href: null, annotations: {} }] }),
];
const signed = 'https://prod-files-secure.s3.us-west-2.amazonaws.com/x/v.mp4?X-Amz-Signature=abc';
const tableBlock = base('table', { table_width: 1, has_column_header: false, has_row_header: false }, { id: 'tbl', has_children: true });
const tableRows = [base('table_row', { cells: [[rt('cell')]] })];
const toggleBlock = base('toggle', { rich_text: [rt('More')] }, { id: 'tog', has_children: true });
const toggleKids = [base('paragraph', { rich_text: [rt('hidden text')] })];
const videoNotionFileBlock = base('video', { type: 'file', file: { url: signed, expiry_time: 'x' }, caption: [] });
const syncedBlock = base('synced_block', { synced_from: null }, { id: 'syn', has_children: true });
const syncedKids = [base('paragraph', { rich_text: [rt('synced text')] })];

test('code block with caption gets a title', async () =>
  expect(await pageToMarkdown(fake(codeWithCaption), 'p')).toContain('```javascript title="server.js"\nconst a = 1;\n```'));
test('plain text code maps to text without a title', async () =>
  expect(await pageToMarkdown(fake(plainCode), 'p')).toContain('```text\nhello\n```'));
test('equations become KaTeX delimiters', async () => {
  const md = await pageToMarkdown(fake(equations), 'p');
  expect(md).toContain('$$\nE = mc^2\n$$');
  expect(md).toContain('$a^2$');
});
test('callout becomes an emoji blockquote', async () => {
  const md = await pageToMarkdown(fake([base('callout', { rich_text: [rt('Careful')], icon: { type: 'emoji', emoji: '💡' }, color: 'default' })]), 'p');
  expect(md).toContain('> 💡 Careful');
});
test('external video and bookmark become links', async () => {
  const md = await pageToMarkdown(fake([
    base('video', { type: 'external', external: { url: 'https://youtu.be/x' }, caption: [rt('Demo')] }),
    base('bookmark', { url: 'https://example.com', caption: [] }),
  ]), 'p');
  expect(md).toContain('[Demo](https://youtu.be/x)');
  expect(md).toContain('[https://example.com](https://example.com)');
});
test('unknown blocks do not throw or leak notion urls', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const client = fake(
    [tableBlock, toggleBlock, videoNotionFileBlock, syncedBlock, base('table_of_contents', {})],
    { tbl: tableRows, tog: toggleKids, syn: syncedKids },
  );
  const md = await pageToMarkdown(client, 'p');
  expect(md).not.toMatch(/prod-files-secure|secure\.notion-static\.com|X-Amz|amazonaws/);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('table_of_contents'));
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('page p'));
  warn.mockRestore();
});

test('excerpt strips markdown and cuts at a word', () => {
  expect(excerpt('## Hi\n\nThis is **bold** text', 12)).toBe('Hi This is…');
  expect(excerpt('Short [link](http://x) `code`')).toBe('Short link code');
});
test('readingMinutes ignores code and floors at 1', () => {
  expect(readingMinutes('word '.repeat(450))).toBe(3);
  expect(readingMinutes('```\n' + 'x '.repeat(5000) + '\n```')).toBe(1);
});
