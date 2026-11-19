# Agent guide

## What this is

Papercoaster: draw one line, it becomes a rollercoaster through a paper diorama, then ride it. The current build is the v0.1.0 feel test. The track is fixed. The next milestone is the drawing layer.

Read `README.md` for the product and commands. Read `docs/design.md` before changing the camera, track, or world. Read `docs/next.md` before starting the drawing layer.

## Run and verify

- `npm install` for a local checkout. `npm ci` for a clean, reproducible install.
- `npm run dev` starts Vite at http://localhost:5173.
- `npm run build` is the build gate.
- `npm run lint` and `npm run format:check` are the quality gates. All three must pass before a commit.
- Visual check: open the app, click "Ride the test track", and inspect four moments:
  - Start: the track, flag, layered mountains, and river.
  - Drop: `?t=0.18` shows the red ribbon, river, and forest from above.
  - Loop: `?t=0.48` is upside down. The track stays coral.
  - Turn: `?t=0.66` banks into the turn.
- The console should be clean. The favicon is inline, so a favicon 404 means the HTML regressed.

The ride runs at full speed only in an active tab. Background tabs throttle `requestAnimationFrame`. Use the `?t` freezes for layout checks and a foreground tab for feel checks.

## Feel rules

The ride is a spline plus a speed model, not a physics simulation. Keep the camera first: if a change hurts the drop, loop, or turn, revert it.

- The camera sits 2.2 units above the track, looks ahead along the curve, and rolls with the track's bank.
- `C` toggles comfort view, and `prefers-reduced-motion` enables it by default. Keep both working.
- The track stays on `MeshBasicMaterial` with a procedural paper texture. A lit material goes dark at the top of the loop.
- The paper look is flat colors, layered silhouettes, and no external assets. Generate new textures and geometry in code.
- Coral is the accent: the track, the primary button, and small markers. The supporting palette is cream, teal, peach, and lavender.
- The camera seat height, look-ahead, FOV, and minimum speed are tuned. Change them only with a visual pass over the drop, loop, and turn.

## Architecture map

- `src/main.js`: renderer, scene, UI wiring, ride loop, audio, reduced motion, debug freeze.
- `src/track.js`: fixed control points, arc-length sampling, parallel transport frames, banking, ribbon, ties, rails, start band.
- `src/ride.js`: energy speed model, camera rig, FOV, comfort mode, idle bob, freeze.
- `src/world.js`: sky, sun, mountain rings, river, forest, clouds, start flag, lights.
- `src/style.css`: title card, HUD, progress bar, responsive layout, reduced motion.
- `docs/design.md`: the math and the reasons behind it.
- `docs/next.md`: the drawing-layer milestone with acceptance criteria and build order.

Track frames use parallel transport, not Frenet frames, because Frenet twists and flips at the loop. If you change the track points, the frames regenerate from `_computeFrames`. `getFrameAt(u)` is arc-length parameterized; the ride's `t` is a fraction of the total length, so `speed * dt / length` is correct.

## Conventions

- Plain JavaScript, ES modules, two-space indentation, no framework.
- Generate textures and geometry in code. The app ships with no external assets.
- Keep it a single-page Vite app with no backend and no login.
- Use `?t=` freezes for visual checks. They hide the UI.
- Update `docs/design.md` when a system changes. Update `docs/next.md` when a milestone lands.
- Keep the screenshots in `shots/` and the social image at `public/og.jpg` current when the hero visuals change.

## Repo and deploy

- Push to `main` runs CI and deploys `dist/` to GitHub Pages.
- The production base is `/papercoaster/` in `vite.config.js`.
- The deploy workflow is `.github/workflows/deploy.yml`. The live URL is https://jimmerioles.github.io/papercoaster/.
- Dependabot checks npm and GitHub Actions weekly.

## Next milestone

Read `docs/next.md`. Replace the fixed track with a single-stroke drawn track while keeping the current camera feel. The first acceptance check is simple: draw a line, ride it, and the drop still makes you smile.
