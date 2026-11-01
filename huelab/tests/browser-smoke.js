/* Browser smoke test (optional). Opens the real app in headless Chromium and clicks through it.

   Needs Playwright:   npm install playwright && npx playwright install chromium
   Run:                node tests/browser-smoke.js
   Optional:           SHOTS=./shots node tests/browser-smoke.js   (saves screenshots)
*/
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const URL = 'file://' + path.resolve(__dirname, '../index.html');
const SHOTS = process.env.SHOTS;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

let passed = 0, failed = 0;
const errors = [];
function ok(name, cond, extra) {
  if (cond) { passed++; console.log('  ok   ' + name); }
  else { failed++; console.log('  FAIL ' + name + (extra ? '  -> ' + extra : '')); }
}
const hueOf = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return 0;
  const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return h * 60;
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  const go = async (h) => { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(250); };
  const txt = (s) => page.locator(s).first().textContent();
  const shot = async (n) => { if (SHOTS) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, n + '.png') }); } };

  console.log('Home and wheel');
  await page.goto(URL); await page.waitForSelector('.hero');
  ok('home renders with three comparison swatches', await page.locator('.demo-trio .swatch-svg').count() === 3);
  await shot('home');
  await go('#/wheel');
  await page.fill('#hexInput', '#FF0000'); await page.waitForTimeout(100);
  const comp = async () => (await page.locator('.scheme-item code').nth(1).textContent()).trim();
  const paintComp = await comp();
  ok("painter's wheel: red's opposite is green", hueOf(paintComp) > 100 && hueOf(paintComp) < 150, paintComp);
  await page.click('[data-action=mode][data-value=rgb]');
  ok("screen wheel: red's opposite is cyan", Math.abs(hueOf(await comp()) - 180) < 3);
  await page.click('[data-action=mode][data-value=ryb]');
  await page.fill('#hexInput', 'zzz'); await page.locator('#hexInput').dispatchEvent('change');
  ok('an invalid hex is explained and restored', (await txt('#hexErr')).includes('hex code') && await page.inputValue('#hexInput') === '#FF0000');
  await page.fill('#hexInput', '#C8553D'); await page.locator('#hexInput').dispatchEvent('change');
  const box = await page.locator('#wheelBox').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2, R = box.width * 0.3;
  const before = await page.inputValue('#hexInput');
  await page.mouse.move(cx, cy - R); await page.mouse.down(); await page.mouse.move(cx + R * 0.9, cy + R * 0.2, { steps: 5 }); await page.mouse.up();
  const after = await page.inputValue('#hexInput');
  ok('dragging the ring changes the colour', before !== after && Math.abs(hueOf(after) - 51) < 6, before + ' -> ' + after);
  await page.click('[data-action=scheme][data-value=triadic]');
  ok('triadic lists three colours', await page.locator('.scheme-item').count() === 3);
  await shot('wheel');

  console.log('Learn');
  await go('#/learn');
  ok('eight lessons', await page.locator('.lesson').count() === 8);
  await page.evaluate(() => { document.getElementById('lesson-wheels').open = true; });
  await page.fill('#dWheelsHex', '#FF0000');
  const trio = await page.locator('[data-demo-box=wheels] figcaption').allTextContents();
  ok('wheels demo contrasts paint and screen opposites', /Green/.test(trio[1]) && /Cyan/.test(trio[2]), trio.join(' | '));
  await go('#/learn?lesson=contrast');
  ok('a lesson can be opened by link', await page.locator('#lesson-contrast').getAttribute('open') !== null);
  await shot('learn');

  console.log('Paint');
  await go('#/paint');
  const paint = async (region, hex, layer, medium, amount) => {
    await page.fill('#brushHex', hex);
    await page.click(`[data-action=layer][data-value="${layer}"]`);
    await page.click(`[data-action=medium][data-value=${medium}]`);
    await page.evaluate(a => { const r = document.getElementById('amountRange'); r.value = a; r.dispatchEvent(new Event('input', { bubbles: true })); }, amount);
    await page.click(`.region-btn[data-region=${region}]`);
  };
  await paint('foliage', '#C8553D', 0, 'dry', 100);
  await paint('foliage', '#4A8B3F', 1, 'dry', 65);
  ok('dry brush uses a noise filter', await page.locator('#canvas rect[filter*="dry-65-1"]').count() >= 1);
  const both = (await txt('.region-btn[data-region=foliage] code')).trim();
  await page.click('[data-action=eye][data-value="0"]');
  ok('hiding the underpainting changes the colour seen', (await txt('.region-btn[data-region=foliage] code')).trim() !== both);
  await page.click('[data-action=eye][data-value="0"]');
  await paint('sky', '#9DB4D1', 0, 'glaze', 70);
  ok('glaze uses multiply blending', await page.locator('#canvas rect[style*="multiply"]').count() >= 1);
  await shot('paint-landscape');
  await page.reload(); await page.waitForSelector('#canvas');
  ok('paintings persist after reload', !(await txt('.region-btn[data-region=foliage] code')).includes('empty'));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-action=export]')]);
  ok('export saves a PNG', dl.suggestedFilename().endsWith('.png') && fs.statSync(await dl.path()).size > 5000);
  await page.click('[data-action=reset-canvas]');
  ok('clearing asks first', await page.locator('#dlg h2:has-text("Clear this picture?")').count() === 1);
  await page.click('#dlgNo');

  console.log('Assignment');
  await go('#/assignments');
  ok('six assignments', await page.locator('.task-card').count() === 6);
  await page.locator('.task-card a').first().click(); await page.waitForTimeout(300);
  await page.click('[data-action=reset-canvas]'); await page.click('#dlgYes'); await page.waitForTimeout(150);
  ok('nothing is ticked on a blank canvas', await page.locator('#taskChecks li.ok').count() === 0);
  await paint('foliage', '#C8553D', 0, 'dry', 100); await paint('foliage', '#4A8B3F', 1, 'dry', 65);
  await paint('field', '#C8553D', 0, 'dry', 100); await paint('field', '#4A8B3F', 1, 'dry', 65);
  ok('every check ticks and the notes unlock', await page.locator('#taskChecks li.ok').count() === 4 && (await txt('#taskAfter')).includes('Nicely done'));
  await shot('assignment-done');
  await go('#/assignments');
  ok('completion is recorded', (await txt('.progress')).includes('1 of 6'));

  console.log('Robustness');
  await page.evaluate(() => localStorage.setItem('huelab-v1', '{"mode":"bad","base":"nope","painting":{"landscape":{"sky":[{"hex":"zzz","medium":"x","amount":"?"}]}},"palette":[1,"#fff","#xyz"],"done":{"fake":true}}'));
  await page.reload(); await page.waitForSelector('main');
  ok('a corrupted save is ignored safely', !(await page.evaluate(() => document.body.innerText)).includes('undefined'));
  await go('#/nope');
  ok('an unknown page is friendly', (await txt('main')).includes('could not be found'));

  console.log('Mobile (390 x 844)');
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mp = await m.newPage();
  mp.on('console', x => { if (x.type() === 'error') errors.push('mobile ' + x.text()); });
  mp.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await mp.goto(URL); await mp.waitForSelector('.hero');
  ok('bottom navigation replaces the top navigation', await mp.locator('#navBottom').isVisible() && !(await mp.locator('#navTop').isVisible()));
  for (const r of ['#/', '#/wheel', '#/learn', '#/paint', '#/paint?task=aerial-perspective', '#/assignments']) {
    await mp.evaluate(h => { location.hash = h; }, r); await mp.waitForTimeout(350);
    const w = await mp.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    ok('no sideways scrolling on ' + r, w.sw <= w.iw, JSON.stringify(w));
    if (SHOTS) await mp.screenshot({ path: path.join(SHOTS, 'mobile-' + (r.replace(/[^a-z]+/gi, '-').replace(/^-|-$/g, '') || 'home') + '.png') });
  }
  await mp.evaluate(() => { location.hash = '#/paint?task=aerial-perspective'; }); await mp.waitForTimeout(300);
  ok('on a phone an assignment banner leads to the steps', await mp.locator('#taskBanner').isVisible());
  await mp.locator('#taskBanner button').tap(); await mp.waitForTimeout(500);
  ok('the banner scrolls to the assignment steps', await mp.locator('#taskTitle').isVisible() && await mp.evaluate(() => window.scrollY) > 300);
  await mp.locator('.region-btn[data-region=sky]').tap();
  ok('tapping paints on a touch screen', !(await mp.locator('.region-btn[data-region=sky] code').textContent()).includes('empty'));
  await m.close();

  console.log('Console health');
  const real = errors.filter(e => !/ERR_(INTERNET|NAME|CONNECTION)|Failed to load resource/.test(e));
  ok('no console errors', real.length === 0, real.join(' || '));

  await browser.close();
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
