export const templates = {
  post: { kind: 'prism', x: .57, y: .42, power: .76, size: .61 },
  story: { kind: 'fork', x: .52, y: .41, power: .81, size: .68 },
};

const photos = new Map();

export function loadImage(source) {
  if (!source) return Promise.resolve(null);
  if (!photos.has(source)) {
    const image = new Image();
    image.src = source;
    if (photos.size >= 12) photos.delete(photos.keys().next().value);
    photos.set(source, image.decode().then(() => image));
  }
  return photos.get(source);
}

function cover(ctx, image, filter, shiftX = 0, shiftY = 0, zoom = 1) {
  if (!image) return;
  const { width, height } = ctx.canvas;
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * zoom;
  const w = image.naturalWidth * scale;
  const h = image.naturalHeight * scale;
  ctx.filter = filter;
  ctx.drawImage(image, (width - w) * .56 + shiftX, (height - h) * .5 + shiftY, w, h);
  ctx.filter = 'none';
}

function shape(ctx, x, y, radius, stretch, rotation) {
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * stretch, rotation, 0, Math.PI * 2);
}

function prism(ctx, image, filter, effect) {
  const { width: w, height: h } = ctx.canvas;
  const x = effect.x * w, y = effect.y * h;
  const radius = w * (.13 + .31 * effect.size);
  for (let i = 0; i < 6; i++) {
    const r = radius * (1 - i * .13);
    const center = x + (i - 2) * w * .009 * effect.power;
    shape(ctx, center, y, r, 1.18, -.35);
    ctx.save();
    ctx.clip();
    cover(ctx, image, filter, (i % 2 ? -1 : 1) * (i + 1) * w * .024 * effect.power, -i * w * .018 * effect.power, 1.12 + effect.power * .11 * i);
    ctx.globalAlpha = .16 * effect.power;
    ctx.fillStyle = i % 2 ? '#7767ff' : '#ffc9a5';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    ctx.strokeStyle = `rgba(226, 218, 255, ${.18 + .38 * effect.power})`;
    ctx.lineWidth = w * .0016;
    ctx.stroke();
  }
}

function echo(ctx, image, filter, effect) {
  const { width: w, height: h } = ctx.canvas;
  const x = effect.x * w, y = effect.y * h;
  const span = w * (.14 + .39 * effect.size);
  const rows = 12;
  for (let i = 0; i < rows; i++) {
    const position = (i + .5) / rows * 2 - 1;
    const band = span * 2 / rows;
    const strength = 1 - Math.abs(position) ** 1.55;
    const reach = span * strength;
    const left = x - reach;
    const top = y + position * span - band * .46;
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, reach * 2, band * .93);
    ctx.clip();
    const amount = w * .25 * strength * effect.power;
    cover(ctx, image, filter, Math.sin(i * 1.7) * amount, Math.cos(i) * amount * .22, 1 + effect.power * .31);
    ctx.fillStyle = i % 2 ? '#a4eaff31' : '#f78de333';
    ctx.globalAlpha = effect.power;
    ctx.fillRect(left, top, reach * 2, band * .065);
    ctx.restore();
  }
}

function fork(ctx, image, filter, effect, paths) {
  const { width: w, height: h } = ctx.canvas;
  const center = effect.x * w, y = effect.y * h;
  const radius = w * (.10 + .29 * effect.size);
  for (const [i, sign] of [-1, 1].entries()) {
    const x = center + sign * radius * .83;
    shape(ctx, x, y + sign * radius * .19, radius, 1.83, sign * .32);
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = effect.power;
    cover(ctx, paths[i] || image, paths[i] ? 'none' : filter, sign * radius * .52, -radius * .26, 1.19);
    ctx.restore();
    ctx.strokeStyle = i === 0 ? '#e5abeca6' : '#9beee2a6';
    ctx.lineWidth = w * .0028;
    ctx.stroke();
  }
}

export function paintImage(ctx, image, filter, effect, paths = []) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = '#222032';
  ctx.fillRect(0, 0, width, height);
  cover(ctx, image, filter);
  if (!image || !effect || !effect.power) return;
  if (effect.kind === 'prism') prism(ctx, image, filter, effect);
  else if (effect.kind === 'echo') echo(ctx, image, filter, effect);
  else if (effect.kind === 'fork') fork(ctx, image, filter, effect, paths);
}
