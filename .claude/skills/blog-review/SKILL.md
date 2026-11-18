---
name: blog-review
description: Audit and edit a draft post on Andrew's astro-blog before it ships — static checks, build, a11y scan across all themes, visual check, and an editorial read. Use after /blog-post (or any new/changed post) when the user says "review the post", "audit the blog post", "does it look right", or before shipping.
---

# Reviewing a blog post

Works on a draft post in `/home/dgarman/projects/astro-blog`, from any project. Use absolute
paths and `git -C /home/dgarman/projects/astro-blog`. Always prefix node commands with
`PATH="/home/dgarman/.nvm/versions/node/v24.14.1/bin:$PATH"` (system node v20 fails).

Find the post: the user names it, otherwise the newest `post-NN-*` in `src/pages/posts`
on the current `post/*` branch (`git -C … status`, `git -C … log main..HEAD --stat`).
Review is **read-mostly**: fix mechanical problems yourself, but only _suggest_
editorial changes. Never rewrite the author's voice unasked.

## 1. Static checks

```bash
cd /home/dgarman/projects/astro-blog
node scripts/check-post.mjs src/pages/posts/post-NN-….md
```

Checks frontmatter shape, tag format (warns on brand-new tags — confirm they're intended
and not a near-duplicate of an existing one), image files exist / alt / `compressed/postN/`
location / WebP, **declared vs real image size, a hero taller than 4:3, and inline images
narrower than 735px (they display soft)**, one H1 and no skipped heading levels, link text,
**links to private GitHub repos (a 404 for readers; needs `gh`)**, code fences without a
language, leftover TODOs, and a NOTE when the post is in no series. **Fix every ERROR.**
Resolve WARNs or justify them in the report; confirm NOTEs with the author.

## 2. Build and a11y (top priority on this site)

```bash
npm run build
POST=/posts/post-NN-slug npm run test:a11y
POST=/posts/post-NN-slug npm run test:layout   # also asserts no sideways scroll at 375/600px
```

`test:layout` with `POST` runs `tests/layout/new-post.spec.ts`: it fails if the page, an image,
a table or an unscrollable code block runs past the right edge at phone widths. That replaces
eyeballing overflow in step 3; a failure is a real bug (often a table cell holding a long
unbreakable string, or a wide image). Fix it in the site CSS and don't weaken the test.

**Check what owns the port first.** `playwright.config.ts` uses `reuseExistingServer`, so if
another project's dev server is on 4321 the tests silently run against the wrong site (symptom:
every test times out on `customElements.get('theme-switcher')`). Verify with
`readlink /proc/$(ss -ltnp | grep -oP ':4321 .*pid=\K\d+')/cwd` — it must be this repo. Astro 7
dev/preview servers detach and keep running, so `astro dev status` shows this repo's, and a
second `npm run dev` here just refuses. If 4321 isn't ours, use this repo's own server instead: `astro dev status` shows its port
(often 4322). Otherwise `npm run build`, start `npm run preview -- --port 4399`. Run Playwright
with a temporary `playwright.tmp.config.ts` whose `baseURL` is that port and which has no
`webServer` block, then delete the config (and `astro preview stop` if you started one). Never
stop a server you didn't start.

`POST` adds the new post to the axe scan, which runs every theme (paper, lamplight, horde,
wayfinder). Any violation is a blocker — most often color contrast in a new component or
code-block theme. Fix it in the post/component; don't weaken the test. If the post uses a
new component or markup pattern, also consider adding it to `tests/a11y/pages.spec.ts`.
Also run `npm run test:layout` if the post adds tables, wide code, or custom components.

## 3. Visual check

Start `npm run dev` in the background, then use the Playwright MCP tools
(`browser_navigate`, `browser_resize`, `browser_take_screenshot`) on
`http://localhost:<port>/posts/post-NN-slug` (use the port you verified above, not
necessarily 4321; call `browser_resize` right before the screenshots, since a new page can
reset the viewport; save screenshots under the repo's `.playwright-mcp/`, the only place the
MCP browser may write):

- widths 375, 768, 1280 (and 1400+ for the three-panel layout)
- at least `paper` and one dark theme (set `localStorage['ag-theme']` then reload)
- hero image renders with right crop; body images don't overflow; code blocks scroll
  rather than overflow the page (horizontal scroll is already asserted by `test:layout`)
- open the hero in the lightbox and check it shows the whole image and returns focus
- the post appears on `/`, `/blog`, and each `/tags/<tag>` page with a sensible card
- keyboard: Tab through the page once; focus indicators visible, order logical

Stop the dev server when done. Look at the screenshots yourself and describe real problems.

## 4. Editorial read

Read the whole post as a reader would, and report short, specific notes:

- **Title/description:** does the description work as a standalone social snippet?
- **Opening:** does it lead with the interesting problem/surprise, or preamble?
- **Accuracy:** flag any numbers, versions, commands, or claims that look invented or
  can't be traced to the brain dump / source project. Verify against the source project
  when it's available (run the command, check the repo).
- **Alt text:** does it describe what's _in_ the image, including readable text?
- **Voice:** first person, concrete, includes what went wrong; flag marketing tone,
  filler intros/outros, and sections that could be cut.
- **Links:** repos/tools mentioned are linked; links resolve.
- **Structure:** sections scannable; code samples minimal and actually correct.

## 5. Report

Output a compact checklist: ✅ passed, 🔧 fixed (what), ⚠️ needs the author (editorial
suggestions, quoted lines). Commit mechanical fixes on the post branch with a clear
message. **Do not push, open a PR, or merge** — Netlify build minutes are limited; the
user decides when to ship. Remind them of unshipped post branches if more than one exists.
