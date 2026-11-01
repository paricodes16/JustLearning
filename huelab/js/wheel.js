/* HUELAB: draws the interactive colour wheel as SVG. Angle 0 is at the top, increasing clockwise. */
(function () {
  var HL = (globalThis.HL = globalThis.HL || {});
  var CX = 200, CY = 200, R_OUT = 170, R_IN = 108, R_MID = 139;

  function pt(r, deg) {
    var a = deg * Math.PI / 180;
    return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
  }
  function f(n) { return n.toFixed(2); }

  var LABELS = {
    ryb: [[0, 'Red'], [60, 'Orange'], [120, 'Yellow'], [180, 'Green'], [240, 'Blue'], [300, 'Violet']],
    rgb: [[0, 'Red'], [60, 'Yellow'], [120, 'Green'], [180, 'Cyan'], [240, 'Blue'], [300, 'Magenta']]
  };

  // base: hex of the chosen colour; mode: 'ryb' | 'rgb'; scheme: key of HL.SCHEMES
  HL.wheelSvg = function (base, mode, scheme) {
    var segs = '', step = 5;
    for (var a = 0; a < 360; a += step) {
      var p1 = pt(R_OUT, a), p2 = pt(R_OUT, a + step + 0.4), p3 = pt(R_IN, a + step + 0.4), p4 = pt(R_IN, a);
      var fill = HL.hslToHex({ h: HL.angleToHue(a + step / 2, mode), s: 88, l: 52 });
      segs += '<path d="M' + f(p1[0]) + ' ' + f(p1[1]) + ' A' + R_OUT + ' ' + R_OUT + ' 0 0 1 ' + f(p2[0]) + ' ' + f(p2[1]) +
        ' L' + f(p3[0]) + ' ' + f(p3[1]) + ' A' + R_IN + ' ' + R_IN + ' 0 0 0 ' + f(p4[0]) + ' ' + f(p4[1]) + ' Z" fill="' + fill + '"/>';
    }

    var labels = LABELS[mode].map(function (l) {
      var p = pt(R_OUT + 20, l[0]);
      return '<text x="' + f(p[0]) + '" y="' + f(p[1]) + '" text-anchor="middle" dominant-baseline="middle" class="wheel-label">' + l[1] + '</text>';
    }).join('');

    var colours = HL.scheme(base, scheme, mode);
    var mono = HL.SCHEMES[scheme].mono;
    var points = colours.map(function (c) { return pt(R_MID, c.angle); });

    var chords = '';
    if (!mono && points.length > 1) {
      var path = points.map(function (p, i) { return (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1]); }).join(' ');
      chords = '<path d="' + path + (points.length > 2 ? ' Z' : '') + '" class="wheel-chord"/>';
    }

    var markers = '';
    if (mono) {
      var bp = points[0];
      markers = '<circle cx="' + f(bp[0]) + '" cy="' + f(bp[1]) + '" r="20" fill="' + base + '" class="wheel-marker base"/>';
    } else {
      colours.forEach(function (c, i) {
        var p = points[i], isBase = i === (scheme === 'analogous' ? 1 : 0);
        markers += '<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="' + (isBase ? 20 : 15) + '" fill="' + c.hex + '" class="wheel-marker' + (isBase ? ' base' : '') + '"/>';
      });
    }

    var d = HL.describe(base, mode);
    var centre = '<circle cx="' + CX + '" cy="' + CY + '" r="76" fill="' + d.hex + '" class="wheel-centre"/>' +
      '<text x="' + CX + '" y="' + (CY - 6) + '" text-anchor="middle" fill="' + d.bestText + '" class="wheel-hex">' + d.hex + '</text>' +
      '<text x="' + CX + '" y="' + (CY + 18) + '" text-anchor="middle" fill="' + d.bestText + '" class="wheel-name">' + d.name + '</text>';

    return '<svg class="wheel-svg" viewBox="-30 -30 460 460" aria-hidden="true" focusable="false">' +
      '<g>' + segs + '</g>' + labels + chords + markers + centre + '</svg>';
  };

  // Convert a pointer position inside the wheel's box to an angle (degrees, 0 = top, clockwise)
  HL.pointerAngle = function (clientX, clientY, rect) {
    var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    var deg = Math.atan2(clientX - cx, -(clientY - cy)) * 180 / Math.PI;
    return HL.mod(deg, 360);
  };
})();
