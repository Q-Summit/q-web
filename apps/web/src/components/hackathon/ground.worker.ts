/**
 * Draws the /hackathon ground off the main thread (DESIGN.md HACK-1): the
 * page hands over its canvas as an OffscreenCanvas, and frames go from here
 * straight to the compositor. The main thread is never woken for the
 * ground, so it also never has to service the page's CSS animations for a
 * ground frame. Started by HackGround.astro; messages:
 *   in:  init { canvas, colors, w, h, run } | state { w, h, run }
 *   out: drawn (first frame is up) | lost (GPU context dropped)
 */
import {
  CONTEXT_OPTIONS,
  createGround,
  FRAME_MS,
  START_TIME,
  type Ground,
  type GroundColors,
} from "./ground-gl";

interface WorkerScope {
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent) => void) | null;
  requestAnimationFrame?: (cb: (now: number) => void) => number;
}

const scope = self as unknown as WorkerScope;
const nextFrame = (cb: (now: number) => void) =>
  scope.requestAnimationFrame
    ? scope.requestAnimationFrame(cb)
    : setTimeout(() => cb(performance.now()), FRAME_MS);

let canvas: OffscreenCanvas | null = null;
let ground: Ground | null = null;
let running = false;
let looping = false;
let lost = false;
// Time only advances while running, so pausing does not jump the waves.
let elapsed = START_TIME;
let last = 0;
let shown = false;

const draw = () => {
  if (!ground || lost) return;
  ground.draw(elapsed);
  if (!shown) {
    shown = true;
    scope.postMessage({ type: "drawn" });
  }
};

const tick = (now: number) => {
  if (!running || lost) {
    looping = false;
    return;
  }
  if (!last) last = now;
  const dt = now - last;
  if (dt >= FRAME_MS) {
    elapsed += Math.min(dt, 100) / 1000;
    last = now;
    draw();
  }
  nextFrame(tick);
};

const apply = (w: number, h: number, run: boolean) => {
  if (!canvas || !ground) return;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    ground.resize(w, h);
    draw();
  }
  running = run;
  if (running && !looping) {
    looping = true;
    last = 0;
    nextFrame(tick);
  }
};

scope.onmessage = (event: MessageEvent) => {
  const data = event.data as {
    type: "init" | "state";
    canvas?: OffscreenCanvas;
    colors?: GroundColors;
    w: number;
    h: number;
    run: boolean;
  };
  if (data.type === "init" && data.canvas && data.colors) {
    canvas = data.canvas;
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      lost = true;
      scope.postMessage({ type: "lost" });
    });
    const gl = canvas.getContext(
      "webgl",
      CONTEXT_OPTIONS,
    ) as WebGLRenderingContext | null;
    ground = gl ? createGround(gl, data.colors) : null;
    if (!ground) {
      scope.postMessage({ type: "lost" });
      return;
    }
    canvas.width = data.w;
    canvas.height = data.h;
    ground.resize(data.w, data.h);
    draw();
    apply(data.w, data.h, data.run);
  } else if (data.type === "state") {
    apply(data.w, data.h, data.run);
  }
};
