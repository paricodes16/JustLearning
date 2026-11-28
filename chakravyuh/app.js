'use strict';
/* Chakravyuh: generate and solve wheel mazes. Plain JS + Canvas, no dependencies. */
const $ = s => document.querySelector(s);
const cv = $('#cv'), ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
cv.width = cv.height = 640 * dpr;
const col = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const TURN = Math.PI * 2, T = 1, C0 = 1;      // ring thickness, core radius
const BIAS = [1, .85, .6, .3];                // spiral: chance to keep following the spiral corridor
const NS = [10, 12, 16, 20];                  // cells per turn, by complexity
const ek = (a, b) => a < b ? a * 1000 + b : b * 1000 + a;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
function hash(s) { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return h >>> 0; }
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

let type, R, N, M, CORE, ENT, E, rmax, walls, wmap, adj, open;
let cur, trail, moves, t0, tEnd, won, opt, hintUntil = 0, showSol = false, flash = null, cmd = false, spin = false, rot = 0;

/* ---------- geometry: both wheel types share one cell model ---------- */
// Cell k sits in turn row = floor(k / N) at sector i = k % N.
// ring: each row is a closed circle. spiral: one corridor that winds outward, so row r flows into row r+1.
const rho = (k, f) => type === 'ring' ? C0 + T * ((k / N | 0) + .5) : C0 + T * (.5 + (k + f) / N);
const ang = (i, f) => Math.PI / 2 + TURN * (i + f - E - .5) / N;   // entrance cell is centred at the bottom
const pt = (k, f, o) => { const a = ang(k % N, f), r = rho(k, f) + o * T / 2; return [r * Math.cos(a), r * Math.sin(a)]; };
const nodePos = k => k === CORE ? [0, 0] : pt(k, .5, 0);
function wallPts([a, , kind]) {
  if (kind === 'cw') return [pt(a, 1, -1), pt(a, 1, 1)];
  const p = []; for (let s = 0; s <= 8; s++) p.push(pt(a, s / 8, -1)); return p;
}

/* ---------- build a maze ---------- */
function setup(seed) {
  type = $('#type').value; R = +$('#layers').value;
  const lvl = +$('#lvl').value; N = NS[lvl]; M = R * N; CORE = M;
  ENT = type === 'ring' ? M - N : M - 1; E = type === 'ring' ? 0 : N - 1;
  rmax = C0 + T * R + (type === 'spiral' ? T : 0);
  cmd = $('#cmd').checked; spin = $('#spin').checked;
  const r = rng(hash(seed));
  walls = []; adj = Array.from({ length: M + 1 }, () => []); wmap = new Map();
  for (let k = 0; k < M; k++) {
    const row = k / N | 0, i = k % N;
    const inn = type === 'ring' ? (row ? k - N : CORE) : (k >= N ? k - N : CORE);
    const cw = type === 'ring' ? row * N + (i + 1) % N : (k + 1 < M ? k + 1 : -1);
    walls.push([k, inn, 'in']);
    if (cw >= 0) walls.push([k, cw, 'cw']);
  }
  for (const w of walls) {
    const key = ek(w[0], w[1]); wmap.set(key, w);
    adj[w[0]].push({ n: w[1], key }); adj[w[1]].push({ n: w[0], key });
  }
  // randomised depth-first search carves a spanning tree: exactly one route between any two cells
  open = new Set(); const seen = new Set([ENT]), st = [ENT];
  while (st.length) {
    const u = st[st.length - 1], c = adj[u].filter(x => !seen.has(x.n));
    if (!c.length) { st.pop(); continue; }
    const along = c.find(x => x.n === u - 1);   // spiral: one step further in along the corridor
    const p = (type === 'spiral' && along && r() < BIAS[lvl]) ? along : c[r() * c.length | 0];
    open.add(p.key); seen.add(p.n); st.push(p.n);
  }
  cur = ENT; trail = [ENT]; moves = 0; t0 = 0; won = false; flash = null; showSol = false; hintUntil = 0;
  opt = bfs(ENT, CORE).length - 1;
  $('#mv').textContent = 0; $('#opt').textContent = cmd ? '?' : opt; $('#sol').setAttribute('aria-pressed', false);
  $('#msg').textContent = 'Find the way to the glowing core. Use arrow keys or WASD, tap the board, or swipe.' +
    (cmd ? ' The commander rearranges the walls every 6 moves.' : '');
}
function newGame(fresh) {
  const s = $('#seed');
  if (fresh || !s.value.trim()) s.value = Math.random().toString(36).slice(2, 8);
  setup(s.value.trim());
}
function bfs(a, b) {
  const prev = new Map([[a, -1]]), q = [a];
  for (let i = 0; i < q.length && q[i] !== b; i++)
    for (const { n, key } of adj[q[i]]) if (open.has(key) && !prev.has(n)) { prev.set(n, q[i]); q.push(n); }
  const p = []; for (let u = b; prev.has(u) && u !== -1; u = prev.get(u)) p.push(u);
  return p.reverse();
}

/* ---------- the commander: open one wall, close one on your route ---------- */
function restructure() {
  const route = bfs(cur, CORE), ahead = new Set();
  for (let i = 1; i < route.length - 1; i++) ahead.add(ek(route[i], route[i + 1]));
  for (const [a, b] of shuffle(walls.map(w => [w[0], w[1]]))) {
    if (open.has(ek(a, b))) continue;
    const p = bfs(a, b);                         // the loop that opening this wall would create
    for (let i = 0; i < p.length - 1; i++) {
      const e = ek(p[i], p[i + 1]);
      if (ahead.has(e)) { open.add(ek(a, b)); open.delete(e); flash = { o: ek(a, b), c: e, t: performance.now() }; return; }
    }
  }
}

/* ---------- movement ---------- */
function go(dx, dy) {
  if (won) return;
  const rc = Math.cos(rot), rs = Math.sin(rot);
  const sp = k => { const [x, y] = nodePos(k); return [x * rc - y * rs, x * rs + y * rc]; };  // where it appears on screen
  const [px, py] = sp(cur), m = Math.hypot(dx, dy) || 1;
  let best = -1, bc = .35;
  for (const { n, key } of adj[cur]) {
    if (!open.has(key)) continue;
    const [qx, qy] = sp(n), l = Math.hypot(qx - px, qy - py) || 1, cs = ((qx - px) * dx + (qy - py) * dy) / (l * m);
    if (cs > bc) { bc = cs; best = n; }
  }
  if (best < 0) return;
  if (!t0) t0 = performance.now();
  if (trail.length > 1 && trail[trail.length - 2] === best) trail.pop(); else trail.push(best);
  cur = best; moves++;
  $('#mv').textContent = moves;
  if (cur === CORE) return finish();
  if (cmd && moves % 6 === 0) { restructure(); $('#msg').textContent = 'The commander has rearranged the walls.'; }
}
function finish() {
  won = true; tEnd = performance.now() - t0;
  const r = opt / moves, stars = r >= .9 ? '★★★' : r >= .6 ? '★★☆' : '★☆☆';
  $('#msg').textContent = cmd
    ? `You reached the core in ${moves} moves while the walls kept changing.`
    : `You reached the core in ${moves} moves (best possible ${opt}) in ${(tEnd / 1000).toFixed(1)}s. ${stars}`;
}

/* ---------- drawing ---------- */
const path = p => { ctx.moveTo(...p[0]); for (let i = 1; i < p.length; i++) ctx.lineTo(...p[i]); };
function stroke(p, color, w, alpha = 1) { ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); path(p); ctx.stroke(); ctx.globalAlpha = 1; }
function draw(now) {
  rot = spin ? now / 1000 * .12 : 0;              // spinning board = relative motion illusion
  const c = cv.width / 2, sc = (c - 12 * dpr) / rmax, lw = p => p * dpr / sc;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = col('--bg'); ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.translate(c, c); ctx.rotate(rot); ctx.scale(sc, sc); ctx.lineCap = ctx.lineJoin = 'round';
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, C0 * .9);
  g.addColorStop(0, '#ff4f8b'); g.addColorStop(1, 'rgba(255,79,139,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, C0 * .9, 0, TURN); ctx.fill();
  if (trail.length > 1) stroke(trail.map(nodePos), col('--teal'), lw(7), .5);
  if (showSol || now < hintUntil) { const r = bfs(cur, CORE); stroke((showSol ? r : r.slice(0, 6)).map(nodePos), col('--gold'), lw(5), .9); }
  ctx.strokeStyle = col('--gold'); ctx.lineWidth = lw(3.5); ctx.beginPath();
  for (const w of walls) if (!open.has(ek(w[0], w[1]))) path(wallPts(w));
  for (let k = M - N; k < M; k++) if (k !== ENT) { const p = []; for (let s = 0; s <= 8; s++) p.push(pt(k, s / 8, 1)); path(p); }
  if (type === 'spiral') { path([pt(0, 0, -1), pt(0, 0, 1)]); path([pt(M - 1, 1, -1), pt(M - 1, 1, 1)]); }
  ctx.stroke();
  if (flash) {
    const a = 1 - (now - flash.t) / 2500;
    if (a > 0) { stroke(wallPts(wmap.get(flash.c)), '#ff4f6d', lw(6), a); stroke(wallPts(wmap.get(flash.o)), col('--teal'), lw(6), a); } else flash = null;
  }
  const [x, y] = nodePos(cur);
  ctx.shadowColor = '#fff'; ctx.shadowBlur = 14 * dpr; ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, y, .27 * T, 0, TURN); ctx.fill(); ctx.shadowBlur = 0;
}
function frame(now) {
  draw(now);
  $('#tm').textContent = (t0 ? ((won ? tEnd : now - t0) / 1000 | 0) : 0) + 's';
  requestAnimationFrame(frame);
}

/* ---------- input ---------- */
const KEYS = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
addEventListener('keydown', e => {
  if (e.target.tagName === 'SELECT' || e.target.id === 'seed') return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (KEYS[k]) { go(...KEYS[k]); e.preventDefault(); }
});
cv.addEventListener('click', e => {             // move toward the point you tapped
  const b = cv.getBoundingClientRect(), f = b.width / cv.width, sc = (cv.width / 2 - 12 * dpr) / rmax * f, c = b.width / 2;
  const [x, y] = nodePos(cur), rc = Math.cos(rot), rs = Math.sin(rot);
  go(e.clientX - b.left - (c + (x * rc - y * rs) * sc), e.clientY - b.top - (c + (x * rs + y * rc) * sc));
});
let sw = null;
cv.addEventListener('touchstart', e => { sw = e.touches[0]; }, { passive: true });
cv.addEventListener('touchmove', e => {
  if (!sw) return;
  const t = e.touches[0], dx = t.clientX - sw.clientX, dy = t.clientY - sw.clientY;
  if (Math.hypot(dx, dy) > 26) { go(dx, dy); sw = t; }
}, { passive: true });
['#type', '#layers', '#lvl', '#cmd', '#spin'].forEach(s => $(s).onchange = () => newGame(false));
$('#nw').onclick = () => newGame(true);
$('#rs').onclick = () => newGame(false);
$('#seed').onkeydown = e => { if (e.key === 'Enter') newGame(false); };
$('#hint').onclick = () => { hintUntil = performance.now() + 3000; $('#msg').textContent = 'The next steps are shown in gold.'; };
$('#sol').onclick = () => { showSol = !showSol; $('#sol').setAttribute('aria-pressed', showSol); };

newGame(true);
requestAnimationFrame(frame);
