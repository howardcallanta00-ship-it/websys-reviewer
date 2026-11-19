// Practice exams: setup, one question at a time, results with retry.
import { MODULES, MODULE_BY_ID, QUESTION_BY_ID, questionsOf } from '../content/index.js';
import { esc, fmt, shuffle, ICON, pct } from '../util.js';
import { store } from '../store.js';
import { isRight, KIND, optionButtons, feedbackBox, answerText, correctText, missedIds, chip, overall, moduleProgress, bar, ring } from './shared.js';

const SECONDS_PER_Q = 75;
const PRESETS = { midterm: ['m1', 'm2', 'm3', 'm4'], finals: ['m5', 'm6', 'm7', 'm8'], all: MODULES.map((m) => m.id) };
let session = null;
let setup = null;
let timer = null;
let rerender = () => {};
export const bindRerender = (fn) => { rerender = fn; };

const parseV = (v) => (v === 'true' ? true : v === 'false' ? false : Number(v));

function initSetup() {
  if (setup) return;
  setup = { mods: new Set(PRESETS.midterm), length: store.setting('length') || 20, timed: !!store.setting('timed'), feedback: store.setting('feedback') || 'instant' };
}

export function startSession({ mods, ids, length = 20, timed = false, feedback = 'instant' }) {
  const pool = ids ? ids.map((id) => QUESTION_BY_ID[id]).filter(Boolean) : questionsOf(mods);
  const picked = shuffle(pool).slice(0, length === 'all' ? pool.length : Number(length));
  const st = {};
  for (const q of picked) {
    const s = { ans: null, text: '', checked: false, recorded: false };
    if (q.t === 'mcq') s.perm = shuffle(q.o.map((_, i) => i));
    if (q.t === 'order') {
      let o = shuffle(q.o.map((_, i) => i));
      if (o.every((v, i) => v === i)) o = o.reverse();
      s.order = o;
    }
    st[q.id] = s;
  }
  session = {
    ids: picked.map((q) => q.id), idx: 0, st, mode: feedback, timed,
    endsAt: timed ? Date.now() + picked.length * SECONDS_PER_Q * 1000 : null,
    finished: false, combo: 0, bestCombo: 0, outcome: null,
    label: ids ? 'Retry' : (mods.length === 1 ? MODULE_BY_ID[mods[0]].code : mods.map((m) => MODULE_BY_ID[m].code).join(', '))
  };
}

function bumpCombo(ok) {
  session.combo = ok ? session.combo + 1 : 0;
  session.bestCombo = Math.max(session.bestCombo, session.combo);
}

function record(id) {
  const s = session.st[id];
  if (s.recorded) return;
  s.recorded = true;
  store.recordAnswer(id, isRight(QUESTION_BY_ID[id], s));
}

function finish() {
  for (const id of session.ids) { session.st[id].checked = true; record(id); }
  session.finished = true;
  stopTimer();
  const score = session.ids.filter((id) => isRight(QUESTION_BY_ID[id], session.st[id])).length;
  const p = pct(score, session.ids.length);
  // Personal bests only count for full exams of 10+ questions, not retries.
  session.outcome = session.label !== 'Retry' && session.ids.length >= 10 ? { prev: store.best(session.label), change: store.setBest(session.label, p) } : null;
}

function band(p) {
  if (p >= 90) return ['Exam-ready on this set.', 'Keep it warm with a short drill every day or two.'];
  if (p >= 75) return ['Strong result.', 'Review the few you missed and you are close to exam-ready.'];
  if (p >= 50) return ['Getting there.', 'Each miss below links to its lesson. Reread those, then retry just the misses.'];
  return ['A useful starting point.', 'Now you know exactly what to study. Open the lessons linked below, then retry the misses.'];
}

function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
const clock = () => {
  const left = Math.max(0, Math.round((session.endsAt - Date.now()) / 1000));
  return { left, text: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` };
};

export function after() {
  stopTimer();
  if (!session || session.finished || !session.timed) return;
  timer = setInterval(() => {
    if (!session || session.finished) { stopTimer(); return; }
    const c = clock();
    const el = document.getElementById('timer');
    if (el) {
      el.textContent = `${c.text} left`;
      el.classList.toggle('low', c.left <= 60);
    }
    if (c.left <= 0) { finish(); rerender(); }
  }, 1000);
}
export const leave = stopTimer;

export function render() {
  initSetup();
  if (!session) return setupView();
  if (session.finished) return resultsView();
  return questionView();
}

/* ---------- Setup ---------- */
function setupView() {
  const chosen = [...setup.mods];
  const pool = questionsOf(chosen).length;
  const n = setup.length === 'all' ? pool : Math.min(Number(setup.length), pool);
  const missed = missedIds();
  const o = overall();
  const presetOn = (k) => PRESETS[k].length === chosen.length && PRESETS[k].every((m) => setup.mods.has(m));
  const pill = (act, v, label, on) => `<button class="pill" data-act="${act}" data-v="${v}" data-k="${act}-${v}" aria-pressed="${on}">${label}</button>`;
  const modRows = MODULES.map((m) => `<label class="${m.track}"><input type="checkbox" data-change="pr-mod" data-m="${m.id}" data-k="chk-${m.id}"${setup.mods.has(m.id) ? ' checked' : ''}> ${chip(m)} <span>${esc(m.title)} <span class="muted">(${questionsOf([m.id]).length})</span></span></label>`).join('');
  return {
    title: 'Practice', nav: 'practice',
    html: `<div class="page"><div class="split">
      <div class="main-col stack" style="gap:24px">
        <div class="stack-sm"><span class="eyebrow">Practice</span><h1 class="h1">Practice exam</h1>
        <p class="lead">Questions come from every lesson’s quick check and each module’s question bank. Every answer explains why and links back to its lesson.</p></div>
        <section class="stack-sm" aria-labelledby="scope-h"><h2 class="label" id="scope-h">Scope</h2>
          <div class="row">${pill('pr-preset', 'midterm', 'Midterm · M1–M4', presetOn('midterm'))}${pill('pr-preset', 'finals', 'Finals · M5–M8', presetOn('finals'))}${pill('pr-preset', 'all', 'Everything', presetOn('all'))}</div>
          <div class="checkgrid">${modRows}</div>
        </section>
        <section class="stack-sm" aria-labelledby="len-h"><h2 class="label" id="len-h">Length</h2>
          <div class="row">${[10, 20, 40].map((k) => pill('pr-len', k, `${k} questions`, Number(setup.length) === k)).join('')}${pill('pr-len', 'all', `All ${pool}`, setup.length === 'all')}</div>
        </section>
        <section class="stack-sm" aria-labelledby="opt-h"><h2 class="label" id="opt-h">Options</h2>
          <label class="row" style="cursor:pointer;min-height:44px"><input type="checkbox" data-change="pr-timed" data-k="timed"${setup.timed ? ' checked' : ''} style="width:18px;height:18px;accent-color:var(--ink)"> Timed (${SECONDS_PER_Q} seconds per question)</label>
          <div class="row"><span class="muted" style="font-size:.9rem">Feedback</span><div class="seg" role="group" aria-label="When to show feedback">
            <button data-act="pr-fb" data-v="instant" data-k="fb-i" aria-pressed="${setup.feedback === 'instant'}">After each question</button>
            <button data-act="pr-fb" data-v="end" data-k="fb-e" aria-pressed="${setup.feedback === 'end'}">At the end</button></div></div>
        </section>
        <div class="panel dark stack-sm">
          <p class="mono" style="font-size:.9rem">${n} questions · ${chosen.length ? chosen.map((m) => MODULE_BY_ID[m].code).join(' ') : 'no modules selected'} · ${setup.timed ? `${Math.round((n * SECONDS_PER_Q) / 60)} min` : 'untimed'} · shuffled</p>
          <div><button class="btn" style="background:var(--inv-ink);color:var(--inv);border-color:var(--inv-ink);font-weight:700" data-act="pr-start" data-k="start"${n ? '' : ' disabled'}>Start exam</button></div>
        </div>
      </div>
      <aside class="side-col stack">
        <section class="panel stack-sm"><h2 class="h3">Retry what you missed</h2>
          ${missed.length ? `<p class="muted">${missed.length} question${missed.length > 1 ? 's' : ''} you got wrong the last time you answered.</p><div><button class="btn primary" data-act="pr-retry-missed" data-k="rm">Retry ${missed.length} missed</button></div>` : '<p class="empty">Nothing to retry yet. Questions you miss show up here.</p>'}
        </section>
        <section class="panel stack-sm"><h2 class="h3">Your record</h2>
          ${o.seen ? `<p class="stats"><span><b>${o.r + o.w}</b> answers</span><span><b>${o.acc}%</b> correct</span></p>
          <ul class="list-plain divided">${MODULES.map((m) => { const p = moduleProgress(m); return `<li class="row" style="justify-content:space-between;padding:8px 0">${chip(m)}<span class="mono" style="font-size:.85rem">${p.acc == null ? '—' : `${p.acc}% of ${p.answered}`}</span></li>`; }).join('')}</ul>` : '<p class="empty">No answers yet. Your accuracy per module appears here.</p>'}
          <p class="muted" style="font-size:.8rem">Saved in this browser only.</p>
        </section>
      </aside>
    </div></div>`
  };
}

/* ---------- Question ---------- */
function questionView() {
  const id = session.ids[session.idx];
  const q = QUESTION_BY_ID[id];
  const s = session.st[id];
  const pos = session.idx;
  const last = pos === session.ids.length - 1;
  const instant = session.mode === 'instant';
  const showFb = instant && s.checked;
  const right = isRight(q, s);
  let body = '';
  if (q.t === 'mcq' || q.t === 'tf') {
    body = `<div class="opts" role="group" aria-label="Answer choices">${optionButtons(q, s, { act: 'pr-answer', show: showFb, lock: showFb, prefix: 'po' })}</div>`;
  } else if (q.t === 'id' || q.t === 'fill') {
    body = `<div class="stack-sm"><label for="ans" style="font-weight:600;font-size:.92rem">Your answer</label>
      <input id="ans" class="textans" data-input="pr-text" data-enter="pr-check" data-k="ans" value="${esc(s.text)}" autocomplete="off" autocapitalize="off" spellcheck="false"${showFb ? ' readonly' : ''}>
      <p class="muted" style="font-size:.82rem">Capital letters, spaces and a trailing semicolon do not matter.</p></div>`;
  } else if (q.t === 'order') {
    const n = s.order.length;
    body = `<ol class="list-plain order stack-sm" aria-label="Items in your order">${s.order.map((oi, i) => `<li><span class="on">${i + 1}</span><span class="ot">${fmt(q.o[oi])}</span>
      <button class="mv" data-act="pr-move" data-i="${i}" data-d="-1" data-k="up-${i}" aria-label="Move ${esc(q.o[oi])} up"${i === 0 || showFb ? ' disabled' : ''}>${ICON.up}</button>
      <button class="mv" data-act="pr-move" data-i="${i}" data-d="1" data-k="dn-${i}" aria-label="Move ${esc(q.o[oi])} down"${i === n - 1 || showFb ? ' disabled' : ''}>${ICON.down}</button></li>`).join('')}</ol>`;
  }
  const canAnswer = q.t === 'order' || (q.t === 'id' || q.t === 'fill' ? true : s.ans !== null);
  let primary = '';
  if (instant && !s.checked) primary = `<button class="btn primary" data-act="pr-check" data-k="check" data-hotkey="enter"${canAnswer ? '' : ' disabled'}>Check answer</button>`;
  else if (instant) primary = `<button class="btn primary" data-act="pr-next" data-k="next" data-hotkey="enter">${last ? 'See results' : 'Next question'} ${ICON.arrow}</button>`;
  else primary = `<button class="btn primary" data-act="pr-next" data-k="next" data-hotkey="enter">${last ? 'Finish exam' : 'Next question'}</button>`;
  const done = session.ids.filter((qid) => session.st[qid].checked || session.st[qid].ans !== null || (session.st[qid].text && session.st[qid].text.trim())).length;
  const comboChip = instant && s.checked && right && session.combo >= 3 ? `<span class="combo">${ICON.flame} ${session.combo} in a row</span>` : '';
  const keys = q.t === 'mcq' || q.t === 'tf' ? 'Keys: 1–' + (q.t === 'tf' ? 2 : q.o.length) + ' to choose, Enter to ' + (instant ? 'check and continue' : 'continue') : 'Enter to ' + (instant ? 'check and continue' : 'continue');
  const nav = session.ids.map((qid, i) => {
    const x = session.st[qid];
    let cls = 'qn';
    if (instant && x.checked) cls += isRight(QUESTION_BY_ID[qid], x) ? ' ok' : ' bad';
    else if (x.ans !== null || (x.text && x.text.trim())) cls += ' ans';
    const state = instant && x.checked ? (isRight(QUESTION_BY_ID[qid], x) ? ', correct' : ', wrong') : '';
    return `<button class="${cls}" data-act="pr-go" data-i="${i}" data-k="qn-${i}" aria-label="Question ${i + 1}${state}"${i === pos ? ' aria-current="step"' : ''}>${i + 1}</button>`;
  }).join('');
  const t = session.timed ? clock() : null;
  return {
    title: `Question ${pos + 1} · Practice`, nav: 'practice',
    html: `<div class="page ${q.module.track}"><div class="split">
      <div class="main-col stack" style="max-width:56rem">
        <div class="row" style="justify-content:space-between">
          <div class="row"><span class="mono muted" style="font-size:.85rem">Question ${pos + 1} of ${session.ids.length}</span>${chip(q.module)}<span class="label">${KIND[q.t]}</span></div>
          ${t ? `<span id="timer" class="timer${t.left <= 60 ? ' low' : ''}" role="timer" aria-label="Time left">${t.text} left</span>` : ''}
        </div>
        <div class="exam-progress">${bar(pct(done, session.ids.length))}</div>
        <h1 class="qtext">${fmt(q.q)}</h1>
        ${q.code ? `<pre class="qcode">${esc(q.code)}</pre>` : ''}
        ${body}
        ${showFb ? `<div class="fb-wrap">${feedbackBox(q, right)}${comboChip}</div>` : ''}
        <div class="row">${primary}${pos > 0 ? '<button class="btn" data-act="pr-prev" data-k="prev">Previous</button>' : ''}</div>
        <p class="keys muted">${keys}</p>
      </div>
      <aside class="side-col stack">
        <section class="stack-sm"><h2 class="label">Questions · ${esc(session.label)}</h2><div class="qnav">${nav}</div>
        <p class="muted" style="font-size:.84rem">${instant ? 'Feedback after each question.' : 'Answers are checked when you finish.'}</p></section>
        <section class="stack-sm"><button class="btn" data-act="pr-finish" data-k="finish">Finish now</button><button class="btn" data-act="pr-quit" data-k="quit">Quit without saving</button></section>
      </aside>
    </div></div>`
  };
}

/* ---------- Results ---------- */
function resultsView() {
  const ids = session.ids;
  const score = ids.filter((id) => isRight(QUESTION_BY_ID[id], session.st[id])).length;
  const byMod = new Map();
  for (const id of ids) {
    const q = QUESTION_BY_ID[id];
    const e = byMod.get(q.module) || { r: 0, n: 0 };
    e.n++; if (isRight(q, session.st[id])) e.r++;
    byMod.set(q.module, e);
  }
  const missed = ids.filter((id) => !isRight(QUESTION_BY_ID[id], session.st[id]));
  const rows = ids.map((id, i) => {
    const q = QUESTION_BY_ID[id];
    const s = session.st[id];
    const ok = isRight(q, s);
    const lesson = q.lesson;
    return `<li class="result-row"><span class="mark ${ok ? 'ok' : 'bad'}">${ok ? 'Correct' : 'Missed'}</span>
      <div class="stack-sm" style="gap:4px;min-width:0"><span style="font-weight:600">${i + 1}. ${fmt(q.q)}</span>
      ${ok ? '' : `<span style="font-size:.92rem">Your answer: <code>${esc(answerText(q, s))}</code></span><span style="font-size:.92rem">Correct: <code>${esc(correctText(q))}</code></span>`}
      <span class="muted" style="font-size:.9rem">${fmt(q.why)}</span>
      ${lesson ? `<a style="font-size:.88rem" href="#/learn/${lesson.module.id}/${lesson.id}">${esc(q.module.code)} · ${esc(lesson.title)}</a>` : ''}</div></li>`;
  }).join('');
  const p = pct(score, ids.length);
  const [headline, advice] = band(p);
  const out = session.outcome;
  let bestLine = '';
  if (out && out.change === 'better') bestLine = `<span class="best">${ICON.spark} New personal best for ${esc(session.label)}, up from ${out.prev}%</span>`;
  else if (out && out.change === 'first') bestLine = `<span class="best">${ICON.spark} First score on record for ${esc(session.label)}. Beat it next time.</span>`;
  else if (out && out.prev != null) bestLine = `<span class="muted" style="font-size:.9rem">Your best for ${esc(session.label)}: ${out.prev}%</span>`;
  return {
    title: 'Results · Practice', nav: 'practice',
    html: `<div class="page"><div class="split">
      <div class="main-col stack">
        <section class="result-hero">
          ${ring(score, ids.length, { size: 140, stroke: 12, label: `${p}%`, sub: `${score} of ${ids.length}` })}
          <div class="stack-sm">
            <span class="eyebrow">Results · ${esc(session.label)}</span>
            <h1 class="h1">${headline}</h1>
            <p class="lead" style="font-size:1.05rem">${advice}</p>
            ${bestLine}
            ${session.bestCombo >= 3 ? `<span class="muted" style="font-size:.9rem">Longest run: ${session.bestCombo} correct in a row</span>` : ''}
          </div>
        </section>
        <div class="row">${missed.length ? `<button class="btn primary" data-act="pr-retry-these" data-k="rt" data-hotkey="enter">Retry the ${missed.length} I missed</button>` : ''}<button class="btn" data-act="pr-new" data-k="new">New exam</button></div>
        <ol class="list-plain divided">${rows}</ol>
      </div>
      <aside class="side-col stack"><section class="panel stack-sm"><h2 class="label">By module</h2>
        <ul class="list-plain divided">${[...byMod.entries()].map(([m, e]) => `<li class="row" style="justify-content:space-between;padding:8px 0"><span class="row">${chip(m)}<span style="font-size:.9rem">${esc(m.title)}</span></span><span class="mono">${e.r}/${e.n}</span></li>`).join('')}</ul></section></aside>
    </div></div>`
  };
}

const cur = () => session.st[session.ids[session.idx]];

export const actions = {
  'pr-preset': (d) => { setup.mods = new Set(PRESETS[d.v]); },
  'pr-mod': (d, el) => { if (el.checked) setup.mods.add(d.m); else setup.mods.delete(d.m); },
  'pr-len': (d) => { setup.length = d.v === 'all' ? 'all' : Number(d.v); if (setup.length !== 'all') store.setSetting('length', setup.length); },
  'pr-timed': (d, el) => { setup.timed = el.checked; store.setSetting('timed', el.checked); },
  'pr-fb': (d) => { setup.feedback = d.v; store.setSetting('feedback', d.v); },
  'pr-start': () => { startSession({ mods: [...setup.mods], length: setup.length, timed: setup.timed, feedback: setup.feedback }); },
  'pr-retry-missed': () => { startSession({ ids: missedIds(), length: 'all', timed: false, feedback: 'instant' }); },
  'pr-answer': (d) => { const s = cur(); if (!(session.mode === 'instant' && s.checked)) s.ans = parseV(d.v); },
  'pr-text': (d, el) => { const s = cur(); if (!(session.mode === 'instant' && s.checked)) s.text = el.value; return false; },
  'pr-move': (d) => {
    const s = cur(); const i = Number(d.i); const j = i + Number(d.d);
    if (j < 0 || j >= s.order.length) return;
    [s.order[i], s.order[j]] = [s.order[j], s.order[i]];
  },
  'pr-check': () => {
    const id = session.ids[session.idx];
    if (session.mode === 'instant') {
      const s = session.st[id];
      const q = QUESTION_BY_ID[id];
      if (s.checked) { actions['pr-next'](); return; } // Enter again moves on
      if ((q.t === 'mcq' || q.t === 'tf') && s.ans === null) return;
      s.checked = true; record(id);
      bumpCombo(isRight(q, s));
    } else actions['pr-next']();
  },
  'pr-next': () => {
    // In "at the end" mode, count combos on finish only; in instant mode they were counted on check.
    if (session.idx === session.ids.length - 1) {
      if (session.mode !== 'instant') for (const qid of session.ids) bumpCombo(isRight(QUESTION_BY_ID[qid], session.st[qid]));
      finish();
    } else session.idx++;
    window.scrollTo(0, 0);
  },
  'pr-prev': () => { if (session.idx > 0) session.idx--; window.scrollTo(0, 0); },
  'pr-go': (d) => { session.idx = Number(d.i); window.scrollTo(0, 0); },
  'pr-finish': () => {
    if (!window.confirm('Finish now? Unanswered questions count as missed.')) return false;
    finish(); window.scrollTo(0, 0);
  },
  'pr-quit': () => {
    if (!window.confirm('Quit this exam? Answers you already checked stay in your record.')) return false;
    session = null; stopTimer();
  },
  'pr-new': () => { session = null; },
  'pr-retry-these': () => {
    const missed = session.ids.filter((id) => !isRight(QUESTION_BY_ID[id], session.st[id]));
    startSession({ ids: missed, length: 'all', timed: false, feedback: session.mode });
    window.scrollTo(0, 0);
  }
};
