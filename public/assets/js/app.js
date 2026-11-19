// IT0049 Reviewer: hash router, event delegation and render loop. No build step, no dependencies.
import * as home from './views/home.js';
import * as learn from './views/learn.js';
import * as practice from './views/practice.js';
import * as cards from './views/cards.js';
import * as compare from './views/compare.js';
import * as reference from './views/reference.js';
import * as settings from './views/settings.js';
import { esc, toast, ICON } from './util.js';
import { store, dayKey } from './store.js';
import { streak } from './views/shared.js';

const ACTIONS = { ...home.actions, ...learn.actions, ...practice.actions, ...cards.actions, ...compare.actions, ...reference.actions, ...settings.actions };
const main = document.getElementById('main');
let lastPath = null;

function parse() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map((p) => { try { return decodeURIComponent(p); } catch (e) { return p; } });
  return { path, parts, query: new URLSearchParams(qs) };
}

function resolve({ parts, query }) {
  const [a, b, c] = parts;
  switch (a) {
    case undefined: return home.render();
    case 'learn': return learn.render(b, c);
    case 'practice': return practice.render();
    case 'cards': return cards.render();
    case 'compare': return compare.render(b);
    case 'reference': return reference.renderReference(b);
    case 'search': return reference.renderSearch(query.get('q'));
    case 'settings': return settings.render();
    default: return null;
  }
}

const notFound = () => ({
  title: 'Not found', nav: '',
  html: `<div class="page stack"><span class="eyebrow">404</span><h1 class="h1">That page is not in the reviewer</h1><p class="muted">The link may be old. Go back to <a href="#/">Home</a> or browse <a href="#/learn">all lessons</a>.</p></div>`
});

export function render() {
  const route = parse();
  const routeChanged = route.path !== lastPath;
  const focusKey = !routeChanged && document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.k : null;
  const scrollY = window.scrollY;
  if (routeChanged && lastPath !== null && lastPath.startsWith('practice')) practice.leave();
  let view;
  try {
    view = resolve(route) || notFound();
  } catch (err) {
    console.error(err);
    view = { title: 'Something went wrong', nav: '', html: `<div class="page stack"><h1 class="h1">Something went wrong</h1><p class="muted">This page hit an error. <a href="#/">Go home</a> and try again.</p><pre class="qcode">${esc(err && err.message)}</pre></div>` };
  }
  main.innerHTML = view.html;
  document.title = view.title ? `${view.title} · IT0049 Reviewer` : 'IT0049 Reviewer';
  for (const a of document.querySelectorAll('[data-nav]')) {
    if (a.dataset.nav === view.nav) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  const search = document.getElementById('q');
  if (route.parts[0] === 'search' && search && document.activeElement !== search) search.value = route.query.get('q') || '';
  if (routeChanged) {
    lastPath = route.path;
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  } else {
    if (Math.abs(window.scrollY - scrollY) > 2) window.scrollTo(0, scrollY);
    if (focusKey) {
      const el = main.querySelector(`[data-k="${CSS.escape(focusKey)}"]`);
      if (el && !el.disabled) el.focus({ preventScroll: true });
    }
  }
  if (route.parts[0] === 'practice') practice.after();
  // On narrow screens the request rail scrolls sideways; bring the highlighted stop into view.
  const rail = main.querySelector('.rail-stops');
  const on = rail && rail.querySelector('.stop.on, .stop[aria-pressed="true"]');
  if (routeChanged && rail && on && rail.scrollWidth > rail.clientWidth) {
    const item = on.parentElement;
    rail.scrollLeft = item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2;
  }
}

practice.bindRerender(render);

// Celebrate the daily goal once per day, whichever activity crosses it.
store.onActivity(({ before, after }) => {
  const g = Number(store.setting('goal')) || 30;
  if (before < g && after >= g && store.cheer(dayKey())) {
    setTimeout(() => toast(`<b>${ICON.spark} Daily goal reached.</b> ${after} points today · ${streak().n}-day streak.`, { kind: 'big', ms: 5600 }), 450);
  }
});

function run(name, el, ev) {
  const fn = ACTIONS[name];
  if (!fn) return;
  const result = fn(el.dataset, el, ev);
  if (result !== false) render();
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  e.preventDefault();
  run(el.dataset.act, el, e);
});
// Clicking a code line should not scroll its overflow box sideways to show the whole button.
document.addEventListener('mousedown', (e) => { if (e.target.closest('button.ln')) e.preventDefault(); });
document.addEventListener('input', (e) => {
  const el = e.target.closest('[data-input]');
  if (el && ACTIONS[el.dataset.input]) ACTIONS[el.dataset.input](el.dataset, el, e);
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (el) run(el.dataset.change, el, e);
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const el = e.target.closest('[data-enter]');
  if (!el) return;
  e.preventDefault();
  run(el.dataset.enter, el, e);
});
// Keyboard shortcuts: any visible control with data-hotkey="1 a enter" responds to those keys.
document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target;
  if (t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
  const key = e.key === ' ' ? 'space' : e.key.toLowerCase();
  // Let focused buttons and links handle Enter/Space natively, except answer options,
  // where Enter should mean "check" rather than "pick this option again".
  if ((key === 'enter' || key === 'space') && t.closest && t.closest('button, a') && !t.closest('button.opt')) return;
  const el = [...main.querySelectorAll('[data-hotkey]')].find((b) => !b.disabled && b.offsetParent !== null && b.dataset.hotkey.split(' ').includes(key));
  if (!el) return;
  e.preventDefault();
  el.click();
});
document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-submit="search"]');
  if (!form) return;
  e.preventDefault();
  const q = form.querySelector('input').value.trim();
  location.hash = q ? `#/search?q=${encodeURIComponent(q)}` : '#/search';
});
window.addEventListener('hashchange', render);

settings.applySettings();
render();
