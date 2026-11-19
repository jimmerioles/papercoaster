# Next milestone: the drawing layer

## Goal

Replace the fixed test track with a track drawn in one stroke, while keeping the current camera feel. The player draws a line, the line becomes a coaster, and the ride starts.

## Definition of done

- A new "Draw" screen captures one pointer stroke from press to release.
- The stroke is smoothed and resampled into a rideable spline.
- The ride uses the same camera rig and speed model as the test track.
- A stroke with a loop produces a loop. The camera goes upside down and the track stays coral.
- The start flag and start band are positioned from the drawn track, not hard-coded.
- `?t=` debug freezes still work on the drawn track.
- `npm run verify` and `npm run test` pass.
- If the draw flow adds a new user-visible screen, the Playwright smoke test covers it.
- The start screen, ride, and end screen are still usable with touch and keyboard.
- The README screenshots and `public/og.jpg` are updated if the hero visuals change.

## Build order

1. **Make the track data-driven.** Add a `Track` factory that accepts points. Keep the current fixed points as `createTestTrack()` for comparison. Move the control points out of the constructor.
2. **Add the draw screen.** A full-screen canvas overlay with a single stroke. Show a faint horizon and a "Draw your line, then ride it" prompt. The start screen's card becomes the intro to this mode.
3. **Smooth the stroke.** Resample the pointer path, apply a moving average or Chaikin, drop points closer than a threshold, and reject strokes shorter than 40 units or with an extreme jump. Use the same centripetal Catmull-Rom.
4. **Map to 3D.** `x = strokeX`, `y = strokeY`, `z = 0` in the side view. The track's start is the first point. The world is built around the track's center.
5. **Move the start markers.** Place the flag at the start frame's position plus a right offset. Add the start band in the track mesh, as now. Remove the fixed flag from `World`.
6. **Wire the ride.** On "Ride", rebuild the track and world markers, reset the ride, and start. Keep the "Redraw" action.
7. **Test the feel.** Draw a drop, a loop, a flat line, a scribble, and a very short line. Tune the smoothing and the minimum speed.
8. **Polish.** Add the single stroke rule (no editing), a "Clear" action, and the end screen with the track length. The thrill score and URL sharing can follow in the next milestone.
9. **Test the flow.** Add a smoke test for the draw screen and the first ride on a drawn track. Keep the existing start and freeze tests.

## Design decisions to keep

- Keep the draw screen in side view for this milestone. It keeps the input legible.
- The track is a spline, not a heightfield. It can cross itself.
- The single stroke is the constraint that makes the toy a creative challenge. Keep editing out of v1.
- The track's width and the camera's seat height are tuned. Change them only with a visual check of the loop.

## Risks

- A self-intersecting stroke can create a spline that clips or twists. Test loops first.
- A very short stroke makes the camera look-ahead too large relative to the track. Clamp the track length and the look-ahead.
- The drawing canvas and the 3D canvas need to share pointer events cleanly. Use one overlay canvas with `pointer-events: auto`, and pause the idle camera while drawing.
- The start flag's outrigger is tied to the test track's edge. Recompute it from the start frame.

## After this

- Thrill score: max speed, airtime, inversions, near misses, smoothness.
- Share: encode the stroke in the URL hash, compress quantized deltas.
- Daily prompt: a date seed and a one-line challenge.
- Postcard: pause, orbit, export a paper-framed PNG.
