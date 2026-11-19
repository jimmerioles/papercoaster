import * as THREE from 'three';
import { Track } from './track.js';
import { World } from './world.js';
import { Ride } from './ride.js';
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
const track = new Track();
scene.add(track.mesh);
const ride = new Ride(track, camera);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
ride.comfort = reducedMotion.matches;
reducedMotion.addEventListener('change', (event) => {
  ride.comfort = event.matches;
});

const params = new URLSearchParams(window.location.search);
const rawFreeze = params.get('t');
const parsedFreeze = rawFreeze === null ? null : parseFloat(rawFreeze);
const freezeT =
  parsedFreeze !== null && Number.isFinite(parsedFreeze)
    ? THREE.MathUtils.clamp(parsedFreeze, 0, 1)
    : null;

const ui = {
  startScreen: document.querySelector('#start-screen'),
  endScreen: document.querySelector('#end-screen'),
  hud: document.querySelector('#hud'),
  startButton: document.querySelector('#start-button'),
  againButton: document.querySelector('#again-button'),
  speedValue: document.querySelector('#speed-value'),
  maxSpeed: document.querySelector('#max-speed'),
  progressFill: document.querySelector('#progress-fill'),
  muteButton: document.querySelector('#mute-button'),
  muteIcon: document.querySelector('#mute-icon'),
};

let state = 'idle';
let audio = null;
let audioClock = 0;
let muted = false;

function setState(next) {
  state = next;

  const riding = state === 'riding';
  const done = state === 'done';

  ui.startScreen.classList.toggle('hidden', state !== 'idle');
  ui.endScreen.classList.toggle('hidden', !done);
  ui.hud.classList.toggle('hidden', !riding);
  ui.hud.setAttribute('aria-hidden', String(!riding));
  ui.muteButton.classList.toggle('hidden', state === 'idle' || state === 'frozen');

  if (done) {
    ui.maxSpeed.textContent = Math.round(ride.maxSpeed * 3.6);
    fadeAudioOut();
  }
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

ui.startButton.addEventListener('click', startRide);
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

  world.update(dt, camera);
  renderer.render(scene, camera);
}

tick();
