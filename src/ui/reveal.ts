import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { device } from '../core/device';
import { scrollState } from '../core/scroll';
import { SplitText, fadeIn } from './splitText';

/**
 * Standard entrance of a content section: split title line by line, small texts fade in,
 * every [data-stagger] list rises item by item (opacity + transform only; items stay focusable).
 */
export function revealSection(section: HTMLElement): void {
  const title = section.querySelector<HTMLElement>('[data-split]');
  if (title) new SplitText(title).revealOnScroll('top 78%');
  fadeIn(section.querySelectorAll('.s-head [data-fade], .s-sub, .s-outro'), 0.1, true);
  if (device.reducedMotion) return;
  section.querySelectorAll<HTMLElement>('[data-stagger]').forEach((list) => {
    const items = Array.from(list.children) as HTMLElement[];
    gsap.set(items, { opacity: 0, y: 32 });
    ScrollTrigger.create({
      trigger: list,
      start: 'top 82%',
      once: true,
      onEnter: () =>
        gsap.to(items, { opacity: 1, y: 0, duration: 1.3, ease: 'expo.out', stagger: 0.1 }),
    });
  });
}

/** one beat of the particle ring (same feel as the stats counters) */
export function ringBeat(strength = 0.8): void {
  scrollState.pulse = strength;
  gsap.to(scrollState, { pulse: 0, duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
}
