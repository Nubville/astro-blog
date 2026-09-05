---
layout: ../../layouts/MarkdownPostLayout.astro
title: 'No Docker Desktop Required: Getting Drupal Running on Windows via WSL2 and Lando'
pubDate: 2026-09-05
description: 'Testing whether a gaming rig running WSL2 could stand up a real Drupal site with Lando and Docker, no Docker Desktop involved — and the two very-Windows hiccups that showed up along the way.'
author: 'Andrew Garman'
image:
  url: '/images/compressed/post11/drupal-welcome.webp'
  alt: "Drupal 11's default front page after a successful Drush site install, headed 'Welcome!' and 'Congratulations and welcome to the Drupal community', served from drupal-test.lndo.site with the admin toolbar down the left"
  width: 1600
  height: 851
tags: ['drupal', 'docker', 'lando', 'wsl2', 'windows', 'claude']
type: spellbook
---

# No Docker Desktop Required: Getting Drupal Running on Windows via WSL2 and Lando

I hadn't touched Drupal on a Windows machine in years — back when that meant XAMPP, or if you were fancy, a Vagrant box that took twenty minutes to provision. My actual desktop is a gaming rig that happens to have WSL2 sitting on it for the occasional experiment. Out of curiosity more than anything, I wanted to know: could that same box stand up a real, current Drupal install with Docker underneath it, without turning it into a second full-time dev machine?

Short answer: yes, and it was closer to "boring" than "brutal" — which, for anything involving Windows and Docker, felt worth writing down.

## Picking a lane: Lando vs. DDEV, and killing OrbStack early

First decision was which local-dev tool to use. DDEV has quietly become the default in a lot of the Drupal world, but I wanted to actually try Lando, so that's what I set up. Before touching either, though, I almost went down a dead end: I assumed OrbStack — the fast, light Docker replacement I'd heard people rave about — would be an option on Windows too.

It isn't. OrbStack is macOS-only, full stop. On Windows the real choice is between Docker Desktop and Docker Engine running natively inside WSL2 — and DDEV's own docs are explicit that Engine-inside-WSL2 is the better-performing, license-simpler path. So that settled it before I'd installed anything: Docker Engine, straight inside the WSL2 Ubuntu distro, no Windows-side GUI app at all.

Lando made that mildly annoying to actually get, but more on that in a second.

## The base install went exactly like Linux

Getting Docker Engine onto Ubuntu-on-WSL2 was completely unremarkable — the same handful of `apt` commands you'd run on any fresh Ubuntu box: add Docker's repo and signing key, `apt install docker-ce`, add yourself to the `docker` group, enable the service. No WSL-specific workarounds needed for this part at all.

```bash
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
sudo systemctl enable --now docker
```

First hiccup, though: `docker run hello-world` came back with `permission denied while trying to connect to the docker API`. Not a Windows-specific bug exactly — adding a user to a group never applies to your _already-open_ shell — but WSL2 with systemd enabled has an extra wrinkle: even closing and reopening the terminal tab wasn't always enough, because the whole Linux VM keeps a persistent session running underneath. The actual fix needed a full reset from the _Windows_ side:

```powershell
wsl --shutdown
```

Reopen the terminal after that, and `docker run hello-world` worked clean.

## Lando really wants to give you Docker Desktop

Here's the Windows-specific part. Lando's current installer, when it detects it's running inside WSL, defaults to installing Docker Desktop on the Windows host — not Docker Engine inside WSL like it does on plain Linux. That's not a bug, it's the documented default, and it's exactly why I'd already decided to avoid Docker Desktop. Heading it off meant dropping one small config file before installing Lando at all:

```bash
mkdir -p ~/.lando
printf 'setup:\n  buildEngine: false\n' > ~/.lando/config.yml
```

<img src="/images/compressed/post11/lando-config-buildengine.webp" alt="Terminal session creating ~/.lando/config.yml with a setup block containing buildEngine: false, then printing the file back to confirm its contents" width="593" height="141" loading="lazy" />

That told Lando "don't manage a build engine yourself, I've already got one." The installer itself was a single line:

```bash
/bin/bash -c "$(curl -fsSL https://get.lando.dev/setup-lando.sh)"
```

Then `lando setup` — the command that actually wires up Lando's certificate authority, its shared Docker network, and its bundled Docker Compose — ran into the _exact same_ permission-denied error as before, because it was a fresh process hitting the same stale-session problem. Fittingly, the fix was identical: `wsl --shutdown` from Windows, reopen, retry. Two different tools, same underlying WSL2 quirk, same cure.

Worth calling out: even with Docker looking "down" mid-setup, Lando never actually managed to install Docker Desktop — our config stopped that — it just tried (and failed, harmlessly) to _start_ one that was never there, as a fallback safety net baked into its WSL-awareness. A little alarming to watch scroll by in the logs, zero actual consequence.

Once that second reset landed, `lando setup` finished clean — six for six, Landonet created, no errors.

## Standing up an actual Drupal site

With Lando and Docker both working, the rest was the normal Composer-based Drupal flow, just run through `lando` instead of a local PHP install — I never touched PHP or Composer on the Windows/WSL2 host directly, everything ran inside the container:

```bash
lando init --source cwd --recipe drupal11 --webroot web --name drupal-test
lando start
lando composer create-project drupal/recommended-project:11.x tmp && cp -r tmp/. . && rm -rf tmp
lando composer require drush/drush
lando drush site:install --db-url=mysql://drupal11:drupal11@database/drupal11 -y
lando drush uli
```

That last command hands back a one-time login link. Pasting it into a plain Windows Chrome window loaded the full Drupal 11 admin dashboard over **trusted HTTPS** — `https://drupal-test.lndo.site`, no certificate warning. That padlock was its own small proof point: Lando's local certificate authority had installed itself into _Windows'_ own trust store, not just Linux's, so a browser running entirely outside WSL2 trusted a cert generated entirely inside it.

<img src="/images/compressed/post11/drush-uli-password-reset.webp" alt="The Drupal account edit form reached through the one-time login link, showing the status message 'You have used a one-time login link. You can set your new password now.' above the email, username and password fields" width="1600" height="845" loading="lazy" />

## The honest take

I'll say the quiet part out loud: I didn't have the exact flags, recipe names, or the `buildEngine: false` trick memorized, and I'm not going to pretend I reconstructed Lando's current WSL-detection behavior from memory. I worked through this with Claude open in another pane, feeding me commands and explaining what each one did as we went — including, at one low point, a fairly patient explanation of why a terminal can run a command successfully and print back nothing at all.

But the two actual hiccups — the stale WSL2 session after a group change, and Lando reaching for Docker Desktop by default — were both narrow, both well-understood, and both fixed in a couple of minutes once identified. Neither one was "Windows can't do this." A gaming rig with WSL2 turned on can run a completely normal, modern Drupal stack, with real Docker underneath it, with no Docker Desktop anywhere in sight.

---

_The hardest part of the whole session wasn't Drupal, or Docker, or even Windows — it was trusting that a command which printed nothing back had actually worked._
