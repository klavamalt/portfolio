const home = document.querySelector('#home');
const about = document.querySelector('#contacts');
const projectPage = document.querySelector('#project');
const track = document.querySelector('.case-track');
const status = document.querySelector('.contact-status');
const homeTitle = document.title;
const visibleProjects = projects.filter(project => !project.hidden);
const loader = document.querySelector('.site-loader');
const preloadedVideos = new Map();

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content) node.textContent = content;
  return node;
}

function image(file, alt, className) {
  const node = element('img', className);
  node.src = 'assets/' + file;
  node.alt = alt;
  return node;
}

function caseCard(project, index) {
  const card = element('a', 'case-card');
  card.href = '#case/' + project.id;
  card.dataset.project = project.id;
  card.style.setProperty('--card-color', project.color);
  if (project.id === 'context') card.style.setProperty('--card-text', '#4f4f4f');

  const copy = element('div', 'case-card-copy');
  const title = element('h2');
  const icon = element('span', null, project.icon);
  icon.setAttribute('aria-hidden', 'true');
  title.append(icon, document.createTextNode(project.title));
  copy.append(title, element('p', null, project.description));
  const cover = image(project.cover, '');
  cover.decoding = 'async';
  if (index > 1) cover.loading = 'lazy';
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
    video.src = preloadedVideos.get(art.video) || 'assets/' + art.video;
    video.poster = 'assets/' + art.file;
    video.muted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('aria-label', art.alt);
    figure.append(video);
    return figure;
  }
  const graphic = image(art.file, art.alt);
  graphic.loading = 'lazy';
  graphic.decoding = 'async';
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
  const backIcon = element('span', 'project-back-icon', '↩');
  backIcon.setAttribute('aria-hidden', 'true');
  back.append(backIcon, 'Назад');
  const hero = image(project.hero, 'Обложка проекта «' + project.title.split(' | ')[0] + '»', 'project-hero');
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
}

function updateProjectMenu() {
  if (projectPage.hidden) return;

  const sections = [...projectPage.querySelectorAll('.project-section')];
  const buttons = projectPage.querySelectorAll('.project-menu button');
  const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  const passed = sections.findLastIndex(section => section.getBoundingClientRect().top <= 48);
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
let carouselFrame = 0;
let lastFrameTime;
let travel = 0;
let direction = 1;

function advanceCarousel(time) {
  const elapsed = Math.min(time - (lastFrameTime ?? time), 40);
  lastFrameTime = time;
  carouselFrame = requestAnimationFrame(advanceCarousel);

  if (track.matches(':hover, :focus-visible, :has(:focus-visible)')) return;
  const end = track.scrollWidth - track.clientWidth;
  if (end <= 0) return;
  if (track.scrollLeft <= 0) direction = 1;
  else if (track.scrollLeft >= end - 1) direction = -1;

  travel += elapsed * 0.04;
  const step = Math.floor(travel);
  if (step) {
    track.scrollLeft += direction * step;
    travel -= step;
  }
}

function syncCarousel() {
  cancelAnimationFrame(carouselFrame);
  lastFrameTime = undefined;
  travel = 0;
  if (!home.hidden && !reducedMotion.matches && !document.body.classList.contains('is-loading')) {
    carouselFrame = requestAnimationFrame(advanceCarousel);
  }
}

reducedMotion.addEventListener('change', syncCarousel);

function renderRoute(moveFocus = false) {
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
  window.scrollTo(0, 0);
  updateProjectMenu();

  if (moveFocus) {
    if (project) projectPage.querySelector('h1').focus({ preventScroll: true });
    else if (showContacts) about.focus({ preventScroll: true });
    else home.querySelector('h1').focus({ preventScroll: true });
  }
}

async function preloadPortfolio() {
  const artwork = visibleProjects.flatMap(project => project.sections.flatMap(section => section.gallery));
  const imageSources = new Set([
    ...Array.from(document.querySelectorAll('main img'), img => img.src),
    ...visibleProjects.flatMap(project => [project.cover, project.hero]).map(file => 'assets/' + file),
    ...artwork.filter(art => art.file).map(art => 'assets/' + art.file),
  ].map(src => new URL(src, document.baseURI).href));
  const videos = new Set(artwork.filter(art => art.video).map(art => art.video));

  await Promise.allSettled([
    ...Array.from(imageSources, async src => {
      const img = new Image();
      img.src = src;
      await img.decode();
    }),
    ...Array.from(videos, async file => {
      const response = await fetch('assets/' + file);
      if (!response.ok) throw new Error('Could not load ' + file);
      preloadedVideos.set(file, URL.createObjectURL(await response.blob()));
    }),
    document.fonts.load('400 16px "Portfolio Inter"'),
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
  await Promise.all([preloadPortfolio(), playLoader()]);
  document.body.classList.remove('is-loading');
  renderRoute();
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

avatarSlot.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch' || reducedMotion.matches) return;

  const bounds = avatarSlot.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  avatar.style.setProperty('--avatar-tilt-x', (0.5 - y) * 18 + 'deg');
  avatar.style.setProperty('--avatar-tilt-y', (x - 0.5) * 18 + 'deg');
  avatar.style.setProperty('--avatar-glare-x', x * 100 + '%');
  avatar.style.setProperty('--avatar-glare-y', y * 100 + '%');
});

window.addEventListener('wheel', event => {
  if (home.hidden || document.body.classList.contains('is-loading') || event.ctrlKey || !event.cancelable) return;
  const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? track.clientWidth : 1;
  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  const distance = delta * unit;
  if (distance < 0 && track.scrollLeft <= 0) return;
  if (distance > 0 && track.scrollLeft >= track.scrollWidth - track.clientWidth - 1) return;
  event.preventDefault();
  track.scrollLeft += distance;
}, { passive: false });

for (const button of document.querySelectorAll('[data-contact]')) {
  button.addEventListener('click', () => {
    status.textContent = 'Ссылка на ' + button.textContent + ' появится позже.';
    status.hidden = false;
  });
}
