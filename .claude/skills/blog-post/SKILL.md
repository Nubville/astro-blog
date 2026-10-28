---
name: blog-post
description: Turn a brain dump into a draft post on Andrew's astro-blog (andrewgarman.com) from ANY project. Use when the user says "blog this", "write this up", "add a post", "brain dump", or wants to capture what they just built/learned/played as a blog post. Handles frontmatter, image processing, and committing in the blog repo.
---

# Contributing a blog post

The blog repo lives at `/home/dgarman/projects/astro-blog`. You may be running in a
different project — that's the point. All edits happen in the blog repo; use absolute
paths and `git -C /home/dgarman/projects/astro-blog`. Read that repo's `CLAUDE.md` if you
need styling/a11y context, but you shouldn't need it to write a post.

## 1. Capture the brain dump

The user will dump loose thoughts, bullets, voice-to-text, or just "write up what we did".
Don't interview them first. If they say "write up what we did", mine the current session
(commits, diffs, problems hit, decisions and why) for the material. Ask at most one or two
questions, and only for what you truly can't infer (e.g. "is the real bug the interesting
part, or the setup?"). Offer to take screenshots/photos they mention.

## 2. Set up the post

```bash
ls /home/dgarman/projects/astro-blog/src/pages/posts   # next number = highest + 1
```

- File: `src/pages/posts/post-NN-kebab-title.md` (use `.mdx` only if you need a component
  such as `CharacterStatBlock`; imports go right after the frontmatter).
- Create a feature branch in the blog repo: `git -C … switch -c post/NN-kebab-title`.
  Never work on `main`.

## 3. Frontmatter (exact shape)

```yaml
---
layout: ../../layouts/MarkdownPostLayout.astro
title: 'Post title'
pubDate: YYYY-MM-DD # today's date
description: 'One or two sentences; used for search snippet and social card.'
author: 'Andrew Garman'
image:
  url: '/images/compressed/postN/hero.webp'
  alt: 'Descriptive alt text — required, also used for og:image:alt'
  width: 1400
  height: 900
tags: ['lowercase', 'hyphenated'] # reuse existing tags where possible (grep other posts)
type: spellbook # quest | spellbook | lore | character
---
```

`type`: `spellbook` = technical/build write-ups (most posts), `quest` = campaign/session
chronicle, `lore` = worldbuilding/reflection, `character` = D&D character (post 14).
After the frontmatter, repeat the title as a single `# H1`, then `##` sections. Never skip
heading levels (accessibility is the top priority on this site).

## 4. Images

Photos/screenshots go in `public/images/compressed/postN/` as WebP, max 1400px wide.
Never commit originals. Use the helper (prints url/width/height to paste in):

```bash
cd /home/dgarman/projects/astro-blog
PATH="/home/dgarman/.nvm/versions/node/v24.14.1/bin:$PATH" \
  node scripts/add-post-image.mjs <postNumber> <path/to/original.png> [descriptive-name]
```

Reference in the body with:

```html
<img src="/images/compressed/postN/name.webp" alt="..." width="1400" height="900" loading="lazy" />
```

Every image needs real, descriptive alt text (what's _in_ it, incl. readable text in
screenshots); decorative images use `alt=""`. The first/hero image goes in frontmatter.
If the user hasn't supplied images, write the post without them and list "images wanted"
at the end rather than inventing paths.

## 5. Voice

First person, conversational, concrete — Andrew is a senior front-end dev who also does
D&D, hardware tinkering, and the outdoors. Lead with the interesting problem or surprise,
not a preamble. Show real code/commands/errors from the work (fenced with a language).
Include what went wrong and why; don't polish it into a victory lap. Link to repos/tools
mentioned. Prefer short sections with `##` headings. Keep their facts exact — if the dump
is ambiguous, flag it rather than guessing numbers, versions, or dates.

## 6. Verify and hand off

```bash
cd /home/dgarman/projects/astro-blog
PATH="/home/dgarman/.nvm/versions/node/v24.14.1/bin:$PATH" npm run build
```

Fix any build errors. Then **commit on the feature branch and STOP**. Do not push, open a
PR, or merge — Netlify's free build minutes are limited; the user says when to ship.
Suggest running /blog-review next. Report: the file path, the branch, the title/description you chose, images still wanted,
and anything you were unsure about. Offer `npm run dev` to preview.
