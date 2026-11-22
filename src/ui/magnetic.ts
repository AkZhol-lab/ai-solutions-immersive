import { gsap } from 'gsap';
import { device } from '../core/device';

/** Elements with [data-magnetic] lean toward the cursor; [data-magnetic-inner] leans further. */
export function initMagnetic(root: ParentNode = document): void {
  if (device.touch || device.reducedMotion) return;
  root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magneticStrength ?? 0.3);
    const inner = el.querySelector<HTMLElement>('[data-magnetic-inner]');
    const opts = { duration: 0.8, ease: 'power3.out' };
    const x = gsap.quickTo(el, 'x', opts);
    const y = gsap.quickTo(el, 'y', opts);
    const ix = inner ? gsap.quickTo(inner, 'x', opts) : null;
    const iy = inner ? gsap.quickTo(inner, 'y', opts) : null;
    if (inner) inner.style.display = 'inline-block';

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      x(dx * strength);
      y(dy * strength);
      ix?.(dx * strength * 0.4);
      iy?.(dy * strength * 0.4);
    });
    el.addEventListener('pointerleave', () => {
      const back = { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.4)' };
      x.tween.kill();
      y.tween.kill();
      gsap.to(el, back);
      if (inner) {
        ix?.tween.kill();
        iy?.tween.kill();
        gsap.to(inner, back);
      }
    });
  });
}
