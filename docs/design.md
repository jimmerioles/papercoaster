# Design notes

## The idea

A rollercoaster is a line with physics. Papercoaster makes the line the input: one stroke becomes the track, the terrain, and the ride. The player draws, then feels their own drawing in their stomach.

The current build is the v0.1.0 feel test. The track is fixed. The drawing layer is the next milestone.

## The experience

1. Draw one line in the sky.
2. The line becomes a rollercoaster through a paper diorama.
3. Ride it in first person.
4. Share the track as a link.

The feel test covers steps 2 and 3 with a fixed track.

## The track

`src/track.js` owns the geometry.

- Control points are a `CatmullRomCurve3` with `centripetal` parameterization. This avoids the overshoot that makes loops clip.
- `arcLengthDivisions = 4000`. All sampling uses `getPointAt(u)` and `getTangentAt(u)`, so `u` is arc length.
- The ride advances `t` by `speed * dt / length`, so speed maps directly to distance.
- Frames are built with parallel transport, not Frenet frames. Frenet frames twist and flip at the loop. Parallel transport projects the previous up vector onto the plane perpendicular to the tangent.
- Bank comes from horizontal curvature: `clamp(curvature * 24^2 * 0.01 * horizontal, -0.6, 0.6)`. The banked up vector is the transport up rotated toward the right vector.
- The ribbon is 2.6 units wide. The rails sit at ±0.82. The ties are thin quads every 4 samples. The start band is a cream quad from `u = 0.035` to `0.0375`.
- The track uses `MeshBasicMaterial` with a procedural paper texture. A lit material goes dark at the top of the loop, which kills the read. Flat paper shading keeps the coral consistent upside down.

## The ride

`src/ride.js` owns the camera.

- Speed comes from energy conservation: `v = sqrt(max(vMin^2, v0^2 + 2g(h0 - h)))`, smoothed with `1 - exp(-dt * 4)`, with light drag and a 52 m/s cap. The minimum speed is a deliberate cheat so loops always complete.
- The camera sits 2.2 units above the track. It looks ahead by `clamp(0.02 + speed * 0.0008, 0.02, 0.06)` of the track, and its up vector is the track's banked up.
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
- Start flag: a small pole on an outrigger at the track's edge. It is hard-coded to the test track's start. The drawing layer must move or remove it.
- Lights: a warm hemisphere, a key directional, and a cool fill. Most paper surfaces are `MeshBasicMaterial`; the forest and ground are lit.

## The look

- Palette: cream `#fff7eb`, coral `#e85d3f`, ink `#2f4f4f`, teal `#3f6f6a`, peach `#ffd3a3`, lavender `#a894c4`.
- No external assets. Textures are canvas-generated. Geometry is procedural.
- The accent is coral. The track owns it. Everything else is a supporting color.
- Fog is `FogExp2(0xffd3a3, 0.0015)`. The paper layers stay crisp, then fade into the sky.
- The UI is a cream card with a serif title, a coral button, a speed pill, a progress bar, and a mute control.

## The drawing layer

The plan is in `docs/next.md`. The key design decisions:

- Draw in a side view. Normalize the canvas to `u` left to right and `v` bottom to top. Map `z = lerp(-30, 170, u)`, `y = lerp(6, 70, v)`, and `x = 0`. The world center is around `z = 50`; the ground is at `y = -75`. This is a starting rule; clamp the mapped points to the valley.
- A side-view track has no horizontal curvature, so v1 has no banked turns. The current bank formula should be quiet at the loop because the heading flip happens where the horizontal factor is near zero, but test the loop entry and exit for a hard roll. A later milestone can add depth by mapping a second input (pressure, stroke speed, or a slider) to world X.
- The start band is already track-relative. Only the flag needs the start-band placement.
- The draw screen is pointer and touch. The buttons and the end screen are keyboard accessible.
- `?t=` works on a drawn track only in the same session. The stroke is not encoded yet; sharing is a later milestone.
- The fixed points stay as `createTestTrack()` for tests and comparison, not a user-facing mode.

## Testing

The automated gates are `npm run verify` (format, lint, build) and `npm run test` (Playwright). The smoke test covers the start screen, the ride start, the speed HUD, the progress bar, the three freeze views, and the full ride restart. It fails on any page error or console error during the start flow.

The visual composition is still checked by eye with the `?t` freezes. Background tabs throttle animation, so the ride feel must be checked in a foreground tab. When `src/stroke.js` lands, add `node --test` coverage and include it in `verify`.

## Constraints

- Single-page Vite app. No backend, no login, no external assets.
- The ride is a spline plus a speed model. No physics engine.
- The build, lint, format, and Playwright smoke test are the automated gates. The visual composition is still manual.
- The app works on a laptop trackpad and on a touch screen. The ride is automatic; the drawing is the only input.

## Open questions

- Should a side-view track get a synthetic bank from vertical curvature, or wait for a depth input?
- How should the drawn stroke be encoded in the URL, and how short can the link stay?
- How should the thrill score weight speed, airtime, inversions, near misses, and smoothness?
