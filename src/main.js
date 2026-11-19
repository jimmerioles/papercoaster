import * as THREE from 'three';
import { Track, createTestTrack } from './track.js';
import { World } from './world.js';
import { Ride } from './ride.js';
import { DrawScreen } from './draw.js';
import { describeStrokeError } from './stroke.js';
import './style.css';

const app = document.querySelector('#app');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1;
app.appendChild(renderer.domElement);
renderer.domElement.setAttribute('role', 'img');
renderer.domElement.setAttribute(
  'aria-label',
  'A first-person rollercoaster ride through a paper diorama.',
);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xffd3a3, 0.0015);

const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 3000);

const world = new World(scene);
let track = createTestTrack();
scene.add(track.mesh);
world.placeStartFlag(track);
const ride = new Ride(track, camera);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
ride.comfort = reducedMotion.matches;
reducedMotion.addEventListener('change', (event) => {
  ride.comfort = event.matches;
});

function readFreezeT() {
  const raw = new URLSearchParams(window.location.search).get('t');
  if (raw === null) return null;
  const parsed = parseFloat(raw);
  return Number.isFinite(parsed) ? THREE.MathUtils.clamp(parsed, 0, 1) : null;
}

const freezeT = readFreezeT();

const ui = {
  startScreen: document.querySelector('#start-screen'),
  drawScreen: document.querySelector('#draw-screen'),
  endScreen: document.querySelector('#end-screen'),
  hud: document.querySelector('#hud'),
  startButton: document.querySelector('#start-button'),
  drawCanvas: document.querySelector('#draw-canvas'),
  clearButton: document.querySelector('#clear-button'),
  rideDrawnButton: document.querySelector('#ride-drawn-button'),
  drawStatus: document.querySelector('#draw-status'),
  redrawButton: document.querySelector('#redraw-button'),
  againButton: document.querySelector('#again-button'),
  speedValue: document.querySelector('#speed-value'),
  maxSpeed: document.querySelector('#max-speed'),
  trackLength: document.querySelector('#track-length'),
  progressFill: document.querySelector('#progress-fill'),
  muteButton: document.querySelector('#mute-button'),
  muteIcon: document.querySelector('#mute-icon'),
};

let state = 'idle';
let lastStroke = null;
let audio = null;
let audioClock = 0;
let muted = false;

const drawScreen = new DrawScreen(ui.drawCanvas, { onChange: handleStrokeChange });

function setState(next) {
  const wasDrawing = state === 'draw' || state === 'drawn';
  state = next;

  const drawing = state === 'draw' || state === 'drawn';
  const riding = state === 'riding';
  const done = state === 'done';

  if (wasDrawing && !drawing) {
    drawScreen.close();
  }

  ui.startScreen.classList.toggle('hidden', state !== 'idle');
  ui.drawScreen.classList.toggle('hidden', !drawing);
  ui.drawScreen.setAttribute('aria-hidden', String(!drawing));
  ui.endScreen.classList.toggle('hidden', !done);
  ui.hud.classList.toggle('hidden', !riding);
  ui.hud.setAttribute('aria-hidden', String(!riding));
  ui.muteButton.classList.toggle('hidden', !(riding || done));

  if (drawing && !wasDrawing) {
    requestAnimationFrame(() => {
      if (state === 'draw' || state === 'drawn') ui.drawScreen.focus();
    });
  }

  if (done) {
    ui.maxSpeed.textContent = Math.round(ride.maxSpeed * 3.6);
    ui.trackLength.textContent = Math.round(track.length);
    fadeAudioOut();
    requestAnimationFrame(() => {
      if (state === 'done') ui.againButton.focus();
    });
  }
}

function handleStrokeChange(result) {
  if (state !== 'draw' && state !== 'drawn') return;

  if (result.ok) {
    lastStroke = result;
    ui.clearButton.disabled = false;
    ui.rideDrawnButton.disabled = false;
    ui.drawStatus.textContent = `${Math.round(result.length)} m of track. Ready when you are.`;
    setState('drawn');
    return;
  }

  lastStroke = null;
  ui.clearButton.disabled = true;
  ui.rideDrawnButton.disabled = true;
  ui.drawStatus.textContent = result.reason ? describeStrokeError(result.reason) : '';
  setState('draw');
}

function openDrawScreen() {
  drawScreen.open();
  lastStroke = null;
  ui.clearButton.disabled = true;
  ui.rideDrawnButton.disabled = true;
  ui.drawStatus.textContent = '';
  fadeAudioOut();
  setState('draw');
}

function startRide() {
  if (state === 'riding') return;

  ride.reset();
  ride.start();
  ui.progressFill.style.width = '0%';
  ui.speedValue.textContent = '0';
  setState('riding');
  startAudio();
}

function rideDrawnTrack() {
  if (!lastStroke?.ok) return;

  let nextTrack;
  try {
    nextTrack = new Track(lastStroke.points);
  } catch (error) {
    console.error(error);
    ui.drawStatus.textContent = 'That line could not become a track. Draw it again.';
    return;
  }

  scene.remove(track.mesh);
  track.dispose();
  track = nextTrack;
  scene.add(track.mesh);
  world.placeStartFlag(track);
  ride.track = track;

  const drawnFreeze = readFreezeT();
  if (drawnFreeze !== null) {
    ride.freezeAt(drawnFreeze);
    setState('frozen');
  } else {
    startRide();
  }
}

ui.startButton.addEventListener('click', openDrawScreen);
ui.rideDrawnButton.addEventListener('click', rideDrawnTrack);
ui.clearButton.addEventListener('click', () => {
  drawScreen.clear();
  ui.drawScreen.focus();
});
ui.redrawButton.addEventListener('click', openDrawScreen);
ui.againButton.addEventListener('click', startRide);

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'c' && state === 'riding') {
    ride.comfort = !ride.comfort;
  }
  if (key === 'r' && (state === 'riding' || state === 'done')) {
    startRide();
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function startAudio() {
  if (muted) return;

  if (!audio) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    filter.Q.value = 0.55;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();

    audio = { ctx, noise, filter, gain };
  }

  if (audio.ctx.state === 'suspended') {
    audio.ctx.resume();
  }
  audio.gain.gain.setTargetAtTime(0.04, audio.ctx.currentTime, 0.25);
}

function updateAudio(dt) {
  if (!audio || muted) return;

  audioClock += dt;
  if (audioClock < 0.1) return;
  audioClock = 0;

  const now = audio.ctx.currentTime;
  const targetGain = 0.025 + Math.min(ride.speed / 40, 1) * 0.07;
  audio.gain.gain.setTargetAtTime(targetGain, now, 0.12);
  audio.filter.frequency.setTargetAtTime(230 + ride.speed * 20, now, 0.12);
}

function fadeAudioOut() {
  if (!audio) return;
  audio.gain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.3);
}

ui.muteButton.addEventListener('click', () => {
  muted = !muted;
  ui.muteIcon.textContent = muted ? 'Sound off' : 'Sound on';
  ui.muteButton.setAttribute('aria-pressed', String(muted));

  if (muted) {
    if (audio) {
      audio.gain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.1);
    }
  } else {
    startAudio();
  }
});

document.addEventListener('visibilitychange', () => {
  if (!audio) return;

  if (document.hidden) {
    audio.gain.gain.setTargetAtTime(0, audio.ctx.currentTime, 0.1);
  } else if (!muted && state === 'riding') {
    startAudio();
  }
});

if (freezeT !== null) {
  ride.freezeAt(freezeT);
  setState('frozen');
} else {
  ride.idle(0);
  setState('idle');
}

const clock = new THREE.Clock();

function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (state === 'riding') {
    ride.update(dt);
    ui.speedValue.textContent = Math.round(ride.speed * 3.6);
    ui.progressFill.style.width = `${(ride.t * 100).toFixed(1)}%`;
    updateAudio(dt);

    if (ride.finished) {
      setState('done');
    }
  } else if (state === 'idle') {
    ride.idle(dt);
  }

  if (state !== 'draw' && state !== 'drawn') {
    world.update(dt, camera);
    renderer.render(scene, camera);
  }
}

tick();
