history.scrollRestoration = 'manual';
if (location.hash === '#cases') {
  history.replaceState(history.state, '', location.pathname + location.search);
}
window.scrollTo(0, 0);

const home = document.querySelector('#home');
const about = document.querySelector('#contacts');
const projectPage = document.querySelector('#project');
const track = document.querySelector('.case-track');
const status = document.querySelector('.contact-status');
const homeTitle = document.title;
const projectOrder = { sitik: 0, context: 1 };
const visibleProjects = projects.filter(project => !project.hidden)
  .sort((a, b) => (projectOrder[a.id] ?? 2) - (projectOrder[b.id] ?? 2));
const loader = document.querySelector('.site-loader');
const projectVideoObserver = new IntersectionObserver(entries => {
  for (const { target: video, isIntersecting } of entries) {
    if (!isIntersecting) {
      video.pause();
      continue;
    }
    if (!video.getAttribute('src')) {
      video.poster = 'assets/' + video.dataset.poster;
      video.src = 'assets/' + video.dataset.file;
    }
    video.play().catch(() => {});
  }
}, { rootMargin: '300px 0px' });

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content) node.textContent = content;
  return node;
}

function image(file, alt, className, loading = 'eager') {
  const node = element('img', className);
  node.loading = loading;
  node.decoding = 'async';
  node.src = 'assets/' + file;
  node.alt = alt;
  return node;
}

function caseCard(project) {
  const card = element('a', 'case-card');
  card.href = '#case/' + project.id;
  card.dataset.project = project.id;
  card.style.setProperty('--card-color', project.color);
  if (project.id === 'context') card.style.setProperty('--card-text', '#4f4f4f');

  const copy = element('div', 'case-card-copy');
  const title = element('h2', null, project.title);
  copy.append(title, element('p', null, project.description));
  const cover = image(project.cover, '');
  card.append(cover, copy);
  return card;
}

const palettes = {
  iskra: [
    ['#000000', '#fff', 'RGB 100 100 100\nCMYK 0 0 0 100\nHEF #000000'],
    ['#ffffff', '#000', 'RGB 255 255 255\nCMYK 0 0 0 0\nHEF #FFFFFF'],
  ],
  context: [
    ['#f8ff00', '#515151', 'HEF #F8FF00'],
    ['#515151', '#fff', 'HEF #515151'],
    ['#dedede', '#515151', 'HEF #DEDEDE'],
  ],
};

function artwork(art) {
  const figure = element('figure', 'art');
  if (art.file) figure.dataset.file = art.file;
  if (art.palette) {
    figure.classList.add('art-wide', 'palette', 'palette-' + art.palette);
    for (const [background, color, label] of palettes[art.palette]) {
      const swatch = element('div', null, label);
      swatch.style.backgroundColor = background;
      swatch.style.color = color;
      figure.append(swatch);
    }
    return figure;
  }
  if (art.height) {
    figure.classList.add('art-wide');
    figure.style.setProperty('--art-height', art.height);
  }
  if (art.video) {
    const video = element('video');
    video.dataset.file = art.video;
    video.dataset.poster = art.file;
    video.preload = 'none';
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('aria-label', art.alt);
    figure.append(video);
    return figure;
  }
  const graphic = image(art.file, art.alt, null, 'lazy');
  if (art.crop) {
    graphic.classList.add('art-crop');
    ['left', 'top', 'width', 'height'].forEach((property, index) => {
      graphic.style[property] = art.crop[index] + '%';
    });
  }
  figure.append(graphic);
  return figure;
}

function projectSection(section, title) {
  const block = element('section', 'project-section');
  const heading = element('h2', 'visually-hidden', title);
  heading.tabIndex = -1;
  const notes = element('div', 'project-notes');
  for (const [label, description] of section.notes) {
    const note = element('div');
    note.append(element('h3', null, label), element('p', null, description));
    notes.append(note);
  }
  const gallery = element('div', 'gallery');
  gallery.append(...section.gallery.map(artwork));
  block.append(heading, notes, gallery);
  return block;
}

function renderProject(project) {
  const title = element('h1', 'visually-hidden', project.title);
  title.tabIndex = -1;
  const back = element('a', 'project-back');
  back.href = '#cases';
  const backIcon = element('span', 'project-back-icon', '↩\uFE0E');
  backIcon.setAttribute('aria-hidden', 'true');
  back.setAttribute('aria-label', 'Назад к кейсам');
  back.append(backIcon, element('span', 'project-back-label', 'Назад'));
  const hero = image(project.hero, 'Обложка проекта «' + project.title.split(' | ')[0] + '»', 'project-hero');
  hero.fetchPriority = 'high';
  const body = element('div', 'project-content');
  const menu = element('nav', 'project-menu');
  menu.setAttribute('aria-label', 'Разделы кейса');
  const sections = element('div', 'project-sections');
  const labels = [project.id === 'drophunter' ? 'О чем' : 'Суть', 'Процесс', 'Результат'];

  project.sections.forEach((section, index) => {
    const block = projectSection(section, labels[index]);
    const button = element('button', null);
    button.type = 'button';
    block.id = 'project-section-' + (index + 1);
    button.setAttribute('aria-label', labels[index]);
    button.setAttribute('aria-controls', block.id);
    button.textContent = labels[index];
    button.addEventListener('click', () => {
      block.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      block.querySelector('h2').focus({ preventScroll: true });
    });
    menu.append(button);
    sections.append(block);
  });

  body.append(menu, sections);
  projectPage.dataset.project = project.id;
  projectPage.replaceChildren(title, back, hero, body);
  projectPage.querySelectorAll('video').forEach(video => projectVideoObserver.observe(video));
}

function updateProjectMenu() {
  if (projectPage.hidden) return;

  const sections = [...projectPage.querySelectorAll('.project-section')];
  const buttons = projectPage.querySelectorAll('.project-menu button');
  const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  const sectionOffset = parseFloat(getComputedStyle(sections[0]).scrollMarginTop) + 1;
  const passed = sections.findLastIndex(section => section.getBoundingClientRect().top <= Math.max(48, sectionOffset));
  const current = atBottom ? sections.length - 1 : Math.max(0, passed);

  buttons.forEach((button, index) => {
    const active = index === current;
    if (active === button.hasAttribute('aria-current')) return;
    if (active) button.setAttribute('aria-current', 'location');
    else button.removeAttribute('aria-current');
  });
}

window.addEventListener('scroll', updateProjectMenu, { passive: true });
window.addEventListener('resize', updateProjectMenu);

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout = matchMedia('(max-width: 1023px)');
let carouselFrame = 0;
let lastFrameTime;
let carouselPosition = 0;
let carouselDirection = 1;
let appliedPosition = 0;
let carouselPausedUntil = 0;
let carouselTouching = false;
const hoverPointer = matchMedia('(hover: hover)');
let caseMotionFrame = 0;
const caseRevealObserver = new IntersectionObserver(entries => {
  let order = 0;
  for (const { target: card, isIntersecting } of entries) {
    if (!isIntersecting) continue;
    card.style.setProperty('--card-reveal-delay', order++ * 90 + 'ms');
    card.classList.add('is-revealed');
    caseRevealObserver.unobserve(card);
  }
}, { threshold: 0.12 });

function updateCaseMotion() {
  caseMotionFrame = 0;
  if (home.hidden || reducedMotion.matches || document.hidden) return;
  const viewport = track.getBoundingClientRect();
  if (viewport.bottom <= 0 || viewport.top >= window.innerHeight || !viewport.width) return;
  const center = viewport.left + viewport.width / 2;
  // Read the geometry first, then update only the visible cards.
  const positions = Array.from(track.children, card => ({ card, bounds: card.getBoundingClientRect() }));
  for (const { card, bounds } of positions) {
    if (bounds.right < viewport.left || bounds.left > viewport.right) continue;
    const offset = Math.max(-1, Math.min(1, (bounds.left + bounds.width / 2 - center) / (viewport.width / 2 + bounds.width / 2)));
    card.style.setProperty('--card-tilt', (-offset * 12).toFixed(2) + 'deg');
    card.style.setProperty('--card-depth', (1 - Math.abs(offset) * 0.035).toFixed(4));
    card.style.setProperty('--card-light', (50 + offset * 38).toFixed(2) + '%');
  }
}

function requestCaseMotion() {
  if (caseMotionFrame || home.hidden || reducedMotion.matches || document.body.classList.contains('is-loading')) return;
  caseMotionFrame = requestAnimationFrame(updateCaseMotion);
}

function syncCaseMotion() {
  cancelAnimationFrame(caseMotionFrame);
  caseMotionFrame = 0;
  caseRevealObserver.disconnect();
  const enabled = !home.hidden && !reducedMotion.matches && !document.body.classList.contains('is-loading');
  track.classList.toggle('has-card-motion', enabled);
  if (!enabled) return;
  for (const card of track.children) {
    if (mobileLayout.matches) card.classList.add('is-revealed');
    else if (!card.classList.contains('is-revealed')) caseRevealObserver.observe(card);
  }
  requestCaseMotion();
}

track.addEventListener('scroll', requestCaseMotion, { passive: true });
track.addEventListener('pointermove', event => {
  if (!hoverPointer.matches || mobileLayout.matches || reducedMotion.matches) return;
  const card = event.target.closest('.case-card');
  if (!card) return;
  const bounds = card.getBoundingClientRect();
  card.style.setProperty('--hover-light-x', (event.clientX - bounds.left) / bounds.width * 100 + '%');
  card.style.setProperty('--hover-light-y', (event.clientY - bounds.top) / bounds.height * 100 + '%');
});
track.addEventListener('focusin', event => {
  const card = event.target.closest('.case-card');
  if (card) card.classList.add('is-revealed');
});
track.addEventListener('animationend', event => {
  if (event.animationName === 'case-light-sweep') event.target.style.setProperty('--card-reveal-delay', '0ms');
});
window.addEventListener('scroll', requestCaseMotion, { passive: true });
window.addEventListener('resize', requestCaseMotion);

function setCarouselPosition(position) {
  const end = Math.max(0, track.scrollWidth - track.clientWidth);
  carouselPosition = Math.max(0, Math.min(position, end));
  track.scrollLeft = carouselPosition;
  appliedPosition = track.scrollLeft;
}

function advanceCarousel(time) {
  const elapsed = Math.min(time - (lastFrameTime ?? time), 40);
  lastFrameTime = time;
  carouselFrame = requestAnimationFrame(advanceCarousel);

  if (track.scrollLeft !== appliedPosition) {
    carouselPosition = track.scrollLeft;
    appliedPosition = track.scrollLeft;
    carouselPausedUntil = time + 1800;
  }
  if (document.hidden || carouselTouching || time < carouselPausedUntil ||
      (hoverPointer.matches && track.matches(':hover')) ||
      track.matches(':focus-visible, :has(:focus-visible)')) return;

  const bounds = track.getBoundingClientRect();
  if (bounds.top >= window.innerHeight || bounds.bottom <= 0) return;

  const end = Math.max(0, track.scrollWidth - track.clientWidth);
  if (end === 0) return;
  if (carouselPosition >= end) carouselDirection = -1;
  else if (carouselPosition <= 0) carouselDirection = 1;

  // Retain fractional pixels between frames for a steady 28 px/s at any refresh rate.
  setCarouselPosition(carouselPosition + carouselDirection * elapsed * 0.028);
}

function syncCarousel() {
  syncCaseMotion();
  cancelAnimationFrame(carouselFrame);
  carouselFrame = 0;
  lastFrameTime = undefined;
  carouselPosition = appliedPosition = track.scrollLeft;
  if (!home.hidden && !reducedMotion.matches && !document.body.classList.contains('is-loading')) {
    carouselFrame = requestAnimationFrame(advanceCarousel);
  }
}

reducedMotion.addEventListener('change', syncCarousel);
function syncLayout() {
  syncCarousel();
  track.setAttribute('aria-label', mobileLayout.matches ? 'Кейсы. Листайте свайпом.' : 'Кейсы. Используйте стрелки для прокрутки.');
  track.tabIndex = 0;
}
mobileLayout.addEventListener('change', syncLayout);
syncLayout();

track.addEventListener('pointerdown', () => { carouselTouching = true; });
function releaseCarousel() {
  carouselTouching = false;
  carouselPausedUntil = performance.now() + 1800;
}
window.addEventListener('pointerup', releaseCarousel);
window.addEventListener('pointercancel', releaseCarousel);
track.addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  const card = track.querySelector('.case-card');
  const distance = card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
  setCarouselPosition(track.scrollLeft + (event.key === 'ArrowRight' ? distance : -distance));
  carouselPausedUntil = performance.now() + 1800;
});

function renderRoute(moveFocus = false) {
  projectVideoObserver.disconnect();
  projectPage.querySelectorAll('video').forEach(video => video.pause());
  const route = location.hash.slice(1);
  const project = visibleProjects.find(item => route === 'case/' + item.id);
  const showContacts = route === 'contacts';
  home.hidden = Boolean(project || showContacts);
  document.body.classList.toggle('is-home', !home.hidden);
  syncCarousel();
  about.hidden = !showContacts;
  projectPage.hidden = !project;

  const currentDockHash = home.hidden ? location.hash : '#cases';
  for (const link of document.querySelectorAll('.dock a[href^="#"]')) {
    if (link.hash === currentDockHash) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  status.hidden = true;

  if (project) renderProject(project);
  document.title = project ? project.title + ' — Эмилия Коростелева' : homeTitle;
  if (mobileLayout.matches && !home.hidden && route === 'cases') {
    document.querySelector('#cases').scrollIntoView();
  } else {
    window.scrollTo(0, 0);
  }
  updateProjectMenu();

  if (moveFocus) {
    if (project) projectPage.querySelector('h1').focus({ preventScroll: true });
    else if (showContacts) about.focus({ preventScroll: true });
    else if (mobileLayout.matches && route === 'cases') track.focus({ preventScroll: true });
    else home.querySelector('h1').focus({ preventScroll: true });
  }
}

async function preloadPortfolio() {
  // Wait only for the visible page's essential images; galleries load on demand.
  const images = Array.from(document.querySelectorAll('main img:not([loading="lazy"])'))
    .filter(img => !img.closest('[hidden]'));
  await Promise.allSettled([
    ...images.map(img => img.decode()),
    document.fonts.load('400 16px "Portfolio Suisse"'),
  ]);
}

function playLoader() {
  if (reducedMotion.matches) return Promise.resolve();
  const video = loader.querySelector('video');
  return new Promise(resolve => {
    const timer = setTimeout(finish, 6000);
    function finish() {
      clearTimeout(timer);
      resolve();
    }
    video.addEventListener('ended', finish, { once: true });
    video.addEventListener('error', finish, { once: true });
    video.play().then(() => video.classList.add('is-playing'), finish);
  });
}

async function openPortfolio() {
  const main = document.querySelector('main');
  const dock = document.querySelector('.dock');
  main.inert = dock.inert = true;
  const initialRoute = location.hash;
  renderRoute();
  await Promise.all([preloadPortfolio(), playLoader()]);
  document.body.classList.remove('is-loading');
  if (location.hash !== initialRoute) renderRoute();
  else syncCarousel();
  main.inert = dock.inert = false;
  if (reducedMotion.matches) loader.remove();
  else {
    loader.classList.add('is-finished');
    setTimeout(() => loader.remove(), 500);
  }
}

track.append(...visibleProjects.map(caseCard));
window.addEventListener('hashchange', () => {
  if (!document.body.classList.contains('is-loading')) renderRoute(true);
});
openPortfolio();

const avatarSlot = document.querySelector('.avatar-slot');
const avatar = avatarSlot.querySelector('.avatar');

const emailCopy = document.querySelector('.email-copy');
let emailCopyTimer;
async function copyEmail() {
  const feedback = emailCopy.querySelector('.email-copy-feedback');
  try {
    await navigator.clipboard.writeText('emi4kaitslow@icloud.com');
    feedback.textContent = 'Почта скопирована';
  } catch {
    feedback.textContent = 'emi4kaitslow@icloud.com';
  }
  emailCopy.classList.add('is-copied');
  clearTimeout(emailCopyTimer);
  emailCopyTimer = setTimeout(() => {
    emailCopy.classList.remove('is-copied');
    feedback.textContent = '';
  }, 2500);
}
emailCopy.addEventListener('click', copyEmail);
window.addEventListener('keydown', event => {
  if (event.code !== 'KeyC' || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.repeat ||
      home.hidden || document.body.classList.contains('is-loading') ||
      event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])') ||
      window.getSelection()?.toString()) return;
  event.preventDefault();
  copyEmail();
});

avatarSlot.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch' || reducedMotion.matches) return;

  const bounds = avatarSlot.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  avatar.style.setProperty('--avatar-tilt-x', (0.5 - y) * 18 + 'deg');
  avatar.style.setProperty('--avatar-tilt-y', (x - 0.5) * 18 + 'deg');
  avatar.style.setProperty('--avatar-glare-x', x * 100 + '%');
  avatar.style.setProperty('--avatar-glare-y', y * 100 + '%');
  avatar.style.setProperty('--avatar-shift-x', (x - 0.5) * 40 + 'px');
  avatar.style.setProperty('--avatar-shift-y', (y - 0.5) * 40 + 'px');
});

avatarSlot.addEventListener('pointerleave', () => {
  for (const property of ['tilt-x', 'tilt-y', 'glare-x', 'glare-y', 'shift-x', 'shift-y']) {
    avatar.style.removeProperty('--avatar-' + property);
  }
});

window.addEventListener('wheel', event => {
  if (mobileLayout.matches || home.hidden || document.body.classList.contains('is-loading') || event.ctrlKey || !event.cancelable) return;
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? track.clientWidth : 1;
  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  const distance = delta * unit;
  if (distance < 0 && track.scrollLeft <= 0) return;
  if (distance > 0 && track.scrollLeft >= track.scrollWidth - track.clientWidth - 1) return;
  event.preventDefault();
  setCarouselPosition(track.scrollLeft + distance);
  carouselPausedUntil = performance.now() + 1800;
}, { passive: false });

for (const button of document.querySelectorAll('[data-contact]')) {
  button.addEventListener('click', () => {
    status.textContent = 'Ссылка на ' + button.textContent + ' появится позже.';
    status.hidden = false;
  });
}
