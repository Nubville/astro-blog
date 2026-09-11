---
layout: ../../layouts/MarkdownPostLayout.astro
title: 'From a Copy-Pasted Debug Hack to My First Open Source Package: Building a Real Storybook Events Inspector'
pubDate: 2026-09-11
description: 'The scrappy debug component I kept carrying between design system projects, why it never quite worked, and the day it became a real Storybook addon with a test suite, an MCP server an AI agent can drive directly, and five actual npm publishes.'
author: 'Andrew Garman'
image:
  url: '/images/compressed/post12/panel-flags.webp'
  alt: "The Events Inspector Storybook panel showing two captured custom events: demo-secret flagged 'undocumented', and demo-change flagged both 'shared' and 'retargeted', each row showing the firing element and its JSON detail payload"
  width: 1400
  height: 900
tags: ['storybook', 'open-source', 'npm', 'mcp', 'web-components', 'claude']
type: spellbook
---

# From a Copy-Pasted Debug Hack to My First Open Source Package: Building a Real Storybook Events Inspector

There's a component I've built some version of at least three times now, at three different jobs, on three different design systems. It never had a real name worth remembering — just whatever I called it that week — and it never left the project it was born in. I'd copy the file into a new repo, rename a few things, wire it into that project's stories by hand, and move on. It worked, in the sense that it did the one thing I needed: tell me whether a component actually fired the event it was supposed to fire.

It was never good. And I never had the time, on someone else's clock, to make it good — or to pull the one useful idea out of three separate half-working copies and give it back to the design system community that gave me every other tool I use for free. Today I finally did. This post is about that: the actual problem worth solving, the two very different working sessions it took to solve it properly, the mistake I made along the way, and the genuinely strange feeling of watching `npm publish` succeed for the first time.

## The problem, for real

Every design system I've touched shares the same architecture, whether anyone wrote it down or not: components are dumb and presentational, they fire one custom event when something happens, and the host application owns what to actually _do_ about it. A dropdown doesn't know or care what selecting an option means to your app — it fires `item-select` with the right detail and gets out of the way. It's a good pattern. It's also one that makes "is this component actually working?" collapse into a single, narrow question: **did the right event fire, with the right shape, from the right place?**

The browser gives you nothing for that. `console.log` inside a component works until you have twelve of them on screen. The Actions addon that ships with Storybook logs prop callbacks, not DOM events. And the traps that actually eat an afternoon — an event fired without `composed: true` that's invisible outside its own shadow root, two different components both dispatching `change-base` so a listener on a shared ancestor can't tell them apart, `event.target` quietly pointing at the wrong element because a composed event crossed a shadow boundary — none of that has a debugger for it. You find out by reading source, or by getting paged.

So at every job, I built a small panel — usually a plain Lit element, dropped straight into a story — that listened on `window` for a hardcoded list of event names and printed what arrived. It helped. It also had to be told, by name, every single event it was allowed to see, which meant it was permanently one step behind whatever the design system actually shipped. It lived outside the addon system entirely, so nobody else on the team discovered it existed unless I told them. And it never once left the repo it was written in, because "clean this up and open source it" is the kind of task that's always more valuable than whatever's actually next on the sprint board — which is another way of saying it never happened.

## Turning the hack into a real Storybook citizen

The actual unlock this time wasn't a better UI. It was realizing the thing I'd built three times was solving the DOM-event half of the problem in the least generic way possible — by asking me to type out every event name it should listen for. There's exactly one place in the platform every custom event has to pass through: `EventTarget.prototype.dispatchEvent`. That's not a Lit thing, or a design-system thing — it's the actual method the browser calls, for every element, every time. Patch that once and you get the same trick Redux DevTools has always used on `store.dispatch`: total visibility, zero registration, and it stops mattering whether the component in front of you was authored in Lit, Stencil, or plain JS.

```ts
const original = EventTarget.prototype.dispatchEvent;
EventTarget.prototype.dispatchEvent = function (event) {
  const result = original.call(this, event);
  notify(event, this); // passive — never touches the return value
  return result;
};
```

That single change turned the tool from "tell me your event names" into "I already see everything; a catalog just tells me which of it you meant to ship." A design system's `custom-elements.json` — which most component libraries already generate — became the source for exactly that catalog, inverted from "what does this tag fire" into "which tags fire this name," which is the only shape that makes a `shared` flag computable at all.

And instead of a Lit element living inside one repo's stories, it became a real `types.PANEL` addon — registered through Storybook's actual extension API, sitting in the tab bar next to Controls and Actions, the same way every other serious Storybook addon does it. `npm install`, add one line to `main.ts`, done. No story has to remember to import a debug component ever again.

<img src="/images/compressed/post12/panel-flags.webp" alt="The Events Inspector Storybook panel showing two captured custom events: demo-secret flagged 'undocumented', and demo-change flagged both 'shared' and 'retargeted', each row showing the firing element and its JSON detail payload" width="1400" height="900" loading="lazy" />

Four flags came out of actually building this the right way, not the copy-paste way: **`notComposed`** (dispatched from inside a shadow root without `composed: true` — invisible to the whole host app, not just the debugger, and honestly the most important one), **`shared`** (more than one tag declares this event name), **`retargeted`** (`event.target` isn't the true origin, because a composed event crossed a shadow boundary), and **`undocumented`** (fired, but not in the catalog). Every one of those is a real bug class I've personally lost an hour to, on a real project, with no tool telling me which one it was.

## The chapter I didn't expect: an AI agent that can test it too

Partway through, I asked a question I didn't have a confident answer to: Storybook recently shipped its own official MCP integration — should this addon hook into that? I actually went and read their docs instead of guessing, and the honest answer was no, not yet: there's no extension point today for a third-party addon to register its own tools into Storybook's MCP server, and the part of it that reads component data doesn't cover web-components projects at all yet.

So it became its own small MCP server instead — a second front door onto the exact same capture-and-dispatch engine, this time speaking a protocol an AI agent can drive directly. The whole point of everything above — "did the right event fire, from the right place, shaped correctly" — is a question an agent can now ask a real, running Storybook and get a real, structured answer to, without a human clicking through a browser:

```
open_story    { storyId: "design-system--menu" }
click         { selector: "my-menu-trigger" }
get_events    {}
→ [{ name: "menu-open", origin: "my-menu", detail: {...}, undocumented: false, ... }]
```

Same flags, same catalog, same everything — driven by a headless browser instead of a person. Proving that architecture was worth the extra care I'd put into keeping the actual capture engine (`core/`) completely ignorant of Storybook meant the MCP server got to reuse it, unchanged, the moment it needed to.

## The mistake, told straight

This blog doesn't pretend every session goes clean, and this one didn't either. Testing how the release automation computed version bumps, I made two throwaway commits and then ran `git reset --hard HEAD~2` to remove them — forgetting that a hard reset doesn't just undo commits, it discards every uncommitted change sitting in the working tree too. At that point the working tree held a full package rename, a new live-count feature, and the release config I'd just built. All of it, gone in one command.

It was recoverable — every file's correct content was still sitting in the conversation itself, so it was a matter of carefully rewriting each one and re-verifying live rather than losing real work — but it was a real mistake, not a close call, and the honest fix wasn't "be more careful next time" in the abstract. It was: commit more often, and never hard-reset a tree with uncommitted work sitting in it, full stop. I'd rather write that down than pretend the session was clean.

## The part I didn't do myself

Here's the detail I actually want on the record: I didn't review this with the same model I built it with. After that first working session I opened a fresh Claude Code session and deliberately switched models for the review pass — Opus this time, with a much longer context window, so the whole package could sit in front of it at once instead of being reasoned about a file at a time. Same repo, different reader, one job: review and harden what the first session had built. What came back wasn't cosmetic. It found and fixed a real gap where an event dispatched from a component's `connectedCallback` — before anything had a chance to subscribe — was silently lost, while the tool kept claiming to see everything; it widened capture from just DOM elements to any `EventTarget`, because a design system dispatching on `document` or through a bare event bus class was being dropped without a word; it fixed a genuine bug in the circular-reference detector that was flagging any object appearing twice in a payload as `[Circular]`, cycle or not; and it added a real test suite — 79 tests — plus a whole setup CLI that turns a Custom Elements Manifest straight into this tool's catalog format, because I'd shipped the catalog concept without ever making it easy to produce one.

I reviewed every line of that before trusting it, the same way I'd want anyone reviewing mine — read the diffs, ran the new tests, drove the live Storybook and the MCP server by hand to confirm the claims in the commit messages were actually true and not just well-written. They were.

<img src="/images/compressed/post12/test-suite.webp" alt="A terminal showing pnpm test running the vitest suite: eight test files covering describe, catalog, effectiveFilter, entriesStore, safeDetail, the manifest CLI, dispatch, and the inspector core, finishing with 78 tests passed and 1 skipped out of 79, in 568 milliseconds" width="982" height="498" loading="lazy" />

## Five firsts, one afternoon

By the end of the day: first [GitHub repo](https://github.com/Nubville/storybook-events-inspector) I've open sourced under my own name, with a license I actually understood the tradeoffs of before picking it (MIT — permissive, matches how the Storybook addon ecosystem already works, and the one thing it does legally guarantee is that my name stays attached to any copy). First real `CONTRIBUTING.md`, issue templates, a CI workflow that lints and builds on every push. First time conventional commit messages weren't a nice idea I meant to adopt eventually — `feat:`, `fix:`, `feat!:` actually drove five automatic version bumps, 0.1.0 through 0.3.1, each one computed correctly from what the commit said it was.

And first `npm publish` that wasn't a `-dry-run`. Watching that command succeed — genuinely, publicly, [npmjs.com/package/storybook-events-inspector](https://www.npmjs.com/package/storybook-events-inspector) answering back with a real number — was a different kind of feeling than shipping a feature at work. Nobody assigned it. Nobody's going to notice if it's wrong except a stranger who installs it. It's not in the Storybook integration catalog yet — that part's automatic once the metadata's right, no submission form, but apparently not instant either — so that's still a small thing to watch for. Everything else about it is just... out there now, for anyone, for free, built by taking a thing I only ever half-finished for other people's paychecks and actually finishing it for mine.

---

_Three tries at the same idea, on three different clocks, before I finally built it on my own._
