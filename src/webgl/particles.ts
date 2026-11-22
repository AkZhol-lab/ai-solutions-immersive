import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  ShaderMaterial,
  Sphere,
  Vector2,
  Vector3,
  Vector4,
} from 'three';
import vertexShader from './shaders/particles.vert.glsl?raw';
import fragmentShader from './shaders/particles.frag.glsl?raw';
import { buildTargets } from './targets';

export type ParticleUniforms = {
  uTime: { value: number };
  uProgress: { value: number };
  uDpr: { value: number };
  uSize: { value: number };
  uAlpha: { value: number };
  uFlash: { value: number };
  uPulse: { value: number };
  uChaos: { value: number };
  uMotion: { value: number };
  uView: { value: Vector2 };
  uMouse: { value: Vector3 };
  uMouseForce: { value: number };
  uSphereR: { value: number };
  uSphereC: { value: Vector3 };
  uGridW: { value: number };
  uRingR: { value: number };
  uRingC: { value: Vector3 };
  uPointC: { value: Vector3 };
  uClusters: { value: Vector4[] };
  uColorBase: { value: Color };
  uColorA: { value: Color };
  uColorB: { value: Color };
};

export function createParticles(count: number): { points: Points; uniforms: ParticleUniforms } {
  const t = buildTargets(count);
  const geometry = new BufferGeometry();
  // `position` is required by three; the shader only reads the scene targets.
  geometry.setAttribute('position', new BufferAttribute(t.a, 3));
  geometry.setAttribute('aPosA', new BufferAttribute(t.a, 3));
  geometry.setAttribute('aPosB', new BufferAttribute(t.b, 3));
  geometry.setAttribute('aPosC', new BufferAttribute(t.c, 3));
  geometry.setAttribute('aCluster', new BufferAttribute(t.cluster, 1));
  geometry.setAttribute('aPosD', new BufferAttribute(t.d, 3));
  geometry.setAttribute('aPosE', new BufferAttribute(t.e, 3));
  geometry.setAttribute('aRandom', new BufferAttribute(t.random, 4));
  // particles move in the shader, so skip frustum culling with a huge bound
  geometry.boundingSphere = new Sphere(new Vector3(), 1e4);

  const uniforms: ParticleUniforms = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uDpr: { value: 1 },
    uSize: { value: 22 },
    uAlpha: { value: 1 },
    uFlash: { value: 0 },
    uPulse: { value: 0 },
    uChaos: { value: 0 },
    uMotion: { value: 1 },
    uView: { value: new Vector2(1, 1) },
    uMouse: { value: new Vector3(99, 99, 0) },
    uMouseForce: { value: 0 },
    uSphereR: { value: 1.6 },
    uSphereC: { value: new Vector3() },
    uGridW: { value: 6 },
    uRingR: { value: 2 },
    uRingC: { value: new Vector3() },
    uPointC: { value: new Vector3() },
    uClusters: {
      value: [new Vector4(-3, 0, 0, 1), new Vector4(0, 0, 0, 1), new Vector4(3, 0, 0, 1)],
    },
    uColorBase: { value: new Color('#e6e6ee') },
    uColorA: { value: new Color('#7c5cff') },
    uColorB: { value: new Color('#00d4ff') },
  };

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: AdditiveBlending,
    premultipliedAlpha: true,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  return { points, uniforms };
}
