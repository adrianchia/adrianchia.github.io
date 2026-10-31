# Astro + Notion Blog Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Gatsby 3 blog with an Astro site whose posts come from a Notion database, deployed to GitHub Pages (`master`) by a manual workflow.

**Architecture:** A Node script (`scripts/sync-notion.ts`) queries Notion for `Status = Published` pages, converts each to a Markdown file in `src/content/posts/` (git-ignored) and downloads every image into `public/images/posts/`. Astro then builds a fully static site from that content collection, using its own Markdown pipeline (Expressive Code, KaTeX). `scripts/verify-dist.ts` checks the built `dist/` before anything is published. Development and CI tests use committed fixture posts, so they need no Notion access.

**Tech Stack:** Astro 7 (latest stable: 7.4.x at time of writing), Node.js 26, pnpm 12, TypeScript, `@notionhq/client` 5, `notion-to-md` 3, `astro-expressive-code`, `remark-math` + `rehype-katex`, `@astrojs/rss`, `satori` + `@resvg/resvg-js`, `sharp`, `lodash-es`, Vitest, GitHub Actions + `peaceiris/actions-gh-pages`.

**Spec:** `docs/superpowers/specs/2026-10-30-astro-notion-migration-design.md`. Read it before starting any task.

## Global Constraints

- Node.js 26: `.nvmrc` contains `26`; `package.json` `"engines": { "node": ">=26" }`.
- pnpm: `package.json` `"packageManager": "pnpm@<exact version from pnpm --version>"` (12.16.1 locally).
- Run TypeScript scripts with plain `node` (Node 26 strips types). Use only erasable TS syntax (no `enum`, no parameter properties). Use `.ts` extensions in relative imports.
- Site URL `https://www.adrianchia.com`. Every page URL ends with a trailing slash (`trailingSlash: 'always'`, `build.format: 'directory'`).
- Post URL: `/blogs/<slug>/`. Tag URL: `/tags/<lodash kebabCase(tag)>/`.
- Only `Status = Published` Notion pages are ever written to `src/content/posts/`.
- No Notion signed URLs in `dist/`. These patterns must never appear: `prod-files-secure`, `secure.notion-static.com`, `X-Amz-Signature`, `amazonaws.com`.
- `dist/` must contain `CNAME` (exactly `www.adrianchia.com`), `.nojekyll`, `.well-known/brave-rewards-verification.txt`, and `sw.js`.
- Secrets live only in env vars `NOTION_TOKEN` and `NOTION_DATABASE_ID` (local `.env`, git-ignored, and GitHub secrets). Never commit them, and never echo them into the transcript.
- **Do not push to `origin/source` before Task 1 is done.** Do not publish to `master` before Adrian says "go" in Task 11.
- Check Astro APIs against the `astro-docs` MCP server (added in Task 2) rather than memory. Astro 7 may differ from what you remember.
- Header has no Twitter/X link, but `twitter:creator` is `@adrianchia`.
- Copy that the spec fixes: site title `Adrian Chia`; description `A place for me to capture ideas and share knowledge`; author line `Adrian Chia · Software engineer in Texas`; RSS title `Adrian Chia's blog's RSS Feed`.

## Review Focus

1. **A Published page with an empty Published Date or empty Title.** The build should stop with an error naming the page, the same as a missing slug. Silently sorting it last or rendering "undefined" is wrong. Test: Task 3 `rejects published page without date or title`.
2. **A slug typed sloppily in Notion** (`My Post`, ` my-post `, `a/b`, uppercase). Whitespace is trimmed. Anything that doesn't match `^[a-z0-9]+(?:-[a-z0-9]+)*$` stops the build with an error naming the post. A URL must never be invented. Test: Task 3 `validates slug format`.
3. **Notion blocks the converter doesn't handle** (toggle, table, embed, bookmark, video, synced block). The sync must not crash or leak a Notion URL. Unsupported media becomes a plain link or is dropped with a console warning. Test: Task 4 `unknown blocks do not throw or leak notion urls`.
4. **Tag names with capitals, spaces or punctuation** (`Android Studio`, `Node.js`, `C#`), including two names that map to one URL (`Node.js` and `node js` both become `node-js`). These share one tag page listing both posts and must never produce two pages fighting over one path. Test: Task 7 `groupByTag merges tags with the same slug`.
5. **Unpublishing a post.** When a post flips back to Draft, the next build removes its page, its images, its tag entries, its RSS item and its sitemap URL. Stale files from the previous sync must not survive. Test: Task 4 `sync removes posts no longer published`.

---

### Task 1: Freeze the current deploy workflow

**Files:**
- Modify: `.github/workflows/node.js.yml` (the `on:` block)

- [ ] **Step 1: Disable the workflow in GitHub**

Run: `gh workflow disable "Node.js CI" && gh workflow list --all`
Expected: `Node.js CI` is listed as `disabled_manually`.

- [ ] **Step 2: Change the triggers to manual-only, as a second safeguard**

Replace the `push`/`pull_request` triggers with `on: workflow_dispatch:` only. Leave the rest of the file untouched; Task 11 deletes it.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/node.js.yml
git commit -m "ci: stop auto-deploy during Astro migration"
```

---

### Task 2: Astro scaffold, static files, and dist verifier

Remove Gatsby and stand up an empty Astro site that already produces every required static file, with a verifier that proves it.

**Files:**
- Delete: `gatsby-*.js`, `yarn.lock`, `.prettierignore`, `src/components/`, `src/templates/`, `src/pages/*`, `src/gatsby-plugin-theme-ui/`, `src/images/gatsby-*.png`, `static/`
- Move: `src/posts/` → `legacy/posts/` (needed for the Notion import in Task 10, deleted there)
- Create: `package.json` (rewrite), `.nvmrc`, `astro.config.ts`, `tsconfig.json`, `vitest.config.ts`, `.mcp.json`, `.env.example`, `src/config.ts`, `src/pages/index.astro` (placeholder `<h1>Adrian Chia</h1>`)
- Create: `public/CNAME`, `public/.nojekyll`, `public/.well-known/brave-rewards-verification.txt` (copy of `static/.well-known/…`), `public/robots.txt`, `public/sw.js`, `public/favicon.png` (from `src/images/icon.png`)
- Create: `scripts/verify-dist.ts`, `tests/verify-dist.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces `src/config.ts`:
  ```ts
  export const SITE_URL = 'https://www.adrianchia.com';
  export const SITE_TITLE = 'Adrian Chia';
  export const SITE_DESCRIPTION = 'A place for me to capture ideas and share knowledge';
  export const TAGLINE = 'Software engineer writing about cloud, integration, and building things.'; // placeholder, Adrian edits
  export const GA_MEASUREMENT_ID = ''; // Adrian supplies G-…; empty = no analytics script
  export const SOCIAL = { github: 'adrianchia', linkedin: 'adrianchia1', twitter: 'adrianchia' } as const;
  ```
- Produces `verifyDist(distDir: string): Promise<string[]>` in `scripts/verify-dist.ts`. It returns a list of human-readable problems, empty when everything is OK. Run as a CLI (`node scripts/verify-dist.ts [dist]`), it prints the problems and exits 1 if there are any. Later tasks add checks to this function.
- Produces package scripts: `dev` (`astro dev`), `build:site` (`astro build`), `verify` (`node scripts/verify-dist.ts`), `test` (`vitest run`), `check` (`astro check`). Task 4 adds `sync` and `build`. Task 5 adds `build:fixtures`.

- [ ] **Step 1: Write the failing verifier tests**

`tests/verify-dist.test.ts` builds temp dirs:
```ts
test('reports missing required files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dist-'));
  const problems = await verifyDist(dir);
  for (const f of ['CNAME', '.nojekyll', '.well-known/brave-rewards-verification.txt', 'sw.js', 'robots.txt', '404.html'])
    expect(problems.join('\n')).toContain(f);
});
test('rejects wrong CNAME', async () => { /* CNAME = "adrianchia.github.io" */ expect(problems).toContainEqual(expect.stringContaining('CNAME')); });
test('flags Notion signed URLs in any html/xml file', async () => {
  // write about/index.html containing 'https://prod-files-secure.s3.us-west-2.amazonaws.com/x.png?X-Amz-Signature=abc'
  expect(problems).toContainEqual(expect.stringMatching(/Notion URL.*about\/index\.html/));
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm vitest run tests/verify-dist.test.ts`
Expected: FAIL (`verifyDist` doesn't exist yet). The first time, run `pnpm install` after writing `package.json`.

- [ ] **Step 3: Write the scaffold**

- `astro.config.ts`: `site: SITE_URL`, `trailingSlash: 'always'`, `build: { format: 'directory' }`, `output: 'static'`.
- `public/robots.txt`: `User-agent: *`, `Allow: /`, `Sitemap: https://www.adrianchia.com/sitemap.xml`.
- `public/sw.js`: on `install`, call `self.skipWaiting()`. On `activate`, delete every key from `caches.keys()`, then `self.registration.unregister()`, then reload all window clients with `client.navigate(client.url)`.
- `.mcp.json`: `{ "mcpServers": { "astro-docs": { "type": "http", "url": "https://mcp.docs.astro.build/mcp" } } }`.
- `.gitignore`: add `.env`, `dist/`, `.astro/`, `.superpowers/`, `src/content/posts/`, `public/images/posts/`, `public/og/covers/`. Remove the Gatsby `public` and `.cache` entries.
- `.env.example`: `NOTION_TOKEN=` and `NOTION_DATABASE_ID=`.
- Dev dependencies: `vitest`, `typescript`, `@astrojs/check`.

- [ ] **Step 4: Implement `verifyDist`**

It checks that the required files exist, that `CNAME` trimmed equals `www.adrianchia.com`, and that `robots.txt` contains the sitemap line. It also scans every `.html`/`.xml` file for the signed-URL patterns from Global Constraints.

- [ ] **Step 5: Run the tests and a real build**

Run: `pnpm test && pnpm build:site && pnpm verify`
Expected: tests pass. `verify` reports only `404.html` missing (Task 8 adds it). Add a temporary `src/pages/404.astro` if you want a clean run; Task 8 replaces it.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "build: replace Gatsby with Astro scaffold and dist verifier"
```

---

### Task 3: Notion query and page → post metadata

**Files:**
- Create: `scripts/notion/types.ts`, `scripts/notion/map.ts`
- Test: `tests/notion/map.test.ts`, `tests/fixtures/notion/page-*.json` (trimmed `PageObjectResponse` samples)

**Interfaces:**
- Produces `scripts/notion/types.ts`:
  ```ts
  export interface CoverCredit { text: string; url: string | null }
  export interface PostMeta {
    notionId: string; title: string; slug: string;
    date: string;            // YYYY-MM-DD, from "Published Date" start
    tags: string[];          // multi-select names, as typed
    description: string | null;
    coverUrl: string | null; // page.cover (file or external)
    coverCredit: CoverCredit | null; // "Cover Credit" plain text + first link href
  }
  export class SyncError extends Error {}
  ```
- Produces in `map.ts`:
  - `PROPS = { title: 'Title', slug: 'Slug', status: 'Status', date: 'Published Date', tags: 'Tags', description: 'Description', coverCredit: 'Cover Credit' } as const`
  - `isPublished(page: PageObjectResponse): boolean`: true when Status select name === `'Published'`.
  - `pageToPostMeta(page: PageObjectResponse): PostMeta`: throws `SyncError` naming the page title/id if the title, slug or date is missing.
  - `validatePosts(posts: PostMeta[]): void`: throws `SyncError` listing every bad or duplicate slug.
  - `queryPublishedPages(client: Client, databaseId: string): Promise<PageObjectResponse[]>`: resolves the database's data source (Notion API 2025-09+: `databases.retrieve` → `data_sources[0].id`, then `dataSources.query`), filters `Status select equals "Published"`, follows every page of results (`collectPaginatedAPI` or a `has_more` loop), and filters again with `isPublished` in code. Check the current SDK surface before writing.

- [ ] **Step 1: Write the failing tests**

```ts
test('maps a full page', () => {
  expect(pageToPostMeta(fullPage)).toEqual({ notionId: 'p1', title: 'Getting Started on NodeJS',
    slug: '2014-07-23-getting-started-on-nodejs', date: '2014-07-23', tags: ['nodejs', 'express'],
    description: null, coverUrl: null, coverCredit: null });
});
test('trims slug whitespace', () => expect(pageToPostMeta(withSlug(' a-b ')).slug).toBe('a-b'));
test('rejects published page without date or title', () => {
  expect(() => pageToPostMeta(withoutDate)).toThrow(SyncError);
  expect(() => pageToPostMeta(withoutTitle)).toThrow(/p1/);
});
test('validates slug format', () => {
  for (const s of ['My Post', 'a/b', 'UPPER', '-x', 'x--y', ''])
    expect(() => validatePosts([meta({ slug: s })])).toThrow(SyncError);
});
test('rejects duplicate slugs naming both', () =>
  expect(() => validatePosts([meta({ slug: 'a', title: 'One' }), meta({ slug: 'a', title: 'Two' })])).toThrow(/One.*Two|Two.*One/));
test('reads cover credit text and link', () =>
  expect(pageToPostMeta(withCredit).coverCredit).toEqual({ text: 'Photo by Jane Doe, CC BY 2.0', url: 'https://example.com/p' }));
test('query filters Published and follows pagination', async () => {
  // fake client: dataSources.query returns 2 pages of results (has_more/next_cursor), one result is Status Draft
  const pages = await queryPublishedPages(fake, 'db');
  expect(fake.lastFilter).toEqual({ property: 'Status', select: { equals: 'Published' } });
  expect(pages.map(p => p.id)).toEqual(['p1', 'p2', 'p3']); // the Draft one dropped
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm vitest run tests/notion/map.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `types.ts` and `map.ts` to the interfaces above**

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm vitest run tests/notion/map.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/notion tests/notion tests/fixtures/notion && git commit -m "feat(sync): query published Notion pages and map metadata"
```

---

### Task 4: Page body → Markdown, image localization, and the sync command

**Files:**
- Create: `scripts/notion/markdown.ts`, `scripts/notion/images.ts`, `scripts/sync-notion.ts`
- Test: `tests/notion/markdown.test.ts`, `tests/notion/images.test.ts`, `tests/sync.test.ts`
- Modify: `package.json` (scripts `sync`, `build`)

**Interfaces:**
- Consumes: Task 3 `PostMeta`, `SyncError`, `queryPublishedPages`, `pageToPostMeta`, `validatePosts`.
- Produces in `markdown.ts`:
  - `pageToMarkdown(client: Client, pageId: string): Promise<string>`: uses `notion-to-md` with custom transformers:
    - code: `` ```<lang> title="<caption>" `` when the block has a caption, otherwise `` ```<lang> ``. Notion's `plain text` language maps to `text`.
    - equation: block `$$\n…\n$$`, inline `$…$`
    - callout: blockquote prefixed with its emoji
    - video/embed/bookmark/file/pdf: `[caption or url](url)` link
    - any other unsupported type: `''` plus `console.warn` with the type and page id
  - `excerpt(markdown: string, max = 160): string`: plain text, no Markdown syntax, cut on a word boundary, ending in `…` when cut.
  - `readingMinutes(markdown: string): number`: `Math.max(1, Math.ceil(words / 200))`, with code blocks excluded from the word count.
- Produces in `images.ts`:
  - `type Downloader = (url: string, destBase: string) => Promise<string>`: downloads to `destBase + ext` and returns the written path. The extension comes from the URL pathname, or else from the response `content-type`. Throws on non-2xx.
  - `fetchDownloader: Downloader`: the real one, using `fetch`.
  - `imageBaseName(url: string): string`: the first 16 hex characters of the sha256 of `origin + pathname` (the query string is ignored, so re-signed Notion URLs reuse the same name).
  - `localizeImages(markdown: string, slug: string, publicDir: string, download: Downloader): Promise<string>`: rewrites every `![alt](url)` with an http(s) URL to `/images/posts/<slug>/<name><ext>`, writing the file under `<publicDir>/images/posts/<slug>/`.
  - `writeCover(url: string, slug: string, publicDir: string, download: Downloader): Promise<string>`: downloads, then uses `sharp` to `resize(1200, 630, { fit: 'cover' }).jpeg()` into `<publicDir>/og/covers/<slug>.jpg`. Returns `/og/covers/<slug>.jpg`.
- Produces in `sync-notion.ts`:
  - `syncNotion(opts: { client: Client; databaseId: string; contentDir: string; publicDir: string; download: Downloader }): Promise<{ count: number }>`. It first empties `contentDir`, `<publicDir>/images/posts` and `<publicDir>/og/covers`, then writes `<contentDir>/<slug>.md` with this frontmatter: `title, slug, date, tags, description` (Notion Description, else `excerpt(body)`), `readingMinutes, cover` (path or `null`), `coverCredit`.
  - The CLI, when run directly, reads `NOTION_TOKEN` and `NOTION_DATABASE_ID`. It exits 1 with `Missing NOTION_TOKEN / NOTION_DATABASE_ID (see .env.example)` if either is absent, and on `SyncError` prints the message and exits 1. Defaults: `contentDir = src/content/posts`, `publicDir = public`.
- Package scripts: `sync` = `node --env-file-if-exists=.env scripts/sync-notion.ts`; `build` = `pnpm sync && astro build`.

- [ ] **Step 1: Write the failing tests**

```ts
// markdown.test.ts: fake client returning fixture blocks
test('code block with caption gets a title', async () =>
  expect(await pageToMarkdown(fake(codeWithCaption), 'p')).toContain('```javascript title="server.js"'));
test('equations become KaTeX delimiters', async () => {
  const md = await pageToMarkdown(fake(equations), 'p');
  expect(md).toContain('$$\nE = mc^2\n$$'); expect(md).toContain('$a^2$');
});
test('unknown blocks do not throw or leak notion urls', async () => {
  const md = await pageToMarkdown(fake([tableBlock, toggleBlock, videoNotionFileBlock, syncedBlock]), 'p');
  expect(md).not.toMatch(/prod-files-secure|secure\.notion-static\.com|X-Amz/);
});
test('excerpt strips markdown and cuts at a word', () =>
  expect(excerpt('## Hi\n\nThis is **bold** text', 12)).toBe('Hi This is…'));
test('readingMinutes ignores code and floors at 1', () => {
  expect(readingMinutes('word '.repeat(450))).toBe(3);
  expect(readingMinutes('```\n' + 'x '.repeat(5000) + '\n```')).toBe(1);
});
// images.test.ts: fake downloader records calls and writes nothing
test('rewrites images to local paths keyed by url without query', async () => {
  const out = await localizeImages('![a](https://prod-files-secure.s3.us-west-2.amazonaws.com/x/img.png?X-Amz-Signature=1)', 's', tmp, fakeDl);
  expect(out).toMatch(/^!\[a\]\(\/images\/posts\/s\/[0-9a-f]{16}\.png\)$/);
  expect(imageBaseName('https://h/x/img.png?a=1')).toBe(imageBaseName('https://h/x/img.png?a=2'));
});
test('download failure propagates', async () =>
  await expect(localizeImages('![a](https://h/x.png)', 's', tmp, failingDl)).rejects.toThrow());
// sync.test.ts: fake client with two published pages, temp dirs
test('writes one markdown file per published post with frontmatter', async () => { /* parse frontmatter of s1.md, assert fields incl. readingMinutes and description fallback */ });
test('sync removes posts no longer published', async () => {
  await writeFile(join(contentDir, 'old-post.md'), '---\ntitle: x\n---');
  await mkdir(join(publicDir, 'images/posts/old-post'), { recursive: true });
  await syncNotion(opts);
  expect(existsSync(join(contentDir, 'old-post.md'))).toBe(false);
  expect(existsSync(join(publicDir, 'images/posts/old-post'))).toBe(false);
});
test('stops on invalid slug before writing anything', async () => { /* contentDir stays empty, rejects SyncError */ });
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm vitest run tests/notion tests/sync.test.ts`
Expected: FAIL in the new files (Task 3 tests still pass).

- [ ] **Step 3: Implement `markdown.ts`, `images.ts`, `sync-notion.ts` to the interfaces above**

Validate all posts (`validatePosts`) before clearing or writing anything. Download cover images too, including `external` covers such as Unsplash.

- [ ] **Step 4: Run all the tests and confirm they pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(sync): render Notion pages to markdown with local images"
```

---

### Task 5: Content collection, base layout, design system, homepage

**Files:**
- Create: `src/content.config.ts`, `src/lib/posts.ts`, `src/layouts/BaseLayout.astro`, `src/components/Head.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/ThemeToggle.astro`, `src/components/Icon.astro` (inline SVGs: github, linkedin, rss, sun/moon), `src/components/PostListItem.astro`, `src/styles/global.css`, `src/assets/avatar.jpg`
- Replace: `src/pages/index.astro`
- Create: `tests/fixtures/posts/*.md` (4 posts), `tests/fixtures/images/<slug>/*.png`
- Test: `tests/posts.test.ts`
- Modify: `package.json` (`build:fixtures`), `scripts/verify-dist.ts`

**Interfaces:**
- Consumes: the frontmatter shape written in Task 4.
- Produces in `src/content.config.ts`: collection `posts`, using a `glob` loader on `src/content/posts/*.md`, with schema `{ title: string, slug: string, date: z.coerce.date(), tags: string[] (default []), description: string, readingMinutes: number, cover: string | null, coverCredit: { text: string, url: string | null } | null }`. The entry id must equal `slug`.
- Produces in `src/lib/posts.ts`:
  - `type Post = CollectionEntry<'posts'>`
  - `getPosts(): Promise<Post[]>`: newest first. Ties are broken by slug.
  - `getAdjacent(posts: Post[], slug: string): { newer: Post | null; older: Post | null }`
  - `formatDate(d: Date): string`: `YYYY-MM-DD` in UTC.
  - `postUrl(slug: string): string`: returns `/blogs/<slug>/`.
- Produces `BaseLayout.astro` props: `{ title?: string; description?: string; ogImage: string /* site-relative path */; article?: { publishedTime: Date; tags: string[] } }`. The `<title>` is `"<title> | Adrian Chia"`, or `Adrian Chia` on the homepage.
- Produces `Head.astro`: everything the spec lists under Integrations for meta tags and social sharing, with absolute `og:image`/`twitter:image` URLs built from `SITE_URL`. It also includes the canonical link and an RSS `<link rel="alternate">`. When `GA_MEASUREMENT_ID` is set, it adds the gtag snippet.
- Package script `build:fixtures` = `rm -rf src/content/posts public/images/posts && cp -R tests/fixtures/posts src/content/posts && mkdir -p public/images && cp -R tests/fixtures/images public/images/posts && astro build && node scripts/verify-dist.ts`.

The fixtures cover: a post with tags and a code block with a title, a post with KaTeX, a post with a local image, a cover and a cover credit, a post whose slug is a legacy slug (`2014-07-23-getting-started-on-nodejs`), and a post with no tags.

- [ ] **Step 1: Write the failing tests**

```ts
test('getAdjacent picks neighbours by date', () => {
  const posts = [p('c', '2020-08-28'), p('b', '2020-05-16'), p('a', '2014-06-16')];
  expect(getAdjacent(posts, 'b')).toEqual({ newer: posts[0], older: posts[2] });
  expect(getAdjacent(posts, 'a').older).toBeNull();
});
test('formatDate is UTC YYYY-MM-DD', () => expect(formatDate(new Date('2014-07-23T02:07:52-05:00'))).toBe('2014-07-23'));
```

Add to `verifyDist`: `index.html` exists and contains `og:image` with an absolute `https://www.adrianchia.com/` URL.

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm vitest run tests/posts.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Match the approved mockup `.superpowers/brainstorm/*/content/design-b-pro.html` and the spec's Design section. Things it pins down:
- CSS custom properties on `:root` and `[data-theme="dark"]`. Light: background `#ffffff`, text `#0f172a`, muted `#475569`, subtle `#64748b`, border `#e2e8f0`, accent `#2563eb`. Dark: background `#0b0f17`, text `#e2e8f0`, muted `#94a3b8`, border `#1e293b`, accent `#60a5fa`. Reading column `max-width: 768px`.
- Fonts: self-hosted `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono`. Use mono for dates, reading time and tags.
- Theme: an inline script in `<head>`, run before paint, sets `data-theme` from `localStorage.theme`, falling back to `prefers-color-scheme`. The toggle flips it and stores the choice. Wrap storage access in try/catch.
- Header: `Adrian Chia` (links to `/`), then Posts (`/blogs/`), Tags (`/tags/`), About (`/about/`), GitHub, LinkedIn, RSS (`/rss.xml`), theme toggle. No Twitter.
- Homepage: `TAGLINE` as the h1, `SITE_DESCRIPTION` under it, a "Latest posts" label, the 10 newest posts rendered with `PostListItem` (date · `N min read`, title, description, `#tag` links), then "All posts →" linking to `/blogs/`.
- Avatar: download `https://www.gravatar.com/avatar/<md5 of achia@adrianchia.com>?s=256` once and commit it as `src/assets/avatar.jpg`.
- The homepage `ogImage` is `/og/site.png` (Task 9 creates it, and the verifier enforces it then).

- [ ] **Step 4: Verify**

Run: `pnpm test && pnpm build:fixtures`
Expected: tests pass. The build succeeds, and `verify` reports only the files later tasks add (404, og). Run `pnpm preview` and compare against the mockup in light and dark.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(site): base layout, design system and homepage"
```

---

### Task 6: Post page

**Files:**
- Create: `src/pages/blogs/[slug].astro`, `src/components/AuthorCard.astro`, `src/components/PostMeta.astro`, `ec.config.mjs`
- Modify: `astro.config.ts` (integrations/markdown), `scripts/verify-dist.ts`
- Test: `tests/verify-dist.test.ts` (new cases)

**Interfaces:**
- Consumes: `getPosts`, `getAdjacent`, `formatDate`, `postUrl` (Task 5); `BaseLayout` props.
- Produces: `/blogs/<slug>/index.html` for every post.

- [ ] **Step 1: Write the failing verifier tests**

Add `verifyDist` checks, with tests using temp dirs:
- every `blogs/*/index.html` has `og:type` `article` and `article:published_time`
- every `<img src>` in a post page starting with `/` exists in `dist`

```ts
test('flags post image missing from dist', async () => { /* blogs/x/index.html with <img src="/images/posts/x/a.png">, no file */ expect(problems).toContainEqual(expect.stringContaining('/images/posts/x/a.png')); });
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm vitest run tests/verify-dist.test.ts`
Expected: the new cases FAIL.

- [ ] **Step 3: Implement**

- `astro-expressive-code` with themes `github-light`/`github-dark`, switched by `[data-theme]` (`themeCssSelector`), using the frame title from `title="…"`. The copy button is built in. Use editor frames.
- `remark-math` + `rehype-katex`. Import `katex/dist/katex.min.css` on the post page only.
- Page order: PostMeta (`YYYY-MM-DD · N min read · #tags`), h1 title, then the cover credit line if `coverCredit` is set (small, muted; `text` linked to `url` when present), then the body, then AuthorCard (avatar via `astro:assets` `<Image>`, `Adrian Chia · Software engineer in Texas`), then previous/next links (`← older title`, `newer title →`).
- Inline `code`: mono font, subtle background, rounded corners.
- `ogImage`: `cover ?? '/og/blogs/<slug>.png'`. `article: { publishedTime: date, tags }`.

- [ ] **Step 4: Verify**

Run: `pnpm test && pnpm build:fixtures`
Expected: PASS. In `pnpm preview`, check the fixture code block (title bar, copy button, both themes), the KaTeX post, the image post and the cover credit.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(site): post page with code frames, math and author card"
```

---

### Task 7: Tags and all-posts listing

**Files:**
- Create: `src/lib/tags.ts`, `src/pages/tags/index.astro`, `src/pages/tags/[tag].astro`, `src/pages/blogs/index.astro`
- Test: `tests/tags.test.ts`

**Interfaces:**
- Consumes: `getPosts`, `PostListItem`.
- Produces in `src/lib/tags.ts`:
  - `tagSlug(tag: string): string`: lodash-es `kebabCase`.
  - `groupByTag(posts: Post[]): Array<{ slug: string; names: string[]; posts: Post[] }>`: sorted by slug, posts newest first. `names` holds the distinct original spellings.
- `PostListItem` tag links use `/tags/${tagSlug(tag)}/`.

- [ ] **Step 1: Write the failing tests**

```ts
test('tagSlug matches the old Gatsby URLs', () => {
  for (const t of ['android-studio', 'android', 'aws', 'etl', 'express', 'integration', 'java', 'jdk', 'mulesoft', 'nodejs', 'security', 'sso'])
    expect(tagSlug(t)).toBe(t);
  expect(tagSlug('Android Studio')).toBe('android-studio');
});
test('groupByTag merges tags with the same slug', () => {
  const g = groupByTag([p('a', ['Node.js'], '2020-01-02'), p('b', ['node js'], '2020-01-01')]);
  expect(g).toHaveLength(1);
  expect(g[0].slug).toBe('node-js');
  expect(g[0].posts.map(x => x.id)).toEqual(['a', 'b']);
});
test('ignores leading/trailing whitespace and empty tags', () =>
  expect(groupByTag([p('a', [' aws ', ''])]).map(g => g.slug)).toEqual(['aws']));
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm vitest run tests/tags.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

- `/tags/` lists every tag, showing `#name (count)`.
- `/tags/<slug>/` has the heading `#<first name>` followed by its posts.
- `/blogs/` lists all posts, grouped under year headings, newest first.

All three pages use `ogImage: '/og/site.png'`.

- [ ] **Step 4: Verify**

Run: `pnpm test && pnpm build:fixtures`
Expected: PASS. `dist/tags/<each fixture tag>/index.html` and `dist/blogs/index.html` exist.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(site): tag pages and all-posts listing"
```

---

### Task 8: About, 404, privacy policies, legacy redirects

**Files:**
- Create: `src/pages/about.astro`, `src/pages/404.astro`, `src/pages/flashylight-privacy-policy.astro`, `src/pages/tea-o-meter-privacy-policy.astro`, `src/legal/flashylight-privacy-policy.html`, `src/legal/tea-o-meter-privacy-policy.html`, `src/legal/flashylight-privacy-policy.css`, `src/legal/tea-o-meter-privacy-policy.css`, `src/lib/legacy.ts`
- Create: `tests/fixtures/legacy/flashylight-privacy-policy.html`, `tests/fixtures/legacy/tea-o-meter-privacy-policy.html` (the old deployed pages, from `git show origin/master:<name>/index.html`)
- Modify: `astro.config.ts` (`redirects`), `scripts/verify-dist.ts`
- Test: `tests/legal.test.ts`, `tests/verify-dist.test.ts`

**Interfaces:**
- Produces in `src/lib/legacy.ts`:
  ```ts
  export const LEGACY_SLUGS = [
    '2014-06-16-welcome-to-my-blog',
    '2014-07-03-getting-started-with-android-application-development',
    '2014-07-12-getting-started-with-android-android-development-android-studio-edition-pt-3',
    '2014-07-12-getting-started-with-android-development',
    '2014-07-23-getting-started-on-nodejs',
    '2014-08-22-java-related-changes-since-java-se-6',
    '2014-09-19-openshift-cas-quickstart-released',
    '2015-08-10-recap-on-the-how-to-build-a-startup-on-udacity',
    '2020-08-16-a-gentle-introduction-to-mulesoft-anypoint-platform',
    '2020-08-28-my-journey-towards-aws-certifications',
  ] as const;
  export function legacyRedirects(): Record<string, string>; // { '/<slug>/': '/blogs/<slug>/' }
  ```
- `legalText(html: string): string` (in `tests/legal.test.ts` or a small helper): visible text with whitespace collapsed.

- [ ] **Step 1: Write the failing tests**

```ts
test('privacy policy text is unchanged from the live site', async () => {
  for (const name of ['flashylight-privacy-policy', 'tea-o-meter-privacy-policy']) {
    const oldBody = extractBody(await read(`tests/fixtures/legacy/${name}.html`)); // the [data-custom-class="body"] element
    expect(legalText(await read(`src/legal/${name}.html`))).toBe(legalText(oldBody));
  }
});
```

Add to `verifyDist`:
- `about/index.html`, `404.html`, and both `<name>/index.html` privacy pages exist.
- For every `LEGACY_SLUGS` entry, `<slug>/index.html` contains `http-equiv="refresh"` and a canonical link to `https://www.adrianchia.com/blogs/<slug>/`.

```ts
test('flags legacy slug without redirect', async () => { expect(problems).toContainEqual(expect.stringContaining('2014-06-16-welcome-to-my-blog')); });
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm vitest run tests/legal.test.ts tests/verify-dist.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

- Privacy: copy the logo `<span>` and the `[data-custom-class="body"]` element out of the deployed HTML into `src/legal/*.html`. Render them with `<Fragment set:html={…}>` (import with `?raw`) inside `BaseLayout`, along with the matching CSS. Wording must stay unchanged.
- About: port the text of `git show 385c75e:src/pages/about.js` (pre-migration commit): heading "Hi there!", then the JPMorgan Chase paragraph (as a real `<a>` to `https://www.jpmorganchase.com/`), then the interests paragraph.
- 404: "Page not found" with a link home.
- `astro.config.ts`: `redirects: legacyRedirects()`. Confirm with the astro-docs MCP that static redirects emit meta refresh plus canonical. If they don't, generate the stubs in `src/pages/[legacy].astro` with `getStaticPaths` over `LEGACY_SLUGS`.

- [ ] **Step 4: Verify**

Run: `pnpm test && pnpm build:fixtures`
Expected: PASS, with `verify` reporting nothing except og images (Task 9).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(site): about, 404, privacy policies and legacy redirects"
```

---

### Task 9: RSS, sitemap, share images

**Files:**
- Create: `src/pages/rss.xml.ts`, `src/pages/sitemap.xml.ts`, `src/lib/og.ts`, `src/pages/og/site.png.ts`, `src/pages/og/blogs/[slug].png.ts`
- Modify: `scripts/verify-dist.ts`
- Test: `tests/og.test.ts`, `tests/verify-dist.test.ts`

**Interfaces:**
- Consumes: `getPosts`, `postUrl`, `formatDate`, `groupByTag`, `tagSlug`, `LEGACY_SLUGS`.
- Produces in `src/lib/og.ts`: `renderOgImage(input: { title: string; subtitle?: string; tags?: string[] }): Promise<Uint8Array>`. It returns a 1200×630 PNG via satori, then `@resvg/resvg-js`. The layout uses the dark palette from Task 5: title in Inter bold, `subtitle` (date for posts, tagline for site) and `#tags` in JetBrains Mono, and `adrianchia.com` bottom-left. Fonts must be loaded as TTF/WOFF files from the fontsource packages; satori can't read WOFF2.
- `/og/blogs/<slug>.png` is generated only for posts without a `cover`.
- `/sitemap.xml`: a flat `<urlset>` containing `/`, `/blogs/`, `/about/`, `/tags/`, every `/tags/<slug>/`, every `/blogs/<slug>/` (with `<lastmod>` = post date), and both privacy pages. It never includes legacy root slugs or `/404.html`.
- `/rss.xml`: `@astrojs/rss`, title `Adrian Chia's blog's RSS Feed`, description `SITE_DESCRIPTION`, one item per post (title, `pubDate`, link `/blogs/<slug>/`, description).

- [ ] **Step 1: Write the failing tests**

```ts
test('renders a 1200x630 png', async () => {
  const png = await renderOgImage({ title: 'Getting Started on NodeJS', subtitle: '2014-07-23', tags: ['nodejs'] });
  const meta = await sharp(png).metadata();
  expect([meta.format, meta.width, meta.height]).toEqual(['png', 1200, 630]);
});
```

Add to `verifyDist`:
- every page's `og:image` resolves to an existing file in `dist`
- `rss.xml` item count equals the number of `blogs/*/index.html` (excluding `blogs/index.html`)
- `sitemap.xml` lists every built `blogs/<slug>/` page and contains no `LEGACY_SLUGS` root URL

```ts
test('flags sitemap containing a legacy root url', async () => { /* sitemap with https://www.adrianchia.com/2014-06-16-welcome-to-my-blog/ */ });
test('flags rss/post count mismatch', async () => { /* 2 post dirs, 1 rss item */ });
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `pnpm vitest run tests/og.test.ts tests/verify-dist.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement to the interfaces above**

- [ ] **Step 4: Verify**

Run: `pnpm test && pnpm build:fixtures`
Expected: all tests pass and `verify` prints no problems. Open `dist/og/site.png` and one post image to check them by eye.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(site): rss, sitemap and generated share images"
```

---

### Task 10: Create the Notion database, import the 10 posts, first real sync

This task is run by the main session, which has the Notion connector (MCP tools `mcp__claude_ai_Notion__*`, loaded through ToolSearch). It isn't done by writing code.

**Files:**
- Delete: `legacy/posts/`
- Modify: `src/lib/legacy.ts` only if a slug was mistyped (it must match the folder names exactly)

- [ ] **Step 1: Create the database at the workspace root**

Use `notion-create-database` with no parent page, titled `Blog Posts`. Properties: Title (title), Slug (rich text), Status (select: `Draft`, `Published`), Published Date (date), Tags (multi-select), Description (rich text), Cover Credit (rich text). Confirm with `notion-fetch` and record the database URL.

- [ ] **Step 2: Import each post in `legacy/posts/`**

Each post becomes one page. Title, tags and date come from its frontmatter, Status is `Published`, and Slug is the file or folder name. The body is the Markdown content, with heading syntax fixed where `#` has no space after it (`###What` → `### What`) and no other wording changes. Code fences keep their language. Upload each image from the post folder with `notion-create-file-upload` / attachment tools, placed where the Markdown referenced it. Then `notion-fetch` each page and compare its headings, code blocks and images against the source file.

- [ ] **Step 3: Checkpoint for Adrian (integration and secrets)**

Ask Adrian to:
1. Create an internal integration at https://www.notion.so/profile/integrations with read content capability only.
2. In the `Blog Posts` database, go to ••• → Connections and add that integration.
3. Put `NOTION_TOKEN` and `NOTION_DATABASE_ID` in `.env` themselves. The database ID is the 32-hex part of the database URL.
4. Run `! gh secret set NOTION_TOKEN` and `! gh secret set NOTION_DATABASE_ID`, pasting the values at the prompt so they never appear in the transcript.

Wait for confirmation before going on.

- [ ] **Step 4: First real build**

Run: `pnpm build && pnpm verify`
Expected: sync reports 10 posts, `verify` prints no problems, and `ls dist/blogs` matches `LEGACY_SLUGS`. Run `pnpm preview` and spot-check every post against the live site (`https://www.adrianchia.com/blogs/<slug>/`) for missing images, code or headings.

- [ ] **Step 5: Draft check**

Create a Notion page with Status `Draft` and slug `draft-check`, then run `pnpm build`.
Expected: no `draft-check` anywhere in `dist` (`grep -r draft-check dist` prints nothing). Delete that page afterwards.

- [ ] **Step 6: Remove the legacy Markdown and commit**

```bash
git rm -r legacy/posts && git commit -m "content: posts now live in Notion"
```

---

### Task 11: Deploy workflow, docs, go live

**Files:**
- Create: `.github/workflows/deploy.yml`, `CLAUDE.md`
- Delete: `.github/workflows/node.js.yml`
- Replace: `README.md`
- Modify: `src/config.ts` (`GA_MEASUREMENT_ID`, once Adrian gives it)

**Interfaces:**
- `deploy.yml`:
  - `name: Deploy to GitHub Pages`, triggered by `on: workflow_dispatch` only, with `permissions: contents: write` and `concurrency: deploy`.
  - Steps: `actions/checkout` (ref `source`), `pnpm/action-setup` (version taken from `packageManager`), `actions/setup-node` (`node-version-file: .nvmrc`, `cache: pnpm`), `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build` (env `NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}`, `NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}`), `pnpm verify`, then `peaceiris/actions-gh-pages` (latest major) with `publish_dir: ./dist`, `publish_branch: master`, `github_token: ${{ secrets.GITHUB_TOKEN }}`.
  - Use the current major version of every action.

- [ ] **Step 1: Write `deploy.yml` and delete `node.js.yml`**

Lint it with `pnpm dlx @action-validator/cli .github/workflows/deploy.yml`, or with `actionlint` if it's installed.
Expected: no errors.

- [ ] **Step 2: Write `CLAUDE.md` and `README.md`**

`CLAUDE.md` sections:
- Stack and commands (`pnpm dev`, `sync`, `build`, `build:fixtures`, `test`, `verify`).
- How content flows from Notion: database `Blog Posts`, the property table, and "only Status = Published is synced; drafts never reach the repo or the site".
- Images are downloaded at sync time, and Notion URLs must never be committed or emitted.
- URL rules that must not change: `/blogs/<slug>/`, `/tags/<kebab>/`, the privacy pages, the legacy redirects, trailing slashes.
- Deploy: Actions → "Deploy to GitHub Pages" → Run workflow.
- Secrets.
- The `astro-docs` MCP.

`README.md`: a short project description, local setup (`.env` from `.env.example`), and how to publish.

- [ ] **Step 3: GA4 checkpoint**

Ask Adrian for the `G-…` measurement ID, set `GA_MEASUREMENT_ID`, run `pnpm build:fixtures`, and confirm the gtag script appears in `dist/index.html`. If Adrian has no ID yet, leave it empty and say so.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "ci: manual deploy workflow; docs: README and CLAUDE.md"
```

- [ ] **Step 5: Go-live checkpoint**

Show Adrian `pnpm preview` (built from real Notion content) and ask whether to go live. Only after an explicit "go":
- `git push origin source`
- `gh workflow run "Deploy to GitHub Pages" --ref source`, then `gh run watch`

Expected: the run succeeds.

- [ ] **Step 6: Check the live site**

`curl -sI` each of these and expect 200: `https://www.adrianchia.com/`, `/blogs/2014-06-16-welcome-to-my-blog/`, `/tags/android-studio/`, `/about/`, `/flashylight-privacy-policy/`, `/tea-o-meter-privacy-policy/`, `/rss.xml`, `/sitemap.xml`, `/sw.js`. Also confirm `/2014-06-16-welcome-to-my-blog/` returns the redirect stub, and that the repo's Pages settings still show the custom domain `www.adrianchia.com`.
