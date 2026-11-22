import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { device } from './device';

let lenis: Lenis | null = null;

/** Smooth scroll on desktop only. Touch keeps native scrolling (no conflicts with swipes). */
export function initLenis(): Lenis | null {
  if (device.reducedMotion || device.touch) return null;
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function getLenis(): Lenis | null {
  return lenis;
}

/** Instant / smooth jump that works with and without Lenis. */
export function scrollToTarget(target: HTMLElement | number, immediate = false): void {
  if (lenis) {
    lenis.scrollTo(target, { immediate, force: true });
    return;
  }
  const y =
    typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: y, behavior: immediate || device.reducedMotion ? 'auto' : 'smooth' });
}
