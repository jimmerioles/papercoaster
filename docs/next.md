# Milestone: the drawing layer

**Status:** landed on `feat/drawing-layer`, awaiting review. The next milestone is the thrill score and sharing.

## Goal

Replace the fixed test track with a track drawn in one stroke, while keeping the camera feel. The player draws a line, the line becomes a coaster, and the ride starts.

## Definition of done

- [x] A Draw screen captures one pointer stroke from press to release, including touch.
- [x] The stroke is smoothed, resampled, and mapped into a rideable spline.
- [x] The ride uses the same camera rig and speed model as the test track.
- [x] A stroke with a loop produces a loop. The camera goes upside down and the track stays coral.
- [x] The start band is track-relative. The start flag is placed from the start band's frame.
- [x] `?t=` freezes work on the drawn track in the same session. The query is read again when a drawn track starts. A reload does not reconstruct the stroke.
- [x] `npm run verify` and `npm run test` pass.
- [x] The Playwright smoke test covers the draw screen, the start flow, the three test-track freeze views, a drawn freeze, and the full ride restart.
- [x] Clear, Redraw, Ride, and the end screen are keyboard accessible. The stroke itself is pointer or touch.
- [ ] The README screenshots and `public/og.jpg` are updated if the hero visuals change. The start screenshot is updated; the social image still shows the same drop.

## What landed

1. **Data-driven track.** `Track` takes a point array. `TEST_TRACK_POINTS` and `createTestTrack()` hold the feel-test track. `Track.dispose()` releases every geometry, material, and the canvas texture.
2. **Pure stroke module.** `src/stroke.js` drops near-duplicates, smooths with Chaikin, resamples to 2 world units, rejects short, jumpy, and off-canvas strokes, and maps the side view into the valley. `npm run test:unit` uses `node --test` and runs inside `verify`.
3. **Draw screen.** `src/draw.js` owns the overlay canvas, pointer capture, the single stroke rule, cancel handling, resize rescaling, and the coral preview. `index.html` and `src/style.css` add the intro, draw, and end screens.
4. **World mapping.** `z = lerp(-30, 170, u)`, `y = lerp(6, 70, v)`, `x = 0`. The mapped points stay inside the near mountain ring and above the ground plane.
5. **Start markers.** The start band is still track-relative. `World.placeStartFlag(track)` places the flag from the start band frame at `u = 0.035` and reorients the outrigger.
6. **Ride wiring.** `main.js` builds a new `Track` on Ride, keeps the old one alive until the new one exists, then disposes it, moves the flag, assigns `ride.track`, and resets the ride. The state machine is `idle`, `draw`, `drawn`, `riding`, `done`, and `frozen`.
7. **Feel pass.** A drawn loop inverts the camera. The ribbon stays coral. Flat strokes produce a calm ride.
8. **Polish.** The single stroke rule is enforced. The end screen shows top speed and track length. Clear and Redraw are wired. Focus moves to the draw region and the end screen primary action.
9. **Test flow.** CI runs the Playwright suite, which uses `#app canvas` so the overlay canvas cannot create a strict-mode match. Every smoke test fails on page or console errors. Unit tests cover the stroke rules and the planar track frame and dispose contract. Local browser QA uses browse or a normal browser window to avoid software WebGL heat.

## Decisions

- A side-view track is planar (`x = 0`). It uses the in-plane normal `up = normalize(0, tangent.z, -tangent.y)`, `right = +X`, and zero bank. Parallel transport is kept for tracks with depth, including the test track. This avoids the fallback flip and the bank spike that a vertical loop would otherwise cause.
- The draw screen pauses the 3D render. The overlay is nearly opaque, so this saves frames while drawing.
- A rejected stroke clears itself and shows the reason. A valid stroke locks further pointer input until Clear. Pointer cancel and lost capture discard the stroke. Window resize rescales the stored points and rechecks the result.
- Focus moves to the draw region when it opens and to the end screen primary action when a ride finishes.
- The start card is the intro. The test track has no user-facing button. `?t=` still bypasses the intro and shows the test track, because a reload has no stroke to rebuild.

## Next

- Thrill score: max speed, airtime, inversions, near misses, smoothness.
- Share: encode the stroke in the URL hash, compress quantized deltas.
- Daily prompt: a date seed and a one-line challenge.
- Postcard: pause, orbit, export a paper-framed PNG.
- Depth input: pressure, stroke speed, or a slider mapped to world X, which would also bring banked turns back.
