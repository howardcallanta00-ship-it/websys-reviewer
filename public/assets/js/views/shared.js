// Pieces several views use: question widgets, grading, stable shuffles, progress numbers.
import { esc, fmt, KEYS, normAnswer, ICON } from '../util.js';
import { MODULES, QUESTIONS } from '../content/index.js';
import { store, dayKey } from '../store.js';

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
    return `<button class="${cls}" data-act="${act}" data-v="${esc(String(value))}" data-k="${prefix}-${pos}" data-hotkey="${pos + 1} ${KEYS[pos].toLowerCase()}" aria-keyshortcuts="${pos + 1}" aria-pressed="${chosen}"${lock ? ' disabled' : ''}><span class="key" aria-hidden="true">${KEYS[pos]}</span><span class="otext">${fmt(label)}</span></button>`;
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

/* ---------- Motivation: daily goal, streak, week, mastery ---------- */
const DAY_MS = 86400000;
export const goal = () => Number(store.setting('goal')) || 30;

export function streak() {
  let n = 0;
  const today = new Date();
  // A streak stays alive until the end of today even if today has no activity yet.
  let start = store.day(dayKey(today)).p > 0 ? 0 : 1;
  for (let i = start; i < 400; i++) {
    const d = new Date(today.getTime() - i * DAY_MS);
    if (store.day(dayKey(d)).p > 0) n++; else break;
  }
  return { n, today: store.day(dayKey(today)).p > 0 };
}

export function week() {
  const today = new Date();
  return [...Array(7).keys()].reverse().map((i) => {
    const d = new Date(today.getTime() - i * DAY_MS);
    const p = store.day(dayKey(d)).p;
    return { label: d.toLocaleDateString('en', { weekday: 'narrow' }), full: d.toLocaleDateString('en', { weekday: 'long' }), p, hit: p >= goal(), today: i === 0 };
  });
}

// Mastery uses each question's most recent answer, so it reflects what you know now.
export function mastery(m) {
  const qs = QUESTIONS.filter((q) => q.module === m);
  const seen = qs.filter((q) => store.stat(q.id));
  const lastRight = seen.filter((q) => store.stat(q.id).last === 1).length;
  const acc = seen.length ? Math.round((lastRight / seen.length) * 100) : 0;
  const done = m.lessons.filter((l) => store.isDone(l.key)).length;
  const needSeen = Math.ceil(qs.length * 0.6);
  const reqs = [
    { label: 'Lessons done', have: done, need: m.lessons.length, ok: done === m.lessons.length, fmt: `${done}/${m.lessons.length}` },
    { label: 'Questions tried', have: seen.length, need: needSeen, ok: seen.length >= needSeen, fmt: `${seen.length}/${needSeen}` },
    { label: 'Correct (latest tries)', have: acc, need: 80, ok: seen.length >= needSeen && acc >= 80, fmt: seen.length ? `${acc}% (need 80%)` : 'need 80%' }
  ];
  let level = 0;
  if (done > 0 || seen.length > 0) level = 1;
  if (done === m.lessons.length || seen.length >= Math.ceil(qs.length * 0.3)) level = 2;
  if (reqs.every((r) => r.ok)) level = 3;
  return { level, label: ['Not started', 'Learning', 'Practicing', 'Exam-ready'][level], reqs, acc, seen: seen.length, total: qs.length };
}

export const badge = (m) => { const x = mastery(m); return `<span class="badge lvl-${x.level}">${x.label}</span>`; };

export function ring(value, max, { size = 112, stroke = 10, label = '', sub = '' } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = max ? Math.min(1, value / max) : 0;
  return `<div class="ring${frac >= 1 ? ' full' : ''}" style="width:${size}px;height:${size}px" role="img" aria-label="${esc(`${label} ${sub}`.trim())}">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${stroke}"></circle>
      <circle class="ring-arc" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--ring)" stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - frac)).toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"></circle>
    </svg>
    <span class="ring-text"><b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>
  </div>`;
}

export function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Up late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export const chip = (m) => `<span class="chip${m.track === 'lv' ? ' lv' : ''}">${esc(m.code)}</span>`;
export const bar = (p) => `<div class="progress" role="img" aria-label="${p}% complete"><span style="width:${Math.max(0, Math.min(100, p))}%"></span></div>`;
export { ICON };
