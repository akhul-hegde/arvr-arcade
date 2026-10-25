// Test the in-page player: launch each game from the hub, go back, launch the next.
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : f.endsWith('.js') ? 'application/javascript' : 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(8766);
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|TUNNEL/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8766/');
  let ok = true;
  for (const g of ['orb', 'heli', 'shooter', 'orb']) {
    await p.click(`a.card.${g}`);
    const t0 = Date.now();
    await p.waitForFunction(() => document.getElementById('ploader').hidden || !document.getElementById('perr').hidden, null, { timeout: 120000 }).catch(() => {});
    const st = await p.evaluate(() => ({ started: document.getElementById('ploader').hidden, err: document.getElementById('perr').textContent, canvases: document.querySelectorAll('#pstage canvas').length }));
    console.log(g, st, ((Date.now() - t0) / 1000).toFixed(1) + 's');
    if (!st.started || st.canvases !== 1) ok = false;
    await p.waitForTimeout(3000);
    await p.keyboard.press(g === 'heli' ? 'KeyI' : 'Space');
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${OUT}/spa_${g}.png` });
    await p.click('#pback');
    await p.waitForTimeout(1500);
    const back = await p.evaluate(() => ({ hidden: document.getElementById('player').hidden, canvases: document.querySelectorAll('#pstage canvas').length }));
    console.log('  back', back);
    if (!back.hidden || back.canvases !== 0) ok = false;
  }
  console.log('errors', errs.slice(0, 10));
  console.log(ok && !errs.length ? 'SPA TEST: ALL OK' : 'SPA TEST: PROBLEMS');
  await b.close(); server.close();
})();
