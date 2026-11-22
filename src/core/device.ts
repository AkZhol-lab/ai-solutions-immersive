/** Device capabilities, read once at boot (and on resize where it matters). */
const mq = (q: string): boolean => typeof matchMedia === 'function' && matchMedia(q).matches;

export const device = {
  reducedMotion: mq('(prefers-reduced-motion: reduce)'),
  /** true for touch-first devices (no hover, coarse pointer) */
  touch: mq('(hover: none), (pointer: coarse)'),
  get mobile(): boolean {
    return window.innerWidth < 768 || this.touch;
  },
  /** desktop = can afford bloom + full particle count */
  get desktop(): boolean {
    return !this.mobile;
  },
  /** canvas DPR, never above 2 (1.5 on mobile) */
  get dpr(): number {
    return Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 2);
  },
  get particleCount(): number {
    return this.mobile ? 6000 : 20000;
  },
};

export type Device = typeof device;
