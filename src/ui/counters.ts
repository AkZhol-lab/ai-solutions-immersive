import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { device } from '../core/device';
import { scrollState } from '../core/scroll';

/** Counts [data-count] elements up from 0 when `trigger` enters; each step pulses the GL ring. */
export function initCounters(trigger: Element): void {
  const els = Array.from(trigger.querySelectorAll<HTMLElement>('[data-count]'));
  if (device.reducedMotion || !els.length) return;
  els.forEach((el) => (el.textContent = '0'));

  const bump = (): void => {
    scrollState.pulse = 1;
    // 'auto', not true: true would kill every tween on scrollState, including the CTA flash
    gsap.to(scrollState, { pulse: 0, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
  };

  ScrollTrigger.create({
    trigger,
    start: 'top 55%',
    once: true,
    onEnter: () => {
      els.forEach((el, i) => {
        const target = Number(el.dataset.count);
        const o = { v: 0 };
        let shown = 0;
        gsap.to(o, {
          v: target,
          duration: 1.2 + target * 0.04,
          delay: i * 0.12,
          ease: 'power2.out',
          onUpdate: () => {
            const n = Math.round(o.v);
            if (n !== shown) {
              shown = n;
              el.textContent = String(n);
              bump();
            }
          },
        });
      });
    },
  });

  // slow heartbeat while the section is on screen
  const beat = gsap
    .timeline({ repeat: -1, paused: true, delay: 2 })
    .to(scrollState, { pulse: 0.7, duration: 0.18, ease: 'power2.out' })
    .to(scrollState, { pulse: 0, duration: 0.9, ease: 'power2.inOut' })
    .to({}, { duration: 0.5 });
  ScrollTrigger.create({
    trigger,
    start: 'top center',
    end: 'bottom center',
    onToggle: (self) => (self.isActive ? beat.play() : beat.pause()),
  });
}
