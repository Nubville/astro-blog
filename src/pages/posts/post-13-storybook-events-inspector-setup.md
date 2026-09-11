---
layout: ../../layouts/MarkdownPostLayout.astro
title: 'Every Event, No Exceptions: Setting Up storybook-events-inspector — and Catching a Real Typo With It'
pubDate: 2026-09-11
description: 'A spotlight on the addon from the last post: the actual shadow-DOM bug it exists to catch, a real install-to-MCP setup walkthrough, and what happened the first time I pointed an AI agent at a real Storybook with it running.'
author: 'Andrew Garman'
image:
  url: '/images/compressed/post13/panel-three-flags.webp'
  alt: "The Events Inspector panel showing three real bug classes flagged on two captured events: demo-secret marked 'undocumented' in red, and demo-change marked both 'shared' (another tag also fires this name) and 'retargeted' (event.target doesn't match the true origin) — fired by demo-button and demo-toggle respectively"
  width: 1400
  height: 900
tags: ['storybook', 'web-components', 'mcp', 'debugging', 'claude']
type: spellbook
---

# Every Event, No Exceptions: Setting Up storybook-events-inspector — and Catching a Real Typo With It

The last post was about building [storybook-events-inspector](https://github.com/Nubville/storybook-events-inspector) — the origin story, the mistake, the five firsts in one afternoon. This one's shorter and more useful: what the addon actually catches, how to wire it into a real project in the ten minutes it takes, and what happened the first time I sat an AI agent in front of a live Storybook with it running and just watched.

## The bug this exists to catch

Here's the shape of it, stripped down. A component fires an event from inside its shadow root:

```ts
this.dispatchEvent(new CustomEvent('item-select', { detail: { id } }));
```

That looks correct. It compiles, it runs, nothing throws. And from outside that component — from the host application that's supposed to be listening for `item-select` — it never happened. Not "arrived malformed." Never arrived at all.

The reason is `composed`, and it defaults to `false`. An event's propagation path only crosses a shadow boundary if the event was explicitly authored with `composed: true`. Without it, `item-select` bubbles exactly as far as the shadow root and stops — invisible to a listener on `document`, on `window`, on the component's own parent in the light DOM, all of it. The fix is one property:

```ts
this.dispatchEvent(
  new CustomEvent('item-select', { detail: { id }, bubbles: true, composed: true })
);
```

but you only find the _missing_ property by already suspecting it's missing, because nothing about the failure looks like a bug from the outside. The host app just... doesn't respond. No error, no warning, no stack trace pointing at the gap. You get to debug "component seems broken" with no information about which of a dozen possible causes it actually is.

Two more traps live in the same neighborhood, both real bug classes I've personally cost an afternoon to on past projects:

- **`shared`** — two different components both dispatch the same event name (`change`, `select`, whatever), so a listener on a common ancestor can't tell which one actually fired without also checking who sent it.
- **`retargeted`** — a _composed_ event crosses a shadow boundary, and `event.target` gets rewritten to the outer host element instead of the actual element that dispatched it. `composedPath()[0]` still has the truth; `event.target` doesn't, and most code reads `event.target`.

The addon's demo fixtures show `retargeted` and `shared` with real, working code rather than a hypothetical. `demo-button` dispatches from its internal `<button>` on purpose, specifically to produce the mismatch between `event.target` and the true origin:

```ts
// demo-button.ts — dispatches from the internal <button>, not `this`, so
// event.target (read from outside) gets retargeted to <demo-button> while
// composedPath()[0] — the panel's "Fired by" column — still shows the truth
(event.currentTarget as HTMLElement).dispatchEvent(
  new CustomEvent('demo-change', {
    detail: { value: this._count, source: 'demo-button' },
    bubbles: true,
    composed: true,
  })
);
```

And `demo-toggle` fires that exact same `demo-change` name, with a different detail shape, for the `shared` flag:

```ts
// demo-toggle.ts — same event name as demo-button, different payload
this.dispatchEvent(
  new CustomEvent('demo-change', {
    detail: { checked: this.checked, source: 'demo-toggle' },
    bubbles: true,
    composed: true,
  })
);
```

Neither of those fixtures is broken. They're deliberately shaped to demonstrate exactly the ambiguity a listener on a shared ancestor actually faces.

## How it sees all of it anyway

The trick isn't listening harder. It's listening in a different place entirely. Every custom event any element dispatches — Lit, Stencil, vanilla, doesn't matter — passes through exactly one platform method: `EventTarget.prototype.dispatchEvent`. Patch that once, and you're not subscribing to events anymore; you're standing at the one door everything has to walk through.

```ts
// inspector.ts — the whole capture mechanism, in one patch
const original = EventTarget.prototype.dispatchEvent;
EventTarget.prototype.dispatchEvent = function (this: EventTarget, event: Event): boolean {
  const result = original.call(this, event);
  notify(event, this); // passive — never touches the return value
  return result;
};
```

That's the reason `composed: false` events stop being invisible: a `window` listener never sees them because their propagation path never reaches `window`, but intercepting the _call itself_ doesn't care what the propagation path was. It sees the dispatch before propagation even starts. Same reasoning gets you native-event filtering for free in the other direction — a real click is dispatched by the browser engine, never through a JS call to `.dispatchEvent()`, so patching the method naturally excludes it without a single line of allowlisting.

One more piece worth knowing before you install anything: capture starts the moment this module loads, not when something subscribes to it. Events fired from a component's `connectedCallback` — before a Storybook decorator or the MCP session has had a chance to subscribe — get buffered and handed to the first subscriber instead of falling into the gap between "page starts" and "someone's listening." A tool whose entire pitch is "if it isn't here, it didn't fire" can't have a startup blind spot of its own.

## Setting it up

```sh
npm install --save-dev storybook-events-inspector
```

```ts
// .storybook/main.ts
const config = {
  addons: ['storybook-events-inspector'],
};
```

That's genuinely it for the panel. Open Storybook, and there's an **Events inspector** tab next to Controls and Actions. No catalog, no registration, no story has to remember to import a debug component — it's already watching everything, in every story, the instant the addon loads.

The catalog is optional annotation on top of that, not a prerequisite for it. Without one, every captured event is (correctly) `undocumented` — you still see everything, you just don't get the `shared`/`undocumented` distinction. When you're ready for it, it's generated, not hand-written, because hand-maintaining a list of every event your components fire is exactly the kind of thing that silently drifts out of date:

```sh
npx storybook-events-inspector-setup catalog
```

That reads your project's Custom Elements Manifest (via `package.json`'s `customElements` field, or `./custom-elements.json` as a fallback) and inverts it — from "what does this tag fire" to "which tags fire this name" — because that inversion is the only shape that makes `shared` computable at all. Wire the result into `.storybook/preview.ts`:

```ts
// .storybook/preview.ts
const preview: Preview = {
  parameters: {
    eventsInspector: {
      catalog: [
        { name: 'item-change', tags: ['search-input', 'sort-by'] },
        { name: 'list-load-more', tags: ['pagination'] },
      ],
    },
  },
};
```

## Handing it to an agent instead of clicking through it yourself

The panel is for a human watching a browser. The MCP server is the same capture-and-dispatch engine behind a second front door, this time speaking a protocol an agent can drive directly — no browser tab for a person to sit in front of.

```sh
npm install --save-dev @modelcontextprotocol/sdk playwright zod
npx playwright install chromium
```

```jsonc
// .mcp.json
{
  "mcpServers": {
    "storybook-events-inspector": {
      "command": "npx",
      "args": [
        "storybook-events-inspector-mcp",
        "--storybook-url",
        "http://localhost:6006",
        "--catalog",
        "./events-catalog.json",
      ],
    },
  },
}
```

Storybook has to already be running — the server drives its own separate headless browser against your existing instance, it doesn't start Storybook itself. Six tools, and the whole loop is short enough to write out in full:

| Tool             | Does                                                                               |
| ---------------- | ---------------------------------------------------------------------------------- |
| `list_stories`   | Every story in the running Storybook, so an agent can find an id without guessing  |
| `open_story`     | Load a story by id and start capturing                                             |
| `click`          | Click a real element by CSS selector, let whatever it fires get captured naturally |
| `dispatch_event` | Fire a synthetic event _at_ the story's element, no UI trigger required            |
| `get_events`     | Everything captured so far, with the same flags the panel shows                    |
| `clear_events`   | Empty the buffer without reloading the story                                       |

```
list_stories                                    → find "my-design-system--menu"
open_story  { storyId: "my-design-system--menu" }
click       { selector: "my-menu-trigger" }
get_events  {}
→ [{ name: "menu-open", origin: "my-menu", detail: {...}, undocumented: false, ... }]
```

<img src="/images/compressed/post13/dispatch-roundtrip.webp" alt="The panel's Dispatch form firing a synthetic demo-command event with detail {&quot;action&quot;: &quot;open&quot;} at the Toggle Only story — the component visibly receives it, rendering 'received: {&quot;action&quot;:&quot;open&quot;}' in the canvas, and the dispatch itself appears in the log below, fired by demo-toggle" width="1400" height="900" loading="lazy" />

## What actually happened when I ran it for real

I pointed the MCP server at a real Storybook — not the addon's own demo fixtures, an actual project — and did the boring thing first: opened a story, clicked through the interaction, called `get_events`, and read the raw stream that came back.

Nothing about it should have needed a second look. Every name in that list had the right hyphenation, the right prefix, the right general shape as everything else this component library fires — it read like it belonged, at a glance, the way a typo dressed in the right convention always does. And one of them was wrong. Not malformed, not missing `composed: true`, not one of the four flags the panel would have raised on its own — just a name that didn't match what the rest of the codebase actually called that event, close enough to pass a skim and just off enough that, once I was looking at the literal string instead of the shape of it, it clearly wasn't right.

That's the actual value of watching the _stream_ rather than trusting a catalog: a catalog only tells you whether a name you already expected is unrecognized. It doesn't catch a name that's wrong in a way that still looks plausible sitting next to its siblings. Seeing every dispatch, as text, in one place, is what made a one-character difference visible instead of implicit.

I haven't gone back to fix the source of it yet — this was a test run, not a work session — but it's exactly the class of thing that would otherwise have shown up as "the host app isn't responding to that event" weeks from now, with none of the context I have right now for why.

---

_The panel answers "did it fire." The MCP server answers it without me clicking anything. Neither one would have caught this by being clever — they caught it by not looking away._
