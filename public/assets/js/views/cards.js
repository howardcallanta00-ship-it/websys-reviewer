// Flashcards built from the cheat sheets, with simple Leitner boxes (1 = new/hard ... 5 = known).
import { CARDS, REFERENCE } from '../content/index.js';
import { esc, shuffle, trackName } from '../util.js';
import { store } from '../store.js';

let decks = null;   // selected deck ids
let queue = [];
let flipped = false;
let reviewed = 0;

function build() {
  const pool = CARDS.filter((c) => decks.has(c.deck));
  // Lowest boxes first, shuffled within each box.
  const byBox = [1, 2, 3, 4, 5].map((b) => shuffle(pool.filter((c) => Math.max(1, store.card(c.id) || 1) === b)));
  queue = byBox.flat();
  flipped = false;
  reviewed = 0;
}

export function render() {
  if (!decks) { decks = new Set(REFERENCE.filter((s) => s.track === 'ci').map((s) => s.id)); build(); }
  const side = store.setting('cardSide') || 'meaning';
  const card = queue[0];
  const counts = [1, 2, 3, 4, 5].map((b) => CARDS.filter((c) => decks.has(c.deck) && Math.max(1, store.card(c.id) || 1) === b).length);
  const deckBtn = (s) => {
    const n = s.items.length;
    return `<button class="deck ${s.track}" data-act="card-deck" data-d="${s.id}" data-k="deck-${s.id}" aria-pressed="${decks.has(s.id)}"><strong>${esc(s.title)}</strong><small>${esc(trackName(s.track))} · ${n} cards</small></button>`;
  };
  const front = card ? (side === 'meaning' ? `<p class="front">${esc(card.meaning)}</p>` : `<div class="back">${esc(card.code)}</div>`) : '';
  const back = card ? (side === 'meaning' ? `<div class="back">${esc(card.code)}</div>` : `<p class="front">${esc(card.meaning)}</p>`) : '';
  const box = card ? Math.max(1, store.card(card.id) || 1) : 0;
  return {
    title: 'Flashcards', nav: 'cards',
    html: `<div class="page"><div class="split">
      <div class="main-col stack">
        <div class="stack-sm"><span class="eyebrow">Flashcards</span><h1 class="h1">Commands, helpers and rules</h1>
        <p class="lead">Read the prompt, say or write the answer, then flip. Cards you know move to higher boxes and come back less often.</p></div>
        <div class="row"><span class="muted" style="font-size:.9rem">Show me</span><div class="seg" role="group" aria-label="Card direction">
          <button data-act="card-side" data-v="meaning" data-k="side-m" aria-pressed="${side === 'meaning'}">What it does → recall the code</button>
          <button data-act="card-side" data-v="code" data-k="side-c" aria-pressed="${side === 'code'}">The code → recall what it does</button></div></div>
        ${card ? `<section class="flash ${card.track}" aria-live="polite">
            <div class="row" style="justify-content:space-between"><span class="label">${esc(trackName(card.track))} · ${esc(REFERENCE.find((s) => s.id === card.deck).title)}</span><span class="mono muted" style="font-size:.78rem">Box ${box} · ${queue.length} left</span></div>
            ${front}
            ${flipped ? back : ''}
            <div class="row">${flipped
              ? `<button class="btn" data-act="card-rate" data-v="again" data-k="again">Again</button><button class="btn primary" data-act="card-rate" data-v="good" data-k="good">Got it</button><button class="btn" data-act="card-rate" data-v="easy" data-k="easy">Easy</button>`
              : `<button class="btn primary" data-act="card-flip" data-k="flip">Show answer</button>`}</div>
          </section>`
          : `<section class="flash stack-sm"><p class="front">${decks.size ? `Deck finished. ${reviewed} cards reviewed.` : 'Pick at least one deck below.'}</p>${decks.size ? '<div><button class="btn primary" data-act="card-restart" data-k="restart">Go again</button></div>' : ''}</section>`}
        <div class="boxes" aria-label="Cards per box">${counts.map((c, i) => `<span>Box ${i + 1}: ${c}</span>`).join('')}</div>
      </div>
      <aside class="side-col stack">
        <section class="stack-sm"><div class="row" style="justify-content:space-between"><h2 class="label">Decks</h2><span class="row" style="gap:6px"><button class="btn small" data-act="card-pick" data-v="ci" data-k="pick-ci">CI</button><button class="btn small" data-act="card-pick" data-v="lv" data-k="pick-lv">Laravel</button><button class="btn small" data-act="card-pick" data-v="all" data-k="pick-all">All</button></span></div>
          <div class="decks">${REFERENCE.map(deckBtn).join('')}</div></section>
        <section class="stack-sm"><button class="btn small" data-act="card-reset" data-k="creset">Reset card boxes</button></section>
      </aside>
    </div></div>`
  };
}

export const actions = {
  'card-flip': () => { flipped = true; },
  'card-rate': (d) => {
    const card = queue.shift();
    if (!card) return;
    const box = Math.max(1, store.card(card.id) || 1);
    if (d.v === 'again') { store.setCard(card.id, 1); queue.splice(Math.min(3, queue.length), 0, card); }
    else store.setCard(card.id, Math.min(5, box + (d.v === 'easy' ? 2 : 1)));
    reviewed++;
    flipped = false;
  },
  'card-side': (d) => { store.setSetting('cardSide', d.v); flipped = false; },
  'card-deck': (d) => { if (decks.has(d.d)) decks.delete(d.d); else decks.add(d.d); build(); },
  'card-pick': (d) => { decks = new Set(REFERENCE.filter((s) => d.v === 'all' || s.track === d.v).map((s) => s.id)); build(); },
  'card-restart': () => { build(); },
  'card-reset': () => {
    if (!window.confirm('Reset every flashcard back to box 1?')) return false;
    for (const c of CARDS) store.setCard(c.id, 1);
    build();
  }
};
