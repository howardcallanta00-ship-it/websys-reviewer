// CodeIgniter <-> Laravel translator with a "hide one side" self-test.
import { CONCEPTS, CONCEPT_BY_ID, VERDICTS, MODULE_BY_ID, ALL_LESSONS } from '../content/index.js';
import { esc, fmt } from '../util.js';
import { highlightLine } from '../highlight.js';

let hide = 'none';
let revealed = false;
let lastId = null;

function side(c, key) {
  const [file, lang, src] = c[key];
  const hidden = hide === key && !revealed;
  const name = key === 'ci' ? 'CodeIgniter 4' : 'Laravel';
  const lines = String(src).split('\n').map((ln) => `<div class="code-plain">${highlightLine(ln, lang)}</div>`).join('');
  return `<section class="code side ${key}" aria-label="${name}">
    <div class="side-head"><b>${name}</b><span>${esc(file)}</span></div>
    ${hidden
      ? `<div class="hidden-side"><span>Write or say the ${name} version, then check.</span><button class="btn small" style="background:#F4F1EA;color:#16171B;border-color:#F4F1EA" data-act="cmp-reveal" data-k="reveal">Reveal</button></div>`
      : `<div class="code-scroll"><div class="code-lines" style="padding:10px 0 4px">${lines}</div></div>`}
  </section>`;
}

export function render(id) {
  const c = (id && CONCEPT_BY_ID[id]) || CONCEPTS[0];
  if (id && !CONCEPT_BY_ID[id]) return null;
  if (c.id !== lastId) { revealed = false; lastId = c.id; }
  const lessons = ALL_LESSONS.filter((l) => l.twin === c.id);
  const list = CONCEPTS.map((x) => `<a class="cpt" href="#/compare/${x.id}"${x.id === c.id ? ' aria-current="page"' : ''}><span>${esc(x.name)}</span><span class="n">${x.mods.map((m) => MODULE_BY_ID[m].code).join(' · ')}</span></a>`).join('');
  const seg = (v, label) => `<button data-act="cmp-hide" data-v="${v}" data-k="hide-${v}" aria-pressed="${hide === v}">${label}</button>`;
  return {
    title: `${c.name} · CI ↔ Laravel`, nav: 'compare',
    html: `<div class="page"><div class="split" style="gap:24px">
      <nav class="side-col" aria-label="Concepts" style="flex:1 1 260px;max-width:340px">
        <span class="label">${CONCEPTS.length} concepts</span>
        <div class="cpt-list" style="margin-top:8px">${list}</div>
      </nav>
      <div class="main-col stack">
        <div class="row" style="justify-content:space-between"><span class="verdict">${esc(VERDICTS[c.verdict])}</span>
          <div class="row"><span class="muted" style="font-size:.88rem">Test yourself: hide</span><div class="seg" role="group" aria-label="Hide one side">${seg('none', 'Nothing')}${seg('lv', 'Laravel')}${seg('ci', 'CodeIgniter')}</div></div></div>
        <h1 class="h1">${esc(c.name)}</h1>
        <p class="lead">${fmt(c.summary)}</p>
        <div class="sides">${side(c, 'ci')}${side(c, 'lv')}</div>
        <div class="compare">
          <div><span class="label good-h">Stays the same</span><p style="margin-top:6px">${fmt(c.same)}</p></div>
          <div><span class="label bad-h">Changes</span><p style="margin-top:6px">${fmt(c.diff)}</p></div>
        </div>
        ${lessons.length ? `<p class="muted" style="font-size:.9rem">Lessons: ${lessons.map((l) => `<a href="#/learn/${l.module.id}/${l.id}">${esc(l.module.code)} · ${esc(l.title)}</a>`).join(' · ')}</p>` : ''}
      </div>
    </div></div>`
  };
}

export const actions = {
  'cmp-hide': (d) => { hide = d.v; revealed = false; },
  'cmp-reveal': () => { revealed = true; }
};
