// Pieces several views use: question widgets, grading, stable shuffles, progress numbers.
import { esc, fmt, KEYS, normAnswer, ICON } from '../util.js';
import { MODULES, QUESTIONS } from '../content/index.js';
import { store } from '../store.js';

// Deterministic shuffle so a lesson's quick-check options stay put between renders.
export function seededPerm(n, seedText) {
  let h = 2166136261;
  for (const ch of seedText) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const rand = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function typedOk(q, text) {
  const v = normAnswer(text);
  if (!v) return false;
  const strip = (s) => s.replace(/\(\)$/, '');
  return [q.a, ...(q.alt || [])].some((x) => { const n = normAnswer(x); return n === v || strip(n) === strip(v); });
}

export function isRight(q, st) {
  if (q.t === 'mcq' || q.t === 'tf') return st.ans === q.a;
  if (q.t === 'id' || q.t === 'fill') return typedOk(q, st.text);
  if (q.t === 'order') return (st.order || []).every((v, i) => v === i);
  return false;
}

export const KIND = { mcq: 'Multiple choice', tf: 'True or false', id: 'Identification', fill: 'Fill in the code', order: 'Put in order' };

export function answerText(q, st) {
  if (q.t === 'mcq') return st.ans == null ? '(no answer)' : q.o[st.ans];
  if (q.t === 'tf') return st.ans == null ? '(no answer)' : (st.ans ? 'True' : 'False');
  if (q.t === 'id' || q.t === 'fill') return st.text && st.text.trim() ? st.text : '(no answer)';
  if (q.t === 'order') return (st.order || []).map((i) => q.o[i]).join(' → ');
  return '';
}
export function correctText(q) {
  if (q.t === 'mcq') return q.o[q.a];
  if (q.t === 'tf') return q.a ? 'True' : 'False';
  if (q.t === 'id' || q.t === 'fill') return q.a;
  if (q.t === 'order') return q.o.join(' → ');
  return '';
}

// Options for mcq/tf, shown in `perm` order. `act` is the click action; `lock` disables after a final answer.
export function optionButtons(q, st, { act, show, lock, prefix }) {
  const items = q.t === 'tf' ? [[true, 'True'], [false, 'False']] : q.o.map((o, i) => [i, o]);
  const perm = q.t === 'tf' ? [0, 1] : (st.perm || items.map((_, i) => i));
  return perm.map((pi, pos) => {
    const [value, label] = items[pi];
    const chosen = st.ans === value;
    let cls = 'opt';
    if (show) {
      if (value === q.a) cls += ' right';
      else if (chosen) cls += ' wrong';
    }
    return `<button class="${cls}" data-act="${act}" data-v="${esc(String(value))}" data-k="${prefix}-${pos}" aria-pressed="${chosen}"${lock ? ' disabled' : ''}><span class="key" aria-hidden="true">${KEYS[pos]}</span><span class="otext">${fmt(label)}</span></button>`;
  }).join('');
}

export function feedbackBox(q, right, { reviewLink = true } = {}) {
  const lesson = q.lesson;
  const link = reviewLink && lesson ? ` <a href="#/learn/${lesson.module.id}/${lesson.id}">Review: ${esc(lesson.title)}</a>` : '';
  const answer = right || q.t === 'mcq' || q.t === 'tf' ? '' : ` Answer: <code>${esc(correctText(q))}</code>.`;
  return `<div class="fb ${right ? 'ok' : 'bad'}" role="status"><strong>${right ? 'Correct.' : 'Not quite.'}</strong>${answer} ${fmt(q.why)}${link}</div>`;
}

export function moduleProgress(m) {
  const done = m.lessons.filter((l) => store.isDone(l.key)).length;
  let r = 0, w = 0;
  for (const q of QUESTIONS) if (q.module === m) { const s = store.stat(q.id); if (s) { r += s.r; w += s.w; } }
  return { done, total: m.lessons.length, answered: r + w, acc: r + w ? Math.round((r / (r + w)) * 100) : null };
}

export function overall() {
  let done = 0, total = 0, r = 0, w = 0, seen = 0;
  for (const m of MODULES) for (const l of m.lessons) { total++; if (store.isDone(l.key)) done++; }
  for (const q of QUESTIONS) { const s = store.stat(q.id); if (s) { r += s.r; w += s.w; seen++; } }
  return { done, total, r, w, seen, acc: r + w ? Math.round((r / (r + w)) * 100) : null };
}

export function weakSpots(limit = 5) {
  const by = new Map();
  for (const q of QUESTIONS) {
    const s = store.stat(q.id);
    if (!s || !s.w || !q.lesson) continue;
    const e = by.get(q.lesson.key) || { lesson: q.lesson, w: 0, r: 0 };
    e.w += s.w; e.r += s.r;
    by.set(q.lesson.key, e);
  }
  return [...by.values()].map((e) => ({ ...e, score: e.w - e.r * 0.5 })).filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score).slice(0, limit);
}

export const missedIds = () => QUESTIONS.filter((q) => { const s = store.stat(q.id); return s && s.last === 0; }).map((q) => q.id);

export const chip = (m) => `<span class="chip${m.track === 'lv' ? ' lv' : ''}">${esc(m.code)}</span>`;
export const bar = (p) => `<div class="progress" role="img" aria-label="${p}% complete"><span style="width:${Math.max(0, Math.min(100, p))}%"></span></div>`;
export { ICON };
