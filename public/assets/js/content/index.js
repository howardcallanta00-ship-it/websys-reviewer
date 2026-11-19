// Loads every module and links lessons, code notes, questions, concepts and flashcards together.
import m1 from './m1.js';
import m2 from './m2.js';
import m3 from './m3.js';
import m4 from './m4.js';
import m5 from './m5.js';
import m6 from './m6.js';
import m7 from './m7.js';
import m8 from './m8.js';
import { CONCEPTS, VERDICTS } from './translator.js';
import { REFERENCE, GLOSSARY } from './reference.js';

export const MODULES = [m1, m2, m3, m4, m5, m6, m7, m8];
export const MODULE_BY_ID = {};
export const LESSON_BY_KEY = {};
export const QUESTIONS = [];
export const QUESTION_BY_ID = {};
export const CONCEPT_BY_ID = {};
export const PROBLEMS = []; // filled when content does not line up; scripts/check.mjs fails on any entry
export { CONCEPTS, VERDICTS, REFERENCE, GLOSSARY };

function prepFile(file, where) {
  const lines = String(file.src).replace(/^\n/, '').replace(/\s+$/, '').split('\n');
  const notes = new Array(lines.length).fill(null);
  for (const [match, title, body] of file.notes || []) {
    let idx;
    if (typeof match === 'number') idx = match - 1;
    else {
      idx = lines.findIndex((ln, i) => notes[i] === null && ln.includes(match));
      if (idx < 0) idx = lines.findIndex((ln) => ln.includes(match));
    }
    if (idx < 0 || idx >= lines.length) { PROBLEMS.push(`${where}: note "${match}" matches no line in ${file.name}`); continue; }
    if (notes[idx]) PROBLEMS.push(`${where}: two notes on line ${idx + 1} of ${file.name}`);
    notes[idx] = { title, body };
  }
  return { ...file, lines, notes, firstNote: notes.findIndex(Boolean) };
}

for (const m of MODULES) {
  MODULE_BY_ID[m.id] = m;
  const lessonIds = new Set();
  m.lessons.forEach((l, i) => {
    if (lessonIds.has(l.id)) PROBLEMS.push(`${m.id}: duplicate lesson id ${l.id}`);
    lessonIds.add(l.id);
    l.key = `${m.id}/${l.id}`;
    l.module = m;
    l.index = i;
    l.files = (l.code || []).map((f) => prepFile(f, l.key));
    LESSON_BY_KEY[l.key] = l;
    if (l.check) {
      const q = { t: 'mcq', q: l.check.q, o: l.check.o, a: l.check.a, why: l.check.why, l: l.id, id: `${l.key}#check`, module: m, lesson: l, fromCheck: true };
      QUESTIONS.push(q);
      QUESTION_BY_ID[q.id] = q;
    }
  });
  m.quiz.forEach((q, i) => {
    q.id = `${m.id}-q${i + 1}`;
    q.module = m;
    q.lesson = LESSON_BY_KEY[`${m.id}/${q.l}`] || null;
    if (!q.lesson) PROBLEMS.push(`${q.id}: lesson "${q.l}" not found`);
    QUESTIONS.push(q);
    QUESTION_BY_ID[q.id] = q;
  });
}

for (const c of CONCEPTS) CONCEPT_BY_ID[c.id] = c;

export const CARDS = REFERENCE.flatMap((sec) => sec.items.map(([code, meaning], i) => ({ id: `${sec.id}:${i}`, deck: sec.id, track: sec.track, code, meaning })));

export const ALL_LESSONS = MODULES.flatMap((m) => m.lessons);
export const lessonsOf = (mid) => (MODULE_BY_ID[mid] ? MODULE_BY_ID[mid].lessons : []);
export const questionsOf = (mids) => QUESTIONS.filter((q) => mids.includes(q.module.id));

export function neighbors(lesson) {
  const i = ALL_LESSONS.indexOf(lesson);
  return { prev: ALL_LESSONS[i - 1] || null, next: ALL_LESSONS[i + 1] || null };
}
