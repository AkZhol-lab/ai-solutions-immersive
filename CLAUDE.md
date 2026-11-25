# AI Solutions — immersive landing (Астана)

Quiet, expensive, futuristic. Lots of black, air, slow breathing particles, nothing extra.
x.ai minimalism, Linear-grade motion precision, Lusion / Active Theory WebGL staging.
References and what we take from each: `docs/references.md`.

## Commands

```bash
npm run dev             # Vite dev server, http://localhost:5173
npm run build           # tsc --noEmit + vite build → dist/
npm run preview         # serve dist/ on :4173
npm run verify:tariffs  # src/data/tariffs.ts vs AI_Solutions_Тарифы.xlsx, item by item
npm run screens         # Playwright: every scene at 1440 and 390 → screens/*.png (+ console/overflow report)
npm run perf            # FPS per scene, bundle sizes, Lighthouse mobile
```

`screens` and `perf` serve `dist/`, so build first. `?capture` in the URL makes WebGL uniforms snap to the scroll state (deterministic screenshots).

Hosting: GitHub Pages project site https://akzhol-lab.github.io/ai-solutions-immersive/ (repo `akzhol-lab/ai-solutions-immersive`, deployed by `.github/workflows/deploy.yml` on push to `main`). `vite.config.ts` uses `base: '/ai-solutions-immersive/'` for build and preview, `/` for dev. The old site `akzhol-lab/ai-solutions` is a separate repo — never touch it.

## Stack

Vite · vanilla TypeScript · Three.js · GSAP + ScrollTrigger · Lenis · Tailwind 3. No React/Vue or other heavy frameworks.

- Three.js: named imports from `three` only. Post-processing (`three/examples/jsm/postprocessing/*`) is loaded with a dynamic import, desktop only (`src/webgl/post.ts`).
- The whole `src/webgl/stage.ts` chunk is itself dynamically imported after first paint, so three.js never blocks the headline (LCP).
- Fonts are self-hosted in `src/assets/fonts` (woff2, `font-display: swap`): Space Grotesk 500 (latin), Manrope 600 (cyrillic only, family `Manrope Display`, mapped to weight 500), Inter 400/500 (latin + cyrillic). Space Grotesk has no Cyrillic — Cyrillic headings fall through to Manrope, chosen for its geometric match and equal stroke weight next to Space Grotesk 500. Two first-screen faces are preloaded by a build plugin in `vite.config.ts`.

## Content rules

- Site language: Russian. Hero title in English: «Intelligence, quietly applied.»
- Contact / CTA: Telegram @zholic_01 → https://t.me/zholic_01, button «Рассказать в Telegram» (answers the CTA question; the header link stays «Telegram»). Footer: «AI Solutions · Астана» only — no link to the old site (removed at the owner's request).
- Copy (written with the akzhol-sales + akzhol-copywriting skills, history in `docs/copy-v2.md`, `docs/copy-v3.md`): don't presume the client's pain, describe a situation they recognise, one small next step. Short static texts (hero, manifest, tariffs lead, stats title) are in `index.html`; everything else is in `src/content/copy.ts` and rendered into `index.html` at build time by `src/content/markup.ts` / `src/data/markup.ts` (`<!-- @pains -->`, `@demo`, `@roles`, `@process`, `@faq`, `@cta`). «Для кого» on the site comes from `AUDIENCE` there, not from `Tariff.audience`, which stays verbatim from the xlsx.
- Facts in the copy come only from the owner's published site and `tariffs.ts`; durations in the process / FAQ are derived from `tariffs.ts`. The Telegram demo uses conditional data and says so under the chat.
- Never invent numbers, reviews, client logos or cases. If data is missing, remove the block — no placeholders.
- Tariffs live only in `src/data/tariffs.ts`, verbatim from `AI_Solutions_Тарифы.xlsx`. Counts (blocks, tasks, days, channels) are derived there, never hardcoded. `src/data/markup.ts` renders cards and stats into `index.html` at build time (`<!-- @tariffs -->`, `<!-- @stats -->`).
- Currency `$` is confirmed by the owner (the xlsx has none). The xlsx marks prices «Цена — проект, не утверждена.», so every price reads «от $N» with the note «Итоговая стоимость по проекту» (`PRICE_FROM` / `PRICE_NOTE` in `tariffs.ts`).

## Design tokens (CSS variables in `src/style.css` `:root`, mirrored in `tailwind.config.js`)

| Token          | Value                                                                                |
| -------------- | ------------------------------------------------------------------------------------ |
| Background     | `--c-bg` #050507                                                                     |
| Text           | `--c-fg` #EDEDED                                                                     |
| Secondary text | `--c-muted` #7A7A7A (≈ 4.7:1 on bg)                                                  |
| Accent         | `--accent` gradient #7C5CFF → #00D4FF — **only glow and CTA**                        |
| Border         | `--border` 1px rgba(255,255,255,0.08)                                                |
| Radius         | `--radius` 16px                                                                      |
| Headings       | Space Grotesk, clamp(48px, 9vw, 160px), letter-spacing -0.04em, line-height 0.95     |
| Text           | Inter 400/500, 16–18px, line-height 1.6                                              |
| Spacing        | 4 / 8 / 16 / 24 / 40 / 64 / 120 px (`--s-1 … --s-30`), sections `min-height: 100svh` |
| Grid           | container max 1440px, gutters 24px mobile / 64px desktop (`--gutter`)                |

No stock icons, no emoji. The ◆ marker of tariff blocks is the CSS `.rhombus` in the accent gradient.

## Scenes (one WebGL canvas behind everything, scroll-driven)

Particles share one buffer; each particle has a precomputed target per scene (`src/webgl/targets.ts`):
`aPosA` sphere → `aPosB` grid → `aPosC` three clusters → `aPosD` ring → `aPosE` point.
The vertex shader morphs with `mix()` by `uProgress` (0…4). `uProgress` = sum of 4 segments bound to ScrollTrigger ranges (`bindSegment` in `src/core/scroll.ts`). Nothing is recomputed on the CPU.

Two extra uniforms, both 0 unless a scene sets them: `uChaos` (`scrollState.chaos`, the sphere frays into a cloud) and the particle dim (`scrollState.dim`, particles recede behind long text). Cluster centres come from registered DOM sources (`addClusterSource`); when two are on screen the clusters travel between them.

1. **hero** (`scenes/hero.ts`) — breathing sphere (simplex noise in the shader), cursor repulsion with inertia. Badge «AI & Business Automation · Астана», split-line title, «Рутину — системе. Решения — людям.», subtitle, scroll hint.
2. **pains** (`scenes/pains.ts`) — «Узнаёте?»: four situations. The sphere frays into a restless cloud (`uChaos`).
3. **morph** (`scenes/morph.ts`) — the cloud settles into an ordered plane (segment 0): «Заявка — в таблице. Чек — в учёте. Вы — в курсе.»
4. **demo** (`scenes/demo.ts`) — Telegram dialogue client → AI → hand-off to a person, messages one by one over the plane. Conditional data, labelled.
5. **roles** (`scenes/roles.ts`) — Клиент / AI / Сотрудник + four trust rules. The plane splits into three clusters under the roles (segment 1).
6. **tariffs** (`scenes/tariffs.ts`) — desktop: pin + horizontal x scroll; touch: native swipe with scroll-snap. Cards СТАРТ / РОСТ / СИСТЕМА, accordion «Что входит». The clusters move on under the cards. РОСТ has the accent glow.
7. **stats** (`scenes/stats.ts`) — counters from real data only: setup days, check days, channels, blocks in СИСТЕМА. Clusters close into a ring (segment 2) that pulses on each counter tick.
8. **process** (`scenes/process.ts`) — six steps; the ring steps back (dim) and beats once per step.
9. **faq** (`scenes/faq.ts`) — six questions, accordion with `aria-expanded`; ring still dimmed.
10. **cta** (`scenes/cta.ts`, `ui/ctaForm.ts`) — ring collapses to a point that flashes (segment 3). «Какой процесс отнимает больше всего времени?», category chips, «Как это устроено сейчас?», magnetic «Рассказать в Telegram»: a real link to t.me/zholic_01 with a ready message, also copied to the clipboard. On phones the point sits under the form (the question has scrolled away by the end of the page).

Global: custom cursor with inertia (off on touch), magnetic buttons, film grain (CSS, animated only on desktop), bloom (desktop only).

## Performance & motion rules

- 60 FPS. Animate only `transform` and `opacity`. Never animate width, height, top, left, margin, padding.
- WebGL DPR ≤ 2 (≤ 1.5 on mobile and when bloom is on). One canvas for the whole site.
- Mobile: 6 000 particles (desktop 20 000), no bloom, static grain.
- `prefers-reduced-motion`: static sphere frame, no morph, no parallax, no Lenis, text without animation, counters show final values.
- Lazy: 3D after first paint; heavy scene setup via `whenNear()` (IntersectionObserver).
- Mobile is mandatory — check at 390px: no horizontal overflow, clipped text or overlaps. Tariffs swipe horizontally without fighting vertical scroll.
- Lighthouse mobile Performance ≥ 85.
- Accessibility: visible focus styles, `aria-expanded` on accordions, contrast ≥ 4.5:1, CTA reachable by keyboard.
- SEO: title, description, Open Graph, `lang="ru"`.
- Background is exactly #050507 in WebGL too: set it with `scene.background`, never `setClearColor` (see `stage.ts`).

## Claude Code setup

- Hooks (`.claude/settings.json`, scripts in `scripts/hooks/`):
  - PreToolUse Read/Edit/Write: any path containing `.env` is refused (exit 2).
  - PostToolUse Edit/Write: Prettier on the changed file.
  - Stop: `npm run build` (on failure Claude gets the error and must fix it), then `scripts/screens.mjs` → `/screens`. One hook, sequential, because hooks of the same event run in parallel.
  - Notification: system sound.
- MCP (local scope, not in the repo): Playwright, Context7 (Three.js / GSAP docs). Playwright MCP writes to `.playwright-mcp/` (ignored).
- Dev server for this session's previews: `dev-alt` in `.claude/launch.json` (port 5180), so it does not clash with another chat's 5173 / 4173.
- Subagents (`.claude/agents/`): `webgl-artist`, `motion-designer`, `qa-reviewer` (read-only).

## Structure

```
index.html            semantic sections, data markup injected at build
src/main.ts           boot: Lenis, scenes, cursor, magnets, lazy WebGL
src/style.css         tokens, base, components, sections
src/data/             tariffs.ts (single source), markup.ts (static HTML)
src/content/          copy.ts (site copy), markup.ts (HTML of the copy-driven sections, built into index.html)
src/core/             device, lenis, scroll (scrollState, bindSegment, whenNear)
src/webgl/            stage, particles, targets, post, shaders/
src/ui/               splitText, reveal, cursor, magnetic, counters, hscroll, accordion, ctaForm
src/scenes/           hero, pains, morph, demo, roles, tariffs, stats, process, faq, cta
scripts/              screens.mjs, perf.mjs, verify-tariffs.mjs, hooks/
.github/workflows/    deploy.yml — npm ci, build, publish dist/ to GitHub Pages
docs/references.md    references
screens/              Playwright output
```
