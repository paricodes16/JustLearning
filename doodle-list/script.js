'use strict';

/* =====================================================================
   DOODLE LIST: a creative, mobile-first to-do app
   Sections:
     1. Settings you can change
     2. Data (tasks, saving, loading)
     3. Helpers
     4. Drawing the screen
     5. Task actions (add, finish, delete)
     6. Swipe gestures
     7. The add/edit sheet
     8. Focus mode
     9. Toast, sparkles, vibration
    10. Events and start-up
   ===================================================================== */


/* ---------- 1. Settings you can change ---------- */

const $ = (selector) => document.querySelector(selector);
const STORAGE_KEY = 'doodle-list-v1';
const RING_LENGTH = 2 * Math.PI * 26;      // matches the small progress ring (r = 26)
const SWIPE_DISTANCE = 90;                 // how far to drag before a swipe counts (pixels)
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const COLORS = ['coral', 'amber', 'mint', 'sky', 'violet', 'pink'];
const SPARK_COLORS = ['#ef6f6c', '#f2a93b', '#35b598', '#4a9be6', '#8c7bf0', '#e868a8'];
const EMOJIS = ['✏️', '🛒', '📞', '📚', '🧹', '💪', '🍳', '💧', '🎨', '💌', '🐶', '🌱', '💡', '💳', '🩺', '💻'];

// Typing one of these words picks an icon for you. Add your own!
const KEYWORDS = [
  [/\b(buy|shop\w*|grocer\w*|store|market)\b/i, '🛒'],
  [/\b(call|phone|text|ring)\b/i, '📞'],
  [/\b(read\w*|book|study|homework|learn\w*)\b/i, '📚'],
  [/\b(clean\w*|tidy|laundry|wash\w*|vacuum)\b/i, '🧹'],
  [/\b(gym|run|workout|exercise|walk|yoga|swim)\b/i, '💪'],
  [/\b(cook\w*|dinner|lunch|breakfast|meal|bake)\b/i, '🍳'],
  [/\b(water|drink|hydrate)\b/i, '💧'],
  [/\b(draw\w*|paint\w*|art|design|sketch)\b/i, '🎨'],
  [/\b(mail|email|write|letter|message)\b/i, '💌'],
  [/\b(dog|pet|cat|feed|vet)\b/i, '🐶'],
  [/\b(plant\w*|garden\w*|flowers?)\b/i, '🌱'],
  [/\b(idea|plan|think|brainstorm)\b/i, '💡'],
  [/\b(pay|bill|rent|bank|tax\w*)\b/i, '💳'],
  [/\b(doctor|dentist|medic\w*|pharmacy)\b/i, '🩺'],
  [/\b(code|coding|build|app|github)\b/i, '💻'],
];


/* ---------- 2. Data ---------- */

// Each task looks like: { id, title, emoji, color, when, done, doneAt }
let data = { tasks: [], days: [], hintSeen: false };
let view = 'today';   // 'today' | 'later' | 'done'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      data = Object.assign(data, parsed);
      return;
    }
  } catch (err) { /* storage blocked: start fresh */ }
  // First visit: add a few example tasks so the app doesn't feel empty
  data.tasks = [
    makeTask('Tap + to add your own task', '➕', 'violet', 'today'),
    makeTask('Swipe me right to finish me', '👉', 'mint', 'today'),
    makeTask('Tap the circle to finish me', '⭕', 'amber', 'today'),
  ];
  save();
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (err) { /* ignore */ }
}


/* ---------- 3. Helpers ---------- */

function makeTask(title, emoji, color, when) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title, emoji, color, when, done: false, doneAt: null,
  };
}

function findTask(id) { return data.tasks.find((t) => t.id === id); }

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function suggestEmoji(title) {
  const match = KEYWORDS.find(([pattern]) => pattern.test(title));
  return match ? match[1] : '✏️';
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayKey(timestamp) {
  const d = new Date(timestamp);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Counts for today's progress ring
function todayStats() {
  const start = startOfToday();
  const open = data.tasks.filter((t) => !t.done && t.when === 'today').length;
  const done = data.tasks.filter((t) => t.done && t.doneAt >= start).length;
  return { open, done, total: open + done };
}

// How many days in a row you finished at least one task
function streak() {
  const days = new Set(data.days);
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);   // today not finished yet? start from yesterday
  let count = 0;
  while (days.has(dayKey(d))) { count++; d.setDate(d.getDate() - 1); }
  return count;
}

function visibleTasks() {
  if (view === 'done') return data.tasks.filter((t) => t.done).sort((a, b) => b.doneAt - a.doneAt);
  return data.tasks.filter((t) => !t.done && t.when === view);
}


/* ---------- 4. Drawing the screen ---------- */

const CHECK_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>';

function render() {
  renderHeader();
  renderList();
  renderNav();
}

function renderHeader() {
  const stats = todayStats();
  const frac = stats.total ? stats.done / stats.total : 0;

  $('#viewTitle').textContent = { today: 'Today', later: 'Later', done: 'Done' }[view];
  $('#dateText').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  $('#ringFg').style.strokeDashoffset = RING_LENGTH * (1 - frac);
  $('#ringText').textContent = stats.total ? `${stats.done}/${stats.total}` : '0';

  let message;
  if (stats.total === 0) message = 'A fresh start. What is first?';
  else if (stats.open === 0) message = 'All done for today! 🎉';
  else if (frac >= 0.5) message = 'Over halfway, keep going!';
  else if (stats.done > 0) message = 'Nice start!';
  else message = 'One thing at a time.';
  $('#message').textContent = message;

  const days = streak();
  $('#streak').hidden = days === 0;
  $('#streak').textContent = `🔥 ${days} day streak`;

  $('#focusBtn').hidden = !(view === 'today' && stats.open > 0);
  $('#clearBtn').hidden = !(view === 'done' && data.tasks.some((t) => t.done));
}

function renderList() {
  const tasks = visibleTasks();
  const rightLabel = view === 'done' ? '↩ Restore' : '✓ Done';

  $('#list').innerHTML = tasks.map((t) => {
    const meta = t.done
      ? 'Done ' + new Date(t.doneAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      : '';
    return `
      <li class="swipe" data-id="${t.id}">
        <div class="swipe-bg"><span class="bg-right">${rightLabel}</span><span class="bg-left">🗑 Delete</span></div>
        <div class="card ${t.done ? 'is-done' : ''}" data-color="${t.color}" tabindex="0" role="button" aria-label="Edit task: ${escapeHtml(t.title)}">
          <span class="bubble" aria-hidden="true">${escapeHtml(t.emoji)}</span>
          <span class="card-body">
            <span class="card-title">${escapeHtml(t.title)}</span>
            ${meta ? `<span class="card-meta">${meta}</span>` : ''}
          </span>
          <button type="button" class="check" aria-pressed="${t.done}" aria-label="${t.done ? 'Mark as not done' : 'Mark as done'}"><span>${CHECK_SVG}</span></button>
        </div>
      </li>`;
  }).join('');

  // Friendly message when the list is empty
  const stats = todayStats();
  const empty = {
    today: stats.total > 0 && stats.open === 0
      ? ['🎉', 'All done for today!', 'Add something new, or enjoy a break.']
      : ['🌤️', 'Nothing planned yet', 'Tap the + button to add your first task.'],
    later: ['🗓️', 'Nothing waiting', 'Park ideas here for another day.'],
    done: ['🏆', 'No finished tasks yet', 'Finish a task and it will show up here.'],
  }[view];
  $('#empty').hidden = tasks.length > 0;
  $('#emptyEmoji').textContent = empty[0];
  $('#emptyTitle').textContent = empty[1];
  $('#emptyText').textContent = empty[2];

  $('#hint').hidden = data.hintSeen || tasks.length === 0 || view === 'done';
}

function renderNav() {
  document.querySelectorAll('.nav button').forEach((btn) => {
    if (btn.dataset.view === view) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
  const open = (when) => data.tasks.filter((t) => !t.done && t.when === when).length;
  $('#countToday').textContent = open('today') || '';
  $('#countLater').textContent = open('later') || '';
  $('#countDone').textContent = data.tasks.filter((t) => t.done).length || '';
}

function setView(next) {
  view = next;
  $('#main').scrollTop = 0;
  render();
}


/* ---------- 5. Task actions ---------- */

function markHintSeen() { data.hintSeen = true; }

function toggleTask(id, sourceEl) {
  const task = findTask(id);
  if (!task) return;

  const before = { done: task.done, doneAt: task.doneAt };
  const rect = sourceEl ? sourceEl.getBoundingClientRect() : null;
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

  task.done = !task.done;
  task.doneAt = task.done ? Date.now() : null;

  let message = 'Moved back to your list';
  if (task.done) {
    const key = dayKey(task.doneAt);
    if (!data.days.includes(key)) data.days.push(key);
    sparkle(x, y);
    vibrate(12);
    const stats = todayStats();
    message = stats.open === 0 && stats.total > 0 ? 'All done for today! 🎉' : 'Nice work! ✨';
  }

  markHintSeen();
  save();
  render();
  showToast(message, () => {
    task.done = before.done;
    task.doneAt = before.doneAt;
    save();
    render();
  });
}

function removeTask(id) {
  const index = data.tasks.findIndex((t) => t.id === id);
  if (index < 0) return;
  const [task] = data.tasks.splice(index, 1);
  markHintSeen();
  save();
  render();
  vibrate(15);
  showToast('Task deleted', () => {
    data.tasks.splice(Math.min(index, data.tasks.length), 0, task);
    save();
    render();
  });
}

function clearDone() {
  const count = data.tasks.filter((t) => t.done).length;
  if (!count || !window.confirm(`Remove ${count} finished task${count === 1 ? '' : 's'}?`)) return;
  data.tasks = data.tasks.filter((t) => !t.done);
  save();
  render();
}


/* ---------- 6. Swipe gestures ---------- */

const list = $('#list');
let drag = null;
let suppressClick = false;

list.addEventListener('pointerdown', (e) => {
  const card = e.target.closest('.card');
  if (!card || e.target.closest('.check')) return;
  drag = { card, row: card.parentElement, id: card.parentElement.dataset.id, startX: e.clientX, dx: 0, moved: false, pointerId: e.pointerId };
});

list.addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.pointerId) return;
  drag.dx = e.clientX - drag.startX;
  if (!drag.moved && Math.abs(drag.dx) > 8) {
    drag.moved = true;
    drag.card.classList.add('dragging');
    try { drag.card.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  }
  if (drag.moved) {
    drag.card.style.transform = `translateX(${drag.dx}px)`;
    drag.row.dataset.dir = drag.dx > 0 ? 'right' : 'left';
  }
});

function endDrag(cancelled) {
  if (!drag) return;
  const { card, row, id, dx, moved } = drag;
  drag = null;
  if (!moved) return;

  suppressClick = true;                         // a swipe should not also count as a tap
  setTimeout(() => { suppressClick = false; }, 60);
  card.classList.remove('dragging');

  const farEnough = Math.abs(dx) > SWIPE_DISTANCE && !cancelled;
  if (!farEnough) {
    card.style.transform = '';
    delete row.dataset.dir;
    return;
  }

  // Slide off the screen, then do the action
  card.style.transform = `translateX(${dx > 0 ? '110%' : '-110%'})`;
  card.style.opacity = '0';
  setTimeout(() => {
    if (dx > 0) toggleTask(id, card);
    else removeTask(id);
  }, REDUCED_MOTION ? 0 : 180);
}

list.addEventListener('pointerup', () => endDrag(false));
list.addEventListener('pointercancel', () => endDrag(true));

// Taps: the circle finishes a task, the rest of the card opens the editor
list.addEventListener('click', (e) => {
  if (suppressClick) return;
  const row = e.target.closest('.swipe');
  if (!row) return;
  const check = e.target.closest('.check');
  if (check) toggleTask(row.dataset.id, check);
  else openSheet(row.dataset.id);
});

list.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')) {
    e.preventDefault();
    openSheet(e.target.parentElement.dataset.id);
  }
});


/* ---------- 7. The add/edit sheet ---------- */

let sheet = { editId: null, emoji: '✏️', emojiTouched: false, color: 'coral', when: 'today' };

function buildSheetOptions() {
  $('#emojiRow').innerHTML = EMOJIS.map((e) => `<button type="button" data-emoji="${e}" aria-label="Icon ${e}">${e}</button>`).join('');
  $('#colorRow').innerHTML = COLORS.map((c) => `<button type="button" data-color="${c}" aria-label="${c}"></button>`).join('');
}

function syncSheet() {
  $('#preview').textContent = sheet.emoji;
  $('#preview').dataset.color = sheet.color;
  document.querySelectorAll('#emojiRow button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.emoji === sheet.emoji)));
  document.querySelectorAll('#colorRow button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color === sheet.color)));
  document.querySelectorAll('#whenRow button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.when === sheet.when)));
}

function openSheet(id) {
  const task = id ? findTask(id) : null;
  sheet = {
    editId: task ? task.id : null,
    emoji: task ? task.emoji : '✏️',
    emojiTouched: Boolean(task),
    color: task ? task.color : COLORS[data.tasks.length % COLORS.length],   // new tasks get the next color
    when: task ? task.when : (view === 'later' ? 'later' : 'today'),
  };
  $('#titleInput').value = task ? task.title : '';
  $('#sheetHeading').textContent = task ? 'Edit task' : 'New task';
  $('#saveBtn').textContent = task ? 'Save' : 'Add task';
  $('#deleteBtn').hidden = !task;
  syncSheet();
  $('#sheet').classList.add('open');
  $('#sheet').setAttribute('aria-hidden', 'false');
  setTimeout(() => $('#titleInput').focus(), 280);
}

function closeSheet() {
  $('#sheet').classList.remove('open');
  $('#sheet').setAttribute('aria-hidden', 'true');
  $('#titleInput').blur();
}

$('#titleInput').addEventListener('input', () => {
  if (!sheet.emojiTouched) {                      // auto-pick an icon until you choose one yourself
    sheet.emoji = suggestEmoji($('#titleInput').value);
    syncSheet();
  }
});

$('#emojiRow').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  sheet.emoji = btn.dataset.emoji;
  sheet.emojiTouched = true;
  syncSheet();
});

$('#colorRow').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  sheet.color = btn.dataset.color;
  syncSheet();
});

$('#whenRow').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  sheet.when = btn.dataset.when;
  syncSheet();
});

$('#sheetForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = $('#titleInput').value.trim();
  if (!title) {                                   // nothing typed: shake the box
    const input = $('#titleInput');
    input.classList.remove('shake');
    void input.offsetWidth;
    input.classList.add('shake');
    input.focus();
    return;
  }

  if (sheet.editId) {
    const task = findTask(sheet.editId);
    Object.assign(task, { title, emoji: sheet.emoji, color: sheet.color, when: sheet.when });
  } else {
    const task = makeTask(title, sheet.emoji, sheet.color, sheet.when);
    data.tasks.unshift(task);                     // newest on top
    if (sheet.when !== view && view !== 'done') view = sheet.when;   // jump to where the new task lives
  }
  save();
  closeSheet();
  render();
  vibrate(10);
});

$('#deleteBtn').addEventListener('click', () => {
  const id = sheet.editId;
  closeSheet();
  if (id) removeTask(id);
});

$('#sheetBackdrop').addEventListener('click', closeSheet);


/* ---------- 8. Focus mode ---------- */

function firstOpenToday() { return data.tasks.find((t) => !t.done && t.when === 'today'); }

function openFocus() {
  if (!firstOpenToday()) return;
  renderFocus();
  $('#focus').classList.add('open');
  $('#focus').setAttribute('aria-hidden', 'false');
}

function closeFocus() {
  $('#focus').classList.remove('open');
  $('#focus').setAttribute('aria-hidden', 'true');
}

function renderFocus() {
  const task = firstOpenToday();
  if (!task) { closeFocus(); return; }
  const open = data.tasks.filter((t) => !t.done && t.when === 'today').length;
  $('#focusBubble').textContent = task.emoji;
  $('#focusBubble').dataset.color = task.color;
  $('#focusTitle').textContent = task.title;
  $('#focusLeft').textContent = open === 1 ? 'This is your last one!' : `${open - 1} more after this`;
  $('#focusSkip').hidden = open < 2;
}

$('#focusBtn').addEventListener('click', openFocus);
$('#focusClose').addEventListener('click', closeFocus);

$('#focusDone').addEventListener('click', () => {
  const task = firstOpenToday();
  if (!task) return;
  toggleTask(task.id, $('#focusBubble'));
  renderFocus();
});

$('#focusSkip').addEventListener('click', () => {
  const task = firstOpenToday();
  if (!task) return;
  data.tasks = data.tasks.filter((t) => t !== task).concat(task);   // send it to the back of the line
  save();
  render();
  renderFocus();
});


/* ---------- 9. Toast, sparkles, vibration ---------- */

let toastTimer = null;
let undoAction = null;

function showToast(message, undo) {
  clearTimeout(toastTimer);
  undoAction = undo || null;
  $('#toastMsg').textContent = message;
  $('#undoBtn').hidden = !undo;
  $('#toast').classList.add('show');
  toastTimer = setTimeout(hideToast, 4000);
}

function hideToast() { $('#toast').classList.remove('show'); }

$('#undoBtn').addEventListener('click', () => {
  if (undoAction) undoAction();
  undoAction = null;
  hideToast();
});

// A little burst of colored dots
function sparkle(x, y) {
  if (REDUCED_MOTION) return;
  const count = 14;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distance = 50 + Math.random() * 60;
    dot.className = 'spark';
    dot.style.cssText =
      `left:${x}px;top:${y}px;background:${SPARK_COLORS[i % SPARK_COLORS.length]};` +
      `--dx:${Math.cos(angle) * distance}px;--dy:${Math.sin(angle) * distance}px`;
    document.body.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  }
}

// A tiny buzz on phones that support it
function vibrate(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
}


/* ---------- 10. Events and start-up ---------- */

$('#fab').addEventListener('click', () => openSheet(null));
$('#clearBtn').addEventListener('click', clearDone);
$('#nav').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (btn) setView(btn.dataset.view);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeSheet(); closeFocus(); }
});

// Refresh when you come back to the app (a new day may have started)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') render();
});

// Works offline and can be installed on a phone (see sw.js and manifest.json)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

load();
buildSheetOptions();
render();
