# Astro Developer Blog — Claude Rules

## Top Priority: Accessibility

**Accessibility is non-negotiable and the single most important quality bar on this project.**

Every feature, component, and design decision must be evaluated through an accessibility lens first.

- All interactive elements must be keyboard navigable and have visible focus indicators
- All images require descriptive `alt` text; decorative images use `alt=""`
- Use semantic HTML always — `<nav>`, `<main>`, `<article>`, `<aside>`, `<header>`, `<footer>`, `<section>` — never `<div>` where a semantic element fits
- Heading hierarchy must be logical and never skipped (h1 → h2 → h3, not h1 → h3)
- Color contrast must meet WCAG AA minimum (4.5:1 for body text, 3:1 for large text) — use a contrast checker before finalizing any color pair
- Never convey information through color alone — always pair with text, icon, or pattern
- All form inputs need associated `<label>` elements (not just placeholder text)
- ARIA attributes (`aria-label`, `aria-describedby`, `role`, etc.) only when native HTML semantics are insufficient — prefer native first
- Motion: respect `prefers-reduced-motion` for any animations or transitions
- Test with keyboard-only navigation before considering any interactive component complete

## Project Overview

Personal developer blog. Goal: maximum simplicity, maximum speed, deep accessibility. The aesthetic is a graph-paper field notebook — cream paper canvas, red margin rule, sketchy ink borders. Web components are the primary UI primitive, written as vanilla custom elements.

## Stack

| Layer          | Tool                                                |
| -------------- | --------------------------------------------------- |
| Site framework | Astro 6                                             |
| UI components  | Vanilla custom elements (`HTMLElement`)             |
| Styling        | Plain CSS with custom properties — no preprocessors |
| Bundler        | Vite (via Astro)                                    |

Web Awesome is **not** used for layout or structure. The `wa-` prefix components have been removed. Do not re-add them.

## CSS Rules

- **No PostCSS, no preprocessors, no build-time CSS transforms** — plain CSS only
- Use native CSS nesting (`&` syntax) — it is supported in all modern browsers
- Use `@media` queries directly — no custom media shorthand
- All color, spacing, and shadow values must use CSS custom properties defined in `src/styles/paper.css` and `src/styles/design-tokens.css`
- Never hardcode hex, hsl, or rgb color values outside of `paper.css`
- Style files use `.css` extension — never `.postcss`, `.scss`, `.less`
- Global styles are imported once in `BaseLayout.astro` via `import '../styles/global.css'`
- Use scoped `<style>` blocks in `.astro` files for component-level rules
- Do not import styles in page components — use `BaseLayout.astro` or scoped blocks

## Container Query Contract

**All component responsiveness uses CSS container queries — never viewport media queries for component internals.**

1. **`sketch-card` must remain light DOM** — no shadow root. Container queries on the host element (`@container sketch-card`) only affect children in the light DOM. Adding a shadow root would break all internal `@container` rules.

2. **New components declare `container-type: inline-size`** as a baseline. Register a `container-name` if children need to query it.

3. **No viewport `@media` queries for component internals.** Use `@container` referencing the nearest named ancestor. Viewport queries are only acceptable for truly global layout concerns (e.g., printing).

### Named containers

| Container name | Element        | Purpose                                              |
| -------------- | -------------- | ---------------------------------------------------- |
| `content-col`  | `.content-col` | Drives two-panel ultrawide spread at 1400px+         |
| `main-canvas`  | `main`         | Drives `.posts-grid` column count                    |
| `sketch-card`  | `sketch-card`  | Drives internal card layout (portrait/text stacking) |

## Design Tokens

Paper palette defined in `src/styles/paper.css`:

```
--paper          cream background (#f6f1e7)
--paper-dark     slightly darker cream
--paper-shadow   shadow tone
--ink            near-black (#2a1e10)
--ink-faint      warm mid-tone (#9a8060)
--pencil         light graphite (#b4a88a)
--blue-ink       dark navy (#2a4a7a)
--green-ink      dark forest (#2a4a2a)
--amber-ink      dark amber (#7a5010)
--red-pen        translucent red (margin rule)
--margin-width   54px (left margin column)
```

Semantic aliases in `src/styles/design-tokens.css`:

```
--brand-1    red-orange marker (#c43a1a)
--surface-1  var(--paper)
--text-1     var(--ink)
--text-2     var(--ink-faint)
--shadow-cel 2px 2px 0 var(--ink)  (no-blur ink drop shadow)
```

Typography tokens in `src/styles/typography.css`:

```
--font-display    Special Elite (typewriter)
--font-heading    Special Elite
--font-body       Work Sans
--font-annotation Caveat (handwriting)
--font-mono       Courier New
--font-size-1 through --font-size-5
--font-weight-light / --font-weight-regular / --font-weight-bold
```

## sketch-card Component

Defined in `src/scripts/sketch-card.js` — a vanilla `HTMLElement` subclass.

- Registered as `<sketch-card type="quest|spellbook|lore|character">`
- Inserts an SVG sketchy border into its own light DOM
- Four border styles, each with unique hand-drawn SVG paths
- SVG uses `preserveAspectRatio="none"` + `vector-effect="non-scaling-stroke"` so the border stretches to card size without distorting stroke widths
- **Do not convert to Lit or add a shadow root** — breaks container queries

## Component Rules

- **Astro components** (`.astro`): layout, page composition, static shells only
- **Vanilla custom elements** (`HTMLElement`): any interactive UI or reusable web components
- Never introduce React, Vue, Svelte, Lit, or any JS framework
- Use `client:load` on Astro islands only when a component genuinely needs client-side hydration
- Prefer static rendering everywhere possible — keep the JS bundle minimal

## File Naming

- Astro components: PascalCase (`BlogPost.astro`, `Header.astro`)
- CSS files: kebab-case (`design-tokens.css`, `paper.css`)
- Scripts / web components: kebab-case matching element name (`sketch-card.js`)

## Node Version

Astro 6 requires Node >=22.12.0. Use nvm v24.14.1:

```
PATH="/home/dgarman/.nvm/versions/node/v24.14.1/bin:$PATH" npm run dev
```

System node (v20) will fail to start the dev server.

## Project Structure

```
src/
  components/       # Shared Astro UI components
  layouts/          # Page shell layouts (BaseLayout, MarkdownPostLayout)
  pages/            # Routes — Astro pages + Markdown posts
    posts/          # Blog post markdown files
    tags/           # Tag index and dynamic tag pages
  custom-elements/  # Vanilla custom elements (browser-side JS only)
    sketch-card.js  # <sketch-card> vanilla web component
  styles/
    paper.css        # Raw palette + site grid layout + container queries
    design-tokens.css
    fonts.css
    global.css       # Imports all CSS; defines sketch-card container + card utilities
    typography.css
```
