// Tiny line-based highlighter for PHP, Blade, SQL, .env and shell snippets.
// It returns escaped HTML; it never inserts raw source text.
import { esc } from './util.js';

const KEYWORDS = new Set([
  'php', 'public', 'protected', 'private', 'function', 'class', 'extends', 'implements', 'namespace', 'use',
  'return', 'if', 'else', 'elseif', 'foreach', 'endforeach', 'endif', 'as', 'new', 'null', 'true', 'false',
  'array', 'static', 'fn', 'throw', 'echo', 'void', 'string', 'int', 'bool',
  'CREATE', 'TABLE', 'INSERT', 'INTO', 'VALUES', 'INT', 'VARCHAR', 'PRIMARY', 'KEY', 'AUTO_INCREMENT', 'NOT',
  'NULL', 'DEFAULT', 'DATETIME', 'UNIQUE', 'SELECT', 'FROM', 'WHERE'
]);
const SHELL_CMDS = new Set(['php', 'composer', 'npm', 'laravel', 'type', 'cd', 'mkdir']);

const RE = new RegExp([
  '(\\{\\{--.*?--\\}\\})',                       // 1 Blade comment
  '(\\/\\/.*$)',                                  // 2 line comment
  "('(?:[^'\\\\]|\\\\.)*'|\"(?:[^\"\\\\]|\\\\.)*\")", // 3 strings
  '(#.*$)',                                       // 4 shell/.env comment
  '(\\$[A-Za-z_]\\w*)',                           // 5 variable
  '(@[A-Za-z]+)',                                 // 6 Blade directive
  '(\\{\\{|\\}\\}|\\{!!|!!\\})',                  // 7 Blade echo
  '(<\\/?[A-Za-z][\\w:.-]*|\\/?>)',               // 8 HTML tag
  '(\\b\\d+\\b)',                                 // 9 number
  '([A-Za-z_][\\w]*)'                             // 10 word
].join('|'), 'g');

export function highlightLine(src, lang = 'php') {
  if (lang === 'plain' || lang === 'tree') return esc(src) || ' ';
  let out = '';
  let last = 0;
  let firstWord = true;
  RE.lastIndex = 0;
  let m;
  while ((m = RE.exec(src))) {
    if (m.index > last) out += esc(src.slice(last, m.index));
    const t = m[0];
    const fakeHash = m[4] && !['sh', 'env', 'blade'].includes(lang);
    const fakeSlash = m[2] && ['env', 'sh'].includes(lang);
    if (fakeHash || fakeSlash) {
      // Not a comment in this language: emit the first character and keep scanning.
      out += esc(t[0]);
      last = m.index + 1;
      RE.lastIndex = last;
      continue;
    }
    let cls = '';
    if (m[1] || m[2] || m[4]) cls = 'c';
    else if (m[3]) cls = 's';
    else if (m[5]) cls = 'v';
    else if (m[6]) cls = 'k';
    else if (m[7]) cls = 'k';
    else if (m[8]) cls = 'tag';
    else if (m[9]) cls = 'n';
    else if (m[10]) {
      const next = src.charAt(m.index + t.length);
      if (lang === 'sh' && firstWord && SHELL_CMDS.has(t)) cls = 'f';
      else if (lang === 'env') cls = /^[A-Z_]+$/.test(t) ? 'v' : '';
      else if (KEYWORDS.has(t)) cls = 'k';
      else if (next === '(') cls = 'f';
      else if (/^[A-Z]/.test(t)) cls = 't';
      firstWord = false;
    }
    out += cls ? `<span class="tk-${cls}">${esc(t)}</span>` : esc(t);
    last = m.index + t.length;
  }
  if (last < src.length) out += esc(src.slice(last));
  return out || ' ';
}
