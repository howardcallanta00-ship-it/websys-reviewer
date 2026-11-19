// Home: continue where you left off, the course map, an exam launcher and weak spots.
import { MODULES, LESSON_BY_KEY, ALL_LESSONS, questionsOf } from '../content/index.js';
import { esc, trackName } from '../util.js';
import { store } from '../store.js';
import { moduleProgress, overall, weakSpots, chip, bar } from './shared.js';
import { startSession } from './practice.js';

const LAYERS = [['routes', 'Routes'], ['controller', 'Controller'], ['model', 'Model & data'], ['view', 'View'], ['security', 'Security & extras']];
const SCOPES = [['midterm', 'Midterm · M1–M4', ['m1', 'm2', 'm3', 'm4']], ['finals', 'Finals · M5–M8', ['m5', 'm6', 'm7', 'm8']], ['all', 'Everything', MODULES.map((m) => m.id)]];
let open = null;
let scope = 'midterm';
let length = null;

export function render() {
  if (length === null) length = store.setting('length') || 20;
  const last = store.data.last && LESSON_BY_KEY[store.data.last];
  const nextUp = last || ALL_LESSONS.find((l) => !store.isDone(l.key)) || ALL_LESSONS[0];
  const o = overall();
  if (open === null) open = nextUp.module.id;
  const rows = MODULES.map((m, i) => {
    const p = moduleProgress(m);
    const isOpen = open === m.id;
    const divider = i === 4 ? '<div class="map-divider">Same task manager, rebuilt in Laravel</div>' : '';
    const cells = LAYERS.map(([k]) => `<span class="map-cell${m.layers[k] ? '' : ' empty-cell'}">${esc(m.layers[k] || '·')}</span>`).join('');
    const detail = isOpen ? `<div class="map-detail ${m.track}">
        <dl class="map-layers">${LAYERS.map(([k, label]) => `<div><dt>${label}</dt><dd>${esc(m.layers[k] || '·')}</dd></div>`).join('')}</dl>
        <span>${p.total} lessons · ${questionsOf([m.id]).length} questions${p.acc != null ? ` · ${p.acc}% correct` : ''}</span>
        <a href="#/learn/${m.id}" style="font-weight:600">Open lessons</a>
        <button class="btn small" data-act="home-practice" data-m="${m.id}" data-k="hp-${m.id}">Practice ${esc(m.code)}</button>
      </div>` : '';
    return `${divider}<button class="map-row ${m.track}" data-act="home-open" data-m="${m.id}" data-k="row-${m.id}" aria-expanded="${isOpen}">
        <span class="map-cell map-mod"><span class="row" style="gap:8px">${chip(m)}<strong>${esc(m.title)}</strong></span>${bar(Math.round((p.done / p.total) * 100))}<span class="mono muted" style="font-size:.72rem">${p.done}/${p.total} lessons</span></span>
        ${cells}
      </button>${detail}`;
  }).join('');

  const weak = weakSpots();
  const pill = (act, v, label, on) => `<button class="pill" data-act="${act}" data-v="${v}" data-k="${act}-${v}" aria-pressed="${on}" style="background:${on ? 'var(--inv-ink)' : 'transparent'};color:${on ? 'var(--inv)' : 'var(--inv-ink)'};border-color:${on ? 'var(--inv-ink)' : 'color-mix(in srgb, var(--inv-ink) 35%, transparent)'}">${label}</button>`;
  const mods = SCOPES.find((s) => s[0] === scope)[2];
  const pool = questionsOf(mods).length;

  return {
    title: 'Home', nav: 'home',
    html: `<div class="page"><div class="split">
      <div class="main-col stack" style="gap:32px">
        <section class="hero ${nextUp.module.track}">
          <div class="stack-sm" style="max-width:44rem">
            <span class="eyebrow">${last ? 'Continue' : 'Start here'} · ${esc(nextUp.module.code)}, lesson ${nextUp.index + 1}</span>
            <h1 class="h1">${esc(nextUp.title)}</h1>
            <p class="muted">${esc(trackName(nextUp.module.track))} · ${esc(nextUp.module.title)}</p>
          </div>
          <a class="btn primary" href="#/learn/${nextUp.module.id}/${nextUp.id}">${last ? 'Resume lesson' : 'Start the first lesson'}</a>
        </section>
        <p class="stats"><span><b>${o.done}</b>/${o.total} lessons done</span><span><b>${o.r + o.w}</b> answers</span><span><b>${o.acc == null ? '—' : `${o.acc}%`}</b> correct</span></p>
        <section class="stack-sm" aria-labelledby="map-h">
          <div class="row" style="justify-content:space-between"><h2 class="h2" id="map-h">Course map: what each module adds to the task manager</h2></div>
          <div class="map">
            <div class="map-head" aria-hidden="true"><span>Module</span>${LAYERS.map(([, l]) => `<span>${l}</span>`).join('')}</div>
            ${rows}
          </div>
        </section>
      </div>
      <aside class="side-col stack" style="gap:24px">
        <section class="panel dark stack" aria-labelledby="exam-h">
          <h2 class="h3" id="exam-h">Take a practice exam</h2>
          <div class="stack-sm"><span class="label">Scope</span><div class="row" style="gap:6px">${SCOPES.map(([v, l]) => pill('home-scope', v, l, scope === v)).join('')}</div></div>
          <div class="stack-sm"><span class="label">Length</span><div class="row" style="gap:6px">${[10, 20, 40].map((n) => pill('home-len', n, `${n} questions`, length === n)).join('')}</div></div>
          <p class="mono" style="font-size:.84rem">${Math.min(length, pool)} of ${pool} questions · ${store.setting('timed') ? 'timed' : 'untimed'} · feedback ${store.setting('feedback') === 'end' ? 'at the end' : 'after each'}</p>
          <div class="row"><button class="btn" data-act="home-start" data-k="hs" style="background:var(--inv-ink);color:var(--inv);border-color:var(--inv-ink);font-weight:700">Start exam</button><a href="#/practice" style="color:var(--inv-ink);font-size:.88rem">More options</a></div>
        </section>
        <section class="stack-sm" aria-labelledby="weak-h">
          <h2 class="h3" id="weak-h">Weak spots</h2>
          ${weak.length ? `<ol class="list-plain weak divided">${weak.map((w) => `<li><span class="count">${w.w} missed</span><span class="stack-sm" style="gap:2px"><a href="#/learn/${w.lesson.module.id}/${w.lesson.id}" style="font-weight:600">${esc(w.lesson.title)}</a><span class="muted" style="font-size:.84rem">${esc(w.lesson.module.code)} · ${esc(w.lesson.module.title)}</span></span></li>`).join('')}</ol>`
            : '<p class="empty">No weak spots yet. Answer quick checks or take a practice exam, and the lessons behind the questions you miss show up here.</p>'}
        </section>
        <section class="stack-sm" aria-labelledby="tools-h">
          <h2 class="h3" id="tools-h">Other ways to review</h2>
          <ul class="list-plain divided">
            <li style="padding:10px 0"><a href="#/cards" style="font-weight:600">Flashcards</a><br><span class="muted" style="font-size:.88rem">Commands, helpers and rules from both frameworks</span></li>
            <li style="padding:10px 0"><a href="#/compare" style="font-weight:600">CI ↔ Laravel translator</a><br><span class="muted" style="font-size:.88rem">The same job written in each framework</span></li>
            <li style="padding:10px 0"><a href="#/reference" style="font-weight:600">Cheat sheets and glossary</a><br><span class="muted" style="font-size:.88rem">Printable</span></li>
          </ul>
        </section>
      </aside>
    </div></div>`
  };
}

export const actions = {
  'home-open': (d) => { open = open === d.m ? '' : d.m; },
  'home-scope': (d) => { scope = d.v; },
  'home-len': (d) => { length = Number(d.v); store.setSetting('length', length); },
  'home-start': () => {
    const mods = SCOPES.find((s) => s[0] === scope)[2];
    startSession({ mods, length, timed: !!store.setting('timed'), feedback: store.setting('feedback') });
    location.hash = '#/practice';
    return false;
  },
  'home-practice': (d) => {
    startSession({ mods: [d.m], length: 'all', timed: false, feedback: store.setting('feedback') });
    location.hash = '#/practice';
    return false;
  }
};
