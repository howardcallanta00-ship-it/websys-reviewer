// Progress and settings, kept in this browser's localStorage only.
// Every read and write is guarded: private windows or blocked storage fall back to memory.
const KEY = 'it0049-reviewer-v1';
const DEFAULTS = {
  done: {},      // 'm4/filter': true
  checks: {},    // lesson quick-check result: 'm4/filter': true | false
  q: {},         // question stats: id -> { r, w, last }
  cards: {},     // flashcard box: id -> 1..5
  last: null,    // last opened lesson key
  days: {},      // study activity per local date: '2026-11-19' -> { p, q, ok, l, c }
  logged: {},    // lessons that already earned points (undo + redo does not farm points)
  best: {},      // best practice score per scope label -> percent
  cheered: {},   // dates the daily goal was celebrated
  settings: { theme: 'system', size: 'm', feedback: 'instant', timed: true, length: 20, cardSide: 'meaning', goal: 30 }
};
// Study points: effort counts, correct answers count more.
export const POINTS = { right: 2, wrong: 1, lesson: 5, card: 1 };

const clone = (o) => JSON.parse(JSON.stringify(o));
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return clone(DEFAULTS);
    const p = JSON.parse(raw);
    return { ...clone(DEFAULTS), ...p, settings: { ...DEFAULTS.settings, ...(p.settings || {}) } };
  } catch (e) {
    return clone(DEFAULTS);
  }
}

let data = load();
let persistent = true;
let listener = null;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); persistent = true; } catch (e) { persistent = false; }
}

function log(kind, ok) {
  const k = dayKey();
  const d = data.days[k] || { p: 0, q: 0, ok: 0, l: 0, c: 0 };
  const before = d.p;
  if (kind === 'answer') { d.q += 1; if (ok) d.ok += 1; d.p += ok ? POINTS.right : POINTS.wrong; }
  if (kind === 'lesson') { d.l += 1; d.p += POINTS.lesson; }
  if (kind === 'card') { d.c += 1; d.p += POINTS.card; }
  data.days[k] = d;
  if (listener) listener({ kind, ok, before, after: d.p });
}

export const store = {
  get data() { return data; },
  get persistent() { return persistent; },
  onActivity(fn) { listener = fn; },
  isDone: (key) => !!data.done[key],
  setDone(key, on) {
    if (on) {
      data.done[key] = true;
      if (!data.logged[key]) { data.logged[key] = true; log('lesson'); }
    } else delete data.done[key];
    save();
  },
  setLast(key) { if (data.last !== key) { data.last = key; save(); } },
  recordCheck(key, ok) { data.checks[key] = ok; save(); },
  recordAnswer(id, ok) {
    const s = data.q[id] || { r: 0, w: 0 };
    if (ok) s.r += 1; else s.w += 1;
    s.last = ok ? 1 : 0;
    data.q[id] = s;
    log('answer', ok);
    save();
  },
  stat: (id) => data.q[id],
  card: (id) => data.cards[id] || 0,
  setCard(id, box, review = true) { data.cards[id] = box; if (review) log('card'); save(); },
  day: (k = dayKey()) => data.days[k] || { p: 0, q: 0, ok: 0, l: 0, c: 0 },
  setBest(label, value) {
    const prev = data.best[label];
    if (prev == null || value > prev) { data.best[label] = value; save(); return prev == null ? 'first' : 'better'; }
    return null;
  },
  best: (label) => data.best[label],
  cheer(k) { if (data.cheered[k]) return false; data.cheered[k] = true; save(); return true; },
  setting: (k) => data.settings[k],
  setSetting(k, v) { data.settings[k] = v; save(); },
  resetProgress() { data = { ...clone(DEFAULTS), settings: data.settings }; save(); },
  resetAll() { data = clone(DEFAULTS); save(); }
};
