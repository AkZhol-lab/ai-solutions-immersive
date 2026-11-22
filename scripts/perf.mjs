// Performance audit: bundle sizes, FPS per scene, motion-rule scan, Lighthouse (mobile).
// Usage: node scripts/perf.mjs [--no-lighthouse] [--gpu]
// Serves ./dist with `vite preview` — run `npm run build` first.
import { readdirSync, readFileSync, statSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const report = { bundle: [], fps: {}, motion: [], lighthouse: null };

if (!existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('perf: dist/ missing — run `npm run build` first');
  process.exit(1);
}

// ── 1. bundle ──
const assets = path.join(root, 'dist', 'assets');
for (const f of readdirSync(assets)) {
  const buf = readFileSync(path.join(assets, f));
  const gz = /\.(js|css|svg|html)$/.test(f)
    ? gzipSync(buf).length
    : statSync(path.join(assets, f)).size;
  report.bundle.push({
    file: f,
    kb: +(buf.length / 1024).toFixed(1),
    gzipKb: +(gz / 1024).toFixed(1),
  });
}
report.bundle.sort((a, b) => b.gzipKb - a.gzipKb);
const totalGz = report.bundle.reduce((s, b) => s + b.gzipKb, 0);
console.log('\nBundle (gzip):');
report.bundle.forEach((b) => console.log(`  ${String(b.gzipKb).padStart(7)} kB  ${b.file}`));
console.log(`  ${totalGz.toFixed(1).padStart(7)} kB  total`);

// ── 2. motion rule: only transform / opacity ──
const BAD = /\b(width|height|top|left|right|bottom|margin\w*|padding\w*)\s*:\s*[^;]*$/;
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)],
  );
for (const file of walk(path.join(root, 'src')).filter((f) => /\.(ts|css)$/.test(f))) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const rel = path.relative(root, file);
    // GSAP tweens animating layout props
    if (/gsap\.(to|from|fromTo|set)\(|quickTo\(/.test(line)) {
      const block = lines.slice(i, i + 8).join(' ');
      const m = block.match(/[{,]\s*(width|height|top|left|margin\w*|padding\w*)\s*:/);
      if (m && !/gsap\.set\(/.test(line))
        report.motion.push(`${rel}:${i + 1} gsap animates "${m[1]}"`);
      if (/quickTo\([^,]+,\s*'(width|height|top|left|margin|padding)/.test(line))
        report.motion.push(`${rel}:${i + 1} quickTo on layout prop`);
    }
    // CSS transitions on layout props
    const t = line.match(/transition(-property)?\s*:\s*([^;]+)/);
    if (t && /\b(width|height|top|left|margin|padding|all)\b/.test(t[2]))
      report.motion.push(`${rel}:${i + 1} css transition on layout prop: ${t[2].trim()}`);
  });
  // keyframes touching layout props
  const css = lines.join('\n');
  for (const k of css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\n\}/g)) {
    if (k[2].split('\n').some((l) => BAD.test(l.trim())))
      report.motion.push(`${path.relative(root, file)} @keyframes ${k[1]} animates a layout prop`);
  }
}
console.log(`\nMotion rule (transform/opacity only): ${report.motion.length ? 'FAIL' : 'PASS'}`);
report.motion.forEach((m) => console.log('  ' + m));

// ── 3. FPS per scene ──
const server = await preview({
  root,
  logLevel: 'silent',
  preview: { port: 4319, strictPort: false },
});
const url = server.resolvedUrls.local[0];
const gpuArgs = argv.includes('--gpu')
  ? ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11']
  : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const browser = await chromium.launch({ headless: true, args: gpuArgs });
for (const vp of [
  { name: '1440', width: 1440, height: 900, isMobile: false, hasTouch: false, dpr: 1 },
  { name: '390', width: 390, height: 844, isMobile: true, hasTouch: true, dpr: 2 },
]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    deviceScaleFactor: vp.dpr,
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__app?.ready, null, { timeout: 20000 }).catch(() => {});
  const renderer = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
  });
  report.fps[vp.name] = { renderer, scenes: {} };
  for (const scene of ['hero', 'morph', 'tariffs', 'stats', 'cta']) {
    await page.evaluate((s) => window.__app.scrollToScene(s), scene);
    await page.waitForTimeout(800);
    const fps = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let n = 0;
          const t0 = performance.now();
          const step = () => {
            n++;
            if (performance.now() - t0 < 2000) requestAnimationFrame(step);
            else resolve(+((n * 1000) / (performance.now() - t0)).toFixed(1));
          };
          requestAnimationFrame(step);
        }),
    );
    report.fps[vp.name].scenes[scene] = fps;
  }
  await ctx.close();
}
await browser.close();
console.log('\nFPS (rAF, 2 s per scene):');
for (const [vp, r] of Object.entries(report.fps)) {
  console.log(`  ${vp}px  [${r.renderer}]`);
  for (const [s, f] of Object.entries(r.scenes)) console.log(`    ${s.padEnd(8)} ${f}`);
}
if (Object.values(report.fps).some((r) => /swiftshader|software/i.test(r.renderer)))
  console.log(
    '  note: software rendering (SwiftShader) — numbers are a floor, not real-GPU FPS. Use --gpu.',
  );

// ── 4. Lighthouse (mobile, simulated throttling) ──
if (!argv.includes('--no-lighthouse')) {
  const out = path.join(root, 'screens', 'lighthouse-mobile.json');
  mkdirSync(path.dirname(out), { recursive: true });
  // Chrome is started by Playwright (chrome-launcher can't spawn it in some sandboxes);
  // Lighthouse attaches over the DevTools port.
  const port = 9333;
  const lhBrowser = await chromium.launch({ args: [`--remote-debugging-port=${port}`] });
  // async spawn: a sync one would block this process, and with it the preview server
  const run = (cmd, args, opts) =>
    new Promise((resolve) => {
      const p = spawn(cmd, args, opts);
      let stdout = '';
      let stderr = '';
      p.stdout.on('data', (d) => (stdout += d));
      p.stderr.on('data', (d) => (stderr += d));
      const timer = setTimeout(() => p.kill(), opts.timeout ?? 240000);
      p.on('close', (status) => {
        clearTimeout(timer);
        resolve({ status, stdout, stderr });
      });
    });
  const lh = await run(
    process.execPath,
    [
      path.join(root, 'node_modules', 'lighthouse', 'cli', 'index.js'),
      url,
      `--port=${port}`,
      '--quiet',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--output=json',
      `--output-path=${out}`,
    ],
    {
      cwd: root,
      timeout: 240000,
    },
  );
  await lhBrowser.close();
  if (existsSync(out) && lh.status === 0) {
    const j = JSON.parse(readFileSync(out, 'utf8'));
    const score = (k) => Math.round((j.categories[k]?.score ?? 0) * 100);
    const audit = (k) => j.audits[k]?.displayValue ?? '–';
    report.lighthouse = {
      performance: score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo: score('seo'),
      fcp: audit('first-contentful-paint'),
      lcp: audit('largest-contentful-paint'),
      tbt: audit('total-blocking-time'),
      cls: audit('cumulative-layout-shift'),
      si: audit('speed-index'),
    };
    console.log('\nLighthouse (mobile):');
    for (const [k, v] of Object.entries(report.lighthouse)) console.log(`  ${k.padEnd(14)} ${v}`);
    const failed = Object.values(j.audits)
      .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode === 'binary')
      .map((a) => `${a.id}: ${a.title}`);
    if (failed.length) console.log('  failing audits:\n    ' + failed.join('\n    '));
  } else {
    console.log(
      '\nLighthouse failed:',
      (lh.stderr || lh.stdout || '').split('\n').slice(-8).join('\n'),
    );
  }
}

await new Promise((r) => server.httpServer.close(r));
writeFileSync(path.join(root, 'screens', 'perf-report.json'), JSON.stringify(report, null, 2));
console.log('\n→ screens/perf-report.json');
