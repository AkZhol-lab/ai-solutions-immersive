import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { device } from '../core/device';

/**
 * Buttons with [data-accordion] toggle the panel named in aria-controls.
 * No height animation: the panel switches instantly, its items fade/rise (opacity + transform).
 */
export function initAccordions(root: ParentNode = document): void {
  root.querySelectorAll<HTMLButtonElement>('button[data-accordion]').forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls') ?? '');
    if (!panel) return;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      if (open) {
        panel.scrollTop = 0;
        if (!device.reducedMotion) {
          gsap.fromTo(
            panel.querySelectorAll('.tblock'),
            { autoAlpha: 0, y: 12 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.8,
              ease: 'expo.out',
              stagger: 0.035,
              overwrite: true,
            },
          );
        }
      }
      // on mobile the card grows, so everything below moves
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });
  });
}
