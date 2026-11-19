// Cheat sheets (printable), glossary, and site search.
import { REFERENCE, GLOSSARY, ALL_LESSONS, CONCEPTS, QUESTIONS } from '../content/index.js';
import { esc, fmt, plain, ICON } from '../util.js';

const TABS = [['ci', 'CodeIgniter 4'], ['lv', 'Laravel'], ['glossary', 'Glossary']];

export function renderReference(tab) {
  const t = tab || 'ci';
  if (!TABS.some(([k]) => k === t)) return null;
  const tabs = `<div class="seg no-print" role="group" aria-label="Sheet">${TABS.map(([k, l]) => `<a href="#/reference/${k}" style="text-decoration:none;border-radius:6px;padding:7px 12px;min-height:36px;display:inline-flex;align-items:center;font-size:.88rem;${k === t ? 'background:var(--inv);color:var(--inv-ink);font-weight:600' : 'color:var(--ink-2)'}"${k === t ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</div>`;
  let body;
  if (t === 'glossary') {
    body = `<dl class="gloss">${GLOSSARY.map(([term, def, mods]) => `<dt>${esc(term)}<span class="mods">${esc(mods)}</span></dt><dd>${fmt(def)}</dd>`).join('')}</dl>`;
  } else {
    body = REFERENCE.filter((s) => s.track === t).map((s) => `<section class="ref-section ${s.track}" aria-labelledby="ref-${s.id}">
        <div class="row" style="justify-content:space-between"><h2 class="h3" id="ref-${s.id}">${esc(s.title)}</h2><span class="mono muted" style="font-size:.78rem">${esc(s.mods)}</span></div>
        <div class="table-wrap"><table class="t"><thead><tr><th scope="col">Code</th><th scope="col">What it does</th></tr></thead>
        <tbody>${s.items.map(([code, meaning]) => `<tr><td class="code">${esc(code)}</td><td>${esc(meaning)}</td></tr>`).join('')}</tbody></table></div>
      </section>`).join('');
  }
  return {
    title: `${TABS.find(([k]) => k === t)[1]} · Reference`, nav: 'reference',
    html: `<div class="page stack" style="gap:24px">
      <div class="row" style="justify-content:space-between;align-items:flex-end">
        <div class="stack-sm"><span class="eyebrow">Reference</span><h1 class="h1">${t === 'glossary' ? 'Glossary' : `${TABS.find(([k]) => k === t)[1]} cheat sheet`}</h1></div>
        <div class="row no-print">${tabs}<button class="btn small" data-act="ref-print" data-k="print">${ICON.print} Print</button></div>
      </div>
      ${body}
    </div>`
  };
}

/* ---------- Search ---------- */
let index = null;
function buildIndex() {
  const items = [];
  const blockText = (b) => b.slice(1).flat(3).filter((x) => typeof x === 'string').join(' ');
  for (const l of ALL_LESSONS) {
    const notes = l.files.flatMap((f) => f.notes.filter(Boolean).map((n) => `${n.title} ${n.body}`)).join(' ');
    const code = l.files.map((f) => f.lines.join(' ')).join(' ');
    items.push({ kind: 'Lesson', title: l.title, sub: `${l.module.code} · ${l.module.title}`, href: `#/learn/${l.module.id}/${l.id}`, snippet: plain(l.lead), text: [l.title, l.sub, l.lead, l.plain, (l.body || []).map(blockText).join(' '), notes, code].join(' ') });
  }
  for (const [term, def, mods] of GLOSSARY) items.push({ kind: 'Glossary', title: term, sub: mods, href: '#/reference/glossary', snippet: plain(def), text: `${term} ${def}` });
  for (const c of CONCEPTS) items.push({ kind: 'CI ↔ Laravel', title: c.name, sub: c.mods.join(' ').toUpperCase(), href: `#/compare/${c.id}`, snippet: plain(c.summary), text: [c.name, c.summary, c.same, c.diff, c.ci[2], c.lv[2]].join(' ') });
  for (const s of REFERENCE) for (const [code, meaning] of s.items) items.push({ kind: 'Cheat sheet', title: code, sub: `${s.track === 'ci' ? 'CodeIgniter' : 'Laravel'} · ${s.title}`, href: `#/reference/${s.track}`, snippet: meaning, text: `${code} ${meaning}`, mono: true });
  for (const q of QUESTIONS) if (q.lesson) items.push({ kind: 'Question', title: plain(q.q), sub: `${q.module.code} · ${q.lesson.title}`, href: `#/learn/${q.module.id}/${q.lesson.id}`, snippet: plain(q.why), text: `${q.q} ${q.why} ${(q.o || []).join(' ')}` });
  for (const it of items) it.low = it.text.toLowerCase();
  return items;
}

function mark(text, terms) {
  let out = esc(text);
  for (const t of terms) {
    const safe = esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (safe) out = out.replace(new RegExp(`(${safe})`, 'gi'), '<mark>$1</mark>');
  }
  return out;
}

export function renderSearch(q) {
  if (!index) index = buildIndex();
  const query = (q || '').trim();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  let results = [];
  if (terms.length) {
    results = index.filter((it) => terms.every((t) => it.low.includes(t))).map((it) => {
      const tl = it.title.toLowerCase();
      const score = terms.reduce((s, t) => s + (tl.includes(t) ? 5 : 0), 0) + ({ Lesson: 3, 'CI ↔ Laravel': 2, Glossary: 2, 'Cheat sheet': 1, Question: 0 }[it.kind] || 0);
      return { ...it, score };
    }).sort((a, b) => b.score - a.score).slice(0, 60);
  }
  return {
    title: query ? `Search: ${query}` : 'Search', nav: '',
    html: `<div class="page stack" style="max-width:60rem">
      <span class="eyebrow">Search</span>
      <h1 class="h1">${query ? `${results.length} result${results.length === 1 ? '' : 's'} for “${esc(query)}”` : 'Search the reviewer'}</h1>
      ${!query ? '<p class="muted">Type in the search box at the top. Try <code>findOrFail</code>, <code>csrf</code>, <code>flash</code> or <code>(:num)</code>.</p>' : ''}
      ${query && !results.length ? '<p class="empty">Nothing matched every word. Try fewer words or a function name.</p>' : ''}
      <ol class="list-plain divided results">${results.map((r) => `<li><span class="kind">${esc(r.kind)} · ${esc(r.sub)}</span><br>
        <a href="${r.href}" style="font-weight:600;${r.mono ? 'font-family:var(--mono)' : ''}">${mark(r.title, terms)}</a>
        <p class="muted" style="font-size:.9rem;margin-top:2px">${mark(r.snippet, terms)}</p></li>`).join('')}</ol>
    </div>`
  };
}

export const actions = { 'ref-print': () => { window.print(); return false; } };
