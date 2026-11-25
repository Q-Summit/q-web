// The story drawn in white line art, stroke by stroke with the scroll. One pen line runs through it:
//   hero: a hand-drawn "10" with depth and hatching, written in one line when the page opens
//   link: the same line runs on out of the 0 and travels down; the view follows the pen
//   thinker: it becomes a person deep in thought (chin on the fist), shaded with echo lines and hatching
//   idea: a thought spirals up from the head and becomes a light bulb, which lights up
//   merge: the bulb's yellow light travels into the 3D camera's orange self-timer light; in that light the
//     camera draws itself face on (the 3D layer), then turns real while it turns around
//   camlight: the camera's light drawn like the bulb's (short warm rays, soft glow) until it is real there
// The pen never lifts between chapters: the 10, the link and the thinker's profile are one line; the thought
// grows out of the back of the head and becomes the bulb in one line; the light of the bulb becomes the camera's
// self-timer light.
// update(p, info) maps the scroll progress p to every stroke; info.flash is the camera's self-timer light on screen
// (view px).
import type { Poly, Pt } from "./history-lineart";
import {
  bulbLine,
  bulbLines,
  cr,
  ellipse,
  extend,
  hatch,
  len,
  offset,
  rng,
  sub,
  tenDrawing,
  THINKER,
  wander,
} from "./history-lineart";

export type { Poly, Pt } from "./history-lineart";

/** Scroll windows of each chapter, as [start, end] progress (0..1). */
export interface SketchTimes {
  link: [number, number];
  thinker: [number, number];
  shade: [number, number];
  thought: [number, number];
  bulb: [number, number];
  light: [number, number];
  merge: [number, number];
  out: [number, number];
  pulse: [number, number];
  camlight: [number, number, number, number];
}

/** What the 3D layer tells the sketch each frame, all in stage CSS px. */
export interface SketchInfo {
  flash?: Pt | null;
  cam?: [number, number, number, number] | null;
  area?: [number, number] | null;
}

export interface Sketch {
  ready: Promise<void>;
  frame(p: number): [number, number, number];
  startIntro(): void;
  update(p: number, info?: SketchInfo): void;
}

type Clock = "p" | "intro";
type GroupName = "world" | "think";
/** screen = s * local + (x, y), in CSS px */
type Tf = [number, number, number];
type Quad = [number, number, number, number];

interface Item {
  g: GroupName;
  a: number;
  b: number;
  path: Path2D;
  len: number;
  w: number;
  alpha: number;
  color: string;
  clock: Clock;
}

interface Stretch {
  i0: number;
  i1: number;
  g: GroupName;
  o: Pt;
  a: number;
  b: number;
  clock?: Clock;
}

interface Group {
  M: Tf;
  o: number;
  X?: [number, number, number, number, number, number];
  sc?: number;
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t: number, a: number, b: number) =>
  b <= a ? (t >= a ? 1 : 0) : clamp((t - a) / (b - a));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const io = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const out = (x: number) => 1 - Math.pow(1 - x, 3);
const WHITE = "255,255,255",
  ICE = "187,228,255",
  WARM = "255,226,160";

// placement in world units (the stage shows a 600 x 480 box at zoom 1)
const THINK_AT: Pt = [100, 520];

const noop: Sketch = {
  ready: Promise.resolve(),
  frame: () => [1, 0, 0],
  startIntro() {},
  update() {},
};

export function createSketch(host: HTMLElement | null, T: SketchTimes): Sketch {
  if (!host) return noop;
  // host only marks the drawing area; the canvas covers the whole stage, so light and the dive are never clipped
  const stage = host.parentElement;
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;" +
    "-webkit-mask-image:linear-gradient(#000 88%,transparent);mask-image:linear-gradient(#000 88%,transparent)";
  const context = canvas.getContext("2d");
  if (!stage || !context) return noop;
  // narrowed once, so the hoisted functions below see them as present
  const ctx: CanvasRenderingContext2D = context;
  const hostEl: HTMLElement = host;
  const stageEl: HTMLElement = stage;
  host.after(canvas);
  const r = rng(2017);
  const S = T;

  /* ---------- strokes */
  const items: Item[] = [];
  const P2 = (poly: Poly) => {
    const p = new Path2D();
    poly.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])));
    return p;
  };
  const add = (
    g: GroupName,
    poly: Poly,
    a: number,
    b: number,
    w: number,
    alpha: number,
    color = WHITE,
    clock: Clock = "p",
  ) =>
    items.push({
      g,
      a,
      b: Math.max(b, a + 1e-4),
      path: P2(poly),
      len: len(poly) + 2,
      w,
      alpha,
      color,
      clock,
    });
  // a pen line plus the ghost passes that make it look drawn by hand
  const ink = (
    g: GroupName,
    poly: Poly,
    a: number,
    b: number,
    k = 1,
    color = WHITE,
    clock?: Clock,
  ) => {
    const d = b - a;
    add(g, poly, a, b, 1.35, 0.92 * k, color, clock);
    add(
      g,
      extend(wander(poly, 1.8, r), 6),
      a + d * 0.04,
      b,
      0.7,
      0.55 * k,
      color,
      clock,
    );
    add(
      g,
      sub(extend(wander(poly, 3.6, r, 2), 10), r() * 0.25, 0.7 + r() * 0.3),
      a + d * 0.1,
      b,
      0.5,
      0.36 * k,
      color,
      clock,
    );
    add(
      g,
      sub(extend(wander(poly, 6.5, r, 1.5), 16), r() * 0.4, 0.5 + r() * 0.5),
      a + d * 0.15,
      b,
      0.4,
      0.2 * k,
      color,
      clock,
    );
  };
  // contour echoes: the shading that follows a form
  const echo = (
    g: GroupName,
    poly: Poly,
    side: number,
    n: number,
    gap: number,
    a: number,
    b: number,
  ) => {
    for (let i = 1; i <= n; i++)
      add(
        g,
        sub(wander(offset(poly, side * gap * i), 1, r), 0.1 * i, 1 - 0.08 * i),
        mix(a, b, i * 0.1),
        b,
        0.55,
        0.5 / i,
      );
  };
  const shade = (
    g: GroupName,
    outline: Poly,
    ang: number,
    gap: number,
    a: number,
    b: number,
    clock: Clock = "p",
    k = 1,
  ) => {
    const l1 = hatch(outline, ang, gap * 0.75, r),
      l2 = hatch(outline, ang + 0.9, gap * 1.1, r);
    l1.forEach((l, i) => {
      const s = mix(a, b, (i / l1.length) * 0.7);
      add(
        g,
        wander(cr(l, 4), 0.6, r),
        s,
        s + (b - a) * 0.3,
        0.55,
        0.5 * k,
        WHITE,
        clock,
      );
    });
    l2.forEach((l, i) => {
      const s = mix(a, b, 0.35 + (i / l2.length) * 0.5);
      add(g, l, s, s + (b - a) * 0.15, 0.45, 0.25 * k, WHITE, clock);
    });
  };
  // one unbroken pen line through several stretches, each with its own group, timing and clock. The ghost passes
  // are made over the whole line, so nothing restarts where one stretch hands over to the next.
  const chain = (pts: Poly, stretches: Stretch[], k = 1) => {
    const waves = Math.max(2, len(pts) / 140);
    const passes: [Poly, number, number][] = [
      [pts, 1.35, 0.92],
      [wander(pts, 1.8, r, waves), 0.7, 0.55],
      [wander(pts, 3.4, r, waves * 0.6), 0.5, 0.34],
      [wander(pts, 5.5, r, waves * 0.4), 0.4, 0.18],
    ];
    for (const st of stretches)
      for (const [pp, w, al] of passes)
        add(
          st.g,
          pp
            .slice(st.i0, st.i1 + 1)
            .map(([x, y]): Pt => [x - st.o[0], y - st.o[1]]),
          st.a,
          st.b,
          w,
          al * k,
          WHITE,
          st.clock || "p",
        );
  };
  const nearest = (pts: Poly, q: Pt, from = 0) => {
    let best = from,
      d = Infinity;
    for (let i = from; i < pts.length; i++) {
      const e = (pts[i][0] - q[0]) ** 2 + (pts[i][1] - q[1]) ** 2;
      if (e < d) {
        d = e;
        best = i;
      }
    }
    return best;
  };

  /* hero, link and the thinker's profile: one line. The 10 is written when the page opens (clock "intro"), the rest
     follows the scroll; the pen waits on the end of the 10 until the visitor scrolls. */
  const ten = tenDrawing(r);
  const crown: Pt = [
    THINK_AT[0] + THINKER.main[0][0],
    THINK_AT[1] + THINKER.main[0][1],
  ];
  const anchor = ten.end;
  {
    const ctrl: Poly = [
      ...ten.line,
      [478, 372],
      [512, 450],
      [520, 560],
      [500, 650],
      [466, 690],
      [416, 701],
      crown,
      ...THINKER.main
        .slice(1)
        .map(([x, y]): Pt => [x + THINK_AT[0], y + THINK_AT[1]]),
    ];
    const pts = cr(ctrl, 3),
      iEnd = nearest(pts, ten.end, Math.floor(pts.length * 0.2)),
      iCrown = nearest(pts, crown, iEnd);
    const [a, b] = S.thinker;
    chain(pts, [
      { i0: 0, i1: iEnd, g: "world", o: [0, 0], a: 0, b: 0.62, clock: "intro" },
      {
        i0: iEnd,
        i1: iCrown,
        g: "think",
        o: THINK_AT,
        a: S.link[0],
        b: S.link[1],
      },
      {
        i0: iCrown,
        i1: pts.length - 1,
        g: "think",
        o: THINK_AT,
        a,
        b: mix(a, b, 0.55),
      },
    ]);
    // the 10's depth and shading
    ten.depth.forEach((d, i) =>
      ink(
        "world",
        cr(d, 3),
        0.55 + (i % 7) * 0.03,
        0.72 + (i % 7) * 0.03,
        0.55,
        WHITE,
        "intro",
      ),
    );
    ten.shade.forEach((f, i) =>
      shade(
        "world",
        f.poly,
        f.ang,
        f.gap,
        0.62 + i * 0.03,
        0.98,
        "intro",
        f.light ? 0.45 : 1,
      ),
    );
  }
  // energy around it: orbits and speed lines, like the poster's
  add(
    "world",
    wander(ellipse(300, 214, 236, 70, -0.16, 2.5, 6.5), 2.5, r),
    0.5,
    1,
    0.6,
    0.3,
    ICE,
    "intro",
  );
  add(
    "world",
    wander(ellipse(300, 206, 200, 118, 0.32, -0.7, 2.9), 2.5, r),
    0.6,
    1,
    0.5,
    0.22,
    WHITE,
    "intro",
  );
  for (let i = 0; i < 12; i++) {
    const y = 96 + r() * 230,
      left = r() < 0.5,
      x0 = left ? 40 + r() * 90 : 470 + r() * 80,
      w = 30 + r() * 100;
    add(
      "world",
      [
        [x0, y],
        [x0 + w, y],
      ],
      0.65 + r() * 0.25,
      1,
      0.5,
      0.18 + r() * 0.18,
      r() < 0.4 ? ICE : WHITE,
      "intro",
    );
  }

  /* the thinker */
  {
    const [a, b] = S.thinker,
      k = (x: number) => mix(a, b, x),
      g: GroupName = "think",
      t = THINKER;
    ink(g, cr(t.back), k(0.42), k(0.72));
    ink(g, cr(t.arm), k(0.6), k(0.78), 0.85);
    ink(g, cr(t.jaw), k(0.62), k(0.74), 0.8);
    ink(g, cr(t.ear), k(0.66), k(0.8), 0.8);
    ink(g, cr(t.brow), k(0.74), k(0.82), 0.6);
    ink(g, cr(t.eye), k(0.78), k(0.86), 0.9);
    ink(g, cr(t.nostril), k(0.8), k(0.84), 0.6);
    t.creases.forEach((c, i) =>
      ink(g, cr(c), k(0.8 + i * 0.03), k(0.86 + i * 0.03), 0.6),
    );
    ink(g, cr(t.fold), k(0.72), k(0.95), 0.8);
    ink(g, cr(t.table), k(0.82), k(1), 0.7);
    t.hair.forEach((h, i) =>
      ink(g, cr(h), k(0.84 + i * 0.03), k(0.92 + i * 0.03), 0.6),
    );
    const [s0, s1] = S.shade,
      m = (x: number) => mix(s0, s1, x);
    echo(g, cr(t.back), -1, 5, 3.5, m(0), m(0.5));
    echo(g, sub(cr(t.main), 0.62, 1), -1, 3, 3.5, m(0.1), m(0.6));
    echo(g, sub(cr(t.main), 0, 0.3), 1, 3, 3.5, m(0.2), m(0.7));
    echo(g, cr(t.arm), 1, 3, 3.5, m(0.3), m(0.8));
    shade(g, t.shadeHead, 0.9, 5, m(0.05), m(0.6));
    shade(g, t.shadeCheek, 0.7, 5, m(0.3), m(0.8));
    shade(g, t.shadeArm, 1.2, 4.5, m(0.4), m(0.9));
    shade(g, t.shadeBack, 0.95, 5, m(0.5), m(1));
    // energy: orbits around the figure, like a thought circling
    const orbits: [number, number, number, number, number][] = [
      [200, 70, -0.25, 0.4, 4.2],
      [230, 90, 0.18, 2.6, 6.0],
      [170, 60, -0.5, 3.5, 6.5],
    ];
    orbits.forEach(([rx, ry, rot, a0, a1], i) =>
      add(
        g,
        wander(ellipse(250, 380, rx, ry, rot, a0, a1), 3, r),
        m(0.3 + i * 0.15),
        m(0.8 + i * 0.07),
        0.6,
        0.3,
        i ? WHITE : ICE,
      ),
    );
    // the thought, the bulb, the light
    // the thought runs along the back of the head, lifts off in a spiral and draws the bulb, all in one line
    const tb = cr([...t.thought.slice(0, -1), ...bulbLine(t.bulb)], 2);
    chain(
      tb,
      [
        {
          i0: 0,
          i1: tb.length - 1,
          g,
          o: [0, 0],
          a: S.thought[0],
          b: S.bulb[1],
        },
      ],
      0.92,
    );
    const bl = bulbLines(t.bulb),
      n = (x: number) => mix(S.bulb[0], S.bulb[1], x);
    ink(g, bl.filament, n(0.86), n(1), 1, WARM);
    for (let i = -4; i <= 4; i++) {
      const th = -Math.PI / 2 + i * 0.36,
        r0 = t.bulb.r + 12,
        r1 = t.bulb.r + 30 + (i % 2 ? 0 : 12);
      const ray: Poly = [
        [t.bulb.cx + Math.cos(th) * r0, t.bulb.cy + Math.sin(th) * r0],
        [t.bulb.cx + Math.cos(th) * r1, t.bulb.cy + Math.sin(th) * r1],
      ];
      ink(
        g,
        cr(ray, 3),
        mix(S.light[0], S.light[1], 0.3 + Math.abs(i) * 0.05),
        mix(S.light[0], S.light[1], 0.6 + Math.abs(i) * 0.05),
        0.8,
        WARM,
      );
    }
  }

  const ready = Promise.resolve();

  /* ---------- light: smooth falloffs, drawn additively (light adds up, it never greys the night) */
  const FALL = Array.from({ length: 17 }, (_, i): [number, number] => {
    const t = i / 16,
      k = 5;
    return [t, (Math.exp(-k * t * t) - Math.exp(-k)) / (1 - Math.exp(-k))];
  });
  function glowAt(x: number, y: number, R: number, rgb: string, a: number) {
    if (a <= 0.002 || R <= 0.5) return;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, R);
    for (const [t, f] of FALL)
      gr.addColorStop(t, `rgba(${rgb},${(a * f).toFixed(4)})`);
    ctx.fillStyle = gr;
    ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
  }
  // a soft ring: a band of light with the same falloff on both sides
  function bandAt(
    x: number,
    y: number,
    R: number,
    w: number,
    rgb: string,
    a: number,
  ) {
    if (a <= 0.002 || R <= 0.5) return;
    const r0 = Math.max(0, R - w),
      r1 = R + w,
      gr = ctx.createRadialGradient(x, y, r0, x, y, r1);
    for (const [t] of FALL) {
      const q = Math.abs(t - 0.5) * 2,
        g = (Math.exp(-4 * q * q) - Math.exp(-4)) / (1 - Math.exp(-4));
      gr.addColorStop(t, `rgba(${rgb},${(a * g).toFixed(4)})`);
    }
    ctx.fillStyle = gr;
    ctx.fillRect(x - r1, y - r1, 2 * r1, 2 * r1);
  }

  /* ---------- the camera's light, drawn like the bulb's: a ring of short warm pen rays (long and short in turn)
     and a soft glow, right at the self-timer light; drawn with the impulse, kept until the camera is real there
     (S.camlight). info.flash is the light on screen, info.cam the camera's box (for the size). */
  const RAYS = Array.from({ length: 10 }, (_, i) => ({
    th: -Math.PI / 2 + (i / 10) * Math.PI * 2 + (r() - 0.5) * 0.12,
    long: i % 2 === 0,
    len: 0.85 + r() * 0.3,
    bend: (r() - 0.5) * 0.5,
    j: [(r() - 0.5) * 2, (r() - 0.5) * 2, (r() - 0.5) * 2] as [
      number,
      number,
      number,
    ],
  }));
  const polyLen = (pts: Poly) => {
    let l = 0;
    for (let i = 1; i < pts.length; i++)
      l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return l;
  };
  function strokeDrawn(
    pts: Poly,
    kv: number,
    w: number,
    a: number,
    rgb: string,
  ) {
    if (kv <= 0 || a <= 0.003) return;
    const L = polyLen(pts);
    ctx.globalAlpha = a;
    ctx.strokeStyle = `rgb(${rgb})`;
    ctx.lineWidth = w;
    ctx.setLineDash(kv >= 1 ? [] : [L * kv, L * 2]);
    ctx.beginPath();
    pts.forEach((q, i) =>
      i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]),
    );
    ctx.stroke();
  }
  function camLight(p: number, c: Quad | null, led: Pt | null) {
    const CL = S.camlight;
    if (!c || !led || !CL || p < CL[0] || p > CL[3]) return;
    const fade = 1 - io(seg(p, CL[2], CL[3]));
    if (fade <= 0.003) return;
    const U = Math.max(9, Math.min(c[2], c[3]) * 0.16),
      span = CL[1] - CL[0];
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // the glow first, under the rays: small and warm, as at the bulb
    const on = io(seg(p, CL[0], CL[0] + span * 0.5));
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "lighter";
    glowAt(led[0], led[1], U * 1.7, "255,186,110", 0.2 * on * fade);
    glowAt(led[0], led[1], U * 0.45, "255,232,196", 0.3 * on * fade);
    ctx.globalCompositeOperation = "source-over";
    RAYS.forEach((ry, i) => {
      const a = CL[0] + span * (0.15 + 0.04 * (i % 5)),
        kv = io(seg(p, a, a + span * 0.45));
      if (kv <= 0) return;
      const r0 = U * 0.55,
        l = U * (ry.long ? 0.75 : 0.45) * ry.len;
      const dx = Math.cos(ry.th),
        dy = Math.sin(ry.th),
        bb = ry.bend * l * 0.2;
      const pts = [0, 0.5, 1].map((t): Pt => [
        led[0] + dx * (r0 + l * t) - dy * bb * Math.sin(Math.PI * t),
        led[1] + dy * (r0 + l * t) + dx * bb * Math.sin(Math.PI * t),
      ]);
      strokeDrawn(pts, kv, 1.2, 0.7 * fade, WARM);
      const g = pts.map(([x, y], k): Pt => [
        x + ry.j[k] * 0.9,
        y + ry.j[(k + 1) % 3] * 0.9,
      ]);
      strokeDrawn(g, kv, 0.55, 0.32 * fade, WARM);
    });
    ctx.setLineDash([]);
    ctx.restore();
  }
  // phones: the drawing fades out softly just under the text on screen, never a cut edge
  function softTop() {
    if (!(cur.area && W < 520)) return;
    const y0 = (hy - 18) * dpr,
      y1 = (hy + 34) * dpr;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
    ctx.globalCompositeOperation = "destination-out";
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    for (const [t, f] of FALL) g.addColorStop(t, `rgba(0,0,0,${f.toFixed(4)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, Math.max(0, y1));
    ctx.restore();
  }

  /* ---------- streaks: thin scan lines across the stage (host units 0..1), like the poster's speed lines */
  const streaks = Array.from({ length: 26 }, () => ({
    y: r(),
    x: r() * 1.2 - 0.1,
    w: 0.05 + r() * 0.3,
    a: 0.08 + r() * 0.16,
    v: (r() - 0.5) * 0.6,
  }));

  /* ---------- layout */
  let W = 1,
    H = 1,
    CW = 1,
    CH = 1,
    hx = 0,
    hy = 0,
    dpr = 1,
    base = 1;
  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = hostEl.clientWidth;
    H = hostEl.clientHeight;
    hx = hostEl.offsetLeft;
    hy = hostEl.offsetTop;
    CW = stageEl.clientWidth;
    CH = stageEl.clientHeight;
    canvas.width = Math.max(1, Math.round(CW * dpr));
    canvas.height = Math.max(1, Math.round(CH * dpr));
    base = Math.min(W / 600, H / 480);
    lastKey = "";
  }
  // view keys: [p, cx, cy, zoom, w, h]; zoom is interpolated in log space. On phones the zoom instead fits the
  // box w x h (world units) into the free area, so the drawing always uses the space it has.
  type ViewKey = [number, number, number, number, number, number];
  const VIEW_D: ViewKey[] = [
    [0, 300, 212, 1, 350, 280],
    [S.link[0], 300, 212, 1, 350, 280],
    [S.link[1], 300, 812, 0.84, 400, 540],
    [S.light[0] - 0.02, 300, 800, 0.87, 400, 540],
    [S.merge[1], 310, 790, 0.92, 400, 540],
  ];
  // phones: while the 10 recedes, the view keeps it and the line coming out of it in sight, then settles on the thinker
  const VIEW_M: ViewKey[] = [
    [0, 300, 212, 1, 350, 280],
    [S.link[0], 300, 212, 1, 350, 280],
    [mix(S.link[0], S.link[1], 0.5), 410, 450, 1, 320, 440],
    [S.link[1], 320, 700, 1, 440, 720],
    [S.light[0] - 0.02, 300, 800, 0.87, 400, 540],
    [S.merge[1], 310, 790, 0.92, 400, 540],
  ];
  function view(p: number) {
    const VIEW = W < 520 ? VIEW_M : VIEW_D;
    let i = 0;
    while (i < VIEW.length - 2 && p > VIEW[i + 1][0]) i++;
    const A = VIEW[i],
      B = VIEW[i + 1],
      t = io(seg(p, A[0], B[0]));
    const zk = (k: ViewKey) =>
      W < 520 ? Math.min(W / (k[4] * base), H / (k[5] * base)) : k[3];
    const z = Math.exp(mix(Math.log(zk(A)), Math.log(zk(B)), t));
    return { cx: mix(A[1], B[1], t), cy: mix(A[2], B[2], t), z };
  }
  const tf = (s: number, x: number, y: number): Tf => [s, x, y]; // screen = s * local + (x, y), in CSS px
  const comp = (A: Tf, B: Tf): Tf => [
    A[0] * B[0],
    A[0] * B[1] + A[1],
    A[0] * B[2] + A[2],
  ];
  const apply = (M: Tf) =>
    ctx.setTransform(dpr * M[0], 0, 0, dpr * M[0], dpr * M[1], dpr * M[2]);

  // the stage transform of the drawing's world at scroll progress p: screen = s * world + (x, y), stage CSS px
  function frame(p: number): Tf {
    const v = view(p),
      s0 = base * v.z;
    return tf(s0, hx + W / 2 - v.cx * s0, hy + H / 2 - v.cy * s0);
  }

  /* ---------- paint */
  let lastKey = "",
    intro = 0;
  const cur: {
    p: number;
    flash: Pt | null;
    cam: Quad | null;
    area: [number, number] | null;
  } = {
    p: 0,
    flash: null,
    cam: null,
    area: null,
  };
  function paint() {
    // hidden (the team switch shows the other view): nothing to draw on; the
    // ResizeObserver sizes and paints again once the story is shown
    if (W < 1 || H < 1) return;
    const p = cur.p,
      lens = cur.flash;
    // while the page waits at the top, the pen rests on the 0 and its tip breathes
    const tipOn = p < S.link[0] && intro > 0.98;
    const tick = tipOn ? Math.round(performance.now() / 40) : 0;
    // phones: the drawing area is the free space below the text on screen now
    if (cur.area && W < 520) {
      hy = cur.area[0];
      H = Math.max(120, cur.area[1] - cur.area[0]);
      base = Math.min(W / 600, H / 480);
    }
    const key = `${p.toFixed(5)}|${intro.toFixed(3)}|${tick}|${lens ? lens.map((v) => v.toFixed(1)).join(",") : ""}|${cur.area ? cur.area[0].toFixed(1) : ""}|${cur.cam ? cur.cam.map((v) => v.toFixed(1)).join(",") : ""}`;
    if (key === lastKey) return;
    lastKey = key;
    const layer = 1 - seg(p, S.out[0], S.out[1]);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (cur.cam) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      camLight(p, cur.cam, cur.flash);
      ctx.globalAlpha = 1;
    }
    if (layer <= 0) {
      softTop();
      return;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const WORLD = frame(p);
    const merge = seg(p, S.merge[0], S.merge[1]);
    const thinkAlpha =
      1 - io(seg(p, S.merge[0], mix(S.merge[0], S.merge[1], 0.7)));
    const compact = W < 520;
    const G: Record<GroupName, Group> = {
      world: {
        M: WORLD,
        o: 1 - 0.85 * seg(p, S.thinker[0] + 0.04, S.thinker[1]),
      },
      think: { M: comp(WORLD, tf(1, THINK_AT[0], THINK_AT[1])), o: thinkAlpha },
    };
    if (compact) {
      const k = io(seg(p, S.link[0], mix(S.link[0], S.link[1], 0.6)));
      if (k > 0) {
        const s = mix(1, 0.42, k),
          la = s,
          lb = 0.04 * k * s,
          lc = -0.2 * k * s,
          ld = s * mix(1, 0.72, k),
          [ax, ay] = anchor,
          Mw = WORLD;
        G.world.X = [
          Mw[0] * la,
          Mw[0] * lb,
          Mw[0] * lc,
          Mw[0] * ld,
          Mw[0] * (ax - (la * ax + lc * ay)) + Mw[1],
          Mw[0] * (ay - (lb * ax + ld * ay)) + Mw[2],
        ];
        G.world.sc =
          (Mw[0] * Math.sqrt(Math.abs(la * ld - lb * lc))) / mix(1, 0.8, k);
      }
    }

    // on phones the text sits above the drawing area: strokes stay below it, only light covers the whole stage
    ctx.save();
    // streaks behind everything
    const env =
      seg(p, S.link[0], S.link[1]) *
      (1 - seg(p, S.merge[0], S.merge[0] + 0.03));
    if (env > 0.01) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 0.6;
      for (const st of streaks) {
        const x = ((((st.x + p * st.v) % 1.3) + 1.3) % 1.3) - 0.15;
        ctx.strokeStyle = `rgba(${ICE},${(st.a * env * layer).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(x * CW, st.y * CH);
        ctx.lineTo((x + st.w) * CW, st.y * CH);
        ctx.stroke();
      }
    }

    // bulb light (under the strokes): a warm glow, not a glare; it leaves with the light that travels on
    ctx.restore();
    const light =
      seg(p, S.light[0], S.light[1]) * (1 - io(seg(merge, 0, 0.45)));
    if (light > 0.002) {
      apply(G.think.M);
      const { cx, cy, r: br } = THINKER.bulb,
        R = br * 3.6;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "lighter"; // light adds up, it never greys the night
      glowAt(cx, cy, R, "255,210,140", 0.27 * light);
      glowAt(cx, cy, br * 1.6, "255,242,214", 0.3 * light);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.save();

    for (const it of items) {
      const g = G[it.g];
      if (!g || g.o <= 0.003) continue;
      const kv = seg(it.clock === "intro" ? intro : p, it.a, it.b);
      if (kv <= 0) continue;
      if (g.X)
        ctx.setTransform(
          dpr * g.X[0],
          dpr * g.X[1],
          dpr * g.X[2],
          dpr * g.X[3],
          dpr * g.X[4],
          dpr * g.X[5],
        );
      else apply(g.M);
      ctx.globalAlpha = g.o * it.alpha * layer;
      ctx.strokeStyle = `rgb(${it.color})`;
      ctx.lineWidth = it.w / (g.sc || g.M[0]);
      ctx.setLineDash(kv >= 1 ? [] : [it.len * kv, it.len * 2]);
      ctx.stroke(it.path);
    }
    ctx.setLineDash([]);

    if (tipOn || (p < S.link[0] + 0.02 && intro > 0.98)) {
      const k = tipOn
        ? 0.6 + 0.4 * Math.sin(performance.now() / 420)
        : 1 - seg(p, S.link[0], S.link[0] + 0.02);
      const sx = WORLD[0] * anchor[0] + WORLD[1],
        sy = WORLD[0] * anchor[1] + WORLD[2];
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "lighter";
      glowAt(sx, sy, 34, ICE, 0.38 * k);
      glowAt(sx, sy, 10, WHITE, 0.62 * k);
      ctx.globalCompositeOperation = "source-over";
    }

    // the bulb's light travels to the camera's flash: warm and wide at the bulb, cool and small at the flash,
    // then it pops softly there, and in that light the camera draws itself (the 3D layer)
    const fl = cur.flash;
    if (fl && merge > 0) {
      const bx = G.think.M[0] * THINKER.bulb.cx + G.think.M[1],
        by = G.think.M[0] * THINKER.bulb.cy + G.think.M[2];
      const t = io(merge),
        x = mix(bx, fl[0], t),
        y = mix(by, fl[1], t);
      const pop =
        seg(p, S.merge[1] - 0.012, S.merge[1]) *
        (1 - seg(p, S.merge[1], S.pulse[0] + 0.006));
      const k =
        (0.5 + 0.25 * Math.sin(Math.PI * t)) * (1 - seg(merge, 0.92, 1)) +
        0.42 * pop;
      const R = mix(110, 70, t) + 90 * pop;
      if (k > 0.01) {
        ctx.restore();
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const c0 = [255, mix(232, 138, t), mix(170, 48, t)]
          .map(Math.round)
          .join(",");
        const c1 = [255, mix(246, 214, t), mix(222, 170, t)]
          .map(Math.round)
          .join(",");
        ctx.globalAlpha = layer;
        ctx.globalCompositeOperation = "lighter";
        glowAt(x, y, R, c0, 0.36 * k);
        glowAt(x, y, R * 0.34, c1, 0.46 * k);
        ctx.globalCompositeOperation = "source-over";
      }
    }

    // the light goes out and sends one impulse: a ring runs out from it, and the drawing follows it (the 3D layer)
    const pu = fl ? seg(p, S.pulse[0], S.pulse[1]) : 0;
    if (fl && pu > 0 && pu < 1) {
      ctx.restore();
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const e = out(pu),
        R = mix(8, Math.max(CW, CH) * 0.32, e),
        a = (1 - pu) * (1 - pu) * layer;
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 1;
      bandAt(fl[0], fl[1], R, 7, "255,184,112", 0.62 * a);
      bandAt(fl[0], fl[1], R * 0.93, 3.5, "255,250,240", 0.4 * a);
      bandAt(fl[0], fl[1], R * 0.82, 12, "187,228,255", 0.16 * a);
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
    ctx.globalAlpha = 1;
    softTop();
  }

  /* the 10 writes itself once the page is there */
  let introStarted = false;
  function startIntro() {
    if (introStarted) return;
    introStarted = true;
    if (cur.p > S.link[0]) {
      intro = 1;
      paint();
      return;
    }
    const t0 = performance.now(),
      D = 3600;
    const step = (now: number) => {
      intro = out(clamp((now - t0) / D));
      paint();
      if (intro < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  size();
  const ro = new ResizeObserver(() => {
    size();
    paint();
  });
  ro.observe(host);
  ro.observe(stage);
  void document.fonts?.ready.then(() => {
    lastKey = "";
    paint();
  });
  void ready.then(() => {
    // warm-up in one task (never shown): every kind of stroke, the light and the dive once, then the real frame
    const keep = cur.p;
    for (const q of [S.link[1], S.thinker[1], S.light[1], S.merge[1]]) {
      cur.p = q;
      lastKey = "";
      paint();
    }
    cur.p = keep;
    lastKey = "";
    paint();
  });
  return {
    ready,
    frame,
    startIntro,
    update(p: number, info: SketchInfo = {}) {
      cur.p = p;
      cur.flash = info.flash || null;
      cur.cam = info.cam || null;
      cur.area = info.area || null;
      paint();
    },
  };
}
