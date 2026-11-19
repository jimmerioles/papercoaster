# Next milestone: the drawing layer

## Goal

Replace the fixed test track with a track drawn in one stroke, while keeping the current camera feel. The player draws a line, the line becomes a coaster, and the ride starts.

## Definition of done

- A new "Draw" screen captures one pointer stroke from press to release, including touch.
- The stroke is smoothed, resampled, and mapped into a rideable spline.
- The ride uses the same camera rig and speed model as the test track.
- A stroke with a loop produces a loop. The camera goes upside down and the track stays coral.
- The start band stays track-relative. The start flag is placed from the start band's frame.
- `?t=` freezes work on the drawn track in the same session. A reload does not reconstruct the stroke yet.
- `npm run verify` and `npm run test` pass.
- The Playwright smoke test covers the new draw screen, the start flow, the three freeze views, and the full ride restart.
- Clear, Redraw, Ride, and the end screen are keyboard accessible. The stroke itself is pointer or touch.
- The README screenshots and `public/og.jpg` are updated if the hero visuals change.

## Build order

1. **Make the track data-driven and disposable.** Move the fixed points out of the constructor into `TEST_TRACK_POINTS` and `createTestTrack()`. Add `constructor(points)`. Add `Track.dispose()` to release the ribbon, tie, rail, and line geometries, the materials, and the canvas texture. Every redraw otherwise leaks a texture and buffers.
2. **Build the pure stroke module first.** Add `src/stroke.js` with no DOM access: drop near-duplicate points, smooth with Chaikin or a moving average, resample to even spacing, reject short or jumpy strokes, map the side view to world points, and return the point array. Add a `test:unit` script with `node --test` and include it in `verify` before any UI work.
3. **Add the draw screen.** New `src/draw.js` plus markup and styles: full-screen overlay canvas, pointer capture, Draw, Clear, Redraw, and Ride. The start card becomes the intro. The stroke is pointer and touch only.
4. **Map to 3D.** Normalize the canvas to `u` left to right and `v` bottom to top. Map `z = lerp(-30, 170, u)`, `y = lerp(6, 70, v)`, and `x = 0`. The world center is around `z = 50`; the ground is at `y = -75`. This is a starting rule. Clamp points to the valley.
5. **Place the start markers.** Keep the start band track-relative. Place the flag from the start band's frame at `u = 0.035`: position it along the frame's right vector at `TRACK_WIDTH / 2 + arm length`, and orient the outrigger to that right vector. Retain the flag group reference so it can move.
6. **Wire the ride.** Change the `track` binding in `src/main.js` to `let`, rebuild the track on Ride, call `track.dispose()` on the old one, assign `ride.track`, and call `ride.reset()`. Extend the state machine with draw and drawn states. Bypass the start card for `?t=`, with the same-session limit from the definition of done.
7. **Test the feel.** Draw a drop, a loop, a flat line, a scribble, and a very short line. Tune the smoothing, minimum speed, and thresholds.
8. **Polish.** Enforce the single stroke rule, add the end screen with the track length, and update the README screenshots if the visuals change. The thrill score and URL sharing stay in the next milestone.
9. **Test the flow.** Keep the `#app canvas` locator so the overlay canvas does not create a strict-mode match. Add a draw and ride test. Keep the three freeze views and the full ride restart test.

## Design rules

- Reject strokes shorter than 60 world units, strokes with a single segment longer than 40 world units, and strokes that leave the canvas. Allow flat strokes; they produce a calm ride.
- Side-view tracks have no horizontal curvature, so v1 has no banked turns. The current bank formula should be quiet at the loop because the heading flip happens where the horizontal factor is near zero, but test the loop entry and exit for a hard roll. A depth input can add banking later.
- The start band is already track-relative. Only the flag needs the start-band placement.
- The draw screen is pointer and touch. The buttons and the end screen are keyboard accessible.
- The smoke test's canvas locator must be `#app canvas`, because the draw overlay adds a second canvas.

## Risks

- A self-intersecting stroke can create a spline that clips or twists. Test loops first.
- A very short stroke makes the camera look-ahead too large relative to the track. Clamp the track length and the look-ahead.
- The drawing canvas and the 3D canvas need to share pointer events cleanly. Use one overlay canvas with `pointer-events: auto`, and pause the idle camera while drawing.
- The start flag's outrigger is tied to the test track's edge. Recompute it from the start band's right vector and the track width.
- The world placement constants are a starting point. A stroke near the top of the canvas can end up above the rings or inside a mountain. Clamp the mapped `y` and `z` to the valley.

## After this

- Thrill score: max speed, airtime, inversions, near misses, smoothness.
- Share: encode the stroke in the URL hash, compress quantized deltas.
- Daily prompt: a date seed and a one-line challenge.
- Postcard: pause, orbit, export a paper-framed PNG.
