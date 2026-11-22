import { gsap } from 'gsap';
import { device } from '../core/device';
import { ScrollTrigger, bindSegment, scrollState } from '../core/scroll';
import { initCtaForm } from '../ui/ctaForm';
import { SplitText, fadeIn } from '../ui/splitText';

/**
 * Scene 10 — CTA: the ring collapses into one point (segment 3), the point flashes once and
 * keeps a soft glow. «Какой процесс отнимает больше всего времени?» + a short form that opens
 * Telegram @zholic_01 with a ready message (ui/ctaForm.ts); the button is magnetic (ui/magnetic.ts).
 */
export function initCta(): void {
  const section = document.querySelector<HTMLElement>('#cta');
  const title = section?.querySelector<HTMLElement>('[data-split]');
  if (!section || !title) return;
  initCtaForm();
  const glow = section.querySelector<HTMLElement>('.cta-glow');
  const anchor = section.querySelector<HTMLElement>('.cta-anchor');

  // phones: the section is taller than the screen, so at the end of the page the question has
  // scrolled away; the point gathers in the gap under the form, which is on screen at the end
  const form = section.querySelector('.s-form');
  if (anchor && form && matchMedia('(max-width: 1023px)').matches) form.after(anchor);

  // the glow is centred on the particle point (static `top`, set on layout only)
  const placeGlow = (): void => {
    if (!glow || !anchor) return;
    const s = section.getBoundingClientRect();
    const a = anchor.getBoundingClientRect();
    glow.style.top = `${a.top - s.top}px`;
  };
  placeGlow();
  ScrollTrigger.addEventListener('refresh', placeGlow);

  const split = new SplitText(title);
  if (device.reducedMotion) return;

  // ring → point; the CTA is the last screen, so the range must end before the page does
  bindSegment(3, section, 'top bottom', 'top 20%');

  split.revealOnScroll('top 55%');
  fadeIn(section.querySelectorAll('[data-fade]'), 0.35, true);

  // the flash: a short burst of light, then a quiet afterglow
  const flash = gsap
    .timeline({ paused: true })
    .to(scrollState, { flash: 1, duration: 0.35, ease: 'power2.out' })
    .to(scrollState, { flash: 0.2, duration: 1.8, ease: 'power2.inOut' });
  if (glow) {
    flash
      .fromTo(
        glow,
        { autoAlpha: 0, scale: 0.2 },
        { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'expo.out' },
        0,
      )
      .to(glow, { autoAlpha: 0.5, duration: 1.8, ease: 'power2.inOut' }, 0.6);
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top 20%',
    onEnter: () => flash.restart(),
    onLeaveBack: () => {
      flash.pause();
      gsap.to(scrollState, { flash: 0, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
      if (glow) gsap.to(glow, { autoAlpha: 0, scale: 0.2, duration: 0.6, ease: 'power2.out' });
    },
  });
}
