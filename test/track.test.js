import test from 'node:test';
import assert from 'node:assert/strict';

import { TEST_TRACK_POINTS, Track, createTestTrack } from '../src/track.js';
import { prepareStroke } from '../src/stroke.js';

globalThis.document = {
  createElement() {
    return {
      width: 0,
      height: 0,
      getContext() {
        return {
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 1,
          fillRect() {},
          beginPath() {},
          moveTo() {},
          lineTo() {},
          stroke() {},
        };
      },
    };
  },
};

const LOOP_STROKE = [
  [0.08, 0.8],
  [0.2, 0.72],
  [0.3, 0.64],
  [0.38, 0.62],
  [0.48, 0.56],
  [0.55, 0.42],
  [0.53, 0.3],
  [0.44, 0.26],
  [0.35, 0.32],
  [0.31, 0.45],
  [0.33, 0.56],
  [0.38, 0.62],
  [0.5, 0.7],
  [0.62, 0.72],
  [0.74, 0.64],
  [0.86, 0.54],
];

function makeLoopTrack() {
  const width = 1280;
  const height = 720;
  const raw = LOOP_STROKE.map(([u, v]) => ({ x: u * width, y: v * height }));
  const stroke = prepareStroke(raw, { width, height });
  assert.equal(stroke.ok, true);
  return new Track(stroke.points);
}

test('keeps the test track data-driven and non-planar', () => {
  const track = createTestTrack();

  assert.equal(track.planar, false);
  assert.equal(track.points.length, TEST_TRACK_POINTS.length);
  assert.ok(track.length > 250);
  assert.equal(track.samples, 1800);

  track.points[0].x = 99;
  assert.equal(TEST_TRACK_POINTS[0][0], 0);

  track.dispose();
});

test('gives a planar loop an in-plane frame with zero bank', () => {
  const track = makeLoopTrack();

  assert.equal(track.planar, true);
  assert.ok(track.length > 60);

  let highest = -1;
  let lowest = 1;
  for (const frame of track.frames) {
    assert.equal(frame.bank, 0);
    assert.ok(Math.abs(frame.right.x - 1) < 1e-9);
    assert.ok(Math.abs(frame.right.length() - 1) < 1e-9);
    assert.ok(Math.abs(frame.up.length() - 1) < 1e-9);
    assert.ok(Math.abs(frame.tangent.length() - 1) < 1e-9);
    highest = Math.max(highest, frame.up.y);
    lowest = Math.min(lowest, frame.up.y);
  }

  assert.ok(highest > 0.9, 'the loop should start upright');
  assert.ok(lowest < -0.9, 'the loop should go upside down');

  const frame = track.getFrameAt(0.5);
  assert.ok(Math.abs(frame.up.length() - 1) < 1e-9);
  assert.ok(Math.abs(frame.right.length() - 1) < 1e-9);

  track.dispose();
});

test('disposes every geometry, material, and texture', () => {
  const track = new Track([
    [0, 10, -20],
    [0, 24, 20],
    [0, 12, 60],
  ]);
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  track.mesh.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    if (!child.material) return;
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      materials.add(material);
      for (const key of Object.keys(material)) {
        if (material[key]?.isTexture) textures.add(material[key]);
      }
    }
  });

  let geometriesDisposed = 0;
  let materialsDisposed = 0;
  let texturesDisposed = 0;
  for (const geometry of geometries) {
    geometry.addEventListener('dispose', () => geometriesDisposed++);
  }
  for (const material of materials) {
    material.addEventListener('dispose', () => materialsDisposed++);
  }
  for (const texture of textures) {
    texture.addEventListener('dispose', () => texturesDisposed++);
  }

  track.dispose();

  assert.ok(geometries.size > 0);
  assert.ok(materials.size > 0);
  assert.ok(textures.size > 0);
  assert.equal(geometriesDisposed, geometries.size);
  assert.equal(materialsDisposed, materials.size);
  assert.equal(texturesDisposed, textures.size);
  assert.equal(track.mesh.children.length, 0);
});

test('rejects a track that cannot form a curve', () => {
  assert.throws(() => new Track([[0, 0, 0]]), /at least two points/);
  assert.throws(
    () =>
      new Track([
        [0, 0, 0],
        [0, 0, 0],
      ]),
    /non-zero length/,
  );
});
