import { loadImage, paintImage } from './effects.js';
import { positionAt } from './gesture.js';

export async function preparePhoto(file) {
  const types = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (!types.includes(file.type) || file.size > 15 * 1024 * 1024) {
    throw new Error('Choose a JPEG, PNG, WebP, or AVIF under 15 MB.');
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image could not be opened.');
  }

  try {
    const canvas = document.createElement('canvas');
    const ratio = Math.min(1, 1680 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const photo = canvas.toDataURL('image/webp', .82);
    return photo.length > 460000 ? canvas.toDataURL('image/webp', .65) : photo;
  } finally {
    bitmap.close();
  }
}

function lines(ctx, text, width) {
  const result = [];
  for (const paragraph of text.trim().split(/\r?\n/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const combined = line ? line + ' ' + word : word;
      if (line && ctx.measureText(combined).width > width) {
        result.push(line);
        line = word;
      } else line = combined;
      while (ctx.measureText(line).width > width) {
        let count = line.length - 1;
        while (ctx.measureText(line.slice(0, count)).width > width) count--;
        result.push(line.slice(0, count));
        line = line.slice(count);
      }
    }
    if (line) result.push(line);
  }
  return result;
}

async function composition(scene, type, filter, effect, pathSources) {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = type === 'post' ? 1350 : 1920;
  const { width, height } = canvas;
  const copyLayer = document.createElement('canvas');
  copyLayer.width = width;
  copyLayer.height = height;
  const ctx = copyLayer.getContext('2d');
  const [image, ...paths] = await Promise.all([scene.photo, ...pathSources].map(loadImage));

  const padding = 64;
  const titleFont = '800 76px Manrope, sans-serif';
  const captionFont = '550 36px Manrope, sans-serif';
  await Promise.all([document.fonts.load(titleFont), document.fonts.load(captionFont)]);
  ctx.font = titleFont;
  const title = lines(ctx, scene.title, width - 2 * padding);
  ctx.font = captionFont;
  const caption = lines(ctx, scene.caption, width - 2 * padding);
  const gap = title.length && caption.length ? 16 : 0;
  const top = height - padding - caption.length * 49 - gap - title.length * 86;
  if (title.length || caption.length) {
    const shade = ctx.createLinearGradient(0, Math.max(0, top - 240), 0, height);
    shade.addColorStop(0, 'rgba(15, 17, 18, 0)');
    shade.addColorStop(1, 'rgba(15, 17, 18, .92)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.textBaseline = 'top';
  ctx.font = titleFont;
  ctx.fillStyle = '#ffffff';
  title.forEach((line, index) => ctx.fillText(line, padding, top + index * 86));
  ctx.font = captionFont;
  ctx.fillStyle = '#f0eee9';
  caption.forEach((line, index) => ctx.fillText(line, padding, top + title.length * 86 + gap + index * 49));

  const output = canvas.getContext('2d');
  return {
    canvas,
    draw(position) {
      paintImage(output, image, filter, position ? { ...effect, x: position.x, y: position.y } : effect, paths);
      output.drawImage(copyLayer, 0, 0);
    },
  };
}

function download(blob, title, type, extension) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const name = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  link.download = `${name || `afterglow-${type}`}.${extension}`;
  link.href = url;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function downloadFrame(scene, type, filter, effect, pathSources) {
  const { canvas, draw } = await composition(scene, type, filter, effect, pathSources);
  draw();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('PNG export failed.');
  download(blob, scene.title, type, 'png');
}

const formats = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'];

export function motionFormat() {
  if (!globalThis.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return undefined;
  return formats.find(format => MediaRecorder.isTypeSupported(format));
}

export async function downloadMotion(scene, type, filter, effect, pathSources, points) {
  const format = motionFormat();
  if (!format) throw new Error('Motion export is unavailable in this browser.');
  const { canvas, draw } = await composition(scene, type, filter, effect, pathSources);
  const duration = points.at(-1).t;
  const stream = canvas.captureStream(30);
  let timer;
  let recorder;
  try {
    recorder = new MediaRecorder(stream, { mimeType: format, videoBitsPerSecond: 5500000 });
    const chunks = [];
    const result = new Promise((resolve, reject) => {
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => reject(new Error('The browser could not encode the video.'));
      recorder.onstop = () => {
        if (chunks.length) resolve(new Blob(chunks, { type: recorder.mimeType }));
        else reject(new Error('The browser did not capture any frames.'));
      };
      recorder.start();
      const start = performance.now();
      const tick = () => {
        const elapsed = performance.now() - start;
        try {
          draw(positionAt(points, Math.min(elapsed, duration)));
          if (elapsed >= duration) timer = setTimeout(() => recorder.stop(), 40);
          else timer = setTimeout(tick, 1000 / 30);
        } catch (error) {
          reject(error);
        }
      };
      tick();
    });
    const blob = await result;
    const extension = format.startsWith('video/mp4') ? 'mp4' : 'webm';
    download(blob, scene.title, type, extension);
    return extension.toUpperCase();
  } finally {
    clearTimeout(timer);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream.getTracks().forEach(track => track.stop());
  }
}
