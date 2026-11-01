/* Run with:  node tests/color.test.js
   Tests the colour maths, the templates and every assignment.
   No installs needed. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const sandbox = { console, Math, Date, Object, Array, String, RegExp, JSON, Number };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
['color.js', 'templates.js', 'lessons.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', f), 'utf8'), sandbox));
const HL = sandbox.HL;

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { console.error('  FAIL ' + name + '\n       ' + e.message); process.exitCode = 1; }
}
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, (msg || '') + ' expected ' + b + ' got ' + a);

console.log('Hex and conversions');
test('normalizeHex accepts short, long, with and without #, any case', () => {
  assert.strictEqual(HL.normalizeHex('#abc'), '#AABBCC');
  assert.strictEqual(HL.normalizeHex('aabbcc'), '#AABBCC');
  assert.strictEqual(HL.normalizeHex(' #E8742c '), '#E8742C');
});
test('normalizeHex rejects bad input', () => {
  ['', '#12', '#12345', '#GGGGGG', 'red', null, undefined, '#1234567'].forEach(x => assert.strictEqual(HL.normalizeHex(x), null, String(x)));
});
test('hex to rgb and back', () => {
  assert.deepStrictEqual(Array.from(HL.hexToRgb('#E8742C')), [232, 116, 44]);
  assert.strictEqual(HL.rgbToHex([232, 116, 44]), '#E8742C');
});
test('known HSL values', () => {
  [['#FF0000', 0, 100, 50], ['#00FF00', 120, 100, 50], ['#0000FF', 240, 100, 50], ['#FFFFFF', 0, 0, 100], ['#000000', 0, 0, 0], ['#808080', 0, 0, 50.2]].forEach(([hex, h, s, l]) => {
    const c = HL.hexToHsl(hex); near(c.h, h, 0.5, hex + ' h'); near(c.s, s, 0.5, hex + ' s'); near(c.l, l, 0.5, hex + ' l');
  });
});
test('hex -> HSL -> hex round trip for 2000 random colours', () => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 2000; i++) {
    const hex = HL.rgbToHex([rnd() * 255, rnd() * 255, rnd() * 255]);
    assert.strictEqual(HL.hslToHex(HL.hexToHsl(hex)), hex);
  }
});

console.log('Colour wheels');
test('painter\'s wheel mapping is monotonic and invertible', () => {
  let prev = -1;
  for (let a = 0; a < 360; a += 1) {
    const h = HL.rybToHue(a);
    assert.ok(h > prev, 'not increasing at ' + a); prev = h;
    near(HL.hueToRyb(h), a, 0.001, 'round trip ' + a);
  }
});
test('painter\'s wheel: red<->green, blue<->orange, yellow<->violet', () => {
  const comp = hex => HL.hexToHsl(HL.complement(hex, 'ryb'));
  assert.ok(HL.inHue(comp('#E32636').h, 100, 150), 'red -> green');
  assert.ok(HL.inHue(comp('#2255CC').h, 15, 45), 'blue -> orange');
  assert.ok(HL.inHue(comp('#FFE000').h, 255, 295), 'yellow -> violet');
});
test('screen wheel: red -> cyan, blue -> yellow', () => {
  near(HL.hexToHsl(HL.complement('#FF0000', 'rgb')).h, 180, 1);
  near(HL.hexToHsl(HL.complement('#0000FF', 'rgb')).h, 60, 1);
});
test('complement of the complement is the original hue (both wheels)', () => {
  ['ryb', 'rgb'].forEach(mode => ['#C8553D', '#4A8B3F', '#2F5FA8', '#E8B08F'].forEach(hex => {
    const back = HL.complement(HL.complement(hex, mode), mode);
    near(HL.angleDiff(HL.hexToHsl(back).h, HL.hexToHsl(hex).h), 0, 2, hex + ' ' + mode);
  }));
});
test('schemes have the right number of colours, start at the base, and keep saturation and lightness', () => {
  const counts = { complementary: 2, split: 3, analogous: 3, triadic: 3, square: 4, rectangle: 4, monochromatic: 5 };
  Object.keys(counts).forEach(t => {
    const s = HL.scheme('#C8553D', t, 'ryb');
    assert.strictEqual(s.length, counts[t], t);
    if (t !== 'monochromatic' && t !== 'analogous') assert.strictEqual(s[0].hex, HL.hslToHex(HL.hexToHsl('#C8553D')), t + ' base');
  });
  const base = HL.hexToHsl('#C8553D');
  HL.scheme('#C8553D', 'triadic', 'ryb').forEach(c => { const h = HL.hexToHsl(c.hex); near(h.s, base.s, 2); near(h.l, base.l, 2); });
});
test('triadic and square are evenly spaced on the wheel', () => {
  ['ryb', 'rgb'].forEach(mode => {
    const t = HL.scheme('#C8553D', 'triadic', mode).map(c => c.angle);
    near(HL.angleDiff(t[0], t[1]), 120, 0.001); near(HL.angleDiff(t[1], t[2]), 120, 0.001);
    const q = HL.scheme('#C8553D', 'square', mode).map(c => c.angle);
    near(HL.angleDiff(q[0], q[2]), 180, 0.001); near(HL.angleDiff(q[0], q[1]), 90, 0.001);
  });
});
test('monochromatic keeps the hue and orders lightness', () => {
  const m = HL.scheme('#2F5FA8', 'monochromatic', 'ryb').map(c => HL.hexToHsl(c.hex));
  for (let i = 1; i < m.length; i++) assert.ok(m[i].l > m[i - 1].l);
});

console.log('Names, temperature, contrast');
test('hue names on the painter\'s wheel', () => {
  [['#FF0000', 'Red'], ['#FF8000', 'Orange'], ['#FFFF00', 'Yellow'], ['#00A000', 'Green'], ['#2255CC', 'Blue'], ['#808080', 'Grey'], ['#000000', 'Black'], ['#FFFFFF', 'White']].forEach(([hex, n]) =>
    assert.strictEqual(HL.hueName(hex), n, hex));
});
test('names follow the wheel in use: pure screen blue is Blue on screen, Blue-violet in paint', () => {
  assert.strictEqual(HL.hueName('#0000FF', 'rgb'), 'Blue');
  assert.strictEqual(HL.hueName('#0000FF', 'ryb'), 'Blue-violet');
  assert.strictEqual(HL.hueName('#FF0000', 'rgb'), 'Red');
  assert.strictEqual(HL.hueName('#00FFFF', 'rgb'), 'Cyan');
  assert.strictEqual(HL.describe('#00FFFF', 'rgb').name, 'Cyan');
});
test('temperature', () => {
  assert.strictEqual(HL.temperature('#E8742C'), 'warm');
  assert.strictEqual(HL.temperature('#C0392B'), 'warm');
  assert.strictEqual(HL.temperature('#2F5FA8'), 'cool');
  assert.strictEqual(HL.temperature('#5FA89A'), 'cool');
  assert.strictEqual(HL.temperature('#808080'), 'neutral');
});
test('contrast ratio: black on white is 21, same colour is 1', () => {
  near(HL.contrast('#000000', '#FFFFFF'), 21, 0.01);
  near(HL.contrast('#336699', '#336699'), 1, 0.001);
});
test('describe returns the expected fields', () => {
  const d = HL.describe('#E8742C');
  assert.strictEqual(d.hex, '#E8742C'); assert.strictEqual(d.temperature, 'warm'); assert.ok(d.contrastWhite > 1 && d.contrastBlack > 1);
  assert.ok(['#FFFFFF', '#000000'].includes(d.bestText));
});

console.log('Mixing');
test('mixing at 0 and 1 returns the ends', () => {
  ['mixPaint', 'mixLight'].forEach(f => { assert.strictEqual(HL[f]('#C0392B', '#2F5FA8', 0), '#C0392B'); assert.strictEqual(HL[f]('#C0392B', '#2F5FA8', 1), '#2F5FA8'); });
});
test('paint-like mix: blue + yellow gives green', () => {
  const g = HL.hexToHsl(HL.mixPaint('#2A4AA8', '#F2D21A', 0.5));
  assert.ok(HL.inHue(g.h, 70, 160), 'hue ' + g.h);
});
test('paint-like mix of complements is muted (less saturated than both ends)', () => {
  [['#C0392B', '#2E8B57'], ['#E07B39', '#2F5FA8']].forEach(([a, b]) => {
    const m = HL.hexToHsl(HL.mixPaint(a, b, 0.5)), A = HL.hexToHsl(a), B = HL.hexToHsl(b);
    assert.ok(m.s < Math.min(A.s, B.s) - 10, a + ' + ' + b + ' sat ' + m.s.toFixed(1));
  });
});
test('light mix is brighter than paint mix', () => {
  assert.ok(HL.hexToHsl(HL.mixLight('#C0392B', '#2E8B57', 0.5)).l > HL.hexToHsl(HL.mixPaint('#C0392B', '#2E8B57', 0.5)).l);
});
test('glaze over white lightens, over a dark colour darkens', () => {
  assert.ok(HL.hexToHsl(HL.glaze('#FFFFFF', '#2F5D50', 0.5)).l > HL.hexToHsl('#2F5D50').l);
  assert.ok(HL.hexToHsl(HL.glaze('#D9C3A0', '#2F5D50', 0.5)).l < HL.hexToHsl('#D9C3A0').l);
  assert.strictEqual(HL.glaze('#D9C3A0', '#2F5D50', 1), '#2F5D50');
});
test('composite: nothing painted is null; 100% opaque covers; hidden layers are skipped', () => {
  assert.strictEqual(HL.composite([null, null, null]), null);
  assert.strictEqual(HL.composite([{ hex: '#336699', medium: 'dry', amount: 100 }]), '#336699');
  const two = [{ hex: '#C8553D', medium: 'dry', amount: 100 }, { hex: '#4A8B3F', medium: 'dry', amount: 65 }];
  assert.notStrictEqual(HL.composite(two), HL.composite(two, [false, true]));
  assert.strictEqual(HL.composite(two, [false, false]), null);
});
test('a red underpainting changes the green composite toward warm', () => {
  const green = { hex: '#4A8B3F', medium: 'dry', amount: 65 };
  const withRed = HL.hexToHsl(HL.composite([{ hex: '#C8553D', medium: 'dry', amount: 100 }, green]));
  const without = HL.hexToHsl(HL.composite([null, green]));
  assert.ok(withRed.h < without.h, 'expected a warmer (lower) hue');
});

console.log('Templates');
test('every template has unique region ids, valid parents and draws parents first', () => {
  Object.values(sandbox.HL.TEMPLATES).forEach(t => {
    const ids = t.regions.map(r => r.id);
    assert.strictEqual(new Set(ids).size, ids.length, t.id);
    t.regions.forEach((r, i) => { if (r.parent) assert.ok(ids.indexOf(r.parent) !== -1 && ids.indexOf(r.parent) < i, t.id + '/' + r.id); assert.ok(r.label && r.shape && r.shape.t); });
  });
  assert.deepStrictEqual(Array.from(HL.TEMPLATE_ORDER).sort(), Object.keys(HL.TEMPLATES).sort());
});
test('shapeSvg builds valid markup', () => {
  assert.strictEqual(HL.shapeSvg({ t: 'circle', cx: 1, cy: 2, r: 3 }, { fill: 'none' }), '<circle cx="1" cy="2" r="3" fill="none"/>');
});

console.log('Assignments');
const L = (hex, amount, medium) => ({ hex, amount: amount == null ? 100 : amount, medium: medium || 'dry' });
const SOLUTIONS = {
  'warm-under-green': {
    foliage: [L('#C8553D'), L('#4A8B3F', 65)], field: [L('#C8553D'), L('#4A8B3F', 65)]
  },
  'violet-under-skin': {
    face: [L('#8A6BB1'), L('#E8B08F', 70)], neck: [L('#8A6BB1'), L('#E8B08F', 70)],
    faceShade: [L('#6B4E8A', 45, 'glaze')], neckShadow: [L('#6B4E8A', 45, 'glaze')],
    cheekL: [null, null, L('#E58D7A', 40, 'glaze')]
  },
  'coloured-shadows': {
    apple: [L('#C0392B')], table: [L('#D9C3A0')], wall: [L('#E9E2D0')], shadow: [L('#2F5D50', 55, 'glaze')]
  },
  'harmony-and-accent': {
    sky: [L('#A9D6D2')], farHills: [L('#5FA89A')], field: [L('#2F7F62')], sun: [L('#E8742C')]
  },
  'aerial-perspective': {
    sky: [L('#A7BBD6')], farHills: [L('#7C97BA')], field: [L('#B98A3E')], trunk: [L('#8A5A2E')]
  },
  'muted-background': {
    wall: [L(HL.mixPaint('#E07B39', '#2F5FA8', 0.5))], table: [L(HL.mixPaint('#E07B39', '#2F5FA8', 0.35))], apple: [L('#C0392B')]
  }
};
test('every task has steps, checks, a palette and valid template and regions', () => {
  assert.ok(HL.TASKS.length >= 6);
  HL.TASKS.forEach(t => {
    assert.ok(t.steps.length >= 3 && t.checks.length >= 3 && t.palette.length >= 3 && t.observe && t.reflect && t.theory, t.id);
    assert.ok(HL.TEMPLATES[t.template], t.id);
    t.palette.forEach(p => assert.ok(HL.normalizeHex(p), t.id + ' palette ' + p));
    (t.steps.join(' ').match(/#[0-9A-Fa-f]{6}/g) || []).forEach(h => assert.ok(HL.normalizeHex(h)));
    assert.ok(SOLUTIONS[t.id], 'no test solution for ' + t.id);
  });
});
test('solution regions exist in each template', () => {
  HL.TASKS.forEach(t => Object.keys(SOLUTIONS[t.id]).forEach(r => assert.ok(HL.TEMPLATES[t.template].regions.some(x => x.id === r), t.id + ': ' + r)));
});
HL.TASKS.forEach(t => {
  test('"' + t.title + '": an empty canvas passes nothing', () => {
    const res = HL.runChecks(t, {});
    assert.ok(res.every(r => !r.ok), res.filter(r => r.ok).map(r => r.label).join(' | '));
  });
  test('"' + t.title + '": the model solution passes every check', () => {
    const res = HL.runChecks(t, SOLUTIONS[t.id]);
    assert.ok(res.every(r => r.ok), 'failed: ' + res.filter(r => !r.ok).map(r => r.label).join(' | '));
  });
});
test('checks notice mistakes: green under red fails; grey shadow fails; same-colour scene fails the accent', () => {
  const t1 = HL.taskById('warm-under-green');
  assert.ok(!HL.runChecks(t1, { foliage: [L('#4A8B3F'), L('#C8553D', 65)], field: [L('#4A8B3F'), L('#C8553D', 65)] })[0].ok);
  const t3 = HL.taskById('coloured-shadows');
  const grey = Object.assign({}, SOLUTIONS['coloured-shadows'], { shadow: [L('#333333', 55, 'glaze')] });
  const r = HL.runChecks(t3, grey);
  assert.ok(!r[3].ok && !r[4].ok && r[2].ok);
  const t4 = HL.taskById('harmony-and-accent');
  const flat = { sky: [L('#A9D6D2')], farHills: [L('#5FA89A')], field: [L('#2F7F62')], sun: [L('#7FC7B0')] };
  assert.ok(!HL.runChecks(t4, flat)[3].ok);
  const t5 = HL.taskById('aerial-perspective');
  const swapped = { sky: [L('#A7BBD6')], farHills: [L('#B98A3E')], field: [L('#7C97BA')] };
  const sw = HL.runChecks(t5, swapped); assert.ok(sw.every(x => !x.ok) || sw.filter(x => x.ok).length <= 1);
});
test('hiding Layer 1 changes what the checks see (visibility affects colour, not the stored layers)', () => {
  const regions = SOLUTIONS['violet-under-skin'];
  assert.notStrictEqual(HL.regionFinal('portrait', regions, 'face', [true, true, true]), HL.regionFinal('portrait', regions, 'face', [false, true, true]));
});
test('child regions are painted over their parent (shadow on table is darker than the table)', () => {
  const r = SOLUTIONS['coloured-shadows'];
  assert.ok(HL.hexToHsl(HL.regionFinal('stilllife', r, 'shadow')).l < HL.hexToHsl(HL.regionFinal('stilllife', r, 'table')).l);
});

console.log('Lessons');
test('lessons are complete and unique', () => {
  const ids = HL.LESSONS.map(l => l.id); assert.strictEqual(new Set(ids).size, ids.length);
  assert.ok(HL.LESSONS.length >= 8);
  HL.LESSONS.forEach(l => assert.ok(l.title && l.summary && l.body.length >= 2 && l.demo, l.id));
});

console.log('\n' + passed + ' checks passed' + (process.exitCode ? ', some FAILED' : ''));
