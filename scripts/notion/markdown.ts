import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

type AnyBlock = Record<string, any>;

const plain = (rt: Array<{ plain_text: string }> | undefined): string =>
  (rt ?? []).map((t) => t.plain_text).join('');

type MediaType = 'video' | 'file' | 'pdf' | 'embed' | 'bookmark';

/** Media becomes a plain link. Notion-hosted files have signed, expiring URLs, so they are dropped. */
function linkBlock(type: MediaType, pageId: string) {
  return (block: AnyBlock): string => {
    const content = block[type] ?? {};
    const caption = plain(content.caption).trim();
    let url: string | undefined;
    if (type === 'embed' || type === 'bookmark') url = content.url;
    else if (content.type === 'external') url = content.external?.url;
    if (!url) {
      console.warn(`Skipping Notion-hosted ${type} block ${block.id} on page ${pageId} (its URL is signed and expires)`);
      return caption;
    }
    return `[${caption || url}](${url})`;
  };
}

function dropBlock(type: string, pageId: string) {
  return (): string => {
    console.warn(`Skipping unsupported Notion block type "${type}" on page ${pageId}`);
    return '';
  };
}

const UNSUPPORTED = [
  'table_of_contents',
  'breadcrumb',
  'audio',
  'child_database',
  'child_page',
  'link_to_page',
  'template',
  'unsupported',
];

export async function pageToMarkdown(client: Client, pageId: string): Promise<string> {
  const n2m = new NotionToMarkdown({ notionClient: client, config: { parseChildPages: false } });

  n2m.setCustomTransformer('code', (block: AnyBlock) => {
    const { rich_text, caption, language } = block.code;
    const lang = !language || language === 'plain text' ? 'text' : String(language).toLowerCase();
    const cap = plain(caption).trim().replace(/"/g, "'");
    const info = cap ? `${lang} title="${cap}"` : lang;
    return '```' + info + '\n' + plain(rich_text).replace(/\n+$/, '') + '\n```';
  });
  n2m.setCustomTransformer('equation', (block: AnyBlock) => `$$\n${block.equation.expression}\n$$`);
  n2m.setCustomTransformer('callout', async (block: AnyBlock) => {
    const icon = block.callout.icon;
    const emoji = icon?.type === 'emoji' ? `${icon.emoji} ` : '';
    // Render the text like a paragraph so links, bold, code and equations survive.
    const text = await n2m.blockToMarkdown({
      object: 'block', id: block.id, type: 'paragraph', paragraph: { rich_text: block.callout.rich_text },
    } as any);
    let inner = `${emoji}${text}`;
    if (block.has_children) {
      // A custom transformer bypasses notion-to-md's child fetch, so render children here.
      const kids = n2m.toMarkdownString(await n2m.pageToMarkdown(block.id)).parent?.trim();
      if (kids) inner += `\n\n${kids}`;
    }
    return inner.split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n');
  });
  for (const type of ['video', 'file', 'pdf', 'embed', 'bookmark'] as const) {
    n2m.setCustomTransformer(type, linkBlock(type, pageId));
  }
  n2m.setCustomTransformer('link_preview', (block: AnyBlock) => {
    const url = block.link_preview?.url;
    return url ? `[${url}](${url})` : '';
  });
  for (const type of UNSUPPORTED) n2m.setCustomTransformer(type, dropBlock(type, pageId));

  const blocks = await n2m.pageToMarkdown(pageId);
  const out = n2m.toMarkdownString(blocks);
  return (out.parent ?? '').trim() + '\n';
}

export function excerpt(markdown: string, max = 160): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/^\s{0,3}(#{1,6}\s+|>\s?|[-*+]\s+(\[[ x]\]\s+)?|\d+\.\s+)/gm, '')
    .replace(/[*_~`$]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  let cut = text.slice(0, max);
  if (!/\s/.test(text[max]!)) cut = cut.replace(/\s*\S*$/, '');
  return cut.trimEnd() + '…';
}

export function readingMinutes(markdown: string): number {
  const words = markdown.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
