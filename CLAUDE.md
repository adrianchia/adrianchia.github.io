# CLAUDE.md

Personal blog (www.adrianchia.com). Astro static site whose posts live in Notion.

## Stack and commands

Astro 7, Node 26 (`.nvmrc`), pnpm (version in `packageManager`). TypeScript scripts run with plain `node` (type stripping): erasable syntax only, `.ts` extensions in relative imports.

- `pnpm dev`: Astro dev server.
- `pnpm sync`: pull Published posts from Notion into `src/content/posts/` and `public/` (reads `.env`).
- `pnpm build`: `sync` then `astro build`.
- `pnpm build:site`: `astro build` only, using whatever content is already on disk.
- `pnpm build:fixtures`: replace content with `tests/fixtures`, build, and verify. No Notion access needed.
- `pnpm test`: vitest. `pnpm verify`: checks `dist/` (`scripts/verify-dist.ts`). `pnpm check`: `astro check`.

Markdown is processed by `unified()` (see `astro.config.ts`), because Astro 7's default processor, Sätteri, ignores remark/rehype plugins. Expressive Code, remark-math and rehype-katex depend on it. Do not switch it.

## Content flow from Notion

Database `Blog Posts` with properties:

| Property | Type |
| --- | --- |
| Title | title |
| Slug | rich text |
| Status | select (Draft / Published) |
| Published Date | date |
| Tags | multi-select |
| Description | rich text |
| Cover Credit | rich text |

The page cover is the post's share image.

Only `Status = Published` pages are synced. Drafts never reach the repo or the site. Each sync wipes and rewrites `src/content/posts/`, `public/images/posts/` and `public/og/covers/`, so unpublishing a post removes it on the next build. A Published page with a missing title, date or slug, or a slug not matching `^[a-z0-9]+(?:-[a-z0-9]+)*$`, fails the build with an error naming the page.

Images are downloaded at sync time and served from the site. Notion signed URLs must never be committed or emitted into `dist/` (`pnpm verify` rejects `prod-files-secure`, `secure.notion-static.com`, `X-Amz-Signature`, `amazonaws.com`).

## URL rules (do not change)

- Posts: `/blogs/<slug>/`. Tags: `/tags/<kebab-case tag>/`. Every URL ends with a trailing slash.
- Legacy root-level post URLs redirect to `/blogs/<slug>/` (`src/lib/legacy.ts`).
- The privacy pages (`/flashylight-privacy-policy/`, `/tea-o-meter-privacy-policy/`) must not be edited, and their URLs must not change.
- `dist/` must contain `CNAME` (`www.adrianchia.com`), `.nojekyll`, `.well-known/brave-rewards-verification.txt` and `sw.js`.

## Deploy

GitHub Actions, "Deploy to GitHub Pages" (`.github/workflows/deploy.yml`), run manually (Actions, Run workflow). It builds from the `source` branch and publishes `dist/` to `master`, which GitHub Pages serves under the custom domain. Never publish by hand.

## Secrets

`NOTION_TOKEN` and `NOTION_DATABASE_ID`: local `.env` (git-ignored; template in `.env.example`) and GitHub Actions secrets. Never commit or print them.

## MCP

`.mcp.json` registers the `astro-docs` MCP server. Check Astro APIs against it rather than memory, since Astro 7 differs from older versions.

## Analytics

`GA_MEASUREMENT_ID` in `src/config.ts`; empty means no analytics script is emitted.
