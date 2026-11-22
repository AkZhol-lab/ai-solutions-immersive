// Particles: every scene target is precomputed per particle (aPosA…aPosE).
// The morph happens only here, via mix() driven by uProgress (0 sphere → 4 point).

uniform float uTime;
uniform float uProgress;
uniform float uDpr;
uniform float uSize;
uniform float uAlpha;
uniform float uFlash;
uniform float uPulse;
uniform float uChaos;           // 0..1: the sphere loses its shape (scene «Узнаёте?»); 0 = no effect
uniform float uMotion;         // 0 when prefers-reduced-motion
uniform vec2 uView;             // visible world size at z = 0
uniform vec3 uMouse;            // smoothed cursor, world space
uniform float uMouseForce;
uniform float uSphereR;
uniform vec3 uSphereC;
uniform float uGridW;
uniform float uRingR;
uniform vec3 uRingC;
uniform vec3 uPointC;
uniform vec4 uClusters[3];      // xyz centre, w radius

attribute vec3 aPosA;           // hero sphere (unit)
attribute vec3 aPosB;           // manifesto grid
attribute vec3 aPosC;           // cluster local offset (unit ball)
attribute float aCluster;       // 0 / 1 / 2
attribute vec3 aPosD;           // ring (unit)
attribute vec3 aPosE;           // point (unit ball)
attribute vec4 aRandom;

varying vec3 vColor;
varying float vAlpha;

uniform vec3 uColorBase;
uniform vec3 uColorA;
uniform vec3 uColorB;

// Simplex 3D noise — Ian McEwan, Ashima Arts (MIT)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y +
                           vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }

// staggered, eased 0..1 for the transition that starts at scene index i
float phase(float i) {
  float t = clamp((uProgress - i) * 1.3 - aRandom.x * 0.3, 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

void main() {
  float t = uTime * uMotion;

  // ── A: breathing sphere ──
  vec3 dirA = rotY(t * 0.045) * rotX(0.35) * aPosA;
  float n = snoise(dirA * 1.1 + vec3(0.0, 0.0, t * 0.11));
  float breath = 1.0 + 0.018 * sin(t * 0.55);
  vec3 posA = uSphereC + dirA * uSphereR * breath * (1.0 + 0.065 * n);

  // ── B: ordered grid (slow wave so structure still breathes) ──
  vec3 posB = vec3(aPosB.x * uGridW, aPosB.y, aPosB.z);
  posB.y += 0.035 * sin(aPosB.x * 3.0 + t * 0.6) * cos(aPosB.z * 2.0 + t * 0.4);

  // ── C: three clusters under the cards ──
  int ci = int(aCluster + 0.5);
  vec4 cl = ci == 0 ? uClusters[0] : (ci == 1 ? uClusters[1] : uClusters[2]);
  vec3 posC = cl.xyz + rotY(t * 0.12 + aCluster) * aPosC * cl.w;

  // ── D: pulsing ring ──
  float ringPulse = 1.0 + 0.045 * uPulse + 0.012 * sin(t * 1.2 + aRandom.y * 6.2831);
  vec3 posD = uRingC + aPosD * uRingR * ringPulse;

  // ── E: collapse to a point ──
  vec3 posE = uPointC + aPosE * (0.035 + 0.25 * uFlash * aRandom.z);

  float pB = phase(0.0);
  float pC = phase(1.0);
  float pD = phase(2.0);
  float pE = phase(3.0);

  vec3 pos = mix(posA, posB, pB);
  pos = mix(pos, posC, pC);
  pos = mix(pos, posD, pD);
  pos = mix(pos, posE, pE);

  // scatter in the middle of each transition: chaos between structures
  float mid = pB * (1.0 - pB) + pC * (1.0 - pC) + pD * (1.0 - pD) + pE * (1.0 - pE);
  vec3 scatter = (aRandom.yzw - 0.5) * 2.0;
  pos += scatter * mid * 1.6;

  // chaos: the sphere frays into a restless cloud; it fades out as the plane takes over (pB)
  float chaos = uChaos * (1.0 - pB);
  vec3 drift = vec3(
    sin(t * 0.9 + aRandom.y * 6.2831),
    cos(t * 0.7 + aRandom.z * 6.2831),
    sin(t * 0.8 + aRandom.w * 6.2831)
  );
  pos += (scatter * 1.1 + drift * 0.25) * chaos * (0.35 + 0.65 * aRandom.x);

  // ambient drift
  pos += 0.012 * vec3(sin(t * 0.7 + aRandom.y * 6.2831), cos(t * 0.5 + aRandom.z * 6.2831), 0.0);

  // cursor repulsion (force decays with inertia on the CPU side)
  vec2 d = pos.xy - uMouse.xy;
  float dist = length(d);
  float f = exp(-dist * dist * 2.2) * uMouseForce * (1.0 - pE);
  pos.xy += (d / max(dist, 1e-3)) * f * 0.32;
  pos.z += f * 0.25;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float sizeRand = 0.55 + aRandom.w * 0.9;
  float flashBoost = 1.0 + pE * uFlash * 1.8;
  gl_PointSize = uSize * uDpr * sizeRand * flashBoost / max(-mv.z, 0.5);

  // colour: mostly soft white, ~12% accent particles
  float tint = step(0.88, aRandom.y);
  vec3 accent = mix(uColorA, uColorB, aRandom.z);
  vColor = mix(uColorBase, accent, tint * 0.9);
  vColor = mix(vColor, mix(vec3(1.0), accent, 0.35), pE * uFlash);

  // depth fade: front brighter
  float depth = clamp((8.0 + pos.z) / 10.0, 0.0, 1.0);
  vAlpha = (0.22 + 0.55 * depth) * (0.6 + 0.4 * aRandom.x);
  vAlpha *= uAlpha * (1.0 + pE * uFlash * 1.5);

  // sphere reads as a volume: bright rim, quieter centre, faint accent on the edge
  float rim = pow(1.0 - abs(normalize(dirA).z), 2.2);
  float sphereW = 1.0 - pB;
  vAlpha *= mix(1.0, 0.5 + 1.5 * rim, sphereW);
  vColor = mix(vColor, accent, rim * 0.28 * sphereW);
}
