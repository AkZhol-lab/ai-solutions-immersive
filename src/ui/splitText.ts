import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { device } from '../core/device';

/**
 * Line splitter: words are measured, grouped by offsetTop and wrapped into
 * `.split-line > .split-inner` masks. Re-splits on width change, keeping state.
 * `<br>` in the source forces a line break.
 */
export class SplitText {
  readonly el: HTMLElement;
  inners: HTMLElement[] = [];
  private tokens: string[] = [];
  private width = 0;
  private revealed = false;

  constructor(el: HTMLElement) {
    this.el = el;
    el.childNodes.forEach((n) => {
      if (n.nodeName === 'BR') this.tokens.push('\n');
      else (n.textContent ?? '').split(/[ \t\n\r]+/).forEach((w) => w && this.tokens.push(w));
    });
    this.split();
    splits.add(this);
  }

  split(): void {
    const el = this.el;
    this.width = el.offsetWidth;
    el.textContent = '';
    const words: HTMLSpanElement[] = [];
    const breaks = new Set<number>();
    for (const t of this.tokens) {
      if (t === '\n') {
        breaks.add(words.length);
        // keep the forced break while measuring, or the next words are laid out on the wrong line
        el.append(document.createElement('br'));
        continue;
      }
      const s = document.createElement('span');
      s.textContent = t;
      el.append(s, ' ');
      words.push(s);
    }
    const lines: string[][] = [];
    let top = -1;
    words.forEach((w, i) => {
      const y = w.offsetTop;
      if (i === 0 || breaks.has(i) || Math.abs(y - top) > 4) {
        lines.push([]);
        top = y;
      }
      lines[lines.length - 1].push(w.textContent ?? '');
    });
    el.textContent = '';
    this.inners = lines.map((line) => {
      const outer = document.createElement('span');
      outer.className = 'split-line';
      outer.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.className = 'split-inner';
      inner.textContent = line.join(' ');
      outer.append(inner);
      el.append(outer);
      return inner;
    });
    // readable text for assistive tech, independent of the (aria-hidden) line spans.
    // A visually hidden span, not aria-label: aria-label is prohibited on <p>.
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = this.tokens.join(' ').replace(/ ?\n ?/g, ' ');
    el.append(sr);
    el.classList.add('is-split');
    if (!device.reducedMotion) gsap.set(this.inners, { yPercent: this.revealed ? 0 : 110 });
  }

  resplitIfNeeded(): void {
    if (this.el.offsetWidth !== this.width) this.split();
  }

  reveal(opts: { delay?: number; duration?: number; stagger?: number } = {}): void {
    this.revealed = true;
    if (device.reducedMotion) return;
    gsap.to(this.inners, {
      yPercent: 0,
      duration: opts.duration ?? 1.4,
      ease: 'expo.out',
      stagger: opts.stagger ?? 0.09,
      delay: opts.delay ?? 0,
      overwrite: true,
    });
  }

  /** reveal when the element scrolls into view */
  revealOnScroll(start = 'top 80%'): void {
    if (device.reducedMotion) {
      this.revealed = true;
      return;
    }
    ScrollTrigger.create({ trigger: this.el, start, once: true, onEnter: () => this.reveal() });
  }
}

const splits = new Set<SplitText>();
let raf = 0;
window.addEventListener('resize', () => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => splits.forEach((s) => s.resplitIfNeeded()));
});

/**
 * fade + rise for small elements marked [data-fade].
 * opacity, not autoAlpha: visibility:hidden would take links (the CTA!) out of the tab order
 * until the user scrolls to them.
 */
export function fadeIn(els: Iterable<Element>, delay = 0, scroll = false): void {
  const list = Array.from(els);
  if (!list.length || device.reducedMotion) return;
  gsap.set(list, { opacity: 0, y: 16 });
  if (!scroll) {
    gsap.to(list, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay });
    return;
  }
  list.forEach((el) =>
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', delay }),
    }),
  );
}
