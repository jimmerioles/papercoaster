# Agent guide

## What this is

Papercoaster: draw one line, it becomes a rollercoaster through a paper diorama, then ride it. The current build has the drawing layer on top of the v0.1.0 feel test. The next milestone is the thrill score and sharing.

Read `README.md` for the product and commands. Read `docs/design.md` before changing the camera, track, or world. Read `docs/next.md` for what landed and what comes next.

## First 10 minutes

1. `npm ci`
2. `npm run verify`
3. `npm run dev`
4. Draw a line, ride it, then check the four `?t` views below for the test track
5. Read `docs/next.md` for the remaining milestones

Done when `verify` passes, CI's browser test passes, and the four views look right. Use browse or your own browser for local visual checks. Do not run the full Playwright suite on a laptop unless you need to.

## Run and verify

- `npm run verify` runs the format check, lint, unit tests, and build. This is the fast local gate.
- `npm run test` runs the Playwright smoke test. This is the CI browser gate. It launches headless Chromium with software WebGL and can heat a laptop, so prefer browse for local QA. The config caps it at one worker.
- `npm run test:unit` runs the pure stroke and track tests with `node --test`.
- `npm run dev` starts Vite at http://localhost:5173.
- `npm install` for a local checkout. `npm ci` for a clean, reproducible install.
- Visual check: open the app, draw a line, and ride it. Then open the test track freezes and inspect four moments:
  - Start: `?t=0` shows the track, flag, layered mountains, and river.
  - Drop: `?t=0.18` shows the red ribbon, river, and forest from above.
  - Loop: `?t=0.48` is upside down. The track stays coral.
  - Turn: `?t=0.66` banks into the turn.
- The console should be clean. The favicon is inline, so a favicon 404 means the HTML regressed.
- The smoke test covers the intro, the draw screen, a rejected short stroke, Clear, a single stroke lock, a resize, a drawn ride, a drawn freeze, the test-track freeze views, end screen focus, and the full ride restart. The visual composition is still checked by eye.

The ride runs at full speed only in an active tab. Background tabs throttle `requestAnimationFrame`. Use the `?t` freezes for layout checks and a foreground tab for feel checks. A reload cannot reconstruct a drawn stroke, so `?t` on load uses the test track.

## Local browser QA

Use browse for local visual and interaction checks when it is available. Browse drives the real Chrome window and GPU, which is much lighter than four headless Chromium pages on a laptop. If browse is not available, use `npm run dev` and a normal browser window.

The Playwright suite stays as the reproducible CI gate. Run it locally only when you need to debug the suite, and keep it at one worker. A software WebGL ride at full speed is the heavy part.

## Feel rules

The ride is a spline plus a speed model, not a physics simulation. Keep the camera first: if a change hurts the drop, loop, or turn, revert it.

- The camera sits 2.2 units above the track, looks ahead along the curve, and rolls with the track frame. A drawn side-view track has no bank, so its roll comes from the in-plane normal.
- `C` toggles comfort view, and `prefers-reduced-motion` enables it by default. Keep both working.
- The track stays on `MeshBasicMaterial` with a procedural paper texture. A lit material goes dark at the top of the loop.
- The paper look is flat colors, layered silhouettes, and no external assets. Generate new textures and geometry in code.
- Coral is the accent: the track, the primary button, and small markers. The supporting palette is cream, teal, peach, and lavender.
- The camera seat height, look-ahead, FOV, and minimum speed are tuned. Change them only with a visual pass over the drop, loop, and turn.

## Architecture map

- `src/main.js`: renderer, scene, UI wiring, state machine, ride loop, audio, reduced motion, debug freeze.
- `src/track.js`: data-driven track, `TEST_TRACK_POINTS` and `createTestTrack()`, arc-length sampling, planar and parallel-transport frames, banking, ribbon, ties, rails, start band, `dispose()`.
- `src/stroke.js`: pure stroke pipeline, no DOM. Dedupe, Chaikin smoothing, resampling, rejection reasons, side-view to world mapping.
- `src/draw.js`: draw overlay canvas, pointer capture, single stroke rule, coral preview.
- `src/ride.js`: energy speed model, camera rig, FOV, comfort mode, idle bob, freeze.
- `src/world.js`: sky, sun, mountain rings, river, forest, clouds, start flag, lights.
- `src/style.css`: intro card, draw screen, HUD, progress bar, end screen, responsive layout, reduced motion.
- `playwright.config.js`: browser test config and dev server.
- `tests/smoke.spec.js`: the draw flow, freezes, and the full ride restart.
- `test/stroke.test.js`: pure unit tests for `src/stroke.js`.
- `test/track.test.js`: unit tests for track frames, planar loops, and dispose.
- `docs/design.md`: the math and the reasons behind it.
- `docs/next.md`: the landed drawing layer and the next milestones.

Track frames use parallel transport for tracks with depth, because Frenet twists and flips at the loop. A drawn side-view track is planar (`x = 0`), so it uses the in-plane normal instead. If you change the track points, the frames regenerate from `_computeFrames`. `getFrameAt(u)` is arc-length parameterized; the ride's `t` is a fraction of the total length, so `speed * dt / length` is correct.

## Conventions

- Plain JavaScript, ES modules, two-space indentation, no framework.
- Generate textures and geometry in code. The app ships with no external assets.
- Keep it a single-page Vite app with no backend and no login.
- Use `?t=` freezes for visual checks. They hide the UI.
- A drawn track is planar. Keep its frame in-plane with zero bank until a depth input lands.
- Update the Playwright smoke test and the unit tests when a user-visible flow or the stroke rules change.
- Update `docs/design.md` when a system changes. Update `docs/next.md` when a milestone lands.
- Keep the screenshots in `shots/` and the social image at `public/og.jpg` current when the hero visuals change.

## Repo and deploy

- Push to `main` runs CI and deploys `dist/` to GitHub Pages.
- The production base is `/papercoaster/` in `vite.config.js`.
- The deploy workflow is `.github/workflows/deploy.yml`. The live URL is https://jimmerioles.github.io/papercoaster/.
- Dependabot checks npm and GitHub Actions weekly.

## Next milestone

Read `docs/next.md`. The drawing layer is landed. The next milestones are the thrill score and sharing the stroke in the URL. The acceptance check stays simple: draw a line, ride it, and the drop still makes you smile.
