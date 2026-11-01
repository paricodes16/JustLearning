/* =====================================================================
   HUELAB: colour maths. No browser code here, so it can be tested in Node.

   Two colour wheels are supported:
   - "ryb": the traditional PAINTER'S wheel (red, yellow, blue primaries).
            Red's opposite is green, blue's is orange, yellow's is violet.
   - "rgb": the SCREEN / light wheel (hue angle as used by hex and HSL).
            Red's opposite is cyan, blue's is yellow.
   Neither is "the true one". They are models, each useful for different things.
   ===================================================================== */
(function () {
  var HL = (globalThis.HL = globalThis.HL || {});

  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function mod(n, m) { return ((n % m) + m) % m; }
  HL.clamp = clamp;
  HL.mod = mod;

  /* ---------- Hex, RGB, HSL ---------- */

  // Accepts "#abc", "abc", "#AABBCC", "aabbcc". Returns "#AABBCC" or null.
  HL.normalizeHex = function (input) {
    var s = String(input == null ? '' : input).trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(s)) s = s.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-f]{6}$/i.test(s)) return null;
    return '#' + s.toUpperCase();
  };

  HL.hexToRgb = function (hex) {
    var h = HL.normalizeHex(hex);
    if (!h) return null;
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  };

  HL.rgbToHex = function (rgb) {
    return '#' + rgb.map(function (v) { return clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'); }).join('').toUpperCase();
  };

  // h: 0-360, s and l: 0-100
  HL.rgbToHsl = function (rgb) {
    var r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    var l = (max + min) / 2, h = 0, s = 0;
    if (d) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: h, s: s * 100, l: l * 100 };
  };

  HL.hslToRgb = function (hsl) {
    var h = mod(hsl.h, 360) / 360, s = clamp(hsl.s, 0, 100) / 100, l = clamp(hsl.l, 0, 100) / 100;
    if (!s) { var v = l * 255; return [v, v, v]; }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    function f(t) {
      t = mod(t, 1);
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
  };

  HL.hexToHsl = function (hex) { return HL.rgbToHsl(HL.hexToRgb(hex)); };
  HL.hslToHex = function (hsl) { return HL.rgbToHex(HL.hslToRgb(hsl)); };

  /* ---------- Painter's (RYB) wheel mapping ---------- */
  // Anchor pairs: [angle on the painter's wheel, HSL hue]. Red, orange, yellow, green, blue and violet sit 60 degrees apart.
  var ANCHORS = [[0, 0], [60, 30], [120, 60], [180, 120], [240, 225], [300, 275], [360, 360]];

  function interp(x, from, to) {
    for (var i = 0; i < ANCHORS.length - 1; i++) {
      var a = ANCHORS[i], b = ANCHORS[i + 1];
      if (x >= a[from] && x <= b[from]) return a[to] + (x - a[from]) * (b[to] - a[to]) / (b[from] - a[from]);
    }
    return x;
  }
  HL.rybToHue = function (angle) { return mod(interp(mod(angle, 360), 0, 1), 360); };
  HL.hueToRyb = function (hue) { return mod(interp(mod(hue, 360), 1, 0), 360); };

  // Angle on the chosen wheel <-> HSL hue
  HL.hueToAngle = function (hue, mode) { return mode === 'ryb' ? HL.hueToRyb(hue) : mod(hue, 360); };
  HL.angleToHue = function (angle, mode) { return mode === 'ryb' ? HL.rybToHue(angle) : mod(angle, 360); };

  /* ---------- Names and descriptions ---------- */

  var NAMES = ['Red', 'Red-orange', 'Orange', 'Yellow-orange', 'Yellow', 'Yellow-green', 'Green', 'Blue-green', 'Blue', 'Blue-violet', 'Violet', 'Red-violet'];

  var SCREEN_NAMES = ['Red', 'Orange', 'Yellow', 'Chartreuse', 'Green', 'Spring green', 'Cyan', 'Azure', 'Blue', 'Violet', 'Magenta', 'Rose'];

  // mode 'ryb' (default) names hues the painter's way; 'rgb' names them by screen hue.
  HL.hueName = function (hex, mode) {
    var hsl = HL.hexToHsl(hex);
    if (hsl.l < 8) return 'Black';
    if (hsl.l > 96) return 'White';
    if (hsl.s < 9) return hsl.l < 30 ? 'Dark grey' : hsl.l > 75 ? 'Light grey' : 'Grey';
    if (mode === 'rgb') return SCREEN_NAMES[Math.round(hsl.h / 30) % 12];
    return NAMES[Math.round(HL.hueToRyb(hsl.h) / 30) % 12];
  };

  // Warm / cool by position on the painter's wheel
  HL.temperature = function (hex) {
    var hsl = HL.hexToHsl(hex);
    if (hsl.s < 9) return 'neutral';
    var a = HL.hueToRyb(hsl.h);
    if (a <= 125 || a >= 330) return 'warm';
    if (a >= 165 && a < 300) return 'cool';
    return 'in-between';
  };

  /* ---------- Luminance and contrast ---------- */

  function toLinear(c) { c = c / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function toSrgb(v) { v = clamp(v, 0, 1); return 255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055); }
  HL.luminance = function (hex) {
    var c = HL.hexToRgb(hex);
    return 0.2126 * toLinear(c[0]) + 0.7152 * toLinear(c[1]) + 0.0722 * toLinear(c[2]);
  };
  HL.contrast = function (a, b) {
    var la = HL.luminance(a), lb = HL.luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  HL.describe = function (hex, mode) {
    hex = HL.normalizeHex(hex);
    var rgb = HL.hexToRgb(hex), hsl = HL.rgbToHsl(rgb);
    var value = hsl.l < 20 ? 'very dark' : hsl.l < 40 ? 'dark' : hsl.l < 62 ? 'medium' : hsl.l < 82 ? 'light' : 'very light';
    var sat = hsl.s < 12 ? 'neutral' : hsl.s < 40 ? 'muted' : hsl.s < 70 ? 'moderate' : 'vivid';
    var cw = HL.contrast(hex, '#FFFFFF'), cb = HL.contrast(hex, '#000000');
    return {
      hex: hex, rgb: rgb, hsl: hsl, name: HL.hueName(hex, mode), temperature: HL.temperature(hex), value: value, saturation: sat,
      contrastWhite: cw, contrastBlack: cb, bestText: cw >= cb ? '#FFFFFF' : '#000000'
    };
  };

  /* ---------- Harmonies ---------- */

  HL.SCHEMES = {
    complementary: { label: 'Complementary', offsets: [0, 180], roles: ['Base', 'Complement'],
      what: 'Two colours directly opposite each other.',
      use: 'Maximum contrast. Let one colour dominate and use the other as a small accent. Side by side they intensify each other; mixed together they dull each other.' },
    split: { label: 'Split-complementary', offsets: [0, 150, 210], roles: ['Base', 'Split A', 'Split B'],
      what: 'A base colour plus the two neighbours of its complement.',
      use: 'Strong contrast with less tension than a straight complement. A good first scheme for beginners.' },
    analogous: { label: 'Analogous', offsets: [-30, 0, 30], roles: ['Left neighbour', 'Base', 'Right neighbour'],
      what: 'Three colours side by side on the wheel.',
      use: 'Calm and harmonious, like a sunset or a forest. Add contrast in value (light and dark) so it does not go flat.' },
    triadic: { label: 'Triadic', offsets: [0, 120, 240], roles: ['Base', 'Triad 2', 'Triad 3'],
      what: 'Three colours evenly spaced around the wheel.',
      use: 'Lively and balanced. Choose one to dominate and use the others in smaller amounts.' },
    square: { label: 'Square (tetradic)', offsets: [0, 90, 180, 270], roles: ['Base', '+90°', 'Complement', '+270°'],
      what: 'Four colours evenly spaced.',
      use: 'Rich and varied, but easy to overdo. Let one colour lead and vary the saturation of the rest.' },
    rectangle: { label: 'Rectangle (tetradic)', offsets: [0, 60, 180, 240], roles: ['Base', '+60°', 'Complement', '+240°'],
      what: 'Two complementary pairs.',
      use: 'A wide palette with built-in contrast. Treat it as two pairs and keep one pair quieter.' },
    monochromatic: { label: 'Monochromatic', offsets: [0], roles: [], mono: true,
      what: 'One hue in different lightness levels.',
      use: 'Unified and elegant. Value contrast carries the picture, so squint to check that the lights and darks read clearly.' }
  };

  // Returns [{hex, role, angle}] where angle is the position on the chosen wheel.
  HL.scheme = function (hex, type, mode) {
    var def = HL.SCHEMES[type];
    var base = HL.hexToHsl(hex);
    var baseAngle = HL.hueToAngle(base.h, mode);
    if (def.mono) {
      return [18, 34, 50, 66, 82].map(function (l, i) {
        return { hex: HL.hslToHex({ h: base.h, s: base.s, l: l }), role: ['Darkest', 'Dark', 'Mid', 'Light', 'Lightest'][i], angle: baseAngle };
      });
    }
    return def.offsets.map(function (off, i) {
      var ang = mod(baseAngle + off, 360);
      return { hex: HL.hslToHex({ h: HL.angleToHue(ang, mode), s: base.s, l: base.l }), role: def.roles[i], angle: ang };
    });
  };

  HL.complement = function (hex, mode) { return HL.scheme(hex, 'complementary', mode)[1].hex; };

  /* ---------- Tints, tones, shades ---------- */

  function lerpSrgb(a, b, t) {
    var x = HL.hexToRgb(a), y = HL.hexToRgb(b);
    return HL.rgbToHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
  }
  HL.tints = function (hex, n) { n = n || 5; var o = []; for (var i = 1; i <= n; i++) o.push(lerpSrgb(hex, '#FFFFFF', i / (n + 1))); return o; };
  HL.tones = function (hex, n) { n = n || 5; var o = []; for (var i = 1; i <= n; i++) o.push(lerpSrgb(hex, '#808080', i / (n + 1))); return o; };
  HL.shades = function (hex, n) { n = n || 5; var o = []; for (var i = 1; i <= n; i++) o.push(lerpSrgb(hex, '#000000', i / (n + 1))); return o; };

  /* ---------- Mixing ---------- */

  // Paint-like (subtractive) mixing: a weighted geometric mean in linear light.
  // It is an APPROXIMATION. Real pigments differ, but it behaves like paint:
  // blue + yellow gives green, and complements mix to muted browns and greys.
  HL.mixPaint = function (a, b, t) {
    var x = HL.hexToRgb(a), y = HL.hexToRgb(b);
    return HL.rgbToHex(x.map(function (_, i) {
      var la = Math.max(toLinear(x[i]), 0.0015), lb = Math.max(toLinear(y[i]), 0.0015);
      return toSrgb(Math.exp((1 - t) * Math.log(la) + t * Math.log(lb)));
    }));
  };

  // Light-like (additive) mixing: a straight blend in linear light. Used for tiny dabs seen from a distance.
  HL.mixLight = function (a, b, t) {
    var x = HL.hexToRgb(a), y = HL.hexToRgb(b);
    return HL.rgbToHex(x.map(function (_, i) { return toSrgb((1 - t) * toLinear(x[i]) + t * toLinear(y[i])); }));
  };

  // A thin transparent glaze of `top` over `under`. strength 0..1
  HL.glaze = function (under, top, strength) {
    var x = HL.hexToRgb(under), y = HL.hexToRgb(top);
    return HL.rgbToHex(x.map(function (_, i) {
      var lu = Math.max(toLinear(x[i]), 0.0015), lt = Math.max(toLinear(y[i]), 0.0015);
      return toSrgb(Math.pow(lu, 1 - strength) * Math.pow(lt, strength));
    }));
  };

  // Layers are painted bottom to top: [{hex, medium: 'dry' | 'glaze', amount: 1-100} | null, ...]
  // Returns the average colour you would see from a distance, or null if nothing is painted.
  HL.composite = function (layers, visible) {
    var cur = '#FFFFFF', any = false;
    (layers || []).forEach(function (L, i) {
      if (!L || (visible && visible[i] === false)) return;
      any = true;
      var k = clamp(L.amount, 1, 100) / 100;
      cur = L.medium === 'glaze' ? HL.glaze(cur, L.hex, k) : HL.mixLight(cur, L.hex, k);
    });
    return any ? cur : null;
  };

  /* ---------- Small helpers used by assignments ---------- */

  // Is hue h inside the range from..to (degrees, wrapping allowed)?
  HL.inHue = function (h, from, to) {
    h = mod(h, 360); from = mod(from, 360); to = mod(to, 360);
    return from <= to ? h >= from && h <= to : h >= from || h <= to;
  };
  // Shortest distance between two angles
  HL.angleDiff = function (a, b) { var d = Math.abs(mod(a, 360) - mod(b, 360)); return d > 180 ? 360 - d : d; };
})();
