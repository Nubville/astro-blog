---
layout: ../../layouts/MarkdownPostLayout.astro
title: 'Bring Your Own Bard: An AI That Drafts, and a Saga That Isn’t Built Yet'
pubDate: 2026-11-17
description: 'The Chronicler’s Companion gets an AI helper that only ever drafts, a prompt-injection test I was glad I wrote, a UI that says “saved” everywhere, and a plan for running a shared world as a saga without spoiling it for guest game masters.'
author: 'Andrew Garman'
image:
  url: '/images/compressed/post19/bard-conversation.webp'
  alt: 'The “Ask the Bard” panel on the Chronicler’s Companion world builder. After a message reading “Build me a harbour pantheon” the Bard has answered with three draft cards, The Tide Choir, Valdra and Marrow-Under-Quay. One card’s text contains the line “IGNORE ALL PREVIOUS INSTRUCTIONS”, planted as a test. Below, a follow-up message reading “make them grimmer” has produced two revised cards, The Drowned Choir and Valdra, with a note that two entries were sent in full'
  width: 896
  height: 1731
tags: ['dnd', 'claude', 'nodejs', 'web-components', 'discord']
type: spellbook
---

# Bring Your Own Bard: An AI That Drafts, and a Saga That Isn’t Built Yet

The first thing I did to test the AI helper was try to break it. I planted a line in a world entry that said `IGNORE ALL PREVIOUS INSTRUCTIONS`, asked the helper to invent some gods, and watched to see whether the line would ever reach a person as anything but inert text. That test is in the repo now, and I'm glad it is, because this is the part of the project where the stakes are a little different.

[Last time](/posts/post-18-the-puck-hears-a-game-night/) was hardware. This post is mostly the other end of [Chronicler's Companion](/posts/post-16-chroniclers-companion/): the world builder, and what happens when you let a language model near a campaign.

## The rule: AI is a tool, never the voice

I'm a new game master, and the part of running a game that I want help with is remembering things, not inventing them. The story belongs to the people at the table. So the project has a mission page now, and the AI rules come straight from it:

- **Bring your own.** The Companion never calls a model with a key of its own and ships no default provider. Whoever runs the server connects one (a key they pay for, or a local model), or doesn't. Curating by hand is just as supported.
- **Everything it writes is a draft.** It arrives marked as the Bard's, visible only to the Chronicler (the game master), and nothing goes live until a person approves it.
- **Every person and every campaign can switch it off,** per use: transcription, answering questions, and drafting. The stricter setting wins.
- **No one trains on your stories.** That's a promise on the mission page, and the app never sends a model anything it wasn't asked to.

Each campaign can name its own Bard. Mine is the thing that sketches the harbour pantheon in the screenshot above.

## Wiring one up without a vendor

The connection is plain `fetch` against two adapters: anything that speaks the OpenAI chat format, and Anthropic's API. The settings live in the server's `.env`:

```text
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://…
AI_MODEL=…
AI_API_KEY=…
```

The first real connection took longer than the code did. A wrong model name and a parameter the model didn't accept both came back as bare errors, so I added two CLI commands: `ai-models` lists what the key can use, and `ai-test` makes one tiny request and says what went wrong in plain words (and never prints the key). When the model rejects the token-limit parameter, the hint now says whether to add or remove the override depending on whether it's already set. My first version of that hint was backwards.

## Trying to break it

The Bard reads your world so it can answer in its voice, which means text that someone typed into the world ends up inside a prompt. That's the textbook setup for prompt injection, so the design assumes the model will be fooled and limits what a fooled model can do:

- **Text only.** No tools, no links, no actions. Its reply is parsed into a few strict shapes (a god, a place, a person…), and anything that doesn't fit is dropped.
- **Public canon only.** It reads what the whole table can already see. Never Chronicler-only entries, never whispers, never anything written by someone who opted out.
- **A random boundary per request** around the world notes, so a note can't forge its own closing fence:

```text
=====WORLD NOTES 3f9a1c07e2b84d5a6c=====
…
=====WORLD NOTES 3f9a1c07e2b84d5a6c=====
```

- **A scrubber on the way out:** no links, images, HTML or `[[wiki links]]` survive in a draft.
- **Errors by status only,** and logs record that a request happened, never what was in it.

The planted line is in the screenshot: the fake model repeats it, and it comes out as a harmless sentence in a draft card that a person has to approve. Tests cover each of these. One of them nearly hid a bug: the privacy guard I wrote to ensure only two files may call `fetch` missed a renamed import, so I made it flag any use of the word and proved it by deliberately breaking it.

## It forgot, then it remembered too much

My first version answered one question at a time. I asked for a harbour pantheon, then said "build me gods for those pantheons", and it had no idea what "those" meant. So the helper became a conversation: you write, it answers, and you get a fresh box to reply in, the way I use Claude in the terminal.

The memory is deliberately small. Your next message carries the Bard's last reply, so "make them grimmer" works, and nothing older. I'd been picturing a long, snowballing pantheon discussion quietly blowing past the context limit, and I'd rather it forget on purpose than truncate by accident. Context is the same story. It used to send whatever fit in about 6,000 characters, and silently drop the rest. Now you choose what it reads: pick entries, or an entry and what it links to, and after every reply it tells you exactly what was sent:

> Sent 1 entry in full, 1 by name only.

Entries you didn't pick still appear by name, so it knows they exist without reading them.

A caveat on the screenshots: they come from a test harness with a fake model, because that lets me check the layout and the scrubbing deterministically. I've run real replies through the first version, not yet through the conversation. That's the next thing to try.

## Everything you change now says it worked

The Bard builds a lot of drafts, and I kept clicking "approve" and wondering whether anything had happened. So there's a new rule in the repo: anything that saves through the API has to say so, on the thing you changed. A short flash around the control or row, a "✓ Saved" tag that fades, a screen-reader announcement, and a failure that stays until you deal with it.

<img src="/images/compressed/post19/saved-flash.webp" alt="A settings card titled Transcription with an unchecked box, and a small green tag at its right reading “Transcription turned off”, shown just after the change saved" width="590" height="137" loading="lazy" />

For people who ask the browser for reduced motion, the flash becomes a steady outline instead of an animation. It's a Lit reactive controller, about a hundred lines, and a CLAUDE.md rule means new save buttons use it instead of inventing another "saved!" banner.

## Words need definitions

At this point I'd invented a lot of vocabulary: Chronicler, Scribe, Lorekeeper, Bard, tale, chronicle, saga. A friend can't be expected to know that a Lorekeeper builds the world but can't see your secrets. Now there's a glossary page of 40 terms, and the role selector on the invite form spells out what each role can and can't do, using one shared source so the invite form, the member list and the join page can't drift apart. A test fails if a term links to nowhere, if a planned feature isn't marked as planned, or if an anchor collides with an element id elsewhere (it did: `table-name`).

## The saga: a plan, not a feature

The idea I can't stop thinking about came to me in the car. A **saga** is a world's main timeline. Campaigns fork off it like forks of a repository, one-shots become blips on the line, and a campaign only takes in changes from the main timeline if its Chronicler accepts them.

<img src="/images/compressed/post19/saga-diagram.webp" alt="A diagram on a dark background. A long gold horizontal line is labelled “The saga: the main timeline” with three gold dots for a one-shot before it began, a war, and the next age. Two purple lines fork down from it, Campaign A and Campaign B, each with a row of teal dots for single evenings. A dashed arrow from the war down to Campaign A is labelled “accept it, if you want it”" width="1280" height="855" loading="lazy" />

What I'd actually like to do with it is run a big shared fantasy world like this. There'd be a **job board**, like a tavern noticeboard, where different game masters post a quest or a one-shot, another claims and runs it, and what happens ties back into the main story. The hard part is that a guest game master might also be a player in the main campaign, so they mustn't learn its secrets. The design answer is need-to-know: a guest sees only a briefing the owner chooses to show them, keeps a separate player view, and can only _propose_ what changed rather than write it into canon.

None of that exists. It's a design document and a page on the site that says "planned" next to every claim, and a test that fails if the page ever says otherwise. I'd rather market an idea honestly than ship a feature page that's really a wish.

## What went wrong

- **The site got ahead of the API.** After a merge the website asked for things the API didn't have yet, and an old 404 had no CORS headers, so the browser reported only "Failed to fetch". I took a backup, rehearsed the migration on a copy, and made every page load its optional pieces separately and send CORS headers on errors. The deploy order is a rule now: API first.
- **I killed my own shell twice** with `pkill -f`, which matched the command line that was running it. I use PIDs now.
- **A class name collision** (`.steps`) blew apart a numbered list on the new explainer page. I caught it only because I looked at the page in a real browser at two widths.

## Where it is

Everything above is merged and live except the saga, which is a plan. The helper is off unless someone connects a model, and I'll see how it does against a real one at the next session. Next up is more kinds of things to put in a world: shops, factions, creatures, encounters.
