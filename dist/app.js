import { DURATIONS, formatTime, nextMode, progressFor } from './timer-core.js';
import { supportedLanguages, translate } from './i18n.js';

const quotes = [
  ['The secret of getting ahead is getting started.', 'Mark Twain'],
  ['Great things are done by a series of small things brought together.', 'Vincent van Gogh'],
  ['The future depends on what you do today.', 'Mahatma Gandhi'],
  ['Do the work. Let the results speak.', 'Focus'],
  ['A little progress each day adds up to big results.', 'Unknown']
];

const state = {
  mode: 'focus', remaining: DURATIONS.focus, running: false, endAt: null,
  focusCompleted: 0, interruptions: 0, locked: false, quoteIndex: 0, language: 'en'
};

let tickId;
const $ = (selector) => document.querySelector(selector);
const elements = {
  mode: $('#mode'), time: $('#time'), start: $('#start'), reset: $('#reset'), skip: $('#skip'),
  ring: $('#progress-ring'), count: $('#count'), quote: $('#quote'), author: $('#author'),
  notice: $('#notice'), lock: $('#lock'), returnDialog: $('#return-dialog'),
  returnCopy: $('#return-copy'), returnBtn: $('#return-btn'), visibility: $('#visibility-status'),
  chips: [...document.querySelectorAll('.mode-chip')], languages: [...document.querySelectorAll('[data-language]')]
};
const t = (key) => translate(state.language, key);

function persist() {
  localStorage.setItem('pomodoro-focus-state', JSON.stringify({ ...state, running: false, endAt: null }));
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem('pomodoro-focus-state'));
    if (saved && DURATIONS[saved.mode]) Object.assign(state, saved, { running: false, endAt: null, language: supportedLanguages.includes(saved.language) ? saved.language : 'en' });
  } catch { /* Start fresh when storage is malformed. */ }
}

function copyFor(mode) { return t(mode); }

function applyLanguage() {
  document.documentElement.lang = state.language;
  $('#brand-text').textContent = t('brand'); $('#eyebrow').textContent = t('eyebrow');
  $('#hero-title').innerHTML = t('title'); $('#intro').textContent = t('intro');
  $('#reset').textContent = t('reset'); $('#skip').textContent = t('skip');
  $('#return-eyebrow').textContent = t('backEyebrow'); $('#return-title').textContent = t('backTitle'); $('#return-btn').textContent = t('back');
  elements.chips.forEach((chip) => chip.querySelector('span').textContent = copyFor(chip.dataset.mode));
  elements.languages.forEach((button) => button.classList.toggle('active', button.dataset.language === state.language));
}

function render() {
  const duration = DURATIONS[state.mode];
  const progress = progressFor(state.remaining, duration);
  elements.mode.textContent = copyFor(state.mode);
  elements.time.textContent = formatTime(state.remaining);
  document.title = `${formatTime(state.remaining)} · Pomodoro Focus`;
  elements.ring.style.setProperty('--progress', progress);
  elements.start.textContent = state.running ? t('pause') : t('start');
  elements.count.textContent = `${state.focusCompleted} ${state.focusCompleted === 1 ? t('session') : t('sessions')}`;
  elements.lock.textContent = t('lock'); elements.lock.classList.toggle('active', state.running && state.mode === 'focus');
  elements.visibility.textContent = state.running ? t('protected') : t('ready');
  elements.chips.forEach((chip) => chip.classList.toggle('selected', chip.dataset.mode === state.mode));
}

function setQuote() {
  const [quote, author] = quotes[state.quoteIndex % quotes.length];
  elements.quote.textContent = `“${quote}”`;
  elements.author.textContent = `— ${author}`;
}

function showNotice(message) {
  elements.notice.textContent = message;
  elements.notice.classList.add('show');
  window.setTimeout(() => elements.notice.classList.remove('show'), 3500);
}

function stopClock() { window.clearInterval(tickId); tickId = undefined; }

function finishPhase() {
  stopClock();
  state.running = false;
  if (state.mode === 'focus') state.focusCompleted += 1;
  const completedMode = state.mode;
  state.mode = nextMode(completedMode, state.focusCompleted);
  state.remaining = DURATIONS[state.mode];
  state.quoteIndex += 1;
  setQuote(); render(); persist();
  showNotice(completedMode === 'focus' ? t('complete').replace('{mode}', copyFor(state.mode).toLowerCase()) : t('breakComplete'));
  if ('Notification' in window && Notification.permission === 'granted') new Notification('Pomodoro Focus', { body: 'Your timer is complete.' });
}

function updateClock() {
  state.remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
  if (state.remaining === 0) finishPhase();
  else render();
}

function start() {
  if (state.locked) return;
  if (!state.running) {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    state.running = true;
    state.endAt = Date.now() + state.remaining * 1000;
    tickId = window.setInterval(updateClock, 250);
  } else {
    state.running = false;
    state.endAt = null;
    stopClock();
  }
  render(); persist();
}

function chooseMode(mode) {
  if (state.running) { showNotice(t('change')); return; }
  state.mode = mode; state.remaining = DURATIONS[mode]; render(); persist();
}

function interrupt() {
  if (!state.running || state.mode !== 'focus' || state.locked) return;
  state.running = false; state.endAt = null; state.locked = true; state.interruptions += 1;
  stopClock(); render(); persist();
  elements.returnCopy.textContent = t('interrupted');
  elements.returnDialog.showModal();
}

elements.start.addEventListener('click', start);
elements.reset.addEventListener('click', () => { stopClock(); state.running = false; state.endAt = null; state.remaining = DURATIONS[state.mode]; render(); persist(); });
elements.skip.addEventListener('click', finishPhase);
elements.chips.forEach((chip) => chip.addEventListener('click', () => chooseMode(chip.dataset.mode)));
elements.returnBtn.addEventListener('click', () => { state.locked = false; elements.returnDialog.close(); render(); persist(); showNotice(t('welcome')); });
elements.languages.forEach((button) => button.addEventListener('click', () => { state.language = button.dataset.language; applyLanguage(); render(); persist(); }));
document.addEventListener('visibilitychange', () => { if (document.hidden) interrupt(); });
window.addEventListener('blur', () => window.setTimeout(() => { if (!document.hasFocus()) interrupt(); }, 100));

restore(); applyLanguage(); setQuote(); render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
