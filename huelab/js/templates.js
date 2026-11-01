/* =====================================================================
   HUELAB: colouring templates. Each template is a list of regions drawn
   back to front (later regions sit on top and receive clicks first).
   A region with a "parent" is clipped to that parent's shape, so shading,
   cheeks and highlights always stay inside the thing they belong to.
   All drawings are original and drawn from simple shapes.
   ===================================================================== */
(function () {
  var HL = (globalThis.HL = globalThis.HL || {});

  var P = function (d) { return { t: 'path', d: d }; };
  var E = function (cx, cy, rx, ry, transform) { var o = { t: 'ellipse', cx: cx, cy: cy, rx: rx, ry: ry }; if (transform) o.transform = transform; return o; };
  var C = function (cx, cy, r) { return { t: 'circle', cx: cx, cy: cy, r: r }; };
  var R = function (x, y, w, h) { return { t: 'rect', x: x, y: y, width: w, height: h }; };

  // Turn a shape object into SVG markup, adding any extra attributes
  HL.shapeSvg = function (shape, extra) {
    var s = '<' + shape.t;
    Object.keys(shape).forEach(function (k) { if (k !== 't') s += ' ' + k + '="' + shape[k] + '"'; });
    Object.keys(extra || {}).forEach(function (k) { s += ' ' + k + '="' + extra[k] + '"'; });
    return s + '/>';
  };

  HL.TEMPLATES = {
    landscape: {
      id: 'landscape', title: 'Hills and a tree',
      blurb: 'A simple landscape: sky, sun, two hills, a tree. Good for warm and cool colours, depth and greens.',
      regions: [
        { id: 'sky', label: 'Sky', shape: R(0, 0, 400, 400) },
        { id: 'sun', label: 'Sun', shape: C(305, 100, 38) },
        { id: 'farHills', label: 'Far hills', shape: P('M0 250 C 60 190 120 200 180 235 C 230 200 300 175 400 240 L400 400 L0 400 Z') },
        { id: 'field', label: 'Near field', shape: P('M0 330 C 80 270 200 290 260 310 C 320 325 360 300 400 285 L400 400 L0 400 Z') },
        { id: 'trunk', label: 'Tree trunk', shape: P('M120 345 C 124 305 128 262 130 222 L148 222 C 148 262 152 305 160 345 Z') },
        { id: 'foliage', label: 'Foliage', shape: P('M86 218 C 56 190 76 148 112 156 C 112 118 172 110 188 148 C 222 140 244 182 218 206 C 224 238 168 248 146 230 C 122 250 80 242 86 218 Z') }
      ],
      lines: []
    },

    stilllife: {
      id: 'stilllife', title: 'Apple on a table',
      blurb: 'A still life: wall, table, apple, leaf and a cast shadow. Good for shadows, red and green, and muted backgrounds.',
      regions: [
        { id: 'wall', label: 'Wall', shape: R(0, 0, 400, 262) },
        { id: 'table', label: 'Table', shape: R(0, 262, 400, 138) },
        { id: 'shadow', label: 'Cast shadow', parent: 'table', shape: E(222, 322, 112, 18) },
        { id: 'apple', label: 'Apple', shape: P('M200 162 C 175 135 118 150 115 222 C 112 285 160 322 200 308 C 240 322 288 285 285 222 C 282 150 225 135 200 162 Z') },
        { id: 'appleShade', label: 'Apple shadow side', parent: 'apple', shape: E(282, 232, 62, 110) },
        { id: 'highlight', label: 'Highlight', parent: 'apple', shape: E(152, 205, 13, 30, 'rotate(-18 152 205)') },
        { id: 'stem', label: 'Stem', shape: P('M198 165 C 196 145 200 130 212 118 L 221 124 C 210 134 207 148 209 166 Z') },
        { id: 'leaf', label: 'Leaf', shape: P('M218 128 C 234 96 284 84 314 98 C 304 136 254 156 222 138 Z') }
      ],
      lines: []
    },

    portrait: {
      id: 'portrait', title: 'Simple portrait',
      blurb: 'A front-facing face with hair and a shirt. Good for skin tones, cool and warm shadows and underpainting.',
      regions: [
        { id: 'backdrop', label: 'Background', shape: R(0, 0, 400, 400) },
        { id: 'hairBack', label: 'Hair (back)', shape: P('M118 190 C 100 100 160 56 200 56 C 245 56 302 100 284 190 C 292 235 282 275 268 292 L132 292 C 118 275 108 235 118 190 Z') },
        { id: 'neck', label: 'Neck', shape: P('M170 240 L170 318 C 186 334 214 334 230 318 L230 240 Z') },
        { id: 'neckShadow', label: 'Under-chin shadow', parent: 'neck', shape: E(200, 258, 56, 36) },
        { id: 'shirt', label: 'Shirt', shape: P('M50 400 C 60 345 110 322 165 314 C 185 336 215 336 235 314 C 290 322 340 345 350 400 Z') },
        { id: 'face', label: 'Face', shape: P('M140 150 C 140 105 170 88 200 88 C 232 88 262 105 262 150 C 262 205 238 262 200 262 C 164 262 140 205 140 150 Z') },
        { id: 'faceShade', label: 'Face shadow side', parent: 'face', shape: E(268, 172, 40, 112) },
        { id: 'fringe', label: 'Fringe', shape: P('M138 152 C 134 100 170 78 205 80 C 242 82 268 104 262 152 C 252 122 228 108 198 108 C 168 108 148 124 138 152 Z') },
        { id: 'cheekL', label: 'Left cheek', parent: 'face', shape: C(170, 198, 15) },
        { id: 'cheekR', label: 'Right cheek', parent: 'face', shape: C(232, 198, 15) },
        { id: 'eyeL', label: 'Left eye', shape: E(177, 162, 10, 5.5) },
        { id: 'eyeR', label: 'Right eye', shape: E(224, 162, 10, 5.5) },
        { id: 'lips', label: 'Lips', shape: P('M178 232 C 188 225 195 227 201 230 C 207 227 214 225 224 232 C 214 246 188 246 178 232 Z') }
      ],
      lines: [
        P('M201 172 C 197 190 194 202 200 206 C 205 208 210 205 208 201'),
        P('M180 233 C 192 237 210 237 222 233'),
        P('M164 146 C 172 140 184 140 190 145'),
        P('M212 145 C 218 140 230 140 238 146')
      ]
    }
  };

  HL.TEMPLATE_ORDER = ['landscape', 'stilllife', 'portrait'];
})();
