// Small shared helpers. Every string that reaches innerHTML goes through esc() or fmt().
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// Inline formatting for content text: `code` and **bold**. Everything else is escaped.
export function fmt(text) {
  const parts = String(text ?? '').split(/(`[^`]+`)/g);
  return parts.map((p) => {
    if (p.length > 2 && p.startsWith('`') && p.endsWith('`')) return `<code>${esc(p.slice(1, -1))}</code>`;
    return esc(p).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }).join('');
}

// Plain text version of formatted content, for search and aria labels.
export const plain = (text) => String(text ?? '').replace(/`/g, '').replace(/\*\*/g, '');

export function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
export const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Normalizes typed answers: case, quotes, whitespace and a trailing semicolon do not matter.
export const normAnswer = (s) => String(s ?? '').toLowerCase().replace(/[‘’“”"]/g, "'").replace(/\s+/g, '').replace(/;+$/, '');

export const ICON = {
  check: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"></path></svg>',
  arrow: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>',
  up: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"></path></svg>',
  down: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>',
  flame: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"></path></svg>',
  spark: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"></path></svg>',
  print: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"></path></svg>'
};

// Small, polite notification. One at a time; each replaces the last.
let toastTimer = null;
export function toast(html, { kind = 'info', ms = 3600 } = {}) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  el.className = `toast ${kind}`;
  el.innerHTML = html;
  // Restart the entrance animation.
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

export const trackName =(t) => (t === 'lv' ? 'Laravel' : 'CodeIgniter 4');
