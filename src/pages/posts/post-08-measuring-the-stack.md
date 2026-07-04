---
layout: ../../layouts/MarkdownPostLayout.astro
title: 'Root Meridian Part 6: The Cardboard Box Before Fusion 360'
pubDate: 2026-07-04
description: "Measuring the confirmed electronics stack with calipers, sketching the housing footprint, and building a cardboard mockup — because it turns out a month of dreading Fusion 360 is easier to survive with scissors and painter's tape first."
author: 'Andrew Garman'
image:
  url: '/images/compressed/post8/full-stack-fit-test.webp'
  alt: 'NeoPixel ring mounted directly on the stepper motor shaft, sitting inside the cardboard mockup housing with the full electronics stack wired in around it'
tags: ['dnd', 'esp32', 'maker', 'hardware', 'props', 'cad', 'fusion-360', '3d-print']
type: spellbook
---

# Root Meridian Part 6: The Cardboard Box Before Fusion 360

Last post ended with a to-do list: measure the confirmed stack, design the enclosure, print it. Four words. I wrote them like it was the easy part.

It has been a month.

Not because there was anything left to debug — the electronics are done, the ring lights up, the motor turns, the bot takes commands from Discord. It's because "design the enclosure" meant opening a CAD program, and every time I opened Fusion 360 I closed it again within about ninety seconds. Parametric modeling is a different kind of hard than wiring a NeoPixel ring. There's no serial monitor telling you what went wrong. There's just a blank viewport and a sketch plane and the creeping suspicion that you're about to waste an evening on a tool you don't understand yet.

So this session isn't the CAD session. This is the session where I finally stopped avoiding it by doing something productive instead: measuring everything twice and building the housing out of cardboard first, so that when I do open Fusion 360, I'm modeling toward numbers I trust instead of guessing.

## Calipers, Not Vibes

Every part of the stack got measured with actual digital calipers, not eyeballed off a datasheet PDF.

<img src="/images/compressed/post8/speaker-caliper-measurement.webp" alt="Digital calipers measuring the speaker enclosure at 69.6mm, resting on a notebook page with a hand-drawn speaker sketch" width="5712" height="4284" />

The speaker turned out to be the awkward one — it's not a simple rectangle, it's a trapezoidal bracket that widens from a 31.5mm base to a 69.5mm face, 63mm deep, with mounting ears that add another 16.3mm on each side. Every other part was comparatively easy: the ESP32 HUZZAH32 is 51mm × 43.5mm × 23mm with the header pins on; the stepper driver board is a clean 34mm × 30mm × 10mm; the NeoPixel ring is 66mm outer diameter, 52.3mm inner, 3.2mm thick; the stepper motor itself is 42mm across with a 35mm mounting bolt circle and 31mm of body height.

<img src="/images/compressed/post8/component-spec-sheet.webp" alt="Full notebook page of hand-drawn component measurements: speaker, SD card, ESP32, stepper driver board, stepper motor, and NeoPixel ring, each with caliper readings in millimeters" width="4284" height="5712" />

Writing all of it down in one place, to scale, was the first time the whole stack existed as numbers instead of a pile of parts on my desk.

Almost shipped that list with a hole in it, too — got two sections into sketching the footprint before realizing the battery wasn't on the page anywhere. Went back for it: 61mm × 35mm × 5mm. Small enough to tuck flat against a wall of the housing, but it would've been exactly the kind of thing that only shows up missing once the enclosure is already printed.

## Sketching the Footprint

From those numbers, the housing footprint fell out almost on its own: a 120mm × 120mm square with 20mm corners chamfered off, turning it into an octagon, with the stepper motor centered and its two mounting ears marked at north and south.

<img src="/images/compressed/post8/housing-footprint-sketch.webp" alt="Pencil sketch of the housing footprint: a 120mm by 120mm square with 20mm chamfered corners, the stepper motor centered with mounting ear holes marked" width="1239" height="1615" />

The chamfers aren't decorative. A plain 120mm square is bigger than it needs to be — the diagonal from the center to a square corner is a lot of wasted plastic once you've already accounted for the motor and the speaker along one edge. Cutting the corners gets the footprint closer to the actual electronics envelope without losing any usable interior space, since nothing in the stack needs to reach into a corner anyway.

## The Full Stack, One More Time

Before committing to any of those numbers, I rebuilt the entire stack on the breadboard one more time — ESP32, NeoPixel ring, stepper driver and motor, DFPlayer, speaker — everything live and wired, sitting next to the foam case it all ships in.

<img src="/images/compressed/post8/full-electronics-stack.webp" alt="Complete electronics stack wired on a breadboard: ESP32, NeoPixel ring, stepper driver and motor, DFPlayer, and speaker, sitting next to a foam tool case" width="5712" height="4284" />

This wasn't strictly necessary — I already had all these measurements from the soldering session. But designing a housing around parts I'm only remembering, instead of parts I'm looking at, felt like exactly the kind of mistake that costs a wasted print. Five minutes of re-wiring against zero regret later.

## Cardboard Before Code

Here's the part I actually want to talk about, because it's the thing that broke the month-long stall: I stopped trying to model the housing and just built it. Out of a cereal-box-weight strip of cardboard, painter's tape, and a red Sharpie.

First, a test fit for the speaker cutout — marked directly on a cardboard strip at the same 27mm / 80mm / 35mm intervals from the sketch, then pressed the actual speaker into it to check the tolerance by feel.

<img src="/images/compressed/post8/speaker-cutout-test-fit.webp" alt="The speaker component test-fitted against cutout marks drawn in red marker on a cardboard strip" width="4032" height="3024" />

Then the whole octagon, taped together at the chamfered corners and set directly on top of the pencil sketch to check that the physical object actually matched the drawing.

<img src="/images/compressed/post8/cardboard-mockup-vs-sketch.webp" alt="Assembled cardboard mockup of the octagonal housing sitting directly on top of the pencil footprint sketch, dimensions matching" width="4284" height="5712" />

It did. Genuinely satisfying, in a way that's out of proportion to how simple the test was — tape a box together, put it on the drawing, see if the corners line up. But it's the first physical evidence in this whole project that the numbers on paper describe something that can actually exist in three dimensions.

A cross-brace strip inside gives the stepper motor something to mount to, sized and positioned straight off the sketch:

<img src="/images/compressed/post8/cardboard-mockup-top-view.webp" alt="Top-down view of the taped cardboard mockup showing an internal cross-brace strip for mounting the stepper motor" width="5712" height="4284" />

## Everything, At Once

With the brace in place, the stepper motor got mounted for real, and the rest of the stack staged around it to see how much room was actually left over.

<img src="/images/compressed/post8/stepper-motor-mounted-in-mockup.webp" alt="Stepper motor mounted on the cardboard cross-brace inside the mockup housing, with the breadboard electronics staged alongside" width="5712" height="4284" />

Then the last piece: the NeoPixel ring, slid directly onto the stepper motor's shaft, sitting inside the mockup with every wire still connected back to the breadboard.

<img src="/images/compressed/post8/full-stack-fit-test.webp" alt="NeoPixel ring mounted on the stepper motor shaft, sitting inside the cardboard mockup housing with the full electronics stack wired in around it" width="4284" height="5712" />

That's the whole compass. Not glued, not printed, not final — a cardboard box with a motor bolted to a strip of corrugated fiberboard — but every physical relationship in the final part is right there, at true scale, for the first time.

## What's Next

The cardboard mockup did its job. There's no more measuring left to stall on, no more "I should double check this first" — the housing has fit-tested against the real hardware and it works.

Which means next session is the one I've been avoiding: opening Fusion 360 and actually modeling the octagon, the chamfers, the motor bore, and the speaker cutout as real, parametric geometry, instead of marker on cardboard. I'm not going in blind anymore — I have a shoebox of dimensions and a mockup that already proves they're right. That's the whole point of building it this way first.

Printing comes after that — the body on the Bambu P2S, probably a resin face plate on the Elegoo Saturn 2 for the gem window, same as the original plan.

---

_A month to open a piece of software. About ninety minutes to tape a box together and get more actual design confidence out of it than I got from four weeks of not opening Fusion 360. There's probably a lesson in there about avoidance, but I'd rather just go open the CAD program now._
