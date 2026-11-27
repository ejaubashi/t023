export const maxTake = 4000;

export const exampleTake = [
  { t: 0, x: .57, y: .42 },
  { t: 500, x: .69, y: .35 },
  { t: 1100, x: .65, y: .54 },
  { t: 1750, x: .45, y: .59 },
  { t: 2300, x: .32, y: .43 },
  { t: 2800, x: .44, y: .32 },
  { t: 3200, x: .57, y: .42 },
];

export function positionAt(points, time) {
  const next = points.findIndex(point => point.t > time);
  if (next <= 0) {
    const { x, y } = next === 0 ? points[0] : points.at(-1);
    return { x, y };
  }
  const a = points[next - 1];
  const b = points[next];
  const mix = (time - a.t) / (b.t - a.t);
  return { x: a.x + (b.x - a.x) * mix, y: a.y + (b.y - a.y) * mix };
}

export function finishTake(points) {
  if (points.length < 2) return null;
  const start = points[0];
  if (!points.some(point => Math.hypot(point.x - start.x, point.y - start.y) > .02)) return null;
  const duration = points.at(-1).t;
  const scale = Math.max(600, duration) / duration;
  return points.map(point => ({ ...point, t: Math.round(point.t * scale) }));
}

export function timeLabel(time) {
  return (Math.max(0, time) / 1000).toFixed(2);
}
