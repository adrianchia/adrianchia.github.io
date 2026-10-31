# adrianchia.com

Personal blog at [www.adrianchia.com](https://www.adrianchia.com). Posts are written in Notion and built into a static site with [Astro](https://astro.build).

## Local setup

Requires Node 26 (see `.nvmrc`) and pnpm (version pinned in `package.json`).

```sh
pnpm install
cp .env.example .env   # fill in NOTION_TOKEN and NOTION_DATABASE_ID
pnpm build             # syncs published posts from Notion, then builds dist/
pnpm dev               # dev server (run `pnpm sync` first to pull posts)
```

To build from the bundled test fixtures without Notion access, run `pnpm build:fixtures`.

## Publishing

1. In Notion, set the post's `Status` to `Published`. Title, Slug and Published Date are required; the build stops with an error naming the page if any is missing.
2. On GitHub, open Actions, choose "Deploy to GitHub Pages", and click "Run workflow".

The workflow tests, builds, verifies and pushes `dist/` to the `master` branch, which GitHub Pages serves.
