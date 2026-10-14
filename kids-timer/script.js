'use strict';

/* =====================================================================
   TIME BUDDY: a kid-friendly timer
   Sections:
     1. Settings you can change
     2. State (what the app remembers)
     3. Helper functions
     4. Timer engine (start, pause, reset, tick)
     5. Drawing the screen (render)
     6. Sound, voice and confetti
     7. Buttons and events
     8. Start-up
   ===================================================================== */


/* ---------- 1. Settings you can change ---------- */

const $ = (id) => document.getElementById(id);   // short way to find an element
const MIN = 60000;                               // one minute in milliseconds
const RING_LENGTH = 2 * Math.PI * 96;            // must match the SVG circle (r = 96)
const STORAGE_KEY = 'time-buddy-v1';

// Add your own activities here! emoji + name + minutes
const ACTIVITIES = [
  { emoji: '🪥', name: 'Brush teeth', minutes: 2 },
  { emoji: '📚', name: 'Reading',     minutes: 15 },
  { emoji: '✏️', name: 'Homework',    minutes: 20 },
  { emoji: '🧹', name: 'Tidy up',     minutes: 5 },
  { emoji: '🎮', name: 'Play time',   minutes: 10 },
  { emoji: '🍎', name: 'Snack',       minutes: 10 },
];

// Which plus/minus rows each mode shows, and their limits
const SETTING_DEFS = {
  countdown: [{ key: 'minutes', label: 'Minutes', min: 1, max: 120, unit: 'min' }],
  focus: [
    { key: 'focus',  label: 'Focus',  min: 1, max: 60, unit: 'min' },
    { key: 'break',  label: 'Break',  min: 1, max: 30, unit: 'min' },
    { key: 'rounds', label: 'Rounds', min: 1, max: 8,  unit: '' },
  ],
  stopwatch: [],
};


/* ---------- 2. State ---------- */

const state = {
  mode: 'countdown',     // 'countdown' | 'focus' | 'stopwatch'
  status: 'idle',        // 'idle' | 'running' | 'paused' | 'done'
  phase: 'focus',        // focus mode only: 'focus' or 'break'
  round: 1,              // focus mode only: which round we are in
  activity: null,        // name of the chosen activity, if any
  totalMs: 0,            // length of the current countdown
  remainingMs: 0,        // time left
  elapsedMs: 0,          // stopwatch time
  endTime: 0,            // clock time when the countdown reaches zero
  startStamp: 0,         // clock time the stopwatch started
  settings: {
    countdown: { minutes: 5 },
    focus: { focus: 15, break: 5, rounds: 2 },
  },
  sound: true,
  stars: 0,
};

let timerId = null;

// Saved settings and stars (localStorage keeps them in this browser)
function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (saved.settings) {
      Object.assign(state.settings.countdown, saved.settings.countdown);
      Object.assign(state.settings.focus, saved.settings.focus);
    }
    if (typeof saved.sound === 'boolean') state.sound = saved.sound;
    if (Number.isInteger(saved.stars)) state.stars = saved.stars;
  } catch (err) { /* if storage is blocked, we just use the defaults */ }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      settings: state.settings, sound: state.sound, stars: state.stars,
    }));
  } catch (err) { /* ignore */ }
}


/* ---------- 3. Helper functions ---------- */

function pad(n) { return String(n).padStart(2, '0'); }

// Turns milliseconds into text like 04:07
function format(ms, roundUp) {
  const totalSec = roundUp ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
  return pad(Math.floor(totalSec / 60)) + ':' + pad(totalSec % 60);
}

// How long is the current countdown phase?
function phaseLength() {
  const s = state.settings;
  if (state.mode === 'countdown') return s.countdown.minutes * MIN;
  if (state.mode === 'focus') return (state.phase === 'focus' ? s.focus.focus : s.focus.break) * MIN;
  return 0;
}

// Keeps the screen awake while the timer runs (where the browser allows it)
let wakeLock = null;
async function holdScreen() {
  try {
    if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
  } catch (err) { /* not supported, no problem */ }
}
function releaseScreen() {
  try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (err) { /* ignore */ }
}


/* ---------- 4. Timer engine ---------- */

// Put the timer back to its starting position
function prepare() {
  state.status = 'idle';
  state.phase = 'focus';
  state.round = 1;
  state.elapsedMs = 0;
  state.totalMs = phaseLength();
  state.remainingMs = state.totalMs;
  render();
}

function start() {
  unlockAudio();
  if (state.status === 'done') prepare();       // "Start again"
  const now = Date.now();
  if (state.mode === 'stopwatch') state.startStamp = now - state.elapsedMs;
  else state.endTime = now + state.remainingMs;  // compare to the real clock = accurate
  state.status = 'running';
  clearInterval(timerId);
  timerId = setInterval(tick, 100);
  holdScreen();
  render();
}

function pause() {
  clearInterval(timerId);
  releaseScreen();
  state.status = 'paused';
  render();
}

function reset() {
  clearInterval(timerId);
  releaseScreen();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  prepare();
}

// Runs 10 times a second while the timer is running
function tick() {
  const now = Date.now();
  if (state.mode === 'stopwatch') {
    state.elapsedMs = now - state.startStamp;
  } else {
    state.remainingMs = Math.max(0, state.endTime - now);
    if (state.remainingMs === 0) { phaseDone(); return; }
  }
  render();
}

// A countdown reached zero. What happens next depends on the mode.
function phaseDone() {
  if (state.mode === 'focus') {
    const rounds = state.settings.focus.rounds;
    if (state.phase === 'focus' && state.round < rounds) { switchPhase('break'); return; }
    if (state.phase === 'break') { state.round++; switchPhase('focus'); return; }
  }
  finishAll();
}

function switchPhase(next) {
  state.phase = next;
  state.totalMs = phaseLength();
  state.remainingMs = state.totalMs;
  state.endTime = Date.now() + state.totalMs;
  playNotes(CHIME);
  say(next === 'break' ? 'Break time!' : 'Back to focus!');
  render();
}

function finishAll() {
  clearInterval(timerId);
  timerId = null;
  releaseScreen();
  state.status = 'done';
  state.remainingMs = 0;
  state.stars++;
  save();
  render();
  celebrate();
}


/* ---------- 5. Drawing the screen ---------- */

// Decides the mascot's mood, the ring color and the message
function describe() {
  const s = state;
  if (s.status === 'idle') {
    return { mood: 'happy', zone: 'idle',
      text: s.mode === 'stopwatch' ? 'Press start to count up!' : 'Pick a time, then press start!' };
  }
  if (s.status === 'done') {
    return { mood: 'party', zone: 'done', text: 'Amazing job! You earned a star!' };
  }
  if (s.status === 'paused') {
    return { mood: 'sleepy', zone: 'paused', text: 'Paused. Take a deep breath!' };
  }
  // running
  if (s.mode === 'stopwatch') return { mood: 'cheer', zone: 'ok', text: 'Go, go, go!' };
  if (s.mode === 'focus' && s.phase === 'break') {
    return { mood: 'sleepy', zone: 'break', text: 'Break time! Stretch and sip some water.' };
  }
  const left = s.remainingMs / s.totalMs;       // 1 = full, 0 = empty
  if (left > 0.5)  return { mood: 'happy', zone: 'ok',    text: "You've got this!" };
  if (left > 0.25) return { mood: 'cheer', zone: 'ok',    text: "Keep going, you're doing great!" };
  if (left > 0.1)  return { mood: 'cheer', zone: 'warn',  text: 'Almost there!' };
  return                  { mood: 'cheer', zone: 'alert', text: 'Final stretch!' };
}

function ringLabel() {
  if (state.mode === 'stopwatch') return 'Stopwatch';
  if (state.mode === 'focus') {
    return state.phase === 'break' ? 'Break' : `Focus ${state.round} of ${state.settings.focus.rounds}`;
  }
  return state.activity || 'Countdown';
}

// Only change text when it is different (so screen readers are not spammed)
function setText(el, text) { if (el.textContent !== text) el.textContent = text; }

function render() {
  const s = state;
  const info = describe();
  const locked = s.status === 'running' || s.status === 'paused';

  // Time text and ring fill
  let text, progress;
  if (s.mode === 'stopwatch') {
    text = format(s.elapsedMs, false);
    progress = (s.elapsedMs % MIN) / MIN;        // ring fills once per minute
  } else {
    text = format(s.remainingMs, true);
    progress = s.totalMs ? s.remainingMs / s.totalMs : 0;   // ring empties
  }
  setText($('display'), text);
  $('ring').style.strokeDashoffset = RING_LENGTH * (1 - progress);
  setText($('ringLabel'), ringLabel());
  $('stage').dataset.zone = info.zone;
  $('buddy').dataset.mood = info.mood;
  setText($('bubble'), info.text);
  document.title = s.status === 'running' ? text + ' - Time Buddy' : 'Time Buddy';

  renderDots();

  // Buttons
  setText($('startBtn'), { idle: 'Start', running: 'Pause', paused: 'Resume', done: 'Start again' }[s.status]);
  $('startBtn').dataset.state = s.status;
  $('resetBtn').disabled = s.status === 'idle';

  // Tabs, activities and plus/minus buttons are locked while the timer is active
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.setAttribute('aria-selected', String(tab.dataset.mode === s.mode));
    tab.disabled = locked;
  });
  $('activities').hidden = s.mode !== 'countdown';
  document.querySelectorAll('.activity').forEach((btn, i) => {
    btn.setAttribute('aria-pressed', String(s.activity === ACTIVITIES[i].name));
    btn.disabled = locked;
  });
  document.querySelectorAll('.step-btn').forEach((btn) => { btn.disabled = locked; });
  SETTING_DEFS[s.mode].forEach((def) => {
    const out = document.querySelector(`[data-value="${def.key}"]`);
    const value = s.settings[s.mode][def.key];
    if (out) setText(out, def.unit ? `${value} ${def.unit}` : String(value));
  });

  // Sound switch and star counter
  const soundBtn = $('soundBtn');
  soundBtn.setAttribute('aria-pressed', String(s.sound));
  setText(soundBtn, s.sound ? '🔊 Sound on' : '🔇 Sound off');
  setText($('starCount'), String(s.stars));
}

// Round dots for focus mode: filled = finished, outlined = current
function renderDots() {
  const box = $('dots');
  if (state.mode !== 'focus') {
    if (box.innerHTML) box.innerHTML = '';
    return;
  }
  const rounds = state.settings.focus.rounds;
  let html = '';
  for (let i = 1; i <= rounds; i++) {
    const finished = state.status === 'done' || i < state.round || (i === state.round && state.phase === 'break');
    const current = i === state.round && state.status !== 'idle' && !finished;
    html += `<span class="dot ${finished ? 'done' : current ? 'current' : ''}"></span>`;
  }
  if (box.innerHTML !== html) box.innerHTML = html;
}

// Builds the activity buttons (once)
function buildActivities() {
  const box = $('activities');
  ACTIVITIES.forEach((a, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'activity';
    btn.dataset.index = i;
    btn.innerHTML =
      `<span class="emoji" aria-hidden="true">${a.emoji}</span>` +
      `<span class="name">${a.name}</span>` +
      `<span class="mins">${a.minutes} min</span>`;
    box.appendChild(btn);
  });
}

// Builds the plus/minus rows for the current mode
function buildSettings() {
  const box = $('settings');
  box.innerHTML = '';
  const defs = SETTING_DEFS[state.mode];
  defs.forEach((def) => {
    const row = document.createElement('div');
    row.className = 'stepper';
    row.innerHTML =
      `<span class="step-label">${def.label}</span>` +
      `<button type="button" class="step-btn" data-key="${def.key}" data-dir="-1" aria-label="Less ${def.label}">−</button>` +
      `<output class="step-value" data-value="${def.key}"></output>` +
      `<button type="button" class="step-btn" data-key="${def.key}" data-dir="1" aria-label="More ${def.label}">+</button>`;
    box.appendChild(row);
  });
  box.hidden = defs.length === 0;
}


/* ---------- 6. Sound, voice and confetti ---------- */

let audioCtx = null;

// Browsers only allow sound after a click, so we "unlock" it on Start
function unlockAudio() {
  if (!state.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (err) { /* no audio available */ }
}

// Each note is [pitch in Hz, start time in seconds, length in seconds]
const CHIME   = [[659.25, 0, 0.25], [880, 0.2, 0.4]];
const FANFARE = [[523.25, 0, 0.2], [659.25, 0.18, 0.2], [783.99, 0.36, 0.2], [1046.5, 0.54, 0.7]];

function playNotes(notes) {
  if (!state.sound || !audioCtx) return;
  const t0 = audioCtx.currentTime + 0.05;
  notes.forEach(([freq, start, len]) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, t0 + start);
    gain.gain.exponentialRampToValueAtTime(0.25, t0 + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + len);
    osc.start(t0 + start);
    osc.stop(t0 + start + len + 0.05);
  });
}

// The browser reads a message out loud
function say(message) {
  if (!state.sound || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(message);
    u.rate = 0.95;
    u.pitch = 1.15;
    speechSynthesis.speak(u);
  } catch (err) { /* ignore */ }
}

function celebrate() {
  playNotes(FANFARE);
  say(state.mode === 'focus' ? 'All done! Great job!' : 'Time is up! Great job!');
  launchConfetti();
  const stars = $('stars');
  stars.classList.remove('bump');
  void stars.offsetWidth;            // restart the animation
  stars.classList.add('bump');
}

const canvas = $('confetti');
const ctx = canvas.getContext('2d');
let pieces = [];
let confettiRunning = false;

function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#2f6fbf', '#1fa896', '#f0a32f', '#e8575a', '#6f63d9'];
  for (let i = 0; i < 140; i++) {
    pieces.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
      y: window.innerHeight * 0.35,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 12 - 4,
      size: 6 + Math.random() * 6,
      color: colors[i % colors.length],
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.4,
      life: 0,
    });
  }
  if (!confettiRunning) { confettiRunning = true; requestAnimationFrame(drawConfetti); }
}

function drawConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pieces.forEach((p) => {
    p.vy += 0.35;            // gravity
    p.vx *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life++;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  });
  pieces = pieces.filter((p) => p.y < canvas.height + 20 && p.life < 240);
  if (pieces.length) {
    requestAnimationFrame(drawConfetti);
  } else {
    confettiRunning = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}


/* ---------- 7. Buttons and events ---------- */

function setMode(mode) {
  state.mode = mode;
  buildSettings();
  prepare();
}

function chooseActivity(activity) {
  state.settings.countdown.minutes = activity.minutes;
  state.activity = activity.name;
  save();
  prepare();
}

function step(key, direction) {
  const def = SETTING_DEFS[state.mode].find((d) => d.key === key);
  const current = state.settings[state.mode][key];
  state.settings[state.mode][key] = Math.min(def.max, Math.max(def.min, current + direction));
  if (state.mode === 'countdown') state.activity = null;   // custom time, so no activity name
  save();
  prepare();
}

$('startBtn').addEventListener('click', () => (state.status === 'running' ? pause() : start()));
$('resetBtn').addEventListener('click', reset);

$('tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if (tab && !tab.disabled) setMode(tab.dataset.mode);
});

$('activities').addEventListener('click', (e) => {
  const btn = e.target.closest('.activity');
  if (btn && !btn.disabled) chooseActivity(ACTIVITIES[btn.dataset.index]);
});

$('settings').addEventListener('click', (e) => {
  const btn = e.target.closest('.step-btn');
  if (btn && !btn.disabled) step(btn.dataset.key, Number(btn.dataset.dir));
});

$('soundBtn').addEventListener('click', () => {
  state.sound = !state.sound;
  save();
  if (state.sound) { unlockAudio(); playNotes(CHIME); }
  else if ('speechSynthesis' in window) speechSynthesis.cancel();
  render();
});

// Space bar starts or pauses (only when no button or field is focused)
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault();
    $('startBtn').click();
  }
});

// When you come back to the tab, update the display right away and re-hold the screen
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.status === 'running') {
    holdScreen();
    tick();
  }
});


/* ---------- 8. Start-up ---------- */

loadSaved();
buildActivities();
buildSettings();
prepare();
