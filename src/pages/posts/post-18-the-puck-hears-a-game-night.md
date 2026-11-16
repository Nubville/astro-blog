---
layout: ../../layouts/MarkdownPostLayout.astro
title: "The Puck's First Game Night: 139 Minutes, Nothing Lost"
pubDate: 2026-11-16
description: 'A D&D session on Sunday became the deadline for the table puck: record first and upload second, a Wi-Fi setup page for a friend’s house, a fixed address behind a Cloudflare tunnel, and two hours of combat transcribed on my own PC.'
author: 'Andrew Garman'
image:
  url: '/images/compressed/post18/hero.webp'
  alt: 'The new Chronicler’s Companion home page in a dark violet theme: the headline “Your campaign remembers, so you don’t have to.” beside a circular crest of a bearded wizard in a red hat writing in a book with a quill, with gold d20, d6 and d4 dice around it and four round character tokens labelled Wizard, Fighter, Bard and Ranger below the buttons'
  width: 1400
  height: 900
tags: ['dnd', 'esp32', 'maker', 'claude', 'props', 'wifi']
type: spellbook
---

# The Puck's First Game Night: 139 Minutes, Nothing Lost

Sunday night the table puck sat in the middle of a friend's table, a bare circuit board with no case, through two hours and nineteen minutes of a fight with a flock of crows. When the session ended, the API on my PC at home had every second of it.

```text
#1 ended · 139.4 min · 0 s waiting · 0 s lost · 3285 lines
```

[Last time](/posts/post-16-chroniclers-companion/), the puck was a board in a box and some printed shells, and the Chronicle API was a README. This post is about the week between, which had a hard deadline: a D&D session on Sunday, and I wanted to try recording it. Everyone at the table agreed to the test beforehand, and that's a rule now, not a courtesy. The puck only runs when the whole table says yes.

## No SD card, so record first and send second

The puck is Seeed's reSpeaker XVF3800 with a XIAO ESP32-S3 on the back. There's no SD card. I had a box of SD card readers left over from another project, which turned out to be DFPlayer Minis: little MP3 players that can read a card but can't write to it. The XIAO Sense's own SD slot would have clashed with the audio pins anyway.

So the puck can't save the night to a card and upload it later. It has to stream, over whatever Wi-Fi the house has, and Wi-Fi drops. The design I landed on is "record first, send second". The XIAO has 8 MB of PSRAM, which holds a ring of the last 180 seconds of audio in one-second chunks. A task pinned to its own core does nothing but capture, and the main loop uploads the oldest chunk whenever there's a connection. If the ring fills, the oldest second is dropped and counted:

```cpp
if (head - tail >= RING_SECONDS) { tail = head - RING_SECONDS + 1; dropped++; }
```

Three minutes of slack turned out to matter on day one. The first time I powered it on, the API wasn't running yet. The puck buffered about 95 seconds, then caught up once the server came up, and lost nothing.

## The server says yes only after the audio is on disk

The Chronicle API finally exists, at least the slice the puck needs. The puck posts each one-second chunk with a stream id and a sequence number, and the server writes it to disk before it answers. If the reply gets lost and the puck sends the same chunk again, the database ignores the duplicate, so retries are safe.

Backlog is the subtle part. After a Wi-Fi drop, the puck sends chunks that were recorded minutes ago, and the transcript should place them when they were heard, not when they arrived. The puck sends its own clock readings for "when I recorded this" and "now", and the server does the subtraction:

```ts
// The puck may be sending a backlog: place the chunk at the time it was heard, not when it arrived.
const capturedAt = receivedAt - (deviceMs - capturedMs);
```

A worker then sends 10 to 30 second windows to [whisper.cpp](https://github.com/ggml-org/whisper.cpp) running on my PC, cutting at quiet moments so words aren't sliced in half. Nothing goes to a cloud speech service. The raw audio is kept, because I want to be able to transcribe a session again later with a bigger model. Each pass gets saved as its own Markdown file.

## Joining Wi-Fi at someone else's house

The game wasn't at my place, and I didn't want to reflash the puck from a work laptop to give it a new Wi-Fi password. So it got a setup page. If it can't join a network it knows, it starts its own Wi-Fi, `Chronicler-Puck-xxxx`, and serves a page where you pick a network and type the password, like a hotel sign-in page.

The first real test failed in a way I didn't expect. On my phone, the page saved the network name and half the password. The phone's keyboard Enter key, or autofill, submitted the form while I was still typing. The fix was a pile of small things: block Enter, add a Show password box, list saved networks with a Forget button, and add a Done button so the page only closes when you say so.

Then there was the question of how to open setup on purpose. The XIAO has no spare button on this board. The board itself has two buttons: reset, and the mic array's mute. The XVF3800 reports the mute button's state over I2C, so holding mute for five seconds now opens setup. That also means the case remix has to leave both buttons reachable.

## A tunnel that keeps its address

The puck needs a fixed address to send audio to, from any house, without me opening ports on my router. A Cloudflare quick tunnel was the first answer: one command, no account, and it prints an `https://….trycloudflare.com` address. The catch is that the address changes every time the tunnel restarts. A reboot meant telling the puck a new address over USB.

The fix is a named tunnel at `api.chroniclerscompanion.com`, and that's where I took a wrong turn. I'd just moved the website to Netlify and let Netlify pick up the domain, and I assumed I could add the tunnel as a subdomain there. You can't. A Cloudflare tunnel only answers for hostnames in a zone that Cloudflare's own DNS serves. Handing over just one subdomain needs a paid plan.

So DNS moved to Cloudflare, and the site stayed on Netlify. The two website records point at Netlify with Cloudflare's proxy switched off, so Netlify still issues the HTTPS certificate. Only `api` goes through Cloudflare, straight down the tunnel to my PC. For a few minutes after the switch, both addresses failed the TLS handshake even though DNS was already right. Each certificate just needed time to be issued.

The puck took its new address with one serial command and no reflash, because the root certificates it already carries cover Cloudflare's.

## Game night

At the table, the puck joined my phone's hotspot. That took one detour: it didn't know the hotspot yet, and a phone can't host a hotspot while it's also joined to the puck's setup Wi-Fi. So it went hotspot off, phone on the setup page, save, hotspot back on, and unplug and replug the puck so it would look for networks straight away.

<img src="/images/compressed/post18/puck-page.webp" alt="The Table props page of the Chronicler’s Companion site: the headline “The puck: a scribe the size of a coaster.” next to an illustration of a round puck with twelve glowing violet lights around its rim and the wizard crest in the middle" width="1400" height="900" loading="lazy" />

During the game I checked on it from my phone through Claude Code's remote control, which was a strange and lovely way to monitor a home server. "Is everything still coming through?" got back minutes recorded, seconds lost and how far behind transcription was, usually under 30 seconds.

When I asked for the last minute of transcript, there was a line about trying to get away from "the crow". Claude flagged it as Whisper mishearing "crowd". The party was fighting crows. Game terms came through better than I expected, with spell and class feature names spelled right. The misses were the kind a glossary should fix, like ki points showing up as "key points".

The biggest gap is obvious once you read it: there are no speaker names, so the back-and-forth of combat reads like one very busy person. Speaker labels are next, using the direction each voice comes from, plus a page that maps those angles to seats. I'd also like a taller puck. A combat-night table is covered in minis, books and drinks, all of it between the mics and the people talking.

## Eighty paragraphs

Before showing the transcript to anyone, I added a page where the table can read it, with one shared password, and only for sessions I choose to share. It's a deliberate, temporary exception. Real sign-in will be through Discord, with per-player secrets, and nothing private goes behind the shared password.

<img src="/images/compressed/post18/table-password.webp" alt="A sign-in panel titled Table password, explaining that the Chronicler gave this to the table and it opens only the sessions they chose to share, with a password field, a Show button and a gold Open button" width="1216" height="207" loading="lazy" />

The first time the page pulled the session, it reported 80 lines for two hours and nineteen minutes. The code that joins Whisper's fragments into readable lines merged anything less than four seconds apart, and a table in the middle of a fight almost never goes quiet for four seconds. Fragments now join only to finish a sentence that hasn't ended, capped at 240 characters. The same night now reads as 2,467 lines.

## The other thing I built this week

The website got rebuilt too, from the wizard crest down. I sketched it on a design canvas first, with a slim header, dice that tumble in and drift off as you scroll, and a page for each part of the project. Then I built it as static HTML and CSS in the same repo, with Arcane, Parchment and Starship themes. Every colour, dice faces included, is a design token, so another game system is one block of values away.

The best bug of the week was there. In the first screenshots, every die and every icon was missing. They all live in one SVG sprite file, and a comment at the top of it mentioned the `--die` colour token. A double hyphen isn't allowed inside an XML comment, so the browser threw away the whole file. There's a test for it now.

## Where it stands

| Piece                             | Status                                     |
| --------------------------------- | ------------------------------------------ |
| Table puck                        | Recorded a full game, bare board, no case  |
| Chronicle API (table audio)       | Running on my PC, 24 tests                 |
| `api.chroniclerscompanion.com`    | Named Cloudflare tunnel, survives restarts |
| Website                           | Live on Netlify, 37 tests                  |
| Shared transcript page            | Live, temporary, one password              |
| Speaker labels, glossary, case    | Next                                       |
| Campaign backend, Discord sign-in | Next, design first                         |

Next up is the part the whole project was named for: a shared campaign where everyone at the table can add notes, and the API decides who sees what.
