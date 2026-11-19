import test from 'node:test';
import assert from 'node:assert/strict';

import {
  chaikin,
  describeStrokeError,
  dropNearDuplicates,
  mapStrokeToWorld,
  polylineLength,
  prepareStroke,
  resample,
} from '../src/stroke.js';

const CANVAS = { width: 1000, height: 600 };

function line(from, to, steps = 80) {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    });
  }
  return points;
}

test('maps the side view to the world valley', () => {
  const points = mapStrokeToWorld(
    [
      { x: 0, y: 600 },
      { x: 1000, y: 0 },
    ],
    CANVAS,
  );

  assert.deepEqual(points[0], { x: 0, y: 6, z: -30 });
  assert.deepEqual(points[1], { x: 0, y: 70, z: 170 });

  const middle = mapStrokeToWorld([{ x: 500, y: 300 }], CANVAS)[0];
  assert.equal(middle.x, 0);
  assert.ok(Math.abs(middle.y - 38) < 1e-9);
  assert.ok(Math.abs(middle.z - 70) < 1e-9);
});

test('builds a smooth, evenly spaced rideable stroke', () => {
  const result = prepareStroke(line({ x: 0, y: 600 }, { x: 1000, y: 0 }), CANVAS);

  assert.equal(result.ok, true);
  assert.equal(result.reason, null);
  assert.ok(result.length > 100);
  assert.ok(result.points.length > 20);

  for (const point of result.points) {
    assert.equal(point.x, 0);
    assert.ok(point.y >= 6 && point.y <= 70);
    assert.ok(point.z >= -30 && point.z <= 170);
  }

  assert.ok(result.points[0].z < -29.9);
  assert.ok(result.points[result.points.length - 1].z > 169.9);

  const gaps = [];
  for (let i = 1; i < result.points.length; i++) {
    gaps.push(polylineLength([result.points[i - 1], result.points[i]]));
  }
  const body = gaps.slice(0, -1);
  assert.ok(body.length > 10);
  for (const gap of body) {
    assert.ok(Math.abs(gap - 2) < 1e-6, `expected even 2 unit spacing, got ${gap}`);
  }
  assert.ok(gaps[gaps.length - 1] <= 2 + 1e-6);
});

test('allows a flat stroke', () => {
  const result = prepareStroke(line({ x: 200, y: 300 }, { x: 800, y: 300 }), CANVAS);

  assert.equal(result.ok, true);
  for (const point of result.points) {
    assert.ok(Math.abs(point.y - 38) < 1e-9);
  }
});

test('rejects a stroke that is too short', () => {
  const result = prepareStroke(line({ x: 200, y: 300 }, { x: 220, y: 300 }), CANVAS);

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'short');
  assert.deepEqual(result.points, []);
});

test('rejects a stroke with a jump between samples', () => {
  const result = prepareStroke(
    [
      { x: 100, y: 300 },
      { x: 450, y: 300 },
    ],
    CANVAS,
  );

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'jump');
});

test('rejects a stroke that leaves the canvas', () => {
  const result = prepareStroke(
    [
      { x: 100, y: 300 },
      { x: -20, y: 300 },
      { x: 200, y: 300 },
    ],
    CANVAS,
  );

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'outside');
});

test('rejects invalid points and canvas sizes', () => {
  assert.equal(prepareStroke([{ x: Number.NaN, y: 300 }], CANVAS).reason, 'invalid');
  assert.equal(prepareStroke(line({ x: 0, y: 0 }, { x: 10, y: 10 }), {}).reason, 'invalid');
  assert.equal(prepareStroke([], CANVAS).reason, 'short');
});

test('drops near-duplicate pointer samples', () => {
  const points = dropNearDuplicates(
    [
      { x: 10, y: 10 },
      { x: 10.2, y: 10.1 },
      { x: 10.1, y: 10.3 },
      { x: 20, y: 20 },
    ],
    1,
  );

  assert.deepEqual(points, [
    { x: 10, y: 10 },
    { x: 20, y: 20 },
  ]);
});

test('chaikin smooths without moving the endpoints', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 12, y: 4 },
    { x: 20, y: 0 },
  ];
  const smoothed = chaikin(points, 2);

  assert.deepEqual(smoothed[0], points[0]);
  assert.deepEqual(smoothed[smoothed.length - 1], points[points.length - 1]);
  assert.ok(smoothed.length > points.length);
});

test('resample keeps the endpoints and the requested spacing', () => {
  const points = [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 10 },
  ];
  const sampled = resample(points, 2);

  assert.equal(sampled.length, 6);
  for (let i = 1; i < sampled.length; i++) {
    assert.ok(Math.abs(sampled[i].z - sampled[i - 1].z - 2) < 1e-9);
  }
});

test('resample and length work without a z coordinate', () => {
  const sampled = resample(
    [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
    ],
    2,
  );

  assert.equal(sampled.length, 6);
  for (const point of sampled) {
    assert.equal('z' in point, false);
  }
  assert.equal(
    polylineLength([
      { x: 0, y: 0 },
      { x: 3, y: 4 },
    ]),
    5,
  );
});

test('describes every rejection reason', () => {
  assert.match(describeStrokeError('outside'), /paper/);
  assert.match(describeStrokeError('short'), /longer/);
  assert.match(describeStrokeError('jump'), /continuous/);
  assert.match(describeStrokeError('cancelled'), /stopped/);
  assert.match(describeStrokeError('invalid'), /could not be read/);
  assert.match(describeStrokeError('unknown'), /could not be read/);
});
