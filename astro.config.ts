import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import expressiveCode from 'astro-expressive-code';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { SITE_URL } from './src/config.ts';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Code frames come from expressiveCode (options in ec.config.mjs).
  integrations: [expressiveCode()],
  // Expressive Code and the math plugins are remark/rehype plugins, so use the unified processor
  // (Astro 7's default Markdown processor, Sätteri, does not run them).
  markdown: {
    processor: unified({ remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] }),
  },
});
