import './style.css';
import { device } from './core/device';
import { initLenis, scrollToTarget } from './core/lenis';
import { ScrollTrigger } from './core/scroll';
import { initCursor } from './ui/cursor';
import { initMagnetic } from './ui/magnetic';
import { initHero } from './scenes/hero';
import { initPains } from './scenes/pains';
import { initMorph } from './scenes/morph';
import { initDemo } from './scenes/demo';
import { initRoles } from './scenes/roles';
import { initTariffs } from './scenes/tariffs';
import { initStats } from './scenes/stats';
import { initProcess } from './scenes/process';
import { initFaq } from './scenes/faq';
import { initCta } from './scenes/cta';
import type { Stage } from './webgl/stage';

declare global {
  interface Window {
    __app?: {
      ready: boolean;
      scrollToScene(name: string): void;
      scrollToY(y: number): void;
      stats(): { fps: number; frameMs: number } | null;
    };
  }
}

let stage: Stage | null = null;

const fontsReady = (): Promise<unknown> =>
  Promise.race([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise((r) => setTimeout(r, 450)),
  ]);

/** WebGL is loaded after the first paint so the headline (LCP) is never blocked by three.js. */
function loadStage(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#gl');
  if (!canvas) return;
  const go = (): void => {
    import('./webgl/stage')
      .then(({ createStage }) => createStage(canvas))
      .then((s) => {
        stage = s;
        if (window.__app) window.__app.ready = true;
      })
      .catch((err) => console.info('[gl] disabled', err));
  };
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1200 });
  else setTimeout(go, 300);
}

async function boot(): Promise<void> {
  if (device.reducedMotion) document.documentElement.classList.remove('motion');
  initLenis();
  await fontsReady();

  // scenes in page order: ScrollTriggers (and the tariffs pin) must be created top to bottom
  initHero();
  initPains();
  initMorph();
  initDemo();
  initRoles();
  initTariffs();
  initStats();
  initProcess();
  initFaq();
  initCta();
  initCursor();
  initMagnetic();

  ScrollTrigger.refresh();
  loadStage();
}

window.__app = {
  ready: false,
  scrollToScene(name) {
    const el = document.querySelector<HTMLElement>(`[data-scene="${name}"]`);
    if (el) scrollToTarget(el, true);
  },
  scrollToY: (y) => scrollToTarget(y, true),
  stats: () => stage?.stats() ?? null,
};

boot();
