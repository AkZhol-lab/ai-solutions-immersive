// Loaded dynamically, desktop only.
import {
  HalfFloatType,
  Vector2,
  WebGLRenderTarget,
  type Camera,
  type Scene,
  type WebGLRenderer,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

export interface Post {
  render(): void;
  setSize(w: number, h: number): void;
  setBloom(strength: number): void;
}

export function createPost(renderer: WebGLRenderer, scene: Scene, camera: Camera): Post {
  const size = renderer.getSize(new Vector2());
  // half float: an 8-bit linear target bands near-black (#050507 would turn blue-ish)
  const target = new WebGLRenderTarget(size.x, size.y, { type: HalfFloatType });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  // half-resolution bloom keeps it cheap
  const bloom = new UnrealBloomPass(new Vector2(size.x / 2, size.y / 2), 0.5, 0, 0.22);
  // tight glow only: the coarse mips would otherwise lift the whole black background
  bloom.compositeMaterial.uniforms.bloomFactors.value = [1.0, 0.65, 0.3, 0.06, 0.0];
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  return {
    render: () => composer.render(),
    setSize: (w, h) => {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
    },
    setBloom: (s) => {
      bloom.strength = s;
    },
  };
}
