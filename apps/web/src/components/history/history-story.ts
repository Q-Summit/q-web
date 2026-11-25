/*
 * /past-teams: the history story (DESIGN.md HISTORY-1, ADR-0010).
 *
 * A pinned stage whose story follows the scroll position. The story is drawn
 * in white line art (history-sketch.ts): a 10, a line that becomes a person
 * deep in thought, a light bulb. The bulb's light travels into the 3D
 * camera's orange self-timer light; as it goes out it sends an impulse, the
 * camera draws itself from it, turns real while it turns around, and we fly
 * in until we hold it. Its rear screen is the album of every team; the
 * joystick, the dial and the buttons page through it.
 *
 * Loaded by HistoryStory.astro with a dynamic import, never on first paint.
 * Without JavaScript, with reduced motion or without WebGL the page keeps
 * its plain form: the texts one after another and the photos as a grid.
 */
import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { createSketch } from "./history-sketch";
import type { Sketch, SketchTimes } from "./history-sketch";
import kamera from "./kamera.json";

/** One team in the album, from the page (CMS photos at build time). */
interface Team {
  label: string;
  year: number;
  src: string;
  alt: string;
}

type Anchor = number[];
type V3 = [number, number, number];

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const frameYield = () => new Promise<void>((r) => setTimeout(r));
const E = {
  io: (x: number) =>
    x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  out: (x: number) => 1 - Math.pow(1 - x, 3),
  soft: (x: number) => x * x * x * (x * (x * 6 - 15) + 10),
};
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/* The story in scroll progress (0 = top of the story, 1 = its end).
   Panels: [in from, in to, out from, out to]. */
type PanelKey = "hero" | "origin" | "teams" | "album";
const PANELS: Record<PanelKey, [number, number, number, number]> = {
  hero: [-1, -1, 0.056, 0.094],
  origin: [0.131, 0.169, 0.4125, 0.44],
  // stays until the camera is turning; then the album text, never both at once
  teams: [0.45, 0.48, 0.64, 0.665],
  album: [0.672, 0.7, 0.75, 0.772],
};
const SKETCH: SketchTimes = {
  link: [0.056, 0.156], // the pen leaves the 10 and travels down
  thinker: [0.15, 0.294],
  shade: [0.25, 0.344],
  thought: [0.331, 0.36],
  bulb: [0.3525, 0.39],
  light: [0.3825, 0.4125],
  merge: [0.4225, 0.49], // the bulb's light travels into the camera's self-timer light
  pulse: [0.497, 0.535], // the light goes out and sends one impulse: the camera draws itself from it
  camlight: [0.5, 0.56, 0.585, 0.635], // the camera's light, drawn like the bulb's
  out: [0.57, 0.61],
};
const T = {
  // the camera stays where it is drawn (right of the text): drawn from the
  // impulse, shaded, real while it turns
  cam: { draw: [0.5, 0.56], hatch: [0.515, 0.575], real: [0.59, 0.7] },
  led: [0.484, 0.492, 0.497, 0.51], // the self-timer light: only the hand-over
  front: 0.58,
  flip: [0.585, 0.72], // it turns in place ...
  zoom: [0.6, 0.88], // ... while we fly to it, to the right and in, until we hold it
  lcd: [0.655, 0.695], // the screen lights up as it comes round
  frame: [0.87, 0.895],
  album: 0.89,
};
// "Scroll through ten years" glides to where the thinker is drawn, slowly
// enough that the drawing plays.
const GLIDE_TO = SKETCH.thinker[1] + 0.005;
// The scroll is warped: [raw scroll share, story progress]. The hero holds,
// the drawing chapters need about half the scrolling, the camera keeps its pace.
const WARP: [number, number][] = [
  [0, 0],
  [0.07, 0.056],
  [0.3, 0.42],
  [1, 1],
];
const warp = (x: number, i: 0 | 1 = 0, o: 0 | 1 = 1) => {
  let k = 0;
  while (k < WARP.length - 2 && x > WARP[k + 1][i]) k++;
  const a = WARP[k],
    b = WARP[k + 1];
  return mix(a[o], b[o], clamp((x - a[i]) / (b[i] - a[i])));
};

const FOV = 24;
const MODEL_URL = "/past-teams/kamera.glb";
const DRACO_PATH = "/past-teams/draco/";

export function startHistory(root: HTMLElement): void {
  const q = <E extends Element = HTMLElement>(s: string) => {
    const el = root.querySelector<E>(s);
    if (!el) throw new Error(`history: ${s} missing`);
    return el;
  };
  const story = q("[data-story]");
  const view = q("[data-view]");
  const canvas = q<HTMLCanvasElement>("[data-canvas]");
  const glow = q("[data-glow]");
  const frameEl = q("[data-frame]");
  const hwEl = q("[data-hw]");
  const hintEl = q("[data-hint]");
  const replayBtn = q<HTMLButtonElement>("[data-replay]");
  const sketchHost = q("[data-sketch]");
  const header = document.querySelector<HTMLElement>("#site-header");
  const TEAMS: Team[] = JSON.parse(root.dataset.teams ?? "[]");
  if (TEAMS.length === 0) return;
  const hints = {
    wide: root.dataset.hint ?? "",
    touch: root.dataset.hintTouch ?? "",
  };

  root.classList.add("is-live");
  // a slight float while the camera is drawn and filled in, still once it faces you
  const idleAt = (p: number) =>
    seg(p, T.cam.draw[0], T.cam.draw[0] + 0.01) *
    (1 - seg(p, T.front - 0.03, T.front));
  const sketch: Sketch = createSketch(sketchHost, SKETCH);

  /* ---------------------------------------------------------------- album (DOM, on the camera's screen) */
  const gallery = (() => {
    const shots = [
      ...frameEl.querySelectorAll<HTMLImageElement>("[data-shot]"),
    ];
    let active = shots[0],
      spare = shots[1];
    let index = -1,
      busy = false,
      queued: number | null = null,
      timer = 0;
    let onChange: ((i: number) => void) | null = null;
    const cache = new Map<number, Promise<HTMLImageElement>>();
    const years = q("[data-years]");
    const prev = q<HTMLButtonElement>("[data-prev]"),
      next = q<HTMLButtonElement>("[data-next]");
    const osdLabel = q("[data-osd-label]"),
      osdYear = q("[data-osd-year]");

    TEAMS.forEach((t, i) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", t.alt);
      b.textContent = String(t.year).slice(2);
      b.addEventListener("click", () => void show(i));
      li.append(b);
      years.append(li);
    });

    function load(i: number): Promise<HTMLImageElement | null> {
      if (i < 0 || i >= TEAMS.length) return Promise.resolve(null);
      let p = cache.get(i);
      if (!p) {
        const im = new Image();
        im.src = TEAMS[i].src;
        p = im
          .decode()
          .catch(() => {})
          .then(() => im);
        cache.set(i, p);
      }
      return p;
    }
    function osd(i: number) {
      osdLabel.textContent = TEAMS[i].label;
      osdYear.textContent = String(TEAMS[i].year);
      prev.disabled = i === 0;
      next.disabled = i === TEAMS.length - 1;
      [...years.querySelectorAll("button")].forEach((b, k) =>
        b.setAttribute("aria-current", String(k === i)),
      );
    }
    async function show(to: number, instant = false): Promise<void> {
      const i = clamp(to, 0, TEAMS.length - 1);
      if (i === index) return;
      if (busy) {
        queued = i;
        return;
      }
      busy = true;
      const dir = i > index ? 1 : -1;
      await load(i);
      spare.src = TEAMS[i].src;
      spare.alt = TEAMS[i].alt;
      osd(i);
      if (instant || index < 0) {
        active.classList.remove("is-on");
        spare.classList.add("is-on");
      } else {
        spare.classList.remove("is-moving");
        spare.style.transform = `translateX(${dir * 103}%)`;
        spare.classList.add("is-on");
        spare.getBoundingClientRect();
        spare.classList.add("is-moving");
        active.classList.add("is-moving");
        spare.style.transform = "translateX(0)";
        active.style.transform = `translateX(${-dir * 103}%)`;
        await wait(480);
        active.classList.remove("is-on", "is-moving");
        spare.classList.remove("is-moving");
      }
      active.style.transform = "";
      spare.style.transform = "";
      [active, spare] = [spare, active];
      index = i;
      busy = false;
      void load(i + 1);
      void load(i - 1);
      onChange?.(i);
      if (queued !== null) {
        const qd = queued;
        queued = null;
        void show(qd);
      }
    }
    const step = (d: number) => void show(index + d);
    prev.addEventListener("click", () => step(-1));
    next.addEventListener("click", () => step(1));
    let downX: number | null = null;
    frameEl.addEventListener("pointerdown", (e) => {
      if (!(e.target instanceof Element && e.target.closest("button")))
        downX = e.clientX;
    });
    addEventListener("pointerup", (e) => {
      if (downX === null) return;
      const dx = e.clientX - downX;
      downX = null;
      if (Math.abs(dx) > 36) step(dx < 0 ? 1 : -1);
    });
    return {
      show,
      load,
      step,
      get index() {
        return Math.max(0, index);
      },
      set onChange(fn: (i: number) => void) {
        onChange = fn;
      },
      toggleInfo() {
        frameEl.classList.toggle("is-clean");
      },
      jump() {
        void show(index === TEAMS.length - 1 ? 0 : TEAMS.length - 1);
      },
      toggleSlideshow() {
        if (timer) {
          clearInterval(timer);
          timer = 0;
          return;
        }
        timer = window.setInterval(
          () => void show(index === TEAMS.length - 1 ? 0 : index + 1),
          2600,
        );
      },
      stopSlideshow() {
        clearInterval(timer);
        timer = 0;
      },
      startSlideshow() {
        if (!timer) this.toggleSlideshow();
      },
    };
  })();

  /* ---------------------------------------------------------------- scroll progress and text panels */
  function scrollP() {
    const r = story.getBoundingClientRect();
    return warp(clamp(-r.top / Math.max(1, r.height - innerHeight)));
  }
  const scrollY0 = (p: number) =>
    story.offsetTop + warp(p, 1, 0) * (story.offsetHeight - innerHeight);
  const scrollToP = (p: number) =>
    scrollTo({ top: scrollY0(p), behavior: "smooth" });

  const panelEls = Object.fromEntries(
    (Object.keys(PANELS) as PanelKey[]).map((k) => [
      k,
      q(`[data-panel="${k}"]`),
    ]),
  ) as Record<PanelKey, HTMLElement>;
  function setPanels(p: number, room = 1) {
    for (const k of Object.keys(PANELS) as PanelKey[]) {
      const [a, b, c, d] = PANELS[k];
      const fin = a < 0 ? 1 : E.out(seg(p, a, b)),
        fout = seg(p, c, d);
      const o = fin * (1 - fout) * (k === "album" ? room : 1);
      const el = panelEls[k];
      el.style.setProperty("--o", o.toFixed(3));
      el.style.setProperty(
        "--ty",
        `${((1 - fin) * 28 - fout * 28).toFixed(1)}px`,
      );
      el.classList.toggle("is-live", o > 0.6);
      el.style.visibility = o < 0.004 ? "hidden" : "visible";
    }
  }
  let autoPlayed = false;
  function setChrome(p: number) {
    const inAlbum = p > T.album;
    frameEl.style.opacity = String(
      Math.max(0.001, seg(p, T.frame[0], T.frame[1])),
    );
    frameEl.inert = !inAlbum;
    hwEl.classList.toggle("is-live", inAlbum);
    hwEl.inert = !inAlbum;
    hintEl.classList.toggle("is-on", inAlbum);
    replayBtn.hidden = !inAlbum;
    // in the album the pictures run by themselves, as if PLAY had been pressed (PLAY pauses them)
    if (inAlbum && !autoPlayed) {
      autoPlayed = true;
      gallery.startSlideshow();
    }
    if (!inAlbum) {
      autoPlayed = false;
      gallery.stopSlideshow();
    }
  }

  /* ---------------------------------------------------------------- phone layout */
  const textBottom = (k: PanelKey) =>
    panelEls[k].offsetTop + panelEls[k].offsetHeight + 14;
  // phones: the free area below the story text; it glides with the scroll
  // from one chapter's text to the next (never with a text's opacity)
  function freeArea(p: number): [number, number] | null {
    if (innerWidth > 860) return null;
    const a = E.soft(seg(p, PANELS.hero[2], PANELS.origin[1])),
      b = E.soft(seg(p, PANELS.origin[2], PANELS.teams[0] + 0.02));
    return [
      mix(
        mix(textBottom("hero"), textBottom("origin"), a),
        textBottom("teams"),
        b,
      ),
      view.clientHeight - 12,
    ];
  }

  /* ---------------------------------------------------------------- the glide of the cue */
  let glide = 0;
  function glideTo(p1: number) {
    cancelAnimationFrame(glide);
    const y0 = scrollY,
      y1 = scrollY0(p1);
    const p0 = scrollP(),
      dur = clamp(Math.abs(p1 - p0) * 32000, 1400, 4800),
      t0 = performance.now();
    const stepFn = (now: number) => {
      const t = clamp((now - t0) / dur);
      scrollTo({ top: y0 + (y1 - y0) * E.soft(t), behavior: "instant" });
      glide = t < 1 ? requestAnimationFrame(stepFn) : 0;
    };
    glide = requestAnimationFrame(stepFn);
  }
  root.querySelector("[data-skip-link]")?.addEventListener("click", (e) => {
    e.preventDefault();
    glideTo(GLIDE_TO);
  });
  // your own scrolling always wins over the glide
  for (const ev of ["wheel", "touchstart", "keydown", "pointerdown"])
    addEventListener(
      ev,
      (e) => {
        if (
          glide &&
          !(e.target instanceof Element && e.target.closest("[data-skip-link]"))
        ) {
          cancelAnimationFrame(glide);
          glide = 0;
        }
      },
      { passive: true },
    );
  addEventListener("keydown", (e) => {
    if (frameEl.inert) return;
    if (e.key === "ArrowRight") gallery.step(1);
    if (e.key === "ArrowLeft") gallery.step(-1);
  });

  void gallery.show(0, true);
  setPanels(scrollP());
  sketch.update(scrollP());

  let sceneReady = false,
    storyInView = false;
  const startDrawing = () => {
    if (sceneReady && storyInView) sketch.startIntro();
  };
  new IntersectionObserver(
    ([en]) => {
      storyInView = en.intersectionRatio > 0.35 || scrollP() > 0;
      startDrawing();
    },
    { threshold: [0, 0.35, 0.6] },
  ).observe(q("[data-stage]"));
  replayBtn.addEventListener("click", () => scrollToP(0));

  initScene()
    .then(() => {
      sceneReady = true;
      startDrawing();
    })
    .catch((err: unknown) => {
      sceneReady = true;
      startDrawing();
      // No WebGL or the model failed to load: the texts and the album still work on their own.
      console.error(err);
      canvas.hidden = true;
      root.classList.add("is-flat");
      const place = () => {
        const w = view.clientWidth,
          h = view.clientHeight,
          fw = Math.min(w * 0.9, (h - 220) * 1.5);
        frameEl.style.width = `${fw}px`;
        frameEl.style.left = `${(w - fw) / 2}px`;
        frameEl.style.top = `${(h - fw / 1.5) / 2 + 20}px`;
      };
      place();
      addEventListener("resize", place);
      const follow = () => {
        const p = scrollP();
        setPanels(p);
        setChrome(p);
        sketch.update(p, { area: freeArea(p) });
      };
      follow();
      addEventListener("scroll", follow, { passive: true });
      document.addEventListener("team:view", follow);
    });

  /* ================================================================ 3D scene */
  async function initScene() {
    const A = kamera.anchors as Record<string, Anchor>;
    const [LCD_X, LCD_Y, LCD_Z, LCD_W, LCD_H] = A.lcd;
    const v3 = (a: Anchor): V3 => [a[0], a[1], a[2]];

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false; // several passes per frame; the shadow map is drawn once, before the first
    renderer.autoClear = false;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(FOV, 1, 2, 260);
    const ctx2d = (c: HTMLCanvasElement) => {
      const g = c.getContext("2d");
      if (!g) throw new Error("history: no 2D canvas");
      return g;
    };
    const canvasOf = (w: number, h = w) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      return c;
    };
    const srgbTex = (c: HTMLCanvasElement) => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };

    /* studio environment: a dark room with graded softboxes, so every surface reflects a gradient, not a flat value */
    {
      const s = new THREE.Scene();
      s.background = new THREE.Color(0x05070f);
      // a graded dome like a studio scrim: dim light from everywhere above, so metal never mirrors plain black
      {
        const c = canvasOf(4, 128),
          g = ctx2d(c),
          gr = g.createLinearGradient(0, 0, 0, 128);
        gr.addColorStop(0, "#d2d4d8");
        gr.addColorStop(0.4, "#9a9da3");
        gr.addColorStop(0.54, "#55585f");
        gr.addColorStop(0.68, "#1b1c22");
        gr.addColorStop(1, "#08090c");
        g.fillStyle = gr;
        g.fillRect(0, 0, 4, 128);
        s.add(
          new THREE.Mesh(
            new THREE.SphereGeometry(300, 32, 16),
            new THREE.MeshBasicMaterial({
              map: srgbTex(c),
              side: THREE.BackSide,
            }),
          ),
        );
      }
      const grad = (kind: "v" | "r") => {
        const c = canvasOf(128),
          g = ctx2d(c);
        const gr =
          kind === "v"
            ? g.createLinearGradient(0, 0, 0, 128)
            : g.createRadialGradient(64, 64, 6, 64, 64, 90);
        gr.addColorStop(0, "#fff");
        gr.addColorStop(
          kind === "v" ? 1 : 0.75,
          kind === "v" ? "#161616" : "#3a3a3a",
        );
        if (kind !== "v") gr.addColorStop(1, "#111");
        g.fillStyle = gr;
        g.fillRect(0, 0, 128, 128);
        return srgbTex(c);
      };
      const soft = grad("r"),
        wall = grad("v");
      // a diffuser panel: even light with a soft but defined edge, like a real softbox seen in a reflection
      const panel = (() => {
        const c = canvasOf(128),
          g = ctx2d(c);
        g.fillStyle = "#000";
        g.fillRect(0, 0, 128, 128);
        g.filter = "blur(5px)";
        g.fillStyle = "#fff";
        g.fillRect(14, 14, 100, 100);
        g.filter = "none";
        const gr = g.createLinearGradient(0, 0, 128, 0);
        gr.addColorStop(0, "rgba(0,0,0,0.25)");
        gr.addColorStop(0.5, "rgba(0,0,0,0)");
        gr.addColorStop(1, "rgba(0,0,0,0.3)");
        g.fillStyle = gr;
        g.fillRect(0, 0, 128, 128);
        return srgbTex(c);
      })();
      const box = (
        w: number,
        h: number,
        pos: V3,
        k: number,
        tint: V3 = [1, 1, 1],
        map = soft,
      ) => {
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(w, h),
          new THREE.MeshBasicMaterial({
            map,
            color: new THREE.Color(k * tint[0], k * tint[1], k * tint[2]),
            side: THREE.DoubleSide,
          }),
        );
        m.position.set(...pos);
        m.lookAt(0, 0, 0);
        s.add(m);
      };
      box(48, 34, [-36, 28, 38], 9, [1, 1, 1], panel); // key softbox, front left above
      box(7, 64, [-30, 6, 30], 13, [1, 0.99, 0.97], panel); // tall strip, front left: the long highlight on metal edges
      box(6, 58, [33, 6, 26], 7, [0.96, 0.98, 1], panel); // tall strip, front right
      box(80, 16, [4, 48, 6], 6); // top strip
      box(12, 60, [-42, 8, -24], 9, [0.75, 0.86, 1]); // cool rim, left behind
      box(12, 60, [40, 10, -28], 9, [0.75, 0.86, 1]); // cool rim, right behind
      box(34, 24, [40, 0, 30], 2.6); // fill, front right
      box(150, 70, [0, 14, 80], 1.25, [1, 1, 1], wall); // graded wall behind the viewer: bright above, dark below
      box(90, 60, [0, -42, 12], 0.22, [0.45, 0.6, 1]); // blue bounce from the floor
      const pm = new THREE.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(s, 0, 0.1, 400).texture;
      pm.dispose();
    }

    /* direct light for depth: a shadow-casting key (dials, buttons and the eyepiece throw real shadows) and a cool rim */
    const key = new THREE.DirectionalLight(0xfff4e6, 2.1);
    const KEY_OFF = new THREE.Vector3(-24, 31, 23);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, {
      left: -10,
      right: 10,
      top: 10,
      bottom: -10,
      near: 10,
      far: 90,
    });
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.045;
    key.shadow.radius = 3;
    key.shadow.blurSamples = 12;
    scene.add(key, key.target);
    const rim = new THREE.DirectionalLight(0x9dbcff, 1.5);
    rim.position.set(26, 10, -30);
    scene.add(rim);

    /* procedural textures */
    const texFrom = (
      size: number,
      drawPx: (px: Uint8ClampedArray) => void,
      srgb = false,
    ) => {
      const c = canvasOf(size),
        g = ctx2d(c),
        img = g.createImageData(size, size);
      drawPx(img.data);
      g.putImageData(img, 0, 0);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };
    const rand = (seed: number) => {
      let s = seed >>> 0;
      return () =>
        (s = (Math.imul(s ^ (s >>> 15), 2246822519) + 0x9e3779b9) >>> 0) /
        4294967296;
    };
    const normalFrom =
      (h: Float32Array, N: number, k: number) => (px: Uint8ClampedArray) => {
        for (let y = 0; y < N; y++)
          for (let x = 0; x < N; x++) {
            const hx = h[y * N + ((x + 1) % N)] - h[y * N + ((x - 1 + N) % N)];
            const hy = h[((y + 1) % N) * N + x] - h[((y - 1 + N) % N) * N + x];
            const nx = -hx * k,
              ny = hy * k,
              l = Math.hypot(nx, ny, 1),
              o = (y * N + x) * 4; // canvas rows run downwards
            px[o] = ((nx / l) * 0.5 + 0.5) * 255;
            px[o + 1] = ((ny / l) * 0.5 + 0.5) * 255;
            px[o + 2] = ((1 / l) * 0.5 + 0.5) * 255;
            px[o + 3] = 255;
          }
      };
    const grey =
      (N: number, f: (i: number) => number) => (px: Uint8ClampedArray) => {
        for (let i = 0; i < N * N; i++) {
          const g = f(i) * 255;
          px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = g;
          px[i * 4 + 3] = 255;
        }
      };
    // Leatherette like the real thing: coarse, slightly wrinkled grain with deep creases.
    await frameYield();
    const leather = (() => {
      const N = 512,
        C = 14,
        r = rand(11),
        pts: [number, number][] = [],
        TAU = Math.PI * 2;
      for (let j = 0; j < C; j++)
        for (let i = 0; i < C; i++)
          pts.push([(i + 0.15 + 0.7 * r()) / C, (j + 0.15 + 0.7 * r()) / C]);
      const h = new Float32Array(N * N);
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          const u0 = x / N,
            v0 = y / N;
          const u =
            u0 +
            0.018 * Math.sin(TAU * (3 * v0 + 0.2)) +
            0.012 * Math.sin(TAU * (7 * u0 + 5 * v0));
          const v =
            v0 +
            0.018 * Math.sin(TAU * (2 * u0 + 0.7)) +
            0.012 * Math.sin(TAU * (6 * v0 - 4 * u0));
          const ci = Math.floor(u * C),
            cj = Math.floor(v * C);
          let d1 = 9,
            d2 = 9;
          for (let dj = -2; dj <= 2; dj++)
            for (let di = -2; di <= 2; di++) {
              const ii = ci + di,
                jj = cj + dj,
                p = pts[(((jj % C) + C) % C) * C + (((ii % C) + C) % C)];
              const d = Math.hypot(
                (u - p[0] - Math.floor(ii / C)) * C,
                (v - p[1] - Math.floor(jj / C)) * C * 1.3,
              );
              if (d < d1) {
                d2 = d1;
                d1 = d;
              } else if (d < d2) d2 = d;
            }
          const e = Math.min(1, (d2 - d1) / 0.85);
          h[y * N + x] =
            e *
            e *
            (3 - 2 * e) *
            (0.86 + 0.14 * Math.sin(TAU * (9 * u0 + 4 * v0)));
        }
      const set = (t: THREE.Texture) => {
        t.repeat.set(1.05, 1.05);
        return t;
      };
      return {
        normal: set(texFrom(N, normalFrom(h, N, 4.2))),
        // worn tops a little shinier, the creases dull
        rough: set(
          texFrom(
            N,
            grey(N, (i) => 0.46 + 0.5 * (1 - h[i]) ** 1.5),
          ),
        ),
        albedo: set(
          texFrom(
            N,
            grey(N, (i) => 0.58 + 0.42 * h[i]),
            true,
          ),
        ),
      };
    })();
    // Fine moulded grain for the semi-matt black plastic and rubber.
    const grain = (() => {
      const N = 256,
        r = rand(5),
        a = new Float32Array(N * N),
        h = new Float32Array(N * N);
      for (let i = 0; i < N * N; i++) a[i] = r();
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          let s = 0;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++)
              s += a[((y + dy + N) % N) * N + ((x + dx + N) % N)];
          h[y * N + x] = s / 9;
        }
      const t = texFrom(N, normalFrom(h, N, 2.2));
      t.repeat.set(4, 4);
      return t;
    })();
    // bead-blasted aluminum: a fine, even, non-directional grain
    const blasted = (() => {
      const N = 256,
        r = rand(3),
        a = new Float32Array(N * N);
      for (let i = 0; i < N * N; i++) a[i] = r();
      const t = texFrom(N, (px) => {
        for (let y = 0; y < N; y++)
          for (let x = 0; x < N; x++) {
            let sm = 0;
            for (let dy = -1; dy <= 1; dy++)
              for (let dx = -1; dx <= 1; dx++)
                sm += a[((y + dy + N) % N) * N + ((x + dx + N) % N)];
            const v = 0.86 + 0.14 * (sm / 9 - 0.5) * 2.2 + 0.07,
              o = (y * N + x) * 4;
            px[o] = px[o + 1] = px[o + 2] = clamp(v) * 255;
            px[o + 3] = 255;
          }
      });
      t.repeat.set(3, 3);
      return t;
    })();

    /* materials, values as in the Blender scene (linear) */
    const lin = (r: number, g = r, b = r) =>
      new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);
    const P = (o: THREE.MeshPhysicalMaterialParameters) =>
      new THREE.MeshPhysicalMaterial(o);
    const V2 = (x: number) => new THREE.Vector2(x, x);
    // Glass as pure surface reflection, added over what lies behind: front and back of every element reflect.
    const glass = (ior: number, film: number, boost = 1.1) =>
      P({
        color: 0x000000,
        roughness: 0,
        ior,
        envMapIntensity: boost,
        iridescence: film ? 1 : 0,
        iridescenceIOR: 1.38,
        iridescenceThicknessMinimum: film || 100,
        iridescenceThicknessMaximum: film || 100,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    const MATS: Record<string, THREE.MeshPhysicalMaterial> = {
      // bead-blasted satin aluminum: soft broad highlights, a fine even grain, no lines
      Alu_gebuerstet: P({
        color: lin(0.8, 0.81, 0.82),
        metalness: 1,
        roughness: 0.34,
        roughnessMap: blasted,
        bumpMap: blasted,
        bumpScale: 0.012,
        envMapIntensity: 1.35,
      }),
      Alu_gedreht: P({
        color: lin(0.8, 0.805, 0.81),
        metalness: 1,
        roughness: 0.36,
        envMapIntensity: 1.2,
      }), // satin knurling
      Schwarz_eloxiert: P({
        color: lin(0.014, 0.014, 0.016),
        roughness: 0.32,
        side: THREE.DoubleSide,
      }),
      Chrom_poliert: P({
        color: lin(0.62, 0.62, 0.64),
        metalness: 1,
        roughness: 0.06,
      }),
      Kunstleder: P({
        color: lin(0.03, 0.03, 0.033),
        map: leather.albedo,
        roughness: 1,
        roughnessMap: leather.rough,
        normalMap: leather.normal,
        normalScale: V2(1.0),
        sheen: 0.3,
        sheenRoughness: 0.5,
        sheenColor: lin(0.16, 0.17, 0.19),
        specularIntensity: 0.75,
      }),
      Lack_schwarz: P({
        color: lin(0.016),
        roughness: 0.4,
        normalMap: grain,
        normalScale: V2(0.3),
      }),
      // button caps: satin black with a thin clear lacquer, so their domes and rims catch the softboxes
      Kunststoff_glaenzend: P({
        color: lin(0.014),
        roughness: 0.34,
        ior: 1.49,
        clearcoat: 0.55,
        clearcoatRoughness: 0.22,
        normalMap: grain,
        normalScale: V2(0.18),
      }),
      Kunststoff_matt: P({
        color: lin(0.02),
        roughness: 0.64,
        ior: 1.49,
        normalMap: grain,
        normalScale: V2(0.55),
      }),
      Gummi: P({
        color: lin(0.022),
        roughness: 0.8,
        normalMap: grain,
        normalScale: V2(1.0),
        sheen: 0.35,
        sheenRoughness: 0.4,
        sheenColor: lin(0.32),
      }),
      Innen_mattschwarz: P({
        color: lin(0.004),
        roughness: 0.95,
        side: THREE.DoubleSide,
      }),
      Blende_Lamellen: P({
        color: lin(0.005),
        roughness: 0.62,
        specularIntensity: 0.3,
      }),
      Gravur_weiss: P({ color: lin(0.8, 0.8, 0.78), roughness: 0.5 }),
      Gravur_schwarz: P({ color: lin(0.01), roughness: 0.5 }),
      Lack_rot: P({ color: lin(0.55, 0.02, 0.02), roughness: 0.4 }),
      Kontakte_Gold: P({
        color: lin(1.0, 0.77, 0.36),
        metalness: 1,
        roughness: 0.15,
      }),
      LED_orange: P({
        color: lin(0.9, 0.32, 0.05),
        roughness: 0.3,
        emissive: lin(1.0, 0.32, 0.04),
        emissiveIntensity: 0,
      }),
      Blitz_Streuscheibe: P({
        color: lin(0.62, 0.66, 0.7),
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      }),
      Glas_Objektiv_vergütet: glass(1.62, 140, 0.8),
      Glas_Linse2_amber: glass(1.75, 260),
      Glas_Linse3_blau: glass(1.6, 330),
      Glas_Linse4_violett: glass(1.8, 210),
      Glas_Okular: glass(1.6, 0, 0.5), // the eyepiece: dark, one soft reflection
      Glas_Sucherfenster: glass(1.52, 0, 0.9),
      Glas_Strahlteiler: glass(1.52, 0, 0.12),
      Acryl_klar: glass(1.49, 0),
      Display_Glas: P({
        color: lin(0.003, 0.003, 0.004),
        roughness: 0.03,
        ior: 1.52,
        iridescence: 0.8,
        iridescenceIOR: 1.38,
        iridescenceThicknessMinimum: 240,
        iridescenceThicknessMaximum: 280,
      }),
    };
    const NO_SHADOW = /^(Glas_|Acryl|Gravur|LCD)/;

    const draco = new DRACOLoader().setDecoderPath(DRACO_PATH);
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const gltf = await loader.loadAsync(MODEL_URL);
    draco.dispose();
    const model = gltf.scene;
    let lcdMesh: THREE.Mesh | null = null;
    const meshes: THREE.Mesh[] = [];
    model.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const mat = o.material as THREE.Material;
      const name = (mat.name || "").normalize("NFC");
      if (name === "LCD_Bild") {
        lcdMesh = o;
        return;
      }
      meshes.push(o);
      const k = Object.keys(MATS).find((n) => n.normalize("NFC") === name);
      if (k) o.material = MATS[k];
      const quiet = NO_SHADOW.test(name);
      o.castShadow = !quiet;
      o.receiveShadow = !quiet;
    });
    const lcd = lcdMesh as THREE.Mesh | null;
    if (!lcd) throw new Error("history: LCD mesh missing in model");

    // DRIVE and AEL on the top plate: black satin caps (the model has them in turned aluminum)
    for (const name of ["BtnDrive", "BtnAel"])
      model.getObjectByName(name)?.traverse((o) => {
        if (o instanceof THREE.Mesh && o.material === MATS.Alu_gedreht)
          o.material = MATS.Kunststoff_glaenzend;
      });

    // the rig pivots round the body's centre
    const PIVOT = new THREE.Vector3(0, 3.9, 0);
    const LBOX = new THREE.Box3().setFromObject(model);
    const rig = new THREE.Group();
    model.position.copy(PIVOT).multiplyScalar(-1);
    rig.add(model);
    scene.add(rig);

    /* ---------------- the drawn camera
       Before it is real, the camera is drawn: its edges (two jittered pen passes that overshoot their corners)
       grow out from the self-timer light, then hatching and contour lines shade it. Then the real materials fill
       in from there, with a bright seam where the drawing turns into the camera. Distances are measured in rig
       space, so the drawing sticks to the camera while it turns. */
    const ART = {
      uRigInv: { value: new THREE.Matrix4() },
      uEntry: {
        value: new THREE.Vector3(A.led[0], A.led[1], A.led[2] + 0.15).sub(
          PIVOT,
        ),
      },
      uMaxD: { value: 1 },
      uDraw: { value: 0 },
      uHatch: { value: 0 },
      uReal: { value: 0 },
      uPx: { value: 1 },
      uFade: { value: 1 },
    };
    {
      const c = new THREE.Vector3();
      let m = 0;
      for (let i = 0; i < 8; i++) {
        c.set(
          i & 1 ? LBOX.max.x : LBOX.min.x,
          i & 2 ? LBOX.max.y : LBOX.min.y,
          i & 4 ? LBOX.max.z : LBOX.min.z,
        ).sub(PIVOT);
        m = Math.max(m, c.distanceTo(ART.uEntry.value));
      }
      ART.uMaxD.value = m * 0.92;
    }
    const NOISE = `float artHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }`;
    const inked = (m: THREE.ShaderMaterial) => {
      m.blending = THREE.CustomBlending;
      m.blendSrc = THREE.OneFactor;
      m.blendDst = THREE.OneFactor;
      m.transparent = true;
      m.depthWrite = false;
      return m;
    };
    const lineMat = inked(
      new THREE.ShaderMaterial({
        uniforms: ART,
        depthFunc: THREE.LessEqualDepth,
        vertexShader: `attribute float aSeed; uniform mat4 uRigInv; varying vec3 vR; varying float vSeed;
          void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vR = (uRigInv * w).xyz; vSeed = aSeed; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `uniform vec3 uEntry; uniform float uMaxD, uDraw, uReal, uFade; varying vec3 vR; varying float vSeed;
          void main(){
            float d = length(vR - uEntry) / uMaxD;
            float drawn = uDraw - (d + fract(vSeed * 7.0) * 0.1);
            if (drawn < 0.0) discard;
            float tip = 1.0 - smoothstep(0.0, 0.035, drawn);   // the fresh end glows like a pen tip
            float gone = smoothstep(0.0, 0.1, uReal - d);      // where the real camera has filled in
            float a = ((0.5 + 0.5 * fract(vSeed)) * (1.0 - gone) + tip * 0.8) * uFade;
            gl_FragColor = vec4(vec3(0.93, 0.97, 1.0) * a, a);
          }`,
      }),
    );
    const hatchMat = inked(
      new THREE.ShaderMaterial({
        uniforms: ART,
        side: THREE.DoubleSide,
        depthFunc: THREE.LessEqualDepth,
        vertexShader: `uniform mat4 uRigInv; varying vec3 vR; varying vec3 vN; varying vec3 vV;
          void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vR = (uRigInv * w).xyz; vec4 mv = viewMatrix * w; vV = -mv.xyz;
            vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform vec3 uEntry; uniform float uMaxD, uHatch, uReal, uPx, uFade; varying vec3 vR; varying vec3 vN; varying vec3 vV;
          ${NOISE}
          float lines(vec2 p, float ang, float gap){
            vec2 dir = vec2(cos(ang), sin(ang));
            float u = dot(p, vec2(-dir.y, dir.x)) + sin(dot(p, dir) * 0.045) * 1.6;
            float f = abs(fract(u / gap) - 0.5) * gap;
            return 1.0 - smoothstep(0.25, 1.0, f);
          }
          void main(){
            vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
            vec3 V = normalize(vV), L = normalize(vec3(-0.45, 0.72, 0.55));
            float dif = max(dot(N, L), 0.0), ndv = abs(dot(N, V));
            float rim = 1.0 - smoothstep(0.1, 0.3, ndv);                         // contour where a surface turns away
            vec2 sc = gl_FragCoord.xy / uPx;
            float h = lines(sc, 0.72, 5.0) * smoothstep(0.3, 0.55, dif) * 0.42      // lit planes: dense white lines
                    + lines(sc, -0.62, 6.5) * smoothstep(0.72, 0.9, dif) * 0.36     // the brightest: crossed
                    + lines(sc, 1.9, 9.0) * smoothstep(0.25, 0.05, dif) * 0.16;     // the shadow side: sparse
            float d = length(vR - uEntry) / uMaxD;
            float n = artHash(floor(vR * 24.0));
            if (uHatch - (d + n * 0.12) < 0.0) discard;
            float gone = smoothstep(0.0, 0.1, uReal - d);
            float a = (rim * 0.85 + h) * (1.0 - gone) * uFade;
            gl_FragColor = vec4(vec3(0.9, 0.95, 1.0) * a, a);
          }`,
      }),
    );
    const depthMat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1.5,
      polygonOffsetUnits: 3,
    });
    // pen edges of a geometry: two jittered passes that overshoot their corners
    const penRand = rand(2017);
    function penEdges(geometry: THREE.BufferGeometry) {
      const rr = penRand,
        V = new THREE.Vector3(),
        Wv = new THREE.Vector3(),
        D = new THREE.Vector3();
      const src = new THREE.EdgesGeometry(geometry, 30).attributes.position
          .array as Float32Array,
        n = src.length / 6;
      if (!n) return null;
      const pos = new Float32Array(n * 12),
        seed = new Float32Array(n * 4);
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < n; i++) {
          V.fromArray(src, i * 6);
          Wv.fromArray(src, i * 6 + 3);
          D.subVectors(Wv, V);
          const L = D.length() || 1e-6;
          D.multiplyScalar(1 / L);
          const j = pass ? 0.02 : 0.005,
            e0 = (0.02 + rr() * (pass ? 0.12 : 0.05)) * L + rr() * 0.02,
            e1 = (0.02 + rr() * (pass ? 0.12 : 0.05)) * L + rr() * 0.02;
          const o6 = (pass * n + i) * 6,
            sd = rr() * 0.999;
          pos[o6] = V.x - D.x * e0 + (rr() - 0.5) * j;
          pos[o6 + 1] = V.y - D.y * e0 + (rr() - 0.5) * j;
          pos[o6 + 2] = V.z - D.z * e0 + (rr() - 0.5) * j;
          pos[o6 + 3] = Wv.x + D.x * e1 + (rr() - 0.5) * j;
          pos[o6 + 4] = Wv.y + D.y * e1 + (rr() - 0.5) * j;
          pos[o6 + 5] = Wv.z + D.z * e1 + (rr() - 0.5) * j;
          seed[(pass * n + i) * 2] = seed[(pass * n + i) * 2 + 1] = pass
            ? sd * 0.6
            : 0.4 + sd * 0.6;
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
      return g;
    }
    for (const [i, o] of meshes.entries()) {
      if (i % 12 === 11) await frameYield();
      const g = penEdges(o.geometry);
      if (!g) continue;
      const ls = new THREE.LineSegments(g, lineMat);
      ls.layers.set(2);
      o.add(ls);
      const hm = new THREE.Mesh(o.geometry, hatchMat);
      hm.layers.set(1);
      o.add(hm);
    }
    // the real materials fill in from the self-timer light: everything farther than uReal is not there yet
    const revealable = <M extends THREE.Material>(m: M): M => {
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uRigInv = ART.uRigInv;
        sh.uniforms.uEntry = ART.uEntry;
        sh.uniforms.uMaxD = ART.uMaxD;
        sh.uniforms.uReal = ART.uReal;
        sh.vertexShader = sh.vertexShader
          .replace(
            "#include <common>",
            "#include <common>\nuniform mat4 uRigInv; varying vec3 vArtP;",
          )
          .replace(
            "#include <project_vertex>",
            "#include <project_vertex>\nvArtP = (uRigInv * modelMatrix * vec4(transformed, 1.0)).xyz;",
          );
        sh.fragmentShader = sh.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>\nuniform vec3 uEntry; uniform float uMaxD, uReal; varying vec3 vArtP; ${NOISE}`,
          )
          .replace(
            "void main() {",
            `void main() {
              float artD = length(vArtP - uEntry) / uMaxD + (artHash(floor(vArtP * 24.0)) - 0.5) * 0.05;
              if (artD > uReal) discard;`,
          )
          .replace(
            "#include <dithering_fragment>",
            `#include <dithering_fragment>
              gl_FragColor.rgb += vec3(0.75, 0.88, 1.0) * (1.0 - smoothstep(0.0, 0.045, uReal - artD)) * step(uReal, 2.0) * 0.9;`,
          );
      };
      m.customProgramCacheKey = () => "reveal";
      return m;
    };
    Object.values(MATS).forEach(revealable);

    /* moving parts: each gets a pivot so it can be pressed, tilted or turned in place */
    const part = (name: string) => model.getObjectByName(name);
    const pivotAt = (name: string, at: Anchor) => {
      const o = part(name);
      if (!o?.parent) return null;
      const g = new THREE.Group();
      g.position.set(at[0], at[1], at[2]);
      o.parent.add(g);
      g.add(o);
      o.position.set(-at[0], -at[1], -at[2]);
      return g;
    };
    const joyPivot = pivotAt("Joystick", [A.Joystick[0], A.Joystick[1], -1.62]);
    const dialPivot = pivotAt("RearDial", kamera.groups.RearDial.center);
    const BUTTONS = [
      "BtnMenu",
      "BtnPlay",
      "BtnDisp",
      "BtnQ",
      "BtnDrive",
      "BtnAel",
    ];
    const decal = (
      geo: THREE.BufferGeometry,
      map: THREE.Texture,
      opacity = 1,
    ) => {
      const m = new THREE.Mesh(
        geo,
        revealable(
          new THREE.MeshBasicMaterial({
            map,
            transparent: true,
            opacity,
            depthWrite: false,
          }),
        ),
      );
      m.renderOrder = 1;
      model.add(m);
      return m;
    };
    // contact shadows: a dark, soft ring on the body round each control (the light it cannot reach), a soft drop
    // shadow down and to the right, the seams where the plates meet the leather, and the lens mount
    {
      const ring = (inner: number, outer: number, k: number) => {
        const c = canvasOf(128),
          g = ctx2d(c),
          f = inner / outer,
          gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, "rgba(0,0,0,0)");
        gr.addColorStop(Math.max(0, f - 0.02), "rgba(0,0,0,0)");
        gr.addColorStop(f, `rgba(0,0,0,${k})`);
        gr.addColorStop(f + (1 - f) * 0.35, `rgba(0,0,0,${k * 0.4})`);
        gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr;
        g.fillRect(0, 0, 128, 128);
        return srgbTex(c);
      };
      const H: Record<string, number> = {
        BtnMenu: 0.13,
        BtnPlay: 0.13,
        BtnDisp: 0.13,
        BtnQ: 0.1,
        Joystick: 0.33,
      };
      for (const [name, h] of Object.entries(H)) {
        const a = A[name];
        if (!a) continue;
        const bezel = name.startsWith("Btn");
        const inner = a[3] + (bezel ? 0.1 : 0) - 0.02,
          outer = inner + 0.42;
        const m = decal(
          new THREE.CircleGeometry(outer, 48),
          ring(inner, outer, bezel ? 0.6 : 0.5),
        );
        m.rotation.y = Math.PI;
        m.position.set(
          a[0],
          a[1],
          (name === "Joystick" ? -1.62 : a[2] + h) - 0.025,
        ); // a hair off the leather
      }
      const blob = (() => {
        const c = canvasOf(128),
          g = ctx2d(c),
          gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        for (let i = 0; i <= 10; i++) {
          const t = i / 10,
            f =
              (Math.exp(-3.2 * t * t) - Math.exp(-3.2)) / (1 - Math.exp(-3.2));
          gr.addColorStop(t, `rgba(0,0,0,${f.toFixed(3)})`);
        }
        g.fillStyle = gr;
        g.fillRect(0, 0, 128, 128);
        return srgbTex(c);
      })();
      const drops: [string, number, number][] = [
        ["BtnDrive", -1.65, 0.42],
        ["BtnAel", -1.65, 0.42],
        ["BtnMenu", -1.62, 0.55],
        ["BtnPlay", -1.62, 0.55],
        ["BtnDisp", -1.62, 0.55],
        ["BtnQ", -1.62, 0.5],
        ["Joystick", -1.62, 0.55],
      ];
      for (const [name, surf, k] of drops) {
        const a = A[name];
        if (!a) continue;
        const m = decal(
          new THREE.CircleGeometry(a[3] * 1.5 + 0.1, 48),
          blob,
          k,
        );
        m.rotation.y = Math.PI;
        m.position.set(a[0] - 0.07, a[1] - 0.08, surf - 0.018); // on the back the viewer's right is the model's -x
      }
      const band = (fromTop: boolean, k: number) => {
        const c = canvasOf(4, 64),
          g = ctx2d(c),
          gr = g.createLinearGradient(0, 0, 0, 64);
        for (let i = 0; i <= 8; i++) {
          const t = i / 8,
            f = Math.exp(-5 * t * t) - Math.exp(-5) * t;
          gr.addColorStop(
            fromTop ? t : 1 - t,
            `rgba(0,0,0,${(k * f).toFixed(3)})`,
          );
        }
        g.fillStyle = gr;
        g.fillRect(0, 0, 4, 64);
        return srgbTex(c);
      };
      const seams: [number, number, THREE.Texture][] = [
        [5.52 - 0.21, 0.42, band(true, 0.62)],
        [0.67 + 0.15, 0.3, band(false, 0.5)],
      ];
      for (const [y, hh, tex] of seams)
        for (const back of [true, false]) {
          const m = decal(new THREE.PlaneGeometry(10.9, hh), tex);
          m.position.set(0, y, back ? -1.62 - 0.02 : 1.63 + 0.02);
          if (back) m.rotation.y = Math.PI;
        }
      const lens = decal(
        new THREE.CircleGeometry(3.4, 96),
        ring(2.72, 3.4, 0.7),
      );
      lens.position.set(A.lens[0], A.lens[1], A.lens[2] + 0.025);
    }
    const press: Record<string, number> = Object.fromEntries(
      BUTTONS.map((b) => [b, -1e9]),
    );
    const joy = { t: -1e9, dir: 0 };
    const dial = { angle: 0, target: 0 };
    let animUntil = 0;

    const glowTex = (() => {
      const c = canvasOf(128),
        g = ctx2d(c),
        grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      for (let i = 0; i <= 16; i++) {
        const t = i / 16,
          f = (Math.exp(-6 * t * t) - Math.exp(-6)) / (1 - Math.exp(-6));
        grd.addColorStop(t, `rgba(255,255,255,${f.toFixed(4)})`);
      }
      g.fillStyle = grd;
      g.fillRect(0, 0, 128, 128);
      return srgbTex(c);
    })();
    const ledGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xff7a1c,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0,
        toneMapped: false,
      }),
    );
    ledGlow.position.set(...v3(A.led));
    ledGlow.scale.setScalar(1.7);
    model.add(ledGlow);
    const LED_POS = new THREE.Vector3(...v3(A.led));

    /* ---------------- ambient occlusion: the light a crevice cannot get. Computed at reduced resolution after
       the real pass and multiplied onto it, so seams, the gaps round buttons and dials and the body's corners
       darken softly. */
    const AO = {
      scale: matchMedia("(pointer: coarse)").matches ? 0.45 : 0.6,
      strength: 0.8,
    };
    const gtao = new GTAOPass(scene, cam, 2, 2);
    gtao.output = GTAOPass.OUTPUT.Off; // normals, AO and denoise only; the blend below is ours
    gtao.updateGtaoMaterial({
      radius: 0.45,
      distanceExponent: 1.6,
      thickness: 0.5,
      scale: 1.2,
      samples: 16,
      distanceFallOff: 1,
      screenSpaceRadius: false,
    });
    gtao.updatePdMaterial({
      lumaPhi: 24,
      depthPhi: 4,
      normalPhi: 6,
      radius: 14,
      radiusExponent: 1.2,
      rings: 3,
      samples: 16,
    });
    const aoQuad = new FullScreenQuad(gtao.blendMaterial);
    const aoUnused = new THREE.WebGLRenderTarget(1, 1); // the pass's read and write buffers are not used with OUTPUT.Off
    // what the AO must not see: the light sprite, the painted contact shadows and seams
    const aoHide: THREE.Object3D[] = [];
    model.traverse((o) => {
      if (
        o instanceof THREE.Sprite ||
        (o instanceof THREE.Mesh &&
          o.material instanceof THREE.MeshBasicMaterial &&
          o.material.transparent &&
          o !== lcd)
      )
        aoHide.push(o);
    });
    const aoVis = new Map<THREE.Object3D, boolean>();
    function applyAO(k: number) {
      for (const o of aoHide) {
        aoVis.set(o, o.visible);
        o.visible = false;
      }
      gtao.render(renderer, aoUnused, aoUnused, 0, false);
      for (const o of aoHide) o.visible = aoVis.get(o) ?? true;
      renderer.setRenderTarget(null);
      gtao.blendMaterial.uniforms.tDiffuse.value = gtao.pdRenderTarget.texture;
      gtao.blendMaterial.uniforms.intensity.value = k * AO.strength;
      aoQuad.render(renderer);
    }

    /* the picture on the rear screen: same layout as the DOM album that takes over once the camera is held up */
    const family = getComputedStyle(root).fontFamily || "sans-serif";
    await document.fonts.load(`700 40px ${family}`).catch(() => {});
    const lcdCanvas = canvasOf(1260, 840);
    const lcdTex = new THREE.CanvasTexture(lcdCanvas);
    lcdTex.colorSpace = THREE.SRGBColorSpace;
    lcdTex.anisotropy = 8;
    lcdTex.flipY = false;
    let compact = false;
    function drawLcd(img: HTMLImageElement | null, i: number) {
      const W = lcdCanvas.width,
        H = lcdCanvas.height,
        g = ctx2d(lcdCanvas),
        t = TEAMS[i];
      g.fillStyle = "#000";
      g.fillRect(0, 0, W, H);
      if (img?.naturalWidth) {
        const k = Math.min(W / img.naturalWidth, H / img.naturalHeight),
          w = img.naturalWidth * k,
          h = img.naturalHeight * k;
        g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      }
      if (!frameEl.classList.contains("is-clean")) {
        const shade = g.createLinearGradient(0, 0, 0, H);
        shade.addColorStop(0, "rgba(0,0,0,0.5)");
        shade.addColorStop(0.2, "rgba(0,0,0,0)");
        shade.addColorStop(0.78, "rgba(0,0,0,0)");
        shade.addColorStop(1, "rgba(0,0,0,0.55)");
        g.fillStyle = shade;
        g.fillRect(0, 0, W, H);
        g.fillStyle = "#fff";
        g.textBaseline = "middle";
        const m = 0.034 * W,
          cy = 0.05 * W;
        g.beginPath();
        g.moveTo(m, cy - 0.013 * W);
        g.lineTo(m + 0.022 * W, cy);
        g.lineTo(m, cy + 0.013 * W);
        g.closePath();
        g.fill();
        g.font = `700 ${0.032 * W}px ${family}`;
        g.textAlign = "left";
        g.fillText(t.label, m + 0.032 * W, cy + 0.002 * W);
        g.font = `600 ${0.026 * W}px ${family}`;
        g.textAlign = "right";
        g.fillText(String(t.year), W - m, cy + 0.002 * W);
        if (!compact) {
          g.textAlign = "center";
          TEAMS.forEach((team, k) => {
            g.font = `${k === i ? 800 : 600} ${0.025 * W}px ${family}`;
            g.fillStyle = k === i ? "#fff" : "rgba(255,255,255,0.52)";
            g.fillText(
              String(team.year).slice(2),
              W * (0.135 + (0.73 * k) / Math.max(1, TEAMS.length - 1)),
              H - 0.048 * W,
            );
          });
        }
      }
      lcdTex.needsUpdate = true;
    }
    const lcdMat = revealable(
      new THREE.MeshBasicMaterial({
        map: lcdTex,
        transparent: true,
        toneMapped: false,
        opacity: 0,
      }),
    );
    lcd.material = lcdMat;
    const lcdGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(
        kamera.groups.Screen.size[0],
        kamera.groups.Screen.size[1],
      ),
      revealable(glass(1.52, 260, 0.9)),
    );
    lcdGlass.position.set(LCD_X, LCD_Y, LCD_Z - 0.012);
    lcdGlass.rotation.y = Math.PI;
    model.add(lcdGlass);
    const redraw = () =>
      void gallery.load(gallery.index).then((img) => {
        drawLcd(img, gallery.index);
        kick();
      });

    /* ---------------- layout: where the camera sits, and the pose in which it is "held up" */
    const HOME = new THREE.Vector3(),
      TARGET = new THREE.Vector3(),
      HELD = new THREE.Vector3(),
      S = new THREE.Vector3(),
      v = new THREE.Vector3();
    const L = { w: 0, h: 0, xOff: 0, yOff: 0 };
    const hw: { el: HTMLElement; at: Anchor; k: number; ky?: number }[] = [];
    function buildHw() {
      const mk = (label: string, fn: () => void, decorative: boolean) => {
        const b = document.createElement("button");
        b.type = "button";
        if (decorative) {
          b.tabIndex = -1;
          b.setAttribute("aria-hidden", "true");
        } else b.setAttribute("aria-label", label);
        b.addEventListener("click", fn);
        return b;
      };
      const single = (
        name: string,
        label: string,
        fn: (() => void) | null,
        decorative = false,
      ) => {
        const b = mk(
          label,
          () => {
            press[name] = performance.now();
            fn?.();
            kick();
          },
          decorative,
        );
        hwEl.append(b);
        hw.push({ el: b, at: A[name], k: 2.5 });
      };
      const split = (
        onDir: (d: number) => void,
        at: Anchor,
        kx: number,
        ky: number,
      ) => {
        const w = document.createElement("div");
        w.className = "hw-split";
        w.append(
          mk(root.dataset.prevLabel ?? "Previous team", () => onDir(-1), false),
          mk(root.dataset.nextLabel ?? "Next team", () => onDir(1), false),
        );
        hwEl.append(w);
        hw.push({ el: w, at, k: kx, ky });
      };
      split(
        (d) => {
          joy.t = performance.now();
          joy.dir = d;
          gallery.step(d);
          kick();
        },
        A.Joystick,
        4.2,
        3,
      );
      split(
        (d) => {
          dial.target += d * 0.55;
          gallery.step(d);
          kick();
        },
        A.RearDial,
        2.6,
        1.3,
      );
      single(
        "BtnPlay",
        root.dataset.playLabel ?? "Play or pause the slideshow",
        () => gallery.toggleSlideshow(),
      );
      single(
        "BtnDisp",
        root.dataset.infoLabel ?? "Show or hide the photo info",
        () => {
          gallery.toggleInfo();
          redraw();
        },
      );
      single(
        "BtnMenu",
        root.dataset.jumpLabel ?? "Jump between the first and the latest team",
        () => gallery.jump(),
      );
      single("BtnQ", "", null, true);
      single("BtnDrive", "", null, true);
      single("BtnAel", "", null, true);
    }
    function layout() {
      const w = view.clientWidth,
        h = view.clientHeight;
      if (w !== L.w || h !== L.h) {
        L.w = w;
        L.h = h;
        renderer.setSize(w, h, false);
        const pr = renderer.getPixelRatio();
        gtao.setSize(
          Math.max(2, Math.round(w * pr * AO.scale)),
          Math.max(2, Math.round(h * pr * AO.scale)),
        );
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
      }
      const wasCompact = compact;
      compact = w < 860;
      const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      const hostTop = compact ? textBottom("teams") : sketchHost.offsetTop;
      const hostH = Math.max(
        160,
        compact ? h - 12 - hostTop : sketchHost.offsetHeight,
      );
      const D = compact
        ? Math.max(
            10.5 / (2 * tan * Math.min(0.62, (0.92 * hostH) / h)),
            15.5 / (2 * tan * cam.aspect * 0.96),
          )
        : Math.max(
            10.5 / (2 * tan * 0.5),
            15.5 / (2 * tan * cam.aspect * 0.46),
          );
      HOME.set(0, 0.3, D);
      L.xOff = compact ? 0 : 0.21 * 2 * D * tan * cam.aspect;
      L.yOff = compact ? -((hostTop + hostH / 2 - h / 2) / h) * 2 * D * tan : 0;

      // held pose: the whole camera between the header and a strip below it for the hint and "Back to the start"
      const hdr = header?.offsetHeight ?? 0;
      const below = 108;
      const camH = LBOX.max.y - LBOX.min.y,
        camMid = (LBOX.max.y + LBOX.min.y) / 2 - PIVOT.y;
      let ppu = Math.min((1.04 * w) / 12.8, (0.97 * (h - hdr - below)) / camH);
      if (w < 700) ppu = Math.max(ppu, (0.9 * w) / LCD_W);
      rig.position.set(0, 0, 0);
      rig.rotation.set(0, Math.PI, 0);
      rig.updateMatrixWorld(true);
      S.set(LCD_X, LCD_Y, LCD_Z);
      model.localToWorld(S);
      TARGET.set(
        w < 700 ? S.x : 0,
        camMid + (hdr - below) / 2 / ppu,
        S.z + h / (2 * tan * ppu),
      );
      root.style.setProperty(
        "--cam-bottom",
        `${(h / 2 - (LBOX.min.y - PIVOT.y - TARGET.y) * ppu).toFixed(1)}px`,
      );
      frameEl.style.width = `${LCD_W * ppu}px`;
      frameEl.style.left = `${w / 2 + (S.x - TARGET.x) * ppu - (LCD_W * ppu) / 2}px`;
      frameEl.style.top = `${h / 2 - (S.y - TARGET.y) * ppu - (LCD_H * ppu) / 2}px`;

      // click targets over the physical controls, from the model's own anchor points
      cam.position.copy(TARGET);
      cam.rotation.set(0, 0, 0);
      cam.updateMatrixWorld(true);
      for (const t of hw) {
        v.set(t.at[0], t.at[1], t.at[2]);
        model.localToWorld(v);
        v.project(cam);
        const r = Math.max(20, t.at[3] * ppu * t.k);
        t.el.style.left = `${(v.x * 0.5 + 0.5) * w}px`;
        t.el.style.top = `${(-v.y * 0.5 + 0.5) * h}px`;
        t.el.style.width = `${r}px`;
        t.el.style.height = `${t.ky ? Math.max(28, t.at[3] * ppu * t.ky) : r}px`;
      }
      hintEl.textContent = w < 700 ? hints.touch : hints.wide;
      if (wasCompact !== compact) redraw();
    }

    /* ---------------- camera path over the first part of the scroll: [p, yaw, pitch] */
    const KEYS: [number, number, number][] = [
      [0.0, -0.06, 0.07],
      [T.cam.draw[0], -0.06, 0.07], // drawn face on, beside its text
      [T.front, 0.0, 0.03],
    ];
    function poseAt(p: number) {
      let i = 0;
      while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
      const a = KEYS[i],
        b = KEYS[i + 1],
        t = E.soft(seg(p, a[0], b[0]));
      return { yaw: mix(a[1], b[1], t), pitch: mix(a[2], b[2], t) };
    }
    const pulse = (x: number) =>
      x <= 0 || x >= 1
        ? 0
        : x < 0.22
          ? E.out(x / 0.22)
          : 1 - E.io((x - 0.22) / 0.78);
    const boxCorner = (i: number) =>
      v.set(
        i & 1 ? LBOX.max.x : LBOX.min.x,
        i & 2 ? LBOX.max.y : LBOX.min.y,
        i & 4 ? LBOX.max.z : LBOX.min.z,
      );

    function apply(p: number, now: number) {
      const K = poseAt(Math.min(p, T.front));
      const flipP = seg(p, T.flip[0], T.flip[1]),
        flip = E.io(flipP),
        wob = Math.sin(flipP * Math.PI);
      const idle = idleAt(p);
      // drawn, shaded, then real
      const real = seg(p, T.cam.real[0], T.cam.real[1]);
      ART.uDraw.value = seg(p, T.cam.draw[0], T.cam.draw[1]) * 1.15;
      ART.uHatch.value = seg(p, T.cam.hatch[0], T.cam.hatch[1]) * 1.15;
      ART.uReal.value = real >= 1 ? 9 : real * 1.12;
      key.shadow.intensity = seg(real, 0.8, 1);
      const led = seg(p, T.led[0], T.led[1]) * (1 - seg(p, T.led[2], T.led[3]));

      rig.rotation.set(
        K.pitch * (1 - flip) +
          0.05 * wob +
          Math.sin(now * 0.0011) * 0.018 * idle,
        K.yaw + Math.PI * flip + Math.sin(now * 0.0006) * 0.05 * idle,
        0.02 * wob,
      );
      rig.position.set(
        L.xOff,
        L.yOff + Math.sin(now * 0.0014) * 0.1 * idle - 0.06 * wob,
        0.35 * wob,
      );
      key.target.position.copy(rig.position);
      key.position.copy(rig.position).add(KEY_OFF);
      // reflections travel a little with the scroll, like turning the camera under the lights
      scene.environmentRotation.y = (clamp(p, 0, 0.62) - 0.31) * 0.75;

      MATS.LED_orange.emissiveIntensity = 6 * led;
      ledGlow.material.opacity = 0.95 * led;
      ledGlow.scale.setScalar(1.7 + 2.6 * led);
      renderer.toneMappingExposure = 1.05;

      // camera controls in the held pose
      for (const b of BUTTONS) {
        const o = part(b);
        if (o) o.position.z = 0.055 * pulse((now - press[b]) / 300);
      }
      if (joyPivot)
        joyPivot.rotation.y = 0.3 * joy.dir * pulse((now - joy.t) / 340);
      dial.angle += (dial.target - dial.angle) * 0.22;
      if (dialPivot) dialPivot.rotation.y = dial.angle;

      lcdMat.opacity = E.out(seg(p, T.lcd[0], T.lcd[1]));
      const zoom = E.io(seg(p, T.zoom[0], T.zoom[1]));
      HELD.set(TARGET.x + L.xOff, TARGET.y + L.yOff, TARGET.z);
      cam.position.lerpVectors(HOME, HELD, zoom);
      // the stage glow sits behind the camera; while only the drawings are there it stays dim
      glow.style.opacity = String(
        (1 - 0.6 * zoom) * mix(0.55, 1, seg(p, T.cam.draw[0], T.cam.real[1])),
      );
      v.copy(rig.position).project(cam);
      glow.style.setProperty(
        "--gx",
        `${((v.x * 0.5 + 0.5) * 100).toFixed(1)}%`,
      );
      glow.style.setProperty(
        "--gy",
        `${((-v.y * 0.5 + 0.5) * 100).toFixed(1)}%`,
      );
      setChrome(p);
      rig.updateMatrixWorld(true);
      ART.uRigInv.value.copy(rig.matrixWorld).invert();
      cam.updateMatrixWorld();
      let flashAt: [number, number] | null = null,
        camBox: [number, number, number, number] | null = null;
      const CL = SKETCH.camlight,
        lit = p > CL[0] - 0.01 && p < CL[3] + 0.01;
      if ((p > SKETCH.merge[0] - 0.01 && p < SKETCH.out[1]) || lit) {
        v.copy(LED_POS);
        model.localToWorld(v);
        v.project(cam);
        flashAt = [(v.x * 0.5 + 0.5) * L.w, (-v.y * 0.5 + 0.5) * L.h];
      }
      // where the camera is on screen (its box, projected), for the drawn light at it
      if (lit) {
        let x0 = Infinity,
          x1 = -Infinity,
          y0 = Infinity,
          y1 = -Infinity;
        for (let i = 0; i < 8; i++) {
          model.localToWorld(boxCorner(i)).project(cam);
          const x = (v.x * 0.5 + 0.5) * L.w,
            y = (-v.y * 0.5 + 0.5) * L.h;
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
        camBox = [(x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2, (y1 - y0) / 2];
      }
      // the album's words never sit on the camera: they make way as its top comes up to them
      let room = 1;
      const AP = PANELS.album;
      if (p > AP[0] && p < AP[3]) {
        let top = Infinity;
        for (let i = 0; i < 8; i++) {
          model.localToWorld(boxCorner(i)).project(cam);
          top = Math.min(top, (-v.y * 0.5 + 0.5) * L.h);
        }
        const el = panelEls.album;
        room = clamp((top - (el.offsetTop + el.offsetHeight) - 6) / 44);
      }
      setPanels(p, room);
      sketch.update(p, { flash: flashAt, cam: camBox, area: freeArea(p) });
    }

    /* ---------------- render: the real camera (as far as it has filled in), then the drawing on top */
    let blank = false;
    function pen() {
      cam.layers.set(1);
      scene.overrideMaterial = depthMat;
      renderer.render(scene, cam);
      scene.overrideMaterial = null;
      renderer.render(scene, cam);
      cam.layers.set(2);
      renderer.render(scene, cam);
      cam.layers.set(0);
    }
    function draw(p: number) {
      if (p < T.cam.draw[0] - 0.004) {
        if (!blank) {
          renderer.clear();
          blank = true;
        }
        return;
      }
      blank = false;
      renderer.clear();
      if (ART.uReal.value > 0.0001 || ledGlow.material.opacity > 0.002) {
        cam.layers.set(0);
        renderer.shadowMap.needsUpdate = true;
        renderer.render(scene, cam);
        // the AO comes in with the real camera (it darkens only what the real pass has drawn)
        const aoK = clamp((Math.min(ART.uReal.value, 1.12) - 0.15) / 0.8);
        if (aoK > 0.01) applyAO(aoK);
      }
      if (ART.uReal.value < 5) pen();
    }

    /* ---------------- loop: the scroll position is followed with a little inertia */
    let pS = scrollP(),
      last = 0,
      raf = 0,
      visible = true;
    function tick(now: number) {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = scrollP();
      pS += (target - pS) * (1 - Math.exp(-dt * 7.5));
      if (Math.abs(target - pS) < 0.0004) pS = target;
      apply(pS, now);
      draw(pS);
      const settled =
        pS === target &&
        now > animUntil &&
        Math.abs(dial.target - dial.angle) < 0.002;
      if (!(settled && idleAt(pS) === 0)) raf = requestAnimationFrame(tick); // a camera being drawn floats; otherwise rest
    }
    function run() {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    }
    function kick() {
      animUntil = performance.now() + 700;
      run();
    }

    buildHw();
    layout();
    ART.uPx.value = renderer.getPixelRatio();
    for (const l of [0, 1, 2]) {
      cam.layers.set(l);
      renderer.compile(scene, cam);
    }
    cam.layers.set(0);
    // warm-up: draw every pass once while nobody looks, so the first drawn and the first real frame do not stall
    {
      const keep = [ART.uDraw.value, ART.uHatch.value, ART.uReal.value];
      ART.uDraw.value = ART.uHatch.value = 2;
      ART.uReal.value = 0.5;
      rig.updateMatrixWorld(true);
      ART.uRigInv.value.copy(rig.matrixWorld).invert();
      draw(T.cam.real[0]);
      [ART.uDraw.value, ART.uHatch.value, ART.uReal.value] = keep;
      renderer.clear();
    }
    apply(pS, 0);
    draw(pS);
    void gallery.load(0).then((img) => {
      drawLcd(img, 0);
      kick();
    });
    gallery.onChange = (i) =>
      void gallery.load(i).then((img) => {
        drawLcd(img, i);
        kick();
      });
    addEventListener("scroll", run, { passive: true });
    new ResizeObserver(() => {
      layout();
      kick();
    }).observe(view);
    new IntersectionObserver(([en]) => {
      // Coming back into view (scrolled back, or the team switch shows the
      // story again): start where the scroll is now. The inertia only
      // smooths scrolling that was watched; gliding over what happened
      // while nobody looked would rewind the whole story on screen.
      if (en.isIntersecting && !visible) pS = scrollP();
      visible = en.isIntersecting;
      run();
    }).observe(story);
    // The team switch shows the story again (TeamPanels.astro): set it to
    // the scroll right away, before the first frame, so the state it was
    // hidden in never flashes up.
    document.addEventListener("team:view", (e) => {
      if ((e as CustomEvent<string>).detail !== "past") return;
      if (story.closest("[hidden]")) return;
      layout();
      pS = scrollP();
      visible = true;
      apply(pS, performance.now());
      draw(pS);
      kick();
    });
    run();
  }
}
