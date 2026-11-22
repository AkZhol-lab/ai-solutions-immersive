import { gsap } from 'gsap';
import { device } from '../core/device';
import { bindSegment } from '../core/scroll';
import { SplitText, fadeIn } from '../ui/splitText';

/**
 * Scene 2 — MORPH / manifest: the sphere scatters into an ordered plane (segment 0)
 * while «Заявки, клиенты, деньги. Всё на своих местах.» appears line by line.
 */
export function initMorph(): void {
  const section = document.querySelector<HTMLElement>('#manifest');
  const text = section?.querySelector<HTMLElement>('[data-split]');
  if (!section || !text) return;

  const split = new SplitText(text);
  if (device.reducedMotion) return;

  // sphere → grid: complete when the manifest sits in the middle of the screen
  bindSegment(0, section, 'top bottom', 'center center');

  split.revealOnScroll('top 62%');
  // slower stagger than the hero: the lines land as the plane settles
  fadeIn(section.querySelectorAll('[data-fade]'), 0, true);

  // exit: the line drifts up and dims as the clusters start to form
  gsap.to(section.querySelector('.manifest-inner'), {
    yPercent: -8,
    autoAlpha: 0,
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'center 35%', end: 'bottom top', scrub: true },
  });
}
