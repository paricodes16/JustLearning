'use strict';
/* Pac-Man: plain JavaScript + Canvas, no dependencies. */
const T = 20; // tile size in px
// # wall, . dot, o power pellet, - ghost door, G ghost house, P pac-man start
const MAP = [
  '###################',
  '#........#........#',
  '#o##.###.#.###.##o#',
  '#.................#',
  '#.##.#.#####.#.##.#',
  '#....#...#...#....#',
  '####.###.#.###.####',
  '####.#.......#.####',
  '####.#.##-##.#.####',
  ' ......#GGG#...... ',
  '####.#.#####.#.####',
  '####.#.......#.####',
  '####.#.#####.#.####',
  '#........#........#',
  '#.##.###.#.###.##.#',
  '#o.#.....P.....#.o#',
  '##.#.#.#####.#.#.##',
  '#....#...#...#....#',
  '#.######.#.######.#',
  '#.................#',
  '###################'
];
const W = MAP[0].length, H = MAP.length;
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
cv.width = W * T; cv.height = H * T;
const $ = id => document.getElementById(id);
const DIRS = [[0, -1], [-1, 0], [0, 1], [1, 0]];
const COLORS = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852']; // Blinky, Pinky, Inky, Clyde
const CORNERS = [{ x: 16, y: 0 }, { x: 2, y: 0 }, { x: 18, y: 20 }, { x: 0, y: 20 }];
const PHASES = [7, 20, 7, 20, 5, 20, 5, Infinity]; // scatter, chase, scatter, ...

let grid, dots, score, lives, level, state, stateT, pac, ghosts, want;
let frightT = 0, combo = 0, phase = 0, phaseT = 7, paused = false, clock = 0, best = 0;
try { best = +localStorage.getItem('pacman-best') || 0; } catch (e) {}

// ---------- pre-rendered maze walls ----------
const walls = document.createElement('canvas');
walls.width = cv.width; walls.height = cv.height;
(function () {
  const c = walls.getContext('2d');
  const isWall = (x, y) => x < 0 || y < 0 || x >= W || y >= H || MAP[y][x] === '#';
  const EDGES = [[0, -1, 0, 0, 1, 0], [1, 0, 1, 0, 1, 1], [0, 1, 0, 1, 1, 1], [-1, 0, 0, 0, 0, 1]];
  c.lineWidth = 3; c.lineCap = 'round';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = MAP[y][x];
    if (ch === '-') {
      c.strokeStyle = '#ffb8ff'; c.beginPath();
      c.moveTo(x * T, y * T + T / 2); c.lineTo((x + 1) * T, y * T + T / 2); c.stroke();
    } else if (ch === '#') {
      c.fillStyle = '#07072e'; c.fillRect(x * T, y * T, T, T);
      c.strokeStyle = '#2a3cff';
      for (const [dx, dy, a, b, e, d] of EDGES) if (!isWall(x + dx, y + dy)) {
        c.beginPath(); c.moveTo((x + a) * T, (y + b) * T); c.lineTo((x + e) * T, (y + d) * T); c.stroke();
      }
    }
  }
})();

// ---------- setup ----------
function setState(s) { state = s; stateT = 0; }
function newLevel() {
  grid = MAP.map(r => r.split('').map(c => (c === '.' || c === 'o') ? c : ' '));
  dots = grid.flat().filter(c => c !== ' ').length;
  resetActors();
}
function resetActors() {
  pac = { tx: 9, ty: 15, dx: 0, dy: 0, p: 0, face: Math.PI };
  want = [-1, 0];
  // [x, y, mode, release delay in seconds]
  const start = [[9, 7, 'normal', 0], [9, 9, 'exit', 2], [8, 9, 'exit', 5], [10, 9, 'exit', 8]];
  ghosts = start.map(([tx, ty, mode, wait], i) =>
    ({ i, tx, ty, mode, wait, dx: i ? 0 : -1, dy: 0, p: 0, fright: false }));
  frightT = 0; phase = 0; phaseT = PHASES[0];
  setState('ready');
}
function newGame() { score = 0; lives = 3; level = 1; combo = 0; newLevel(); }
function addScore(n) {
  if (Math.floor((score + n) / 10000) > Math.floor(score / 10000)) lives++;
  score += n;
  if (score > best) { best = score; try { localStorage.setItem('pacman-best', best); } catch (e) {} }
}

// ---------- movement ----------
function open(x, y, g) {
  x = (x + W) % W; // horizontal tunnel wraps around
  if (y < 0 || y >= H) return false;
  const c = MAP[y][x];
  if (c === '#') return false;
  if (c === '-') return !!g && (g.mode === 'exit' || g.mode === 'eyes');
  return true;
}
function move(e, dt, speed, pick, arrive) {
  let d = speed * dt;
  for (let n = 0; d > 0 && n < 8; n++) {
    if (!e.dx && !e.dy) { pick(e); if (!e.dx && !e.dy) return; }
    const rem = 1 - e.p;
    if (d < rem) { e.p += d; return; }
    d -= rem; e.p = 0;
    e.tx = (e.tx + e.dx + W) % W; e.ty += e.dy;
    arrive(e); pick(e);
  }
}
const pos = e => [e.tx + e.dx * e.p, e.ty + e.dy * e.p];

function pacPick(e) {
  if (open(e.tx + want[0], e.ty + want[1])) { e.dx = want[0]; e.dy = want[1]; }
  else if (!open(e.tx + e.dx, e.ty + e.dy)) e.dx = e.dy = 0;
}
function eat(e) {
  const c = grid[e.ty][e.tx];
  if (c === ' ') return;
  grid[e.ty][e.tx] = ' '; dots--;
  addScore(c === '.' ? 10 : 50);
  if (c === 'o') {
    frightT = Math.max(2, 8 - level); combo = 0;
    ghosts.forEach(g => { if (g.mode !== 'eyes') g.fright = true; });
  }
  if (!dots) setState('clear');
}

function target(g) {
  if (g.mode === 'eyes') return (g.tx === 9 && g.ty <= 8) ? { x: 9, y: 9 } : { x: 9, y: 7 };
  if (g.mode === 'exit') return { x: 9, y: 7 };
  if (phase % 2 === 0) return CORNERS[g.i]; // scatter
  const px = pac.tx, py = pac.ty;
  if (g.i === 0) return { x: px, y: py };                                   // Blinky: chases
  if (g.i === 1) return { x: px + pac.dx * 4, y: py + pac.dy * 4 };         // Pinky: ambushes
  if (g.i === 2) {                                                          // Inky: flanks
    const b = ghosts[0];
    return { x: 2 * (px + pac.dx * 2) - b.tx, y: 2 * (py + pac.dy * 2) - b.ty };
  }
  return Math.hypot(px - g.tx, py - g.ty) > 8 ? { x: px, y: py } : CORNERS[3]; // Clyde: shy
}
function ghostPick(g) {
  const opts = DIRS.filter(([dx, dy]) =>
    !((g.dx || g.dy) && dx === -g.dx && dy === -g.dy) && open(g.tx + dx, g.ty + dy, g));
  if (!opts.length) { g.dx = -g.dx; g.dy = -g.dy; return; }
  let best = opts[0];
  if (g.fright && g.mode !== 'eyes') best = opts[Math.random() * opts.length | 0];
  else {
    const t = target(g); let bd = Infinity;
    for (const o of opts) {
      const d = (g.tx + o[0] - t.x) ** 2 + (g.ty + o[1] - t.y) ** 2;
      if (d < bd) { bd = d; best = o; }
    }
  }
  [g.dx, g.dy] = best;
}
function ghostArrive(g) {
  if (g.mode === 'eyes' && g.tx === 9 && g.ty === 9) { g.mode = 'exit'; g.fright = false; g.dx = g.dy = 0; }
  else if (g.mode === 'exit' && g.ty <= 7) g.mode = 'normal';
}

// ---------- game loop ----------
function update(dt) {
  stateT += dt;
  if (state === 'ready') { if (stateT > 2.5) setState('play'); return; }
  if (state === 'dying') { if (stateT > 1.6) { if (--lives > 0) resetActors(); else setState('over'); } return; }
  if (state === 'clear') { if (stateT > 2) { level++; newLevel(); } return; }
  if (state !== 'play') return;

  if (frightT > 0) { frightT -= dt; if (frightT <= 0) ghosts.forEach(g => g.fright = false); }
  else if ((phaseT -= dt) <= 0) { phase = Math.min(phase + 1, PHASES.length - 1); phaseT = PHASES[phase]; }

  const spd = 1 + (level - 1) * 0.05;
  if (pac.p > 0 && (pac.dx || pac.dy) && want[0] === -pac.dx && want[1] === -pac.dy) { // instant U-turn
    pac.tx = (pac.tx + pac.dx + W) % W; pac.ty += pac.dy; pac.p = 1 - pac.p; pac.dx *= -1; pac.dy *= -1;
  }
  move(pac, dt, 6.5 * spd, pacPick, eat);
  if (pac.dx || pac.dy) pac.face = Math.atan2(pac.dy, pac.dx);
  if (state !== 'play') return;

  for (const g of ghosts) {
    if (g.wait > 0) { g.wait -= dt; continue; }
    const s = g.mode === 'eyes' ? 13 : g.mode === 'exit' ? 4 : g.fright ? 3.4 * spd : 5.6 * spd;
    move(g, dt, s, ghostPick, ghostArrive);
  }
  const [px, py] = pos(pac);
  for (const g of ghosts) {
    if (g.mode === 'eyes') continue;
    const [gx, gy] = pos(g);
    if ((gx - px) ** 2 + (gy - py) ** 2 < 0.4) {
      if (g.fright) { g.mode = 'eyes'; g.fright = false; addScore(200 << combo++); }
      else { setState('dying'); break; }
    }
  }
}

// ---------- drawing ----------
function drawPac() {
  const [x, y] = pos(pac), cx = (x + .5) * T, cy = (y + .5) * T;
  let m = (pac.dx || pac.dy) ? Math.abs(Math.sin(clock * 12)) * .8 : .3;
  if (state === 'dying') m = Math.min(Math.PI, stateT / 1.4 * Math.PI);
  ctx.fillStyle = '#ffe600'; ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, T * .45, pac.face + m, pac.face - m + Math.PI * 2);
  ctx.closePath(); ctx.fill();
}
function drawGhost(g) {
  const [x, y] = pos(g), cx = (x + .5) * T, cy = (y + .5) * T, r = T * .46;
  if (g.mode !== 'eyes') {
    const flash = g.fright && frightT < 2 && Math.floor(clock * 6) % 2;
    ctx.fillStyle = g.fright ? (flash ? '#fff' : '#2121ff') : COLORS[g.i];
    ctx.beginPath(); ctx.arc(cx, cy - 1, r, Math.PI, 0); ctx.lineTo(cx + r, cy + r);
    for (let k = 0; k < 3; k++) {
      ctx.lineTo(cx + r - (k + .5) * r * 2 / 3, cy + r - 4);
      ctx.lineTo(cx + r - (k + 1) * r * 2 / 3, cy + r);
    }
    ctx.closePath(); ctx.fill();
  }
  if (g.fright && g.mode !== 'eyes') {
    ctx.fillStyle = flashColor(); ctx.fillRect(cx - 5, cy - 4, 3, 3); ctx.fillRect(cx + 2, cy - 4, 3, 3);
  } else for (const s of [-1, 1]) {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + s * 3.5, cy - 3, 3.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#1a2cff'; ctx.beginPath(); ctx.arc(cx + s * 3.5 + g.dx * 1.6, cy - 3 + g.dy * 1.6, 1.6, 0, 7); ctx.fill();
  }
}
const flashColor = () => '#ffb8ae';
function say(s, y, size, color) {
  ctx.fillStyle = color; ctx.font = `bold ${size}px "Courier New", monospace`;
  ctx.textAlign = 'center'; ctx.fillText(s, cv.width / 2, y);
}
function panel(title, color, sub) {
  ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(0, 7 * T, cv.width, 7 * T);
  say(title, 10 * T, 34, color); say(sub, 12 * T, 13, '#f4f4ff');
}
function draw() {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.drawImage(walls, 0, 0);
  ctx.fillStyle = '#ffd9a0';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = grid[y][x];
    if (c === '.') ctx.fillRect(x * T + 9, y * T + 9, 3, 3);
    else if (c === 'o' && (state !== 'play' || Math.floor(clock * 4) % 2)) {
      ctx.beginPath(); ctx.arc(x * T + T / 2, y * T + T / 2, 6, 0, 7); ctx.fill();
    }
  }
  if (state !== 'clear' || Math.floor(clock * 6) % 2) drawPac();
  if (state !== 'dying') ghosts.forEach(drawGhost);
  if (state === 'ready') say('READY!', 11.5 * T + 5, 16, '#ffe600');
  if (state === 'clear') say('LEVEL CLEAR!', 11.5 * T + 5, 16, '#ffe600');
  if (state === 'title') panel('PAC-MAN', '#ffe600', 'Press Enter or tap to start');
  if (state === 'over') panel('GAME OVER', '#ff3b3b', 'Press Enter or tap to retry');
  if (paused) panel('PAUSED', '#ffe600', 'Press P to resume');
}
function hud() {
  $('score').textContent = score; $('best').textContent = best; $('level').textContent = level;
  $('lives').textContent = '●'.repeat(Math.max(0, lives));
}
let last = 0;
function frame(ts) {
  const dt = Math.min(.05, (ts - last) / 1000) || 0; last = ts; clock += dt;
  if (!paused) update(dt);
  draw(); hud();
  requestAnimationFrame(frame);
}

// ---------- input ----------
const KEYS = { ArrowUp: [0, -1], w: [0, -1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowDown: [0, 1], s: [0, 1], ArrowRight: [1, 0], d: [1, 0] };
const startable = () => state === 'title' || state === 'over';
addEventListener('keydown', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (KEYS[k]) { want = KEYS[k]; e.preventDefault(); }
  else if (k === 'Enter' || k === ' ') { if (startable()) newGame(); e.preventDefault(); }
  else if ((k === 'p' || k === 'Escape') && (state === 'play' || state === 'ready')) paused = !paused;
});
let t0 = null;
cv.addEventListener('touchstart', e => { t0 = e.touches[0]; if (startable()) newGame(); e.preventDefault(); }, { passive: false });
cv.addEventListener('touchmove', e => {
  if (!t0) return;
  const t = e.touches[0], dx = t.clientX - t0.clientX, dy = t.clientY - t0.clientY;
  if (Math.hypot(dx, dy) > 24) { want = Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]; t0 = t; }
  e.preventDefault();
}, { passive: false });
cv.addEventListener('click', () => { if (startable()) newGame(); });
addEventListener('blur', () => { if (state === 'play') paused = true; });

// ---------- boot ----------
score = 0; lives = 3; level = 1; newLevel(); setState('title');
requestAnimationFrame(frame);
