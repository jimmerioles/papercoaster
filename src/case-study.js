import dropShot from './case-study/images/drop.webp';
import drawShot from './case-study/images/draw.webp';
import loopShot from './case-study/images/loop.webp';
import ridePoster from './case-study/images/ride-poster.webp';
import startShot from './case-study/images/start.webp';
import turnShot from './case-study/images/turn.webp';
import './case-study/case-study.css';

const RIDE_VIDEO = `${import.meta.env.BASE_URL}ride.mp4`;
const REPO_URL = 'https://github.com/jimmerioles/papercoaster';
const DESIGN_URL = `${REPO_URL}/blob/main/docs/design.md`;

const ICONS = {
  arrowLeft:
    '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 3.5 6 8l4.5 4.5" /></svg>',
  arrowDown:
    '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v9M4.5 8.5 8 12l3.5-3.5" /></svg>',
  arrowUpRight:
    '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 11.5 11.5 4.5M5.5 4.5h6v6" /></svg>',
};

const MARK = `<svg viewBox="0 0 28 28" class="cs-brand__svg" aria-hidden="true">
  <rect x="2" y="2" width="24" height="24" rx="7" />
  <path d="M6.5 19.5c3.5-7 7-8.5 10.5-5s4 2.5 5.5-3" />
  <circle cx="21.5" cy="7.5" r="2" />
</svg>`;

// The test track profile, projected from TEST_TRACK_POINTS into the hero SVG.
const TRACK_PROFILE =
  'M 24.0 236.0 C 47.3 236.0 122.9 238.0 163.6 236.0 C 204.4 234.0 233.5 241.9 268.4 224.2 C 303.3 206.6 341.1 155.5 373.1 130.0 C 405.1 104.5 419.6 88.8 460.4 71.1 C 501.1 53.4 570.9 29.9 617.5 24.0 C 664.0 18.1 704.7 31.9 739.6 35.8 C 774.5 39.7 797.8 37.7 826.9 47.6 C 856.0 57.4 893.8 75.0 914.2 94.7 C 934.5 114.3 960.7 145.7 949.1 165.3 C 937.5 185.0 876.4 212.4 844.4 212.4 C 812.4 212.4 768.7 185.0 757.1 165.3 C 745.5 145.7 757.1 114.3 774.5 94.7 C 792.0 75.0 826.9 51.5 861.8 47.6 C 896.7 43.6 946.2 63.3 984.0 71.1 C 1021.8 79.0 1059.6 86.8 1088.7 94.7 C 1117.8 102.5 1144.0 110.4 1158.5 118.2 C 1173.1 126.1 1181.8 139.8 1176.0 141.8 C 1170.2 143.7 1146.9 137.9 1123.6 130.0 C 1100.4 122.1 1050.9 100.6 1036.4 94.7';

const FACTS = [
  { label: 'Role', value: 'Product, frontend, and film' },
  { label: 'Stack', value: 'three.js, Vite, plain JavaScript' },
  { label: 'World', value: '0 external assets' },
  { label: 'Status', value: 'v0.1.0, November 2026' },
];

const COMPARISON = [
  {
    criterion: 'First move',
    editor: 'Open a palette of pieces and place the first one.',
    papercoaster: 'Draw one line across the paper.',
  },
  {
    criterion: 'Track shape',
    editor: 'Grid-locked pieces with curvature limits.',
    papercoaster: 'Any line that stays on the paper and is long enough.',
  },
  {
    criterion: 'Feedback',
    editor: 'A validation error after the layout is built.',
    papercoaster: 'A ride starts, or the line stays visible with a reason to try again.',
  },
  {
    criterion: 'Time to ride',
    editor: 'Minutes of building before the first drop.',
    papercoaster: 'One stroke, then a button.',
  },
  {
    criterion: 'The result',
    editor: 'A layout you test from outside.',
    papercoaster: 'A first-person ride through the paper valley.',
  },
];

const SHOTS = [
  {
    time: '0:00 to 0:04',
    title: 'Open on the paper valley',
    action: 'Load the app at 1440x900 and leave the intro card in place.',
    screen: 'The start flag, the coral track, the river, and three mountain rings.',
    narration: 'Every roller coaster begins as a line.',
  },
  {
    time: '0:04 to 0:12',
    title: 'Draw the line',
    action: 'Click Draw a line. Drag one stroke with a climb, a drop, a loop, and a turn. Release.',
    screen: 'The ruled paper, the coral stroke, the live distance, and an enabled Ride button.',
    narration: 'One stroke, and Papercoaster turns it into a paper diorama you can ride.',
  },
  {
    time: '0:12 to 0:18',
    title: 'Build the track',
    action: 'Click Ride the line. Hold for one beat at the start.',
    screen: 'The intro and draw screens clear. The flag moves to the start band. The HUD appears.',
    narration: 'The drawing is the input. The ride is the output.',
  },
  {
    time: '0:18 to 0:28',
    title: 'The drop',
    action: 'Let the ride run through the first drop. Do not touch the camera.',
    screen: 'Speed climbs, the field of view opens, and the river and forest pass below.',
    narration: 'Height turns into speed as you fall.',
  },
  {
    time: '0:28 to 0:40',
    title: 'The loop',
    action: 'Hold through the loop, then press C once to show comfort view.',
    screen: 'The camera rolls upside down, the ribbon stays coral, then the horizon levels.',
    narration: 'The frame rotates with the track. Comfort view pulls the horizon back.',
  },
  {
    time: '0:40 to 1:00',
    title: 'The finish',
    action: 'Let the ride finish, then press R to restart.',
    screen: 'The end card reports top speed and track length. The next ride starts from the top.',
    narration: 'No two lines make the same ride. Draw a line. Ride it.',
  },
];

const STEPS = [
  {
    title: 'Listen to the shape, ignore the noise.',
    body: 'A pointer drag arrives as a cloud of samples. Near-duplicates closer than 0.75 canvas pixels are dropped. Two Chaikin passes replace each corner with two points at a quarter and three quarters along the segment. The path is resampled every 2 world units, so the geometry, the paper texture, and the speed all agree on what a meter means.',
  },
  {
    title: 'Map the paper into the valley.',
    body: 'The drawing is a side view, so the mapping is almost too simple. Horizontal becomes depth, vertical becomes height, and x stays at zero: z = -30 + 200u, y = 6 + 64v, x = 0. The track lives in one vertical plane. That constraint is the reason a loop can work.',
  },
  {
    title: 'Use the in-plane normal, not Frenet.',
    body: 'Every point needs a frame: a tangent, an up, and a right. The Frenet frame points up at the center of curvature, so it flips at a loop and the horizon spins. For depth tracks, parallel transport carries the previous up forward and projects it onto the plane. For a flat drawn track, rotate the tangent 90 degrees in the plane. The frame rotates with the track, and the camera goes upside down exactly once.',
  },
  {
    title: 'Trade physics for a speed model.',
    body: 'Speed comes from energy, with one deliberate cheat. A minimum speed of 13 m/s means a drawn loop can never leave you stuck at the top. The camera sits 2.2 units above the track, looks further ahead as speed rises, and opens the field of view from 68 to 84 degrees. Comfort mode pulls the up vector toward world up and holds the field of view at 68. It is a spline, a speed model, and a camera, not a simulation.',
  },
];

const STATS = [
  { value: '2', label: 'Chaikin passes', note: 'corners become curves' },
  { value: '2 units', label: 'resample spacing', note: 'one meter is one meter' },
  { value: '240 to 1,800', label: 'frames per track', note: 'length times 8, clamped' },
  { value: '2,200', label: 'instanced trees', note: 'one forest draw' },
  { value: '13 m/s', label: 'minimum speed', note: 'the deliberate cheat' },
  { value: '0', label: 'external assets', note: 'textures and geometry in code' },
];

const FRAMES = [
  {
    criterion: 'Tracks with depth',
    frenet: 'Yes',
    transport: 'Yes',
    planar: 'No',
  },
  {
    criterion: 'A vertical loop',
    frenet: 'Normal flips',
    transport: 'Stable',
    planar: 'Stable',
  },
  {
    criterion: 'Bank',
    frenet: 'Twists',
    transport: 'From curvature',
    planar: 'Zero by design',
  },
  {
    criterion: 'Used here',
    frenet: 'Never',
    transport: 'Test and depth tracks',
    planar: 'Drawn side-view tracks',
  },
];

const ACCESSIBILITY = [
  {
    title: 'Every action is a button.',
    body: 'Draw a line, Clear, Ride the line, Redraw, Ride again, and the mute toggle are native buttons with visible focus.',
  },
  {
    title: 'Focus follows the flow.',
    body: 'The draw screen takes focus when it opens, the end screen focuses Ride again, and the stroke status is a live region.',
  },
  {
    title: 'The canvas has a name.',
    body: 'The WebGL canvas is an image with a label. The drawing canvas is labeled as paper for one continuous line.',
  },
  {
    title: 'Motion is optional.',
    body: 'Comfort view holds the horizon and the field of view at 68 degrees. It turns on by default when prefers-reduced-motion is set, and C toggles it during a ride.',
  },
  {
    title: 'The case study follows the same rules.',
    body: 'One h1, landmarks, a skip link, visible focus, semantic lists and tables, and no meaning that depends on color alone.',
  },
];

const LIMITATIONS = [
  'A side view is planar. A drawn track has x = 0 and zero bank. Banked turns wait for a depth input.',
  'A reload forgets the stroke. The URL can freeze the test track, but it does not carry a drawn line. Sharing is the next milestone.',
  'It is not a physics engine. The speed model is energy plus a minimum speed. It does not simulate friction, g-forces, or train dynamics.',
  'The 3D scene needs WebGL. There is no flat fallback for the ride.',
  'Background tabs throttle the ride. Use a foreground tab for feel checks.',
  'The visual pass is manual. The automated gate covers the stroke, track math, build, and browser flow, not composition.',
  'The 60-second cut is a script. The 21-second clip is the only ride video on this page.',
];

const NEXT = [
  {
    title: 'Thrill score',
    body: 'Max speed, airtime, inversions, near misses, and smoothness, combined into a score that rewards a bold line without punishing a calm one.',
  },
  {
    title: 'Share the stroke',
    body: 'Encode the quantized stroke in the URL hash, with a short link that rebuilds the track.',
  },
  {
    title: 'Depth input',
    body: 'Pressure, stroke speed, or a slider mapped to world X, which would bring banked turns back.',
  },
  {
    title: 'Daily prompt',
    body: 'A date seed and a one-line challenge, so there is a reason to draw again tomorrow.',
  },
  {
    title: 'Postcard export',
    body: 'Pause, orbit, and export a paper-framed PNG of your coaster.',
  },
  {
    title: 'A frame trace',
    body: 'Measure paint counts and frame pacing on a mid-range laptop, then publish the numbers beside the constants.',
  },
];

const factMarkup = FACTS.map(
  (fact) => `<div><dt>${fact.label}</dt><dd>${fact.value}</dd></div>`,
).join('');

const comparisonRows = COMPARISON.map(
  (row) => `<tr>
    <th scope="row">${row.criterion}</th>
    <td data-label="A track editor">${row.editor}</td>
    <td data-label="Papercoaster">${row.papercoaster}</td>
  </tr>`,
).join('');

const shotMarkup = SHOTS.map(
  (shot) => `<li>
    <p class="cs-shots__time">${shot.time}</p>
    <div>
      <h4>${shot.title}</h4>
      <dl>
        <div><dt>Action</dt><dd>${shot.action}</dd></div>
        <div><dt>On screen</dt><dd>${shot.screen}</dd></div>
        <div><dt>Narration</dt><dd>&ldquo;${shot.narration}&rdquo;</dd></div>
      </dl>
    </div>
  </li>`,
).join('');

const stepMarkup = STEPS.map(
  (step, index) => `<li>
    <span class="cs-steps__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <div>
      <h3>${step.title}</h3>
      <p>${step.body}</p>
    </div>
  </li>`,
).join('');

const statsMarkup = STATS.map(
  (stat) => `<div>
    <dt>${stat.label}</dt>
    <dd><strong>${stat.value}</strong><span>${stat.note}</span></dd>
  </div>`,
).join('');

const frameRows = FRAMES.map(
  (row) => `<tr>
    <th scope="row">${row.criterion}</th>
    <td data-label="Frenet">${row.frenet}</td>
    <td data-label="Parallel transport">${row.transport}</td>
    <td data-label="Planar normal">${row.planar}</td>
  </tr>`,
).join('');

const accessibilityMarkup = ACCESSIBILITY.map(
  (item) => `<li><strong>${item.title}</strong> ${item.body}</li>`,
).join('');

const limitationMarkup = LIMITATIONS.map((item) => `<li>${item}</li>`).join('');

const nextMarkup = NEXT.map(
  (item, index) => `<li>
    <span aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
    <div>
      <h3>${item.title}</h3>
      <p>${item.body}</p>
    </div>
  </li>`,
).join('');

const TEMPLATE = `<div class="case-study">
  <a class="cs-skip" href="#case-study-main">Skip to the case study</a>

  <header class="cs-topbar" aria-label="Case study">
    <a class="cs-brand" href="#/" aria-label="Papercoaster home">
      <span class="cs-brand__mark">${MARK}</span>
      <span class="cs-brand__name">Papercoaster</span>
      <span class="cs-brand__divider" aria-hidden="true"></span>
      <span class="cs-brand__section">Case study</span>
    </a>
    <a class="cs-back" href="#/">
      ${ICONS.arrowLeft}
      <span>Back to the ride</span>
    </a>
  </header>

  <main id="case-study-main" class="cs-main" tabindex="-1">
    <article>
      <header class="cs-hero">
        <div class="cs-shell">
          <p class="cs-kicker">
            <span class="cs-kicker__dot" aria-hidden="true"></span>
            three.js · Case study
          </p>
          <h1 class="cs-hero__title">
            Draw the line.<br />
            <em>Feel the drop.</em>
          </h1>
          <p class="cs-hero__lede">
            Papercoaster turns one stroke into a rollercoaster through a paper
            diorama, then puts you on it. There is no track editor, no physics
            engine, and no external assets. The line is the input. The ride is
            the output. The interesting part is everything in between.
          </p>

          <div class="cs-hero__bottom">
            <div class="cs-actions">
              <a class="cs-button cs-button--primary" href="#/">
                <span>Open the ride</span>
                ${ICONS.arrowUpRight}
              </a>
              <button
                type="button"
                class="cs-button cs-button--ghost"
                data-scroll-target="how-title"
                aria-controls="how-title"
              >
                <span>Read the build notes</span>
                ${ICONS.arrowDown}
              </button>
            </div>

            <dl class="cs-facts">${factMarkup}</dl>
          </div>

          <figure class="cs-profile">
            <svg
              class="cs-profile__svg"
              viewBox="0 0 1200 260"
              role="img"
              aria-labelledby="profile-caption"
            >
              <title id="profile-caption">The test track in profile, with a climb, a drop, and a loop.</title>
              <path class="cs-profile__halo" d="${TRACK_PROFILE}" />
              <path class="cs-profile__line" d="${TRACK_PROFILE}" />
              <circle class="cs-profile__start" cx="24" cy="236" r="4.5" />
              <circle class="cs-profile__end" cx="1036.4" cy="94.7" r="4.5" />
            </svg>
            <figcaption>
              The test track in profile. The loop is real geometry, not a
              painted curve.
            </figcaption>
          </figure>

          <figure class="cs-figure cs-figure--hero">
            <img
              src="${dropShot}"
              alt="The first drop of a paper rollercoaster, looking down over a winding river and a forest of paper trees."
              width="1600"
              height="956"
            />
            <figcaption>
              The first drop. The track is one ribbon of coral paper. The
              valley, river, and forest are generated in code.
            </figcaption>
          </figure>
        </div>
      </header>

      <div class="cs-shell cs-sections">
        <section class="cs-section" aria-labelledby="problem-title">
          <div class="cs-section__aside">
            <span class="cs-section__number">01</span>
            <p class="cs-kicker">The problem</p>
          </div>
          <div class="cs-section__body">
            <h2 id="problem-title" tabindex="-1">
              A track editor makes you an engineer. A doodle does not care.
            </h2>
            <p class="cs-lede">
              Rollercoaster games ask you to place pieces, set banking, and
              validate a layout. Papercoaster starts from the thing that made
              you love coasters in the first place: a line drawn in the air.
            </p>
            <p>
              The line is a difficult input for a track. A finger drag is noisy,
              uneven, and different every time. A side view has no depth, so it
              cannot bank. A vertical loop flips the usual camera frame and can
              spin the horizon. And the result still has to feel like a coaster,
              not a camera on a rail.
            </p>

            <div class="cs-compare">
              <h3>What changes when the line is the input</h3>
              <p class="cs-compare__intro">
                The track editor is still the right tool for a precise layout.
                This is a different promise: the first draft is the ride.
              </p>
              <table class="cs-table">
                <caption class="sr-only">
                  A comparison of a track editor and Papercoaster for the first
                  move, track shape, feedback, time to ride, and the result.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Criterion</th>
                    <th scope="col">A track editor</th>
                    <th scope="col">Papercoaster</th>
                  </tr>
                </thead>
                <tbody>${comparisonRows}</tbody>
              </table>
            </div>

            <p>
              The reference was not an interface. It was the feeling of drawing
              a loop in the margin and wondering what it would do.
            </p>
          </div>
        </section>

        <section class="cs-section" aria-labelledby="what-title">
          <div class="cs-section__aside">
            <span class="cs-section__number">02</span>
            <p class="cs-kicker">What it is</p>
          </div>
          <div class="cs-section__body">
            <h2 id="what-title" tabindex="-1">A margin doodle you can ride.</h2>
            <p class="cs-lede">
              The product is three acts: draw, build, ride. The drawing screen
              is ruled paper. The line is coral. Clear and Ride are native
              buttons. When the line is ready, the app builds the track, moves
              the start flag, and starts the ride.
            </p>
            <p>
              The world is paper too: three rings of mountains, a winding river,
              2,200 instanced trees, low clouds, and a sun that follows the
              camera. There are no textures to download. The only asset is the
              stroke.
            </p>

            <div class="cs-statement">
              <p>
                The line is the input. The ride is the output. Everything
                between is the product.
              </p>
            </div>

            <div class="cs-gallery">
              <figure class="cs-figure">
                <img
                  src="${startShot}"
                  alt="The Papercoaster intro card over a paper valley, with a coral track and a start flag."
                  width="1600"
                  height="956"
                />
                <figcaption>
                  The intro card sits over the start flag. Draw a line is the
                  only way in.
                </figcaption>
              </figure>
              <figure class="cs-figure">
                <img
                  src="${drawShot}"
                  alt="A single coral stroke drawn on ruled paper, with Clear and Ride the line buttons below."
                  width="1600"
                  height="956"
                />
                <figcaption>
                  One stroke on ruled paper. Clear and Ride are native buttons,
                  and the live status reports the track length.
                </figcaption>
              </figure>
            </div>

            <p>
              A drawn loop goes upside down. The ribbon stays coral because it
              uses an unlit material. A flat line is a calm ride. A short line
              is turned away with a reason, and the line stays on screen so you
              can see what failed.
            </p>

            <figure class="cs-figure cs-figure--loop">
              <img
                src="${loopShot}"
                alt="Looking up the vertical face of the paper loop, with the coral track filling the sky."
                width="1600"
                height="956"
              />
              <figcaption>
                Inside the loop. The camera rolls with the in-plane frame, and
                the coral ribbon stays flat.
              </figcaption>
            </figure>
          </div>
        </section>

        <section class="cs-section" aria-labelledby="walkthrough-title">
          <div class="cs-section__aside">
            <span class="cs-section__number">03</span>
            <p class="cs-kicker">The walkthrough</p>
          </div>
          <div class="cs-section__body">
            <h2 id="walkthrough-title" tabindex="-1">
              The ride in twenty-one seconds.
            </h2>
            <p class="cs-lede">
              The clip below is a real capture from the running app, not a
              hand-animated camera. It was recorded at 30 fps from a line drawn
              in one stroke. The full explainer is 3 minutes 56 seconds and
              covers the math scene by scene.
            </p>

            <figure class="cs-video-figure">
              <video
                class="cs-video"
                controls
                muted
                playsinline
                preload="none"
                poster="${ridePoster}"
                width="1280"
                height="720"
                aria-label="A 21-second ride on a drawn paper rollercoaster."
              >
                <source src="${RIDE_VIDEO}" type="video/mp4" />
                <p>
                  Your browser cannot play the clip.
                  <a href="${RIDE_VIDEO}">Download the 21-second ride.</a>
                </p>
              </video>
              <figcaption>
                A real drawn ride. The HUD shows speed, progress, and the
                comfort hint. The clip is silent.
              </figcaption>
            </figure>

            <div class="cs-shotlist">
              <h3 id="shot-list-title" tabindex="-1">The 60-second cut</h3>
              <p class="cs-small">
                A short route through the product for a recording session. The
                clip above is the quick look.
              </p>
              <ol class="cs-shots" aria-labelledby="shot-list-title">
                ${shotMarkup}
              </ol>
            </div>

            <h3>A film built from the same numbers</h3>
            <p>
              The explainer uses Manim scenes for the stroke, the mapping, the
              frames, and the speed model, plus a 30 fps capture of a real ride.
              The voice is Kokoro, the score is synthesized with numpy, and there
              are no licensed tracks. The case study keeps the clip short. The
              full film is
              <a class="cs-text-link" href="${REPO_URL}#readme" target="_blank" rel="noreferrer">
                linked from the README
                ${ICONS.arrowUpRight}
              </a>.
            </p>
          </div>
        </section>

        <section class="cs-section" aria-labelledby="how-title">
          <div class="cs-section__aside">
            <span class="cs-section__number">04</span>
            <p class="cs-kicker">How it works</p>
          </div>
          <div class="cs-section__body">
            <h2 id="how-title" tabindex="-1">
              Four decisions hold the ride together.
            </h2>
            <p class="cs-lede">
              The build is small on purpose. There is no scene editor, no
              physics engine, and no second copy of the track.
            </p>

            <ol class="cs-steps">${stepMarkup}</ol>

            <div class="cs-code">
              <p class="cs-code__label">The two equations that matter</p>
              <pre><code>const up = normalize(0, tangent.z, -tangent.y);
const right = cross(up, tangent);
const bank = 0;

v = Math.sqrt(Math.max(vMin * vMin, v0 * v0 + 2 * 9.8 * (h0 - h)));</code></pre>
            </div>

            <div class="cs-compare cs-compare--frames">
              <h3>Three ways to frame a track</h3>
              <p class="cs-compare__intro">
                The planar frame is not a shortcut. It is the correct frame for
                a track that lives in one vertical plane.
              </p>
              <table class="cs-table cs-table--frames">
                <caption class="sr-only">
                  A comparison of Frenet, parallel transport, and the planar
                  normal for depth, loops, bank, and use.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Criterion</th>
                    <th scope="col">Frenet</th>
                    <th scope="col">Parallel transport</th>
                    <th scope="col">Planar normal</th>
                  </tr>
                </thead>
                <tbody>${frameRows}</tbody>
              </table>
            </div>

            <p>
              The table is the short version. The long version is in
              <a class="cs-text-link" href="${DESIGN_URL}" target="_blank" rel="noreferrer">
                docs/design.md
                ${ICONS.arrowUpRight}
              </a>, and the film shows the frame rotating through a loop.
            </p>
          </div>
        </section>

        <section class="cs-section" aria-labelledby="performance-title">
          <div class="cs-section__aside">
            <span class="cs-section__number">05</span>
            <p class="cs-kicker">Performance</p>
          </div>
          <div class="cs-section__body">
            <h2 id="performance-title" tabindex="-1">
              The world is built once. The ride moves a camera.
            </h2>
            <p class="cs-lede">
              A new track is built only when you draw a new line. The ride
              advances one number, t, by speed * dt / length, then samples the
              frame at that point. The world does not rebuild.
            </p>

            <dl class="cs-stats">${statsMarkup}</dl>

            <p>
              The track is a handful of meshes: a ribbon, two rails, ties, and
              the start band. The forest is one instanced draw of 2,200 cones.
              The sky is a shader sphere centered on the camera. The draw screen
              pauses the 3D render because the ruled paper covers it. Background
              tabs throttle requestAnimationFrame, so the ?t= freezes are the
              stable way to inspect a frame.
            </p>
            <p>
              These are constants from the build, not a lab benchmark. The
              target is a smooth ride on a 2020 laptop. The Playwright suite runs
              on software WebGL at one worker because parallel headless Chromium
              can pin every core. The visual composition is still checked by eye
              with the four ?t= views and a drawn loop.
            </p>
          </div>
        </section>

        <section class="cs-section" aria-labelledby="accessibility-title">
          <div class="cs-section__aside">
            <span class="cs-section__number">06</span>
            <p class="cs-kicker">Accessibility</p>
          </div>
          <div class="cs-section__body">
            <h2 id="accessibility-title" tabindex="-1">
              The ride is visual. The controls are not.
            </h2>
            <p class="cs-lede">
              The canvas is not an interface you can tab through. Papercoaster
              keeps every control native and tells you what is happening in
              text.
            </p>

            <ul class="cs-list cs-list--tight">${accessibilityMarkup}</ul>

            <div class="cs-callout">
              <p>
                <strong>The honest gap.</strong> The stroke itself is pointer and
                touch only. A keyboard way to draw a line is not in v0.1.0. It is
                a real limitation, not a footnote.
              </p>
            </div>
          </div>
        </section>

        <section class="cs-section" aria-labelledby="limitations-title">
          <div class="cs-section__aside">
            <span class="cs-section__number">07</span>
            <p class="cs-kicker">Limitations</p>
          </div>
          <div class="cs-section__body">
            <h2 id="limitations-title" tabindex="-1">
              What this does not claim.
            </h2>
            <p class="cs-lede">
              A demo is more convincing when it says where the edges are. These
              are the current ones.
            </p>

            <div class="cs-cols">
              <ul class="cs-list cs-list--tight">${limitationMarkup}</ul>
              <figure class="cs-figure cs-figure--compact">
                <img
                  src="${turnShot}"
                  alt="A test-track turn seen from the ride, with the coral ribbon curving between paper mountains."
                  width="1600"
                  height="956"
                />
                <figcaption>
                  The test track turn. Depth tracks use parallel transport and
                  curvature-based bank. A drawn side-view track stays level.
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section class="cs-section" aria-labelledby="next-title">
          <div class="cs-section__aside">
            <span class="cs-section__number">08</span>
            <p class="cs-kicker">What is next</p>
          </div>
          <div class="cs-section__body">
            <h2 id="next-title" tabindex="-1">
              The next version should make the line worth sharing.
            </h2>
            <p class="cs-lede">
              The drawing layer has landed. The remaining work is scoring,
              sharing, and a reason to come back.
            </p>

            <ol class="cs-next">${nextMarkup}</ol>
          </div>
        </section>
      </div>
    </article>
  </main>

  <footer class="cs-footer">
    <div class="cs-shell cs-footer__inner">
      <div>
        <p class="cs-footer__mark">Papercoaster</p>
        <p class="cs-footer__note">
          Draw a line. Ride it. A three.js paper coaster by Jim Merioles, built
          with Vite. MIT licensed.
        </p>
      </div>
      <div class="cs-footer__links">
        <a class="cs-back" href="#/">
          ${ICONS.arrowLeft}
          <span>Back to the ride</span>
        </a>
        <button
          type="button"
          class="cs-small cs-footer__button"
          data-scroll-target="shot-list-title"
          aria-controls="shot-list-title"
        >
          Read the shot list
        </button>
        <a class="cs-small cs-footer__link" href="${REPO_URL}" target="_blank" rel="noreferrer">
          GitHub ${ICONS.arrowUpRight}
        </a>
        <a class="cs-small cs-footer__link" href="${DESIGN_URL}" target="_blank" rel="noreferrer">
          Design notes ${ICONS.arrowUpRight}
        </a>
      </div>
    </div>
  </footer>
</div>`;

export function mountCaseStudy(root) {
  root.innerHTML = TEMPLATE;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  root.querySelectorAll('[data-scroll-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = root.querySelector(`#${button.dataset.scrollTarget}`);
      if (!target) return;

      target.scrollIntoView({
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
        block: 'start',
      });
      target.focus({ preventScroll: true });
    });
  });

  root.querySelector('.cs-skip')?.addEventListener('click', (event) => {
    event.preventDefault();
    const main = root.querySelector('#case-study-main');
    main?.scrollIntoView({ block: 'start' });
    main?.focus({ preventScroll: true });
  });
}
