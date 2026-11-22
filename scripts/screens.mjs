// Screenshots of every scene at 1440 and 390 px → /screens.
// Usage: node scripts/screens.mjs [--only hero,cta] [--no-build-check]
// Serves ./dist with `vite preview`, so run `npm run build` first.
// Also reports console errors/warnings and horizontal overflow.
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const argv = process.argv.slice(2);
const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : '');
const onlyArg = arg('--only');
const only = onlyArg ? onlyArg.split(',') : null;
// --out <dir> (default screens/), --suffix <text> appended to every file name,
// --query a=b → extra URL params
const suffix = arg('--suffix');
const query = arg('--query');
const outDir = path.join(root, arg('--out') || 'screens');
mkdirSync(outDir, { recursive: true });

if (!existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('screens: dist/ missing — run `npm run build` first');
  process.exit(1);
}

const VIEWPORTS = [
  {
    name: '1440',
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  { name: '390', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];

/**
 * each scene: how to get there inside the page. A scene whose section is not on the page
 * is skipped, so one list serves every variant.
 * `el` scrolls that element to 12% from the top; `click` / `fill` prepare the state first.
 */
const SCENES = [
  { name: 'hero', at: { scene: 'hero' } },
  { name: 'pains', at: { scene: 'pains', frac: 0 } },
  { name: 'pains-cards', at: { scene: 'pains', el: '.s-grid' } },
  { name: 'morph', at: { scene: 'morph', frac: 0.5 } },
  { name: 'demo', at: { scene: 'demo', frac: 0.5 } },
  { name: 'demo-chat', at: { scene: 'demo', el: '.s-chat' } },
  { name: 'roles', at: { scene: 'roles', el: '.s-role-list' } },
  { name: 'principles', at: { scene: 'roles', el: '.s-principles' } },
  { name: 'tariffs', at: { scene: 'tariffs', frac: 0 } },
  { name: 'tariffs-open', at: { scene: 'tariffs', frac: 0.55, open: 'growth' } },
  { name: 'stats', at: { scene: 'stats', frac: 0.5 } },
  { name: 'process', at: { scene: 'process', frac: 0 } },
  { name: 'process-steps', at: { scene: 'process', el: '.s-steps' } },
  { name: 'faq', at: { scene: 'faq', el: '.s-faq-list', click: '#faq-0-btn' } },
  {
    name: 'cta-filled',
    at: {
      scene: 'cta',
      frac: 1,
      click: '.s-chip input[value="Заявки и запись"]',
      fill: { '#s-now': 'Заявки приходят в Telegram, записываем в тетрадь.' },
    },
  },
  { name: 'cta', at: { scene: 'cta', frac: 1 } },
].filter((s) => !only || only.includes(s.name));

const server = await preview({
  root,
  logLevel: 'silent',
  preview: { port: 4317, strictPort: false },
});
const url = server.resolvedUrls.local[0] + '?capture' + (query ? `&${query}` : '');

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

const issues = [];
try {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor,
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch,
      reducedMotion: 'no-preference',
    });
    const page = await context.newPage();
    page.on('console', (m) => {
      // "GL Driver Message … ReadPixels" comes from Playwright reading the frame back, not from the page
      if (/GL Driver Message/.test(m.text())) return;
      if (m.type() === 'error' || m.type() === 'warning')
        issues.push(`[${vp.name}] console.${m.type()}: ${m.text()}`);
    });
    page.on('pageerror', (e) => issues.push(`[${vp.name}] pageerror: ${e.message}`));

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page
      .waitForFunction(() => window.__app?.ready === true, null, { timeout: 20000 })
      .catch(() => issues.push(`[${vp.name}] WebGL stage not ready after 20 s`));
    await page.waitForTimeout(2200);

    for (const scene of SCENES) {
      const found = await page.evaluate(async (at) => {
        const el = document.querySelector(`[data-scene="${at.scene}"]`);
        if (!el) return false;
        // a scene that prepares or targets something this page variant does not have is skipped
        if ((at.click && !document.querySelector(at.click)) || (at.el && !el.querySelector(at.el))) return false;
        if (at.click) document.querySelector(at.click)?.click();
        for (const [sel, value] of Object.entries(at.fill ?? {})) {
          const f = document.querySelector(sel);
          if (f) {
            f.value = value;
            f.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        const top = el.getBoundingClientRect().top + window.scrollY;
        const span = Math.max(0, el.offsetHeight - window.innerHeight);
        const target = at.el ? el.querySelector(at.el) : null;
        const y = target
          ? target.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.12
          : top + span * (at.frac ?? 0);
        window.__app.scrollToY(Math.min(y, document.documentElement.scrollHeight));
        if (at.open) {
          const btn = document.querySelector(`#incl-${at.open}-btn`);
          if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.click();
          // mobile: bring the open card into the horizontal viewport
          const card = btn?.closest('.tcard');
          const scroller = card?.parentElement;
          if (card && scroller && scroller.scrollWidth > scroller.clientWidth) {
            scroller.scrollLeft = card.offsetLeft - 24;
            window.__app.scrollToY(card.getBoundingClientRect().top + window.scrollY - 40);
          }
        }
        return true;
      }, scene.at);
      if (!found) continue;
      await page.waitForTimeout(1800);
      const file = path.join(outDir, `${scene.name}-${vp.name}${suffix}.png`);
      await page.screenshot({ path: file });
      console.log(`  ✓ ${path.relative(root, file)}`);
    }

    const overflow = await page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      const offenders = [...document.querySelectorAll('body *')]
        .filter((el) => {
          if (el.closest('.tariffs-track, .grain, .cursor, #gl, .cta-glow')) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > w + 1 || r.left < -1);
        })
        .slice(0, 5)
        .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`);
      return { scrollWidth: document.documentElement.scrollWidth, width: w, offenders };
    });
    if (overflow.scrollWidth > overflow.width || overflow.offenders.length)
      issues.push(`[${vp.name}] horizontal overflow: ${JSON.stringify(overflow)}`);

    // text that does not fit its own box (wider than the box, or a fixed-height card that overflows)
    const unfit = await page.evaluate(() => {
      const sel =
        '.hero-sub, .manifest-text, .tariffs-lead, .tcard-aud p, .tcard-name, .stat-label, .cta-title, .cta-note, .s-badge, .s-hero-line, .s-title, .s-card-title, .s-card-text, .s-bubble, .s-chip span, .s-faq-q, .s-role-name';
      const wide = [...document.querySelectorAll(sel)]
        .filter((el) => el.scrollWidth > el.clientWidth + 1)
        .map((el) => `${el.className}: ${el.scrollWidth}>${el.clientWidth}`);
      const tall = [...document.querySelectorAll('.tcard-inner')]
        .filter((el) => el.scrollHeight > el.clientHeight + 1)
        .map(
          (el) =>
            `tcard ${el.closest('.tcard').dataset.card}: ${el.scrollHeight}>${el.clientHeight}`,
        );
      return [...wide, ...tall];
    });
    if (unfit.length) issues.push(`[${vp.name}] text does not fit: ${unfit.join('; ')}`);

    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}

if (issues.length) {
  console.log(`\n${issues.length} issue(s):\n  ` + issues.join('\n  '));
} else {
  console.log('\nNo console errors/warnings, no horizontal overflow.');
}
