import { currentUser, people, posts, stories } from './data.js';
import { escapeHtml, icon, renderFeed, renderStories, renderStoryViewer } from './ui.js';

const main = document.querySelector('#main');
const screen = document.querySelector('#screen');
const storyDialog = document.querySelector('#story-dialog');
const composerDialog = document.querySelector('#composer-dialog');
const toast = document.querySelector('#toast');
const navLinks = document.querySelectorAll('[data-nav]');
const storageKey = 'afterglow.v1';

const defaults = { posts, stories, liked: [], saved: [], seen: [], revealed: [] };
let data = loadData();
const ui = {
  page: pageFromHash(),
  postFilter: 'all',
  storyFilter: 'all',
  expanded: new Set(),
  viewer: null,
  editor: null,
};
let toastTimer;

for (const element of document.querySelectorAll('[data-icon]')) {
  element.innerHTML = icon(element.dataset.icon);
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Object.keys(defaults).every(key => Array.isArray(saved[key]))) return saved;
  } catch {
    // The demo can still be explored with its original sample content.
  }
  return structuredClone(defaults);
}

function changeData(change, requireStorage = false) {
  const next = structuredClone(data);
  change(next);
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
    data = next;
    return true;
  } catch {
    if (!requireStorage) data = next;
    return false;
  }
}

function pageFromHash() {
  return location.hash === '#stories' ? 'stories' : 'feed';
}

function getControl(key, scope = document) {
  return key ? scope.querySelector(`[data-key="${CSS.escape(key)}"]`) : null;
}

function render() {
  const oldFocus = screen.contains(document.activeElement) ? document.activeElement.dataset.key : null;
  screen.innerHTML = ui.page === 'feed' ? renderFeed(data, ui) : renderStories(data, ui);
  document.title = `${ui.page === 'feed' ? 'Feed' : 'Stories'} · Afterglow`;
  for (const link of navLinks) {
    if (link.dataset.nav === ui.page) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  getControl(oldFocus)?.focus({ preventScroll: true });
}

function setPage(page) {
  if (page === ui.page) return;
  if (ui.editor) closeComposer(false);
  if (ui.viewer) closeStory(false);
  ui.page = page;
  render();
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

function navigate(page) {
  if (location.hash !== `#${page}`) history.pushState(null, '', `#${page}`);
  setPage(page);
}

function notify(message) {
  clearTimeout(toastTimer);
  toast.innerHTML = `${icon('check')}<span>${escapeHtml(message)}</span>`;
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
    toast.textContent = '';
  }, 2800);
}

function togglePostFlag(field, id) {
  const active = data[field].includes(id);
  const stored = changeData(next => {
    next[field] = active ? next[field].filter(item => item !== id) : [...next[field], id];
  });
  render();
  if (field === 'saved') {
    notify(stored ? (active ? 'Removed from saved' : 'Post saved') : 'Updated for this visit');
    if (ui.postFilter === 'saved' && active) getControl('filter-posts-saved')?.focus();
  }
}

function showPost(id, expand = false) {
  navigate('feed');
  ui.postFilter = 'all';
  if (expand) ui.expanded.add(id);
  render();
  const post = getControl(`post-${id}`);
  post?.scrollIntoView({ block: 'start' });
  (expand ? getControl(`timeline-${id}`) : post)?.focus({ preventScroll: true });
}

function openStory(id, opener, frameId) {
  const story = data.stories.find(item => item.id === id);
  if (!story) return;
  const index = Math.max(0, story.frames.findIndex(frame => frame.id === frameId));
  startStory({ id, index, opener });
}

function startStory(viewer) {
  ui.viewer = viewer;
  const masked = paintStory();
  storyDialog.showModal();
  getControl(masked ? 'viewer-reveal' : 'viewer-close', storyDialog)?.focus();
}

function paintStory(focusKey = '') {
  const story = data.stories.find(item => item.id === ui.viewer.id);
  const frame = story.frames[ui.viewer.index];
  const masked = frame.reveal && !data.revealed.includes(frame.id);
  if (!masked && !data.seen.includes(frame.id)) changeData(next => next.seen.push(frame.id));
  storyDialog.innerHTML = renderStoryViewer(story, ui.viewer.index, masked);
  const focus = getControl(focusKey, storyDialog);
  if (focusKey) (focus && !focus.disabled ? focus : getControl('viewer-close', storyDialog))?.focus();
  return masked;
}

function moveStory(delta, buttonKey) {
  const story = data.stories.find(item => item.id === ui.viewer.id);
  const next = ui.viewer.index + delta;
  if (next < 0) return;
  if (next >= story.frames.length) {
    closeStory();
    return;
  }
  ui.viewer.index = next;
  paintStory(buttonKey);
}

function revealFrame() {
  const story = data.stories.find(item => item.id === ui.viewer.id);
  const frame = story.frames[ui.viewer.index];
  changeData(next => next.revealed.push(frame.id));
  paintStory('viewer-copy');
}

function closeStory(restore = true) {
  const { opener } = ui.viewer;
  ui.viewer = null;
  storyDialog.close();
  render();
  if (restore) (getControl(opener) ?? main).focus({ preventScroll: true });
}

const editorModes = {
  post: { label: 'New post', field: 'Title', placeholder: 'Give the moment a title', submit: 'Publish post' },
  remix: { label: 'Remix a post', field: 'Title', placeholder: 'Give it a new angle', submit: 'Publish remix' },
  update: { label: 'Add a chapter', field: 'Chapter title', placeholder: 'What happened next?', submit: 'Add chapter' },
  story: { label: 'New story', field: 'Story title', placeholder: 'Name this story', submit: 'Publish story' },
  frame: { label: 'Add your frame', submit: 'Add frame' },
};

function checkbox(name, title, description) {
  return `<label class="check-field">
    <input type="checkbox" name="${name}">
    <span><strong>${title}</strong><small>${description}</small></span>
  </label>`;
}

function composeMarkup(mode, target) {
  const settings = editorModes[mode];
  const isFrame = mode === 'story' || mode === 'frame';
  const context = target
    ? `<div class="composer-context">${icon(mode === 'remix' ? 'remix' : mode === 'frame' ? 'layers' : 'pulse')}
        <span>${mode === 'remix' ? 'Remixing' : 'Adding to'} <strong>${escapeHtml(target.title)}</strong>${mode === 'remix' ? ` by ${people[target.author].name}` : ''}</span>
      </div>`
    : '';

  return `
    <form id="editor" class="editor">
      <div class="composer-header">
        <h2 id="composer-heading">${settings.label}</h2>
        <button class="close-button" type="button" data-action="close-composer" aria-label="Close editor">${icon('close')}</button>
      </div>
      <div class="composer-body">
        ${context}
        ${settings.field ? `<label class="field">${settings.field}<input name="title" maxlength="90" placeholder="${settings.placeholder}" required></label>` : ''}
        <label class="field">
          <span>${mode === 'story' ? 'First frame caption' : mode === 'update' ? 'Chapter note' : 'Caption'}${isFrame ? '' : ' <small>optional</small>'}</span>
          <textarea name="caption" rows="3" maxlength="${isFrame ? 230 : 1000}" placeholder="${isFrame ? 'What’s your point of view?' : 'Tell us a little more…'}"></textarea>
        </label>
        ${isFrame ? '<p class="form-hint">Add a caption, a photo, or both.</p>' : ''}
        <div class="upload-field">
          <label class="upload-label">${icon('image')}<span>Add photo</span>
            <input type="file" name="photo" accept="image/jpeg,image/png,image/webp,image/avif" aria-label="Add photo">
          </label>
          <div class="upload-preview" hidden>
            <img class="preview-photo" alt="">
            <span class="preview-name"></span>
            <button class="close-button" type="button" data-action="remove-photo" aria-label="Remove photo">${icon('close')}</button>
          </div>
        </div>
        <label class="field alt-field" hidden>Image description <small>optional</small><input name="alt" maxlength="180" placeholder="Describe what’s in the photo"></label>
        ${mode === 'post' ? checkbox('living', 'Make it a living post', 'Add chapters after publishing.') : ''}
        ${mode === 'story' ? checkbox('shared', 'Open it to contributions', 'Other people can add their own frames.') : ''}
        ${isFrame ? checkbox('reveal', 'Hide behind a reveal', 'Viewers tap to see this frame.') : ''}
        <p class="form-error" role="alert" hidden></p>
      </div>
      <div class="composer-footer">
        <button class="button secondary" type="button" data-action="close-composer">Cancel</button>
        <button class="button primary" type="submit">${settings.submit}</button>
      </div>
    </form>`;
}

function openComposer(mode, id, opener) {
  const target = mode === 'frame' ? data.stories.find(item => item.id === id) : data.posts.find(item => item.id === id);
  const returnTo = mode === 'frame' ? ui.viewer : null;
  if (ui.viewer) closeStory(false);
  ui.editor = { mode, id, opener, returnTo, preview: null, submitting: false };
  composerDialog.innerHTML = composeMarkup(mode, target);
  composerDialog.showModal();
  composerDialog.querySelector('[name="title"], textarea').focus();
}

function closeComposer(restore = true) {
  const editor = ui.editor;
  ui.editor = null;
  if (editor.preview) URL.revokeObjectURL(editor.preview);
  composerDialog.close();
  if (!restore) return;
  if (editor.returnTo) startStory(editor.returnTo);
  else (getControl(editor.opener) ?? main).focus({ preventScroll: true });
}

function showError(form, message) {
  const error = form.querySelector('.form-error');
  error.textContent = message;
  error.hidden = !message;
}

const acceptedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const maxUploadSize = 12 * 1024 * 1024;

function createId() {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), number => number.toString(36)).join('-');
}

function updatePreview(form) {
  const upload = form.elements.photo;
  const file = upload.files[0];
  if (ui.editor.preview) URL.revokeObjectURL(ui.editor.preview);
  ui.editor.preview = null;
  const preview = form.querySelector('.upload-preview');
  const image = preview.querySelector('img');
  image.removeAttribute('src');
  preview.hidden = true;
  form.querySelector('.alt-field').hidden = true;
  showError(form, '');
  if (!file) return;
  if (!acceptedImages.includes(file.type) || file.size > maxUploadSize) {
    upload.value = '';
    showError(form, 'Choose a JPEG, PNG, WebP, or AVIF image under 12 MB.');
    return;
  }
  ui.editor.preview = URL.createObjectURL(file);
  image.src = ui.editor.preview;
  preview.querySelector('.preview-name').textContent = file.name;
  preview.hidden = false;
  form.querySelector('.alt-field').hidden = false;
}

async function preparePhoto(file, alt) {
  if (!file?.size) return undefined;
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 1180 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const src = canvas.toDataURL('image/webp', 0.83);
    if (src.length > 950000) throw new Error('Image is too large');
    return { src, alt: alt || 'Photo added by Sam Rivera' };
  } finally {
    bitmap.close();
  }
}

async function submitComposer(event) {
  event.preventDefault();
  const editor = ui.editor;
  if (!editor || editor.submitting) return;
  const form = event.target;
  const fields = new FormData(form);
  const title = (fields.get('title') ?? '').trim();
  const caption = fields.get('caption').trim();
  const upload = fields.get('photo');
  const { mode, id } = editor;
  if (mode !== 'frame' && !title) {
    showError(form, 'Enter a title to continue.');
    return;
  }
  if ((mode === 'frame' || mode === 'story') && !caption && !upload?.size) {
    showError(form, 'Add a caption or a photo first.');
    return;
  }

  const submit = form.querySelector('[type="submit"]');
  editor.submitting = true;
  submit.disabled = true;
  showError(form, '');

  let image;
  try {
    image = await preparePhoto(upload, fields.get('alt').trim());
  } catch {
    if (ui.editor === editor) showError(form, 'This photo couldn’t be loaded. Try a smaller image or a different format.');
    return;
  } finally {
    editor.submitting = false;
    submit.disabled = false;
  }
  if (ui.editor !== editor) return;

  const newId = createId();
  const entry = { id: newId, author: currentUser, caption, image, createdAt: Date.now() };
  const frame = { ...entry, reveal: fields.has('reveal') };
  const saved = changeData(next => {
    if (mode === 'story') {
      next.stories.unshift({
        id: newId,
        title,
        author: currentUser,
        tone: 'peach',
        shared: fields.has('shared'),
        frames: [{ ...frame, id: createId() }],
      });
    } else if (mode === 'frame') {
      next.stories.find(story => story.id === id).frames.push(frame);
    } else if (mode === 'update') {
      next.posts.find(post => post.id === id).updates.push({ ...entry, title });
    } else {
      next.posts.unshift({
        ...entry, title, likes: 0, updates: [], living: fields.has('living'),
        remixOf: mode === 'remix' ? id : undefined,
      });
    }
  }, true);

  if (!saved) {
    showError(form, 'Couldn’t save to browser storage. Free up space or try publishing without a photo.');
    return;
  }

  closeComposer(false);
  if (mode === 'frame') {
    render();
    openStory(id, editor.returnTo?.opener, newId);
  } else if (mode === 'story') {
    ui.storyFilter = 'all';
    navigate('stories');
    render();
    getControl(`story-${newId}`)?.focus();
    notify('Story published');
  } else {
    showPost(mode === 'update' ? id : newId, mode === 'update');
    notify(mode === 'update' ? 'Chapter added' : mode === 'remix' ? 'Remix published' : 'Post published');
  }
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, id, key, mode, frame } = button.dataset;

  switch (action) {
    case 'compose': openComposer(mode, id, key); break;
    case 'close-composer': closeComposer(); break;
    case 'open-story': openStory(id, key, frame); break;
    case 'close-story': closeStory(); break;
    case 'story-step': moveStory(Number(id), key); break;
    case 'reveal': revealFrame(); break;
    case 'filter-posts':
      ui.postFilter = id;
      render();
      if (!key) getControl(`filter-posts-${id}`)?.focus();
      break;
    case 'filter-stories':
      ui.storyFilter = id;
      render();
      break;
    case 'go-post': showPost(id); break;
    case 'go-timeline': showPost(id, true); break;
    case 'toggle-timeline':
      if (ui.expanded.has(id)) ui.expanded.delete(id);
      else ui.expanded.add(id);
      render();
      break;
    case 'like': togglePostFlag('liked', id); break;
    case 'save': togglePostFlag('saved', id); break;
    case 'remove-photo': {
      const form = composerDialog.querySelector('form');
      form.elements.photo.value = '';
      updatePreview(form);
      form.elements.photo.focus();
      break;
    }
  }
});

storyDialog.addEventListener('cancel', event => {
  event.preventDefault();
  closeStory();
});
storyDialog.addEventListener('click', event => {
  if (event.target === storyDialog) closeStory();
});
storyDialog.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    moveStory(event.key === 'ArrowLeft' ? -1 : 1, document.activeElement.dataset.key);
  }
});
composerDialog.addEventListener('cancel', event => {
  event.preventDefault();
  closeComposer();
});
composerDialog.addEventListener('change', event => {
  if (event.target.name === 'photo') updatePreview(event.target.form);
});
composerDialog.addEventListener('submit', submitComposer);
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
  main.scrollIntoView({ block: 'start' });
});
window.addEventListener('hashchange', () => setPage(pageFromHash()));

render();
