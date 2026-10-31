import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

const WIDTH = 1200;
const HEIGHT = 630;
const COLORS = { bg: '#0b0f17', text: '#e2e8f0', muted: '#94a3b8', accent: '#60a5fa' };

export interface OgInput {
  title: string;
  subtitle?: string;
  tags?: string[];
}

type Font = { name: string; data: Buffer; weight: 400 | 700; style: 'normal' };
let fonts: Promise<Font[]> | undefined;

// satori reads TTF/OTF/WOFF but not WOFF2, hence the non-variable @fontsource packages.
function loadFonts(): Promise<Font[]> {
  const file = (pkg: string, name: string) =>
    readFile(join(process.cwd(), 'node_modules/@fontsource', pkg, 'files', name));
  fonts ??= Promise.all([
    file('inter', 'inter-latin-700-normal.woff'),
    file('jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff'),
  ]).then(([inter, mono]) => [
    { name: 'Inter', data: inter, weight: 700, style: 'normal' },
    { name: 'JetBrains Mono', data: mono, weight: 400, style: 'normal' },
  ]);
  return fonts;
}

const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
  type,
  props: { style, children },
});

export async function renderOgImage({ title, subtitle, tags = [] }: OgInput): Promise<Uint8Array<ArrayBuffer>> {
  const titleSize = title.length > 90 ? 48 : title.length > 50 ? 60 : 72;
  const mono = { fontFamily: 'JetBrains Mono', fontSize: 28, color: COLORS.muted };
  const meta = [
    subtitle && el('div', { ...mono, display: 'flex' }, subtitle),
    tags.length > 0 &&
      el(
        'div',
        { ...mono, display: 'flex', color: COLORS.accent },
        tags
          .slice(0, 4)
          .map((t) => `#${t}`)
          .join('  '),
      ),
  ].filter(Boolean);

  const tree = el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: WIDTH,
      height: HEIGHT,
      boxSizing: 'border-box',
      padding: 72,
      backgroundColor: COLORS.bg,
      color: COLORS.text,
    },
    [
      el('div', { display: 'flex', width: 96, height: 8, backgroundColor: COLORS.accent }),
      el('div', { display: 'flex', flexDirection: 'column', gap: 24 }, [
        el(
          'div',
          {
            display: 'flex',
            fontFamily: 'Inter',
            fontWeight: 700,
            fontSize: titleSize,
            lineHeight: 1.15,
            maxHeight: titleSize * 1.15 * 4,
            overflow: 'hidden',
          },
          title,
        ),
        ...meta,
      ]),
      el('div', { ...mono, display: 'flex', color: COLORS.text }, 'adrianchia.com'),
    ],
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: await loadFonts(),
  });
  return new Uint8Array(new Resvg(svg).render().asPng());
}
