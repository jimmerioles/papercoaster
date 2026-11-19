import * as THREE from 'three';

export const TRACK_WIDTH = 2.6;
export const START_BAND_START = 0.035;
export const START_BAND_END = 0.0375;

export const TEST_TRACK_POINTS = [
  [0, 42, -16],
  [0, 42, 0],
  [0, 40, 12],
  [0, 24, 24],
  [0, 14, 34],
  [0, 6, 52],
  [0, 8, 66],
  [0, 10, 76],
  [0, 18, 86],
  [0, 30, 90],
  [0, 38, 78],
  [0, 30, 68],
  [0, 18, 70],
  [0, 10, 80],
  [0, 14, 94],
  [8, 18, 106],
  [20, 22, 114],
  [34, 26, 116],
  [48, 24, 110],
  [60, 18, 100],
];

function toVector3(point) {
  if (point instanceof THREE.Vector3) return point.clone();
  if (Array.isArray(point) && point.length === 3) {
    return new THREE.Vector3(point[0], point[1], point[2]);
  }
  if (point && Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z)) {
    return new THREE.Vector3(point.x, point.y, point.z);
  }
  throw new TypeError('Track points must be Vector3 values or [x, y, z] arrays.');
}

function makePaperTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fff7eb';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = 90 + Math.random() * 60;
    ctx.fillStyle = `rgba(${shade}, ${shade * 0.8}, ${shade * 0.65}, ${Math.random() * 0.07})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1);
  }

  for (let i = 0; i < 90; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const length = 2 + Math.random() * 10;
    ctx.strokeStyle = `rgba(120, 95, 70, ${Math.random() * 0.05})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y + (Math.random() - 0.5) * 1.5);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 52);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export class Track {
  constructor(points) {
    if (!Array.isArray(points) || points.length < 2) {
      throw new TypeError('Track needs at least two points.');
    }

    this.points = points.map(toVector3);
    this.curve = new THREE.CatmullRomCurve3(this.points, false, 'centripetal', 0.5);
    this.curve.arcLengthDivisions = 4000;
    this.curve.updateArcLengths();
    this.length = this.curve.getLength();
    if (!Number.isFinite(this.length) || this.length < 1e-6) {
      throw new Error('Track needs a non-zero length.');
    }
    this.planar = this.points.every((point) => Math.abs(point.x - this.points[0].x) < 1e-6);
    this.samples = THREE.MathUtils.clamp(Math.ceil(this.length * 8), 240, 1800);
    this.frames = this._computeFrames(this.samples);
    this.mesh = this._buildMesh();
  }

  _computePlanarFrames(n) {
    const frames = [];

    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const position = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const up = new THREE.Vector3(0, tangent.z, -tangent.y);

      if (up.lengthSq() < 1e-8) {
        up.set(0, 1, 0);
      }
      up.normalize();

      frames.push({
        position,
        tangent,
        up,
        right: new THREE.Vector3().crossVectors(up, tangent).normalize(),
        bank: 0,
      });
    }

    return frames;
  }

  _computeFrames(n) {
    if (this.planar) return this._computePlanarFrames(n);

    const points = [];
    const tangents = [];

    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      points.push(this.curve.getPointAt(u));
      tangents.push(this.curve.getTangentAt(u).normalize());
    }

    const frames = [];
    let transportUp = new THREE.Vector3(0, 1, 0);
    transportUp.sub(tangents[0].clone().multiplyScalar(transportUp.dot(tangents[0]))).normalize();

    const ds = this.length / (n - 1);
    const nominalSpeed = 24;
    let prevHeading = Math.atan2(tangents[0].x, tangents[0].z);

    for (let i = 0; i < n; i++) {
      const tangent = tangents[i];

      const projected = transportUp
        .clone()
        .sub(tangent.clone().multiplyScalar(transportUp.dot(tangent)));
      if (projected.lengthSq() < 1e-8) {
        const fallback =
          Math.abs(tangent.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
        projected.copy(fallback).sub(tangent.clone().multiplyScalar(fallback.dot(tangent)));
      }
      transportUp.copy(projected.normalize());

      const right = new THREE.Vector3().crossVectors(transportUp, tangent).normalize();
      const heading = Math.atan2(tangent.x, tangent.z);
      let dHeading = heading - prevHeading;
      while (dHeading > Math.PI) dHeading -= Math.PI * 2;
      while (dHeading < -Math.PI) dHeading += Math.PI * 2;
      const horizontal = Math.sqrt(tangent.x * tangent.x + tangent.z * tangent.z);
      const curvature = dHeading / ds;
      const bank = THREE.MathUtils.clamp(
        curvature * nominalSpeed * nominalSpeed * 0.01 * horizontal,
        -0.6,
        0.6,
      );

      const bankedUp = transportUp
        .clone()
        .multiplyScalar(Math.cos(bank))
        .add(right.clone().multiplyScalar(Math.sin(bank)))
        .normalize();

      frames.push({
        position: points[i],
        tangent: tangent.clone(),
        up: bankedUp,
        right: new THREE.Vector3().crossVectors(bankedUp, tangent).normalize(),
        bank,
      });

      prevHeading = heading;
    }

    return frames;
  }

  getFrameAt(u) {
    const clamped = THREE.MathUtils.clamp(u, 0, 1);
    const raw = clamped * (this.frames.length - 1);
    const i0 = Math.floor(raw);
    const i1 = Math.min(i0 + 1, this.frames.length - 1);
    const blend = raw - i0;
    const a = this.frames[i0];
    const b = this.frames[i1];

    const position = a.position.clone().lerp(b.position, blend);
    const tangent = a.tangent.clone().lerp(b.tangent, blend).normalize();
    const up = a.up.clone().lerp(b.up, blend).normalize();
    up.sub(tangent.clone().multiplyScalar(up.dot(tangent))).normalize();
    const right = new THREE.Vector3().crossVectors(up, tangent).normalize();

    return { position, tangent, up, right };
  }

  _buildMesh() {
    const group = new THREE.Group();
    const n = this.frames.length;
    const halfWidth = TRACK_WIDTH / 2;
    const positions = new Float32Array(n * 2 * 3);
    const normals = new Float32Array(n * 2 * 3);
    const uvs = new Float32Array(n * 2 * 2);
    const indices = [];

    for (let i = 0; i < n; i++) {
      const frame = this.frames[i];
      const left = frame.position.clone().addScaledVector(frame.right, -halfWidth);
      const right = frame.position.clone().addScaledVector(frame.right, halfWidth);

      positions.set([left.x, left.y, left.z], i * 6);
      positions.set([right.x, right.y, right.z], i * 6 + 3);
      normals.set([frame.up.x, frame.up.y, frame.up.z], i * 6);
      normals.set([frame.up.x, frame.up.y, frame.up.z], i * 6 + 3);

      const v = i / (n - 1);
      uvs.set([0, v], i * 4);
      uvs.set([1, v], i * 4 + 2);

      if (i < n - 1) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();

    const material = new THREE.MeshBasicMaterial({
      map: makePaperTexture(),
      color: 0xcd5039,
      side: THREE.DoubleSide,
    });

    group.add(new THREE.Mesh(geometry, material));

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x1f3f3f,
      transparent: true,
      opacity: 0.5,
    });

    const leftPoints = [];
    const rightPoints = [];
    for (let i = 0; i < n; i++) {
      const frame = this.frames[i];
      leftPoints.push(
        frame.position
          .clone()
          .addScaledVector(frame.right, -halfWidth)
          .addScaledVector(frame.up, 0.025),
      );
      rightPoints.push(
        frame.position
          .clone()
          .addScaledVector(frame.right, halfWidth)
          .addScaledVector(frame.up, 0.025),
      );
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(leftPoints), edgeMaterial));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rightPoints), edgeMaterial));

    const tieStep = 4;
    const tieHalfLength = 0.035;
    const tieVertices = [];
    const tieIndices = [];
    let tieVertexCount = 0;

    for (let i = 0; i < n; i += tieStep) {
      const frame = this.frames[i];
      const back = frame.position.clone().addScaledVector(frame.tangent, -tieHalfLength);
      const front = frame.position.clone().addScaledVector(frame.tangent, tieHalfLength);
      const upOffset = frame.up.clone().multiplyScalar(0.03);
      const corners = [
        back.clone().addScaledVector(frame.right, -halfWidth).add(upOffset),
        back.clone().addScaledVector(frame.right, halfWidth).add(upOffset),
        front.clone().addScaledVector(frame.right, -halfWidth).add(upOffset),
        front.clone().addScaledVector(frame.right, halfWidth).add(upOffset),
      ];

      for (const corner of corners) {
        tieVertices.push(corner.x, corner.y, corner.z);
      }

      tieIndices.push(
        tieVertexCount,
        tieVertexCount + 2,
        tieVertexCount + 1,
        tieVertexCount + 1,
        tieVertexCount + 2,
        tieVertexCount + 3,
      );
      tieVertexCount += 4;
    }

    const tieGeometry = new THREE.BufferGeometry();
    tieGeometry.setAttribute('position', new THREE.Float32BufferAttribute(tieVertices, 3));
    tieGeometry.setIndex(tieIndices);
    tieGeometry.computeVertexNormals();
    const tieMaterial = new THREE.MeshBasicMaterial({
      color: 0x2f4f4f,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
    });
    group.add(new THREE.Mesh(tieGeometry, tieMaterial));

    const railMaterial = new THREE.LineBasicMaterial({
      color: 0xfff1dd,
      transparent: true,
      opacity: 0.85,
    });
    const railOffset = 0.82;
    const leftRail = [];
    const rightRail = [];
    for (let i = 0; i < n; i++) {
      const frame = this.frames[i];
      leftRail.push(
        frame.position
          .clone()
          .addScaledVector(frame.right, -railOffset)
          .addScaledVector(frame.up, 0.045),
      );
      rightRail.push(
        frame.position
          .clone()
          .addScaledVector(frame.right, railOffset)
          .addScaledVector(frame.up, 0.045),
      );
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(leftRail), railMaterial));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rightRail), railMaterial));

    const startA = this.getFrameAt(START_BAND_START);
    const startB = this.getFrameAt(START_BAND_END);
    const aLeft = startA.position
      .clone()
      .addScaledVector(startA.right, -halfWidth)
      .addScaledVector(startA.up, 0.05);
    const aRight = startA.position
      .clone()
      .addScaledVector(startA.right, halfWidth)
      .addScaledVector(startA.up, 0.05);
    const bLeft = startB.position
      .clone()
      .addScaledVector(startB.right, -halfWidth)
      .addScaledVector(startB.up, 0.05);
    const bRight = startB.position
      .clone()
      .addScaledVector(startB.right, halfWidth)
      .addScaledVector(startB.up, 0.05);

    const bandGeometry = new THREE.BufferGeometry();
    bandGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [
          aLeft.x,
          aLeft.y,
          aLeft.z,
          aRight.x,
          aRight.y,
          aRight.z,
          bLeft.x,
          bLeft.y,
          bLeft.z,
          bRight.x,
          bRight.y,
          bRight.z,
        ],
        3,
      ),
    );
    bandGeometry.setIndex([0, 2, 1, 1, 2, 3]);
    bandGeometry.computeVertexNormals();
    const bandMaterial = new THREE.MeshBasicMaterial({
      color: 0xfff1dd,
      side: THREE.DoubleSide,
    });
    group.add(new THREE.Mesh(bandGeometry, bandMaterial));

    return group;
  }

  dispose() {
    const geometries = new Set();
    const materials = new Set();

    this.mesh.traverse((child) => {
      if (child.geometry) geometries.add(child.geometry);
      if (child.material) {
        const list = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of list) materials.add(material);
      }
    });

    for (const material of materials) {
      for (const key of Object.keys(material)) {
        const value = material[key];
        if (value?.isTexture) {
          value.dispose();
          material[key] = null;
        }
      }
      material.dispose();
    }
    for (const geometry of geometries) geometry.dispose();

    this.mesh.clear();
  }
}

export function createTestTrack() {
  return new Track(TEST_TRACK_POINTS);
}
