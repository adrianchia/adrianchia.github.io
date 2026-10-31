# Blog migration: Gatsby → Astro, content from Notion

Date: 2026-10-30
Repo: `adrianchia/adrianchia.github.io` (working branch `source`, deploy branch `master`)
Site: https://www.adrianchia.com

## Intent

Adrian's personal blog is a Gatsby 3 site (2021-era dependencies, needs
`--openssl-legacy-provider` to build) with ~10 Markdown posts in the repo.
Adrian wants to:

1. Rebuild it on Astro, on current tooling (Node.js 26 LTS, pnpm).
2. Write and manage posts in a Notion database instead of Markdown files,
   so all content lives in one place.
3. Keep hosting on GitHub Pages at `www.adrianchia.com`, deployed the same
   way as today (built output pushed to the `master` branch).
4. Refresh the look into a more professional software-engineer blog.

Publishing model: a post goes live only when its Notion **Status** is
"Published" **and** Adrian manually triggers a deploy. Everything else is a
draft and must not appear anywhere on the site.

## Goals

- Astro site, Node 26, pnpm, building cleanly with no legacy flags.
- All posts (the 10 existing ones plus future ones) sourced from a single
  Notion database at build time.
- Only `Status = Published` posts are built. Drafts produce no page, tag
  entry, RSS item, or sitemap URL.
- Existing URLs keep working (see "URLs" below).
- New design: "Option B, professional" (see "Design").
- Deploy is manual: a "Run workflow" button (`workflow_dispatch`) in GitHub
  Actions. **No scheduled/daily build** (Adrian explicitly declined it).
- `rss.xml` and the sitemap are regenerated on every deploy from the
  currently published posts.
- A `CLAUDE.md` onboarding the repo (how to run, how Notion content flows
  in, how to deploy, what must not break).

## Non-goals

- No comments system (Disqus removed; no replacement).
- No scheduled builds, no Notion webhook / auto-deploy.
- No offline/service-worker caching.
- No CMS other than Notion; About and privacy pages are not moved to Notion.
- No change of host or domain.

## Anti-goals (would be a failure even if it "works")

- A draft post visible anywhere on the live site (page, listing, tag page,
  RSS, sitemap).
- Broken existing links: old post URLs, `/tags/...`, `/about`, and
  especially the two app privacy-policy URLs (app stores link to them).
- Broken images a day after deploy (Notion file URLs expire ~1 hour after
  being fetched).
- The custom domain dropping off after deploy (missing `CNAME`).
- The old workflow deploying a half-migrated site mid-migration.
- The Notion token committed to the repo.

## Constraints

- Node.js 26 (LTS), pnpm. Pin both (e.g. `engines`, `packageManager`,
  `.nvmrc` / `.node-version`) and use them in CI.
- GitHub Pages serving from the `master` branch, as today (the current
  workflow uses `peaceiris/actions-gh-pages` to publish `./public` to
  `master`). Keep that model; the publish dir becomes Astro's `dist/`.
- `CNAME` (`www.adrianchia.com`) and
  `.well-known/brave-rewards-verification.txt` must be in the deployed output
  (put them in Astro's `public/`).
- Notion credentials only via a GitHub Actions secret (and a local `.env`
  that is git-ignored).

## Migration safety: disable deploys first

**First step of the migration, before any other change:** disable the
existing deploy workflow `.github/workflows/node.js.yml` (it currently
builds and deploys on every push/PR to `source`). Disable it in GitHub
(`gh workflow disable "Node.js CI"`), and/or remove its push/PR triggers,
so no push during the migration publishes anything. It stays disabled
until the new site is verified locally and Adrian approves going live.
The new workflow replaces it and is `workflow_dispatch` only.

## Content: the Notion database

Claude creates the database in Adrian's Notion using the Notion connector,
at the workspace root (top level, not under another page). If the connector
can only create it as a private top-level page, that's fine.

Properties (Claude's call on exact names unless Adrian changes them):

| Property       | Type         | Purpose |
|----------------|--------------|---------|
| Title          | title        | Post title |
| Slug           | rich text    | URL segment under `/blogs/`. Required for Published posts. |
| Status         | select       | `Draft`, `Published` (others allowed; anything ≠ Published is treated as draft) |
| Published Date | date         | Sort order and displayed date |
| Tags           | multi-select | Tag pages and tag labels |
| Description    | rich text    | Listing blurb, meta description, RSS description. Optional; fall back to an excerpt of the body. |
| Cover Credit   | rich text    | Optional attribution for the page cover (e.g. "Photo by Jane Doe, CC BY 2.0", with link). Shown under the post title. |

The Notion page **cover** is used as the post's share image (see
"Integrations").

Build behaviour:
- Query only `Status = Published`. Fail the build (clear error) if a
  Published post has no Slug or a duplicate Slug.
- Convert Notion blocks to HTML at build time. Must handle at least:
  headings, paragraphs, bold/italic/code/links, bulleted and numbered lists,
  code blocks (with language), images, quotes, callouts, dividers,
  equations (inline and block, rendered with KaTeX). Library choice is the
  builder's.
- **Images:** download every Notion-hosted image during the build and serve
  it from the site (e.g. via Astro's image pipeline). Never emit a Notion
  signed URL in the output.

### Moving the existing 10 posts into Notion

Claude imports each Markdown post in `src/posts/` into the database:
- Title, tags, and date from frontmatter; Status = Published.
- **Slug = the post's current file/folder name** (e.g.
  `2014-09-19-openshift-cas-quickstart-released`), because current URLs are
  derived from it, not from the title or date. Note
  `2020-08-16-a-gentle-introduction-to-mulesoft-anypoint-platform` has a
  frontmatter date of 2020-05-16; keep the slug as-is and use the
  frontmatter date as Published Date.
- Body content converted to Notion blocks; images in post folders uploaded
  into the Notion page.
- Claude's call: fix obviously broken Markdown while importing (e.g.
  `###What is NodeJS?` with no space should become a heading). Don't
  otherwise edit wording. Old links to `blog.adrianchia.com` stay as written.
- After import and verification, delete `src/posts/` from the repo.

Adrian must create a Notion internal integration (or Claude walks them
through it), share the database with it, and store the token as a GitHub
secret (e.g. `NOTION_TOKEN`) plus the database ID (`NOTION_DATABASE_ID`,
secret or variable).

## URLs (must be preserved)

| Path | Source |
|------|--------|
| `/` | Homepage |
| `/blogs/<slug>/` | Each post (current format: `blogs/` + file/folder name) |
| `/tags/` | All tags |
| `/tags/<kebab-case-tag>/` | Posts for a tag (current code uses lodash `kebabCase`) |
| `/about/` | About page |
| `/flashylight-privacy-policy/` | App privacy policy, content unchanged |
| `/tea-o-meter-privacy-policy/` | App privacy policy, content unchanged |
| `/404.html` | Not-found page |
| `/rss.xml` | RSS feed |
| sitemap | Regenerated each build (Astro sitemap integration; index location is the builder's call) |
| `/robots.txt` | Points at the sitemap |

**Legacy root-level post URLs (decided by Adrian: redirect).** The old
Gatsby site also served each of the 10 legacy posts at the site root,
`/<slug>/` (via `gatsby-plugin-page-creator` on `src/posts`; visible as
top-level folders on `origin/master`). For each of those 10 slugs only,
generate a redirect stub at `/<slug>/` (meta refresh + `rel="canonical"`
to `/blogs/<slug>/`; Astro `redirects` config is fine). Keep them out of
the sitemap and RSS. New Notion posts get only `/blogs/<slug>/`. The 10
legacy slugs are a fixed list in code, not derived from Notion.

Gatsby served pages with trailing slashes; keep that (`trailingSlash` /
directory build format) so existing links resolve identically.

## Pages kept in code

- **About:** port the current text (Software Engineer at JPMorgan Chase &
  Co., interests list) into the new design.
- **Privacy policies:** port both pages from `src/pages/*-privacy-policy.js`
  (+ their CSS) with identical wording at identical URLs. They can keep
  their own simple styling.
- **404.**

## Design: "Option B, professional"

Approved from mockups (`.superpowers/brainstorm/*/content/design-b-pro.html`).

- Clean sans-serif body text (e.g. Inter or system UI); monospace (e.g.
  JetBrains Mono or system mono) for dates, reading time, and tags.
- One blue accent, slate grays, generous whitespace, ~768px reading column.
- Light/dark toggle (respect system preference by default, remember the
  choice).
- **Header:** name "Adrian Chia" on the left; Posts, Tags, About, GitHub,
  LinkedIn, RSS, theme toggle on the right. **No Twitter/X link.**
- **Homepage:** a one-line intro/tagline about Adrian as a software engineer
  (placeholder text is fine; Adrian will edit), then a "Latest posts" list:
  date (`YYYY-MM-DD`) · reading time, title, description, `#tags`.
- **Post page:** date · reading time · tags, title, body; editor-style code
  blocks (filename/language bar, Copy button, syntax highlighting); inline
  code styled; author line at the end (avatar + "Adrian Chia · Software
  engineer in Texas"); previous/next post links.
- **Tag pages** and an "All posts" view in the same style.
- Avatar: a static image file in the repo (Gravatar dropped). Claude's call:
  fetch the current Gravatar for `achia@adrianchia.com` once and commit it.

## Integrations

- **GA4** via gtag, measurement ID in one config value (Adrian will supply
  the `G-…` ID). If unset, omit the script.
- **RSS** at `/rss.xml`: published posts only, with title, date, link,
  description.
- **Sitemap** and **robots.txt**, regenerated each build.
- Meta tags: title, description, canonical URL on `https://www.adrianchia.com`.
- **Social sharing (Open Graph + Twitter/X cards)** on every page:
  `og:title`, `og:description`, `og:url`, `og:site_name`, `og:image`
  (absolute URL, 1200×630), `og:type` (`article` on posts, with
  `article:published_time` and `article:tag`; `website` elsewhere);
  `twitter:card=summary_large_image`, `twitter:creator=@adrianchia`,
  `twitter:title`, `twitter:description`, `twitter:image`.
- **Share image per post**, in this order:
  1. The Notion page's **cover image**, if set. Downloaded at build time like
     other images, sized for 1200×630. If the post's **Cover Credit**
     property is filled (for Creative Commons / Unsplash photos), show it as
     a small attribution line under the post title, with its link.
  2. Otherwise a **generated image** made at build time: post title, date,
     tags and "adrianchia.com" in the site's design (tool is the builder's
     call, e.g. Satori + resvg).
  Non-post pages use one generated site image (name + tagline).
  Images are never picked automatically from the web; Adrian chooses any
  Creative Commons cover themselves and fills in the credit.
- **Service worker cleanup (Claude's call):** the live site has a Gatsby
  offline service worker (`sw.js`) installed for returning visitors. Ship a
  self-unregistering `sw.js` at the same path so those visitors stop getting
  the cached Gatsby shell.
- Removed: Disqus, UA analytics, Gravatar plugin, offline plugin, nprogress
  bar, Theme UI/Emotion, Font Awesome JS bundle (use inline SVG icons).

## Deploy workflow (new)

- New workflow, trigger `workflow_dispatch` only.
- Steps: checkout `source` → set up pnpm + Node 26 → `pnpm install
  --frozen-lockfile` → `pnpm build` with `NOTION_TOKEN` /
  `NOTION_DATABASE_ID` from secrets → publish `dist/` to `master` (same
  mechanism as today; updating the action version is fine).
- The old `node.js.yml` is deleted once the new one is in place.
- Going live (first real run of the new workflow) happens only after Adrian
  reviews the site locally and says go.

## Repo housekeeping

- Remove Gatsby files, `yarn.lock`, old components/templates.
- Add `pnpm-lock.yaml`, `.env.example` (no secrets), `.gitignore` entries
  for `.env`, `dist/`, `.astro/`, `.superpowers/`.
- Replace the Gatsby-starter README with a short project README.
- Add the Astro docs MCP server to a project-level `.mcp.json`
  (`astro-docs`, type `http` / streamable HTTP, URL
  `https://mcp.docs.astro.build/mcp`) and use it to check current Astro APIs
  during the build-out instead of relying on memory.
- Add `CLAUDE.md`: stack, commands, Notion schema and publish rule, image
  handling, URL rules that must not change, deploy steps, secrets.

## Decided by Adrian

- Astro, Node 26, pnpm, GitHub Pages on `master` as today.
- Notion database is the single source of posts; Status "Published" = live.
- Move the 10 existing posts into Notion.
- Manual deploy trigger only; no daily build.
- Disable current deploy workflow during migration.
- Design option B, made more professional (approved mockup).
- Remove Disqus; use GA4.
- Add CLAUDE.md; regenerate RSS and sitemap on each deploy.
- Claude creates the Notion database at the workspace root.
- Astro docs MCP (`https://mcp.docs.astro.build/mcp`, streamable HTTP) added
  for use during the build.
- The 10 legacy root-level post URLs (`/<slug>/`) redirect to
  `/blogs/<slug>/`.

## Claude's calls (Adrian can override)

- Notion property names/types above.
- Images downloaded at build time and served locally.
- About and privacy pages stay in code, not Notion.
- No Twitter/X link in header.
- Gravatar replaced by a committed avatar image.
- Self-unregistering `sw.js` to clear the old Gatsby offline cache.
- Offline caching and loading bar dropped.
- Minor Markdown fixes during import; old `blog.adrianchia.com` links left
  untouched.

## Left to the builder

- Astro version (latest stable), Notion client and block-to-HTML approach,
  syntax highlighter (Shiki is fine), CSS approach, reading-time method,
  font loading, exact component structure, tests/verification approach.
