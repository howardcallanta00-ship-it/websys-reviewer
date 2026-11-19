// Home: today's goal and streak, one clear next step, the course map with mastery, exam launcher, weak spots.
import { MODULES, LESSON_BY_KEY, ALL_LESSONS, questionsOf } from '../content/index.js';
import { esc, trackName, ICON } from '../util.js';
import { store, POINTS } from '../store.js';
import { moduleProgress, overall, weakSpots, chip, bar, badge, mastery, streak, week, goal, ring, greeting } from './shared.js';
import { startSession } from './practice.js';

const LAYERS = [['routes', 'Routes'], ['controller', 'Controller'], ['model', 'Model & data'], ['view', 'View'], ['security', 'Security & extras']];
const SCOPES = [['midterm', 'Midterm · M1–M4', ['m1', 'm2', 'm3', 'm4']], ['finals', 'Finals · M5–M8', ['m5', 'm6', 'm7', 'm8']], ['all', 'Everything', MODULES.map((m) => m.id)]];
let open = null;
let scope = 'midterm';
let length = null;

function todayPanel(nextUp, hasLast) {
  const today = store.day();
  const g = goal();
  const s = streak();
  const o = overall();
  const fresh = o.seen === 0 && o.done === 0;
  const left = Math.max(0, g - today.p);
  const headline = fresh ? 'Let’s start your review'
    : left === 0 ? 'Today’s goal is done. Nice work.'
    : today.p === 0 ? `${g} points to reach today’s goal`
    : `${left} more point${left === 1 ? '' : 's'} to today’s goal`;
  const streakText = s.n === 0 ? 'Study today to start a streak'
    : s.today ? `You studied today. Keep it going tomorrow.` : 'Study today to keep it alive';
  const mp = moduleProgress(nextUp.module);
  const days = week().map((d) => `<li class="${d.hit ? 'hit' : d.p ? 'some' : ''}${d.today ? ' today' : ''}" title="${esc(d.full)}: ${d.p} points"><span class="dot" aria-hidden="true"></span><span class="dl" aria-hidden="true">${esc(d.label)}</span><span class="sr-only">${esc(d.full)}: ${d.p} points${d.hit ? ', goal reached' : ''}</span></li>`).join('');
  return `<section class="today" aria-labelledby="today-h">
    <div class="today-main stack">
      <div class="stack-sm">
        <span class="eyebrow" style="color:var(--muted)">${greeting()}</span>
        <h1 class="h1" id="today-h">${headline}</h1>
        <p class="muted" style="font-size:.9rem">Points: ${POINTS.right} per correct answer, ${POINTS.wrong} per attempt, ${POINTS.lesson} per lesson finished, ${POINTS.card} per flashcard.</p>
      </div>
      <div class="next-card ${nextUp.module.track}">
        <span class="eyebrow">${hasLast ? 'Continue' : 'Start here'} · ${esc(nextUp.module.code)}, lesson ${nextUp.index + 1} of ${nextUp.module.lessons.length}</span>
        <h2 class="h2">${esc(nextUp.title)}</h2>
        <p class="muted" style="font-size:.92rem">${esc(trackName(nextUp.module.track))} · ${esc(nextUp.module.title)}</p>
        <div style="max-width:22rem">${bar(Math.round((mp.done / mp.total) * 100))}<span class="mono muted" style="font-size:.74rem">${mp.done}/${mp.total} lessons in ${esc(nextUp.module.code)}</span></div>
        <div class="row">
          <a class="btn primary" href="#/learn/${nextUp.module.id}/${nextUp.id}">${hasLast ? 'Resume lesson' : 'Start the first lesson'} ${ICON.arrow}</a>
          <button class="btn" data-act="home-drill" data-m="${nextUp.module.id}" data-k="drill">Quick 10-question drill</button>
        </div>
      </div>
    </div>
    <div class="today-side">
      ${ring(today.p, g, { size: 132, stroke: 12, label: String(today.p), sub: `of ${g} points` })}
      <div class="streak${s.n ? ' on' : ''}"><span class="flame">${ICON.flame}</span><span><b>${s.n ? `${s.n}-day streak` : 'No streak yet'}</b><small>${streakText}</small></span></div>
      <ol class="weekdots" aria-label="Last 7 days">${days}</ol>
    </div>
  </section>`;
}

export function render() {
  if (length === null) length = store.setting('length') || 20;
  const last = store.data.last && LESSON_BY_KEY[store.data.last];
  const nextUp = (last && store.isDone(last.key) ? ALL_LESSONS[ALL_LESSONS.indexOf(last) + 1] : last)
    || ALL_LESSONS.find((l) => !store.isDone(l.key)) || ALL_LESSONS[0];
  const o = overall();
  if (open === null) open = nextUp.module.id;
  const ready = MODULES.filter((m) => mastery(m).level === 3).length;
  const rows = MODULES.map((m, i) => {
    const p = moduleProgress(m);
    const isOpen = open === m.id;
    const divider = i === 4 ? '<div class="map-divider">Same task manager, rebuilt in Laravel</div>' : '';
    const cells = LAYERS.map(([k]) => `<span class="map-cell${m.layers[k] ? '' : ' empty-cell'}">${esc(m.layers[k] || '·')}</span>`).join('');
    let detail = '';
    if (isOpen) {
      const x = mastery(m);
      const reqs = x.level === 3 ? '<span class="muted">All three targets met. Keep it warm with a drill now and then.</span>'
        : `<ul class="reqs">${x.reqs.map((r) => `<li class="${r.ok ? 'ok' : ''}">${r.ok ? ICON.check : '<span class="todo" aria-hidden="true"></span>'}<span>${esc(r.label)} <b class="mono">${esc(r.fmt)}</b></span></li>`).join('')}</ul>`;
      detail = `<div class="map-detail ${m.track}">
        <dl class="map-layers">${LAYERS.map(([k, label]) => `<div><dt>${label}</dt><dd>${esc(m.layers[k] || '·')}</dd></div>`).join('')}</dl>
        <div class="stack-sm" style="flex:1 1 280px"><span class="label">${x.level === 3 ? 'Exam-ready' : 'To reach Exam-ready'}</span>${reqs}</div>
        <div class="row"><a class="btn small primary" href="#/learn/${m.id}">Open lessons</a><button class="btn small" data-act="home-practice" data-m="${m.id}" data-k="hp-${m.id}">Practice ${esc(m.code)}</button></div>
      </div>`;
    }
    return `${divider}<button class="map-row ${m.track}" data-act="home-open" data-m="${m.id}" data-k="row-${m.id}" aria-expanded="${isOpen}">
        <span class="map-cell map-mod"><span class="row" style="gap:8px">${chip(m)}<strong>${esc(m.title)}</strong></span>${bar(Math.round((p.done / p.total) * 100))}<span class="row" style="gap:8px;justify-content:space-between"><span class="mono muted" style="font-size:.72rem">${p.done}/${p.total} lessons</span>${badge(m)}</span></span>
        ${cells}
      </button>${detail}`;
  }).join('');

  const weak = weakSpots();
  const pill = (act, v, label, on) => `<button class="pill on-dark" data-act="${act}" data-v="${v}" data-k="${act}-${v}" aria-pressed="${on}">${label}</button>`;
  const mods = SCOPES.find((s) => s[0] === scope)[2];
  const pool = questionsOf(mods).length;
  const best = store.best(mods.map((m) => m.toUpperCase()).join(', '));

  return {
    title: 'Home', nav: 'home',
    html: `<div class="page"><div class="split">
      <div class="main-col stack" style="gap:32px">
        ${todayPanel(nextUp, !!last)}
        <section class="stack-sm" aria-labelledby="map-h">
          <div class="row" style="justify-content:space-between;align-items:baseline"><h2 class="h2" id="map-h">Course map</h2>
            <span class="muted" style="font-size:.88rem">${o.done}/${o.total} lessons · ${ready}/8 modules exam-ready</span></div>
          <p class="muted" style="font-size:.92rem">What each module adds to the task manager. Open a row to see what it takes to be exam-ready.</p>
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
          <p class="mono" style="font-size:.84rem">${Math.min(length, pool)} of ${pool} questions · ${store.setting('timed') ? 'timed' : 'untimed'}${best != null ? ` · best ${best}%` : ''}</p>
          <div class="row"><button class="btn on-dark-primary" data-act="home-start" data-k="hs">Start exam</button><a href="#/practice" class="on-dark-link">More options</a></div>
        </section>
        <section class="stack-sm" aria-labelledby="weak-h">
          <h2 class="h3" id="weak-h">Weak spots</h2>
          ${weak.length ? `<p class="muted" style="font-size:.88rem">Lessons behind the questions you miss most. A quick reread usually fixes them.</p><ol class="list-plain weak divided">${weak.map((w) => `<li><span class="count">${w.w} missed</span><span class="stack-sm" style="gap:2px"><a href="#/learn/${w.lesson.module.id}/${w.lesson.id}" style="font-weight:600">${esc(w.lesson.title)}</a><span class="muted" style="font-size:.84rem">${esc(w.lesson.module.code)} · ${esc(w.lesson.module.title)}</span></span></li>`).join('')}</ol>`
            : `<p class="empty">${o.seen ? 'No weak spots right now. Everything you missed, you have since answered correctly.' : 'Nothing here yet. Answer quick checks or take an exam, and the lessons behind the questions you miss show up here.'}</p>`}
        </section>
        <section class="stack-sm" aria-labelledby="tools-h">
          <h2 class="h3" id="tools-h">Other ways to review</h2>
          <ul class="list-plain tools">
            <li><a href="#/cards"><b>Flashcards</b><span>Commands, helpers and rules from both frameworks</span></a></li>
            <li><a href="#/compare"><b>CI ↔ Laravel translator</b><span>The same job written in each framework</span></a></li>
            <li><a href="#/reference"><b>Cheat sheets and glossary</b><span>Printable</span></a></li>
          </ul>
        </section>
      </aside>
    </div></div>`
  };
}

const goPractice = (opts) => { startSession(opts); location.hash = '#/practice'; return false; };

export const actions = {
  'home-open': (d) => { open = open === d.m ? '' : d.m; },
  'home-scope': (d) => { scope = d.v; },
  'home-len': (d) => { length = Number(d.v); store.setSetting('length', length); },
  'home-start': () => goPractice({ mods: SCOPES.find((s) => s[0] === scope)[2], length, timed: !!store.setting('timed'), feedback: store.setting('feedback') }),
  'home-practice': (d) => goPractice({ mods: [d.m], length: 'all', timed: false, feedback: store.setting('feedback') }),
  'home-drill': (d) => goPractice({ mods: [d.m], length: 10, timed: false, feedback: 'instant' })
};
