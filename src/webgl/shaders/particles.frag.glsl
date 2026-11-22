varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  // soft core + faint halo
  float core = smoothstep(0.5, 0.0, d);
  float a = core * core * vAlpha;
  gl_FragColor = vec4(vColor * a, a);
  #include <colorspace_fragment>
}
