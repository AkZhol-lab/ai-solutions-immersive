/**
 * Per-particle target positions for every scene, computed once.
 * Units are normalised; the vertex shader scales them to the viewport via uniforms.
 */
export interface Targets {
  count: number;
  a: Float32Array; // sphere, unit
  b: Float32Array; // grid
  c: Float32Array; // cluster local offset, unit ball
  cluster: Float32Array; // 0 | 1 | 2
  d: Float32Array; // ring, unit
  e: Float32Array; // point, unit ball
  random: Float32Array; // vec4
}

// small deterministic PRNG so every load looks the same
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (rnd: () => number): number => {
  const u = Math.max(rnd(), 1e-6);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
};

export function buildTargets(count: number): Targets {
  const rnd = mulberry32(7);
  const a = new Float32Array(count * 3);
  const b = new Float32Array(count * 3);
  const c = new Float32Array(count * 3);
  const cluster = new Float32Array(count);
  const d = new Float32Array(count * 3);
  const e = new Float32Array(count * 3);
  const random = new Float32Array(count * 4);

  // Grid: cols × rows lattice on a receding plane (tilted floor)
  const cols = Math.round(Math.sqrt(count * 2.2));
  const rows = Math.ceil(count / cols);

  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // A — Fibonacci sphere, most points on the shell, some inside for depth
    const y = 1 - (i / (count - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i;
    const shell = rnd() < 0.86 ? 1 - rnd() * 0.04 : 0.55 + rnd() * 0.4;
    a[i3] = Math.cos(th) * rad * shell;
    a[i3 + 1] = y * shell;
    a[i3 + 2] = Math.sin(th) * rad * shell;

    // B — grid: an endless calm plane receding to the horizon
    const col = i % cols;
    const row = Math.floor(i / cols);
    const gx = (col / (cols - 1)) * 2 - 1; // −1..1, scaled by uGridW in shader
    const gz = row / Math.max(rows - 1, 1); // 0 near … 1 far
    b[i3] = gx;
    b[i3 + 1] = -0.75;
    b[i3 + 2] = 2.6 - gz * 11.5;

    // C — three gaussian clusters, flattened like discs
    const k = i % 3;
    cluster[i] = k;
    const gr = Math.min(Math.abs(gauss(rnd)) * 0.45, 1.25);
    const ga = rnd() * Math.PI * 2;
    const gy = gauss(rnd) * 0.25;
    c[i3] = Math.cos(ga) * gr;
    c[i3 + 1] = gy;
    c[i3 + 2] = Math.sin(ga) * gr;

    // D — thin ring with a soft halo
    const ra = (i / count) * Math.PI * 2 * 7.0 + rnd() * 0.02;
    const halo = rnd() < 0.82 ? gauss(rnd) * 0.012 : gauss(rnd) * 0.07;
    d[i3] = Math.cos(ra) * (1 + halo);
    d[i3 + 1] = Math.sin(ra) * (1 + halo);
    d[i3 + 2] = gauss(rnd) * 0.03;

    // E — tight ball
    const er = Math.cbrt(rnd());
    const eu = rnd() * 2 - 1;
    const et = rnd() * Math.PI * 2;
    const es = Math.sqrt(1 - eu * eu);
    e[i3] = Math.cos(et) * es * er;
    e[i3 + 1] = eu * er;
    e[i3 + 2] = Math.sin(et) * es * er;

    random[i * 4] = rnd();
    random[i * 4 + 1] = rnd();
    random[i * 4 + 2] = rnd();
    random[i * 4 + 3] = rnd();
  }

  return { count, a, b, c, cluster, d, e, random };
}
