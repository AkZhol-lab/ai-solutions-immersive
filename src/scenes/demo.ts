import { gsap } from 'gsap';
import { device } from '../core/device';
import { ScrollTrigger } from '../core/scroll';
import { revealSection } from '../ui/reveal';

/** ?capture (screenshots) needs the finished dialogue, not a frame in the middle */
const CAPTURE = new URLSearchParams(location.search).has('capture');

/**
 * Scene 4 — Telegram demo over the calm plane: client → AI → hand-off to a person.
 * Messages appear one by one; before each AI reply the «typing» dots show in the bubble's own
 * grid cell, so the space is reserved and nothing reflows. Conditional data, labelled under the chat.
 */
export function initDemo(): void {
  const section = document.querySelector<HTMLElement>('#demo');
  if (!section) return;
  revealSection(section);
  const chat = section.querySelector<HTMLElement>('.s-chat');
  if (!chat || device.reducedMotion) return;

  const steps = Array.from(chat.querySelectorAll<HTMLElement>('[data-msg]'));
  const bubbles = steps.map((s) => s.querySelector<HTMLElement>('.s-bubble') ?? s);
  gsap.set(chat, { opacity: 0, y: 40 });
  gsap.set(bubbles, { opacity: 0, y: 12 });

  const tl = gsap.timeline({ paused: true });
  tl.to(chat, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out' });
  steps.forEach((step, i) => {
    const typing = step.querySelector('.s-typing');
    const show = { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' };
    if (typing) {
      tl.to(typing, { opacity: 1, duration: 0.25 }, '+=0.35')
        .to(typing, { opacity: 0, duration: 0.2 }, '+=0.9')
        .to(bubbles[i], show, '<');
    } else {
      tl.to(bubbles[i], show, i ? '+=0.7' : '-=0.6');
    }
  });

  ScrollTrigger.create({
    trigger: chat,
    start: 'top 75%',
    once: true,
    onEnter: () => (CAPTURE ? tl.progress(1) : tl.play()),
  });
}
