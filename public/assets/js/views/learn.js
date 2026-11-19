// Lessons: track index, module overview, and the lesson workbench (rail + code + notes + quick check).
import { MODULES, MODULE_BY_ID, LESSON_BY_KEY, CONCEPT_BY_ID, QUESTION_BY_ID, questionsOf, neighbors } from '../content/index.js';
import { esc, fmt, plain, ICON, trackName, toast } from '../util.js';
import { highlightLine } from '../highlight.js';
import { store } from '../store.js';
import { seededPerm, optionButtons, moduleProgress, chip, bar, badge, mastery } from './shared.js';
import { startSession } from './practice.js';

let ls = null; // state of the open lesson

const parseV = (v) => (v === 'true' ? true : v === 'false' ? false : Number(v));

export function render(mid, lid) {
  if (!mid) return indexView();
  const m = MODULE_BY_ID[mid];
  if (!m) return null;
  if (!lid) return moduleView(m);
  const l = LESSON_BY_KEY[`${mid}/${lid}`];
  if (!l) return null;
  return lessonView(m, l);
}

/* ---------- Track index ---------- */
function modCard(m) {
  const p = moduleProgress(m);
  const pc = Math.round((p.done / p.total) * 100);
  return `<a class="modcard ${m.track}" href="#/learn/${m.id}">
    <span class="row" style="justify-content:space-between">${chip(m)}${badge(m)}</span>
    <span class="label">${p.total} lessons · ${questionsOf([m.id]).length} questions</span>
    <strong class="h3">${esc(m.title)}</strong>
    <p>${esc(m.summary)}</p>
    ${bar(pc)}
    <span class="muted" style="font-size:.84rem">${p.done}/${p.total} lessons done${p.acc != null ? ` · ${p.acc}% correct` : ''}</span>
  </a>`;
}

function indexView() {
  const ci = MODULES.filter((m) => m.track === 'ci');
  const lv = MODULES.filter((m) => m.track === 'lv');
  return {
    title: 'Lessons', nav: 'learn',
    html: `<div class="page stack" style="gap:36px">
      <div class="stack-sm"><span class="eyebrow">Lessons</span><h1 class="h1">One task manager, built twice</h1>
      <p class="lead">Modules 1–4 build a task manager in CodeIgniter 4. Modules 5–8 rebuild the same app in Laravel. Every lesson shows the real code from the slides, with a note on the lines that matter.</p></div>
      <section class="stack ci"><div class="track-head"><h2 class="h2">CodeIgniter 4</h2><span class="muted">Modules 1–4</span></div><div class="modlist">${ci.map(modCard).join('')}</div></section>
      <section class="stack lv"><div class="track-head"><h2 class="h2">Laravel</h2><span class="muted">Modules 5–8 · same app, rebuilt</span></div><div class="modlist">${lv.map(modCard).join('')}</div></section>
    </div>`
  };
}

/* ---------- Module overview ---------- */
function moduleView(m) {
  const p = moduleProgress(m);
  const firstOpen = m.lessons.find((l) => !store.isDone(l.key)) || m.lessons[0];
  const n = questionsOf([m.id]).length;
  const lessons = m.lessons.map((l, i) => `<li><a href="#/learn/${m.id}/${l.id}">
      <span class="num">${i + 1}</span>
      <span class="ltitle">${esc(l.title)}<span class="lsub">${esc(l.sub || '')}</span></span>
      ${store.isDone(l.key) ? `<span class="done" aria-label="Done">${ICON.check}</span>` : ''}
    </a></li>`).join('');
  return {
    title: `${m.code}: ${m.title}`, nav: 'learn',
    html: `<div class="page ${m.track}"><div class="split">
      <div class="main-col stack">
        <a href="#/learn" class="muted" style="font-size:.9rem">← All modules</a>
        <span class="eyebrow">${esc(trackName(m.track))} · Module ${m.code.slice(1)}</span>
        <h1 class="h1">${esc(m.title)}</h1>
        <p class="lead">${esc(m.summary)}</p>
        <div class="row">
          <a class="btn primary" href="#/learn/${m.id}/${firstOpen.id}">${p.done ? 'Continue' : 'Start'}: ${esc(firstOpen.title)}</a>
          <button class="btn" data-act="practice-module" data-m="${m.id}" data-k="pm">Practice ${esc(m.code)} (${n} questions)</button>
        </div>
        <div style="max-width:28rem">${bar(Math.round((p.done / p.total) * 100))}<p class="muted" style="font-size:.86rem;margin-top:6px">${p.done} of ${p.total} lessons done${p.acc != null ? ` · ${p.acc}% of answers correct` : ''}</p></div>
        <section class="stack-sm"><h2 class="h2">Lessons</h2><ol class="list-plain lessonlist divided">${lessons}</ol></section>
      </div>
      <aside class="side-col stack">
        ${(() => {
          const x = mastery(m);
          return `<section class="panel stack-sm mastery-panel"><div class="row" style="justify-content:space-between"><h2 class="label">Your level</h2>${badge(m)}</div>
          ${x.level === 3 ? `<p>All three targets met for ${esc(m.code)}. A short drill now and then keeps it fresh.</p>`
            : `<p class="muted" style="font-size:.9rem">Exam-ready means all three of these:</p>`}
          <ul class="reqs">${x.reqs.map((r) => `<li class="${r.ok ? 'ok' : ''}">${r.ok ? ICON.check : '<span class="todo" aria-hidden="true"></span>'}<span>${esc(r.label)} <b class="mono">${esc(r.fmt)}</b></span></li>`).join('')}</ul></section>`;
        })()}
        <section class="panel stack-sm"><h2 class="label">By the end you can</h2><ul class="prose" style="padding-left:1.1rem;margin:0">${m.objectives.map((o) => `<li>${fmt(o)}</li>`).join('')}</ul></section>
        <section class="panel stack-sm"><h2 class="label" style="color:var(--warn)">Common mistakes</h2><ul class="prose" style="padding-left:1.1rem;margin:0">${m.mistakes.map((o) => `<li>${fmt(o)}</li>`).join('')}</ul></section>
        <section class="panel stack-sm"><h2 class="label" style="color:var(--ok)">Remember</h2><ul class="prose" style="padding-left:1.1rem;margin:0">${m.takeaways.map((o) => `<li>${fmt(o)}</li>`).join('')}</ul></section>
      </aside>
    </div></div>`
  };
}

/* ---------- Lesson ---------- */
function ensureState(l) {
  if (ls && ls.key === l.key) return;
  const f = l.files[0];
  ls = {
    key: l.key, file: 0, line: f ? f.firstNote : -1, guest: true,
    stop: l.flow ? (l.flow.gate >= 0 ? l.flow.gate : l.flow.active[0]) : 0,
    ans: null, tried: false, reveal: false,
    perm: l.check ? seededPerm(l.check.o.length, l.key) : []
  };
}

function block(b) {
  const [type, a, b2, c] = b;
  const head = (t) => (t ? `<h3>${esc(t)}</h3>` : '');
  switch (type) {
    case 'p': return `<p>${fmt(a)}</p>`;
    case 'added': return `<p><span class="tag added">Added for clarity</span> ${fmt(a)}</p>`;
    case 'list': return `${head(b2)}<ul>${a.map((x) => `<li>${fmt(x)}</li>`).join('')}</ul>`;
    case 'steps': return `${head(b2)}<ol>${a.map((x) => `<li>${fmt(x)}</li>`).join('')}</ol>`;
    case 'table': return `${head(c)}<div class="table-wrap"><table class="t"><thead><tr>${a.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${b2.map((row) => `<tr>${row.map((cell) => `<td>${fmt(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'compare': return `<div class="compare">${[a, b2].map(([t, items], i) => `<div><span class="label ${i ? 'good-h' : 'bad-h'}">${esc(t)}</span><ul>${items.map((x) => `<li>${fmt(x)}</li>`).join('')}</ul></div>`).join('')}</div>`;
    case 'note': return `<div class="callout"><span class="label">${esc(b2 || 'Note')}</span><p style="margin-top:4px">${fmt(a)}</p></div>`;
    default: return '';
  }
}

function railHtml(f) {
  const g = f.gate;
  const items = f.stops.map((s, i) => {
    const skipped = g >= 0 && ls.guest && i > g;
    const on = g >= 0 ? i === g : f.active.includes(i);
    const cls = `stop${on ? ' on' : ''}${skipped ? ' skipped' : ''}`;
    const wire = i > 0 ? `<span class="wire${skipped ? ' skip' : ''}" aria-hidden="true"></span>` : '';
    return `<div class="rail-item">${wire}<button class="${cls}" data-act="lesson-stop" data-i="${i}" data-k="stop-${i}" aria-pressed="${i === ls.stop}"><span class="s-label">${esc(s[0])}</span><span class="s-sub">${esc(skipped ? 'not reached' : s[1])}</span></button></div>`;
  }).join('');
  const sel = f.stops[ls.stop] || f.stops[0];
  let outcome = '';
  let toggle = '';
  if (g >= 0) {
    const gate = f.stops[g][0];
    outcome = ls.guest
      ? `<p class="outcome" role="status"><span style="color:var(--bad)">${ICON.arrow}</span><span>Guest: ${esc(gate)} redirects to the login page. Nothing after it runs.</span></p>`
      : `<p class="outcome" role="status"><span style="color:var(--ok)">${ICON.check}</span><span>Logged in: ${esc(gate)} lets the request through and the page renders.</span></p>`;
    toggle = `<div class="seg" role="group" aria-label="Run the request as"><button data-act="lesson-guest" data-v="1" data-k="guest" aria-pressed="${ls.guest}">Run as guest</button><button data-act="lesson-guest" data-v="0" data-k="user" aria-pressed="${!ls.guest}">Run as logged in</button></div>`;
  }
  return `<section class="rail ${f.track}" aria-label="Request path">
    <div class="row" style="gap:10px 20px"><span class="label">Request path${f.url ? ` · ${esc(f.url)}` : ''}</span>${toggle}</div>
    <div class="rail-stops">${items}</div>
    <div class="rail-info">${outcome}<p><b class="mono">${esc(sel[0])}</b> · ${fmt(sel[2])}</p></div>
  </section>`;
}

function codeHtml(l) {
  if (!l.files.length) return '';
  const f = l.files[ls.file] || l.files[0];
  const tabs = l.files.map((x, i) => `<button class="code-tab" data-act="lesson-file" data-i="${i}" data-k="file-${i}" aria-selected="${i === ls.file}" aria-pressed="${i === ls.file}">${esc(x.name)}</button>`).join('');
  const lines = f.lines.map((src, i) => {
    const note = f.notes[i];
    const code = highlightLine(src, f.lang);
    if (note) {
      const label = `Line ${i + 1}: ${src.trim()}. Note: ${plain(note.title)}`;
      return `<button class="ln${i === ls.line ? ' sel' : ''}" data-act="lesson-line" data-i="${i}" data-k="ln-${i}" aria-pressed="${i === ls.line}" aria-label="${esc(label)}"><span class="gut"><span class="pip"></span>${i + 1}</span><span>${code}</span></button>`;
    }
    return `<div class="ln"><span class="gut">${i + 1}</span><span>${code}</span></div>`;
  }).join('');
  const hasNotes = f.firstNote >= 0;
  const idx = f.notes[ls.line] ? ls.line : f.firstNote;
  const note = hasNotes ? f.notes[idx] : null;
  return `<div class="code">
      <div class="code-tabs" aria-label="Files">${tabs}</div>
      <div class="code-meta"><span>${esc(f.path || f.name)}</span>${f.added ? '<span class="tag added">Added for clarity</span>' : ''}</div>
      <div class="code-scroll"><div class="code-lines">${lines}</div></div>
    </div>
    ${hasNotes ? `<p class="hint"><span class="pip" aria-hidden="true" style="background:var(--accent)"></span>Lines with a dot have a note. Select one to read it here.</p>
    <section class="note note-inline" aria-live="polite"><span class="note-where">${esc(f.name)} · line ${idx + 1}</span><h2 class="note-title">${fmt(note.title)}</h2><p class="note-body">${fmt(note.body)}</p></section>` : ''}`;
}

function checkHtml(l) {
  const c = l.check;
  if (!c) return '';
  const q = QUESTION_BY_ID[`${l.key}#check`];
  const answered = ls.ans !== null;
  const right = answered && ls.ans === c.a;
  const final = right || ls.reveal;
  const st = { ans: ls.ans, perm: ls.perm };
  let fb = '';
  if (right) fb = `<div class="fb ok" role="status"><strong>Correct.</strong> ${fmt(c.why)}</div>`;
  else if (ls.reveal) fb = `<div class="fb bad" role="status"><strong>Answer: ${fmt(c.o[c.a])}.</strong> ${fmt(c.why)}</div>`;
  else if (answered) fb = `<div class="fb bad" role="status"><strong>Not quite.</strong> Think about what this lesson showed, then try another option.</div>`;
  const after = answered && !final ? `<div class="row"><button class="btn small" data-act="lesson-reveal" data-k="reveal">Show the answer</button></div>` : '';
  return `<section class="stack-sm" aria-labelledby="qc-h">
    <h2 class="label" id="qc-h">Quick check</h2>
    <p style="font-weight:600;font-size:1.02rem;line-height:1.45">${fmt(c.q)}</p>
    <div class="opts" role="group" aria-label="Answer choices">${optionButtons(q, st, { act: 'lesson-answer', show: final, lock: final, prefix: 'qc' })}</div>
    ${fb}${after}
  </section>`;
}

function lessonView(m, l) {
  ensureState(l);
  store.setLast(l.key);
  const { prev, next } = neighbors(l);
  const done = store.isDone(l.key);
  const twin = l.twin && CONCEPT_BY_ID[l.twin];
  const other = m.track === 'ci' ? 'Laravel' : 'CodeIgniter';
  const steps = m.lessons.map((x, i) => {
    const isCur = x === l;
    const mark = store.isDone(x.key) ? `<span class="mk ok" aria-label="done">✓</span>` : `<span class="mk">${i + 1}</span>`;
    return `<li><a href="#/learn/${m.id}/${x.id}"${isCur ? ' aria-current="step"' : ''}>${mark}<span>${esc(x.title)}</span></a></li>`;
  }).join('');
  const link = (x, dir) => x ? `<a class="btn" href="#/learn/${x.module.id}/${x.id}"${dir === 'next' ? ' rel="next"' : ' rel="prev"'}>${dir === 'next' ? 'Next' : 'Previous'}: ${esc(x.title)}</a>` : '';

  return {
    title: `${l.title} · ${m.code}`, nav: 'learn',
    html: `${l.flow ? railHtml(l.flow) : ''}
    <div class="lesson ${m.track}">
      <nav class="stepnav" aria-label="Lessons in ${esc(m.code)}">
        <a href="#/learn/${m.id}" style="margin:0;padding:0"><span class="label">${esc(m.code)} · ${esc(m.title)}</span></a>
        <ol>${steps}</ol>
      </nav>
      <article class="lesson-main">
        <div class="row" style="justify-content:space-between">
          <span class="eyebrow">${esc(trackName(m.track))} · ${esc(m.code)} · Lesson ${l.index + 1} of ${m.lessons.length}</span>
          <a href="#/learn/${m.id}" style="font-size:.88rem">Module overview</a>
        </div>
        <h1 class="h1">${esc(l.title)}</h1>
        <p class="lead">${fmt(l.lead)}</p>
        ${l.body && l.body.length ? `<div class="prose">${l.body.map(block).join('')}</div>` : ''}
        ${codeHtml(l)}
        <div class="lesson-end">
          ${done
            ? `<p class="done-line">${ICON.check}<span>You finished this lesson.</span><button class="linkbtn" data-act="lesson-done" data-k="done">Undo</button></p>
               <div class="row">${next ? `<a class="btn primary" href="#/learn/${next.module.id}/${next.id}" rel="next">Next: ${esc(next.title)} ${ICON.arrow}</a>` : ''}${link(prev, 'prev')}</div>`
            : `<div class="row"><button class="btn primary" data-act="lesson-done-next" data-k="donenext">${next ? `Mark done and continue ${ICON.arrow}` : `${ICON.check} Mark done`}</button>
               ${next ? `<button class="btn" data-act="lesson-done" data-k="done">Mark done</button>` : ''}${link(prev, 'prev')}</div>
               ${next ? `<p class="muted" style="font-size:.86rem">Up next: ${esc(next.module.code)} · ${esc(next.title)}</p>` : ''}`}
        </div>
      </article>
      <aside class="lesson-side" aria-label="Lesson tools">
        ${l.plain ? `<section class="soft stack-sm"><h2 class="label">In plain words</h2><p style="line-height:1.55">${fmt(l.plain)}</p></section>` : ''}
        ${checkHtml(l)}
        ${l.watch && l.watch.length ? `<section class="stack-sm" style="border-top:1px solid var(--line);padding-top:16px"><h2 class="label" style="color:var(--warn)">Watch out for</h2><ul style="margin:0;padding-left:1.1rem;display:flex;flex-direction:column;gap:6px;font-size:.95rem">${l.watch.map((w) => `<li>${fmt(w)}</li>`).join('')}</ul></section>` : ''}
        ${twin ? `<section class="panel stack-sm"><h2 class="label">Same idea in ${other}</h2><p style="font-weight:600">${esc(twin.name)}</p><a class="btn small" href="#/compare/${twin.id}">Compare side by side</a></section>` : ''}
        <section class="stack-sm" style="border-top:1px solid var(--line);padding-top:16px"><button class="btn" data-act="practice-module" data-m="${m.id}" data-k="pm-side">Practice ${esc(m.code)} questions</button></section>
      </aside>
    </div>`
  };
}

function celebrateLesson(l) {
  const m = l.module;
  const p = moduleProgress(m);
  if (p.done === p.total) {
    toast(`<b>${ICON.spark} ${esc(m.code)} complete.</b> All ${p.total} lessons done. Practice ${esc(m.code)} to make it exam-ready.`, { kind: 'big', ms: 5200 });
  } else {
    toast(`<b>${ICON.check} Lesson done.</b> ${esc(m.code)} is ${p.done}/${p.total} · ${p.total - p.done} to go.`);
  }
}

export const actions = {
  'lesson-line': (d) => { ls.line = Number(d.i); },
  'lesson-file': (d) => {
    const l = LESSON_BY_KEY[ls.key];
    ls.file = Number(d.i);
    ls.line = l.files[ls.file].firstNote;
  },
  'lesson-stop': (d) => { ls.stop = Number(d.i); },
  'lesson-guest': (d) => { ls.guest = d.v === '1'; },
  'lesson-answer': (d) => {
    const l = LESSON_BY_KEY[ls.key];
    const v = parseV(d.v);
    ls.ans = v;
    const ok = v === l.check.a;
    if (!ls.tried) {
      ls.tried = true;
      store.recordCheck(l.key, ok);
      store.recordAnswer(`${l.key}#check`, ok);
    }
  },
  'lesson-reveal': () => { ls.reveal = true; },
  'lesson-done': () => {
    const on = !store.isDone(ls.key);
    store.setDone(ls.key, on);
    if (on) celebrateLesson(LESSON_BY_KEY[ls.key]);
  },
  'lesson-done-next': () => {
    const l = LESSON_BY_KEY[ls.key];
    store.setDone(l.key, true);
    celebrateLesson(l);
    const { next } = neighbors(l);
    if (!next) return;
    location.hash = `#/learn/${next.module.id}/${next.id}`;
    return false;
  },
  'practice-module': (d) => {
    startSession({ mods: [d.m], length: 'all', timed: false, feedback: store.setting('feedback') });
    location.hash = '#/practice';
    return false;
  }
};
