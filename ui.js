import { currentUser, people } from './data.js';

const glyphs = {
  home: '<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21v-7h6v7"/>',
  stories: '<circle cx="12" cy="12" r="3.4"/><path d="M7 4.5a9 9 0 0 1 10 0m2.5 2.5a9 9 0 0 1 0 10M17 19.5a9 9 0 0 1-10 0M4.5 17a9 9 0 0 1 0-10"/>',
  add: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M4.5 12h14m-5.5-5.5 5.5 5.5-5.5 5.5"/>',
  diagonal: '<path d="M6.5 17.5 17.5 6.5M7 6.5h10.5V17"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  previous: '<path d="m15 6-6 6 6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  pulse: '<path d="M2.5 12h4.3l2.5-6.5 4 13 2.6-6.5h5.6"/>',
  remix: '<path d="M20 7h-3a5 5 0 0 0-4.2 2.25l-3.6 5.5A5 5 0 0 1 5 17H3m14-13 3 3-3 3M3 7h2a5 5 0 0 1 4.2 2.25l.2.35m4.9 4.8.2.35A5 5 0 0 0 18.7 17H20m-3-3 3 3-3 3"/>',
  bookmark: '<path d="M6 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v15l-6-4-6 4z"/>',
  heart: '<path d="M20.7 8.9c0 3.7-4.4 6.9-8.7 10.7C7.7 15.8 3.3 12.6 3.3 8.9a4.6 4.6 0 0 1 8.7-2 4.6 4.6 0 0 1 8.7 2Z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  eye: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m3 17 4-4 3 3 4.8-5 6.2 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sparkle: '<path d="M12 2.5c.9 6 3.4 8.6 9.5 9.5-6.1.9-8.6 3.5-9.5 9.5-.9-6-3.5-8.6-9.5-9.5 6-.9 8.6-3.5 9.5-9.5Z"/>',
};

export function icon(name) {
  return `<svg class="icon icon-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyphs[name]}</svg>`;
}

const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, character => entities[character]);
}

export function avatar(person, size = 38) {
  return `<img class="avatar" src="${people[person].avatar}" width="${size}" height="${size}" alt="">`;
}

function timestamp(item) {
  if (item.age) return item.age;
  const minutes = Math.max(0, Math.floor((Date.now() - item.createdAt) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

function plural(count, unit) {
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

function photo(image, className, priority = false) {
  return `<img class="${className}" src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt)}" ${priority ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

function screenHeader(title, description, buttonName, mode) {
  return `
    <div class="page-header">
      <div>
        <h1>${title}<span class="period" aria-hidden="true">.</span></h1>
        <p>${description}</p>
      </div>
      <button class="button primary" type="button" data-action="compose" data-mode="${mode}" data-key="create">${icon('add')}${buttonName}</button>
    </div>`;
}

function storyCard(story, data) {
  const first = story.frames[0];
  const isHidden = first.reveal && !data.revealed.includes(first.id);
  const hasReveal = story.frames.some(frame => frame.reveal);
  const seen = story.frames.every(frame => data.seen.includes(frame.id));
  const title = escapeHtml(story.title);
  const frameCount = plural(story.frames.length, 'frame');
  const format = story.shared ? 'Shared' : hasReveal ? 'Reveal' : '';

  return `
    <button class="story-card tone-${story.tone}${seen ? ' is-seen' : ''}" type="button" data-action="open-story" data-id="${story.id}" data-key="story-${story.id}" aria-label="${title}, ${frameCount}${story.shared ? ', shared story' : ''}${seen ? ', viewed' : ''}">
      ${first.image && !isHidden ? photo({ ...first.image, alt: '' }, 'story-cover') : ''}
      <span class="story-shade"></span>
      <span class="story-top">
        ${avatar(story.author, 30)}
        ${format ? `<span class="story-kind">${icon(story.shared ? 'layers' : 'lock')}<span>${format}</span></span>` : ''}
      </span>
      <span class="story-info">
        <strong>${title}</strong>
        <span><span class="story-person">${people[story.author].name}</span><span class="middot">·</span>${frameCount}</span>
      </span>
    </button>`;
}

function storyStrip(data) {
  const cards = data.stories.slice(0, 3).map(story => storyCard(story, data)).join('');
  return `
    <section class="story-strip" aria-labelledby="story-strip-heading">
      <div class="section-heading">
        <h2 id="story-strip-heading">Stories</h2>
        <a class="section-link" href="#stories">View all${icon('arrow')}</a>
      </div>
      <div class="story-strip-grid">
        <button class="story-add" type="button" data-action="compose" data-mode="story" data-key="add-story">
          <span class="story-add-icon">${icon('add')}</span>
          <span><strong>Add story</strong><small>Start with a frame</small></span>
        </button>
        ${cards}
      </div>
    </section>`;
}

function filterGroup(label, options, choice, action) {
  return `<div class="segmented" role="group" aria-label="${label}">
    ${options.map(([id, text]) => `<button type="button" data-action="${action}" data-id="${id}" data-key="${action}-${id}" aria-pressed="${id === choice}">${text}</button>`).join('')}
  </div>`;
}

function postTimeline(post, expanded) {
  const count = post.updates.length;
  const updates = post.updates.map(update => `
    <li>
      <div class="chapter-heading"><h4>${escapeHtml(update.title)}</h4><span>${timestamp(update)}</span></div>
      ${update.caption ? `<p>${escapeHtml(update.caption)}</p>` : ''}
      ${update.image ? photo(update.image, 'chapter-image') : ''}
    </li>`).join('');

  return `
    <div class="post-timeline">
      <button class="timeline-trigger" type="button" data-action="toggle-timeline" data-id="${post.id}" data-key="timeline-${post.id}" aria-expanded="${expanded}" aria-controls="updates-${post.id}">
        <span class="timeline-icon">${icon('pulse')}</span>
        <strong>Post timeline</strong>
        <span class="timeline-count">${plural(count, 'update')}</span>
        ${icon('down')}
      </button>
      <div class="timeline-body" id="updates-${post.id}" ${expanded ? '' : 'hidden'}>
        ${count ? `<ol class="chapter-list">${updates}</ol>` : '<p class="quiet">New chapters will appear here.</p>'}
        ${post.author === currentUser ? `<button class="button secondary small" type="button" data-action="compose" data-mode="update" data-id="${post.id}" data-key="update-${post.id}">${icon('add')}Add a chapter</button>` : ''}
      </div>
    </div>`;
}

function postCard(post, data, expanded) {
  const person = people[post.author];
  const liked = data.liked.includes(post.id);
  const saved = data.saved.includes(post.id);
  const original = post.remixOf ? data.posts.find(item => item.id === post.remixOf) : undefined;
  const tag = post.living ? ['pulse', 'Living post', 'living'] : original ? ['remix', 'Remix', 'remixed'] : null;

  return `
    <article class="post" id="post-${post.id}" aria-labelledby="title-${post.id}" tabindex="-1" data-key="post-${post.id}">
      <header class="post-author">
        ${avatar(post.author, 40)}
        <div class="author-text">
          <strong>${person.name}</strong>
          <span>@${person.handle}<span class="middot">·</span>${timestamp(post)}</span>
        </div>
        ${tag ? `<span class="post-tag ${tag[2]}">${icon(tag[0])}${tag[1]}</span>` : ''}
      </header>
      <div class="post-copy">
        <h3 id="title-${post.id}">${escapeHtml(post.title)}</h3>
        ${post.caption ? `<p>${escapeHtml(post.caption)}</p>` : ''}
      </div>
      ${original ? `<button class="remix-source" type="button" data-action="go-post" data-id="${original.id}" data-key="source-${post.id}">
        ${icon('remix')}<span>Remixed from <strong>${escapeHtml(original.title)}</strong> by ${people[original.author].name}</span>${icon('diagonal')}
      </button>` : ''}
      ${post.image ? photo(post.image, 'post-image', post.id === 'blue-hour') : ''}
      ${post.living ? postTimeline(post, expanded) : ''}
      <footer class="post-actions">
        <button class="post-action reaction" type="button" data-action="like" data-id="${post.id}" data-key="like-${post.id}" aria-pressed="${liked}" aria-label="Like post (${post.likes + Number(liked)} likes)">
          ${icon('heart')}<span>${post.likes + Number(liked)}</span>
        </button>
        <button class="post-action" type="button" data-action="compose" data-mode="remix" data-id="${post.id}" data-key="remix-${post.id}">${icon('remix')}<span>Remix</span></button>
        <button class="post-action save" type="button" data-action="save" data-id="${post.id}" data-key="save-${post.id}" aria-label="Save post" aria-pressed="${saved}" title="${saved ? 'Remove from saved' : 'Save post'}">${icon('bookmark')}</button>
      </footer>
    </article>`;
}

function labLink(action, id, glyph, title, description, color, extra = '') {
  return `<button class="lab-link" type="button" data-action="${action}" data-id="${id}" data-key="lab-${id}${extra ? '-example' : ''}" ${extra}>
    <span class="lab-icon ${color}">${icon(glyph)}</span>
    <span class="lab-link-copy"><strong>${title}</strong><small>${description}</small></span>
    ${icon('chevron')}
  </button>`;
}

function lab(theme) {
  const feed = theme === 'feed';
  return `
    <aside class="lab" aria-labelledby="lab-heading">
      <div class="section-heading lab-heading"><h2 id="lab-heading">The lab</h2>${icon('sparkle')}</div>
      <div class="lab-card ${feed ? '' : 'lab-card-mint'}">
        <div class="lab-orbit" aria-hidden="true"><i></i><i></i><i></i><b></b></div>
        <span class="lab-category">${icon(feed ? 'pulse' : 'layers')}${feed ? 'Living posts' : 'Shared stories'}</span>
        <h3>${feed ? 'A post that keeps going.' : 'One story. Many angles.'}</h3>
        <p>${feed ? 'Add chapters to the same post as the moment unfolds.' : 'Each contributor brings a frame to the same sequence.'}</p>
        <button class="lab-cta" type="button" data-action="${feed ? 'go-timeline' : 'open-story'}" data-id="${feed ? 'blue-hour' : 'poolside'}" data-key="lab-main">Try an example${icon('diagonal')}</button>
      </div>
      <div class="lab-links">
        ${feed ? labLink('open-story', 'poolside', 'layers', 'Shared stories', 'Build a story together.', 'mint') : ''}
        ${labLink('open-story', 'night-shift', 'lock', 'Reveal frames', 'Hide a frame until it’s tapped.', 'sand', 'data-frame="night-2"')}
        ${feed ? labLink('compose', 'blue-hour', 'remix', 'Remix', 'Give a post a new perspective.', 'peach', 'data-mode="remix"') : ''}
      </div>
    </aside>`;
}

export function renderFeed(data, ui) {
  const visiblePosts = ui.postFilter === 'saved' ? data.posts.filter(post => data.saved.includes(post.id)) : data.posts;
  return `
    ${screenHeader('The feed', 'Follow a moment as it unfolds.', 'New post', 'post')}
    <div class="dashboard">
      <div class="primary-column">
        ${storyStrip(data)}
        <section aria-labelledby="posts-heading">
          <div class="section-heading posts-heading">
            <h2 id="posts-heading">Posts</h2>
            ${filterGroup('Filter posts', [['all', 'All posts'], ['saved', 'Saved']], ui.postFilter, 'filter-posts')}
          </div>
          <div class="posts">
            ${visiblePosts.map(post => postCard(post, data, ui.expanded.has(post.id))).join('') || `
              <div class="empty-state">${icon('bookmark')}<h3>No saved posts yet</h3><p>Save a post and it’ll be waiting here.</p><button class="button secondary" type="button" data-action="filter-posts" data-id="all">Browse posts</button></div>`}
          </div>
        </section>
      </div>
      ${lab('feed')}
    </div>`;
}

export function renderStories(data, ui) {
  const visibleStories = ui.storyFilter === 'shared' ? data.stories.filter(story => story.shared) : data.stories;
  return `
    ${screenHeader('Stories', 'Follow a sequence, or add your point of view.', 'New story', 'story')}
    <div class="dashboard stories-dashboard">
      <section class="primary-column" aria-labelledby="stories-heading">
        <div class="section-heading posts-heading">
          <h2 id="stories-heading">Story collection</h2>
          ${filterGroup('Filter stories', [['all', 'All stories'], ['shared', 'Shared']], ui.storyFilter, 'filter-stories')}
        </div>
        <div class="stories-grid">${visibleStories.map(story => storyCard(story, data)).join('')}</div>
      </section>
      ${lab('stories')}
    </div>`;
}

export function renderStoryViewer(story, index, isHidden) {
  const frame = story.frames[index];
  const last = index === story.frames.length - 1;
  const canContribute = story.shared || story.author === currentUser;
  const author = people[frame.author];
  const progress = story.frames.map((_, position) => `<span class="${position < index ? 'done' : position === index ? 'current' : ''}"></span>`).join('');

  return `
    <div class="story-stage tone-${story.tone}${isHidden ? ' is-masked' : ''}${frame.image && !isHidden ? ' has-photo' : ''}">
      ${frame.image && !isHidden ? photo(frame.image, 'viewer-photo', true) : ''}
      <div class="viewer-shade"></div>
      <div class="viewer-top">
        <div class="viewer-progress" aria-hidden="true">${progress}</div>
        <div class="viewer-header">
          ${avatar(frame.author, 34)}
          <div><strong>${escapeHtml(story.title)}</strong><span>${author.name}<span class="middot">·</span>${index + 1} / ${story.frames.length}</span></div>
          <button class="viewer-icon" type="button" data-action="close-story" data-key="viewer-close" aria-label="Close story">${icon('close')}</button>
        </div>
      </div>
      <div class="viewer-body">
        ${isHidden ? `<button class="reveal-button" type="button" data-action="reveal" data-key="viewer-reveal">${icon('lock')}Tap to reveal</button>` : ''}
        <button class="viewer-icon viewer-previous" type="button" data-action="story-step" data-id="-1" data-key="viewer-previous" aria-label="Previous frame" ${index === 0 ? 'disabled' : ''}>${icon('previous')}</button>
        <button class="viewer-icon viewer-next" type="button" data-action="story-step" data-id="1" data-key="viewer-next" aria-label="${last ? 'Finish story' : 'Next frame'}">${icon(last ? 'check' : 'chevron')}</button>
      </div>
      <div class="viewer-bottom">
        <div class="viewer-copy" data-key="viewer-copy" tabindex="-1" aria-live="polite">
          <span class="sr-only">Frame ${index + 1} of ${story.frames.length}. </span>
          ${isHidden ? '<p>Reveal to see this frame.</p>' : frame.caption ? `<p>${escapeHtml(frame.caption)}</p>` : ''}
        </div>
        ${canContribute ? `<button class="viewer-contribute" type="button" data-action="compose" data-mode="frame" data-id="${story.id}" data-key="viewer-add">${icon('add')}Add your frame</button>` : ''}
      </div>
    </div>`;
}
