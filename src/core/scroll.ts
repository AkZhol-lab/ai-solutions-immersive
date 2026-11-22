import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll state shared with WebGL.
 * `segments[i]` is the 0..1 progress of the morph from scene i to scene i+1.
 * uProgress = sum(segments) → 0 (sphere) … 4 (point).
 */
export const scrollState = {
  segments: [0, 0, 0, 0],
  get progress(): number {
    return this.segments.reduce((a, b) => a + b, 0);
  },
  /** CTA flash 0..1 */
  flash: 0,
  /** pulse of the stats ring 0..1 (set by counters) */
  pulse: 0,
  /** world-space-independent card centres (viewport px), written by the cluster sources below */
  clusters: [] as Cluster[],
  /** 0..1: the hero sphere loses its shape (scene «Узнаёте?»); 0 elsewhere */
  chaos: 0,
  /** 0..1: particles recede behind long text (process / FAQ); 0 elsewhere */
  dim: 0,
};

export interface Cluster {
  x: number;
  y: number;
  r: number;
}

const segmentTriggers: (ScrollTrigger | undefined)[] = [];

/**
 * Bind one morph segment to a ScrollTrigger range.
 * Binding the same index again replaces the previous range (a page variant can move a morph).
 */
export function bindSegment(
  index: number,
  trigger: Element,
  start = 'top bottom',
  end = 'center center',
): ScrollTrigger {
  segmentTriggers[index]?.kill();
  return (segmentTriggers[index] = ScrollTrigger.create({
    trigger,
    start,
    end,
    onUpdate: (self) => {
      scrollState.segments[index] = self.progress;
    },
    onRefresh: (self) => {
      scrollState.segments[index] = self.progress;
    },
  }));
}

/* ───────── cluster sources: DOM blocks the three particle clusters sit under ───────── */

interface ClusterSource {
  read: () => Cluster[];
  active: boolean;
}
const clusterSources: ClusterSource[] = [];
let clusterTicker = false;

/** how close a set of centres is to the middle of the screen: 1 centred … 0 a screen away */
const focus = (cs: Cluster[]): number => {
  const vh = window.innerHeight;
  const y = cs.reduce((s, c) => s + c.y, 0) / Math.max(cs.length, 1);
  return Math.max(0, 1 - Math.abs(y - vh / 2) / vh);
};

function updateClusters(): void {
  const live = clusterSources.filter((s) => s.active).map((s) => s.read());
  if (!live.length) return;
  if (live.length === 1) {
    scrollState.clusters = live[0];
    return;
  }
  // two blocks on screen at once: the clusters travel from one to the other with the scroll
  const w = live.map(focus);
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  scrollState.clusters = live[0].map((_, i) => {
    const c = { x: 0, y: 0, r: 0 };
    live.forEach((cs, k) => {
      const f = w[k] / sum;
      c.x += (cs[i]?.x ?? 0) * f;
      c.y += (cs[i]?.y ?? 0) * f;
      c.r += (cs[i]?.r ?? 0) * f;
    });
    return c;
  });
}

/**
 * Register a block whose three items the clusters gather under, while `section` is on screen.
 * `read` returns the centres in viewport px; it runs every frame only while the block is visible.
 */
export function addClusterSource(section: Element, read: () => Cluster[]): void {
  const source: ClusterSource = { read, active: false };
  clusterSources.push(source);
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      source.active = self.isActive;
      updateClusters();
    },
  });
  scrollState.clusters = scrollState.clusters.length ? scrollState.clusters : read();
  if (!clusterTicker) {
    clusterTicker = true;
    gsap.ticker.add(updateClusters);
    window.addEventListener('resize', updateClusters);
  }
}

/** Run `init` once when `el` comes within ~1 viewport (lazy heavy sections). */
export function whenNear(el: Element, init: () => void, margin = '100% 0px'): void {
  if (!('IntersectionObserver' in window)) {
    init();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        init();
      }
    },
    { rootMargin: margin },
  );
  io.observe(el);
}

export { gsap, ScrollTrigger };
