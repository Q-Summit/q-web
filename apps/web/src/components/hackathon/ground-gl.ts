/**
 * The folding-light shader of the /hackathon ground (DESIGN.md HACK-1),
 * shared by the off-main-thread worker (ground.worker.ts) and the
 * main-thread fallback in HackGround.astro. A domain-warped value-noise
 * field (smooth, organic, like soft fabric under light) turned into bands
 * whose crests glow, in the Hack violet ramp. Plain WebGL 1, no library.
 */

export type Rgb = [number, number, number];

/** The palette, as linear 0..1 RGB, in uniform order. */
export interface GroundColors {
  ink: Rgb;
  deep: Rgb;
  violet: Rgb;
  mid: Rgb;
  glow: Rgb;
  haze: Rgb;
}

/** About 24 frames a second: the folds move slowly. */
export const FRAME_MS = 40;

/** Render at most this many pixels, however large the screen. */
export const MAX_PIXELS = 1_000_000;

/** Render size for a CSS size: half the CSS pixels (the light is soft),
 * at most 1.5x device pixel ratio before halving, capped in total. */
export const renderSize = (
  cssWidth: number,
  cssHeight: number,
  dpr: number,
): { w: number; h: number } => {
  let scale = Math.min(dpr || 1, 1.5) * 0.5;
  const pixels = cssWidth * cssHeight * scale * scale;
  if (pixels > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / pixels);
  return {
    w: Math.max(1, Math.round(cssWidth * scale)),
    h: Math.max(1, Math.round(cssHeight * scale)),
  };
};

/** The shader's start time in seconds: the first frame drawn, and the
 * frame the still posters (ground-poster-*.webp) show. */
export const START_TIME = 18;

/** Field scale and ring strength for a render size. Wide screens keep the
 * original look (scale 1, ring 0.3). On portrait screens the field is
 * scaled down so several folds show across the narrow width, and the CI
 * ring echo is kept faint, as it would otherwise sit in the middle of the
 * screen. The poster CSS switches at the same point (taller than wide). */
export const fieldFor = (w: number, h: number) =>
  h > w ? { scale: 1.65, ring: 0.12 } : { scale: 1, ring: 0.3 };

/** "#5c1cae" -> [0.36, 0.11, 0.68] */
export const hexToRgb = (hex: string): Rgb => {
  const h = hex.trim().replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Full float precision where the GPU has it: many phone GPUs run mediump
// as true 16-bit floats, too coarse for this noise.
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uScale;
uniform float uRing;
uniform vec3 cInk;
uniform vec3 cDeep;
uniform vec3 cViolet;
uniform vec3 cMid;
uniform vec3 cGlow;
uniform vec3 cHaze;

// Hash without sine (after Dave Hoskins, MIT): only multiply, add and
// fract, so every GPU draws the same pattern. The classic
// fract(sin(x) * 43758.5) differs from GPU to GPU, which made phones show
// a different, darker field and no still image could ever match it.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  // The folds live in field space s: on a portrait screen p spans only the
  // narrow width, so the field is scaled down there (uScale) to show as
  // many folds across as a wide screen does. Ring and vignette stay in p.
  vec2 s = p * uScale;
  float t = uTime * 0.045;

  vec2 q = vec2(fbm(s * 1.15 + vec2(0.0, t)), fbm(s * 1.15 + vec2(5.2, -0.8 * t)));
  vec2 r = vec2(fbm(s * 1.4 + 2.2 * q + vec2(1.7, 9.2) + 0.7 * t),
                fbm(s * 1.4 + 2.2 * q + vec2(8.3, 2.8) - 0.6 * t));
  float f = fbm(s * 1.25 + 2.4 * r);

  // Long soft folds: bands across the field, bent by the warp.
  float fold = 0.5 + 0.5 * sin(f * 7.0 + s.y * 1.6 + s.x * 0.6 - t * 3.0);
  float crest = pow(smoothstep(0.62, 1.0, fold), 1.6);
  float depth = smoothstep(0.15, 0.85, f);

  vec3 col = mix(cInk, cDeep, smoothstep(0.05, 0.45, depth));
  col = mix(col, cViolet, smoothstep(0.3, 0.75, depth));
  col = mix(col, cMid, smoothstep(0.5, 0.9, depth) * 0.7);
  col = mix(col, cGlow, crest * (0.55 + 0.45 * depth));
  // LED-like bloom on the brightest crests.
  col += cHaze * pow(crest, 2.5) * 0.42 * (0.4 + 0.6 * depth);

  // A soft echo of the Hack CI ring, broken up by the folds.
  float ring = exp(-pow((length(p * vec2(0.82, 1.0)) - 0.68) / 0.16, 2.0));
  col = mix(col, cGlow, ring * uRing * (0.5 + 0.5 * f));

  // Gentle vignette keeps the edges deep, the middle luminous.
  float vig = smoothstep(1.5, 0.3, length(p * vec2(0.85, 1.0)));
  col *= mix(0.8, 1.0, vig);

  // Dither against banding.
  col += (hash(gl_FragCoord.xy + uTime) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

export interface Ground {
  resize(w: number, h: number): void;
  draw(time: number): void;
}

/** Compile the shader on a WebGL 1 context; null if anything fails. */
export const createGround = (
  gl: WebGLRenderingContext,
  colors: GroundColors,
): Ground | null => {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, "uRes");
  const uTime = gl.getUniformLocation(program, "uTime");
  const uScale = gl.getUniformLocation(program, "uScale");
  const uRing = gl.getUniformLocation(program, "uRing");
  const set = (name: string, rgb: Rgb) =>
    gl.uniform3fv(gl.getUniformLocation(program, name), rgb);
  set("cInk", colors.ink);
  set("cDeep", colors.deep);
  set("cViolet", colors.violet);
  set("cMid", colors.mid);
  set("cGlow", colors.glow);
  set("cHaze", colors.haze);

  return {
    resize(w, h) {
      const field = fieldFor(w, h);
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uScale, field.scale);
      gl.uniform1f(uRing, field.ring);
    },
    draw(time) {
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
};

export const CONTEXT_OPTIONS: WebGLContextAttributes = {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  powerPreference: "low-power",
  preserveDrawingBuffer: false,
  desynchronized: true,
};
