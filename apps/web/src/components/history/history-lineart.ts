// White line art in the manner of a pen sketch: one main line, ghost strokes that wander off it, contour echoes for
// shading, orbit lines and scan streaks. Everything here is plain point lists (dense polylines); the sketch layer turns
// them into Path2D objects and draws them with the scroll.

export type Pt = [number, number];
export type Poly = Pt[];
export type Rand = () => number;

export interface Bulb {
  cx: number;
  cy: number;
  r: number;
}

export interface ShadeFace {
  poly: Poly;
  ang: number;
  gap: number;
  light?: boolean;
}

export interface TenDrawing {
  line: Poly;
  depth: Poly[];
  shade: ShadeFace[];
  end: Pt;
}

export interface Thinker {
  box: [number, number, number, number];
  main: Poly;
  back: Poly;
  arm: Poly;
  jaw: Poly;
  ear: Poly;
  eye: Poly;
  brow: Poly;
  nostril: Poly;
  creases: Poly[];
  fold: Poly;
  table: Poly;
  hair: Poly[];
  shadeHead: Poly;
  shadeCheek: Poly;
  shadeArm: Poly;
  shadeBack: Poly;
  thought: Poly;
  bulb: Bulb;
}

export interface BulbLines {
  glass: Poly;
  neckL: Poly;
  neckR: Poly;
  threads: Poly[];
  tip: Poly;
  filament: Poly;
}

export const rng = (seed: number): Rand => {
  let s = seed >>> 0;
  return () =>
    (s = (Math.imul(s ^ (s >>> 15), 2246822519) + 0x9e3779b9) >>> 0) /
    4294967296;
};

/* ---------- polyline tools */
export function cr(pts: Poly, step = 3): Poly {
  // Catmull-Rom through the control points, sampled about every `step` units
  const out: Poly = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[i + 2] || p2;
    const n = Math.max(
      2,
      Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step),
    );
    for (let k = i ? 1 : 0; k <= n; k++) {
      const t = k / n,
        t2 = t * t,
        t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 *
        (2 * b +
          (-a + c) * t +
          (2 * a - 5 * b + 4 * c - d) * t2 +
          (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

export const len = (p: Poly): number => {
  let L = 0;
  for (let i = 1; i < p.length; i++)
    L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return L;
};

const normals = (p: Poly): Poly =>
  p.map((_, i): Pt => {
    const a = p[Math.max(0, i - 1)],
      b = p[Math.min(p.length - 1, i + 1)];
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  });

// low-frequency wobble across the line: a second pen pass that does not quite follow the first
export function wander(p: Poly, amp: number, r: Rand, waves = 3): Poly {
  const N = normals(p),
    L = len(p) || 1,
    ph = [r() * 6.28, r() * 6.28, r() * 6.28],
    f = [waves * (0.6 + r()), waves * (1.7 + r()), waves * 4.3];
  let acc = 0;
  return p.map((q, i): Pt => {
    if (i) acc += Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]);
    const t = (acc / L) * 6.283,
      o =
        amp *
        (0.55 * Math.sin(t * f[0] + ph[0]) +
          0.3 * Math.sin(t * f[1] + ph[1]) +
          0.15 * Math.sin(t * f[2] + ph[2]));
    return [q[0] + N[i][0] * o, q[1] + N[i][1] * o];
  });
}

export const offset = (p: Poly, d: number): Poly => {
  const N = normals(p);
  return p.map((q, i): Pt => [q[0] + N[i][0] * d, q[1] + N[i][1] * d]);
};

export function sub(p: Poly, t0: number, t1: number): Poly {
  const L = len(p),
    a = L * t0,
    b = L * t1,
    out: Poly = [];
  let acc = 0;
  for (let i = 0; i < p.length; i++) {
    if (i) acc += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (acc >= a && acc <= b) out.push(p[i]);
  }
  return out.length > 1 ? out : p.slice(0, 2);
}

// overshoot: the pen runs a little past both ends
export function extend(p: Poly, a: number, b = a): Poly {
  if (p.length < 2) return p;
  const s0 = p[0],
    s1 = p[1],
    e0 = p[p.length - 1],
    e1 = p[p.length - 2];
  const d0 = Math.hypot(s0[0] - s1[0], s0[1] - s1[1]) || 1,
    d1 = Math.hypot(e0[0] - e1[0], e0[1] - e1[1]) || 1;
  return [
    [s0[0] + ((s0[0] - s1[0]) / d0) * a, s0[1] + ((s0[1] - s1[1]) / d0) * a],
    ...p,
    [e0[0] + ((e0[0] - e1[0]) / d1) * b, e0[1] + ((e0[1] - e1[1]) / d1) * b],
  ];
}

export const ellipse = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rot = 0,
  a0 = 0,
  a1 = Math.PI * 2,
  step = 4,
): Poly => {
  const n = Math.max(
      8,
      Math.ceil((Math.abs(a1 - a0) * Math.max(rx, ry)) / step),
    ),
    c = Math.cos(rot),
    s = Math.sin(rot),
    out: Poly = [];
  for (let i = 0; i <= n; i++) {
    const t = a0 + ((a1 - a0) * i) / n,
      x = Math.cos(t) * rx,
      y = Math.sin(t) * ry;
    out.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return out;
};

// parallel hatching inside a closed outline (even-odd scanlines along `angle`)
export function hatch(
  outline: Poly,
  angle: number,
  gap: number,
  r: Rand,
  wob = 1,
): Poly[] {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  const rot = outline.map(([x, y]): Pt => [x * c + y * s, -x * s + y * c]);
  const ys = rot.map((q) => q[1]),
    out: Poly[] = [];
  for (
    let v = Math.min(...ys) + gap * 0.5;
    v < Math.max(...ys);
    v += gap * (0.8 + 0.4 * r())
  ) {
    const xs: number[] = [];
    for (let i = 0; i < rot.length; i++) {
      const a = rot[i],
        b = rot[(i + 1) % rot.length];
      if ((a[1] <= v && b[1] > v) || (b[1] <= v && a[1] > v))
        xs.push(a[0] + ((v - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
    xs.sort((m, n) => m - n);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const u0 = xs[k] + r() * gap * 0.8,
        u1 = xs[k + 1] - r() * gap * 0.8;
      if (u1 - u0 < 3) continue;
      const vv = v + (r() - 0.5) * wob;
      out.push([
        [u0 * c - vv * s, u0 * s + vv * c],
        [
          u1 * c - (vv + (r() - 0.5) * wob) * s,
          u1 * s + (vv + (r() - 0.5) * wob) * c,
        ],
      ]);
    }
  }
  return out;
}

/* ---------- the drawings, in their own units */

// The "10", drawn by hand with depth (world units, the stage's 600 x 480 box). Light from the upper left, so the
// depth falls to the lower right. One unbroken line: round the 1, a cursive join into the 0, round the 0, into
// its hole and out again; it ends where the story's line goes on. Then the depth: back edges, the strokes that join
// front and back, and hatched side faces. Slightly uneven on purpose: it is drawn, not constructed.
export function tenDrawing(r: Rand): TenDrawing {
  const D: Pt = [15, 11];
  const sh = (pts: Poly): Poly => pts.map(([x, y]): Pt => [x + D[0], y + D[1]]);
  const wob = (pts: Poly, a = 2.2): Poly =>
    pts.map(([x, y]): Pt => [x + (r() - 0.5) * a, y + (r() - 0.5) * a]);
  // an uneven oval: the same wobble for front and back, so the two stay parallel like a drawn solid
  const oval = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    rot: number,
  ) => {
    const p1 = r() * 6.28,
      p2 = r() * 6.28,
      c = Math.cos(rot),
      s2 = Math.sin(rot);
    const at = (t: number): Pt => {
      const k = 1 + 0.035 * Math.sin(2 * t + p1) + 0.022 * Math.sin(3 * t + p2),
        x = Math.cos(t) * rx * k,
        y = Math.sin(t) * ry * k;
      return [cx + x * c - y * s2, cy + x * s2 + y * c];
    };
    at.arc = (t0: number, t1: number, n = 28): Poly =>
      Array.from({ length: n + 1 }, (_, i) => at(t0 + ((t1 - t0) * i) / n));
    return at;
  };
  const O = oval(362, 200, 78, 116, 0.07),
    I = oval(366, 196, 31, 68, 0.1),
    PI = Math.PI;
  const one: Poly = [
    [240, 316],
    [214, 318],
    [188, 315],
    [189, 232],
    [190, 138],
    [170, 151],
    [151, 128],
    [176, 106],
    [200, 85],
    [220, 86],
    [238, 88],
    [239, 200],
    [240, 294],
  ];
  const line: Poly = [
    ...wob(one),
    [247, 310],
    [264, 316],
    [286, 304], // the cursive join into the 0
    ...O.arc(0.8 * PI, 2.84 * PI, 40), // round the 0, clockwise, a little past the start
    [318, 236], // across the face into the hole
    ...I.arc(1.0 * PI, 2.56 * PI, 24), // round the hole
    [394, 284],
    [420, 314],
    [446, 334], // out through the ring, on towards the story
  ];
  // depth: silhouettes where the outline runs along the depth direction
  const tO = [-1.13, 2.0],
    tI = [-1.27, 1.86];
  const depth: Poly[] = [
    sh([
      [238, 88],
      [239, 200],
      [240, 316],
    ]),
    sh([
      [188, 315],
      [214, 318],
      [240, 316],
    ]),
    sh([
      [170, 151],
      [190, 138],
    ]),
    [[238, 88], sh([[238, 88]])[0]],
    [[240, 316], sh([[240, 316]])[0]],
    [[188, 315], sh([[188, 315]])[0]],
    [[170, 151], sh([[170, 151]])[0]],
    sh(O.arc(tO[0], tO[1], 30)),
    [O(tO[0]), sh([O(tO[0])])[0]],
    [O(tO[1]), sh([O(tO[1])])[0]],
    sh(I.arc(tI[1], tI[0] + 2 * PI, 26)),
    [I(tI[1]), sh([I(tI[1])])[0]],
    [I(tI[0] + 2 * PI), sh([I(tI[0] + 2 * PI)])[0]],
  ];
  // shading: side faces (medium), the wall inside the hole (dark, dense), a light falloff on the front faces
  const face = (front: Poly, back: Poly): Poly => [
    ...front,
    ...back.slice().reverse(),
  ];
  const shade: ShadeFace[] = [
    {
      poly: face(
        [
          [238, 88],
          [240, 316],
        ],
        sh([
          [238, 88],
          [240, 316],
        ]),
      ),
      ang: 0.95,
      gap: 3.6,
    },
    {
      poly: face(
        [
          [188, 315],
          [240, 316],
        ],
        sh([
          [188, 315],
          [240, 316],
        ]),
      ),
      ang: 0.95,
      gap: 3.6,
    },
    {
      poly: face(
        [
          [170, 151],
          [190, 138],
        ],
        sh([
          [170, 151],
          [190, 138],
        ]),
      ),
      ang: 0.95,
      gap: 3.6,
    },
    {
      poly: face(O.arc(tO[0], tO[1], 30), sh(O.arc(tO[0], tO[1], 30))),
      ang: 0.95,
      gap: 3.8,
    },
    {
      poly: face(
        I.arc(tI[1], tI[0] + 2 * PI, 26),
        sh(I.arc(tI[1], tI[0] + 2 * PI, 26)),
      ),
      ang: -0.55,
      gap: 2.8,
    },
    {
      poly: [
        ...O.arc(-0.95, 1.9, 24),
        ...oval(362, 200, 64, 100, 0.07).arc(-0.95, 1.9, 24).reverse(),
      ],
      ang: 0.95,
      gap: 7,
      light: true,
    },
    {
      poly: [
        [226, 92],
        [238, 88],
        [240, 316],
        [228, 312],
      ],
      ang: 0.95,
      gap: 7,
      light: true,
    },
  ];
  return { line, depth, shade, end: line[line.length - 1] };
}

// A person deep in thought, facing left: chin resting on the fist, index finger along the cheek, elbow on the
// table, the other arm folded in front. One long line for the profile, hand and forearm; the pen lifts for the back,
// the ear, the closed eye, the hair and the folded arm. Local units: 400 x 560, crown near (262, 196).
export const THINKER: Thinker = {
  box: [0, 0, 400, 560],
  main: [
    [262, 196],
    [226, 206],
    [206, 228],
    [197, 252],
    [201, 262],
    [194, 270],
    [184, 286],
    [176, 298],
    [190, 303],
    [190, 310],
    [184, 316],
    [192, 322],
    [188, 329],
    [198, 335],
    [196, 348],
    [210, 357],
    // index finger up along the cheek and back
    [216, 346],
    [226, 326],
    [233, 314],
    [241, 318],
    [240, 336],
    [236, 352],
    // the curled fingers make one round front, then the wrist
    [228, 360],
    [216, 370],
    [210, 386],
    [214, 400],
    [230, 410],
    [252, 411],
    // forearm down to the elbow on the table, and up its back
    [258, 448],
    [265, 494],
    [270, 522],
    [300, 528],
    [298, 486],
    [288, 440],
    [276, 404],
    [266, 380],
    [252, 364],
    [244, 356],
  ],
  back: [
    [262, 196],
    [304, 205],
    [332, 230],
    [343, 264],
    [338, 298],
    [322, 326],
    [320, 352],
    [344, 374],
    [368, 410],
    [382, 466],
    [386, 536],
  ],
  arm: [
    [336, 384],
    [338, 430],
    [326, 480],
    [304, 526],
  ],
  jaw: [
    [246, 350],
    [266, 342],
    [284, 322],
  ],
  ear: [
    [286, 300],
    [292, 284],
    [304, 280],
    [310, 294],
    [306, 312],
    [294, 322],
    [288, 316],
  ],
  eye: [
    [206, 272],
    [214, 277],
    [224, 276],
  ],
  brow: [
    [202, 256],
    [214, 253],
    [228, 258],
  ],
  nostril: [
    [186, 296],
    [190, 300],
  ],
  creases: [
    [
      [216, 377],
      [228, 374],
      [236, 378],
    ],
    [
      [213, 391],
      [226, 390],
      [236, 394],
    ],
    [
      [238, 356],
      [246, 366],
      [248, 380],
    ],
  ],
  fold: [
    [300, 530],
    [250, 520],
    [190, 518],
    [150, 522],
    [128, 518],
    [118, 526],
    [136, 534],
    [200, 536],
    [290, 538],
  ],
  table: [
    [30, 544],
    [180, 540],
    [330, 546],
    [396, 542],
  ],
  hair: [
    [
      [268, 198],
      [300, 210],
      [322, 236],
      [330, 262],
    ],
    [
      [256, 200],
      [288, 216],
      [308, 244],
      [316, 274],
    ],
    [
      [244, 204],
      [272, 222],
      [292, 250],
      [298, 272],
    ],
    [
      [232, 208],
      [256, 220],
      [272, 240],
    ],
  ],
  // regions for shading (closed outlines)
  shadeHead: [
    [304, 212],
    [332, 236],
    [342, 270],
    [334, 304],
    [318, 326],
    [308, 316],
    [318, 290],
    [314, 258],
    [296, 228],
  ],
  shadeCheek: [
    [244, 300],
    [270, 296],
    [282, 318],
    [266, 338],
    [246, 344],
  ],
  shadeArm: [
    [262, 420],
    [268, 470],
    [276, 516],
    [296, 520],
    [292, 478],
    [282, 432],
    [272, 408],
  ],
  shadeBack: [
    [346, 384],
    [364, 414],
    [376, 466],
    [380, 526],
    [368, 520],
    [362, 470],
    [352, 420],
  ],
  // the thought leaves the back of the head (running along it first), spirals up and draws the bulb without lifting
  thought: [
    [300, 205],
    [284, 200],
    [270, 196],
    [258, 184],
    [260, 170],
    [274, 166],
    [280, 178],
    [268, 182],
    [260, 172],
    [263, 160],
    [262, 154],
  ],
  bulb: { cx: 262, cy: 80, r: 34 },
};

// The bulb in one line, from the tip at the bottom: up the left of the base, round the glass, down the right,
// back and forth over the thread, home to the tip. The filament is drawn separately, in warm light.
export function bulbLine(b: Bulb): Poly {
  const { cx, cy, r } = b,
    gap = 0.62,
    t0 = Math.PI / 2 + gap,
    t1 = Math.PI / 2 - gap + Math.PI * 2;
  const glass: Poly = [];
  for (let i = 0; i <= 30; i++) {
    const t = t0 + ((t1 - t0) * i) / 30;
    glass.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r * 1.04]);
  }
  const X = (u: number) => cx + u * r,
    Y = (v: number) => cy + v * r;
  return [
    [X(0), Y(2.04)],
    [X(-0.24), Y(1.94)],
    [X(-0.42), Y(1.72)],
    [X(-0.42), Y(1.42)],
    [X(-0.42), Y(1.18)],
    [X(-0.5), Y(0.98)],
    ...glass,
    [X(0.5), Y(0.98)],
    [X(0.42), Y(1.18)],
    [X(0.43), Y(1.34)],
    [X(-0.4), Y(1.42)],
    [X(0.43), Y(1.52)],
    [X(-0.4), Y(1.62)],
    [X(0.4), Y(1.74)],
    [X(0.22), Y(1.94)],
    [X(0), Y(2.04)],
    [X(-0.14), Y(2.0)],
  ];
}

export function bulbLines(b: Bulb): BulbLines {
  const { cx, cy, r } = b,
    gap = 0.62,
    top = Math.PI / 2;
  const glass = ellipse(
    cx,
    cy,
    r,
    r * 1.04,
    0,
    top + gap,
    top - gap + Math.PI * 2,
    3,
  );
  const ex = r * Math.sin(gap),
    ey = cy + r * 1.04 * Math.cos(gap);
  const neckL = cr([
    [cx - ex, ey],
    [cx - r * 0.42, cy + r * 1.16],
    [cx - r * 0.38, cy + r * 1.36],
  ]);
  const neckR = cr([
    [cx + ex, ey],
    [cx + r * 0.42, cy + r * 1.16],
    [cx + r * 0.38, cy + r * 1.36],
  ]);
  const threads = [0, 1, 2].map((k) =>
    cr([
      [cx - r * 0.44, cy + r * (1.42 + k * 0.17)],
      [cx, cy + r * (1.47 + k * 0.17)],
      [cx + r * 0.44, cy + r * (1.42 + k * 0.17)],
    ]),
  );
  const tip = cr([
    [cx - r * 0.2, cy + r * 1.96],
    [cx, cy + r * 2.06],
    [cx + r * 0.2, cy + r * 1.96],
  ]);
  const filament = cr(
    [
      [cx - r * 0.22, cy + r * 0.9],
      [cx - r * 0.2, cy + r * 0.2],
      [cx - r * 0.12, cy - r * 0.05],
      [cx - r * 0.04, cy + r * 0.12],
      [cx + r * 0.04, cy - r * 0.08],
      [cx + r * 0.12, cy + r * 0.1],
      [cx + r * 0.2, cy - r * 0.04],
      [cx + r * 0.22, cy + r * 0.9],
    ],
    2,
  );
  return { glass, neckL, neckR, threads, tip, filament };
}
