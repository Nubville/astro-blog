---
layout: ../../layouts/MarkdownPostLayout.astro
title: "Chronicler's Companion: A Campaign Memory That Has to Keep Secrets"
pubDate: 2026-11-08
description: 'Discord admins can read every private channel, so passing D&D secrets needed a different design. Whispers over bot DMs, voice notes that catch only people who opted in, and a console that never gets data it should not show.'
author: 'Andrew Garman'
image:
  url: '/images/compressed/post6/chroniclers_companion.webp'
  alt: 'Chronicler bot avatar: a hooded robot reading a tome surrounded by D20s and a map, rendered in dark fantasy style'
  width: 1254
  height: 1254
tags: ['dnd', 'discord', 'dungeon-master', 'web-components', 'claude', 'nodejs']
type: spellbook
---

# Chronicler's Companion: A Campaign Memory That Has to Keep Secrets

Anyone with the Administrator permission on a Discord server can read every private channel on it. Private threads too. Discord has no channel or thread type that hides content from Administrators, so the roughly 15 per-player channels we'd been using for D&D secrets were never really private. They were just inconvenient to look at.

Fixing that is where Chronicler's Companion got its shape. It's a campaign memory for tabletop groups, living where my group already talks: Discord. It's a pet project for me and my friends, and it's also how I'm learning Claude Code. Some of it works, a lot of it is mocked, and I'll be specific below about which is which.

## Why it stopped being a browser app

The Discord bot I [built for the Root Meridian compass](/posts/post-06-discord-bot/) moved a stepper motor. It knew nothing about the campaign. My first plan for campaign notes was a browser-only app storing everything in IndexedDB, with no backend at all, which is very much the sort of thing a front-end developer comes up with.

It died on one sentence: notes in IndexedDB can't be reached by the bot. If a player is going to ask Discord what happened last session, the campaign can't live in my browser.

So the plan now is one Chronicle API that holds the campaign, with everything else as a thin client: the bot, the website, an eventual table device. I want to be upfront that the API doesn't exist yet. The `api/` folder is a README. Everything so far has been built against the shape it will have.

## Whispers go through the bot's DMs

Here's how the options stacked up in the design doc:

| Option                     | Can server admins read it? | Notes                   |
| -------------------------- | -------------------------- | ----------------------- |
| Private channel per player | Yes                        | About 15 to maintain    |
| Private thread per player  | Yes                        | Admins see every thread |
| Bot relays through DMs     | No                         | The design I went with  |

The DM runs this anywhere in the campaign's server:

```text
/whisper to:@Lyra message:You notice the priest's ring bears the Dusk Order sigil
```

The DM gets a confirmation only they can see, and the player gets a DM from the bot with a Reply button. The player can tap that or just type back. Message Content intent isn't needed, because DMs to a bot are exempt from it.

Whispers are encrypted at rest with AES-256-GCM, and each ciphertext is bound to its campaign and player so rows can't be swapped between conversations. That protects the database file and backups. It does _not_ hide anything from whoever runs the bot, and the notice players see doesn't claim it does. A player can run `/privacy` to see what's stored, stop saving, or delete the whole conversation. Whispers purge 30 days after a campaign ends, and they stay out of any AI features unless the DM turns that on, in a setting players can see.

## The plan said opt-in. The prototype said opt-out.

The voice side joins a Discord voice channel and writes down who said what. Discord hands the bot a separate Opus stream for each speaker, which gives you speaker labels for free. That's the hard part of transcribing a room, and Discord just does it. Clips end after 0.8 seconds of silence or at 25 seconds, get downmixed to 16 kHz mono, and go to Whisper. The processor also throws out known Whisper hallucinations, because silence has a habit of being transcribed as "Thanks for watching."

The roadmap has always said recording is per-member opt-in, and that audio from anyone who hasn't agreed gets dropped. The prototype, meanwhile, had a `/session optout` command. Everyone in the channel was transcribed unless they spoke up to stop it. The status line in the roadmap even described it as opt-out, right below the paragraph promising the opposite.

The rewrite isn't committed as I write this. Consent lives in a small class that only remembers the current session:

```ts
export class SessionConsent {
  private yes = new Set<string>();

  constructor(starterId?: string) {
    if (starterId) this.yes.add(starterId);
  }
  // optIn, optOut, allows...
}
```

Whoever runs `/session start` counts as a yes, since they chose to record. Everyone else starts as a no and clicks **Transcribe me** on the notice if they want in. The important part is where the check sits:

```ts
// Opt-in: no consent, no subscription. Their audio is never received or decoded.
if (receiver.subscriptions.has(userId) || !l.consent.allows(userId) || l.stopping) return;
```

Audio from someone who hasn't agreed doesn't get filtered out later, because it's never subscribed to. If somebody opts out mid-sentence, the clip in progress is thrown away.

## Hidden and missing look the same

The website is a console for the person running the game, with entries for gods, NPCs, places and items, plus a graph of how they connect. Until the API exists it runs against a mock server, and the mock does all the visibility filtering, so the components never receive anything they shouldn't show. "Who can see this" comes down to one function:

```ts
export function canSee(viewer: Viewer, v: Visibility): boolean {
  if (viewer.role === 'dm') return true;
  if (v.kind === 'everyone') return true;
  if (v.kind === 'dm+players') return v.playerIds.includes(viewer.id);
  return false;
}
```

The function is the easy bit. Secrets leak through the edges of a feature: a resolved `[[wiki link]]` that names a hidden place, a backlink, a line on the graph. So the tests check those too, and the shortest one explains the idea best:

```ts
it('answers "hidden" and "missing" identically', () => {
  expect(server.get(tobin, 'sunken-bell')).toEqual(server.get(tobin, 'no-such-entry'));
});
```

If a request for a secret entry came back different from a request for one that doesn't exist, the difference itself would give the secret away. The same rule is planned for `/ask`: retrieval runs as the person asking, so the model never sees a record they couldn't read. Filtering after the model has answered is too late.

## Tags that never get registered

The front end is Lit and plain CSS tokens, but Lit's job has been shrinking. Design components are now `cc-*` custom elements that are never registered. They're just tags, styled in CSS by name and attribute, with native HTML inside them carrying the semantics. No JavaScript is needed for a static page to read properly. Lit only comes in for things with state, like the graph.

The home page, also still uncommitted, is a book that opens as you scroll, using only CSS scroll-driven animations. Browsers without them and anyone with reduced motion turned on get the book already open. Every feature on the page shows its real status as text, and I've made a rule not to add sign-ups, prices or testimonials until they're real.

## Three things called Chronicler

The name has caused real trouble. The compass bot's Discord application is called Chronicler. The planned table device was called the Chronicler. Then the UI needed a word for the person running the game, because "Dungeon Master" is a Wizards of the Coast trademark.

The person won. **The Chronicler** is whoever keeps the book. A trusted player who helps clean up transcripts is **the Scribe**, and the bot's storyteller persona is **the Bard**, for now. The code still says `dm` everywhere, and the table device currently has no name at all.

That device is still only a plan. Discord gives you speaker labels, but an in-person table doesn't. The first version would be a screenless puck, Seeed's reSpeaker XVF3800 with a XIAO ESP32-S3, sitting in the middle of the table. Its mic array can estimate where a voice came from, so "who spoke" can be worked out from seats. I'm deliberately not using voiceprints, because that's biometric data about my friends and the whole project is supposed to hold the campaign, not the people playing it. Seat guesses will be wrong sometimes, and that's what the Scribe's review after the session is for.

## Where it actually stands

| Piece                         | Status                       |
| ----------------------------- | ---------------------------- |
| `/whisper`                    | Working in early tests       |
| `/session` voice notes        | Works for one speaker so far |
| Opt-in voice consent          | Written, not yet committed   |
| Console and connections graph | Sample data only             |
| Chronicle API                 | Not started                  |
| Recaps, `/ask`, scheduling    | Planned                      |
| Table puck                    | Planned                      |

The next real test is a live voice session with more than one person talking. After that comes the API, and I have to prove that sign-in works with Discord's `identify` scope and no real email before I build on it. If the auth library can't do that, the library goes and the no-email rule stays.
