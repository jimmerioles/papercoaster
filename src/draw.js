import { prepareStroke } from './stroke.js';

const INK = '#2f4f4f';
const CORAL = '#e85d3f';
const PAPER = '#fff7eb';

export class DrawScreen {
  constructor(canvas, { onChange } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onChange = onChange;
    this.points = [];
    this.result = null;
    this.active = false;
    this.pointerId = null;
    this.width = 0;
    this.height = 0;

    this._resize = this._resize.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onPointerCancel = this._onPointerCancel.bind(this);

    this.canvas.addEventListener('pointerdown', this._onPointerDown);
    this.canvas.addEventListener('pointermove', this._onPointerMove);
    this.canvas.addEventListener('pointerup', this._onPointerUp);
    this.canvas.addEventListener('pointercancel', this._onPointerCancel);
    this.canvas.addEventListener('lostpointercapture', this._onPointerCancel);
    window.addEventListener('resize', this._resize);
  }

  open() {
    this.active = true;
    this._resize();
    this.clear({ notify: false });
  }

  close() {
    this.active = false;
    const pointerId = this.pointerId;
    this.pointerId = null;
    if (pointerId !== null && this.canvas.hasPointerCapture(pointerId)) {
      this.canvas.releasePointerCapture(pointerId);
    }
  }

  clear({ notify = true } = {}) {
    this.points = [];
    this.result = null;
    this._render();

    if (notify) {
      this.onChange?.({ ok: false, reason: null, points: [] });
    }
  }

  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scaleX = this.width > 0 ? width / this.width : 1;
    const scaleY = this.height > 0 ? height / this.height : 1;

    if (this.points.length > 0 && (scaleX !== 1 || scaleY !== 1)) {
      this.points = this.points.map((point) => ({
        x: point.x * scaleX,
        y: point.y * scaleY,
      }));

      if (this.result) {
        const result = prepareStroke(this.points, { width, height });
        this.result = result.ok ? result : null;
        if (!result.ok) {
          this.points = [];
          this.onChange?.(result);
        }
      }
    }

    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._render();
  }

  _point(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  _onPointerDown(event) {
    if (!this.active || this.pointerId !== null) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (this.result || this.points.length > 0) return;

    event.preventDefault();
    this.pointerId = event.pointerId;
    try {
      this.canvas.setPointerCapture(event.pointerId);
    } catch {
      this.pointerId = null;
      return;
    }
    this.points = [this._point(event)];
    this._render();
  }

  _onPointerMove(event) {
    if (!this.active || event.pointerId !== this.pointerId) return;
    event.preventDefault();

    const point = this._point(event);
    const previous = this.points[this.points.length - 1];
    if (!previous || Math.hypot(point.x - previous.x, point.y - previous.y) > 0.6) {
      this.points.push(point);
      this._render();
    }
  }

  _onPointerUp(event) {
    if (!this.active || event.pointerId !== this.pointerId) return;

    this.pointerId = null;
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }

    const result = prepareStroke(this.points, { width: this.width, height: this.height });

    if (!result.ok) {
      this.points = [];
      this.result = null;
      this._render();
      this.onChange?.(result);
      return;
    }

    this.result = result;
    this._render();
    this.onChange?.(result);
  }

  _onPointerCancel(event) {
    if (!this.active || event.pointerId !== this.pointerId) return;

    this.pointerId = null;
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }

    this.points = [];
    this.result = null;
    this._render();
    this.onChange?.({ ok: false, reason: 'cancelled', points: [] });
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.points.length === 0) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (this.points.length === 1) {
      const point = this.points[0];
      ctx.fillStyle = CORAL;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const path = new Path2D();
    path.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length - 1; i++) {
      const current = this.points[i];
      const next = this.points[i + 1];
      path.quadraticCurveTo(
        current.x,
        current.y,
        (current.x + next.x) / 2,
        (current.y + next.y) / 2,
      );
    }
    const last = this.points[this.points.length - 1];
    path.lineTo(last.x, last.y);

    ctx.strokeStyle = 'rgba(232, 93, 63, 0.16)';
    ctx.lineWidth = 13;
    ctx.stroke(path);

    ctx.strokeStyle = CORAL;
    ctx.lineWidth = 5;
    ctx.stroke(path);

    ctx.strokeStyle = 'rgba(255, 247, 235, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.stroke(path);

    const start = this.points[0];
    const end = last;
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    for (const point of [start, end]) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}
