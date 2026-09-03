---
layout: ../../layouts/MarkdownPostLayout.astro
title: "One Attribute, Four Themes: How This Blog's Design Tokens Actually Work"
pubDate: 2026-09-03
description: 'How a three-layer CSS custom property system lets this site recolor, reshape, and refont itself from one data-theme attribute, why none of that costs a re-render, and the real bug that taught me how Astro scopes styles.'
author: 'Andrew Garman'
tags: ['css', 'design-tokens', 'frontend', 'accessibility', 'performance']
type: spellbook
---

# One Attribute, Four Themes: How This Blog's Design Tokens Actually Work

Pick a theme from the dropdown in the header. Paper, Lamplight, Horde, Wayfinder — whichever one you land on, notice what actually changed: the colors, sure, but also the font on every heading, the shadow style, and — on Wayfinder — the actual _shape_ of every card and button on the page, sharp ink-sketch corners replaced with soft rounded ones.

All of that came from one line of JavaScript:

```js
document.documentElement.dataset.theme = 'wayfinder';
```

Everything else — every color, every font swap, every corner radius — is CSS doing what CSS has always done: cascading. No component re-rendered. No style object got recomputed in JavaScript and diffed against the last one. The browser just noticed an attribute changed, recalculated which CSS rules apply, and repainted. That's the whole trick, and it's worth actually walking through, because "design tokens" as a phrase gets thrown around a lot without anyone showing the mechanism.

## Three layers, not one

The temptation with a token system is to define colors once and reference them everywhere — `--brand-color: #c43a1a`, done. That works until you want a second theme, at which point you're back to hunting down every place that hardcoded assumptions about what "brand color" looks like against what background.

This site's tokens (`src/styles/ag-tokens.css`) split into three layers instead, declared explicitly so their cascade priority is unambiguous regardless of selector specificity:

```css
@layer ag-color-palette, ag-theme, ag-theme-overrides;
```

**Layer 1 — the raw palette.** A numeric scale, lightest to darkest, per hue family. No meaning attached yet, just color:

```css
@layer ag-color-palette {
  :root {
    --ag-color-brand-95: #fdf0ec;
    --ag-color-brand-70: #e07050;
    --ag-color-brand-50: #c43a1a;
    --ag-color-brand-20: #5c1808;
    /* … */
  }
}
```

**Layer 2 — semantic meaning.** This is where a rung of the scale gets a _job_: "the loud brand fill," "quiet text," "the border on a raised surface." Every theme block lives here, each one scoped to `[data-theme='x']`:

```css
@layer ag-theme {
  :root,
  [data-theme='paper'] {
    --ag-color-brand-fill-loud: var(--ag-color-brand-50);
    --ag-color-text-normal: var(--ag-color-neutral-20);
    /* … */
  }

  [data-theme='horde'] {
    --ag-color-brand-50: #c4291f; /* a different hue family entirely */
    --ag-color-brand-fill-loud: var(--ag-color-brand-50);
    --ag-color-text-normal: #e8dcc8; /* bone, not ink */
    /* … */
  }
}
```

Notice Horde doesn't just re-point `fill-loud` at a different rung of the _same_ red — it overrides the raw `--ag-color-brand-50` itself, inside a higher-priority layer. Cascade layers beat selector specificity: even though `:root` is a lower-specificity selector than almost anything, `ag-theme` was declared after `ag-color-palette`, so its `:root` wins over the palette layer's `:root` for any property both define. That's what lets a theme repaint an entire hue family, not just swap which shade of one fixed hue gets used where.

**Layer 3 — the names components actually write.** A thin alias layer maps the semantic tokens onto short, stable names, so a component author writes `color: var(--brand-1)` and never touches an `--ag-color-*` token directly:

```css
@layer ag-theme-overrides {
  :root {
    --brand-1: var(--ag-color-brand-fill-loud);
    --ink: var(--ag-color-text-normal);
    --pencil: var(--ag-color-surface-border);
  }
}
```

Follow `--brand-1` all the way through: a component's `color: var(--brand-1)` resolves through the alias to `--ag-color-brand-fill-loud`, which resolves through the semantic layer to whatever raw rung the _active_ theme decided "loud brand" means. Four themes, one line of component CSS, never touched again.

## The part that's actually new: shape

Recoloring via custom properties is a well-worn trick. What I wanted Wayfinder to prove was that the same mechanism reaches structure, not just paint. `sketch-card` — the component behind every card on this site — already exposed its corner radius and border width as custom properties with fallback defaults, for its own internal `type="quest"` / `type="spellbook"` variants:

```css
sketch-card {
  border: var(--card-border-width, 1.8px) solid var(--ink);
  border-radius: var(--card-corner-radius, 6px);
}
```

Which meant giving an entire theme a different silhouette was one rule, and it's the only CSS this whole system needed to write specifically for shape:

```css
[data-theme='wayfinder'] sketch-card {
  --card-border-width: 3px;
  --card-corner-radius: 22px;
}
```

Every post card, the character sheet, the profile card — all of it, everywhere on the site, picks up soft rounded corners the instant Wayfinder is active. Worth being honest about the limit here too: most components on this site hardcode their border-radius as a literal pixel value rather than reading a token, so this trick only reaches the handful of places I deliberately wired up (`sketch-card`, the header nav). A full site-wide rewire so _every_ border responded to a theme was out of scope — a bigger, separate refactor, not a design tokens limitation.

## Why this doesn't cost anything

Here's the performance claim, made concrete instead of asserted. The entire token system — full color ramps, semantic mappings, shape overrides, for all four themes, combined into one file — compiles down to this:

```
7,263 bytes, gzipped
```

That's every theme this site has, all shipped in one request, whether you ever switch themes or not. Roughly one small icon's worth of bytes for four complete visual identities.

More importantly: switching themes at runtime does zero of that work again. There's no JavaScript computing a new set of style values, no virtual DOM diff, no component tree re-render. `document.documentElement.dataset.theme = 'wayfinder'` changes one attribute; the browser's own style engine — the same native cascade resolution it runs on every page load — figures out which `[data-theme='wayfinder']` rules now match and repaints. It's the same class of operation as `:hover` or `:focus` starting to match. Browsers have been fast at this specific thing for decades, because it's the entire job of a CSS engine.

There is exactly one place in this system that costs real bytes on switch, and it's deliberately not CSS:

```js
// theme-init.js — runs once on load, and again from theme-switcher.js
// on every switch, keyed by exact font family so two themes sharing
// one font never fetch it twice
var THEME_FONTS = {
  paper: ['family=Special+Elite'],
  lamplight: ['family=Bricolage+Grotesque:wght@400..800', 'family=JetBrains+Mono:wght@400;500;700'],
  horde: ['family=Bricolage+Grotesque:wght@400..800', 'family=JetBrains+Mono:wght@400;500;700'],
  wayfinder: ['family=Cabin+Sketch:wght@400;700', 'family=JetBrains+Mono:wght@400;500;700'],
};

function loadThemeFonts(theme) {
  var families = THEME_FONTS[theme];
  if (!families) return;
  families.forEach(function (family) {
    var id = 'theme-font-' + family.replace(/[^a-zA-Z0-9]/g, '');
    if (document.getElementById(id)) return; // already fetched, skip
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?' + family + '&display=swap';
    document.head.appendChild(link);
  });
}
```

A web font is a real network request — that's a genuine cost, so it's the one piece of this system that's lazy. `fonts.css` only ships the two families every theme shares unconditionally (body text, handwritten annotations); each theme's own display and code fonts fetch on demand, the first time that theme is actually used, and never again after that. A visitor who lands on Horde and never touches the dropdown downloads exactly Horde's fonts — not Paper's typewriter face, not Wayfinder's hand-sketched one. The distinction that matters: _color, shape, and the CSS cascade are free; a font file is not,_ and the system is built to only pay for the one that's real.

## The bug that taught me how Astro actually scopes styles

Worth including because it's the kind of thing you only learn by getting it wrong first. Early on, several dark-theme-only overrides — giving tag chips a solid background so they don't disappear into a busy dark page, that kind of thing — looked like this inside a component's scoped `<style>` block:

```css
[data-theme='horde'] .tag {
  background: var(--surface-raised);
}
```

It silently did nothing. Not an error — it just never matched. Astro's scoped-style compiler appends a per-component attribute to every selector it processes, so this compiled to something like `[data-theme='horde'][data-astro-cid-xxx] .tag[data-astro-cid-xxx]` — and `data-theme` lives on `<html>`, which is never part of that component's own template, so it can never carry that component's scope attribute. The fix is Astro's actual escape hatch for exactly this: wrap the part that needs to reach outside the component's own DOM.

```css
:global([data-theme='horde']) .tag {
  background: var(--surface-raised);
}
```

Ten rules across seven components had this exact bug, some of them sitting unnoticed for a couple of commits. What finally caught it was extending the accessibility test suite to actually render every theme, not just whichever one happens to be the default — a reminder that "it works" and "I checked all four themes render it" are different claims, and only one of them is verifiable without doing the work.

---

_Four themes, one attribute, 7.3KB. The expensive part was never the CSS._
