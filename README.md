# Papercoaster

Draw a line. Ride it.

A three.js side project: turn a single stroke into a rollercoaster through a paper diorama, then ride it in first person.

This is the feel test. The track is fixed. The drawing layer comes next.

![Papercoaster start screen](shots/start.jpg)

![The first drop](shots/drop.jpg)

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Controls

- Click "Ride the test track" to start.
- `C` toggles comfort view (horizon lock).
- `R` restarts the ride.
- Add `?t=0.48` to the URL to freeze the camera at a point on the track. Useful for inspecting the loop and the turn.

## What is in the test

- A fixed track with a drop, a vertical loop, and a banked turn.
- A POV camera with speed-based FOV, look-ahead, and banking.
- A paper world: layered mountain rings, a winding river, a paper forest, clouds, a sun, and a start flag.
- A speed HUD, progress bar, sound toggle, and procedural wind.
- Debug frames: [loop](shots/loop.jpg), [banked turn](shots/turn.jpg).

## Known rough edges

- The tab must be visible for the ride to run at full speed. Background tabs throttle animation.
- The first drop is hidden by the title card until the ride starts.
- The drawing layer, thrill score, and URL sharing are not built yet.

## Next

1. **Draw.** A full-screen stroke canvas over the scene. Smooth, simplify, and turn the stroke into a 3D spline.
2. **Ride.** Reuse the camera rig on the drawn track. Add the single stroke constraint.
3. **Score.** Max speed, airtime, inversions, near misses, and smoothness.
4. **Share.** Encode the stroke in the URL so a friend can ride the same track.
