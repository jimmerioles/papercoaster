# Design notes

## The idea

A rollercoaster is a line with physics. Papercoaster makes the line the input: one stroke becomes the track, the terrain, and the ride. The player draws, then feels their own drawing in their stomach.

The current build adds the drawing layer on top of the v0.1.0 feel test.

## The experience

1. Draw one line in the sky.
2. The line becomes a rollercoaster through a paper diorama.
3. Ride it in first person.
4. Share the track as a link.

The drawing layer covers steps 1 to 3. Sharing is a later milestone.

## The track

`src/track.js` owns the geometry.

- `Track` is data-driven. `new Track(points)` accepts `Vector3` values or `[x, y, z]` arrays. `TEST_TRACK_POINTS` and `createTestTrack()` keep the fixed feel-test track for the `?t=` views and for comparison. They are not a user-facing mode.
- Control points are a `CatmullRomCurve3` with `centripetal` parameterization. This avoids the overshoot that makes loops clip.
- `arcLengthDivisions = 4000`. All sampling uses `getPointAt(u)` and `getTangentAt(u)`, so `u` is arc length.
- The sample count scales with the track: `clamp(ceil(length * 8), 240, 1800)`. A short drawn line still gets enough frames for a smooth ribbon.
- The ride advances `t` by `speed * dt / length`, so speed maps directly to distance.
- A drawn side-view track has `x = 0` at every point. These planar tracks use the in-plane normal `up = normalize(0, tangent.z, -tangent.y)` and `right = +X`, with zero bank. This keeps a loop smooth through vertical tangents. Parallel transport has a degenerate projection at a vertical tangent, and the bank formula spikes when the heading flips, so both are wrong for this case.
- Tracks with depth (the test track, and any later stroke with world X) still use parallel transport. Frenet frames twist and flip at the loop, so they are never used. Parallel transport projects the previous up vector onto the plane perpendicular to the tangent.
- Bank for depth tracks comes from horizontal curvature: `clamp(curvature * 24^2 * 0.01 * horizontal, -0.6, 0.6)`. The banked up vector is the transport up rotated toward the right vector.
- The ribbon is 2.6 units wide. The rails sit at ±0.82. The ties are thin quads every 4 samples. The start band is a cream quad from `u = 0.035` to `0.0375`.
- The track uses `MeshBasicMaterial` with a procedural paper texture. A lit material goes dark at the top of the loop, which kills the read. Flat paper shading keeps the coral consistent upside down.
- `Track.dispose()` releases every child geometry, every material, and any material texture. A redraw builds the next track before disposing the old one, so a new line never inherits stale buffers or a canvas texture.

## The ride

`src/ride.js` owns the camera.

- Speed comes from energy conservation: `v = sqrt(max(vMin^2, v0^2 + 2g(h0 - h)))`, smoothed with `1 - exp(-dt * 4)`, with light drag and a 52 m/s cap. The minimum speed is a deliberate cheat so loops always complete.
- The camera sits 2.2 units above the track. It looks ahead by `clamp(0.02 + speed * 0.0008, 0.02, 0.06)` of the track, and its up vector is the track's up. For a planar drawn track that up comes from the in-plane normal, so a drawn loop rolls the camera through upside down without banking the ribbon.
- FOV is `68 + (speed / 52) * 16`. The interpolation is frame-rate independent.
- Comfort mode blends the up vector toward world up by 0.68, projects it perpendicular to the view, and holds the FOV at 68. It is the horizon lock for motion-sensitive riders.
- The idle camera bobs at the start line. The debug freeze (`?t=`) uses a nominal speed, so the FOV and bank are representative.

## The world

`src/world.js` owns the diorama.

- Sky: a 1200-unit sphere with a local-space gradient shader, centered on the camera each frame.
- Sun: a canvas radial-gradient sprite at a fixed offset from the camera. The glow is hard-edged enough to read as a paper sun.
- Mountains: three concentric `CylinderGeometry` rings with the top ring displaced by a ridge function. The inner wall uses `BackSide`, a flat color, a vertex-color gradient, and fog. The rings are at 240, 400, and 620 units.
- River: a ribbon built from a `CatmullRomCurve3` on the valley floor, with cream bank lines.
- Forest: 2,200 instanced cones with per-instance colors, scattered inside the near ring and kept away from the river.
- Clouds: flat cream clusters of low-poly spheres, placed high and far so they do not block the track.
- Start flag: a small pole on an outrigger. `placeStartFlag(track)` puts it on the start band frame at `u = 0.035`, along the frame's right vector at `TRACK_WIDTH / 2 + 1.6`, and orients the outrigger with the frame basis. The flag group is retained so it moves with each drawn track.
- Lights: a warm hemisphere, a key directional, and a cool fill. Most paper surfaces are `MeshBasicMaterial`; the forest and ground are lit.

## The look

- Palette: cream `#fff7eb`, coral `#e85d3f`, ink `#2f4f4f`, teal `#3f6f6a`, peach `#ffd3a3`, lavender `#a894c4`.
- No external assets. Textures are canvas-generated. Geometry is procedural.
- The accent is coral. The track owns it. Everything else is a supporting color.
- Fog is `FogExp2(0xffd3a3, 0.0015)`. The paper layers stay crisp, then fade into the sky.
- The UI is a cream card with a serif title, a coral button, a speed pill, a progress bar, and a mute control. The draw screen is ruled paper with a coral stroke and a cream tool card.

## The drawing layer

`src/draw.js` owns the screen. `src/stroke.js` owns the math and has no DOM access.

- The intro card opens the draw screen. The overlay canvas captures one primary pointer stroke with pointer capture. The stroke is pointer and touch only; the buttons are native and keyboard accessible.
- The draw screen has Clear and Ride. Clear removes the stroke and returns to the draw state. Ride builds a new `Track`, disposes the old one, moves the flag, assigns `ride.track`, and restarts. The end screen has Redraw and Ride again.
- While the draw screen is open, the 3D scene is paused. The overlay covers it, so rendering the diorama underneath would only spend frames.
- The pipeline drops near-duplicate samples (0.75 canvas px), smooths with two Chaikin passes, resamples to 2 world units, and maps the side view to the valley: `z = lerp(-30, 170, u)`, `y = lerp(6, 70, v)`, `x = 0`. The world center is around `z = 50`; the ground is at `y = -75`.
- A stroke is rejected if it leaves the canvas, has a segment longer than 40 world units, or measures less than 60 world units. Flat strokes are allowed and produce a calm ride. The rejection reason is shown under the buttons.
- The single stroke rule is enforced after a valid stroke: further pointer input is ignored until Clear. An invalid attempt clears itself so the player can try again immediately.
- `?t=` freezes the test track on load. The query is read again when a drawn track starts, so a same-session URL change freezes the drawn line. A reload cannot reconstruct the stroke yet.
- The fixed points stay as `createTestTrack()` for tests and comparison, not a user-facing mode.

## Testing

The automated gates are `npm run verify` (format, lint, `node --test`, build) and `npm run test` (Playwright). The unit tests cover the stroke pipeline and its rejection rules. The smoke test covers the intro, the draw screen, a rejected short stroke, Clear, a drawn ride, the speed HUD, the progress bar, a same-session drawn freeze, the three test-track freeze views, and the full ride restart with R. It fails on any page error or console error during the draw and start flow.

The visual composition is still checked by eye with the `?t` freezes and with drawn loop freezes. Background tabs throttle animation, so the ride feel must be checked in a foreground tab. The test-track freezes stay available through `?t=` after reload.

## Constraints

- Single-page Vite app. No backend, no login, no external assets.
- The ride is a spline plus a speed model. No physics engine.
- The build, lint, format, unit test, and Playwright smoke test are the automated gates. The visual composition is still manual.
- The app works on a laptop trackpad and on a touch screen. The ride is automatic; drawing is the only input.

## Open questions

- Should side-view tracks get a synthetic bank from vertical curvature, or wait for a depth input? v1 uses zero bank and relies on the in-plane normal for the loop.
- How should the drawn stroke be encoded in the URL, and how short can the link stay?
- How should the thrill score weight speed, airtime, inversions, near misses, and smoothness?
