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
- Web Awesome components are built with a11y in mind — prefer them over hand-rolled components for this reason
- Test with keyboard-only navigation before considering any interactive component complete

## Project Overview

Personal developer blog. Goal: maximum simplicity, maximum speed, deep accessibility. Web components are the primary UI primitive — this site doubles as a sandbox for Lit/Web Awesome patterns the author uses professionally.

## Stack

| Layer | Tool |
|---|---|
| Site framework | Astro 6 |
| UI components | Web Awesome (`@awesome.me/webawesome`) |
| Component base | Lit (via Web Awesome) |
| Styling | Plain CSS with custom properties — no preprocessors |
| Bundler | Vite (via Astro) |

## CSS Rules

- **No PostCSS, no preprocessors, no build-time CSS transforms** — plain CSS only
- Use native CSS nesting (`&` syntax) — it is supported in all modern browsers
- Use `@media` queries directly — no custom media shorthand
- All color, spacing, and shadow values must use CSS custom properties defined in `src/styles/design-tokens.css`
- Never hardcode hex, hsl, or rgb color values outside of `design-tokens.css`
- Style files use `.css` extension — never `.postcss`, `.scss`, `.less`
- Global styles are imported once in `BaseLayout.astro` via `import '../styles/global.css'`
- Use scoped `<style>` blocks in `.astro` files for component-level rules
- Do not import styles in page components — use `BaseLayout.astro` or scoped blocks

## Design Tokens

Defined in [src/styles/design-tokens.css](src/styles/design-tokens.css):

```
--surface-1   darkest navy background
--surface-2   lighter navy
--surface-3   mid-tone navy

--brand-1     orange — primary
--brand-2     orange — darker
--brand-3     orange — lighter

--accent-1    steel blue — light
--accent-2    steel blue — mid
--accent-3    steel blue — dark

--text-1      primary text, near white
--text-2      secondary text
--text-3      tertiary text

--gradient-1  brand orange gradient
--gradient-2  surface gradient
--shadow-glow orange glow shadow
```

Typography tokens in [src/styles/typography.css](src/styles/typography.css):
```
--font-display    Poiret One
--font-heading    Raleway
--font-body       Work Sans
--font-size-1     1rem
--font-size-2     1.25rem
--font-size-3     1.5rem
--font-size-4     2rem
--font-size-5     2.5rem
--font-weight-light / --font-weight-regular / --font-weight-bold
```

## Web Awesome

- npm package: `@awesome.me/webawesome`
- All elements use the `wa-` prefix: `<wa-button>`, `<wa-badge>`, `<wa-card>`, etc.
- Cherry-pick component imports: `@awesome.me/webawesome/dist/components/<name>/<name>.js`
- Stylesheet: `@awesome.me/webawesome/dist/styles/webawesome.css`
- Apply themes via class on `<html>`: e.g. `class="wa-theme-awesome"`
- Built on Lit — custom components should also extend `LitElement` from `lit`
- Prefer Web Awesome components over hand-rolling UI primitives — they ship with a11y built in

## Component Rules

- **Astro components** (`.astro`): layout, page composition, static shells only
- **Lit web components**: any interactive UI — written as native custom elements extending `LitElement`
- Never introduce React, Vue, Svelte, or any JS framework
- Use `client:load` on Astro islands only when a component genuinely needs client-side hydration
- Prefer static rendering everywhere possible — keep the JS bundle minimal
- Custom element names follow the Web Awesome convention: `wa-` prefix for library components, author-defined prefix for custom ones

## File Naming

- Astro components: PascalCase (`BlogPost.astro`, `BlogSpotlight.astro`)
- CSS files: kebab-case (`design-tokens.css`, `global.css`)
- Scripts / web components: kebab-case matching element name (`blog-card.ts`)

## Known Issues

- `BlogSpotlight.astro` is imported in `BaseLayout.astro` but does not exist — will error until created

## Project Structure

```
src/
  components/       # Shared Astro UI components
  layouts/          # Page shell layouts (BaseLayout, MarkdownPostLayout)
  pages/            # Routes — Astro pages + Markdown posts
    posts/          # Blog post markdown files
    tags/           # Tag index and dynamic tag pages
  scripts/          # Client-side JS
  styles/
    design-tokens.css
    fonts.css
    global.css
    typography.css
```
