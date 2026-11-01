/* =====================================================================
   HUELAB: app logic. Routing, clicks, typing, dragging the wheel.
   Pages use "#/..." addresses so they work on GitHub Pages as-is.
   ===================================================================== */
(function () {
  var HL = globalThis.HL, S = HL.S, v = HL.views, icon = HL.icon;
  var $ = function (sel) { return document.querySelector(sel); };
  var main = $('#main');

  var NAV = [
    { id: 'home', label: 'Home', icon: 'home', href: '#/' },
    { id: 'wheel', label: 'Wheel', icon: 'wheel', href: '#/wheel' },
    { id: 'learn', label: 'Learn', icon: 'book', href: '#/learn' },
    { id: 'paint', label: 'Paint', icon: 'brush', href: '#/paint' },
    { id: 'assignments', label: 'Tasks', icon: 'tasks', href: '#/assignments' }
  ];
  var TITLES = { '': 'Home', wheel: 'Colour wheel', learn: 'Learn', paint: 'Paint', assignments: 'Assignments' };

  function buildNav() {
    var html = NAV.map(function (n) { return '<a href="' + n.href + '" data-nav="' + n.id + '">' + icon(n.icon, 22) + '<span>' + n.label + '</span></a>'; }).join('');
    $('#navTop').innerHTML = html;
    $('#navBottom').innerHTML = html;
  }

  function setActiveNav(seg) {
    var active = seg === '' ? 'home' : seg;
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.dataset.nav === active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  /* ---------- toast and dialog ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  var dlg = $('#dlg');
  function confirmDialog(title, body, confirmLabel) {
    return new Promise(function (resolve) {
      $('#dlgBody').innerHTML = '<h2 id="dlgTitle">' + HL.esc(title) + '</h2><p>' + HL.esc(body) + '</p>' +
        '<div class="dlg-actions"><button type="button" class="btn" id="dlgNo">Cancel</button><button type="button" class="btn danger" id="dlgYes">' + HL.esc(confirmLabel) + '</button></div>';
      var done = function (val) { dlg.close(); resolve(val); };
      $('#dlgNo').onclick = function () { done(false); };
      $('#dlgYes').onclick = function () { done(true); };
      dlg.oncancel = function () { resolve(false); };
      dlg.showModal();
      $('#dlgNo').focus();
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); } catch (e) { reject(e); }
      document.body.removeChild(ta);
    });
  }

  function download(blob, name) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ---------- router ---------- */
  function route() {
    var raw = location.hash.slice(1) || '/';
    var parts = raw.split('?'), path = parts[0].replace(/\/+$/, '') || '/';
    var query = new URLSearchParams(parts[1] || '');
    var seg = path.split('/')[1] || '';
    var html, after = null;

    if (path === '/') html = v.home();
    else if (path === '/wheel') { html = v.wheel(); after = v.wheelUpdate; }
    else if (path === '/learn') {
      var open = query.get('lesson');
      html = v.learn(HL.LESSONS.some(function (l) { return l.id === open; }) ? open : null);
      after = function () { if (open) { var el = document.getElementById('lesson-' + open); if (el) el.scrollIntoView({ block: 'start' }); } };
    }
    else if (path === '/paint') {
      var task = HL.taskById(query.get('task') || '');
      if (task) { S.task = task.id; S.tpl = task.template; S.selected = null; S.save(); }
      html = v.paint();
      after = v.paintUpdate;
    }
    else if (path === '/assignments') html = v.assignments();
    else { html = v.notFound(); seg = 'none'; }

    main.innerHTML = html;
    if (after) after();
    document.title = (TITLES[seg] || 'Not found') + ' · Huelab';
    setActiveNav(seg);
    if (!query.get('lesson')) window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }

  /* ---------- painting actions ---------- */
  function regionClicked(id) {
    var tpl = HL.TEMPLATES[S.tpl], r = tpl.regions.find(function (x) { return x.id === id; });
    if (!r) return;
    S.selected = id;
    if (S.tool === 'paint') { S.applyLayer(id); toast('Painted ' + r.label.toLowerCase() + ' on layer ' + (S.layer + 1)); }
    else if (S.tool === 'erase') { toast(S.eraseLayer(id) ? 'Erased layer ' + (S.layer + 1) + ' of ' + r.label.toLowerCase() : 'Nothing on layer ' + (S.layer + 1) + ' to erase'); }
    v.paintUpdate();
  }

  v.onTaskDone = function (t) { toast('Assignment complete: ' + t.title); };

  /* ---------- clicks ---------- */
  document.addEventListener('click', function (e) {
    var hit = e.target.closest && e.target.closest('.hit');
    if (hit) { regionClicked(hit.dataset.region); return; }

    var el = e.target.closest('[data-action]');
    if (!el) return;
    var a = el.dataset.action, val = el.dataset.value, hex = el.dataset.hex;

    switch (a) {
      case 'quick-hex': {
        var n = HL.normalizeHex($('#quickHex').value);
        if (!n) { $('#quickErr').textContent = 'Please enter a hex code such as #E8742C.'; $('#quickHex').focus(); break; }
        S.setBase(n); location.hash = '#/wheel'; break; }

      case 'mode': S.mode = val; S.save(); v.wheelUpdate(); break;
      case 'scheme': S.scheme = val; S.save(); v.wheelUpdate(); break;
      case 'use-colour': S.setBase(hex); v.wheelUpdate(); break;
      case 'copy-hex': copyText(hex).then(function () { toast('Copied ' + hex); }, function () { toast('Could not copy ' + hex); }); break;
      case 'save-palette': {
        HL.scheme(S.base, S.scheme, S.mode).forEach(function (c) { if (S.palette.indexOf(c.hex) === -1) S.palette.unshift(c.hex); });
        S.palette = S.palette.slice(0, 16); S.save(); v.wheelUpdate(); toast('Saved to your palette'); break; }
      case 'remove-palette': S.palette = S.palette.filter(function (h) { return h !== hex; }); S.save(); v.wheelUpdate(); break;
      case 'paint-with': S.setBrush(S.base); break;     // the link itself carries on to the Paint page

      case 'template': S.tpl = val; S.selected = null; S.save(); v.paintUpdate(); break;
      case 'layer': S.layer = Number(val); S.save(); v.paintUpdate(); break;
      case 'eye': { var i = Number(val); S.visible[i] = !(S.visible[i] !== false); S.save(); v.paintUpdate(); break; }
      case 'medium': S.medium = val; S.save(); v.paintUpdate(); break;
      case 'tool': S.tool = val; v.paintUpdate(); break;
      case 'brush': S.setBrush(hex); v.paintUpdate(); break;
      case 'region': regionClicked(el.dataset.region); break;
      case 'undo': toast(S.undo() ? 'Undone' : 'Nothing to undo'); S.selected = null; v.paintUpdate(); break;
      case 'reset-canvas':
        confirmDialog('Clear this picture?', 'All layers on “' + HL.TEMPLATES[S.tpl].title + '” will be removed. You can undo this straight afterwards.', 'Clear picture').then(function (yes) {
          if (yes) { S.resetCanvas(); S.selected = null; v.paintUpdate(); toast('Picture cleared'); }
        }); break;
      case 'export':
        HL.exportPng(S.tpl, S.regions(), S.visible, 1000).then(function (blob) { download(blob, 'huelab-' + S.tpl + '.png'); toast('Image saved'); },
          function () { toast('Sorry, the image could not be created in this browser.'); }); break;
      case 'mix-from-brush': $(el.dataset.which === 'A' ? '#mixA' : '#mixB').value = S.brush; v.mixUpdate(); break;
      case 'use-mix': S.setBrush(hex); v.paintUpdate(); toast('Brush set to ' + hex); break;
      case 'leave-task': S.task = null; break;
      case 'to-task': { var th = document.getElementById('taskHolder'); if (th) { th.scrollIntoView({ behavior: 'smooth', block: 'start' }); var tt = document.getElementById('taskTitle'); if (tt) { tt.setAttribute('tabindex', '-1'); tt.focus({ preventScroll: true }); } } break; }
    }
  });

  /* ---------- typing and sliders ---------- */
  function showErr(id, msg) { var e = document.getElementById(id); if (e) e.textContent = msg || ''; }

  document.addEventListener('input', function (e) {
    var t = e.target;
    switch (t.id) {
      case 'hexInput': { var n = HL.normalizeHex(t.value); if (n) { S.setBase(n); showErr('hexErr', ''); v.wheelUpdate(true); } break; }
      case 'colorPicker': S.setBase(t.value); showErr('hexErr', ''); v.wheelUpdate(); break;
      case 'satRange': case 'lightRange': {
        S.setBaseHsl(S.hue, Number($('#satRange').value), Number($('#lightRange').value)); v.wheelUpdate(); break; }
      case 'brushHex': { var b = HL.normalizeHex(t.value); if (b) { S.setBrush(b); showErr('brushErr', ''); v.paintUpdate(true); } break; }
      case 'brushPicker': S.setBrush(t.value); showErr('brushErr', ''); v.paintUpdate(); break;
      case 'amountRange': S.amount = Number(t.value); S.save(); v.paintUpdate(); break;
      case 'mixA': case 'mixB': case 'mixT': v.mixUpdate(); break;
    }
    if (t.dataset && t.dataset.demo) v.demoUpdate(t.dataset.demo);
  });

  // When a hex field loses focus, tidy it up or explain what is wrong
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'hexInput') {
      var n = HL.normalizeHex(t.value);
      if (n) { t.value = n; showErr('hexErr', ''); } else { showErr('hexErr', 'Please enter a hex code such as #E8742C.'); t.value = S.base; }
    } else if (t.id === 'brushHex') {
      var b = HL.normalizeHex(t.value);
      if (b) { t.value = b; showErr('brushErr', ''); } else { showErr('brushErr', 'Please enter a hex code such as #E8742C.'); t.value = S.brush; }
    }
  });

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t.id === 'quickHex' && e.key === 'Enter') { e.preventDefault(); $('[data-action="quick-hex"]').click(); return; }
    if (t.id === 'wheelBox') {
      var step = e.shiftKey ? 15 : 1, d = 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') d = step;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') d = -step;
      else if (e.key === 'Home') { e.preventDefault(); S.setBaseHsl(HL.angleToHue(0, S.mode), HL.hexToHsl(S.base).s, HL.hexToHsl(S.base).l); v.wheelUpdate(); return; }
      if (d) { e.preventDefault(); var hsl = HL.hexToHsl(S.base); S.setBaseHsl(HL.angleToHue(HL.hueToAngle(S.hue, S.mode) + d, S.mode), hsl.s < 8 ? 70 : hsl.s, HL.clamp(hsl.l, 12, 88)); v.wheelUpdate(); }
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && $('#canvas') && !/input|textarea/i.test(t.tagName)) {
      e.preventDefault(); toast(S.undo() ? 'Undone' : 'Nothing to undo'); v.paintUpdate();
    }
  });

  /* ---------- dragging on the wheel ---------- */
  var dragging = false;
  function wheelFromPointer(e) {
    var box = $('#wheelBox');
    if (!box) return;
    var ang = HL.pointerAngle(e.clientX, e.clientY, box.getBoundingClientRect());
    var hsl = HL.hexToHsl(S.base);
    S.setBaseHsl(HL.angleToHue(ang, S.mode), hsl.s < 8 ? 70 : hsl.s, HL.clamp(hsl.l, 12, 88));
    v.wheelUpdate();
  }
  document.addEventListener('pointerdown', function (e) {
    var box = e.target.closest && e.target.closest('#wheelBox');
    if (!box) return;
    dragging = true;
    try { box.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    box.focus({ preventScroll: true });
    wheelFromPointer(e);
  });
  document.addEventListener('pointermove', function (e) { if (dragging) wheelFromPointer(e); });
  document.addEventListener('pointerup', function () { dragging = false; });
  document.addEventListener('pointercancel', function () { dragging = false; });

  /* ---------- start ---------- */
  window.addEventListener('hashchange', route);
  S.load();
  $('#globalDefs').innerHTML = HL.filterDefs();
  buildNav();
  route();
  if (S.isBlocked()) toast('Your browser is blocking storage, so progress will not be saved.');
})();
