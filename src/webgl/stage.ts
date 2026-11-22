import { Color, PerspectiveCamera, Scene, Vector2, WebGLRenderer } from 'three';
import { gsap } from 'gsap';
import { device } from '../core/device';
import { ScrollTrigger, scrollState } from '../core/scroll';
import { createParticles, type ParticleUniforms } from './particles';
import type { Post } from './post';

const FOV = 35;
/** ?capture (screenshots): uniforms snap to scroll state instead of easing */
const CAPTURE = new URLSearchParams(location.search).has('capture');
const CAM_Z = 8;

export interface Stage {
  uniforms: ParticleUniforms;
  /** visible world size at z = 0 */
  view: Vector2;
  pxToWorld(x: number, y: number): [number, number];
  renderOnce(): void;
  stats(): { fps: number; frameMs: number };
}

export async function createStage(canvas: HTMLCanvasElement): Promise<Stage | null> {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: false,
    });
  } catch {
    canvas.remove();
    return null;
  }
  const scene = new Scene();
  // scene.background (not setClearColor): the clear colour is cached in output colour space and
  // would be written unconverted into the composer's linear target, lifting black to grey.
  scene.background = new Color(0x050507);
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAM_Z);

  const { points, uniforms } = createParticles(device.particleCount);
  scene.add(points);
  uniforms.uMotion.value = device.reducedMotion ? 0 : 1;
  uniforms.uSize.value = device.mobile ? 22 : 24;
  // keep perceived density equal across particle counts
  const baseAlpha = device.mobile ? 1 : 0.7;
  uniforms.uAlpha.value = baseAlpha;
  let dim = 0;

  const view = new Vector2();
  let width = 0;
  let height = 0;
  let post: Post | null = null;

  const pxToWorld = (x: number, y: number): [number, number] => [
    (x / width - 0.5) * view.x,
    -(y / height - 0.5) * view.y,
  ];

  /**
   * World-space position of `[data-gl-anchor]` as it sits on screen when the page is scrolled to
   * the very end (the CTA's resting state). For a one-screen last section this is its offset from
   * the section centre; for a taller one it stays on screen (clamped to the top / bottom 10%).
   */
  const anchorOffset = (name: string): [number, number] | null => {
    const el = document.querySelector<HTMLElement>(`[data-gl-anchor="${name}"]`);
    if (!el) return null;
    const a = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const maxScroll = document.documentElement.scrollHeight - vh;
    const yAtEnd = a.top + a.height / 2 + window.scrollY - maxScroll;
    const y = Math.min(Math.max(yAtEnd, vh * 0.1), vh * 0.9);
    const dx = a.left + a.width / 2 - document.documentElement.clientWidth / 2;
    return [(dx / width) * view.x, -((y - vh / 2) / vh) * view.y];
  };
  const placePoint = (): void => {
    const p = anchorOffset('point');
    uniforms.uPointC.value.set(p ? p[0] : 0, p ? p[1] : view.y * 0.25, 0);
  };

  function layout(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // on touch, ignore small height changes (URL bar) to avoid re-layout jank
    if (device.touch && w === width && Math.abs(h - height) < 140) return;
    width = w;
    height = h;
    const dpr = device.dpr;
    renderer.setPixelRatio(post ? Math.min(dpr, 1.5) : dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    view.y = 2 * Math.tan((FOV * Math.PI) / 360) * CAM_Z;
    view.x = view.y * camera.aspect;
    uniforms.uView.value.copy(view);
    uniforms.uDpr.value = renderer.getPixelRatio();

    const portrait = w < 768 || w / h < 0.9;
    // the stats ring sits in the upper part of the screen, above the row of numbers
    // (a stroke through the digits makes «14» and «11» hard to read)
    if (portrait) {
      uniforms.uSphereR.value = Math.min(view.x * 0.4, view.y * 0.2);
      uniforms.uSphereC.value.set(0, view.y * 0.14, 0);
      uniforms.uRingR.value = Math.min(view.x * 0.32, view.y * 0.16);
      uniforms.uRingC.value.set(0, view.y * 0.24, 0);
    } else {
      uniforms.uSphereR.value = Math.min(view.y * 0.31, view.x * 0.22);
      uniforms.uSphereC.value.set(view.x * 0.2, view.y * 0.04, 0);
      uniforms.uRingR.value = Math.min(view.y * 0.24, view.x * 0.2);
      uniforms.uRingC.value.set(0, view.y * 0.17, 0);
    }
    uniforms.uGridW.value = Math.max(view.x * 0.85, 4.5);
    placePoint();

    post?.setSize(w, h);
    if (device.reducedMotion) renderOnce();
  }

  // ── pointer: smoothed position + force with inertia ──
  const pointer = { x: 99, y: 99, active: false, speed: 0, lastX: 0, lastY: 0 };
  if (!device.touch && !device.reducedMotion) {
    window.addEventListener(
      'pointermove',
      (e) => {
        const [wx, wy] = pxToWorld(e.clientX, e.clientY);
        const dx = e.clientX - pointer.lastX;
        const dy = e.clientY - pointer.lastY;
        pointer.speed = Math.min(pointer.speed + Math.hypot(dx, dy) * 0.004, 1.2);
        pointer.lastX = e.clientX;
        pointer.lastY = e.clientY;
        if (!pointer.active) {
          uniforms.uMouse.value.set(wx, wy, 0);
          pointer.active = true;
        }
        pointer.x = wx;
        pointer.y = wy;
      },
      { passive: true },
    );
    document.documentElement.addEventListener('pointerleave', () => (pointer.active = false));
  }

  // ── cluster centres from DOM (tariff cards) ──
  function updateClusters(): void {
    const cs = scrollState.clusters;
    for (let i = 0; i < 3; i++) {
      const v = uniforms.uClusters.value[i];
      const c = cs[i];
      if (!c) {
        v.set((i - 1) * view.x * 0.3, -view.y * 0.1, 0, view.y * 0.12);
        continue;
      }
      const [x, y] = pxToWorld(c.x, c.y);
      v.set(x, y, 0, (c.r / height) * view.y);
    }
  }

  // ── loop ──
  let frames = 0;
  let fps = 0;
  let frameMs = 0;
  let fpsT = performance.now();
  const start = performance.now();
  let last = start;

  function renderOnce(): void {
    updateClusters();
    if (post) post.render();
    else renderer.render(scene, camera);
  }

  function tick(): void {
    const now = performance.now();
    frameMs = frameMs * 0.9 + (now - last) * 0.1;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    const k = 1 - Math.pow(0.001, dt); // frame-rate independent smoothing (~fast)
    const slow = CAPTURE ? 1 : 1 - Math.pow(0.08, dt);

    uniforms.uTime.value = (now - start) / 1000;
    uniforms.uProgress.value +=
      (scrollState.progress - uniforms.uProgress.value) * Math.min(slow * 1.6, 1);
    uniforms.uFlash.value += (scrollState.flash - uniforms.uFlash.value) * slow;
    uniforms.uPulse.value += (scrollState.pulse - uniforms.uPulse.value) * k;
    uniforms.uChaos.value += (scrollState.chaos - uniforms.uChaos.value) * Math.min(slow * 1.6, 1);
    // particles recede behind long text; 0 → base alpha (unchanged)
    dim += (scrollState.dim - dim) * slow;
    // (additive blending saturates a dense ring, so the dim has to go deep to read as «behind»)
    uniforms.uAlpha.value = baseAlpha * (1 - 0.92 * dim);

    // inertia: the field follows the cursor late and the force fades out slowly
    const m = uniforms.uMouse.value;
    m.x += (pointer.x - m.x) * slow;
    m.y += (pointer.y - m.y) * slow;
    pointer.speed *= Math.pow(0.15, dt);
    const targetForce = pointer.active ? 0.55 + pointer.speed : 0;
    uniforms.uMouseForce.value += (targetForce - uniforms.uMouseForce.value) * slow * 0.8;

    // subtle camera parallax
    const cx = pointer.active ? m.x * 0.04 : 0;
    const cy = pointer.active ? m.y * 0.03 : 0;
    camera.position.x += (cx - camera.position.x) * slow;
    camera.position.y += (cy - camera.position.y) * slow;
    camera.lookAt(0, 0, 0);

    post?.setBloom(0.5 + uniforms.uFlash.value * 1.1);
    renderOnce();

    frames++;
    if (now - fpsT >= 1000) {
      fps = (frames * 1000) / (now - fpsT);
      frames = 0;
      fpsT = now;
    }
  }

  layout();

  if (device.desktop && !device.reducedMotion) {
    try {
      const { createPost } = await import('./post');
      post = createPost(renderer, scene, camera);
      width = 0; // force re-layout with post pixel ratio
      layout();
    } catch (err) {
      console.info('[gl] post-processing unavailable', err);
    }
  }

  window.addEventListener('resize', layout);
  // page height changes (pins, accordions) move where the CTA ends up on screen
  ScrollTrigger.addEventListener('refresh', placePoint);

  if (device.reducedMotion) {
    renderOnce();
  } else {
    gsap.ticker.add(tick);
  }

  canvas.classList.add('is-ready');

  return {
    uniforms,
    view,
    pxToWorld,
    renderOnce,
    stats: () => ({ fps, frameMs }),
  };
}
