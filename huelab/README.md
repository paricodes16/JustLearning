# Huelab

Learn colour theory by trying it. Huelab pairs a hex-driven colour wheel with short lessons, a layered
painting area and practical assignments, so ideas like complements and underpainting are things you test,
not just read.

Plain HTML, CSS and JavaScript. No installs, no build step, no server. Everything stays in your browser.

## Run it

- **Quickest:** open `index.html` in a browser.
- **On GitHub Pages:** put this folder in your repo (for example as `huelab/`), turn on Pages, and open
  `https://YOUR-USERNAME.github.io/YOUR-REPO/huelab/`

## What is in it

| Page | Address | What you can do |
|---|---|---|
| Home | `#/` | Overview, a side-by-side "same green, different start" demo, and a quick hex box |
| Wheel | `#/wheel` | Type a hex code or drag the ring. See complementary, split, analogous, triadic, square, rectangle and monochromatic colours. Switch between the painter's wheel and the screen wheel. Copy hex codes, save palettes, see name, temperature, RGB, HSL and text contrast |
| Learn | `#/learn` | Eight short lessons, each with a live demo (hue/saturation/value, two wheels, harmonies, warm and cool, simultaneous contrast, mixing, tints and shades, underpainting) |
| Paint | `#/paint` | Three drawings to colour in up to three layers. Dry-brush and glaze media, per-layer visibility, erase and look tools, undo, a mixing bowl, and save as PNG |
| Tasks | `#/assignments` | Six guided assignments with live checklists |

### The two wheels

- **Painter's wheel (red-yellow-blue):** red's opposite is green, blue's is orange, yellow's is violet.
- **Screen wheel (RGB):** red's opposite is cyan, blue's is yellow.

Neither is "the true one". They are models. The app shows both so the difference is visible, and colour names
follow whichever wheel is selected (pure screen blue `#0000FF` is "Blue" on the screen wheel and "Blue-violet" on the painter's wheel).

### How the painting works

Each region of a drawing holds up to three layers (Under, Middle, Top).

- **Dry brush** is broken, textured paint. *Amount* is how much of the surface it covers; the gaps let the layer below show through.
- **Glaze** is a thin transparent wash that multiplies with what is below. *Amount* is the strength of the wash.
- The eye button hides a layer, so you can compare "with" and "without" instantly.
- Small regions such as cheeks, shadows and highlights are painted *on top of* their parent (face, table, apple), so they inherit its colour.

The "seen from a distance" colour shown for each region is calculated by blending the layers, and the assignment checks use that value.

### The assignments

1. A warm glow beneath the greens (red-orange under green)
2. A violet start for skin
3. Shadows that are not grey
4. Neighbours plus one loud accent (analogous plus complement)
5. Depth with warm and cool (atmospheric perspective)
6. Mix a muted background (neutralising complements)

The live checklist tests the **colours you chose**, not your drawing skill. Tick every item to unlock notes on what to look for.

**A note on honesty:** a warm underpainting beneath greens, or a violet underpainting beneath skin, are traditions many
painters use, not laws. The result depends on the medium, how thin the layers are and how big your marks are.
Others use a green-grey start (verdaccio) for skin. The assignments therefore always ask you to compare and decide for yourself.

## Project structure

```
huelab/
├── index.html
├── css/style.css          design system (light and dark)
├── js/
│   ├── color.js           hex, RGB, HSL, painter's wheel mapping, harmonies, mixing, contrast
│   ├── templates.js       the three drawings, as simple shapes
│   ├── lessons.js         lesson text, assignments and their checks
│   ├── paint.js           layered renderer (dry-brush noise filters, glaze, PNG export)
│   ├── wheel.js           colour wheel drawing
│   ├── state.js           saved state, validation of stored data, undo
│   ├── views.js           every page
│   └── app.js             routing, clicks, dragging the wheel, dialogs
└── tests/
    ├── color.test.js      Node: colour maths, templates, every assignment
    └── browser-smoke.js   optional: clicks through the real app with Playwright
```

## Where to change things

| I want to… | Edit |
|---|---|
| Add or change a lesson | `HL.LESSONS` in `js/lessons.js` (and a demo case in `demoParts()` in `js/views.js`) |
| Add an assignment | `HL.TASKS` in `js/lessons.js`: give it steps, a palette and `checks`. Then add a solution to `tests/color.test.js` so the test proves it can be completed |
| Add a drawing | `HL.TEMPLATES` in `js/templates.js`: regions drawn back to front. Use `parent` for shading that must stay inside another shape. Add the id to `HL.TEMPLATE_ORDER` |
| Change the colour wheel mapping | `ANCHORS` in `js/color.js` |
| Change the interface colours | the variables at the top of `css/style.css` |

## Privacy

Your base colour, saved palette, paintings and finished assignments are stored in this browser only (`localStorage`).
Nothing is sent anywhere, and there is no analytics or account. Stored data is validated when loaded, so a damaged
save is ignored rather than breaking the app. Clearing your browser data removes everything.

## Testing

- `node tests/color.test.js` (needs Node, no installs): 44 checks covering conversions (including 2,000 random round trips),
  the painter's wheel mapping, every harmony, naming, temperature, contrast, mixing, composite layers, template integrity,
  and each assignment. Every assignment is tested with a model solution that must pass **all** its checks, and with an
  empty canvas that must pass **none**, so a checklist can never be impossible or trivially ticked.
- `node tests/browser-smoke.js` (optional, needs Playwright): 32 checks that drive the real app in Chromium: the wheel,
  dragging, hex validation, lessons, painting, hiding layers, persistence, PNG export, a full assignment, corrupted storage,
  and sideways-scroll checks at phone width. Set `SHOTS=./shots` to save screenshots.

Contrast of the interface colours was measured: body and secondary text, buttons and badges are at least 4.5:1 in
both light and dark mode. Keyboard use is supported (wheel arrow keys, a list of regions you can paint without a mouse,
visible focus), but no automated accessibility audit has been run.

## Known limitations

- **Colour models are simplifications.** The painter's wheel here is a piecewise mapping of the HSL hue circle, and
  "paint-like" mixing is a weighted geometric mean in linear light. Both behave like paint (blue and yellow make green,
  complements make muted browns) but real pigments vary. The app says so where it matters.
- **Painting is flat colour regions**, not freehand brushwork, so you learn colour relationships rather than technique.
- **On a phone** the picture and the tools stack vertically, so you scroll between them. You can paint from the region
  list next to the tools, and an assignment banner jumps to the steps, but a tablet or laptop is more comfortable.
- **Tested in headless Chromium only.** Dry-brush uses SVG noise filters and glaze uses `mix-blend-mode: multiply`.
  Both are standard, but Firefox and Safari were not tested, and saving the image in particular may differ there.
- **No colour-blindness simulation**, and colour names are in English only.
- Assignment checks measure colour choices, so a technically passing picture may still look odd. That is why every
  assignment ends with a "compare and decide" question.

## Ideas for next steps

- A colour-blindness preview
- A "match this colour" challenge where the target is a hex code
- Importing a photo and extracting its palette
- More drawings and assignments (for example a seascape for greens and blue-greens)
- Freehand brush strokes inside regions

## License

MIT
