import { gsap } from 'gsap';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import { device } from '../core/device';

/**
 * Desktop (fine pointer, ≥1024px): pin the section and scrub the track on x.
 * Touch / narrow: native horizontal swipe with scroll-snap (CSS) — no pin, no gesture conflict.
 * `onPin` receives the pin ScrollTrigger on desktop, null otherwise.
 */
export function initHScroll(
  section: HTMLElement,
  pin: HTMLElement,
  track: HTMLElement,
  onPin: (st: ScrollTrigger | null) => void,
): void {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px) and (hover: hover) and (pointer: fine)', () => {
    if (device.reducedMotion) return;
    // clientWidth, not innerWidth: the classic scrollbar would eat into the right gutter
    const distance = (): number =>
      Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        pin,
        start: 'top top',
        end: () => `+=${distance()}`,
        scrub: true,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
    onPin(tween.scrollTrigger ?? null);
    return () => onPin(null);
  });
}
