import { device } from '../core/device';
import { ScrollTrigger, scrollState } from '../core/scroll';
import { revealSection, ringBeat } from '../ui/reveal';

/**
 * Scene 8 — the six steps of the work. The ring from the stats steps back (dim) while there is
 * a lot to read (process + FAQ) and comes back for the CTA; each step lands with one beat.
 */
export function initProcess(): void {
  const section = document.querySelector<HTMLElement>('#process');
  if (!section) return;
  revealSection(section);
  if (device.reducedMotion) return;

  let inDim = 0;
  let outDim = 0;
  const apply = (): void => {
    scrollState.dim = inDim * (1 - outDim);
  };
  ScrollTrigger.create({
    trigger: section,
    start: 'top 85%',
    end: 'top 35%',
    onUpdate: (s) => ((inDim = s.progress), apply()),
    onRefresh: (s) => ((inDim = s.progress), apply()),
  });
  const cta = document.querySelector('#cta');
  if (cta)
    ScrollTrigger.create({
      trigger: cta,
      start: 'top bottom',
      end: 'top 40%',
      onUpdate: (s) => ((outDim = s.progress), apply()),
      onRefresh: (s) => ((outDim = s.progress), apply()),
    });

  section
    .querySelectorAll<HTMLElement>('.s-step')
    .forEach((step) =>
      ScrollTrigger.create({
        trigger: step,
        start: 'top 80%',
        once: true,
        onEnter: () => ringBeat(),
      }),
    );
}
