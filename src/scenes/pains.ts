import { device } from '../core/device';
import { ScrollTrigger, scrollState } from '../core/scroll';
import { revealSection } from '../ui/reveal';

/**
 * Scene 2 — «Узнаёте?»: four recognisable situations. The calm sphere frays into a restless
 * cloud (uChaos); the manifest that follows pulls it into an ordered plane.
 */
export function initPains(): void {
  const section = document.querySelector<HTMLElement>('#pains');
  if (!section) return;
  revealSection(section);
  if (device.reducedMotion) return;
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'center center',
    onUpdate: (self) => (scrollState.chaos = self.progress),
    onRefresh: (self) => (scrollState.chaos = self.progress),
  });
}
