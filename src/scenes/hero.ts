import { gsap } from 'gsap';
import { device } from '../core/device';
import { SplitText, fadeIn } from '../ui/splitText';

/** Scene 1 — HERO: split-line reveal of the headline, quiet fade of the rest, soft exit parallax. */
export function initHero(): void {
  const section = document.querySelector<HTMLElement>('#hero');
  const title = section?.querySelector<HTMLElement>('[data-split]');
  if (!section || !title) return;

  const split = new SplitText(title);
  split.reveal({ delay: 0.15, duration: 1.6, stagger: 0.12 });
  fadeIn(section.querySelectorAll('[data-fade]'), 0.75);
  fadeIn(document.querySelectorAll('.site-header .container-x > *'), 0.5);

  if (device.reducedMotion) return;
  // exit: headline drifts up and dims while the sphere starts to dissolve
  gsap.to(section.querySelector('.hero-inner'), {
    yPercent: -12,
    // opacity, not autoAlpha: the scroll hint link stays focusable when tabbing back up
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top top', end: 'bottom 20%', scrub: true },
  });
}
