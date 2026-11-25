# Papercoaster

[![CI](https://github.com/jimmerioles/papercoaster/actions/workflows/ci.yml/badge.svg)](https://github.com/jimmerioles/papercoaster/actions/workflows/ci.yml)
[![Live demo](https://img.shields.io/badge/demo-live-e85d3f)](https://jimmerioles.github.io/papercoaster/)
[![License: MIT](https://img.shields.io/badge/license-MIT-2f4f4f)](LICENSE)

Draw a line. Ride it.

A three.js paper coaster: one stroke becomes a rollercoaster through a paper diorama, then you ride it in first person.

**Live demo:** https://jimmerioles.github.io/papercoaster/

**Case study:** https://jimmerioles.github.io/papercoaster/#/case-study

https://github.com/user-attachments/assets/aa538ce5-5967-4c88-8f70-0f924ac8636f

Papercoaster is for anyone who has doodled a coaster in the margin and wondered how it would feel. There is no track editor: you draw one line, and the app turns it into a track with a drop, loop, or flat run. The whole world is generated in code, so the only asset is your stroke.

## What you can do

- Draw one continuous stroke with a mouse, trackpad, or touch screen. A drop, a loop, or a flat run all become the track.
- A stroke pipeline that turns noisy input into an even, rideable track, and explains why a line was rejected.
- Ride in first person with an energy-based speed model, speed-based FOV, look-ahead, and a comfort view for motion-sensitive riders.
- Fly through a paper diorama with layered mountain rings, a winding river, a forest, clouds, a sun, and a start flag.
- Read speed and progress in the HUD. The end screen reports top speed and track length.
- Try the test track with `?t=0.18` for the drop, `?t=0.48` for the loop, or `?t=0.66` for the turn.
- No backend, no login, no external assets. Textures and geometry are generated at runtime.

## Run it

Requires Node 22.12 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npm run test       # Playwright smoke test
npm run preview    # serve the production build
```

`npm run test` needs Chromium once with `npx playwright install chromium`. The browser test uses software WebGL and can heat a laptop, so `npm run verify` is the faster local gate for format, lint, unit tests, and build.

## Use it

1. Open the live demo or run `npm run dev`.
2. Click **Draw a line**, then drag one stroke across the paper.
3. Click **Ride the line**. Clear or Redraw to try another.
4. Press `C` to toggle comfort view (on by default with reduced motion). Press `R` to restart the ride.

## How it works

A stroke is deduped, smoothed with Chaikin, resampled every two world units, and mapped into the valley. The points become a centripetal Catmull-Rom spline; arc-length sampling and a planar frame keep a loop smooth. Speed comes from energy with a minimum speed so loops complete, then the camera adds look-ahead, FOV, and horizon lock. Everything is generated in code.

The math and the reasons behind it are in [docs/design.md](docs/design.md).

## Tests

`npm run verify` covers format, lint, unit tests, and build; `npm run test` runs the Playwright smoke test for the draw flow, freezes, and full ride restart.

## Good to know

- A reload does not reconstruct a drawn stroke. Sharing is the next milestone.
- The case study at `#/case-study` is a separate route. It does not start the 3D scene until you return to the ride.
- Background tabs throttle the ride.
- A side-view line has no banked turns. Depth input is the next step.

## Credits and license

Built by [Jim Merioles](https://github.com/jimmerioles) with three.js and Vite. MIT licensed, see [LICENSE](LICENSE).
