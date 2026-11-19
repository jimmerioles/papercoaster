import * as THREE from 'three';

const COLORS = {
  skyTop: 0x6aa4d4,
  skyBottom: 0xffd3a3,
  sun: 0xfff4d6,
  farMountain: 0xa894c4,
  midMountain: 0xb85f4f,
  nearMountain: 0x3f6f6a,
  ground: 0x24413f,
  cloud: 0xfff1dd,
  river: 0x9fd0d9,
  accent: 0xe85d3f,
  paper: 0xfff1dd,
};

function makeGroundTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#24413f';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(130, 170, 150, ${Math.random() * 0.05})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(80, 80);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class World {
  constructor(scene) {
    this.scene = scene;
    this.time = 0;
    this.clouds = [];
    this.sunOffset = new THREE.Vector3(-250, 300, 800);

    this._createSky();
    this._createSun();
    this._createGround();
    this._createMountainRings();
    this._createRiver();
    this._createForest();
    this._createClouds();
    this._createLights();
    this._createStartFlag();
  }

  _createSky() {
    const geometry = new THREE.SphereGeometry(1200, 32, 24);
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        topColor: { value: new THREE.Color(COLORS.skyTop) },
        bottomColor: { value: new THREE.Color(COLORS.skyBottom) },
        offset: { value: 150 },
        exponent: { value: 0.62 },
      },
      vertexShader: `
        varying vec3 vLocalPosition;
        void main() {
          vLocalPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vLocalPosition;
        void main() {
          float h = normalize(vLocalPosition + vec3(0.0, offset, 0.0)).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, pow(max(h, 0.0), exponent)), 1.0);
        }
      `,
    });

    this.sky = new THREE.Mesh(geometry, material);
    this.sky.renderOrder = -1;
    this.sky.frustumCulled = false;
    this.scene.add(this.sky);
  }

  _createSun() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 6, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 250, 232, 1)');
    gradient.addColorStop(0.42, 'rgba(255, 244, 214, 1)');
    gradient.addColorStop(0.52, 'rgba(255, 236, 200, 0.75)');
    gradient.addColorStop(0.7, 'rgba(255, 220, 180, 0.18)');
    gradient.addColorStop(1, 'rgba(255, 220, 180, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      fog: false,
      opacity: 0.95,
    });

    this.sun = new THREE.Sprite(material);
    this.sun.scale.set(180, 180, 1);
    this.sun.position.copy(this.sunOffset);
    this.scene.add(this.sun);
  }

  _createGround() {
    const geometry = new THREE.PlaneGeometry(2400, 2400);
    const material = new THREE.MeshStandardMaterial({
      map: makeGroundTexture(),
      color: 0xffffff,
      roughness: 1,
      metalness: 0,
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(30, -75, 50);
    this.scene.add(ground);
  }

  _createMountainRings() {
    const rings = [
      {
        radius: 240,
        height: 70,
        baseY: -75,
        color: COLORS.nearMountain,
        jaggedness: 32,
        seed: 1.2,
      },
      {
        radius: 400,
        height: 190,
        baseY: -75,
        color: COLORS.midMountain,
        jaggedness: 55,
        seed: 3.4,
      },
      {
        radius: 620,
        height: 260,
        baseY: -75,
        color: COLORS.farMountain,
        jaggedness: 75,
        seed: 5.1,
      },
    ];

    for (const ring of rings) {
      const segments = 160;
      const geometry = new THREE.CylinderGeometry(
        ring.radius,
        ring.radius,
        ring.height,
        segments,
        1,
        true
      );
      const positions = geometry.attributes.position;
      const colors = new Float32Array(positions.count * 3);
      for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i);
        const t = THREE.MathUtils.clamp((y + ring.height / 2) / ring.height, 0, 1);
        const shade = 0.68 + t * 0.44;
        colors[i * 3] = shade;
        colors[i * 3 + 1] = shade;
        colors[i * 3 + 2] = shade;
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);

        if (y > 0) {
          const angle = Math.atan2(z, x);
          const ridge = (frequency, phase) =>
            1 - Math.pow(Math.abs(Math.sin(angle * frequency + phase)), 0.55);
          const noise =
            ridge(2.5, ring.seed) * 0.45 +
            ridge(6.0, ring.seed * 1.7) * 0.3 +
            ridge(13.0, ring.seed * 2.3) * 0.18 +
            ridge(23.0, ring.seed * 0.7) * 0.07;
          positions.setY(i, y + noise * ring.jaggedness);
        }
      }

      geometry.computeVertexNormals();

      const material = new THREE.MeshBasicMaterial({
        color: ring.color,
        side: THREE.BackSide,
        fog: true,
        vertexColors: true,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(30, ring.baseY + ring.height / 2, 50);
      this.scene.add(mesh);
    }
  }

  _createRiver() {
    const points = [
      new THREE.Vector3(-140, -74.8, -180),
      new THREE.Vector3(-80, -74.8, -40),
      new THREE.Vector3(-10, -74.8, 60),
      new THREE.Vector3(60, -74.8, 120),
      new THREE.Vector3(40, -74.8, 220),
      new THREE.Vector3(-40, -74.8, 320),
      new THREE.Vector3(-20, -74.8, 480),
      new THREE.Vector3(80, -74.8, 620),
    ];

    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
    curve.arcLengthDivisions = 2000;
    this.riverCurve = curve;

    const width = 24;
    const samples = 600;
    const positions = new Float32Array(samples * 2 * 3);
    const uvs = new Float32Array(samples * 2 * 2);
    const indices = [];
    const leftBank = [];
    const rightBank = [];

    for (let i = 0; i < samples; i++) {
      const u = i / (samples - 1);
      const point = curve.getPointAt(u);
      const tangent = curve.getTangentAt(u).normalize();
      const right = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const leftPoint = point.clone().addScaledVector(right, -width / 2);
      const rightPoint = point.clone().addScaledVector(right, width / 2);

      positions.set([leftPoint.x, leftPoint.y, leftPoint.z], i * 6);
      positions.set([rightPoint.x, rightPoint.y, rightPoint.z], i * 6 + 3);
      uvs.set([0, u * 24], i * 4);
      uvs.set([1, u * 24], i * 4 + 2);

      leftBank.push(leftPoint.clone().setY(leftPoint.y + 0.04));
      rightBank.push(rightPoint.clone().setY(rightPoint.y + 0.04));

      if (i < samples - 1) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshBasicMaterial({
      color: COLORS.river,
      side: THREE.DoubleSide,
      fog: true,
    });
    this.scene.add(new THREE.Mesh(geometry, material));

    const bankMaterial = new THREE.LineBasicMaterial({
      color: COLORS.paper,
      transparent: true,
      opacity: 0.28,
    });
    this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(leftBank), bankMaterial));
    this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rightBank), bankMaterial));
  }

  _createForest() {
    const count = 2200;
    const geometry = new THREE.ConeGeometry(1.2, 4.5, 5, 1);
    geometry.translate(0, 2.25, 0);

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 1,
      metalness: 0,
      flatShading: true,
    });

    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const palette = [0x4f6f5a, 0x5f7f6a, 0x6f8f6a, 0x7f8f6a, 0x3f5f4f];
    const riverSamples = 120;
    const riverPoints = [];
    for (let i = 0; i < riverSamples; i++) {
      riverPoints.push(this.riverCurve.getPointAt(i / (riverSamples - 1)));
    }

    let placed = 0;
    let guard = 0;

    while (placed < count && guard < count * 12) {
      guard++;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * 230;
      const x = 30 + Math.cos(angle) * radius;
      const z = 50 + Math.sin(angle) * radius;

      let tooCloseToRiver = false;
      for (let i = 0; i < riverPoints.length; i++) {
        const point = riverPoints[i];
        const dx = x - point.x;
        const dz = z - point.z;
        if (dx * dx + dz * dz < 26 * 26) {
          tooCloseToRiver = true;
          break;
        }
      }
      if (tooCloseToRiver) continue;

      const scale = 0.5 + Math.random() * 1.1;
      dummy.position.set(x, -75, z);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
      dummy.scale.set(scale, scale * (0.8 + Math.random() * 0.5), scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);

      color.setHex(palette[Math.floor(Math.random() * palette.length)]);
      mesh.setColorAt(placed, color);
      placed++;
    }

    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.frustumCulled = false;
    this.scene.add(mesh);
  }

  _createClouds() {
    const material = new THREE.MeshBasicMaterial({
      color: COLORS.cloud,
      fog: true,
    });

    for (let i = 0; i < 11; i++) {
      const cloud = new THREE.Group();
      const blobs = 4 + Math.floor(Math.random() * 3);

      for (let j = 0; j < blobs; j++) {
        const geometry = new THREE.SphereGeometry(1, 7, 5);
        const blob = new THREE.Mesh(geometry, material);
        const size = 6 + Math.random() * 8;
        blob.scale.set(size * (1.4 + Math.random() * 0.8), size * 0.6, size * 0.85);
        blob.position.set(
          (j - blobs / 2) * 6.5 + Math.random() * 3,
          Math.random() * 3,
          Math.random() * 5
        );
        cloud.add(blob);
      }

      const angle = Math.random() * Math.PI * 2;
      const distance = 220 + Math.random() * 260;
      cloud.position.set(
        30 + Math.cos(angle) * distance,
        80 + Math.random() * 70,
        50 + Math.sin(angle) * distance
      );
      cloud.rotation.y = Math.random() * Math.PI;
      cloud.userData.phase = Math.random() * Math.PI * 2;
      cloud.userData.drift = 0.15 + Math.random() * 0.35;
      this.clouds.push(cloud);
      this.scene.add(cloud);
    }
  }

  _createLights() {
    const hemisphere = new THREE.HemisphereLight(0xffe6c9, 0x8a6a5a, 1.55);
    this.scene.add(hemisphere);

    const key = new THREE.DirectionalLight(0xfff1d6, 1.9);
    key.position.set(-160, 220, 140);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x9fc7d9, 0.75);
    fill.position.set(160, 90, -120);
    this.scene.add(fill);
  }

  _createStartFlag() {
    const group = new THREE.Group();

    const poleMaterial = new THREE.MeshStandardMaterial({
      color: COLORS.paper,
      roughness: 1,
      metalness: 0,
    });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.5, 6), poleMaterial);
    pole.position.y = 2.25;

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), poleMaterial);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(-0.8, 0.05, 0);

    const flagPivot = new THREE.Group();
    flagPivot.position.y = 4.2;

    const flagGeometry = new THREE.BufferGeometry();
    flagGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [
          0, 0.3, 0,
          0, -0.5, 0,
          1.6, -0.1, 0,
        ],
        3
      )
    );
    flagGeometry.computeVertexNormals();

    const flagMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.accent,
      side: THREE.DoubleSide,
    });
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flagPivot.add(flag);
    flagPivot.rotation.y = 0.3;

    group.add(pole, arm, flagPivot);
    group.position.set(2.9, 42, -4);
    this.flagPivot = flagPivot;
    this.scene.add(group);
  }

  update(dt, camera) {
    this.time += dt;

    if (this.sky) this.sky.position.copy(camera.position);
    if (this.sun) this.sun.position.copy(camera.position).add(this.sunOffset);
    if (this.flagPivot) {
      this.flagPivot.rotation.y = 0.3 + Math.sin(this.time * 1.9) * 0.22;
    }

    for (const cloud of this.clouds) {
      const { phase, drift } = cloud.userData;
      cloud.position.x += Math.sin(this.time * 0.06 + phase) * drift * dt;
      cloud.position.y += Math.cos(this.time * 0.04 + phase) * 0.12 * dt;
    }
  }
}
