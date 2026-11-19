const WORLD_MAP = Object.freeze({
  x: 0,
  zNear: -30,
  zFar: 170,
  yLow: 6,
  yHigh: 70,
});

export const STROKE_LIMITS = Object.freeze({
  minLength: 60,
  maxSegment: 40,
  dedupeDistance: 0.75,
  spacing: 2,
  smoothingPasses: 2,
  canvasTolerance: 1,
});

const REASONS = Object.freeze({
  invalid: 'That stroke could not be read. Try again.',
  outside: 'Keep the whole stroke on the paper.',
  short: 'Draw a longer line. At least a small hill.',
  jump: 'That line jumped. Draw one continuous stroke.',
});

export function describeStrokeError(reason) {
  return REASONS[reason] ?? 'That stroke could not be read. Try again.';
}

export function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function polylineLength(points) {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += pointDistance(points[i - 1], points[i]);
  }
  return length;
}

function pointDistance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  if (Number.isFinite(a.z) && Number.isFinite(b.z)) {
    return Math.hypot(dx, dy, a.z - b.z);
  }
  return Math.hypot(dx, dy);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function dropNearDuplicates(points, minDistance = STROKE_LIMITS.dedupeDistance) {
  const kept = [];

  for (const point of points) {
    const previous = kept[kept.length - 1];
    if (!previous || distance2D(previous, point) >= minDistance) {
      kept.push({ x: point.x, y: point.y });
    }
  }

  return kept;
}

function mix(a, b, t) {
  const point = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
  if (Number.isFinite(a.z) && Number.isFinite(b.z)) {
    point.z = lerp(a.z, b.z, t);
  }
  return point;
}

export function chaikin(points, iterations = STROKE_LIMITS.smoothingPasses) {
  let current = points.map((point) => ({ ...point }));

  for (let pass = 0; pass < iterations; pass++) {
    if (current.length < 3) return current;

    const next = [current[0]];
    for (let i = 0; i < current.length - 1; i++) {
      const a = current[i];
      const b = current[i + 1];
      next.push(mix(a, b, 0.25));
      next.push(mix(a, b, 0.75));
    }
    next.push(current[current.length - 1]);
    current = next;
  }

  return current;
}

function samePoint(a, b) {
  return Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9;
}

export function resample(points, spacing = STROKE_LIMITS.spacing) {
  if (points.length < 2 || spacing <= 0) {
    return points.map((point) => ({ ...point }));
  }

  const total = polylineLength(points);
  if (total < 1e-9) return points.map((point) => ({ ...point }));

  const result = [{ ...points[0] }];
  let carried = 0;
  let segmentStart = points[0];

  for (let i = 1; i < points.length; i++) {
    const segmentEnd = points[i];
    let segmentLength = pointDistance(segmentStart, segmentEnd);

    while (carried + segmentLength >= spacing && segmentLength > 1e-9) {
      const t = (spacing - carried) / segmentLength;
      const point = mix(segmentStart, segmentEnd, t);

      result.push(point);
      segmentStart = point;
      segmentLength = pointDistance(segmentStart, segmentEnd);
      carried = 0;
    }

    carried += segmentLength;
    segmentStart = segmentEnd;
  }

  const last = points[points.length - 1];
  if (!samePoint(result[result.length - 1], last)) {
    result.push({ ...last });
  }

  return result;
}

export function mapStrokeToWorld(points, { width, height }) {
  return points.map((point) => {
    const u = clamp(point.x / width, 0, 1);
    const v = clamp(1 - point.y / height, 0, 1);

    return {
      x: WORLD_MAP.x,
      y: lerp(WORLD_MAP.yLow, WORLD_MAP.yHigh, v),
      z: lerp(WORLD_MAP.zNear, WORLD_MAP.zFar, u),
    };
  });
}

export function prepareStroke(rawPoints, { width, height } = {}) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { ok: false, reason: 'invalid', points: [] };
  }

  if (!Array.isArray(rawPoints) || rawPoints.length === 0) {
    return { ok: false, reason: 'short', points: [] };
  }

  const valid = rawPoints.every(
    (point) => point && Number.isFinite(point.x) && Number.isFinite(point.y),
  );
  if (!valid) {
    return { ok: false, reason: 'invalid', points: [] };
  }

  const outside = rawPoints.some(
    (point) =>
      point.x < -STROKE_LIMITS.canvasTolerance ||
      point.x > width + STROKE_LIMITS.canvasTolerance ||
      point.y < -STROKE_LIMITS.canvasTolerance ||
      point.y > height + STROKE_LIMITS.canvasTolerance,
  );
  if (outside) {
    return { ok: false, reason: 'outside', points: [] };
  }

  const deduped = dropNearDuplicates(rawPoints);
  if (deduped.length < 2) {
    return { ok: false, reason: 'short', points: [] };
  }

  const mapped = mapStrokeToWorld(deduped, { width, height });

  for (let i = 1; i < mapped.length; i++) {
    if (pointDistance(mapped[i - 1], mapped[i]) > STROKE_LIMITS.maxSegment) {
      return { ok: false, reason: 'jump', points: [] };
    }
  }

  const smoothed = chaikin(mapped);
  const points = resample(smoothed);
  const length = polylineLength(points);

  if (length < STROKE_LIMITS.minLength) {
    return { ok: false, reason: 'short', points: [] };
  }

  return { ok: true, reason: null, points, length };
}
