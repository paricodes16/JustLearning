/* =====================================================================
   HUELAB: views. Each function returns HTML for a page or a part of one.
   Colours always come from validated hex codes, and every label comes from
   this app's own data, so nothing a visitor types is ever inserted as HTML.
   ===================================================================== */
(function () {
  var HL = (globalThis.HL = globalThis.HL || {});
  var S = HL.S;
  var v = (HL.views = {});

  /* ---------- icons ---------- */
  var ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
    brush: '<path d="M18 3l3 3-9 9-3-3z"/><path d="M9 12c-3 0-4 2-4 4 0 2-1 3-2 4 3 1 7 0 8-3 .6-1.6 0-3-1-3.6"/>',
    tasks: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    download: '<path d="M12 3v12M8 11l4 4 4-4M5 21h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M3 3l18 18"/><path d="M10.6 5.1A9.5 9.5 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7c1.6 0 3-.4 4.3-1"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>'
  };
  function icon(name, size) {
    return '<svg class="ic" width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  }
  HL.icon = icon;

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  HL.esc = esc;

  function swatch(hex, cls, label) {
    return '<span class="sw ' + (cls || '') + '" style="background:' + hex + '"' + (label ? ' role="img" aria-label="' + esc(label) + '"' : ' aria-hidden="true"') + '></span>';
  }
  function seg(name, items, active, extra) {
    return '<div class="seg" role="group" aria-label="' + esc(name) + '"' + (extra || '') + '>' + items.map(function (it) {
      return '<button type="button" data-action="' + it.action + '" data-value="' + it.value + '" aria-pressed="' + (it.value === active) + '">' + it.label + '</button>';
    }).join('') + '</div>';
  }
  function pageHead(eyebrow, title, lede) {
    return '<header class="page-head"><p class="eyebrow">' + esc(eyebrow) + '</p><h1>' + esc(title) + '</h1>' + (lede ? '<p class="lede">' + lede + '</p>' : '') + '</header>';
  }
  function passLabel(r) { return r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'large text only' : 'fails'; }

  var LAYER_NAMES = ['Under', 'Middle', 'Top'];

  /* ---------- Home ---------- */
  v.home = function () {
    var green = { hex: '#4A8B3F', medium: 'dry', amount: 65 };
    var cards = [
      ['#/wheel', 'wheel', '1. Explore the wheel', 'Type any hex code and see its opposite, neighbours and triads on a painter’s or screen wheel.'],
      ['#/learn', 'book', '2. Learn the ideas', 'Short lessons with live demos on contrast, temperature, mixing and underpainting.'],
      ['#/paint', 'brush', '3. Paint in layers', 'Colour a drawing in up to three layers and hide any layer to see what it changes.'],
      ['#/assignments', 'tasks', '4. Try an assignment', 'Six guided exercises with a live checklist that notices what you paint.']
    ].map(function (c) {
      return '<a class="card link" href="' + c[0] + '">' + icon(c[1], 26) + '<h3>' + c[2] + '</h3><p>' + c[3] + '</p></a>';
    }).join('');

    return '<div class="page">' +
      '<section class="hero"><div><p class="eyebrow">Colour theory you can try</p><h1>See how colours work, then paint it.</h1>' +
      '<p class="lede">Huelab pairs a hex-driven colour wheel with a layered painting area, so ideas like complements and underpainting are something you test, not just read.</p>' +
      '<div class="row"><a class="btn primary" href="#/wheel">Open the colour wheel ' + icon('arrow', 18) + '</a><a class="btn" href="#/paint">Start painting</a></div>' +
      '<div class="quick field"><label for="quickHex">Or start with a colour you already have</label><div class="row">' +
      '<input type="text" id="quickHex" placeholder="#E8742C" maxlength="7" autocomplete="off" spellcheck="false" aria-describedby="quickErr"><button type="button" class="btn" data-action="quick-hex">Explore it</button></div>' +
      '<p class="err" id="quickErr" role="alert"></p></div></div>' +
      '<div class="hero-art" aria-hidden="true">' + HL.wheelSvg('#C8553D', 'ryb', 'triadic') + '</div></section>' +

      '<section class="section"><h2>How it works</h2><div class="grid four">' + cards + '</div></section>' +

      '<section class="section"><h2>Same green, different start</h2>' +
      '<p class="lede">Both squares use exactly the same green, painted as a broken, dry-brush layer. Only what is underneath differs. Look closely, then step back.</p>' +
      '<div class="grid three demo-trio">' +
      '<figure>' + HL.swatchSvg([green], 200, 130, 'Green on bare paper') + '<figcaption>Bare paper</figcaption></figure>' +
      '<figure>' + HL.swatchSvg([{ hex: '#C8553D', medium: 'dry', amount: 100 }, green], 200, 130, 'Green over a warm red underpainting') + '<figcaption>Over warm red</figcaption></figure>' +
      '<figure>' + HL.swatchSvg([{ hex: '#8A6BB1', medium: 'dry', amount: 100 }, green], 200, 130, 'Green over a violet underpainting') + '<figcaption>Over violet</figcaption></figure></div>' +
      '<p class="muted small">Which one looks richest to you? Painters have argued about this for centuries. <a href="#/assignments">Test it yourself in an assignment.</a></p></section></div>';
  };

  /* ---------- Wheel ---------- */
  var SCHEME_ORDER = ['complementary', 'split', 'analogous', 'triadic', 'square', 'rectangle', 'monochromatic'];

  function wheelDynamic() {
    var d = HL.describe(S.base, S.mode), def = HL.SCHEMES[S.scheme], colours = HL.scheme(S.base, S.scheme, S.mode);
    var list = colours.map(function (c, i) {
      var info = HL.describe(c.hex, S.mode);
      return '<li class="scheme-item"><button type="button" class="swatch-btn" data-action="use-colour" data-hex="' + c.hex + '" aria-label="Use ' + esc(c.role) + ' ' + c.hex + ' as the base colour">' + swatch(c.hex, 'lg') + '</button>' +
        '<div class="grow"><strong>' + esc(c.role) + '</strong><span class="muted small">' + info.name + ' · ' + info.temperature + '</span></div>' +
        '<code>' + c.hex + '</code>' +
        '<button type="button" class="icon-btn" data-action="copy-hex" data-hex="' + c.hex + '" aria-label="Copy ' + c.hex + '">' + icon('copy', 18) + '</button></li>';
    }).join('');

    var saved = S.palette.length ? '<ul class="chips-sw">' + S.palette.map(function (h) {
      return '<li><button type="button" class="chip-sw" data-action="use-colour" data-hex="' + h + '" aria-label="Use ' + h + '">' + swatch(h) + '<span>' + h + '</span></button>' +
        '<button type="button" class="x" data-action="remove-palette" data-hex="' + h + '" aria-label="Remove ' + h + ' from palette">' + icon('x', 14) + '</button></li>';
    }).join('') + '</ul>' : '<p class="muted small">No saved colours yet. Save a scheme to keep it for painting.</p>';

    return '<div class="card flat"><h2>' + def.label + '</h2><p><b>' + def.what + '</b></p><p class="muted">' + def.use + '</p></div>' +
      '<ul class="scheme-list">' + list + '</ul>' +
      '<div class="row"><button type="button" class="btn" data-action="save-palette">' + icon('save', 18) + 'Save these colours</button>' +
      '<a class="btn primary" href="#/paint" data-action="paint-with">' + icon('brush', 18) + 'Paint with them</a></div>' +
      '<div class="card flat"><h3>Your colour</h3><dl class="facts">' +
      '<dt>Name</dt><dd>' + d.name + ' (' + (S.mode === 'ryb' ? 'painter’s wheel' : 'screen wheel') + ')</dd>' +
      '<dt>Temperature</dt><dd>' + d.temperature + '</dd><dt>Value</dt><dd>' + d.value + '</dd><dt>Saturation</dt><dd>' + d.saturation + '</dd>' +
      '<dt>RGB</dt><dd>' + d.rgb.join(', ') + '</dd><dt>HSL</dt><dd>' + Math.round(d.hsl.h) + '°, ' + Math.round(d.hsl.s) + '%, ' + Math.round(d.hsl.l) + '%</dd>' +
      '<dt>Text on it</dt><dd><span class="pill" style="background:' + d.hex + ';color:#fff">White ' + d.contrastWhite.toFixed(1) + ':1 · ' + passLabel(d.contrastWhite) + '</span> ' +
      '<span class="pill" style="background:' + d.hex + ';color:#000">Black ' + d.contrastBlack.toFixed(1) + ':1 · ' + passLabel(d.contrastBlack) + '</span></dd></dl></div>' +
      '<div class="card flat"><h3>Saved palette</h3>' + saved + '</div>';
  }

  v.wheel = function () {
    var chips = SCHEME_ORDER.map(function (k) {
      return '<button type="button" class="chip" data-action="scheme" data-value="' + k + '" aria-pressed="' + (k === S.scheme) + '">' + HL.SCHEMES[k].label + '</button>';
    }).join('');
    var hsl = HL.hexToHsl(S.base);
    return '<div class="page">' + pageHead('Colour wheel', 'Find relationships between colours', 'Drag around the ring or type a hex code. The markers show the colours in the harmony you choose.') +
      '<div class="wheel-layout"><div class="wheel-col">' +
      '<div class="wheel-box" id="wheelBox" role="slider" tabindex="0" aria-label="Base hue. Use the arrow keys to change it." aria-valuemin="0" aria-valuemax="359"></div>' +
      '<p class="muted small center">Drag the ring, or focus it and use the arrow keys (Shift for bigger steps).</p></div>' +
      '<div class="wheel-panel">' +
      '<div class="field"><span class="label">Wheel</span>' + seg('Wheel type', [{ action: 'mode', value: 'ryb', label: 'Painter’s (red-yellow-blue)' }, { action: 'mode', value: 'rgb', label: 'Screen (RGB)' }], S.mode, ' id="modeSeg"') +
      '<p class="muted small" id="modeNote"></p></div>' +
      '<div class="field"><label for="hexInput">Base colour (hex)</label><div class="row nowrap"><input type="color" id="colorPicker" value="' + S.base.toLowerCase() + '" aria-label="Pick a colour">' +
      '<input type="text" id="hexInput" value="' + S.base + '" maxlength="7" autocomplete="off" spellcheck="false" aria-describedby="hexErr"></div><p class="err" id="hexErr" role="alert"></p></div>' +
      '<div class="two"><div class="field"><label for="satRange">Saturation <output id="satOut">' + Math.round(hsl.s) + '%</output></label><input type="range" id="satRange" min="0" max="100" value="' + Math.round(hsl.s) + '"></div>' +
      '<div class="field"><label for="lightRange">Lightness <output id="lightOut">' + Math.round(hsl.l) + '%</output></label><input type="range" id="lightRange" min="0" max="100" value="' + Math.round(hsl.l) + '"></div></div>' +
      '<div class="field"><span class="label">Harmony</span><div class="chips" id="schemeChips">' + chips + '</div></div>' +
      '<div id="wheelDynamic" class="stack"></div></div></div></div>';
  };

  // Redraw the parts of the wheel page that change; never touches a field the user is typing in.
  v.wheelUpdate = function (fromTyping) {
    var box = document.getElementById('wheelBox');
    if (!box) return;
    var hsl = HL.hexToHsl(S.base);
    box.innerHTML = HL.wheelSvg(S.base, S.mode, S.scheme);
    var ang = Math.round(HL.hueToAngle(S.hue, S.mode)) % 360;
    box.setAttribute('aria-valuenow', ang);
    box.setAttribute('aria-valuetext', HL.describe(S.base, S.mode).name + ', ' + S.base);
    document.getElementById('wheelDynamic').innerHTML = wheelDynamic();
    document.getElementById('modeNote').textContent = S.mode === 'ryb'
      ? 'The traditional artist’s wheel. Red’s opposite is green; blue’s is orange.'
      : 'How screens mix light. Red’s opposite is cyan; blue’s is yellow.';
    document.querySelectorAll('#modeSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.value === S.mode)); });
    document.querySelectorAll('#schemeChips button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.value === S.scheme)); });
    var hexIn = document.getElementById('hexInput'), pick = document.getElementById('colorPicker');
    if (hexIn && !fromTyping) hexIn.value = S.base;
    if (pick) pick.value = S.base.toLowerCase();
    var sat = document.getElementById('satRange'), lit = document.getElementById('lightRange');
    if (sat && document.activeElement !== sat) sat.value = Math.round(hsl.s);
    if (lit && document.activeElement !== lit) lit.value = Math.round(hsl.l);
    document.getElementById('satOut').textContent = Math.round(hsl.s) + '%';
    document.getElementById('lightOut').textContent = Math.round(hsl.l) + '%';
  };

  /* ---------- Learn ---------- */
  function strip(list, labels) {
    return '<div class="strip">' + list.map(function (h, i) {
      return '<span class="strip-item"><span class="sw tall" style="background:' + h + '"></span><code>' + (labels ? labels[i] : h) + '</code></span>';
    }).join('') + '</div>';
  }

  function demoParts(id) {
    var base = S.base, hsl = HL.hexToHsl(base);
    if (id === 'basics') {
      var h = Number(document.getElementById('dBasicsH') ? document.getElementById('dBasicsH').value : Math.round(S.hue));
      var s = Number(document.getElementById('dBasicsS') ? document.getElementById('dBasicsS').value : Math.round(hsl.s));
      var l = Number(document.getElementById('dBasicsL') ? document.getElementById('dBasicsL').value : Math.round(hsl.l));
      var hex = HL.hslToHex({ h: h, s: s, l: l });
      var hues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) { return HL.hslToHex({ h: i * 30, s: s, l: l }); });
      var sats = [0, 20, 40, 60, 80, 100].map(function (x) { return HL.hslToHex({ h: h, s: x, l: l }); });
      var lights = [10, 25, 40, 55, 70, 85, 95].map(function (x) { return HL.hslToHex({ h: h, s: s, l: x }); });
      return { inputs: '<div class="two3"><div class="field"><label for="dBasicsH">Hue <output>' + h + '°</output></label><input type="range" id="dBasicsH" data-demo="basics" min="0" max="359" value="' + h + '"></div>' +
        '<div class="field"><label for="dBasicsS">Saturation <output>' + s + '%</output></label><input type="range" id="dBasicsS" data-demo="basics" min="0" max="100" value="' + s + '"></div>' +
        '<div class="field"><label for="dBasicsL">Value (lightness) <output>' + l + '%</output></label><input type="range" id="dBasicsL" data-demo="basics" min="0" max="100" value="' + l + '"></div></div>',
        out: '<div class="big-sw" style="background:' + hex + ';color:' + HL.describe(hex).bestText + '"><b>' + hex + '</b></div>' +
          '<p class="label">Hue changes the family</p>' + strip(hues) + '<p class="label">Saturation changes the purity</p>' + strip(sats) + '<p class="label">Value changes the lightness</p>' + strip(lights) };
    }
    if (id === 'wheels') {
      var hx = HL.normalizeHex((document.getElementById('dWheelsHex') || {}).value) || '#E32636';
      var p = HL.complement(hx, 'ryb'), sc = HL.complement(hx, 'rgb');
      return { inputs: '<div class="field"><label for="dWheelsHex">Try a colour (hex)</label><input type="text" id="dWheelsHex" data-demo="wheels" value="' + hx + '" maxlength="7" spellcheck="false"></div>',
        out: '<div class="trio"><figure>' + swatch(hx, 'xl') + '<figcaption><b>Your colour</b><br>' + hx + '<br>' + HL.hueName(hx, 'ryb') + '</figcaption></figure>' +
          '<figure>' + swatch(p, 'xl') + '<figcaption><b>Painter’s opposite</b><br>' + p + '<br>' + HL.hueName(p, 'ryb') + '</figcaption></figure>' +
          '<figure>' + swatch(sc, 'xl') + '<figcaption><b>Screen opposite</b><br>' + sc + '<br>' + HL.hueName(sc, 'rgb') + '</figcaption></figure></div>' };
    }
    if (id === 'harmonies') {
      var rows = ['complementary', 'analogous', 'triadic', 'split'].map(function (k) {
        var cs = HL.scheme(base, k, S.mode);
        return '<div class="harm-row"><span class="harm-name">' + HL.SCHEMES[k].label + '</span>' + strip(cs.map(function (c) { return c.hex; })) + '</div>';
      }).join('');
      return { inputs: '<p class="muted small">Using your colour from the wheel: <code>' + base + '</code> (' + (S.mode === 'ryb' ? 'painter’s wheel' : 'screen wheel') + ').</p>', out: rows + '<p><a class="btn sm" href="#/wheel">Explore on the wheel ' + icon('arrow', 16) + '</a></p>' };
    }
    if (id === 'temperature') {
      var ring = [];
      for (var a = 0; a < 360; a += 30) ring.push(HL.hslToHex({ h: HL.rybToHue(a), s: 75, l: 52 }));
      var labels = ring.map(function (h) { return HL.temperature(h); });
      var scene = function (far, near, sky, cap) {
        return '<figure><svg viewBox="0 0 200 120" class="scene-svg" role="img" aria-label="' + cap + '"><rect width="200" height="120" fill="' + sky + '"/>' +
          '<path d="M0 70 C40 40 80 48 110 62 C140 44 170 46 200 60 L200 120 L0 120Z" fill="' + far + '"/>' +
          '<path d="M0 96 C50 76 120 86 200 82 L200 120 L0 120Z" fill="' + near + '"/></svg><figcaption>' + cap + '</figcaption></figure>';
      };
      return { inputs: '', out: '<p class="label">The painter’s wheel, from warm to cool</p>' + strip(ring, labels) +
        '<div class="grid two">' + scene('#8FA9C9', '#B98A3E', '#D9E4EF', 'Cool and light far away, warm and darker near') + scene('#C98B4A', '#6E8FB8', '#D9E4EF', 'Swapped: the depth flattens') + '</div>' };
    }
    if (id === 'contrast') {
      var bgs = ['#C0392B', '#2E8B57', '#2F5FA8', '#E8742C'];
      return { inputs: '', out: '<div class="grid four">' + bgs.map(function (b) {
        return '<div class="sc-box" style="background:' + b + '"><span class="sc-grey"></span></div>'; }).join('') + '</div><p class="muted small">All four small squares are exactly <code>#808080</code>.</p>' };
    }
    if (id === 'mixing') {
      var A = HL.normalizeHex((document.getElementById('dMixA') || {}).value) || '#C0392B';
      var B = HL.normalizeHex((document.getElementById('dMixB') || {}).value) || '#2E8B57';
      var steps = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
      var paint = steps.map(function (t) { return HL.mixPaint(A, B, t); });
      var light = steps.map(function (t) { return HL.mixLight(A, B, t); });
      return { inputs: '<div class="two"><div class="field"><label for="dMixA">Colour A</label><input type="text" id="dMixA" data-demo="mixing" value="' + A + '" maxlength="7" spellcheck="false"></div>' +
        '<div class="field"><label for="dMixB">Colour B</label><input type="text" id="dMixB" data-demo="mixing" value="' + B + '" maxlength="7" spellcheck="false"></div></div>',
        out: '<p class="label">Like paint (pigments)</p><div class="strip tight">' + paint.map(function (h) { return '<span class="sw tall" style="background:' + h + '" title="' + h + '"></span>'; }).join('') + '</div>' +
          '<p class="label">Like light (screens)</p><div class="strip tight">' + light.map(function (h) { return '<span class="sw tall" style="background:' + h + '" title="' + h + '"></span>'; }).join('') + '</div>' +
          '<p class="muted small">Middle of the paint row: <code>' + paint[4] + '</code> · saturation ' + Math.round(HL.hexToHsl(paint[4]).s) + '% (A is ' + Math.round(HL.hexToHsl(A).s) + '%, B is ' + Math.round(HL.hexToHsl(B).s) + '%).</p>' };
    }
    if (id === 'tints') {
      return { inputs: '<p class="muted small">Using your colour from the wheel: <code>' + base + '</code></p>',
        out: '<p class="label">Tints (add white)</p>' + strip(HL.tints(base)) + '<p class="label">Tones (add grey)</p>' + strip(HL.tones(base)) + '<p class="label">Shades (add black)</p>' + strip(HL.shades(base)) };
    }
    if (id === 'underpainting') {
      var g = { hex: '#4A8B3F', medium: 'dry', amount: 65 };
      var mk = function (under, cap) { return '<figure>' + HL.swatchSvg(under ? [{ hex: under, medium: 'dry', amount: 100 }, g] : [g], 200, 130, cap) + '<figcaption>' + cap + '</figcaption></figure>'; };
      return { inputs: '', out: '<div class="grid three demo-trio">' + mk(null, 'No underpainting') + mk('#C8553D', 'Warm red under green') + mk('#8A6BB1', 'Violet under green') + '</div>' +
        '<p><a class="btn primary" href="#/assignments">Try the underpainting assignments ' + icon('arrow', 16) + '</a></p>' };
    }
    return { inputs: '', out: '' };
  }

  v.demoUpdate = function (id) {
    var box = document.querySelector('[data-demo-box="' + id + '"]');
    if (!box) return;
    box.querySelector('.demo-out').innerHTML = demoParts(id).out;
    // refresh the little value read-outs next to range sliders without replacing the sliders themselves
    box.querySelectorAll('input[type=range]').forEach(function (r) { var o = r.parentNode.querySelector('output'); if (o) o.textContent = r.value + (r.id === 'dBasicsH' ? '°' : '%'); });
  };

  v.learn = function (openId) {
    var toc = HL.LESSONS.map(function (l) { return '<a class="chip" href="#/learn?lesson=' + l.id + '">' + esc(l.title) + '</a>'; }).join('');
    var items = HL.LESSONS.map(function (l, i) {
      var p = demoParts(l.demo);
      return '<details class="lesson" id="lesson-' + l.id + '"' + ((openId ? openId === l.id : i === 0) ? ' open' : '') + '><summary><span class="num">' + (i + 1) + '</span><span><b>' + esc(l.title) + '</b><span class="muted small block">' + esc(l.summary) + '</span></span></summary>' +
        '<div class="lesson-body">' + l.body.map(function (t) { return '<p>' + t + '</p>'; }).join('') +
        '<div class="demo" data-demo-box="' + l.demo + '"><div class="demo-in">' + p.inputs + '</div><div class="demo-out">' + p.out + '</div></div></div></details>';
    }).join('');
    return '<div class="page narrow">' + pageHead('Learn', 'Colour theory in eight short lessons', 'Open a lesson, read a few lines, then play with the demo underneath.') +
      '<div class="chips scroll">' + toc + '</div><div class="lessons">' + items + '</div>' +
      '<p class="callout">Models are simplifications. Wheels, harmonies and mixing rules are useful guides, not laws, and real paints vary. Trust your eyes.</p></div>';
  };

  /* ---------- Paint ---------- */
  function regionFinalHex(regionId) {
    return HL.regionFinal(S.tpl, S.regions(), regionId, S.visible);
  }

  function regionListHtml() {
    var tpl = HL.TEMPLATES[S.tpl];
    return tpl.regions.map(function (r) {
      var hex = regionFinalHex(r.id);
      return '<li><button type="button" class="region-btn" data-action="region" data-region="' + r.id + '" aria-pressed="' + (S.selected === r.id) + '">' +
        '<span class="sw" style="background:' + (hex || HL.PAPER) + '"></span><span class="grow">' + esc(r.label) + (r.parent ? ' <small class="muted">on ' + esc(tpl.regions.find(function (x) { return x.id === r.parent; }).label.toLowerCase()) + '</small>' : '') + '</span>' +
        '<code>' + (hex || 'empty') + '</code></button></li>';
    }).join('');
  }

  function regionInfoHtml() {
    if (!S.selected) return '<p class="muted small">Pick a region on the picture or in the list to see its layers.</p>';
    var tpl = HL.TEMPLATES[S.tpl], r = tpl.regions.find(function (x) { return x.id === S.selected; });
    var layers = S.regions()[S.selected] || [];
    var rows = [0, 1, 2].map(function (i) {
      var L = layers[i];
      return '<li>' + (L ? swatch(L.hex) : '<span class="sw empty" aria-hidden="true"></span>') + '<span>Layer ' + (i + 1) + ' · ' + LAYER_NAMES[i] + '</span><code>' + (L ? L.hex + ' · ' + (L.medium === 'dry' ? 'dry ' : 'glaze ') + L.amount + '%' : 'empty') + '</code></li>';
    }).join('');
    var fin = regionFinalHex(S.selected), d = fin ? HL.describe(fin, 'ryb') : null;
    return '<h3>' + esc(r.label) + '</h3><ul class="layer-rows">' + rows + '</ul>' +
      (d ? '<p class="small"><b>Seen from a distance:</b> <code>' + d.hex + '</code> · ' + d.name + ', ' + d.temperature + ', ' + d.value + ', ' + d.saturation + '</p>' : '<p class="muted small">Nothing painted here yet.</p>');
  }

  function taskPanelHtml() {
    var t = S.task ? HL.taskById(S.task) : null;
    if (!t) return '';
    var res = HL.runChecks(t, S.regions());
    var allOk = res.every(function (r) { return r.ok; });
    return '<section class="panel task-panel" aria-labelledby="taskTitle"><p class="eyebrow">Assignment · ' + esc(t.level) + ' · about ' + t.minutes + ' min</p><h2 id="taskTitle">' + esc(t.title) + '</h2>' +
      '<p><b>Goal:</b> ' + esc(t.goal) + '</p><p class="muted">' + esc(t.theory) + '</p>' +
      '<ol class="steps">' + t.steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
      '<h3>Checklist</h3><ul class="checks" id="taskChecks">' + taskChecksHtml(res) + '</ul>' +
      '<div id="taskAfter">' + taskAfterHtml(t, allOk) + '</div>' +
      '<div class="row"><a class="btn ghost sm" href="#/paint" data-action="leave-task">Leave assignment</a></div></section>';
  }
  function taskChecksHtml(res) {
    return res.map(function (r) { return '<li class="' + (r.ok ? 'ok' : '') + '"><span class="tick" aria-hidden="true">' + (r.ok ? icon('check', 16) : '') + '</span><span>' + esc(r.label) + '<span class="sr-only">' + (r.ok ? ' (done)' : ' (not yet)') + '</span></span></li>'; }).join('');
  }
  function taskAfterHtml(t, allOk) {
    return allOk
      ? '<div class="callout ok"><b>Nicely done.</b> Every check is ticked. ' + esc(t.observe) + '<p><b>Think about it:</b> ' + esc(t.reflect) + '</p></div>'
      : '<p class="muted small">Tick every item to unlock the notes on what to look for.</p>';
  }

  v.paint = function () {
    var tplBtns = HL.TEMPLATE_ORDER.map(function (id) { return { action: 'template', value: id, label: HL.TEMPLATES[id].title }; });
    var layerBar = [0, 1, 2].map(function (i) {
      return '<div class="layer-btn"><button type="button" class="layer-pick" data-action="layer" data-value="' + i + '" aria-pressed="' + (S.layer === i) + '">Layer ' + (i + 1) + '<small>' + LAYER_NAMES[i] + '</small></button>' +
        '<button type="button" class="icon-btn eye" data-action="eye" data-value="' + i + '" aria-pressed="' + (S.visible[i] !== false) + '" aria-label="Show layer ' + (i + 1) + '" title="Show or hide layer ' + (i + 1) + '">' + icon('eye', 18) + '</button></div>';
    }).join('');
    return '<div class="page wide">' + pageHead('Paint', 'Colour it in layers', 'Choose a colour and a layer, then click a region. Hide a layer with its eye to see what it contributes.') +
      '<div class="paint-layout"><section class="canvas-col" aria-label="Painting"><div class="task-banner" id="taskBanner" hidden></div><div class="canvas-wrap"><svg id="canvas" class="canvas" viewBox="0 0 400 400" role="img" aria-label="Colouring canvas"></svg></div>' +
      '<div class="row canvas-actions"><button type="button" class="btn sm" data-action="undo">' + icon('undo', 18) + 'Undo</button>' +
      '<button type="button" class="btn sm" data-action="reset-canvas">' + icon('trash', 18) + 'Clear picture</button>' +
      '<button type="button" class="btn sm" data-action="export">' + icon('download', 18) + 'Save as image</button></div>' +
      '<p class="muted small" id="paintHint"></p></section>' +

      '<section class="tools-col"><div id="taskHolder"></div>' +
      '<div class="panel"><h2>Picture</h2>' + seg('Picture', tplBtns, S.tpl, ' id="tplSeg" class="seg wrap"') + '<p class="muted small" id="tplBlurb"></p></div>' +

      '<div class="panel"><h2>Brush colour</h2><div class="row nowrap"><input type="color" id="brushPicker" value="' + S.brush.toLowerCase() + '" aria-label="Pick a brush colour">' +
      '<input type="text" id="brushHex" value="' + S.brush + '" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Brush colour hex"><span class="sw xl" id="brushSwatch" style="background:' + S.brush + '"></span></div>' +
      '<p class="err" id="brushErr" role="alert"></p><ul class="chips-sw dense" id="brushPalette"></ul></div>' +

      '<div class="panel"><h2>Layers</h2><div class="layer-bar" id="layerBar">' + layerBar + '</div>' +
      '<div class="field"><span class="label">Medium</span>' + seg('Medium', [{ action: 'medium', value: 'dry', label: 'Dry brush' }, { action: 'medium', value: 'glaze', label: 'Glaze' }], S.medium, ' id="mediumSeg"') + '<p class="muted small" id="mediumNote"></p></div>' +
      '<div class="field"><label for="amountRange" id="amountLabel">Amount <output id="amountOut">' + S.amount + '%</output></label><input type="range" id="amountRange" min="5" max="100" step="5" value="' + S.amount + '"></div>' +
      '<div class="field"><span class="label">Tool</span>' + seg('Tool', [{ action: 'tool', value: 'paint', label: 'Paint' }, { action: 'tool', value: 'erase', label: 'Erase layer' }, { action: 'tool', value: 'look', label: 'Look' }], S.tool, ' id="toolSeg"') + '</div></div>' +

      '<div class="panel"><h2>Regions</h2><ul class="region-list" id="regionList"></ul><div id="regionInfo" class="region-info"></div></div>' +

      '<details class="panel mixer"><summary><h2>Mixing bowl</h2></summary>' +
      '<div class="two"><div class="field"><label for="mixA">Colour A</label><div class="row nowrap"><input type="text" id="mixA" value="#E07B39" maxlength="7" spellcheck="false"><button type="button" class="btn sm" data-action="mix-from-brush" data-which="A">Use brush</button></div></div>' +
      '<div class="field"><label for="mixB">Colour B</label><div class="row nowrap"><input type="text" id="mixB" value="#2F5FA8" maxlength="7" spellcheck="false"><button type="button" class="btn sm" data-action="mix-from-brush" data-which="B">Use brush</button></div></div></div>' +
      '<div class="field"><label for="mixT">More of B <output id="mixOut">50%</output></label><input type="range" id="mixT" min="0" max="100" step="5" value="50"></div>' +
      '<div id="mixResult"></div></details></section></div></div>';
  };

  // Update only the parts of the paint page that changed, then restore keyboard focus.
  v.paintUpdate = function (fromTyping) {
    var canvas = document.getElementById('canvas');
    if (!canvas) return;
    var active = document.activeElement, keep = active && active.dataset && active.dataset.region ? active.dataset.region : null;
    var tpl = HL.TEMPLATES[S.tpl];

    canvas.innerHTML = HL.canvasInner(S.tpl, S.regions(), { visible: S.visible, selected: S.selected, interactive: true, uid: 'c' });
    canvas.setAttribute('aria-label', 'Colouring canvas: ' + tpl.title);
    document.getElementById('regionList').innerHTML = regionListHtml();
    document.getElementById('regionInfo').innerHTML = regionInfoHtml();
    document.getElementById('tplBlurb').textContent = tpl.blurb;
    document.getElementById('paintHint').textContent = S.tool === 'paint' ? 'Painting on Layer ' + (S.layer + 1) + ' (' + LAYER_NAMES[S.layer] + ') with ' + S.brush + '.'
      : S.tool === 'erase' ? 'Erase: click a region to remove its Layer ' + (S.layer + 1) + '.' : 'Look: click a region to see its layers without changing anything.';

    document.querySelectorAll('#tplSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.value === S.tpl)); });
    document.querySelectorAll('#layerBar .layer-pick').forEach(function (b) { b.setAttribute('aria-pressed', String(Number(b.dataset.value) === S.layer)); });
    document.querySelectorAll('#layerBar .eye').forEach(function (b) {
      var on = S.visible[Number(b.dataset.value)] !== false;
      b.setAttribute('aria-pressed', String(on));
      b.innerHTML = icon(on ? 'eye' : 'eyeoff', 18);
      b.setAttribute('aria-label', (on ? 'Hide' : 'Show') + ' layer ' + (Number(b.dataset.value) + 1));
    });
    document.querySelectorAll('#mediumSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.value === S.medium)); });
    document.querySelectorAll('#toolSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.value === S.tool)); });
    document.getElementById('mediumNote').textContent = S.medium === 'dry'
      ? 'Broken, textured paint. Amount is how much of the surface it covers; the rest lets the layer below show through.'
      : 'A thin transparent wash that multiplies with what is below. Amount is how strong the wash is.';
    document.getElementById('amountOut').textContent = S.amount + '%';
    document.getElementById('amountRange').value = S.amount;

    var brushHex = document.getElementById('brushHex');
    if (!fromTyping) brushHex.value = S.brush;
    document.getElementById('brushPicker').value = S.brush.toLowerCase();
    document.getElementById('brushSwatch').style.background = S.brush;
    document.getElementById('brushPalette').innerHTML = S.brushPalette().map(function (h) {
      return '<li><button type="button" class="chip-sw" data-action="brush" data-hex="' + h + '" aria-pressed="' + (h === S.brush) + '" aria-label="Brush colour ' + h + '" title="' + h + '">' + swatch(h) + '</button></li>';
    }).join('');

    var holder = document.getElementById('taskHolder');
    var t = S.task ? HL.taskById(S.task) : null;
    var banner = document.getElementById('taskBanner');
    if (!banner) { /* older markup: nothing to do */ }
    else if (t && S.tpl === t.template) {
      banner.hidden = false;
      banner.innerHTML = '<span><b>Assignment:</b> ' + esc(t.title) + '</span><button type="button" class="btn sm" data-action="to-task">Steps ' + icon('arrow', 16) + '</button>';
    } else { banner.hidden = true; banner.innerHTML = ''; }
    if (t && S.tpl === t.template) {
      if (!holder.querySelector('.task-panel') || holder.dataset.task !== t.id) { holder.innerHTML = taskPanelHtml(); holder.dataset.task = t.id; }
      var res = HL.runChecks(t, S.regions());
      holder.querySelector('#taskChecks').innerHTML = taskChecksHtml(res);
      var ok = res.every(function (r) { return r.ok; });
      holder.querySelector('#taskAfter').innerHTML = taskAfterHtml(t, ok);
      if (ok && !S.done[t.id]) { S.done[t.id] = true; S.save(); v.onTaskDone && v.onTaskDone(t); }
    } else {
      holder.innerHTML = t ? '<div class="callout">This assignment uses the “' + esc(HL.TEMPLATES[t.template].title) + '” picture. <button type="button" class="btn sm" data-action="template" data-value="' + t.template + '">Switch to it</button></div>' : '';
      holder.dataset.task = '';
    }
    v.mixUpdate();

    if (keep) { var again = document.querySelector('.region-btn[data-region="' + keep + '"]'); if (again) again.focus(); }
  };

  v.mixUpdate = function () {
    var a = document.getElementById('mixA');
    if (!a) return;
    var A = HL.normalizeHex(a.value), B = HL.normalizeHex(document.getElementById('mixB').value);
    var t = Number(document.getElementById('mixT').value) / 100;
    document.getElementById('mixOut').textContent = Math.round(t * 100) + '%';
    if (!A || !B) { document.getElementById('mixResult').innerHTML = '<p class="err">Enter two valid hex codes.</p>'; return; }
    var p = HL.mixPaint(A, B, t), l = HL.mixLight(A, B, t);
    document.getElementById('mixResult').innerHTML = '<div class="mix-row">' + swatch(A, 'lg') + '<span aria-hidden="true">+</span>' + swatch(B, 'lg') + '<span aria-hidden="true">=</span>' + swatch(p, 'xl') +
      '<div><b>Paint-like mix</b><br><code>' + p + '</code> · saturation ' + Math.round(HL.hexToHsl(p).s) + '%</div></div>' +
      '<p class="muted small">If it were light instead of paint: <code>' + l + '</code>. Paint mixing here is an approximation of real pigments.</p>' +
      '<button type="button" class="btn primary sm" data-action="use-mix" data-hex="' + p + '">Use this mix as my brush</button>';
  };

  /* ---------- Assignments ---------- */
  v.assignments = function () {
    var cards = HL.TASKS.map(function (t, i) {
      var done = S.done[t.id];
      return '<article class="card task-card"><div class="row between"><span class="pill">' + esc(t.level) + '</span><span class="muted small">≈ ' + t.minutes + ' min</span></div>' +
        '<h3>' + (i + 1) + '. ' + esc(t.title) + (done ? ' <span class="done-badge">' + icon('check', 14) + ' Done</span>' : '') + '</h3>' +
        '<p>' + esc(t.goal) + '</p><p class="muted small">Picture: ' + esc(HL.TEMPLATES[t.template].title) + '</p>' +
        '<div class="strip tight small-sw">' + t.palette.map(function (h) { return '<span class="sw" style="background:' + h + '" title="' + h + '"></span>'; }).join('') + '</div>' +
        '<a class="btn primary" href="#/paint?task=' + t.id + '">' + (done ? 'Try again' : 'Start') + ' ' + icon('arrow', 18) + '</a></article>';
    }).join('');
    var n = Object.keys(S.done).length;
    return '<div class="page">' + pageHead('Assignments', 'Practise what you learn', 'Each assignment sets a small painting challenge with a live checklist. It checks your colour choices, not your drawing skill.') +
      '<p class="progress">' + n + ' of ' + HL.TASKS.length + ' completed</p><div class="grid three">' + cards + '</div>' +
      '<p class="callout">Techniques like a warm underpainting or a violet start for skin are traditions many painters use, not rules. The point of each assignment is to compare and decide for yourself.</p></div>';
  };

  v.notFound = function () {
    return '<div class="page narrow"><div class="empty"><h2>That page could not be found</h2><p>It may have moved, or the link may be incomplete.</p><a class="btn primary" href="#/">Return home</a></div></div>';
  };
})();
