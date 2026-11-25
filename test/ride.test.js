import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { Ride } from '../src/ride.js';

const STEP = 1 / 60;

function makeCamera() {
  return new THREE.PerspectiveCamera(68, 16 / 9, 0.1, 3000);
}

function straightTrack(length = 90, height = () => 38) {
  return {
    length,
    getFrameAt(u) {
      const t = THREE.MathUtils.clamp(u, 0, 1);
      return {
        position: new THREE.Vector3(0, height(t), t * length),
        tangent: new THREE.Vector3(0, 0, 1),
        up: new THREE.Vector3(0, 1, 0),
        right: new THREE.Vector3(1, 0, 0),
      };
    },
  };
}

function loopTrack(radius = 10) {
  return {
    length: 120,
    getFrameAt(u) {
      const angle = THREE.MathUtils.clamp(u, 0, 1) * Math.PI * 2;
      return {
        position: new THREE.Vector3(0, Math.cos(angle) * radius, Math.sin(angle) * radius),
        tangent: new THREE.Vector3(0, -Math.sin(angle), Math.cos(angle)),
        up: new THREE.Vector3(0, Math.cos(angle), Math.sin(angle)),
        right: new THREE.Vector3(1, 0, 0),
      };
    },
  };
}

test('holds at the start until it starts, then finishes at the end', () => {
  const ride = new Ride(straightTrack(), makeCamera());

  ride.update(STEP);
  assert.equal(ride.t, 0);
  assert.equal(ride.speed, 0);
  assert.equal(ride.started, false);

  ride.start();
  assert.equal(ride.started, true);
  assert.equal(ride.speed, 4);

  let steps = 0;
  let previousT = ride.t;
  while (!ride.finished && steps < 10_000) {
    ride.update(STEP);
    assert.ok(ride.t >= previousT);
    previousT = ride.t;
    steps++;
  }

  assert.ok(steps < 10_000);
  assert.equal(ride.finished, true);
  assert.equal(ride.t, 1);
  assert.ok(ride.maxSpeed > 10);
  assert.ok(ride.maxSpeed <= ride.maxSpeedLimit);

  const frozen = { t: ride.t, speed: ride.speed, maxSpeed: ride.maxSpeed };
  ride.update(STEP);
  assert.equal(ride.t, frozen.t);
  assert.equal(ride.speed, frozen.speed);
  assert.equal(ride.maxSpeed, frozen.maxSpeed);
});

test('keeps speed, progress, and the camera bounded through the ride', () => {
  const track = straightTrack(140);
  const camera = makeCamera();
  const ride = new Ride(track, camera);

  ride.start();

  let previousT = 0;
  let previousMax = 0;
  while (!ride.finished) {
    ride.update(STEP);

    const frame = track.getFrameAt(ride.t);
    assert.ok(Number.isFinite(ride.speed));
    assert.ok(ride.speed > 0);
    assert.ok(ride.speed <= ride.maxSpeedLimit);
    assert.ok(ride.t >= previousT && ride.t <= 1);
    assert.ok(ride.maxSpeed >= previousMax);
    assert.ok(ride.maxSpeed <= ride.maxSpeedLimit);
    assert.ok(Math.abs(camera.position.distanceTo(frame.position) - 2.2) < 1e-9);
    assert.ok(Math.abs(camera.up.length() - 1) < 1e-9);
    assert.ok(camera.fov >= ride.baseFov && camera.fov <= ride.baseFov + 16);

    previousT = ride.t;
    previousMax = ride.maxSpeed;
  }
});

test('comfort mode keeps the camera upright through a loop', () => {
  const track = loopTrack();

  const rawCamera = makeCamera();
  const rawRide = new Ride(track, rawCamera);
  rawRide.freezeAt(0.5);

  assert.equal(rawRide.finished, true);
  assert.ok(rawCamera.up.y < -0.9);

  const comfortCamera = makeCamera();
  const comfortRide = new Ride(track, comfortCamera);
  comfortRide.comfort = true;
  comfortRide.freezeAt(0.5);

  assert.ok(comfortCamera.up.y > 0.9);
  assert.ok(Math.abs(comfortCamera.up.length() - 1) < 1e-9);
  assert.ok(
    Math.abs(comfortCamera.position.distanceTo(track.getFrameAt(0.5).position) - 2.2) < 1e-9,
  );
});

test('freezing pins the ride at a track fraction', () => {
  const track = straightTrack(120);
  const ride = new Ride(track, makeCamera());

  ride.start();
  ride.update(STEP);
  ride.freezeAt(0.42);

  assert.equal(ride.t, 0.42);
  assert.equal(ride.speed, 24);
  assert.equal(ride.finished, true);

  const frozen = { t: ride.t, speed: ride.speed };
  ride.update(1);
  assert.equal(ride.t, frozen.t);
  assert.equal(ride.speed, frozen.speed);
});

test('a drop builds more speed than a flat run', () => {
  const flat = new Ride(
    straightTrack(200, () => 60),
    makeCamera(),
  );
  const drop = new Ride(
    straightTrack(200, (u) => 60 - 60 * u),
    makeCamera(),
  );

  flat.start();
  drop.start();

  for (let i = 0; i < 240; i++) {
    flat.update(STEP);
    drop.update(STEP);
  }

  assert.ok(drop.speed > 20);
  assert.ok(flat.speed < 16);
  assert.ok(drop.speed > flat.speed * 1.5);
});

test('idles above the track with a gentle bob', () => {
  const track = straightTrack(100);
  const camera = makeCamera();
  const ride = new Ride(track, camera);

  ride.idle(0);
  const base = camera.position.distanceTo(track.getFrameAt(0).position);
  assert.ok(Math.abs(base - 2.2) < 1e-9);
  assert.equal(camera.fov, ride.baseFov);
  assert.equal(ride.t, 0);
  assert.equal(ride.started, false);

  ride.idle(1);
  const bobbed = camera.position.distanceTo(track.getFrameAt(0).position);
  assert.ok(bobbed > base);
  assert.ok(bobbed < base + 0.07);
});
