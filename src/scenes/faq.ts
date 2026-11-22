import { gsap } from 'gsap';
import { device } from '../core/device';
import { ScrollTrigger } from '../core/scroll';
import { revealSection } from '../ui/reveal';

/**
 * Scene 9 — FAQ accordion. The answer switches instantly (no height animation) and its text
 * fades in; aria-expanded / hidden carry the state for assistive tech.
 */
export function initFaq(): void {
  const section = document.querySelector<HTMLElement>('#faq');
  if (!section) return;
  revealSection(section);
  section.querySelectorAll<HTMLButtonElement>('.s-faq-q').forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls') ?? '');
    if (!panel) return;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      if (open && !device.reducedMotion && panel.firstElementChild)
        gsap.fromTo(
          panel.firstElementChild,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', overwrite: true },
        );
      // the page got taller or shorter: everything below has to be re-measured
      requestAnimationFrame(() => ScrollTrigger.refresh());
    });
  });
}
