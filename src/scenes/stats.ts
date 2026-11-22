import { gsap } from 'gsap';
import { device } from '../core/device';
import { ScrollTrigger, bindSegment } from '../core/scroll';
import { initCounters } from '../ui/counters';
import { fadeIn } from '../ui/splitText';

/**
 * Scene 4 — STATS: the clusters close into one ring (segment 2); counters from real data
 * (src/data/tariffs.ts, rendered at build time) count up, and every tick pulses the ring.
 * With reduced motion the markup already shows the final values.
 */
export function initStats(): void {
  const section = document.querySelector<HTMLElement>('#stats');
  if (!section) return;
  const items = Array.from(section.querySelectorAll<HTMLElement>('[data-reveal]'));

  if (device.reducedMotion) return;

  bindSegment(2, section, 'top bottom', 'center center');
  initCounters(section);
  fadeIn(section.querySelectorAll('[data-fade]'), 0, true);

  // hairline + number rise in one quiet stagger
  gsap.set(items, { autoAlpha: 0, y: 32 });
  ScrollTrigger.create({
    trigger: section,
    start: 'top 60%',
    once: true,
    onEnter: () =>
      gsap.to(items, { autoAlpha: 1, y: 0, duration: 1.4, ease: 'expo.out', stagger: 0.1 }),
  });
}
