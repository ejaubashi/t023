import { example, blank, grades, refreshStockExamples } from './data.js?v=print';
import { downloadFrame, downloadMotion, motionFormat, preparePhoto } from './media.js?v=print';
import { loadImage, paintImage, templates } from './effects.js';
import { exampleTake, finishTake, maxTake, positionAt, timeLabel } from './gesture.js';

const glyphs = {
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m3 17 4-4 3 3 4.8-5 6.2 6"/>',
  fork: '<path d="M12 21v-7a5 5 0 0 0-5-5H4m0 0 3-3M4 9l3 3m5 2a5 5 0 0 1 5-5h3m0 0-3-3m3 3-3 3"/>',
  right: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  left: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  split: '<path d="m9 9-3 3 3 3m6-6 3 3-3 3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  play: '<path d="m8 5 11 7-11 7z"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  canvas: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6m-6 10h6"/>',
  tune: '<path d="M4 7h16m-16 10h16M9 4v6m6 4v6"/>',
  edit: '<path d="m13 6 5 5M5 19l4.5-1 10-10a2 2 0 0 0-4-4l-10 10z"/>',
  focus: '<path d="M9 4H4v5m11-5h5v5m-5 11h5v-5M9 20H4v-5"/>',
};

const main = document.querySelector('#main');
const screen = document.querySelector('#screen');
const toolbar = document.querySelector('#workspace-tools');
const status = document.querySelector('#status');
const navigation = document.querySelectorAll('[data-nav]');
const storageKey = 'afterglow-studio.v1';
const projects = loadProjects();
const views = { post: 'example', story: 'example', ...projects.views };
const openedDrafts = projects.openedDrafts ??= {};
const uploads = new WeakMap();
let page = pageFromHash();
let postTab = 'main';
let route = -1;
let frame = 0;
let split = 50;
let toastTimer;
let saveTimer;
let exporting = false;
let drag;
let paintRequest = 0;
let motion;
let recording;
let playhead = 0;
let trackScene;
let mobilePanel = 'canvas';
let focusedCanvas = false;
const videoFormat = motionFormat();

function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyphs[name]}</svg>`;
}

const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => entities[character]);
}

for (const element of document.querySelectorAll('[data-icon]')) element.innerHTML = icon(element.dataset.icon);

function loadProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved?.example?.post && saved?.example?.story && saved?.draft?.post && saved?.draft?.story) {
      refreshStockExamples(saved.example);
      return saved;
    }
  } catch {
    // An empty or unavailable store starts a new editing session.
  }
  return { example: structuredClone(example), draft: structuredClone(blank) };
}

function save() {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(storageKey, JSON.stringify({ ...projects, views }));
  } catch {
    notify('Browser storage is unavailable. Changes will stay in this tab.');
  }
}

function pageFromHash() {
  return ['#story-studio', '#story-forks', '#stories'].includes(location.hash) ? 'story' : 'post';
}

function project() {
  return projects[views[page]][page];
}

function activeScene() {
  const current = project();
  if (page === 'post') return postTab === 'context' ? current.context : current.main;
  return route < 0 ? current.opening : current.routes[route].frames[frame];
}

function filter() {
  return page === 'post' && postTab !== 'context' ? grades[project().grade].filter : 'none';
}

const effects = {
  prism: ['Prism', 'Refract a point into six glass rings'],
  echo: ['Echo', 'Pull a moment into displaced scanlines'],
  fork: ['Fork Lens', 'Bring both routes into one frame'],
  none: ['Clean', 'Remove the spatial effect'],
};

function effectState() {
  const scene = activeScene();
  if (scene.effect) return scene.effect;
  const firstFrame = page === 'post' ? postTab !== 'context' : route < 0;
  const mode = views[page] === 'example' && firstFrame ? templates[page].kind : 'none';
  return { ...templates[page], kind: mode };
}

function pathSources() {
  return page === 'story' && effectState().kind === 'fork'
    ? project().routes.map(item => item.frames[0].photo)
    : [];
}

function canMove() {
  return activeScene().photo && effectState().kind !== 'none' && !(page === 'post' && postTab === 'grade');
}

function take() {
  if (!canMove()) return null;
  const firstFrame = page === 'post' ? postTab === 'main' : route < 0;
  return activeScene().gesture ?? (views[page] === 'example' && firstFrame ? exampleTake : null);
}

function motionDeck() {
  return `<section class="motion-deck" aria-labelledby="motion-heading">
    <div class="motion-top">
      <div class="motion-title"><h2 id="motion-heading">Gesture track</h2><output id="motion-time" aria-live="off"></output></div>
      <button class="motion-export" type="button" data-key="motion-export">${icon('download')}Export motion</button>
    </div>
    <div class="motion-transport">
      <button class="record-button" type="button" data-key="record"><i aria-hidden="true"></i><span>Record</span></button>
      <button class="play-button" type="button" data-key="play-take" aria-label="Play gesture">${icon('play')}</button>
      <div class="motion-lane">
        <svg viewBox="0 0 300 42" preserveAspectRatio="none" aria-hidden="true"><path></path></svg>
        <input id="gesture-scrub" type="range" min="0" max="0" value="0" step="1" aria-label="Scrub gesture">
      </div>
    </div>
    <p class="motion-hint" id="motion-hint"></p>
  </section>`;
}

function updateDeck() {
  const deck = screen.querySelector('.motion-deck');
  const points = take();
  const duration = points?.at(-1).t || 0;
  const drawing = recording?.points;
  const elapsed = drawing?.at(-1)?.t ?? playhead;
  const record = deck.querySelector('[data-key="record"]');
  record.querySelector('span').textContent = drawing?.length ? 'Finish' : recording ? 'Cancel' : 'Record';
  record.setAttribute('aria-pressed', String(Boolean(recording)));
  record.disabled = !canMove();
  const play = deck.querySelector('[data-key="play-take"]');
  const playing = motion?.kind === 'take';
  play.disabled = !points || Boolean(recording);
  const playLabel = playing ? 'Pause gesture' : 'Play gesture';
  if (play.getAttribute('aria-label') !== playLabel) {
    play.setAttribute('aria-label', playLabel);
    play.innerHTML = icon(playing ? 'pause' : 'play');
  }
  deck.querySelector('[data-key="motion-export"]').disabled = !points || Boolean(recording) || exporting || !videoFormat;
  deck.querySelector('#motion-time').textContent = `${timeLabel(elapsed)} / ${timeLabel(recording ? maxTake : duration)} s`;
  deck.querySelector('#motion-hint').textContent = recording
    ? 'Drag on the image or move the point with the arrow keys.'
    : !canMove() ? 'Add a photo and choose an effect to record.'
    : points ? (videoFormat ? 'Drag the playhead to pick a frame.' : 'This browser supports playback and PNG export.')
    : 'Record a drag to create a motion take.';
  const input = deck.querySelector('#gesture-scrub');
  input.disabled = !points || Boolean(recording);
  input.max = duration;
  input.value = Math.min(playhead, duration);
  input.setAttribute('aria-valuetext', `${timeLabel(playhead)} seconds`);
  input.parentElement.style.setProperty('--playhead', `${duration ? playhead / duration * 100 : 0}%`);
  const visible = drawing?.length ? drawing : points;
  const length = drawing?.length ? maxTake : duration;
  const path = visible ? visible.map((point, index) =>
    `${index ? 'L' : 'M'} ${(point.t / length * 300).toFixed(1)} ${(33 - point.y * 25).toFixed(1)}`).join(' ') : '';
  deck.querySelector('.motion-lane path').setAttribute('d', path);
  const guide = screen.querySelector('.gesture-guide polyline');
  if (guide) guide.setAttribute('points', drawing?.map(point =>
    `${(point.x * 100).toFixed(1)},${(point.y * 100).toFixed(1)}`).join(' ') || '');
}

function capturePoint() {
  if (!recording) return;
  const now = performance.now();
  recording.start ??= now;
  const t = Math.min(maxTake, Math.round(now - recording.start));
  const latest = recording.points.at(-1);
  if (latest && t - latest.t < 12) return;
  const { x, y } = effectState();
  recording.points.push({ t, x, y });
  if (t >= maxTake) endRecord();
  else updateDeck();
}

function endRecord() {
  const points = finishTake(recording.points);
  const attempted = recording.points.length > 0;
  recording = null;
  if (points) {
    activeScene().gesture = points;
    playhead = points.at(-1).t;
    activeScene().gestureTime = playhead;
    save();
    notify('Gesture recorded.');
  } else if (attempted) notify('Move the point farther to record a gesture.');
  updateDeck();
}

function playTake() {
  const points = take();
  if (!points || recording) return;
  const paused = motion?.kind === 'take';
  stopOrbit(true);
  if (paused) return;
  const duration = points.at(-1).t;
  const start = performance.now() - (playhead >= duration ? 0 : playhead);
  motion = { kind: 'take', position: positionAt(points, playhead), lastFrame: -Infinity };
  const tick = time => {
    if (motion?.kind !== 'take') return;
    if (time - motion.lastFrame >= 1000 / 30) {
      playhead = Math.min(duration, Math.max(0, time - start));
      motion.position = positionAt(points, playhead);
      motion.lastFrame = time;
      showPin(motion.position);
      updateDeck();
      if (playhead >= duration) {
        stopOrbit(true);
        return;
      }
    }
    motion.request = requestAnimationFrame(tick);
  };
  updateDeck();
  motion.request = requestAnimationFrame(tick);
}

function effectsRail() {
  const selected = effectState();
  const tools = [page === 'post' ? 'prism' : 'fork', 'echo', 'none'];
  const showingEffect = selected.kind !== 'none' && !(page === 'post' && postTab === 'grade');
  return `<aside id="effects-pane" class="effect-rail" aria-labelledby="effects-heading">
    <h2 id="effects-heading">Effects</h2>
    <div class="effect-list">${tools.map(kind => `<button class="effect-tool" type="button" data-key="effect-${kind}" aria-pressed="${selected.kind === kind}">
      <span class="effect-icon ${kind}" aria-hidden="true"><i></i><i></i><i></i></span>
      <span><strong>${effects[kind][0]}</strong><small>${effects[kind][1]}</small></span>
    </button>`).join('')}</div>
    ${showingEffect ? `<div class="effect-settings">
      <label><span>Intensity <span class="range-value" aria-hidden="true">${Math.round(selected.power * 100)}%</span></span><input data-effect="power" type="range" min="0" max="100" value="${Math.round(selected.power * 100)}"></label>
      <label><span>Spread <span class="range-value" aria-hidden="true">${Math.round(selected.size * 100)}%</span></span><input data-effect="size" type="range" min="0" max="100" value="${Math.round(selected.size * 100)}"></label>
      ${activeScene().photo ? '<button class="orbit-button" type="button" data-key="orbit">Play orbit</button>' : ''}
    </div>` : ''}
  </aside>`;
}

const panels = [
  ['canvas', 'Canvas', 'canvas', 'canvas-pane'],
  ['effects', 'Effects', 'tune', 'effects-pane'],
  ['edit', 'Edit', 'edit', 'editor-pane'],
];

function mobileDock() {
  return `<div class="mobile-dock" role="group" aria-label="Workspace tools">
    ${panels.map(([id, label, glyph, pane]) =>
      `<button type="button" data-panel="${id}" aria-pressed="${id === mobilePanel}" aria-controls="${pane}">${icon(glyph)}<span>${label}</span></button>`
    ).join('')}
  </div>`;
}

async function paintPreview() {
  const canvas = screen.querySelector('.effect-canvas');
  if (!canvas) return;
  const request = ++paintRequest;
  const effect = { ...effectState(), ...motion?.position };
  const color = filter();
  try {
    const [photo, ...paths] = await Promise.all([activeScene().photo, ...pathSources()].map(loadImage));
    if (request !== paintRequest || !canvas.isConnected) return;
    paintImage(canvas.getContext('2d'), photo, color, effect, paths);
    canvas.classList.add('ready');
  } catch {
    if (canvas.isConnected) notify('The preview could not load this image.');
  }
}

function pinPosition(x, y) {
  return {
    x: Math.max(.03, Math.min(.97, x)),
    y: Math.max(.03, Math.min(.97, y)),
  };
}

function showPin(next) {
  const pin = screen.querySelector('.effect-pin');
  if (!pin) return;
  pin.style.left = `${next.x * 100}%`;
  pin.style.top = `${next.y * 100}%`;
  pin.setAttribute('aria-label', `Effect position, ${Math.round(next.x * 100)}% across, ${Math.round(next.y * 100)}% down. Use arrow keys to move.`);
  void paintPreview();
}

function movePin(x, y) {
  activeScene().effect = { ...effectState(), ...pinPosition(x, y) };
  showPin(activeScene().effect);
}

function stopOrbit(freeze = false) {
  if (!motion) return;
  const { request, position, kind } = motion;
  cancelAnimationFrame(request);
  motion = null;
  const button = screen.querySelector('[data-key="orbit"]');
  if (button) button.textContent = 'Play orbit';
  if (freeze) {
    activeScene().effect = { ...effectState(), ...position };
    if (kind === 'take') activeScene().gestureTime = playhead;
    showPin(activeScene().effect);
    save();
  }
  if (screen.querySelector('.motion-deck')) updateDeck();
}

function toggleOrbit(button) {
  if (motion) {
    stopOrbit(true);
    return;
  }
  const { x, y } = effectState();
  const origin = pinPosition(x, y);
  const start = performance.now();
  motion = { position: origin, lastFrame: -Infinity };
  button.textContent = 'Freeze here';
  const tick = time => {
    if (!motion) return;
    if (time - motion.lastFrame >= 1000 / 30) {
      const phase = (time - start) * Math.PI * 2 / 3800;
      motion.position = pinPosition(x + Math.sin(phase) * .16, y + (Math.cos(phase) - 1) * .105);
      motion.lastFrame = time;
      showPin(motion.position);
    }
    motion.request = requestAnimationFrame(tick);
  };
  motion.request = requestAnimationFrame(tick);
}

function notify(text) {
  status.textContent = text;
  status.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => status.classList.remove('visible'), 3500);
}

function segment(key, label, active) {
  return `<button type="button" data-key="${key}" aria-pressed="${active}">${label}</button>`;
}

function fields() {
  const scene = activeScene();
  return `<label class="field"><span>Title</span><input data-field="title" maxlength="72" placeholder="Give it a title" value="${escapeHtml(scene.title)}"></label>
    <label class="field"><span>Caption</span><textarea data-field="caption" rows="3" maxlength="160" placeholder="Write a short caption">${escapeHtml(scene.caption)}</textarea></label>
    <div class="media-field">
      <label class="upload">${icon('image')}<span>${scene.photo ? 'Replace image' : 'Upload image'}</span>
        <input id="photo-upload" type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label="Upload image">
      </label>
      ${scene.photo ? `<button class="remove" type="button" data-key="remove-image" aria-label="Remove image" title="Remove image">${icon('close')}</button>` : ''}
    </div>`;
}

function postEditor() {
  return `<h2>Post layers</h2>
    <div class="segmented triple" role="group" aria-label="Post layers">
      ${segment('post-main', 'Main', postTab === 'main')}
      ${segment('post-context', 'Context', postTab === 'context')}
      ${segment('post-grade', 'Grade', postTab === 'grade')}
    </div>
    <div class="fields">
      ${postTab === 'grade' ? `<label class="field"><span>Color treatment</span>
        <select id="grade">${Object.entries(grades).map(([id, grade]) =>
          `<option value="${id}"${project().grade === id ? ' selected' : ''}>${grade.label}</option>`).join('')}</select>
        </label><p class="hint">${activeScene().photo ? 'Drag the divider to compare the original with your treatment. The treatment applies to the Main layer.' : 'Upload an image in the Main layer to preview a color treatment.'}</p>` : fields()}
    </div>`;
}

function storyEditor() {
  return `<h2>Story structure</h2>
    <div class="segmented triple" role="group" aria-label="Story structure">
      ${segment('route-start', 'Opening', route < 0)}
      ${segment('route-0', 'Route 1', route === 0)}
      ${segment('route-1', 'Route 2', route === 1)}
    </div>
    ${route >= 0 ? `<div class="segmented" role="group" aria-label="Frames on this route">
      ${segment('frame-0', 'First frame', frame === 0)}
      ${segment('frame-1', 'Ending', frame === 1)}
    </div>` : ''}
    <div class="fields">
      ${route >= 0 ? `<label class="field"><span>Choice label</span>
        <input data-field="route-name" maxlength="36" value="${escapeHtml(project().routes[route].name)}"></label>` : ''}
      ${fields()}
    </div>`;
}

function previewMedia() {
  const scene = activeScene();
  const compare = page === 'post' && postTab === 'grade' && scene.photo;
  const effect = effectState();
  const showEffect = !compare && scene.photo && effect.kind !== 'none';
  const photo = scene.photo && `<img class="scene-photo" src="${escapeHtml(scene.photo)}" alt="" style="filter:${compare ? 'none' : filter()}">`;
  const progress = route < 0 ? 0 : frame + 1;
  return `<div class="artboard ${page}${compare ? ' compare' : ''}" style="--split:${split}%">
    ${photo || `<div class="empty-photo">${icon('image')}<span>Upload an image to begin</span></div>`}
    ${showEffect ? `<canvas class="effect-canvas" width="600" height="${page === 'post' ? 750 : 1067}" aria-hidden="true"></canvas>
      <svg class="gesture-guide" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline></polyline></svg>
      <button class="effect-pin" type="button" aria-label="Effect position. Use arrow keys to move." style="left:${effect.x * 100}%;top:${effect.y * 100}%"></button>` : ''}
    ${compare ? `<img class="scene-photo treated" src="${escapeHtml(scene.photo)}" style="filter:${filter()}" alt="">
      <div class="compare-labels" aria-hidden="true"><span>Original</span><span>Treatment</span></div>
      <span class="divider" aria-hidden="true"><span>${icon('split')}</span></span>
      <input id="compare" type="range" min="0" max="100" value="${split}" aria-label="Original and treatment divider" aria-valuetext="${split}% original">
    ` : `<div class="art-copy">
      <h2 data-preview="title"${scene.title ? '' : ' hidden'}>${escapeHtml(scene.title)}</h2>
      <p data-preview="caption"${scene.caption ? '' : ' hidden'}>${escapeHtml(scene.caption)}</p>
    </div>`}
    ${page === 'story' ? `<div class="story-progress" role="img" aria-label="Frame ${progress + 1} of 3">${[0, 1, 2].map(index =>
        `<span class="${index === progress ? 'current' : index < progress ? 'past' : ''}"></span>`).join('')}</div>` : ''}
  </div>`;
}

function previewActions() {
  if (page !== 'story') return '';
  if (route < 0) return `<div class="preview-actions" role="group" aria-label="Play a story route">
    ${project().routes.map((item, index) =>
      `<button class="preview-button" type="button" data-key="preview-${index}">${escapeHtml(item.name || `Route ${index + 1}`)}${icon('right')}</button>`).join('')}
    </div>`;
  return `<div class="preview-actions">
    <button class="preview-button" type="button" data-key="preview-back">${icon('left')}Back to opening</button>
    ${frame === 0 ? `<button class="preview-button" type="button" data-key="preview-next">Continue${icon('right')}</button>` : '<span class="ending">Ending</span>'}
    </div>`;
}

function render() {
  stopOrbit();
  recording = null;
  if (trackScene !== activeScene()) {
    trackScene = activeScene();
    playhead = trackScene.gestureTime ?? 0;
  }
  const post = page === 'post';
  const usingExample = views[page] === 'example';
  const title = post ? 'Post Studio' : 'Story Studio';
  const switchLabel = !usingExample ? 'Open example' : openedDrafts[page] ? 'Open draft' : 'New draft';
  toolbar.innerHTML = `
    <button type="button" class="button secondary" data-key="switch-project">${icon(usingExample ? 'plus' : 'image')}${switchLabel}</button>
    <button type="button" class="button focus-toggle" data-key="focus-canvas" aria-pressed="${focusedCanvas}" aria-controls="canvas-pane" title="Focus on the canvas. Escape restores tools.">${icon('focus')}<span>${focusedCanvas ? 'Show tools' : 'Focus'}</span></button>
    <button type="button" class="button primary" data-key="export"${exporting ? ' disabled' : ''}>${icon('download')}Export PNG</button>`;
  screen.innerHTML = `
    <div class="studio ${post ? 'post-studio' : 'story-studio'}" data-mobile-panel="${mobilePanel}" data-focused="${focusedCanvas}">
      <div class="workspace-side">
        <div class="workspace-name">
          <h1>${title}</h1><span class="document-label"><i aria-hidden="true"></i>${usingExample ? 'Editable example' : 'Your draft'}</span>
        </div>
        ${effectsRail()}
      </div>
      <section id="canvas-pane" class="preview" aria-labelledby="preview-heading">
        <div class="preview-header"><h2 id="preview-heading">Canvas</h2><span>${post ? '1080 × 1350' : '1080 × 1920'}</span></div>
        <div class="workbench" id="preview-media">${previewMedia()}</div>
        ${previewActions()}
        ${motionDeck()}
      </section>
      ${mobileDock()}
      <section id="editor-pane" class="inspector" aria-label="${post ? 'Post editor' : 'Story editor'}">
        ${post ? postEditor() : storyEditor()}
      </section>
    </div>`;
  document.title = `${title} · Afterglow`;
  for (const link of navigation) {
    if (link.dataset.nav === page) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  updateDeck();
  void paintPreview();
}

function focusButton(key) {
  document.querySelector(`[data-key="${key}"]`)?.focus({ preventScroll: true });
}

function setCanvasFocus(active) {
  focusedCanvas = active;
  const button = toolbar.querySelector('[data-key="focus-canvas"]');
  screen.querySelector('.studio').dataset.focused = String(active);
  button.setAttribute('aria-pressed', String(active));
  button.querySelector('span').textContent = active ? 'Show tools' : 'Focus';
}

async function exportAsset(animated = false) {
  if (exporting) return;
  stopOrbit(true);
  const scene = { ...activeScene() };
  if (!scene.photo && !scene.title.trim() && !scene.caption.trim()) {
    notify('Add an image or text before exporting.');
    return;
  }
  const type = page;
  exporting = true;
  const button = toolbar.querySelector('[data-key="export"]');
  button.disabled = true;
  updateDeck();
  try {
    const effect = type === 'post' && postTab === 'grade' ? null : effectState();
    if (animated) {
      notify('Rendering your motion take…');
      const format = await downloadMotion(scene, type, filter(), effect, pathSources(), take());
      notify(`Motion downloaded as ${format}.`);
    } else {
      await downloadFrame(scene, type, filter(), effect, pathSources());
      notify(type === 'post' ? 'Post layer downloaded as PNG.' : 'Story frame downloaded as PNG.');
    }
  } catch {
    notify(animated ? 'Motion export failed in this browser. Your take is still saved.' : 'The export failed. Try replacing the image and exporting again.');
  } finally {
    exporting = false;
    toolbar.querySelector('[data-key="export"]').disabled = false;
    updateDeck();
  }
}

document.addEventListener('click', event => {
  const panel = event.target.closest('[data-panel]');
  if (panel) {
    mobilePanel = panel.dataset.panel;
    panel.closest('.studio').dataset.mobilePanel = mobilePanel;
    for (const button of screen.querySelectorAll('[data-panel]')) {
      button.setAttribute('aria-pressed', String(button === panel));
    }
    return;
  }
  const control = event.target.closest('[data-key]');
  const key = control?.dataset.key;
  if (!key) return;
  if (key === 'focus-canvas') {
    setCanvasFocus(!focusedCanvas);
    return;
  }
  if (key === 'export' || key === 'motion-export') {
    void exportAsset(key === 'motion-export');
    return;
  }
  if (key === 'record') {
    stopOrbit(true);
    if (recording) endRecord();
    else {
      recording = { points: [] };
      updateDeck();
    }
    return;
  }
  if (key === 'play-take') {
    playTake();
    return;
  }
  if (key === 'orbit') {
    toggleOrbit(control);
    return;
  }
  if (key.startsWith('effect-')) {
    if (page === 'post' && postTab === 'grade') postTab = 'main';
    activeScene().effect = { ...effectState(), kind: key.slice(7) };
    save();
  } else if (key.startsWith('post-')) postTab = key.slice(5);
  else if (key.startsWith('route-') || /^preview-[01]$/.test(key)) {
    route = key === 'route-start' ? -1 : Number(key.at(-1));
    frame = 0;
  } else if (key.startsWith('frame-')) frame = Number(key.at(-1));
  else if (key === 'preview-next') frame = 1;
  else if (key === 'preview-back') { route = -1; frame = 0; }
  else if (key === 'switch-project') {
    views[page] = views[page] === 'example' ? 'draft' : 'example';
    if (views[page] === 'draft') openedDrafts[page] = true;
    if (page === 'post') postTab = 'main';
    else { route = -1; frame = 0; }
    save();
  } else if (key === 'remove-image') {
    activeScene().photo = '';
    uploads.delete(activeScene());
    save();
  }
  render();
  if (/^preview-[01]$/.test(key)) focusButton('preview-next');
  else if (key === 'preview-next') focusButton('preview-back');
  else if (key === 'preview-back') focusButton('preview-0');
  else if (key === 'remove-image') screen.querySelector('#photo-upload').focus({ preventScroll: true });
  else focusButton(key);
});

screen.addEventListener('input', event => {
  const input = event.target;
  if (input.id === 'gesture-scrub') {
    const time = Number(input.value);
    stopOrbit(true);
    playhead = time;
    activeScene().gestureTime = time;
    const point = positionAt(take(), time);
    movePin(point.x, point.y);
    updateDeck();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 220);
    return;
  }
  if (input.dataset.effect) {
    input.closest('label').querySelector('.range-value').textContent = `${input.value}%`;
    activeScene().effect = { ...effectState(), [input.dataset.effect]: Number(input.value) / 100 };
    void paintPreview();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 220);
    return;
  }
  if (input.id === 'compare') {
    split = Number(input.value);
    input.closest('.compare').style.setProperty('--split', `${split}%`);
    input.setAttribute('aria-valuetext', `${split}% original`);
    return;
  }
  const field = input.dataset.field;
  if (!field) return;
  if (field === 'route-name') project().routes[route].name = input.value;
  else activeScene()[field] = input.value;
  const preview = screen.querySelector(`[data-preview="${field}"]`);
  if (preview) {
    preview.textContent = input.value;
    preview.hidden = !input.value;
  }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 220);
});

function dragTo(event) {
  const box = drag.board.getBoundingClientRect();
  movePin((event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height);
  capturePoint();
}

screen.addEventListener('pointerdown', event => {
  const board = event.target.closest('.artboard:has(.effect-pin)');
  if (!board || event.button !== 0 || !event.isPrimary) return;
  stopOrbit(true);
  const pin = board.querySelector('.effect-pin');
  drag = { board, id: event.pointerId };
  board.setPointerCapture(event.pointerId);
  pin.focus({ preventScroll: true });
  dragTo(event);
});
screen.addEventListener('pointermove', event => {
  if (drag?.id === event.pointerId && drag.board.isConnected) dragTo(event);
});
for (const event of ['lostpointercapture', 'pointerup', 'pointercancel']) {
  screen.addEventListener(event, pointer => {
    if (drag?.id !== pointer.pointerId) return;
    if (recording?.points.length) {
      capturePoint();
      if (recording) endRecord();
    }
    drag = null;
    save();
  });
}
screen.addEventListener('keydown', event => {
  const currentPanel = event.target.closest('[data-panel]');
  if (currentPanel && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const buttons = [...screen.querySelectorAll('[data-panel]')];
    const index = buttons.indexOf(currentPanel);
    const offset = event.key === 'ArrowLeft' ? -1 : 1;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : (index + offset + buttons.length) % buttons.length;
    buttons[next].focus();
    buttons[next].click();
    return;
  }
  if (!event.target.matches('.effect-pin')) return;
  const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  const direction = directions[event.key];
  if (!direction) return;
  event.preventDefault();
  stopOrbit(true);
  const effect = effectState();
  movePin(effect.x + direction[0] * .025, effect.y + direction[1] * .025);
  capturePoint();
  save();
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !focusedCanvas || !matchMedia('(min-width: 791px)').matches) return;
  setCanvasFocus(false);
  focusButton('focus-canvas');
});

screen.addEventListener('change', async event => {
  const input = event.target;
  if (input.id === 'grade') {
    project().grade = input.value;
    screen.querySelector('#preview-media').innerHTML = previewMedia();
    save();
    return;
  }
  if (input.id !== 'photo-upload' || !input.files.length) return;
  const scene = activeScene();
  const request = Symbol();
  uploads.set(scene, request);
  try {
    const photo = await preparePhoto(input.files[0]);
    if (uploads.get(scene) !== request) return;
    scene.photo = photo;
    if (activeScene() === scene) {
      render();
      screen.querySelector('#photo-upload').focus({ preventScroll: true });
    }
    notify('Image added.');
    save();
  } catch (error) {
    if (uploads.get(scene) === request) {
      input.value = '';
      notify(error.message);
    }
  }
});

document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
});

window.addEventListener('pagehide', save);
window.addEventListener('hashchange', () => {
  const next = pageFromHash();
  if (next === page) return;
  page = next;
  render();
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
});

render();
