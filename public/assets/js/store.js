// Progress and settings, kept in this browser's localStorage only.
// Every read and write is guarded: private windows or blocked storage fall back to memory.
const KEY = 'it0049-reviewer-v1';
const DEFAULTS = {
  done: {},      // 'm4/filter': true
  checks: {},    // lesson quick-check result: 'm4/filter': true | false
  q: {},         // question stats: id -> { r, w, last }
  cards: {},     // flashcard box: id -> 1..5
  last: null,    // last opened lesson key
  settings: { theme: 'system', size: 'm', feedback: 'instant', timed: true, length: 20, cardSide: 'meaning' }
};
const clone = (o) => JSON.parse(JSON.stringify(o));

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
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); persistent = true; } catch (e) { persistent = false; }
}

export const store = {
  get data() { return data; },
  get persistent() { return persistent; },
  isDone: (key) => !!data.done[key],
  setDone(key, on) { if (on) data.done[key] = true; else delete data.done[key]; save(); },
  setLast(key) { if (data.last !== key) { data.last = key; save(); } },
  recordCheck(key, ok) { data.checks[key] = ok; save(); },
  recordAnswer(id, ok) {
    const s = data.q[id] || { r: 0, w: 0 };
    if (ok) s.r += 1; else s.w += 1;
    s.last = ok ? 1 : 0;
    data.q[id] = s;
    save();
  },
  stat: (id) => data.q[id],
  card: (id) => data.cards[id] || 0,
  setCard(id, box) { data.cards[id] = box; save(); },
  setting: (k) => data.settings[k],
  setSetting(k, v) { data.settings[k] = v; save(); },
  resetProgress() { data = { ...clone(DEFAULTS), settings: data.settings }; save(); },
  resetAll() { data = clone(DEFAULTS); save(); }
};
