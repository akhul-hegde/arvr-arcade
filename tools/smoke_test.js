// Serve the site locally, open each game with Chromium, wait for Unity to start,
// press a few keys, collect console errors and save screenshots.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || '/tmp/shots';
const only = process.argv.slice(3);
fs.mkdirSync(OUT, { recursive: true });
const types = { '.html': 'text/html', '.js': 'application/javascript', '.unityweb': 'application/octet-stream', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); // no Content-Encoding, like GitHub Pages
  fs.createReadStream(f).pipe(res);
}).listen(8765);

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  let fail = false;
  const page0 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const hubErr = [];
  page0.on('pageerror', e => hubErr.push(e.message));
  await page0.goto('http://localhost:8765/');
  await page0.screenshot({ path: OUT + '/hub.png' });
  const links = await page0.$$eval('a.card', as => as.map(a => a.getAttribute('href')));
  console.log('hub links', links, 'errors', hubErr);
  for (const g of ['orb', 'shooter', 'heli']) {
    if (only.length && !only.includes(g)) continue;
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = [], logs = [];
    page.on('console', m => { const t = m.text(); if (m.type() === 'error') errs.push(t); else logs.push(t); });
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
    page.on('requestfailed', r => errs.push('REQFAIL ' + r.url()));
    await page.goto(`http://localhost:8765/games/${g}/`);
    const t0 = Date.now();
    try {
      await page.waitForFunction(() => document.getElementById('loader').style.display === 'none' || document.getElementById('err').style.display === 'block', null, { timeout: 180000 });
    } catch (e) { errs.push('TIMEOUT waiting for start'); }
    const started = await page.evaluate(() => document.getElementById('loader').style.display === 'none');
    console.log(`\n== ${g}: started=${started} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${OUT}/${g}_1.png` });
    await page.mouse.click(640, 450);
    const keys = { orb: ['Space', 'KeyW', 'KeyD'], shooter: ['Space', 'Space'], heli: ['KeyI', 'KeyW', 'ArrowUp'] }[g];
    for (const k of keys) { await page.keyboard.down(k); await page.waitForTimeout(1200); await page.keyboard.up(k); }
    if (g === 'shooter') { for (let i = 0; i < 3; i++) { await page.mouse.click(560 + i * 80, 430); await page.waitForTimeout(400); } }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${g}_2.png` });
    const bad = errs.filter(e => !/AudioContext|WebGL warning|GPU stall|favicon|fonts.googleapis|ERR_TUNNEL/i.test(e));
    console.log('errors:', bad.length ? bad.slice(0, 15) : 'none');
    console.log('log sample:', logs.filter(l => /exception|error|fail|null/i.test(l)).slice(0, 10));
    if (!started || bad.length) fail = true;
    await page.close();
  }
  await browser.close(); server.close();
  console.log(fail ? '\nSMOKE TEST: PROBLEMS FOUND' : '\nSMOKE TEST: ALL OK');
})();
