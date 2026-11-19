// Content validator. Runs locally (npm run check) and as Render's build command.
// Fails the build if any lesson, question, note, cross-link or file reference is broken.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = await import(new URL('../public/assets/js/content/index.js', import.meta.url));
const { MODULES, QUESTIONS, CONCEPTS, CONCEPT_BY_ID, CARDS, GLOSSARY, PROBLEMS } = content;

const problems = [...PROBLEMS];
const TYPES = new Set(['mcq', 'tf', 'id', 'fill', 'order']);
const BLOCKS = new Set(['p', 'list', 'steps', 'table', 'compare', 'note', 'added']);
const KNOWN_LANGS = new Set(['php', 'blade', 'sql', 'sh', 'env', 'tree', 'plain']);

for (const m of MODULES) {
  for (const k of ['id', 'code', 'track', 'title', 'summary']) if (!m[k]) problems.push(`${m.id || '?'}: missing ${k}`);
  if (!['ci', 'lv'].includes(m.track)) problems.push(`${m.id}: bad track ${m.track}`);
  for (const l of m.lessons) {
    const where = l.key;
    if (!l.title || !l.lead) problems.push(`${where}: missing title or lead`);
    for (const b of l.body || []) if (!BLOCKS.has(b[0])) problems.push(`${where}: unknown block type ${b[0]}`);
    for (const f of l.files) {
      if (!KNOWN_LANGS.has(f.lang)) problems.push(`${where}: unknown lang ${f.lang} in ${f.name}`);
      if (f.src.includes('\t')) problems.push(`${where}: tab character in ${f.name}`);
    }
    if (l.twin && !CONCEPT_BY_ID[l.twin]) problems.push(`${where}: twin "${l.twin}" is not a concept`);
    if (l.flow) {
      if (!l.flow.stops.every(Boolean)) problems.push(`${where}: flow has an unknown stop`);
      if (!l.flow.active.length) problems.push(`${where}: flow has no active stop`);
    }
    if (!l.check) problems.push(`${where}: no quick check`);
  }
}

for (const q of QUESTIONS) {
  const where = q.id;
  if (!TYPES.has(q.t)) problems.push(`${where}: unknown type ${q.t}`);
  if (!q.q || !q.why) problems.push(`${where}: missing prompt or explanation`);
  if (q.t === 'mcq') {
    if (!Array.isArray(q.o) || q.o.length < 2) problems.push(`${where}: needs at least two options`);
    else if (!Number.isInteger(q.a) || q.a < 0 || q.a >= q.o.length) problems.push(`${where}: answer index out of range`);
    else if (new Set(q.o).size !== q.o.length) problems.push(`${where}: duplicate options`);
  }
  if (q.t === 'tf' && typeof q.a !== 'boolean') problems.push(`${where}: true/false answer must be boolean`);
  if ((q.t === 'id' || q.t === 'fill') && (typeof q.a !== 'string' || !q.a.trim())) problems.push(`${where}: typed answer missing`);
  if (q.t === 'fill' && !q.code) problems.push(`${where}: fill-in question needs code`);
  if (q.t === 'order' && (!Array.isArray(q.o) || q.o.length < 3)) problems.push(`${where}: order question needs 3+ items`);
}

const conceptIds = new Set();
for (const c of CONCEPTS) {
  if (conceptIds.has(c.id)) problems.push(`concept ${c.id}: duplicate id`);
  conceptIds.add(c.id);
  for (const side of ['ci', 'lv']) if (!Array.isArray(c[side]) || c[side].length !== 3) problems.push(`concept ${c.id}: bad ${side} side`);
}

const indexHtml = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8');
for (const ref of ['assets/css/app.css', 'assets/js/app.js', 'favicon.svg']) {
  if (!indexHtml.includes(ref)) problems.push(`index.html does not reference ${ref}`);
  if (!fs.existsSync(path.join(root, 'public', ref))) problems.push(`missing file public/${ref}`);
}

const lessons = MODULES.reduce((n, m) => n + m.lessons.length, 0);
const quiz = QUESTIONS.filter((q) => !q.fromCheck).length;
console.log(`Modules: ${MODULES.length} | Lessons: ${lessons} | Quiz questions: ${quiz} | Quick checks: ${QUESTIONS.length - quiz} | Concepts: ${CONCEPTS.length} | Flashcards: ${CARDS.length} | Glossary terms: ${GLOSSARY.length}`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(' - ' + p);
  process.exit(1);
}
console.log('Content check passed.');
