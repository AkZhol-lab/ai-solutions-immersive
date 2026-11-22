import { device } from '../core/device';
import { addClusterSource, bindSegment, whenNear } from '../core/scroll';
import { revealSection } from '../ui/reveal';

/**
 * Scene 5 — Client / AI / Employee + four trust rules. The plane splits into three clusters,
 * one under each role (segment 1); the same clusters then travel on under the tariff cards.
 */
export function initRoles(): void {
  const section = document.querySelector<HTMLElement>('#roles');
  const list = section?.querySelector<HTMLElement>('.s-role-list');
  if (!section || !list) return;
  revealSection(section);
  if (device.reducedMotion) return;

  bindSegment(1, list, 'top bottom', 'center center');
  const roles = Array.from(list.querySelectorAll<HTMLElement>('.s-role'));
  whenNear(section, () =>
    addClusterSource(section, () =>
      roles.map((card) => {
        const r = card.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width * 0.6 };
      }),
    ),
  );
}
