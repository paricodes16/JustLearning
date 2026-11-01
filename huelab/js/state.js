/* =====================================================================
   HUELAB: state. Everything is saved in this browser only (localStorage).
   Nothing is sent anywhere. Values read back from storage are validated,
   so a damaged or edited save can never break the app.
   ===================================================================== */
(function () {
  var HL = (globalThis.HL = globalThis.HL || {});
  var KEY = 'huelab-v1';
  var blocked = false;

  var S = (HL.S = {
    mode: 'ryb',                 // 'ryb' painter's wheel | 'rgb' screen wheel
    scheme: 'complementary',
    base: '#C8553D',             // the colour chosen on the wheel
    palette: [],                 // colours the learner saved
    brush: '#C8553D',            // the current painting colour
    medium: 'dry',               // 'dry' | 'glaze'
    amount: 70,
    layer: 0,                    // active layer index 0..2
    tool: 'paint',               // 'paint' | 'erase' | 'look'
    tpl: 'landscape',
    painting: {},                // { templateId: { regionId: [layer|null, layer|null, layer|null] } }
    visible: [true, true, true],
    done: {},                    // { taskId: true }
    hue: 0,                      // runtime: remembers the hue even when the colour is grey, black or white
    selected: null,              // selected region id (not saved)
    task: null                   // active assignment id (not saved)
  });

  S.hue = HL.hexToHsl(S.base).h;

  var MEDIA = ['dry', 'glaze'];

  function cleanLayer(L) {
    if (!L || typeof L !== 'object') return null;
    var hex = HL.normalizeHex(L.hex);
    if (!hex || MEDIA.indexOf(L.medium) === -1) return null;
    var amount = Number(L.amount);
    if (!isFinite(amount)) return null;
    return { hex: hex, medium: L.medium, amount: HL.clamp(Math.round(amount), 1, 100) };
  }

  function cleanPainting(p) {
    var out = {};
    if (!p || typeof p !== 'object') return out;
    Object.keys(HL.TEMPLATES).forEach(function (tid) {
      var t = p[tid];
      if (!t || typeof t !== 'object') return;
      out[tid] = {};
      HL.TEMPLATES[tid].regions.forEach(function (r) {
        var layers = Array.isArray(t[r.id]) ? t[r.id].slice(0, 3) : [];
        var cleaned = [0, 1, 2].map(function (i) { return cleanLayer(layers[i]); });
        if (cleaned.some(Boolean)) out[tid][r.id] = cleaned;
      });
    });
    return out;
  }

  S.load = function () {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d.mode === 'ryb' || d.mode === 'rgb') S.mode = d.mode;
      if (HL.SCHEMES[d.scheme]) S.scheme = d.scheme;
      S.base = HL.normalizeHex(d.base) || S.base;
      S.brush = HL.normalizeHex(d.brush) || S.brush;
      if (Array.isArray(d.palette)) S.palette = d.palette.map(HL.normalizeHex).filter(Boolean).slice(0, 16);
      if (MEDIA.indexOf(d.medium) !== -1) S.medium = d.medium;
      if (isFinite(d.amount)) S.amount = HL.clamp(Math.round(d.amount), 1, 100);
      if (d.layer === 0 || d.layer === 1 || d.layer === 2) S.layer = d.layer;
      if (HL.TEMPLATES[d.tpl]) S.tpl = d.tpl;
      if (Array.isArray(d.visible) && d.visible.length === 3) S.visible = d.visible.map(function (v) { return v !== false; });
      S.hue = HL.hexToHsl(S.base).h;
      S.painting = cleanPainting(d.painting);
      if (d.done && typeof d.done === 'object') Object.keys(d.done).forEach(function (k) { if (HL.taskById(k) && d.done[k]) S.done[k] = true; });
    } catch (err) { blocked = true; }
  };

  S.save = function () {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        mode: S.mode, scheme: S.scheme, base: S.base, brush: S.brush, palette: S.palette, medium: S.medium, amount: S.amount,
        layer: S.layer, tpl: S.tpl, visible: S.visible, painting: S.painting, done: S.done
      }));
    } catch (err) { blocked = true; }
  };
  S.isBlocked = function () { return blocked; };

  S.wipe = function () {
    try { localStorage.removeItem(KEY); } catch (err) { /* ignore */ }
    S.painting = {}; S.palette = []; S.done = {}; S.history = []; S.selected = null;
  };

  /* ----- Painting ----- */
  S.regions = function () {
    if (!S.painting[S.tpl]) S.painting[S.tpl] = {};
    return S.painting[S.tpl];
  };

  S.history = [];
  S.snapshot = function () {
    S.history.push(JSON.stringify({ tpl: S.tpl, regions: S.regions() }));
    if (S.history.length > 40) S.history.shift();
  };
  S.undo = function () {
    var last = S.history.pop();
    if (!last) return false;
    var d = JSON.parse(last);
    S.painting[d.tpl] = cleanPainting({ [d.tpl]: d.regions })[d.tpl] || {};
    S.tpl = d.tpl;
    S.save();
    return true;
  };

  S.applyLayer = function (regionId) {
    S.snapshot();
    var regions = S.regions();
    var layers = regions[regionId] ? regions[regionId].slice() : [null, null, null];
    layers[S.layer] = { hex: S.brush, medium: S.medium, amount: S.amount };
    regions[regionId] = layers;
    S.save();
  };

  S.eraseLayer = function (regionId) {
    var regions = S.regions();
    if (!regions[regionId] || !regions[regionId][S.layer]) return false;
    S.snapshot();
    var layers = regions[regionId].slice();
    layers[S.layer] = null;
    if (layers.some(Boolean)) regions[regionId] = layers; else delete regions[regionId];
    S.save();
    return true;
  };

  S.resetCanvas = function () {
    S.snapshot();
    S.painting[S.tpl] = {};
    S.save();
  };

  S.setBrush = function (hex) {
    var h = HL.normalizeHex(hex);
    if (!h) return false;
    S.brush = h; S.save();
    return true;
  };

  S.setBase = function (hex) {
    var h = HL.normalizeHex(hex);
    if (!h) return false;
    var hsl = HL.hexToHsl(h);
    S.base = h;
    if (hsl.s > 3 && hsl.l > 3 && hsl.l < 97) S.hue = hsl.h;   // keep the last meaningful hue
    S.save();
    return true;
  };

  // Set the base from a hue plus saturation and lightness (used by the wheel and sliders)
  S.setBaseHsl = function (h, s, l) {
    S.hue = HL.mod(h, 360);
    S.base = HL.hslToHex({ h: S.hue, s: s, l: l });
    S.save();
  };

  // Colours offered in the painting palette
  S.brushPalette = function () {
    var out = [], seen = {};
    function add(hex) { var h = HL.normalizeHex(hex); if (h && !seen[h]) { seen[h] = true; out.push(h); } }
    var task = S.task ? HL.taskById(S.task) : null;
    if (task) task.palette.forEach(add);
    S.palette.forEach(add);
    HL.scheme(S.base, S.scheme, S.mode).forEach(function (c) { add(c.hex); });
    for (var a = 0; a < 360; a += 30) add(HL.hslToHex({ h: HL.angleToHue(a, 'ryb'), s: 70, l: 50 }));
    ['#FFFFFF', '#E9E2D0', '#9A9A9A', '#2B2824'].forEach(add);
    return out.slice(0, 40);
  };
})();
