import { gsap } from 'gsap';
import type { ScrollTrigger as ScrollTriggerInstance } from 'gsap/ScrollTrigger';
import { device } from '../core/device';
import { scrollToTarget } from '../core/lenis';
import { ScrollTrigger, addClusterSource, whenNear } from '../core/scroll';
import { initAccordions } from '../ui/accordion';
import { initHScroll } from '../ui/hscroll';
import { SplitText, fadeIn } from '../ui/splitText';

/**
 * Scene 3 — TARIFFS. Desktop: pin + horizontal scrub of the track. Touch / narrow: native swipe
 * with scroll-snap. Particles leave the plane and gather into three clusters, one under each card;
 * the cluster centres are read from the DOM every frame while the section is on screen.
 */
export function initTariffs(): void {
  const section = document.querySelector<HTMLElement>('#tariffs');
  const pin = section?.querySelector<HTMLElement>('.tariffs-pin');
  const track = section?.querySelector<HTMLElement>('[data-hscroll]');
  if (!section || !pin || !track) return;
  const cards = Array.from(section.querySelectorAll<HTMLElement>('.tcard'));

  initAccordions(section);
  const title = section.querySelector<HTMLElement>('[data-split]');
  const split = title ? new SplitText(title) : null;

  // pin first: every trigger below it must be measured with the pin spacing in place
  let pinST: ScrollTriggerInstance | null = null;
  initHScroll(section, pin, track, (st) => (pinST = st));

  // keyboard: the track moves by transform, so focus would land on an off-screen card.
  // Scroll the pinned range so the focused card is centred (scrub is 1 px scroll : 1 px x).
  track.addEventListener('focusin', (e) => {
    const card = (e.target as Element).closest<HTMLElement>('.tcard');
    if (!card || !pinST) return;
    const vw = document.documentElement.clientWidth;
    const distance = pinST.end - pinST.start;
    const x = card.offsetLeft + card.offsetWidth / 2 - vw / 2;
    scrollToTarget(pinST.start + Math.min(Math.max(x, 0), distance), true);
  });

  if (device.reducedMotion) return;

  // the plane → clusters morph (segment 1) happens under the roles above (scenes/roles.ts);
  // here the same clusters just move on under the cards

  split?.revealOnScroll('top 75%');
  fadeIn(section.querySelectorAll('.tariffs-intro [data-fade]'), 0.1, true);
  // opacity only: the cards' buttons must stay in the tab order before they are revealed
  gsap.set(cards, { opacity: 0, y: 40 });
  ScrollTrigger.create({
    trigger: section,
    start: 'top 70%',
    once: true,
    onEnter: () =>
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 1.4,
        ease: 'expo.out',
        stagger: 0.12,
        delay: 0.15,
      }),
  });

  // cluster centres follow the cards (horizontal scrub on desktop, swipe on touch)
  whenNear(section, () =>
    addClusterSource(section, () =>
      cards.map((card) => {
        const r = card.getBoundingClientRect();
        // centre a little below the price; the cloud spills past the card edges so it reads
        // as a formation and not only as a blur behind the glass
        return { x: r.left + r.width / 2, y: r.top + r.height * 0.6, r: r.width * 0.7 };
      }),
    ),
  );
}
