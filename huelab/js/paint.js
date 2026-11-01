/* =====================================================================
   HUELAB: painting renderer.
   Each region can hold up to three layers. A layer is one of two media:
   - "Dry brush": broken, textured coverage. Gaps let the layer below show
     through, like scumbled or dry-brushed paint. Amount = how much covers.
   - "Glaze": a thin transparent wash that multiplies with what is below,
     like watercolour or a transparent oil glaze. Amount = strength.
   ===================================================================== */
(function () {
  var HL = (globalThis.HL = globalThis.HL || {});
  var PAPER = '#FFFDF8';
  var SIZE = 400;

  // z-values for the normal curve, used to turn "coverage %" into a noise threshold
  var Z = { 5: -1.645, 10: -1.282, 15: -1.036, 20: -0.842, 25: -0.674, 30: -0.524, 35: -0.385, 40: -0.253, 45: -0.126, 50: 0,
    55: 0.126, 60: 0.253, 65: 0.385, 70: 0.524, 75: 0.674, 80: 0.842, 85: 1.036, 90: 1.282, 95: 1.645 };

  // One noise filter per coverage level and layer, so each layer has its own brush pattern.
  HL.filterDefs = function () {
    var out = '';
    for (var cov = 5; cov <= 95; cov += 5) {
      for (var i = 0; i < 3; i++) {
        var t = 0.5 - 0.12 * Z[cov], k = 20, b = (0.5 - k * t).toFixed(3);
        var freq = [['0.045 0.2', '0.06 0.18', '0.035 0.24'][i]];
        out += '<filter id="dry-' + cov + '-' + i + '" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
          '<feTurbulence type="fractalNoise" baseFrequency="' + freq + '" numOctaves="3" seed="' + (7 + i * 11) + '" result="n"/>' +
          '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ' + k + ' 0 0 0 ' + b + '" result="m"/>' +
          '<feComposite in="SourceGraphic" in2="m" operator="in"/></filter>';
      }
    }
    return out;
  };

  function layerRect(L, i, clipId, w, h) {
    var clip = clipId ? ' clip-path="url(#' + clipId + ')"' : '';
    var amt = HL.clamp(Math.round(L.amount), 1, 100);
    var base = '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="' + L.hex + '"';
    if (L.medium === 'glaze') return base + ' opacity="' + (amt / 100).toFixed(2) + '" style="mix-blend-mode:multiply"' + clip + '/>';
    if (amt >= 98) return base + clip + '/>';
    var cov = HL.clamp(Math.round(amt / 5) * 5, 5, 95);
    return base + ' filter="url(#dry-' + cov + '-' + i + ')"' + clip + '/>';
  }

  // A small flat swatch with layers, used in lessons. layers: [{hex, medium, amount}|null, ...]
  HL.swatchSvg = function (layers, w, h, label) {
    var inner = '<rect width="' + w + '" height="' + h + '" fill="' + PAPER + '"/>';
    layers.forEach(function (L, i) { if (L) inner += layerRect(L, i, null, w, h); });
    return '<svg class="swatch-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + (label || 'Colour sample') + '" preserveAspectRatio="none">' + inner + '</svg>';
  };

  /* Full canvas markup (the inside of the <svg>), without the surrounding svg tag.
     opts: { visible: [bool,bool,bool], selected: regionId, interactive: bool, uid: string, forExport: bool } */
  HL.canvasInner = function (tplId, regions, opts) {
    opts = opts || {};
    var tpl = HL.TEMPLATES[tplId], uid = opts.uid || tplId, vis = opts.visible || [true, true, true];
    var defs = '', body = '', hits = '', select = '';

    function clipId(id) { return 'clip-' + uid + '-' + id; }

    tpl.regions.forEach(function (r) {
      var extra = r.parent ? { 'clip-path': 'url(#' + clipId(r.parent) + ')' } : null;
      defs += '<clipPath id="' + clipId(r.id) + '">' + HL.shapeSvg(r.shape, extra) + '</clipPath>';
    });

    // Each region is drawn as: its paper, its paint layers, then its outline.
    // Drawing the outline straight after the fill means shapes in front correctly cover the outlines of shapes behind them.
    tpl.regions.forEach(function (r) {
      var cid = clipId(r.id);
      if (!r.parent) body += '<rect x="0" y="0" width="' + SIZE + '" height="' + SIZE + '" fill="' + PAPER + '" clip-path="url(#' + cid + ')"/>';
      var layers = regions[r.id] || [];
      layers.forEach(function (L, i) { if (L && vis[i] !== false) body += layerRect(L, i, cid, SIZE, SIZE); });

      var oExtra = { fill: 'none', stroke: '#2B2824', 'stroke-width': 2.4, 'stroke-linejoin': 'round' };
      if (r.parent) oExtra['clip-path'] = 'url(#' + clipId(r.parent) + ')';
      body += HL.shapeSvg(r.shape, oExtra);

      if (opts.interactive) {
        var hExtra = { fill: 'transparent', 'pointer-events': 'all', 'data-region': r.id, class: 'hit' };
        if (r.parent) hExtra['clip-path'] = 'url(#' + clipId(r.parent) + ')';
        hits += HL.shapeSvg(r.shape, hExtra);
      }
      if (opts.selected === r.id) {
        var sExtra = { fill: 'none', stroke: '#E8742C', 'stroke-width': 3.5, 'stroke-dasharray': '7 5', 'pointer-events': 'none', class: 'sel' };
        if (r.parent) sExtra['clip-path'] = 'url(#' + clipId(r.parent) + ')';
        select += HL.shapeSvg(r.shape, sExtra);
      }
    });

    var lines = (tpl.lines || []).map(function (l) {
      return HL.shapeSvg(l, { fill: 'none', stroke: '#2B2824', 'stroke-width': 2.2, 'stroke-linecap': 'round' });
    }).join('');

    return '<defs>' + defs + '</defs>' +
      '<rect x="0" y="0" width="' + SIZE + '" height="' + SIZE + '" fill="' + PAPER + '"/>' +
      body + '<g>' + lines + '</g>' + hits + select;
  };

  // Export the painting as a PNG blob. Includes the brush filters so textures survive.
  HL.exportPng = function (tplId, regions, visible, px) {
    px = px || 1000;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + px + '" height="' + px + '" viewBox="0 0 400 400">' +
      '<defs>' + HL.filterDefs() + '</defs>' + HL.canvasInner(tplId, regions, { visible: visible, uid: 'x' }) + '</svg>';
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      img.onload = function () {
        var c = document.createElement('canvas');
        c.width = px; c.height = px;
        c.getContext('2d').drawImage(img, 0, 0, px, px);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error('Could not create the image')); }, 'image/png');
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not draw the painting')); };
      img.src = url;
    });
  };

  HL.PAPER = PAPER;
})();
