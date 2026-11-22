import { gsap } from 'gsap';
import { device } from '../core/device';

/** Custom cursor with inertia. Disabled on touch and with reduced motion. */
export function initCursor(): void {
  if (device.touch || device.reducedMotion) return;
  const root = document.querySelector<HTMLElement>('.cursor');
  const dot = root?.querySelector<HTMLElement>('.cursor-dot');
  const ring = root?.querySelector<HTMLElement>('.cursor-ring');
  const ringScale = root?.querySelector<HTMLElement>('.cursor-ring-scale');
  if (!root || !dot || !ring || !ringScale) return;

  document.documentElement.classList.add('has-cursor');
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3.out' });

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      root.classList.add('is-visible');
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () =>
    root.classList.remove('is-visible'),
  );

  const interactive = 'a, button, [data-magnetic]';
  document.addEventListener('pointerover', (e) => {
    const hit = (e.target as Element | null)?.closest(interactive);
    ringScale.style.transform = hit ? 'scale(1.6)' : '';
    dot.style.opacity = hit ? '0' : '';
  });
}
