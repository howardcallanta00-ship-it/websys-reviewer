// Settings: theme, text size, default exam options, and progress reset.
import { store } from '../store.js';
import { overall } from './shared.js';

export function applySettings() {
  const root = document.documentElement;
  const theme = store.setting('theme');
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
  root.setAttribute('data-size', store.setting('size') || 'm');
}

const seg = (key, opts) => `<div class="seg" role="group" aria-label="${key}">${opts.map(([v, l]) => `<button data-act="set" data-s="${key}" data-v="${v}" data-k="set-${key}-${v}" aria-pressed="${String(store.setting(key)) === String(v)}">${l}</button>`).join('')}</div>`;

export function render() {
  const o = overall();
  return {
    title: 'Settings', nav: 'settings',
    html: `<div class="page stack" style="max-width:52rem">
      <span class="eyebrow">Settings</span><h1 class="h1">Settings</h1>
      <div class="divided">
        <div class="setting"><div class="what"><h2 class="h3">Theme</h2><p>System follows your device’s light or dark mode.</p></div>${seg('theme', [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']])}</div>
        <div class="setting"><div class="what"><h2 class="h3">Text size</h2><p>Changes every page, code included.</p></div>${seg('size', [['s', 'Small'], ['m', 'Default'], ['l', 'Large']])}</div>
        <div class="setting"><div class="what"><h2 class="h3">Exam feedback</h2><p>Default for new practice exams.</p></div>${seg('feedback', [['instant', 'After each question'], ['end', 'At the end']])}</div>
        <div class="setting"><div class="what"><h2 class="h3">Timed exams</h2><p>75 seconds per question.</p></div>${seg('timed', [['true', 'On'], ['false', 'Off']])}</div>
        <div class="setting"><div class="what"><h2 class="h3">Your progress</h2>
          <p>${o.done} of ${o.total} lessons done, ${o.r + o.w} answers recorded. ${store.persistent ? 'Saved in this browser only. Clearing site data or using another device starts fresh.' : 'This browser is blocking storage, so progress lasts only until you close the tab.'}</p></div>
          <button class="btn" data-act="reset-progress" data-k="reset" style="border-color:var(--bad);color:var(--bad)">Reset progress</button></div>
      </div>
    </div>`
  };
}

export const actions = {
  set: (d) => {
    const v = d.s === 'timed' ? d.v === 'true' : d.v;
    store.setSetting(d.s, v);
    applySettings();
  },
  'reset-progress': () => {
    if (!window.confirm('Reset all lesson progress, answers and flashcard boxes? Your settings stay. This cannot be undone.')) return false;
    store.resetProgress();
  }
};
