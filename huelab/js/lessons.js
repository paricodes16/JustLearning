/* =====================================================================
   HUELAB: lessons and practical assignments. All text is original.
   Assignments contain "checks": small tests that look at what you have
   painted and tick off as you go. They test the colours you chose, not
   your artistic skill.
   ===================================================================== */
(function () {
  var HL = (globalThis.HL = globalThis.HL || {});

  /* ---------- Painting maths shared by the app and the checks ---------- */

  // The layers that contribute to a region's colour: its parent's first, then its own.
  HL.regionFinal = function (tplId, regions, regionId, visible) {
    var tpl = HL.TEMPLATES[tplId], chain = [], id = regionId, guard = 0;
    while (id && guard++ < 5) {
      chain.unshift(id);
      var def = tpl.regions.find(function (r) { return r.id === id; });
      id = def && def.parent;
    }
    var list = [];
    chain.forEach(function (rid) {
      var layers = regions[rid] || [];
      for (var i = 0; i < 3; i++) {
        var L = layers[i] || null;
        if (L && visible && visible[i] === false) L = null;
        list.push(L);
      }
    });
    return HL.composite(list);
  };

  HL.checkContext = function (tplId, regions, visible) {
    var ctx = {
      layer: function (r, n) { return (regions[r] || [])[n - 1] || null; },
      hsl: function (r, n) { var L = ctx.layer(r, n); return L ? HL.hexToHsl(L.hex) : null; },
      finalHex: function (r) { return HL.regionFinal(tplId, regions, r, visible); },
      finalHsl: function (r) { var h = ctx.finalHex(r); return h ? HL.hexToHsl(h) : null; },
      top: function (r) {
        var ls = regions[r] || [];
        for (var i = 2; i >= 0; i--) if (ls[i]) return ls[i];
        return null;
      },
      topHsl: function (r) { var L = ctx.top(r); return L ? HL.hexToHsl(L.hex) : null; },
      ryb: function (hsl) { return HL.hueToRyb(hsl.h); }
    };
    return ctx;
  };

  function circularMean(angles) {
    var x = 0, y = 0;
    angles.forEach(function (a) { x += Math.cos(a * Math.PI / 180); y += Math.sin(a * Math.PI / 180); });
    return HL.mod(Math.atan2(y, x) * 180 / Math.PI, 360);
  }
  function warmRedOrange(h) { return h && HL.inHue(h.h, 345, 40) && h.s >= 30; }
  function green(h) { return h && HL.inHue(h.h, 80, 170); }

  /* ---------- Assignments ---------- */

  HL.TASKS = [
    {
      id: 'warm-under-green', title: 'A warm glow beneath the greens', level: 'Beginner', minutes: 15, template: 'landscape',
      goal: 'See what a red-orange start does to green.',
      theory: 'Red and green are opposites on the painter’s wheel. Painters often begin with a warm underpainting so a little of it shows through the greens, which keeps them from looking flat. It is a tradition worth testing, not a rule.',
      palette: ['#C8553D', '#4A8B3F', '#6FA84F'],
      steps: [
        'Choose <b>Layer 1 (Under)</b>, medium <b>Dry brush</b>, amount <b>100%</b>. Paint the <b>Foliage</b> and the <b>Near field</b> a warm red-orange such as #C8553D.',
        'Switch to <b>Layer 2</b>. Pick a leaf green such as #4A8B3F, keep <b>Dry brush</b> and set the amount to about <b>65%</b>. Paint the foliage and the field again.',
        'Use the eye buttons to hide Layer 1, then show it again. Step back from the screen and compare.',
        'Optional: undo, then paint the same green straight onto bare paper (leave Layer 1 empty). Which green looks richer? Which looks flatter?'
      ],
      checks: [
        { label: 'Foliage has a warm red or orange underpainting (Layer 1)', test: function (c) { return warmRedOrange(c.hsl('foliage', 1)); } },
        { label: 'Foliage has green on top (Layer 2)', test: function (c) { return green(c.hsl('foliage', 2)); } },
        { label: 'The field has the same warm start and a green on top', test: function (c) { return warmRedOrange(c.hsl('field', 1)) && green(c.hsl('field', 2)); } },
        { label: 'The green lets the red show through (dry brush under 90%, or a glaze)', test: function (c) { var L = c.layer('foliage', 2); return !!L && (L.medium === 'glaze' || L.amount <= 90); } }
      ],
      observe: 'Close up you should see warm flecks vibrating against the green. Step back and they blend into a warmer, more varied green. Notice the trade-off: the red also dulls the green, so it works best in small amounts and rough brushwork.',
      reflect: 'Where would a warm start look wrong, for example in a cool, misty scene? What would you start with instead?'
    },
    {
      id: 'violet-under-skin', title: 'A violet start for skin', level: 'Beginner', minutes: 20, template: 'portrait',
      goal: 'Test how a cool violet underpainting changes a warm skin tone.',
      theory: 'Some painters begin skin with a cool violet so the warm layers on top gain depth. Others use a green-grey (a method called verdaccio) or a warm earth red. None is the one right answer, so this is an experiment.',
      palette: ['#8A6BB1', '#E8B08F', '#C9785D', '#E58D7A', '#6B4E8A'],
      steps: [
        'Layer 1, <b>Dry brush</b>, <b>100%</b>: paint the <b>Face</b> and the <b>Neck</b> a soft violet such as #8A6BB1.',
        'Layer 2, <b>Dry brush</b>, about <b>70%</b>: paint the face and neck a peachy skin tone such as #E8B08F so the violet shows through in places.',
        'Paint the <b>Face shadow side</b> and the <b>Under-chin shadow</b> with a darker, cooler colour such as #6B4E8A using a <b>Glaze</b> (about 45%).',
        'Layer 3, <b>Glaze</b>: add warm blush on one or both <b>Cheeks</b> with a red-pink such as #E58D7A.',
        'Compare: undo and try a green-grey underpainting such as #7F9A6E instead of violet. Which skin looks most natural to you?'
      ],
      checks: [
        { label: 'Face has a violet underpainting (Layer 1)', test: function (c) { var h = c.hsl('face', 1); return !!h && HL.inHue(h.h, 255, 310) && h.s >= 20; } },
        { label: 'Neck has a violet underpainting too', test: function (c) { var h = c.hsl('neck', 1); return !!h && HL.inHue(h.h, 255, 310) && h.s >= 20; } },
        { label: 'Face has a warm skin tone on top (Layer 2)', test: function (c) { var h = c.hsl('face', 2); return !!h && HL.inHue(h.h, 8, 45) && h.l >= 45; } },
        { label: 'The shadow side is darker than the lit face', test: function (c) { var a = c.finalHsl('faceShade'), b = c.finalHsl('face'); return !!a && !!b && a.l < b.l - 5; } },
        { label: 'Warm blush on a cheek (a red-pink layer)', test: function (c) { return ['cheekL', 'cheekR'].some(function (r) { var h = c.topHsl(r); return !!h && HL.inHue(h.h, 340, 22) && h.s >= 35; }); } }
      ],
      observe: 'The violet should peek through the skin as subtle cool depth, especially where the paint is thin. If the face looks bruised, your skin layer is too thin or your violet is too strong. Try a lighter, greyer violet.',
      reflect: 'Why might skin look more alive with a cool colour beneath it than with a flat peach fill?'
    },
    {
      id: 'coloured-shadows', title: 'Shadows that are not grey', level: 'Beginner', minutes: 15, template: 'stilllife',
      goal: 'Paint a shadow that has colour, using the opposite of the object.',
      theory: 'A shadow made from black or grey often looks dead. A dark colour leaning toward the opposite of the object (green for a red apple) keeps the shadow quiet but alive.',
      palette: ['#C0392B', '#D9C3A0', '#2F5D50', '#E9E2D0'],
      steps: [
        'Paint the <b>Apple</b> a strong red such as #C0392B (Layer 1, Dry brush, 100%).',
        'Paint the <b>Table</b> a warm neutral such as #D9C3A0 and the <b>Wall</b> a pale warm tone such as #E9E2D0.',
        'Paint the <b>Cast shadow</b> with a dark green-teal such as #2F5D50, medium <b>Glaze</b>, around 55%. Notice how the table colour still shows through.',
        'Optional: paint the <b>Apple shadow side</b> with the same teal as a light glaze, and the <b>Highlight</b> with a warm white.',
        'Swap the shadow for a plain dark grey and compare the two.'
      ],
      checks: [
        { label: 'The apple is a strong red', test: function (c) { var h = c.finalHsl('apple'); return !!h && HL.inHue(h.h, 345, 15) && h.s >= 50; } },
        { label: 'The table is painted', test: function (c) { return !!c.finalHex('table'); } },
        { label: 'The cast shadow is darker than the table', test: function (c) { var a = c.finalHsl('shadow'), b = c.finalHsl('table'); return !!a && !!b && a.l <= b.l - 8; } },
        { label: 'The shadow has colour (not plain grey or black)', test: function (c) { var h = c.topHsl('shadow'); return !!h && h.s >= 15; } },
        { label: 'The shadow leans green or blue-green, the apple’s opposite', test: function (c) { var h = c.topHsl('shadow'); return !!h && HL.inHue(h.h, 100, 230); } }
      ],
      observe: 'A shadow that echoes the opposite of the object’s colour tends to make the object itself look more vivid. Compare it with the grey version.',
      reflect: 'Look around you right now. What colour are the shadows really? Are any of them truly grey?'
    },
    {
      id: 'harmony-and-accent', title: 'Neighbours plus one loud accent', level: 'Intermediate', minutes: 20, template: 'landscape',
      goal: 'Build a calm analogous scene and add one complementary accent.',
      theory: 'Neighbouring hues feel harmonious. A single small touch of the opposite colour then draws the eye. Keep the accent small and saturated.',
      palette: ['#A9D6D2', '#5FA89A', '#2F7F62', '#E8742C'],
      steps: [
        'Paint the <b>Sky</b> a pale blue-green such as #A9D6D2.',
        'Paint the <b>Far hills</b> a medium blue-green such as #5FA89A and the <b>Near field</b> a deeper green such as #2F7F62.',
        'Paint the <b>Sun</b> a vivid orange such as #E8742C.',
        'Open the <b>Wheel</b> page, choose the painter’s wheel and the Complementary scheme with your sky colour, and see where the sun colour sits.'
      ],
      checks: [
        { label: 'Sky, far hills and field are all painted', test: function (c) { return !!c.finalHex('sky') && !!c.finalHex('farHills') && !!c.finalHex('field'); } },
        { label: 'The three are neighbours on the painter’s wheel (within 80°)', test: function (c) {
          var hs = ['sky', 'farHills', 'field'].map(c.finalHsl); if (hs.some(function (h) { return !h; })) return false;
          var a = hs.map(c.ryb), m = circularMean(a);
          return a.every(function (x) { return HL.angleDiff(x, m) <= 40; });
        } },
        { label: 'The sun is a vivid accent (saturation 55% or more)', test: function (c) { var h = c.finalHsl('sun'); return !!h && h.s >= 55; } },
        { label: 'The sun sits roughly opposite the others (110° or more away)', test: function (c) {
          var hs = ['sky', 'farHills', 'field'].map(c.finalHsl), s = c.finalHsl('sun');
          if (!s || hs.some(function (h) { return !h; })) return false;
          return HL.angleDiff(c.ryb(s), circularMean(hs.map(c.ryb))) >= 110;
        } }
      ],
      observe: 'Squint. The small orange sun should become the first thing you notice, even though it covers very little of the picture.',
      reflect: 'What happens to the sun’s impact if you make it twice as big? What if you make it duller?'
    },
    {
      id: 'aerial-perspective', title: 'Depth with warm and cool', level: 'Intermediate', minutes: 20, template: 'landscape',
      goal: 'Create distance using temperature, value and saturation.',
      theory: 'Atmosphere makes faraway things lighter, cooler and softer. Things close to you look darker, warmer and more saturated. You can fake depth with this alone.',
      palette: ['#A7BBD6', '#7C97BA', '#B98A3E', '#8A5A2E'],
      steps: [
        'Paint the <b>Sky</b> a pale cool blue such as #A7BBD6.',
        'Paint the <b>Far hills</b> a light, soft blue such as #7C97BA, which is cool, light and not very saturated.',
        'Paint the <b>Near field</b> a warm, darker, richer colour such as #B98A3E.',
        'Optionally add a dark warm brown (#8A5A2E) to the <b>Tree trunk</b>.'
      ],
      checks: [
        { label: 'The far hills are a cool colour', test: function (c) { var h = c.finalHex('farHills'); return !!h && HL.temperature(h) === 'cool'; } },
        { label: 'The near field is a warm colour', test: function (c) { var h = c.finalHex('field'); return !!h && HL.temperature(h) === 'warm'; } },
        { label: 'The far hills are lighter than the field', test: function (c) { var a = c.finalHsl('farHills'), b = c.finalHsl('field'); return !!a && !!b && a.l > b.l + 5; } },
        { label: 'The far hills are less saturated than the field', test: function (c) { var a = c.finalHsl('farHills'), b = c.finalHsl('field'); return !!a && !!b && a.s < b.s; } }
      ],
      observe: 'Even with flat colour, the hills should now feel far away. Try swapping the two colours and notice how the picture flattens or flips.',
      reflect: 'On the next hazy morning, look at distant hills or buildings. Which of the three changes (cooler, lighter, softer) is most obvious?'
    },
    {
      id: 'muted-background', title: 'Mix a muted background', level: 'Intermediate', minutes: 20, template: 'stilllife',
      goal: 'Mix neutral colours from opposites, then see how a vivid object pops against them.',
      theory: 'Mixing two complements neutralises them into lively greys and browns. A muted background makes a saturated object look stronger.',
      palette: ['#E07B39', '#2F5FA8', '#C0392B'],
      steps: [
        'On the <b>Paint</b> page open the <b>Mixing bowl</b>. Set colour A to orange #E07B39 and colour B to blue #2F5FA8.',
        'Slide the mix until you get a soft grey-brown, then press <b>Use this mix</b> and paint the <b>Wall</b>.',
        'Make a second, slightly different mix (more orange) and paint the <b>Table</b>.',
        'Paint the <b>Apple</b> a vivid red such as #C0392B and compare it with the muted background.'
      ],
      checks: [
        { label: 'The wall is muted (saturation 40% or less)', test: function (c) { var h = c.finalHsl('wall'); return !!h && h.s <= 40; } },
        { label: 'The table is muted too', test: function (c) { var h = c.finalHsl('table'); return !!h && h.s <= 40; } },
        { label: 'The apple is vivid (saturation 55% or more)', test: function (c) { var h = c.finalHsl('apple'); return !!h && h.s >= 55; } },
        { label: 'The apple is at least 25 points more saturated than the wall', test: function (c) { var a = c.finalHsl('apple'), w = c.finalHsl('wall'); return !!a && !!w && a.s - w.s >= 25; } }
      ],
      observe: 'The red apple should look more intense than it would against a bright background, even though the apple’s colour never changed.',
      reflect: 'Why do professional photographers and designers often keep backgrounds neutral?'
    }
  ];

  HL.taskById = function (id) { return HL.TASKS.find(function (t) { return t.id === id; }); };

  HL.runChecks = function (task, regions, visible) {
    var ctx = HL.checkContext(task.template, regions || {}, visible);
    return task.checks.map(function (ch) {
      var ok = false;
      try { ok = !!ch.test(ctx); } catch (e) { ok = false; }
      return { label: ch.label, ok: ok };
    });
  };

  /* ---------- Lessons ---------- */

  HL.LESSONS = [
    { id: 'basics', title: 'Hue, saturation and value', demo: 'basics',
      summary: 'The three ways to describe any colour, and what a hex code really is.',
      body: [
        'Every colour can be described in three ways. <b>Hue</b> is the family: red, blue, green. <b>Saturation</b> (or chroma) is how pure or greyed it looks. <b>Value</b> (or lightness) is how light or dark it is. When a painting feels “off”, one of these three is usually the cause.',
        'Value does most of the work. A picture that reads well in black and white will almost always read well in colour. Squint at your work to check.',
        'A hex code like <b>#E8742C</b> is a compact way to write a screen colour: two digits each for red, green and blue light, from 00 (none) to FF (full).'
      ] },
    { id: 'wheels', title: 'Two wheels: paint and light', demo: 'wheels',
      summary: 'Why red’s opposite is green for painters and cyan for screens.',
      body: [
        'A colour wheel is a model that arranges hues in a circle so you can see how they relate. Painters traditionally use a <b>red-yellow-blue</b> wheel, where red’s opposite is green. Screens mix red, green and blue <b>light</b>, where red’s opposite is cyan. Printers use cyan, magenta and yellow.',
        'None of these is “the true wheel”. Use the painter’s wheel to think about paint, and the screen wheel when you work with hex codes and light. Huelab lets you flip between them.',
        'Modern paint sets with a cool red (magenta) and a cool blue (cyan) can mix a wider range than the traditional three, so red-yellow-blue is a useful teaching simplification, not a law of nature.'
      ] },
    { id: 'harmonies', title: 'Colour harmonies', demo: 'harmonies',
      summary: 'Ready-made colour relationships: complementary, analogous, triadic and more.',
      body: [
        'A harmony is a set of colours with a fixed relationship on the wheel. <b>Complementary</b> colours are opposite each other and give the strongest contrast. <b>Analogous</b> colours are neighbours and feel calm. <b>Triadic</b> colours are evenly spaced and feel lively.',
        'The rule that makes any harmony work is <b>unequal amounts</b>. Let one colour dominate, give a second a supporting role and keep the third for small accents.',
        'Open the Wheel page to see each scheme for any colour you like.'
      ] },
    { id: 'temperature', title: 'Warm, cool and depth', demo: 'temperature',
      summary: 'How temperature makes things advance or recede.',
      body: [
        'Reds, oranges and yellows feel warm and seem to come toward you. Blues, blue-greens and violets feel cool and seem to move away. Temperature is relative: a yellow-green is warm beside a blue-green and cool beside an orange.',
        'Landscape painters use this for depth. Distant hills look <b>cooler, lighter and softer</b> than the foreground. This is called atmospheric perspective, and Assignment 5 lets you try it.'
      ] },
    { id: 'contrast', title: 'Simultaneous contrast', demo: 'contrast',
      summary: 'The same colour looks different next to different neighbours.',
      body: [
        'Colours change depending on what surrounds them. The four grey squares below have exactly the same hex code, yet each tends to look slightly tinted toward the opposite of its background.',
        'This is why a small touch of a complement makes a colour glow, and why a colour that looked right on the palette can look different on the canvas.'
      ] },
    { id: 'mixing', title: 'Mixing and neutralising', demo: 'mixing',
      summary: 'Why mixing opposites makes natural greys and browns.',
      body: [
        'Mixing a colour with its complement neutralises it. This gives you lively, natural greys and browns that usually look richer than a grey straight from the tube.',
        'Slide below from one colour to the other. The “paint” row approximates how pigments mix, so the middle of red and green becomes a brown. The “light” row shows what happens when light is added instead, which is why screens behave differently. The paint row is an approximation, and real pigments vary.'
      ] },
    { id: 'tints', title: 'Tints, tones and shades', demo: 'tints',
      summary: 'Adding white, grey or black, and a better way to darken.',
      body: [
        'A <b>tint</b> is a colour plus white, a <b>tone</b> is a colour plus grey, and a <b>shade</b> is a colour plus black.',
        'Black can make colours look dull. Many painters darken a colour by adding a dark, cool neighbour or a little of its complement instead.'
      ] },
    { id: 'underpainting', title: 'Underpainting and glazing', demo: 'underpainting',
      summary: 'Why the first layer can change the final colour.',
      body: [
        'An <b>underpainting</b> is a first layer, often thin and simple, that sits beneath the final colours. If the top layers are thin, transparent (a <b>glaze</b>) or broken (a <b>dry brush</b>), some of the layer beneath shows through and mixes in the eye.',
        'A warm red under greens can make them livelier; a cool violet under skin can add depth; a green-grey under skin (verdaccio) was a classic way to quiet warm flesh. These are traditions that many painters use, not rules, and the result depends on your medium, how thin the layers are and how big your marks are.',
        'In the Paint area, Layer 1 is your underpainting. Hide and show it with the eye button to see the difference.'
      ] }
  ];
})();
