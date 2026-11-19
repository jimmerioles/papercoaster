import * as THREE from 'three';

export class Ride {
  constructor(track, camera) {
    this.track = track;
    this.camera = camera;
    this.baseFov = 68;
    this.comfort = false;
    this.reset();
  }

  reset() {
    this.t = 0;
    this.speed = 0;
    this.maxSpeed = 0;
    this.finished = false;
    this.started = false;
    this.startHeight = this.track.getFrameAt(0).position.y;
    this.startSpeed = 11;
    this.minSpeed = 13;
    this.maxSpeedLimit = 52;
    this.lookAheadBase = 0.02;
    this.lookAheadSpeed = 0.0008;
    this._setCameraAt(0, 0);
  }

  start() {
    this.started = true;
    this.speed = 4;
  }

  update(dt) {
    if (!this.started || this.finished) return;

    const frame = this.track.getFrameAt(this.t);
    const height = frame.position.y;
    const target = Math.sqrt(
      Math.max(
        this.minSpeed * this.minSpeed,
        this.startSpeed * this.startSpeed + 2 * 9.8 * (this.startHeight - height)
      )
    );

    const response = 1 - Math.exp(-dt * 4);
    this.speed += (target - this.speed) * response;
    this.speed *= 1 - 0.01 * dt;
    this.speed = Math.min(this.speed, this.maxSpeedLimit);
    this.maxSpeed = Math.max(this.maxSpeed, this.speed);

    this.t += (this.speed * dt) / this.track.length;
    if (this.t >= 1) {
      this.t = 1;
      this.finished = true;
    }

    this._setCameraAt(this.t, this.speed);
  }

  _setCameraAt(u, speed) {
    const frame = this.track.getFrameAt(u);
    const seat = frame.up.clone().multiplyScalar(2.2);
    this.camera.position.copy(frame.position).add(seat);

    const lookAhead = THREE.MathUtils.clamp(
      this.lookAheadBase + speed * this.lookAheadSpeed,
      0.02,
      0.06
    );
    const lookU = Math.min(u + lookAhead, 1);
    const lookFrame = this.track.getFrameAt(lookU);
    const lookTarget = lookFrame.position.clone().add(lookFrame.up.clone().multiplyScalar(1.8));

    let up = frame.up.clone();
    if (this.comfort) {
      const worldUp = new THREE.Vector3(0, 1, 0);
      up.lerp(worldUp, 0.68).normalize();
      const viewDir = lookTarget.clone().sub(this.camera.position).normalize();
      up.sub(viewDir.clone().multiplyScalar(up.dot(viewDir))).normalize();
    }

    this.camera.up.copy(up);
    this.camera.lookAt(lookTarget);

    const speedRatio = THREE.MathUtils.clamp(speed / this.maxSpeedLimit, 0, 1);
    const targetFov = this.baseFov + speedRatio * 16;
    this.camera.fov += (targetFov - this.camera.fov) * 0.12;
    this.camera.updateProjectionMatrix();
  }

  idle(dt) {
    this._idleTime = (this._idleTime || 0) + dt;
    const frame = this.track.getFrameAt(0);
    const bob = Math.sin(this._idleTime * 0.9) * 0.06;
    this.camera.position.copy(frame.position).add(frame.up.clone().multiplyScalar(2.2 + bob));

    const lookFrame = this.track.getFrameAt(0.1);
    const lookTarget = lookFrame.position.clone().add(lookFrame.up.clone().multiplyScalar(1.8));
    this.camera.up.copy(frame.up);
    this.camera.lookAt(lookTarget);
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
  }

  freezeAt(u) {
    this.t = u;
    this.speed = 24;
    this._setCameraAt(u, 24);
    this.finished = true;
  }
}
