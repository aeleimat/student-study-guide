'use strict';
// The cytoskeleton and the cell surface (chapter 6, lessons 6–8): the book's element library for microtubules,
// microfilaments, intermediate filaments, motor proteins, centrosomes, cilia and flagella, muscle, amoeboid movement,
// cytoplasmic streaming, plant cell walls, the extracellular matrix and cell junctions. Loaded after engine.js,
// water.js, macro.js and cell.js (it uses CC's colours when cell.js defines them, its own otherwise). Every piece is
// drawn around its own origin with { x, y, s, o } (most also take r, a rotation in degrees) and placed with put; each
// animated piece has a set-style method that poses everything from its arguments alone (call it from prog(k => …) or
// clockRun(t => …)), so replay and seek draw the same frame. Attributes are written only when they change; no filters.
// Methods that skip a redraw when nothing changed first round their argument to a fixed step and then draw from that
// rounded value (k to 1/4000, centrosome 1/1000, axoneme 1/2000, microtubule m to 1/400 dimer, t to 1/120 s, a cilium's
// q to 1/1000), so the picture is a pure function of the argument; rounding it yourself first gives the same picture.
//
// Exports (all lengths at s = 1; nm = pixels per nanometre, default 3; "parent" = the coordinates of the group you passed):
//   YC                                   chapter 6 cytoskeleton/surface colours (mt mtB actin inter motor myosin atp vesicle
//                                        cargo membrane cyto wall wall2 lamella collagen fibronectin integrin proteoglycan …)
//   yRamp(k, a, b) / yBump(k, a, b) / yFrac(v)   0→1 between a and b / a 0→1→0 hump / the fractional part
//   yTag(p, str, [ax, ay], [lx, ly], {size=24, fill, line, o, anchor})  a label at (lx, ly) with a leader line to the
//       point (ax, ay) it names ('\n' for two lines); anchor defaults from the side. .text .line
//   yArrow(p, [x1, y1], [x2, y2], {color, w, head, o})   a plain straight arrow
//   yOut(g, [lx, ly])                    a point in g's frame → g's parent (translate, rotate, scale)
//
//   microtubule(p, {x, y, s, o, r, len=600, nm, ends, section, dim}) a hollow tube of α/β tubulin dimers (light α, dark
//       β; 25 nm across = 75 px), minus end at the origin, growing along +x. .grow(k) k 0..1 of the length built
//       (the newest dimer arrives at the + end); .shrink(k) k 0..1 taken apart from the + end (the last dimer peels
//       off); .set(m) m dimers. ends: true shows − and + chips (.minus .plus). .D, .N dimers, .dp px per dimer,
//       .pt('minus'|'plus'|'mid') in parent. section: true draws the cross-section instead: a ring of 13 protofilaments
//       round a hollow centre (origin at its centre; dim: true adds the 25 nm dimension).
//   microfilament(p, {x, y, s, o, r, len=600, nm, color, dark}) a twisted double chain of actin beads (7 nm), from the
//       origin along +x; .grow(k) shows the first k of the beads. .D
//   intermediateFilament(p, {x, y, s, o, r, len=600, nm, strands=4}) a gold rope of coiled fibres (10 nm), from the
//       origin along +x; .grow(k). .D
//   fiberCompare(p, {x, y, s, o, len=520, nm, gap=150, labels=true}) the three side by side, centred on the origin,
//       thick (microtubule, 25 nm) / middle (intermediate filament, 8–12 nm) / thin (microfilament, 7 nm), top to
//       bottom, names on the left, diameters on the right. .mt .inter .mf, .names[3] .subs[3] .sizes[3] (groups to fade)
//   motorProtein(p, {x, y, s, o, len=760, steps=10, nm, cargo=true}) a vesicle carried on a two-footed motor protein
//       along a microtubule (the "monorail"), centred on the origin, track along y = 0, walking toward + (right).
//       .walk(k) k 0..1 of the trip: one step per 1/steps, the trailing foot swings past the leading one, an ATP
//       spark at each step. .track (a microtubule), .vesicle .motor .atp, .pt('vesicle'|'motor'|'track'|'atp') in parent
//   centriole(p, {x, y, s, o, r, R=46, view='end'|'side', cartwheel=false, len=120}) end view: nine triplets of
//       microtubules in a ring (cartwheel: spokes to a hub); side view: a barrel along x. .R
//   basalBody(p, {…centriole}) a centriole end view with its cartwheel (the base of a cilium or flagellum)
//   centrosome(p, {x, y, s, o, n=16, L=260}) a soft matrix with a pair of centrioles at right angles (one end on, one
//       side on) and n microtubules radiating; .radiate(k) grows them out (staggered). .pair [end, side], .rays,
//       .matrix, .pt('centrosome'|'centriole'|'ray') in parent
//   axoneme(p, {x, y, s, o, R=150}) the 9 + 2 cross-section of a cilium or flagellum: membrane, nine doublets, central
//       pair, radial spokes, dynein arms, cross-linking proteins. .flick(k) the dynein arms swing (k 0..1 = 3 swings).
//       Groups .membrane .doublets .central .spokes .dyneins .links; .pt('membrane'|'doublet'|'central'|'spoke'|
//       'dynein'|'link', i) in parent (i = which doublet, default 1, the upper right)
//   dyneinWalk(p, {x, y, s, o, len=620, gap=70, n=5, linked=false, slide=110, cycles=3}) side view of two doublets,
//       the lower one's dynein arms reaching the upper one, left end at the origin. .walk(k, linked) the arms grab,
//       pull and let go (cycles times over k 0..1); not linked, the upper doublet slides right by k·slide; linked
//       (pink cross-links shown, the base held), the pair bends upward instead. .arms .links .top .bottom .base
//   flagellumSwim(p, {x, y, s, o, len=420, amp=36, wl=220, period=.8, speed=60}) a sperm-like cell, head at the origin
//       facing +x, its flagellum behind it. .beat(t) t seconds: a wave runs from base to tip, the cell swims +x at
//       speed px/s (0: stays put). .tail .head, .swimArrow .waveArrow (o 0)
//   ciliumBeat(p, {x, y, s, o, len=150, period=1.2, phase=0, w=12}) one cilium standing up from its base at the origin;
//       .beat(t) power stroke (stiff, sweeping +x) then recovery stroke (bent, swept back low); .pose(q) q 0..1 of a
//       cycle; .phase(t) 'power'|'recovery'
//   ciliaRow(p, {x, y, s, o, n=9, w=640, len=130, period=1.2, wave=.1, dots=true}) a cell surface (top at y = 0) with
//       n cilia; .beat(t) each lags wave of a cycle behind its left neighbour (a metachronal wave), fluid dots drift +x.
//       .cilia[], .surface, .dots
//   muscleUnit(p, {x, y, s, o, w=720, h=260, cycles=3}) actin filaments fixed to two end plates, with myosin filaments
//       between them; .contract(k) the myosin heads pull (cycles strokes) and the unit shortens (each end moves in
//       0.17·w at k = 1). .actins[] .myosins[] .heads[] .plates, .pt('actin'|'myosin'|'head'|'plate') in parent
//   amoebaCrawl(p, {x, y, s, o, R=140, cycles=2}) an amoeba facing +x: outer cortex (gel, actin network), inner fluid
//       (sol) and a nucleus. .crawl(k) k 0..1: a pseudopodium bulges forward, fluid streams into it, the body follows
//       (cycles times; it ends 0.55·R·cycles to the right). .pt('cortex'|'inner'|'pseudopod'|'nucleus') in parent
//   cytoStreaming(p, {x, y, s, o, w=620, h=380, n=14, speed=60, actin=true}) a plant cell (wall, membrane, central
//       vacuole) whose chloroplasts ride a clockwise loop of cytoplasm; .flow(t) t seconds. .chloros[] .vacuole .track
//       .pt('wall'|'vacuole'|'cytoplasm'|'chloroplast', i=0, t) in parent at the cell's current pose (place and scale
//       the cell first); for 'chloroplast', chloroplast i on the track at flow time t (default: the last flow drawn)
//   plantWalls(p, {x, y, s, o, w=760, h=420, n=3, secondary=true}) a close-up of two neighbouring plant cells sharing a
//       wall (middle lamella, primary walls, secondary walls, plasma membranes), with n plasmodesmata through it (n 0:
//       a closed wall); .pass(k) small molecules cross from the left cell to the right through the channels (n 0: none).
//       .pt('lamella'|'primary'|'secondary'|'membrane'|'plasmodesma'|'cytoplasm', side=1) in parent (side −1 = left)
//   ecmScene(p, {x, y, s, o, w=1000, h=560, labels=false}) membrane along y = 0 (extracellular fluid above, cytoplasm
//       below), integrins spanning it, microfilaments inside bound to them, fibronectin from integrin to collagen,
//       collagen fibres and proteoglycan complexes (bottle brushes) outside. .build(k) reveals membrane, integrins,
//       microfilaments, fibronectin, collagen, proteoglycans in turn. .parts {membrane, integrins, filaments,
//       fibronectin, collagen, proteoglycans}, .pt(part) in parent; labels: true adds the names (.labels)
//   cellJunction(p, {kind='tight'|'desmosome'|'gap', x, y, s, o, w=600, h=480}) two neighbouring cells (left and right)
//       with their membranes running down the middle. tight: seam proteins stitch the membranes; .leak(k) fluid dots
//       come down between the cells and stop at the seal (a ✕ shows). desmosome: plaques riveted across the gap with
//       intermediate filaments fanning into both cells; .pull(k) the cells tug apart a little and hold. gap: channel
//       proteins line up across both membranes; .pass(k) small molecules cross from left to right.
//       .pt('membrane'|'space'|'junction'|'filaments'|'channel', side) in parent

const yCC = k => (typeof CC === 'object' && CC && typeof CC[k] === 'string') ? CC[k] : null;
const YC = {
  mt: '#8fd6b0', mtB: '#5fae8c', mtEdge: '#3d7a60', lumen: '#0a1626',
  actin: '#ff7aa8', actinDk: '#c9557f', inter: '#f3c95c', interDk: '#b08a2e',
  motor: '#a8c66c', motorEdge: '#6f8a3d', myosin: '#bba8ee', myosinEdge: '#8a74cf',
  atp: '#ffd27a', vesicle: yCC('vesicle') || '#a8e0ea', cargo: yCC('cargo') || '#f07a6a',
  membrane: yCC('membrane') || '#8fb0d6', cyto: yCC('cyto') || '#183457', cytoLt: '#21426b',
  env: '#5b82b8', nucleo: '#122844', dna: '#e9dcc0',
  wall: yCC('wall') || '#c9b27a', wall2: '#9e854c', lamella: '#efe3bf',
  collagen: '#f0b45a', collagenDk: '#b87f2e', fibronectin: '#8fd6b0', integrin: '#6c8cff', integrinDk: '#3f58c4',
  proteoglycan: '#bba8ee', chloro: '#5bbf5b', chloroDk: '#2f8f46', vacuole: '#3a6ea5',
  spoke: '#86c9e8', link: '#e8a0c8', seam: '#c58cf0', connexon: '#bba8ee', fluid: '#5fd3e8', ink: '#14233a',
  plate: '#9fb0c6',
};
const yClamp = v => Math.max(0, Math.min(1, v));
const yRamp = (k, a, b) => yClamp((k - a) / (b - a));
const yBump = (k, a, b) => { const u = (k - a) / (b - a); return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u); };
const yLerp = (a, b, k) => a + (b - a) * k;
const yFrac = v => v - Math.floor(v);
const yR1 = v => Math.round(v * 10) / 10;
const yF = v => v.toFixed(1);
const yRad = d => d * Math.PI / 180;
const yCirc = (cx, cy, r) => `M${yF(cx - r)} ${yF(cy)}a${yF(r)} ${yF(r)} 0 1 0 ${yF(2 * r)} 0a${yF(r)} ${yF(r)} 0 1 0 ${yF(-2 * r)} 0Z`;
const yLine = (pts, close = false) => 'M' + pts.map(([a, b]) => yF(a) + ' ' + yF(b)).join('L') + (close ? 'Z' : '');
// a smooth curve through points (Catmull-Rom as cubic Béziers), closed or open
function ySmooth(pts, close = false) {
  const n = pts.length, P = i => close ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${yF(pts[0][0])} ${yF(pts[0][1])}`;
  for (let i = 0; i < (close ? n : n - 1); i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    d += `C${yF(p1[0] + (p2[0] - p0[0]) / 6)} ${yF(p1[1] + (p2[1] - p0[1]) / 6)} ${yF(p2[0] - (p3[0] - p1[0]) / 6)} ${yF(p2[1] - (p3[1] - p1[1]) / 6)} ${yF(p2[0])} ${yF(p2[1])}`;
  }
  return d + (close ? 'Z' : '');
}
function yD(e, d) { if (e._d !== d) e.setAttribute('d', e._d = d); return e; }
function yAt(e, k, v) { const key = '_y_' + k; if (e[key] !== v) { e.setAttribute(k, v); e[key] = v; } return e; }
// pose x, y (and o, r) only when they change
function yPose(e, x, y, o, r) {
  const s = st(e), nv = {}, X1 = yR1(x), Y1 = yR1(y);
  let ch = false;
  if (s.x !== X1) { nv.x = X1; ch = true; }
  if (s.y !== Y1) { nv.y = Y1; ch = true; }
  if (o !== undefined) { const O1 = Math.round(o * 1000) / 1000; if (s.o !== O1) { nv.o = O1; ch = true; } }
  if (r !== undefined) { const R1 = yR1(r); if (s.r !== R1) { nv.r = R1; ch = true; } }
  if (ch) put(e, nv);
  return e;
}
function yO(e, o) { const O1 = Math.round(o * 1000) / 1000; if (st(e).o !== O1) put(e, { o: O1 }); return e; }
function yS(e, sc) { const S1 = Math.round(sc * 1000) / 1000; if (st(e).s !== S1) put(e, { s: S1 }); return e; }
function yOut(g, [lx, ly]) {
  const { x, y, s, r } = st(g), c = Math.cos(yRad(r || 0)), n = Math.sin(yRad(r || 0));
  return [x + s * (lx * c - ly * n), y + s * (lx * n + ly * c)];
}
function yText(p, str, { x = 0, y = 0, size = 24, fill = COL.chalk, anchor = 'middle', weight = 600, o = 1 } = {}) {
  return T(p, str, { x, y, size, fill, anchor, weight, o });
}
function yArrow(p, [x1, y1], [x2, y2], { color = COL.chalk, w = 6, head = 18, o = 1 } = {}) {
  const g = G(p, { o }), L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
  path(g, `M${x1} ${y1}L${yF(x2 - ux * head * .8)} ${yF(y2 - uy * head * .8)}`, { stroke: color, 'stroke-width': w });
  path(g, `M${yF(x2 - ux * head - uy * head * .7)} ${yF(y2 - uy * head + ux * head * .7)}L${x2} ${y2}L${yF(x2 - ux * head + uy * head * .7)} ${yF(y2 - uy * head - ux * head * .7)}Z`, { fill: color, stroke: color, 'stroke-width': 2 });
  return g;
}
function yTag(p, str, [ax, ay], [lx, ly], { size = 24, fill = COL.chalk, line = COL.dim, o = 1, anchor, weight = 600 } = {}) {
  const g = G(p, { o }), an = anchor ?? (lx < ax - 2 ? 'end' : lx > ax + 2 ? 'start' : 'middle');
  const lines = String(str).split('\n'), lh = size * 1.15;
  const lineEl = path(g, `M${yF(ax)} ${yF(ay)}L${yF(lx)} ${yF(ly)}`, { stroke: line, 'stroke-width': 2.5 });
  mk('circle', { cx: ax, cy: ay, r: 4, fill: line }, g);
  const tx = lx + (an === 'end' ? -8 : an === 'start' ? 8 : 0);
  const top = an === 'middle' ? (ly <= ay ? ly - 8 - (lines.length - 1) * lh - size * .2 : ly + size * .95) : ly + size * .35 - (lines.length - 1) * lh / 2;
  const texts = lines.map((s, i) => yText(g, s, { x: tx, y: top + i * lh, size, fill, anchor: an, weight }));
  return Object.assign(g, { text: texts[0], texts, line: lineEl });
}

/* ---------- microtubule: a hollow tube of tubulin dimers ---------- */
function microtubule(p, { x = 0, y = 0, s = 1, o = 1, r = 0, len = 600, nm = 3, ends = false, section = false, dim = false } = {}) {
  const D = 25 * nm, g = G(p, { x, y, s, o, r });
  if (section) {
    const b = (Math.PI * D / 26) / (1 + Math.PI / 13), rr = D / 2 - b;
    mk('circle', { r: rr, fill: YC.lumen }, g);
    let da = '', db = '';
    for (let i = 0; i < 13; i++) { const a = yRad(-90 + i * 360 / 13), c = yCirc(rr * Math.cos(a), rr * Math.sin(a), b); if (i % 2) db += c; else da += c; }
    path(g, da, { fill: YC.mt, stroke: YC.mtEdge, 'stroke-width': 1.5 });
    path(g, db, { fill: YC.mtB, stroke: YC.mtEdge, 'stroke-width': 1.5 });
    if (dim) {
      path(g, `M${-D / 2} ${-D / 2 - 16}H${D / 2}M${-D / 2} ${-D / 2 - 24}V${-D / 2 - 8}M${D / 2} ${-D / 2 - 24}V${-D / 2 - 8}`, { stroke: COL.chalk, 'stroke-width': 2.5 });
      yText(g, '25 nm', { y: -D / 2 - 30, size: 22 });
    }
    return Object.assign(g, { D, section: true, grow() { return g; }, shrink() { return g; }, set() { return g; } });
  }
  const nr = 6, pitch = 4 * nm, dp = 2 * pitch, N = Math.max(1, Math.floor(len / dp)), b = pitch * .56;
  const rowY = j => -(D / 2 - b) * Math.cos(Math.PI * (j + .5) / nr);
  const band = mk('rect', { x: 0, y: -D / 2 + 2, width: N * dp, height: D - 4, rx: 6, fill: YC.mtEdge }, g);
  const colL = G(g), cols = [];
  for (let i = 0; i < N; i++) {
    const c = G(colL, { x: i * dp });
    let da = '', db = '';
    for (let j = 0; j < nr; j++) { const off = (j * nm * .9) % pitch; da += yCirc(pitch * .5 + off, rowY(j), b); db += yCirc(pitch * 1.5 + off, rowY(j), b); }
    path(c, da, { fill: YC.mt, stroke: YC.mtEdge, 'stroke-width': 1.2 });
    path(c, db, { fill: YC.mtB, stroke: YC.mtEdge, 'stroke-width': 1.2 });
    cols.push(c);
  }
  // the open + end: the hollow centre shows
  const cap = G(g);
  mk('ellipse', { rx: D * .16, ry: D / 2 - 1, fill: YC.mtB, stroke: YC.mtEdge, 'stroke-width': 1.5 }, cap);
  mk('ellipse', { rx: D * .09, ry: D / 2 - b * 1.6, fill: YC.lumen }, cap);
  const minus = G(g, { x: -30, o: ends ? 1 : 0 }), plus = G(g, { o: ends ? 1 : 0 });
  yText(minus, '−', { y: 13, size: 40, weight: 800 }); yText(plus, '+', { y: 13, size: 40, weight: 800 });
  let cur = -1;
  const mt = Object.assign(g, {
    D, N, dp, cols, band, cap, minus, plus, m: N,
    set(m, mode = 'grow') {
      m = Math.round(Math.max(0, Math.min(N, m)) * 400) / 400; const key = m + mode; if (key === cur) return mt; cur = key; mt.m = m;
      const full = Math.floor(m), f = m - full, u = 1 - f;
      cols.forEach((c, i) => {
        if (i < full) yPose(c, i * dp, 0, 1);
        else if (i === full && f > 0) {
          if (mode === 'shrink') yPose(c, i * dp + 22 * u, 46 * u * u + 10 * u, f);
          else yPose(c, i * dp + 60 * u, -46 * u, f);
        } else yPose(c, i * dp, 0, 0);
      });
      const end = mode === 'shrink' ? (full + f) * dp : full * dp + (f > 0 ? f * dp : 0);
      yAt(band, 'width', yR1(Math.max(0, end - 2)));
      yPose(cap, Math.max(0, end), 0, end > 0 ? 1 : 0);
      yPose(plus, end + 30, 0);
      return mt;
    },
    grow(k) { return mt.set(yClamp(k) * N, 'grow'); },
    shrink(k) { return mt.set((1 - yClamp(k)) * N, 'shrink'); },
    pt(key = 'plus') { return yOut(g, key === 'minus' ? [0, 0] : key === 'mid' ? [mt.m * dp / 2, 0] : [mt.m * dp, 0]); },
  });
  return mt.set(N);
}

/* ---------- microfilament: a twisted double chain of actin ---------- */
function microfilament(p, { x = 0, y = 0, s = 1, o = 1, r = 0, len = 600, nm = 3, color = YC.actin, dark = YC.actinDk } = {}) {
  const D = 7 * nm, br = D * .3, amp = D / 2 - br, pitch = 5.5 * nm, half = 37 * nm, g = G(p, { x, y, s, o, r });
  const beads = [];
  for (const k of [0, 1]) for (let xx = br + k * pitch / 2; xx <= len - br; xx += pitch) {
    const ph = Math.PI * xx / half + k * Math.PI;
    beads.push({ x: xx, y: amp * Math.cos(ph), front: Math.sin(ph) >= 0 });
  }
  beads.sort((a, b) => a.x - b.x);
  const back = path(g, '', { fill: dark }), front = path(g, '', { fill: color, stroke: dark, 'stroke-width': 1 });
  let cur = -1;
  const mf = Object.assign(g, {
    D, len, beads,
    grow(k) {
      const c = Math.round(yClamp(k) * beads.length); if (c === cur) return mf; cur = c;
      let db = '', df = '';
      for (let i = 0; i < c; i++) { const bd = beads[i], cc = yCirc(bd.x, bd.y, br); if (bd.front) df += cc; else db += cc; }
      yD(back, db); yD(front, df);
      return mf;
    },
  });
  return mf.grow(1);
}

/* ---------- intermediateFilament: a rope of coiled fibres ---------- */
function intermediateFilament(p, { x = 0, y = 0, s = 1, o = 1, r = 0, len = 600, nm = 3, strands = 4 } = {}) {
  const D = 10 * nm, sw = D * .34, amp = D / 2 - sw / 2, period = D * 3.4, dx = 3, g = G(p, { x, y, s, o, r });
  const back = path(g, '', { stroke: YC.interDk, 'stroke-width': sw }), front = path(g, '', { stroke: YC.inter, 'stroke-width': sw });
  const edge = path(g, '', { stroke: '#fff3c4', 'stroke-width': sw * .22, 'stroke-opacity': .55 });
  let cur = -1;
  const inter = Object.assign(g, {
    D, len,
    grow(k) {
      const xe = Math.round(yClamp(k) * len / dx) * dx; if (xe === cur) return inter; cur = xe;
      let db = '', df = '', de = '';
      for (let i = 0; i < strands; i++) {
        let cls = null;
        for (let xx = 0; xx < xe; xx += dx) {
          const x2 = Math.min(xe, xx + dx), ph = u => 2 * Math.PI * u / period + i * 2 * Math.PI / strands;
          const y1 = amp * Math.cos(ph(xx)), y2 = amp * Math.cos(ph(x2)), c = Math.sin(ph((xx + x2) / 2)) >= 0 ? 'f' : 'b';
          const seg = `M${xx} ${yF(y1)}L${x2} ${yF(y2)}`;
          if (c === 'f') { df += seg; de += `M${xx} ${yF(y1 - sw * .22)}L${x2} ${yF(y2 - sw * .22)}`; } else db += seg;
          cls = c;
        }
      }
      yD(back, db); yD(front, df); yD(edge, de);
      return inter;
    },
  });
  return inter.grow(1);
}

/* ---------- fiberCompare: the three fibres side by side ---------- */
function fiberCompare(p, { x = 0, y = 0, s = 1, o = 1, len = 520, nm = 3, gap = 150, labels = true } = {}) {
  const g = G(p, { x, y, s, o }), X0 = -len / 2;
  const mt = microtubule(g, { x: X0, y: -gap, len, nm });
  const inter = intermediateFilament(g, { x: X0, y: 0, len, nm });
  const mf = microfilament(g, { x: X0, y: gap, len, nm });
  const rows = [[mt, 'Microtubule', 'tubulin', '25 nm', YC.mt], [inter, 'Intermediate filament', 'keratin and others', '8–12 nm', YC.inter], [mf, 'Microfilament', 'actin', '7 nm', YC.actin]];
  const names = [], subs = [], sizes = [];
  rows.forEach(([f, nm1, sub, size, col], i) => {
    const yy = (i - 1) * gap, nG = G(g, { o: labels ? 1 : 0 }), sG = G(g, { o: labels ? 1 : 0 }), zG = G(g, { o: labels ? 1 : 0 });
    yText(nG, nm1, { x: X0 - 26, y: yy - 2, size: 28, fill: col, anchor: 'end', weight: 700 });
    yText(sG, sub, { x: X0 - 26, y: yy + 28, size: 21, fill: COL.dim, anchor: 'end', weight: 500 });
    const h = f.D / 2, bx = -X0 + 22;
    path(zG, `M${bx} ${yy - h}V${yy + h}M${bx - 7} ${yy - h}H${bx + 7}M${bx - 7} ${yy + h}H${bx + 7}`, { stroke: COL.chalk, 'stroke-width': 2.5 });
    yText(zG, size, { x: bx + 18, y: yy + 9, size: 26, anchor: 'start', weight: 700 });
    names.push(nG); subs.push(sG); sizes.push(zG);
  });
  return Object.assign(g, { mt, inter, mf, names, subs, sizes });
}

/* ---------- motorProtein: a vesicle walked along a microtubule ---------- */
function motorProtein(p, { x = 0, y = 0, s = 1, o = 1, len = 760, steps = 8, nm = 3, cargo = true } = {}) {
  const g = G(p, { x, y, s, o }), track = microtubule(g, { x: -len / 2, len, nm }), D = track.D;
  const fy = -D / 2 - 9, hipH = 84, x0 = -len / 2 + 70, h = (len - 140) / (steps + 1), VR = 54;
  const motor = G(g), legs = path(motor, '', { stroke: YC.motorEdge, 'stroke-width': 9 });
  const legsHi = path(motor, '', { stroke: YC.motor, 'stroke-width': 5 });
  const stalk = path(motor, '', { stroke: YC.motor, 'stroke-width': 7 });
  const foot = () => { const f = G(motor); mk('ellipse', { rx: 17, ry: 11, fill: YC.motor, stroke: YC.motorEdge, 'stroke-width': 3 }, f); return f; };
  const fA = foot(), fB = foot();
  const vesicle = G(g);
  mk('circle', { r: VR, fill: YC.vesicle, 'fill-opacity': .18, stroke: YC.vesicle, 'stroke-width': 5 }, vesicle);
  if (cargo) path(vesicle, [[-18, -14], [14, -20], [0, 10], [-22, 16], [22, 12]].map(([a, b]) => yCirc(a, b, 8)).join(''), { fill: YC.cargo });
  const atp = G(g, { o: 0 });
  path(atp, 'M0 -16L4 -4L16 0L4 4L0 16L-4 4L-16 0L-4 -4Z', { fill: YC.atp });
  yText(atp, 'ATP', { y: -22, size: 20, fill: YC.atp, weight: 800 });
  let cur = -1, hip = [0, 0];
  const mp = Object.assign(g, {
    track, motor, vesicle, atp, feet: [fA, fB],
    walk(k) {
      k = Math.round(yClamp(k) * 4000) / 4000; const key = k; if (key === cur) return mp; cur = key;
      const u = k * steps, j = Math.min(steps - 1, Math.floor(u)), f = k >= 1 ? 1 : u - j, e = io(yRamp(f, .15, .85));
      const still = x0 + (j + 1) * h, mv = yLerp(x0 + j * h, x0 + (j + 2) * h, e), lift = 34 * Math.sin(Math.PI * e);
      const moving = j % 2 ? fB : fA, standing = j % 2 ? fA : fB;
      yPose(standing, still, fy, 1, 0); yPose(moving, mv, fy - lift, 1, -14 * Math.sin(Math.PI * e));
      const hx = (still + mv) / 2, hy = fy - hipH + 6 * Math.sin(Math.PI * e);
      hip = [hx, hy];
      const leg = (fx, fy2) => { const mx = (fx + hx) / 2 + (fx < hx ? -10 : 10), my = (fy2 + hy) / 2; return `M${yF(fx)} ${yF(fy2 - 6)}Q${yF(mx)} ${yF(my)} ${yF(hx)} ${yF(hy)}`; };
      const d = leg(still, fy) + leg(mv, fy - lift);
      yD(legs, d); yD(legsHi, d);
      yD(stalk, `M${yF(hx)} ${yF(hy)}L${yF(hx)} ${yF(hy - 46)}`);
      yPose(vesicle, hx, hy - 46 - VR + 4);
      yPose(atp, x0 + j * h - 8, fy - 46, k >= 1 ? 0 : yBump(f, 0, .4));
      return mp;
    },
    pt(key = 'vesicle') {
      if (key === 'vesicle') return yOut(g, [st(vesicle).x, st(vesicle).y]);
      if (key === 'motor') return yOut(g, hip);
      if (key === 'atp') return yOut(g, [st(atp).x, st(atp).y]);
      return yOut(g, [len * .3, 0]);
    },
  });
  return mp.walk(0);
}

/* ---------- centriole and basal body: nine triplets ---------- */
function centriole(p, { x = 0, y = 0, s = 1, o = 1, r = 0, R = 46, view = 'end', cartwheel = false, len = 120 } = {}) {
  const g = G(p, { x, y, s, o, r }), rt = R * .17;
  if (view === 'side') {
    const H = R * 1.7;
    mk('rect', { x: -len / 2, y: -H / 2, width: len, height: H, rx: 10, fill: YC.mtEdge, stroke: YC.mt, 'stroke-width': 3 }, g);
    let d = '';
    for (let i = 1; i < 6; i++) { const yy = -H / 2 + i * H / 6; d += `M${-len / 2 + 6} ${yF(yy)}H${len / 2 - 6}`; }
    path(g, d, { stroke: YC.mt, 'stroke-width': 5 });
    return Object.assign(g, { R, view });
  }
  let tub = '', lum = '', spk = '', band = '';
  for (let i = 0; i < 9; i++) {
    const a = yRad(-90 + i * 40), cx = R * Math.cos(a), cy = R * Math.sin(a), dir = a + yRad(90 - 38);
    for (let t = -1; t <= 1; t++) { const px = cx + t * rt * 1.7 * Math.cos(dir), py = cy + t * rt * 1.7 * Math.sin(dir); tub += yCirc(px, py, rt); lum += yCirc(px, py, rt * .38); }
    const ix = cx - rt * 1.7 * Math.cos(dir), iy = cy - rt * 1.7 * Math.sin(dir);
    band += `M${yF(ix)} ${yF(iy)}L${yF(cx + rt * 1.7 * Math.cos(dir))} ${yF(cy + rt * 1.7 * Math.sin(dir))}`;
    spk += `M0 0L${yF(ix * .82)} ${yF(iy * .82)}`;
  }
  if (cartwheel) { path(g, spk, { stroke: YC.spoke, 'stroke-width': 3 }); mk('circle', { r: R * .13, fill: 'none', stroke: YC.spoke, 'stroke-width': 3 }, g); }
  path(g, band, { stroke: YC.mtB, 'stroke-width': rt * 1.6 });
  path(g, tub, { fill: YC.mt, stroke: YC.mtEdge, 'stroke-width': Math.max(1, R * .03) });
  path(g, lum, { fill: YC.lumen });
  return Object.assign(g, { R, view });
}
function basalBody(p, opts = {}) { return centriole(p, { R: 60, ...opts, view: 'end', cartwheel: true }); }

function centrosome(p, { x = 0, y = 0, s = 1, o = 1, n = 16, L = 260 } = {}) {
  const g = G(p, { x, y, s, o }), rayL = G(g), rays = [];
  const matrix = mk('circle', { r: 96, fill: YC.mt, 'fill-opacity': .13, stroke: YC.mt, 'stroke-opacity': .5, 'stroke-width': 2, 'stroke-dasharray': '6 8' }, g);
  for (let i = 0; i < n; i++) {
    const a = yRad(i * 360 / n + 9 * Math.sin(i * 2.3)), l = L * (.72 + .28 * yFrac(Math.sin(i * 12.9898) * 43758.5)), r0 = 70;
    const d = `M${yF(r0 * Math.cos(a))} ${yF(r0 * Math.sin(a))}L${yF((r0 + l) * Math.cos(a))} ${yF((r0 + l) * Math.sin(a))}`;
    const rg = G(rayL);
    const outer = path(rg, d, { stroke: YC.mt, 'stroke-width': 13, 'stroke-linecap': 'butt' }, { d: 1 });
    const inner = path(rg, d, { stroke: YC.mtEdge, 'stroke-width': 4, 'stroke-linecap': 'butt' }, { d: 1 });
    rays.push({ rg, outer, inner, a, l, r0 });
  }
  const end = centriole(g, { x: -34, y: 12, R: 36 }), side = centriole(g, { x: 40, y: -6, R: 26, view: 'side', len: 84, r: 90 });
  let cur = -1;
  const cs = Object.assign(g, {
    rays, pair: [end, side], matrix,
    radiate(k) {
      k = Math.round(yClamp(k) * 1000) / 1000; const key = k; if (key === cur) return cs; cur = key;
      rays.forEach(({ outer, inner }, i) => {
        const v = Math.round(yRamp(k, i * .3 / n, i * .3 / n + .7) * 1000) / 1000;
        if (st(outer).d !== v) { put(outer, { d: v }); put(inner, { d: v }); }
      });
      return cs;
    },
    pt(key = 'centrosome') {
      if (key === 'centriole') return yOut(g, [-34, 12]);
      if (key === 'ray') { const { a, l, r0 } = rays[1]; return yOut(g, [(r0 + l * .7) * Math.cos(a), (r0 + l * .7) * Math.sin(a)]); }
      return yOut(g, [0, 0]);
    },
  });
  return cs.radiate(1);
}

/* ---------- axoneme: the 9 + 2 cross-section ---------- */
function axoneme(p, { x = 0, y = 0, s = 1, o = 1, R = 150 } = {}) {
  const g = G(p, { x, y, s, o }), Rd = R * .72, a = R * .085;
  const membrane = G(g);
  mk('circle', { r: R, fill: YC.cyto, stroke: YC.membrane, 'stroke-width': 7 }, membrane);
  const spokes = G(g), links = G(g), central = G(g), doublets = G(g), dyneins = G(g);
  const A = [], B = [], arms = [];
  let sp = '', lk = '', tub = '', lum = '';
  for (let i = 0; i < 9; i++) {
    const t = yRad(-90 + 20 + i * 40), ax = Rd * Math.cos(t), ay = Rd * Math.sin(t);
    const tx = -Math.sin(t), ty = Math.cos(t);   // clockwise tangent
    const bx = ax + tx * a * 1.55 + Math.cos(t) * a * .35, by = ay + ty * a * 1.55 + Math.sin(t) * a * .35;
    A.push([ax, ay]); B.push([bx, by]);
    tub += yCirc(ax, ay, a) + yCirc(bx, by, a * 1.02); lum += yCirc(ax, ay, a * .5) + yCirc(bx, by, a * .5);
    sp += `M${yF(ax * .86)} ${yF(ay * .86)}L${yF(Math.cos(t) * R * .3)} ${yF(Math.sin(t) * R * .3)}`;
    sp += yCirc(Math.cos(t) * R * .32, Math.sin(t) * R * .32, 4.5);
  }
  for (let i = 0; i < 9; i++) {
    const [bx, by] = B[i], [nx, ny] = A[(i + 1) % 9];
    lk += `M${yF(bx)} ${yF(by)}L${yF(nx)} ${yF(ny)}`;
    // two dynein arms on the A tubule, reaching toward the previous doublet's B tubule (counter-clockwise)
    const [ax, ay] = A[i], t = Math.atan2(ay, ax);
    for (const off of [-.55, .55]) {
      const bxx = ax + Math.cos(t) * a * off, byy = ay + Math.sin(t) * a * off, ag = G(dyneins, { x: yR1(bxx), y: yR1(byy) });
      const dir = t - Math.PI / 2, L = a * 1.5;
      path(ag, `M0 0Q${yF(Math.cos(dir) * L * .7 + Math.cos(t) * off * 6)} ${yF(Math.sin(dir) * L * .7 + Math.sin(t) * off * 6)} ${yF(Math.cos(dir) * L)} ${yF(Math.sin(dir) * L + 0)}`, { stroke: YC.motor, 'stroke-width': 5 });
      mk('circle', { cx: yF(Math.cos(dir) * L), cy: yF(Math.sin(dir) * L), r: 4, fill: YC.motor }, ag);
      arms.push(ag);
    }
  }
  path(spokes, sp, { stroke: YC.spoke, 'stroke-width': 4, fill: YC.spoke });
  mk('circle', { r: R * .27, fill: 'none', stroke: YC.spoke, 'stroke-width': 2.5, 'stroke-dasharray': '5 5' }, spokes);
  path(links, lk, { stroke: YC.link, 'stroke-width': 4 });
  path(doublets, tub, { fill: YC.mt, stroke: YC.mtEdge, 'stroke-width': 2 });
  path(doublets, lum, { fill: YC.lumen });
  path(central, yCirc(-a * 1.15, 0, a) + yCirc(a * 1.15, 0, a), { fill: YC.mt, stroke: YC.mtEdge, 'stroke-width': 2 });
  path(central, yCirc(-a * 1.15, 0, a * .5) + yCirc(a * 1.15, 0, a * .5), { fill: YC.lumen });
  let cur = -1;
  const ax9 = Object.assign(g, {
    membrane, doublets, central, spokes, dyneins, links, arms, R,
    flick(k) {
      k = Math.round(yClamp(k) * 2000) / 2000; const key = k; if (key === cur) return ax9; cur = key;
      arms.forEach((ag, i) => yPose(ag, st(ag).x, st(ag).y, undefined, 22 * Math.sin(2 * Math.PI * 3 * k + Math.floor(i / 2) * .7)));
      return ax9;
    },
    pt(key = 'doublet', i = 1) {
      const t = yRad(-90 + 20 + i * 40), [ax, ay] = A[i], [bx, by] = B[i];
      if (key === 'membrane') return yOut(g, [R * Math.cos(t + .35), R * Math.sin(t + .35)]);
      if (key === 'central') return yOut(g, [a * 1.15, 0]);
      if (key === 'spoke') return yOut(g, [Math.cos(t) * R * .45, Math.sin(t) * R * .45]);
      if (key === 'dynein') { const dg = arms[2 * i + 1], dir = Math.atan2(ay, ax) - Math.PI / 2; return yOut(g, [st(dg).x + Math.cos(dir) * a, st(dg).y + Math.sin(dir) * a]); }
      if (key === 'link') { const [nx, ny] = A[(i + 1) % 9]; return yOut(g, [(bx + nx) / 2, (by + ny) / 2]); }
      return yOut(g, [(ax + bx) / 2, (ay + by) / 2]);
    },
  });
  return ax9;
}

/* ---------- dyneinWalk: two doublets, sliding or bending ---------- */
function dyneinWalk(p, { x = 0, y = 0, s = 1, o = 1, len = 620, gap = 70, n = 5, linked = false, slide = 110, cycles = 3 } = {}) {
  const g = G(p, { x, y, s, o }), th = 26, maxC = 1.1 / len;
  const base = G(g);
  mk('rect', { x: -26, y: -gap / 2 - th, width: 22, height: gap + 2 * th, rx: 5, fill: YC.plate }, base);
  const bottom = G(g), top = G(g);
  const bar = par => [path(par, '', { stroke: YC.mtB, 'stroke-width': th, 'stroke-linecap': 'butt' }), path(par, '', { stroke: YC.mt, 'stroke-width': th * .42, 'stroke-linecap': 'butt' })];
  const botP = bar(bottom), topP = bar(top);
  const linkP = path(g, '', { stroke: YC.link, 'stroke-width': 5 });
  const armL = G(g), arms = [];
  for (let i = 0; i < n; i++) arms.push({ stem: path(armL, '', { stroke: YC.motorEdge, 'stroke-width': 8 }), head: path(armL, '', { fill: YC.motor, stroke: YC.motorEdge, 'stroke-width': 2 }) });
  const geo = c => u => { if (Math.abs(c) < 1e-6) return { p: [u, 0], n: [0, -1] }; const f = c * u; return { p: [Math.sin(f) / c, -(1 - Math.cos(f)) / c], n: [-Math.sin(f), -Math.cos(f)] }; };
  const at = (G1, u, off) => { const { p: [px, py], n: [nx, ny] } = G1(u); return [px + nx * off, py + ny * off]; };
  const line = (G1, u0, u1, off) => { const pts = []; for (let i = 0; i <= 40; i++) pts.push(at(G1, u0 + (u1 - u0) * i / 40, off)); return yLine(pts); };
  let cur = null;
  const dw = Object.assign(g, {
    arms, top, bottom, base, links: linkP,
    walk(k, lk = linked) {
      k = Math.round(yClamp(k) * 4000) / 4000; const key = k + (lk ? 'L' : 'S'); if (key === cur) return dw; cur = key;
      const c = lk ? maxC * io(k) : 0, sh = lk ? 0 : slide * k, G1 = geo(c);
      const bd = line(G1, 0, len, -gap / 2), td = line(G1, sh, sh + len, gap / 2);
      botP.forEach(e => yD(e, bd)); topP.forEach(e => yD(e, td));
      yO(base, lk ? 1 : 0);
      let ld = '';
      if (lk) for (let j = 0; j < n + 1; j++) { const u = len * (j + .5) / (n + 1); const a1 = at(G1, u, -gap / 2 + th / 2), a2 = at(G1, u, gap / 2 - th / 2); ld += yLine([a1, a2]); }
      yD(linkP, ld);
      arms.forEach(({ stem, head }, i) => {
        const u = len * (i + .8) / (n + 1), ph = yFrac(k * cycles + i * .21);
        // grab 0–.15, pull .15–.6 (swing −30° → +30°), release .6–.75, recover .75–1 (detached, swinging back low)
        let ang, reach;
        if (ph < .15) { ang = -30; reach = yLerp(.72, 1, ph / .15); }
        else if (ph < .6) { ang = yLerp(-30, 30, io((ph - .15) / .45)); reach = 1; }
        else if (ph < .75) { ang = 30; reach = yLerp(1, .72, (ph - .6) / .15); }
        else { ang = yLerp(30, -30, io((ph - .75) / .25)); reach = .72; }
        const b0 = at(G1, u, -gap / 2 + th / 2), { n: [nx, ny] } = G1(u), A1 = yRad(ang);
        const dx = nx * Math.cos(A1) - ny * Math.sin(A1), dy = nx * Math.sin(A1) + ny * Math.cos(A1);
        const L = (gap - th) / Math.cos(A1) * reach - 6, tip = [b0[0] + dx * L, b0[1] + dy * L];
        yD(stem, yLine([b0, tip])); yD(head, yCirc(tip[0], tip[1], 8));
      });
      return dw;
    },
  });
  return dw.walk(0);
}

/* ---------- flagellumSwim: a sperm-like cell driven by an undulating flagellum ---------- */
function flagellumSwim(p, { x = 0, y = 0, s = 1, o = 1, len = 420, amp = 36, wl = 220, period = .8, speed = 60 } = {}) {
  const g = G(p, { x, y, s, o }), x0 = x;
  const tailO = path(g, '', { stroke: YC.membrane, 'stroke-width': 11 }), tailI = path(g, '', { stroke: YC.mt, 'stroke-width': 4 });
  const head = G(g);
  path(head, 'M-50 -7Q-60 0 -50 7Z', { fill: YC.membrane });
  mk('ellipse', { cx: 0, cy: 0, rx: 48, ry: 30, fill: YC.cyto, stroke: YC.membrane, 'stroke-width': 5 }, head);
  mk('ellipse', { cx: 6, cy: 0, rx: 32, ry: 20, fill: YC.dna, 'fill-opacity': .85 }, head);
  const swimArrow = yArrow(g, [70, -70], [150, -70], { color: COL.chalk, o: 0, w: 5, head: 16 });
  const waveArrow = yArrow(g, [-120, 80], [-120 - len * .6, 80], { color: YC.mt, o: 0, w: 5, head: 16 });
  let cur = null;
  const fl = Object.assign(g, {
    tail: tailO, head, swimArrow, waveArrow,
    beat(t) {
      t = Math.round(t * 120) / 120; const key = t; if (key === cur) return fl; cur = key;
      const w = 2 * Math.PI * t / period, pts = [];
      for (let i = 0; i <= 44; i++) { const u = len * i / 44, A = amp * (.15 + .85 * u / len); pts.push([-50 - u, A * Math.sin(2 * Math.PI * u / wl - w)]); }
      const d = ySmooth(pts); yD(tailO, d); yD(tailI, d);
      yPose(g, x0 + speed * t, st(g).y);
      return fl;
    },
  });
  return fl.beat(0);
}

/* ---------- ciliumBeat: power stroke and recovery stroke ---------- */
function ciliumBeat(p, { x = 0, y = 0, s = 1, o = 1, len = 150, period = 1.2, phase = 0, w = 12 } = {}) {
  const g = G(p, { x, y, s, o }), outer = path(g, '', { stroke: YC.membrane, 'stroke-width': w }), inner = path(g, '', { stroke: YC.mt, 'stroke-width': w * .38 });
  const P = .3, theta = q => { q = yFrac(q); return q < P ? yLerp(-65, 65, io(q / P)) : yLerp(65, -65, io((q - P) / (1 - P))); };
  let cur = -1;
  const ci = Object.assign(g, {
    period,
    pose(q) {
      q = yFrac(Math.round(yFrac(q) * 1000) / 1000); const key = q; if (key === cur) return ci; cur = key;
      // recovery: the bend starts at the base and runs out to the tip, which trails low (its angle lags behind)
      const rec = q >= P, lag = rec ? .03 + .4 * yRamp(q, P, P + .12) * (1 - yRamp(q, .82, 1)) : .03, pts = [[0, 0]], m = 20, du = len / m;
      let px = 0, py = 0;
      for (let i = 1; i <= m; i++) { const qq = q - lag * i / m, ph = yRad(theta(rec ? Math.max(P, qq) : qq)); px += du * Math.sin(ph); py -= du * Math.cos(ph); pts.push([px, py]); }
      const d = ySmooth(pts); yD(outer, d); yD(inner, d);
      return ci;
    },
    beat(t) { return ci.pose(t / period + phase); },
    phase(t) { return yFrac(t / period + phase) < P ? 'power' : 'recovery'; },
  });
  return ci.pose(phase);
}
function ciliaRow(p, { x = 0, y = 0, s = 1, o = 1, n = 9, w = 640, len = 130, period = 1.2, wave = .1, dots = true } = {}) {
  const g = G(p, { x, y, s, o }), dotL = G(g, { o: dots ? 1 : 0 });
  const surface = G(g);
  mk('rect', { x: -w / 2 - 30, y: 0, width: w + 60, height: 110, fill: YC.cyto }, surface);
  path(surface, `M${-w / 2 - 30} 0H${w / 2 + 30}`, { stroke: YC.membrane, 'stroke-width': 6 });
  const cilia = [];
  for (let i = 0; i < n; i++) cilia.push(ciliumBeat(g, { x: -w / 2 + w * (i + .5) / n, y: -2, len, period, phase: -i * wave }));
  const dl = [];
  for (let j = 0; j < 10; j++) dl.push(mk('circle', { r: 6, fill: YC.fluid, 'fill-opacity': .7 }, dotL));
  const row = Object.assign(g, {
    cilia, surface, dots: dotL,
    beat(t) {
      cilia.forEach(c => c.beat(t));
      dl.forEach((d, j) => { const u = yFrac(j / 10 + t * 70 / (w + 60)); yPose(d, -w / 2 - 30 + u * (w + 60), -len * (.7 + .35 * yFrac(j * .37)) - 20); });
      return row;
    },
  });
  return row.beat(0);
}

/* ---------- muscleUnit: actin and myosin sliding ---------- */
function muscleUnit(p, { x = 0, y = 0, s = 1, o = 1, w = 720, h = 260, cycles = 3 } = {}) {
  const g = G(p, { x, y, s, o }), aY = [-h * .4, 0, h * .4], mY = [-h * .2, h * .2], aLen = w * .42, nmA = 2.4;
  const left = G(g), right = G(g), myoL = G(g);
  const plate = par => mk('rect', { x: -7, y: -h / 2 - 26, width: 14, height: h + 52, rx: 5, fill: YC.plate }, par);
  plate(left); plate(right);
  const actins = [];
  aY.forEach(yy => { actins.push(microfilament(left, { x: 4, y: yy, len: aLen, nm: nmA })); actins.push(microfilament(right, { x: -4 - aLen, y: yy, len: aLen, nm: nmA })); });
  const myosins = [], heads = [], mx = w * .31;
  mY.forEach(yy => {
    const mg = G(myoL, { y: yy });
    mk('rect', { x: -mx, y: -9, width: 2 * mx, height: 18, rx: 9, fill: YC.myosin, stroke: YC.myosinEdge, 'stroke-width': 2 }, mg);
    myosins.push(mg);
    for (let xx = -mx + 20; xx <= mx - 20; xx += 34) {
      if (Math.abs(xx) < 40) continue;
      for (const side of [-1, 1]) {
        const hg = G(mg, { x: xx, y: side * 8 });
        path(hg, `M0 0L0 ${side * 22}`, { stroke: YC.myosinEdge, 'stroke-width': 5 });
        mk('ellipse', { cx: 0, cy: side * 30, rx: 8, ry: 11, fill: YC.myosin, stroke: YC.myosinEdge, 'stroke-width': 2 }, hg);
        heads.push({ hg, side, dir: xx < 0 ? -1 : 1, i: heads.length });
      }
    }
  });
  let cur = -1;
  const mu = Object.assign(g, {
    actins, myosins, heads: heads.map(h1 => h1.hg), plates: [left, right],
    contract(k) {
      k = Math.round(yClamp(k) * 4000) / 4000; const key = k; if (key === cur) return mu; cur = key;
      const sh = w * .17 * io(k);
      yPose(left, -w / 2 + sh, 0); yPose(right, w / 2 - sh, 0);
      heads.forEach(({ hg, side, dir, i }) => {
        const ph = k >= 1 || k <= 0 ? .6 : yFrac(k * cycles + i * .29);
        // dir −1 (left half) leans out toward the left end, pulls toward the middle: +x
        const a = ph < .6 ? yLerp(40, -12, io(ph / .6)) : yLerp(-12, 40, io((ph - .6) / .4));
        yPose(hg, st(hg).x, st(hg).y, ph < .6 ? 1 : .75, -dir * side * a);
      });
      return mu;
    },
    pt(key = 'actin') {
      if (key === 'myosin') return yOut(g, [mx * .6, mY[0]]);
      if (key === 'head') return yOut(g, [-mx + 54, mY[0] - 38]);
      if (key === 'plate') return yOut(g, [st(left).x, -h / 2 - 26]);
      return yOut(g, [st(left).x + aLen * .4, aY[0]]);
    },
  });
  return mu.contract(0);
}

/* ---------- amoebaCrawl: a pseudopodium and the gel/sol cytoplasm ---------- */
function amoebaCrawl(p, { x = 0, y = 0, s = 1, o = 1, R = 140, cycles = 2 } = {}) {
  const g = G(p, { x, y, s, o }), body = G(g), Np = 56;
  const gel = path(body, '', { fill: mix(YC.actin, '#0f1e33', .62), stroke: YC.membrane, 'stroke-width': 5 });
  const sol = path(body, '', { fill: YC.cytoLt });
  const dotL = G(body), dots = [];
  for (let j = 0; j < 9; j++) dots.push(mk('circle', { r: 5, fill: YC.dna, 'fill-opacity': .7 }, dotL));
  const nuc = G(body);
  mk('circle', { r: R * .24, fill: YC.nucleo, stroke: YC.env, 'stroke-width': 4 }, nuc);
  let cur = -1, shape = null;
  const rad = (th, e, rear) => { const w = Math.atan2(Math.sin(th), Math.cos(th)); return R * (1 + .05 * Math.sin(3 * th + 1) + .04 * Math.sin(5 * th + 2) + e * 1.05 * Math.exp(-(w * w) / (2 * .3 * .3)) - rear * .12 * Math.exp(-((Math.abs(w) - Math.PI) ** 2) / .5)); };
  const am = Object.assign(g, {
    body, nucleus: nuc,
    crawl(k) {
      k = Math.round(yClamp(k) * 4000) / 4000; const key = k; if (key === cur) return am; cur = key;
      const c = k * cycles, i = Math.min(cycles - 1, Math.floor(c)), f = k >= 1 ? 1 : c - i;
      const e = io(yRamp(f, 0, .5)) * (1 - io(yRamp(f, .5, 1))), mv = io(yRamp(f, .4, 1)), rear = yBump(f, .3, .9);
      const cx = R * .55 * (i + mv);
      const outerPts = [], innerPts = [];
      for (let j = 0; j < Np; j++) { const th = 2 * Math.PI * j / Np, r1 = rad(th, e, rear); outerPts.push([cx + r1 * Math.cos(th), r1 * Math.sin(th)]); const r2 = r1 - R * .17; innerPts.push([cx + r2 * Math.cos(th), r2 * Math.sin(th)]); }
      shape = { cx, e, front: cx + rad(0, e, rear) };
      yD(gel, ySmooth(outerPts, true)); yD(sol, ySmooth(innerPts, true));
      yPose(nuc, cx - R * .25 + R * .1 * mv, R * .12);
      dots.forEach((d, j) => {
        const u = yFrac(k * cycles * 1.4 + j / dots.length), x1 = cx - R * .7, x2 = shape.front - R * .3;
        yPose(d, yLerp(x1, x2, u), (j % 3 - 1) * R * .2 * (1 - u * .6) + 8 * Math.sin(6 * u + j), yBump(u, 0, 1));
      });
      return am;
    },
    pt(key = 'pseudopod') {
      const { cx, front } = shape;
      if (key === 'cortex') { const th = -Math.PI / 2 - .4, r1 = rad(th, shape.e, 0) - R * .085; return yOut(g, [cx + r1 * Math.cos(th), r1 * Math.sin(th)]); }
      if (key === 'inner') return yOut(g, [cx + R * .2, -R * .3]);
      if (key === 'nucleus') return yOut(g, [st(nuc).x, st(nuc).y]);
      return yOut(g, [front - 12, 0]);
    },
  });
  return am.crawl(0);
}

/* ---------- cytoStreaming: chloroplasts carried round a plant cell ---------- */
function yRoundRect(w, h, rr, n = 10) {   // points round a rounded rectangle centred on 0, clockwise from the top left
  const pts = [], c = [[w / 2 - rr, -h / 2 + rr, -90], [w / 2 - rr, h / 2 - rr, 0], [-w / 2 + rr, h / 2 - rr, 90], [-w / 2 + rr, -h / 2 + rr, 180]];
  for (const [cx, cy, a0] of c) for (let i = 0; i <= n; i++) { const a = yRad(a0 + 90 * i / n); pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
  return pts;
}
function yTrack(pts) {   // a closed polyline: at(u) → [x, y, angle°] at fraction u of its length
  const L = [0];
  for (let i = 1; i <= pts.length; i++) { const a = pts[i - 1], b = pts[i % pts.length]; L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const tot = L[L.length - 1];
  return { tot, at(u) {
    const d = yFrac(u) * tot; let i = 1; while (L[i] < d) i++;
    const a = pts[i - 1], b = pts[i % pts.length], f = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
    return [yLerp(a[0], b[0], f), yLerp(a[1], b[1], f), Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI];
  } };
}
function cytoStreaming(p, { x = 0, y = 0, s = 1, o = 1, w = 620, h = 380, n = 14, speed = 60, actin = true } = {}) {
  const g = G(p, { x, y, s, o });
  mk('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 46, fill: YC.cyto, stroke: YC.wall, 'stroke-width': 16 }, g);
  mk('rect', { x: -w / 2 + 12, y: -h / 2 + 12, width: w - 24, height: h - 24, rx: 36, fill: 'none', stroke: YC.membrane, 'stroke-width': 3.5 }, g);
  const vacuole = mk('rect', { x: -w / 2 + 62, y: -h / 2 + 62, width: w - 124, height: h - 124, rx: 26, fill: YC.vacuole, stroke: '#7fa6d6', 'stroke-width': 3 }, g);
  const trk = yTrack(yRoundRect(w - 74, h - 74, 22));
  if (actin) path(g, yLine(yRoundRect(w - 74, h - 74, 22), true), { stroke: YC.actin, 'stroke-width': 2.5, 'stroke-dasharray': '10 7', 'stroke-opacity': .65 });
  const chloros = [];
  for (let i = 0; i < n; i++) {
    const cg = G(g);
    mk('ellipse', { rx: 21, ry: 11, fill: YC.chloro, stroke: YC.chloroDk, 'stroke-width': 2 }, cg);
    path(cg, 'M-11 -4V4M-3 -5V5M5 -5V5M13 -3V3', { stroke: YC.chloroDk, 'stroke-width': 4 });
    chloros.push(cg);
  }
  const arrows = G(g);
  for (const u of [.12, .37, .62, .87]) { const [ax, ay, an] = trk.at(u), c = Math.cos(yRad(an)), sn = Math.sin(yRad(an)); const ag = G(arrows, { x: yR1(ax - sn * 22), y: yR1(ay + c * 22), r: yR1(an) }); path(ag, 'M-7 -8L5 0L-7 8', { stroke: COL.chalk, 'stroke-width': 3.5 }); }
  let cur = null, tNow = 0;
  const onTrack = (i, t) => trk.at(i / n + speed * t / trk.tot + .013 * Math.sin(i * 2.1));
  const cs = Object.assign(g, {
    chloros, vacuole, arrows, track: trk,
    flow(t) {
      t = Math.round(t * 120) / 120; const key = t; if (key === cur) return cs; cur = key; tNow = t;
      chloros.forEach((c, i) => { const [cx, cy, an] = onTrack(i, t); yPose(c, cx, cy, 1, an); });
      return cs;
    },
    pt(key = 'chloroplast', i = 0, t) {
      if (key === 'wall') return yOut(g, [w * .1, -h / 2]);
      if (key === 'vacuole') return yOut(g, [0, 0]);
      if (key === 'cytoplasm') return yOut(g, [-w / 2 + 37, h * .1]);
      // a chloroplast on the track: i which one, at flow time t (default: the last flow drawn)
      if (!n) return yOut(g, trk.at(0));
      const at = onTrack(((i % n) + n) % n, t === undefined ? tNow : Math.round(t * 120) / 120);
      return yOut(g, [at[0], at[1]]);
    },
  });
  return cs.flow(0);
}

/* ---------- plantWalls: the shared wall of two plant cells, with plasmodesmata ---------- */
function plantWalls(p, { x = 0, y = 0, s = 1, o = 1, w = 760, h = 420, n = 3, secondary = true } = {}) {
  const g = G(p, { x, y, s, o }), L = 5, P = 20, S = secondary ? 34 : 0, M = L + P + S + 3;   // half-widths
  mk('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: YC.cyto }, g);
  if (S) mk('rect', { x: -(L + P + S), y: -h / 2, width: 2 * (L + P + S), height: h, fill: YC.wall2 }, g);
  mk('rect', { x: -(L + P), y: -h / 2, width: 2 * (L + P), height: h, fill: YC.wall }, g);
  mk('rect', { x: -L, y: -h / 2, width: 2 * L, height: h, fill: YC.lamella }, g);
  const memb = path(g, `M${-M} ${-h / 2}V${h / 2}M${M} ${-h / 2}V${h / 2}`, { stroke: YC.membrane, 'stroke-width': 5, 'stroke-linecap': 'butt' });
  const chY = Array.from({ length: n }, (_, i) => -h / 2 + h * (i + .5) / n + (i - (n - 1) / 2) * 10), ch = 26;
  chY.forEach(cy => {
    mk('rect', { x: -M - 3, y: cy - ch / 2, width: 2 * M + 6, height: ch, fill: YC.cyto }, g);
    path(g, `M${-M} ${cy - ch / 2 - 2}H${M}M${-M} ${cy + ch / 2 + 2}H${M}`, { stroke: YC.membrane, 'stroke-width': 4 });
  });
  const dotL = G(g), dots = [], cols = [YC.cargo, YC.atp, YC.fluid];
  for (let j = 0; j < 9; j++) dots.push(mk('circle', { r: 7, fill: cols[j % 3] }, dotL));
  let cur = -1;
  const pw = Object.assign(g, {
    membranes: memb, channels: chY, dots: dotL,
    pass(k) {
      k = Math.round(yClamp(k) * 4000) / 4000; const key = k; if (key === cur) return pw; cur = key;
      if (!n) { dots.forEach(d => yPose(d, -w * .34, 0, 0)); return pw; }   // no channels: nothing crosses (dots hidden)
      dots.forEach((d, j) => {
        const u = io(yRamp(k, j * .07, j * .07 + .45)), cy = chY[j % n], sy = cy + ((j * 37) % 60 - 30), ex = M + 14;
        const pts = [[-w * .34, sy], [-ex, cy], [ex, cy], [w * .34, cy + ((j * 53) % 70 - 35)]], seg = Math.min(2, Math.floor(u * 3)), f = u * 3 - seg;
        const a = pts[seg], b = pts[seg + 1];
        yPose(d, yLerp(a[0], b[0], f), yLerp(a[1], b[1], f), 1);
      });
      return pw;
    },
    pt(key = 'lamella', side = 1) {
      const yy = n >= 2 ? (chY[0] + chY[1]) / 2 : n === 1 ? chY[0] + h * .2 : 0;
      if (key === 'primary') return yOut(g, [side * (L + P / 2), yy]);
      if (key === 'secondary') return yOut(g, [side * (L + P + S / 2), yy + 40]);
      if (key === 'membrane') return yOut(g, [side * M, yy - 50]);
      if (key === 'plasmodesma') return yOut(g, [0, n ? chY[0] : 0]);
      if (key === 'cytoplasm') return yOut(g, [side * w * .3, yy]);
      return yOut(g, [0, yy - 30]);
    },
  });
  return pw.pass(0);
}

/* ---------- ecmScene: the extracellular matrix of an animal cell ---------- */
function ecmScene(p, { x = 0, y = 0, s = 1, o = 1, w = 1000, h = 560, labels = false } = {}) {
  const g = G(p, { x, y, s, o }), top = -h * .62, bot = h * .38;
  mk('rect', { x: -w / 2, y: top, width: w, height: -top, fill: '#13304f' }, g);
  mk('rect', { x: -w / 2, y: 0, width: w, height: bot, fill: YC.cyto }, g);
  const parts = {};
  // membrane: a bilayer of heads and tails
  const mem = parts.membrane = G(g);
  mk('rect', { x: -w / 2, y: -14, width: w, height: 28, fill: '#2a4a74' }, mem);
  path(mem, `M${-w / 2 + 6} -15H${w / 2}M${-w / 2 + 6} 15H${w / 2}`, { stroke: YC.membrane, 'stroke-width': 11, 'stroke-dasharray': '0 14' });
  // microfilaments inside, bound to the integrins
  const IX = [-w * .26, w * .14];
  const fil = parts.filaments = G(g);
  microfilament(fil, { x: IX[0], y: 46, r: 120, len: 190, nm: 2.2 });
  microfilament(fil, { x: IX[0], y: 46, r: 35, len: 260, nm: 2.2 });
  microfilament(fil, { x: IX[1], y: 46, r: 150, len: 230, nm: 2.2 });
  microfilament(fil, { x: IX[1], y: 46, r: 60, len: 200, nm: 2.2 });
  microfilament(fil, { x: -w / 2, y: bot * .8, r: -8, len: w, nm: 2.2 });
  // integrins spanning the membrane
  const integ = parts.integrins = G(g);
  IX.forEach(ix => {
    const ig = G(integ, { x: ix });
    path(ig, 'M-26 -36Q-28 34 -14 46Q0 50 -2 30L-2 -36Q-14 -48 -26 -36Z', { fill: YC.integrin, stroke: YC.integrinDk, 'stroke-width': 3 });
    path(ig, 'M2 -36Q8 -60 2 -76M2 -36L2 34Q4 50 16 46Q30 34 26 -36Q14 -48 2 -36Z', { fill: YC.integrin, stroke: YC.integrinDk, 'stroke-width': 3 });
    mk('circle', { cx: 2, cy: -80, r: 9, fill: YC.integrin, stroke: YC.integrinDk, 'stroke-width': 3 }, ig);
  });
  // collagen fibres across the top
  const col = parts.collagen = G(g), cy = [top + 70, top + 125, top + 175];
  cy.forEach((yy, i) => {
    const d = `M${-w / 2} ${yy + 10 * i}C${-w * .2} ${yy - 30 + 20 * i} ${w * .2} ${yy + 34 - 10 * i} ${w / 2} ${yy - 8}`;
    path(col, d, { stroke: YC.collagenDk, 'stroke-width': 26, 'stroke-linecap': 'butt' });
    path(col, d, { stroke: YC.collagen, 'stroke-width': 20, 'stroke-linecap': 'butt' });
    path(col, d, { stroke: YC.collagenDk, 'stroke-width': 20, 'stroke-dasharray': '5 15', 'stroke-opacity': .55, 'stroke-linecap': 'butt' });
  });
  // fibronectin from each integrin up to a collagen fibre
  const fn = parts.fibronectin = G(g);
  IX.forEach((ix, i) => path(fn, `M${ix + 2} -88C${ix + 40 - 70 * i} -150 ${ix - 50 + 90 * i} -200 ${ix + 20} ${cy[2] + 6}`, { stroke: YC.fibronectin, 'stroke-width': 6 }));
  // proteoglycan complexes: a long polysaccharide with core proteins bristling with carbohydrates
  const pg = parts.proteoglycans = G(g), PX = [-w * .05, w * .38];
  let pgPt = [0, 0];
  PX.forEach((px, i) => {
    const pts = []; for (let j = 0; j <= 10; j++) { const v = j / 10; pts.push([px + 30 * Math.sin(v * 5 + i) + (i ? -60 : 40) * v, -30 - v * (-top - 50)]); }
    if (i) pgPt = pts[6];
    let br = '';
    for (let j = 1; j < 10; j++) {
      const [ax, ay] = pts[j], sd = j % 2 ? 1 : -1, ex = ax + sd * 46, ey = ay - 14;
      br += `M${yF(ax)} ${yF(ay)}L${yF(ex)} ${yF(ey)}`;
      for (let q = 1; q <= 3; q++) { const bx = ax + sd * 46 * q / 3.4, by = ay - 14 * q / 3.4; br += `M${yF(bx)} ${yF(by)}l${yF(sd * 6)} -14M${yF(bx)} ${yF(by)}l${yF(sd * 10)} 10`; }
    }
    path(pg, br, { stroke: YC.proteoglycan, 'stroke-width': 3 });
    path(pg, ySmooth(pts), { stroke: '#e4dbff', 'stroke-width': 6 });
  });
  const labelG = G(g, { o: labels ? 1 : 0 });
  const PT = {
    membrane: [-w * .42, 0], integrins: [IX[1] + 26, 0], filaments: [IX[0] - 70, 120], fibronectin: [IX[0] + 30, -150],
    collagen: [-w * .4, cy[0] + 8], proteoglycans: pgPt,
  };
  if (labels) {
    yTag(labelG, 'Collagen', PT.collagen, [-w * .4, top + 20]);
    yTag(labelG, 'Fibronectin', PT.fibronectin, [-w * .42, -110]);
    yTag(labelG, 'Integrin', PT.integrins, [IX[1] + 120, 60]);
    yTag(labelG, 'Plasma membrane', PT.membrane, [-w * .42, 110]);
    yTag(labelG, 'Microfilaments', PT.filaments, [-w * .12, bot - 30]);
    yTag(labelG, 'Proteoglycan complex', PT.proteoglycans, [w * .3, top - 36], { anchor: 'middle' });
    yText(labelG, 'EXTRACELLULAR FLUID', { x: w * .1, y: top + 30, size: 22, fill: COL.dim, weight: 700 });
    yText(labelG, 'CYTOPLASM', { x: w * .32, y: bot - 20, size: 22, fill: COL.dim, weight: 700 });
  }
  const order = ['membrane', 'integrins', 'filaments', 'fibronectin', 'collagen', 'proteoglycans'];
  const ec = Object.assign(g, {
    parts, labels: labelG,
    build(k) { order.forEach((n1, i) => yO(parts[n1], i === 0 ? 1 : yRamp(k, (i - 1) / 5, i / 5))); return ec; },
    pt(key = 'collagen') { return yOut(g, PT[key] || [0, 0]); },
  });
  return ec;
}

/* ---------- cellJunction: tight junction, desmosome, gap junction ---------- */
function cellJunction(p, { kind = 'tight', x = 0, y = 0, s = 1, o = 1, w = 600, h = 480 } = {}) {
  const g = G(p, { x, y, s, o }), gapW = kind === 'desmosome' ? 30 : kind === 'gap' ? 12 : 24, hm = gapW / 2 + 6;
  const cellL = G(g), cellR = G(g), mid = G(g), fx = G(g);
  const tTop = -h * .3, tBot = -h * .02;   // the tight seal
  const memX = yv => {   // half-distance from the centre line to a membrane's middle
    if (kind !== 'tight' || yv < tTop || yv > tBot) return hm;
    const e = Math.min(yRamp(yv, tTop, tTop + 14), 1 - yRamp(yv, tBot - 14, tBot));
    return yLerp(hm, 7 + 3 * Math.abs(Math.sin(Math.PI * (yv - tTop) / 26)), e);
  };
  for (const [cg, sd] of [[cellL, -1], [cellR, 1]]) {
    const pts = [];
    for (let yv = -h / 2; yv <= h / 2; yv += 4) pts.push([sd * memX(yv), yv]);
    const fill = [...pts, [sd * w / 2, h / 2], [sd * w / 2, -h / 2]];
    path(cg, yLine(fill, true), { fill: YC.cyto });
    path(cg, yLine(pts), { stroke: YC.membrane, 'stroke-width': 12 });
    path(cg, yLine(pts), { stroke: '#2a4a74', 'stroke-width': 3.5 });
  }
  const parts = {};
  const dots = [];
  if (kind === 'tight') {
    let d = '';
    for (let yv = tTop + 6; yv <= tBot - 6; yv += 26) d += yCirc(-6, yv, 7) + yCirc(6, yv, 7);
    parts.junction = path(mid, d, { fill: YC.seam, stroke: '#6b3fa0', 'stroke-width': 1.5 });
    for (let j = 0; j < 9; j++) dots.push(mk('circle', { r: 6, fill: YC.fluid }, fx));
    parts.block = G(fx, { x: 0, y: tTop - 22, o: 0 });
    path(parts.block, 'M-14 -14L14 14M14 -14L-14 14', { stroke: COL.bad, 'stroke-width': 6 });
  } else if (kind === 'desmosome') {
    const pl = 64;
    for (const [cg, sd] of [[cellL, -1], [cellR, 1]]) {
      mk('rect', { x: sd > 0 ? hm + 6 : -hm - 6 - 16, y: -pl, width: 16, height: 2 * pl, rx: 5, fill: YC.myosin, stroke: YC.myosinEdge, 'stroke-width': 2 }, cg);
      let d = '';
      for (let i = 0; i < 9; i++) {
        const y0 = -pl + 8 + i * (2 * pl - 16) / 8, x0 = sd * (hm + 22), L = 150 + 40 * Math.sin(i * 1.7), bend = (i - 4) * 22;
        d += `M${x0} ${yF(y0)}C${x0 + sd * L * .4} ${yF(y0 + bend * .3)} ${x0 + sd * L * .7} ${yF(y0 + bend)} ${yF(x0 + sd * L)} ${yF(y0 + bend * 1.6 + 20 * Math.sin(i))}`;
        if (i % 3 === 1) d += `M${x0} ${yF(y0)}C${x0 + sd * 60} ${yF(y0 - 40)} ${x0 + sd * 40} ${yF(y0 - 90)} ${x0 + sd * 10} ${yF(y0 - 110)}`;
      }
      path(cg, d, { stroke: YC.inter, 'stroke-width': 4.5 });
    }
    parts.links = path(mid, '', { stroke: YC.plate, 'stroke-width': 3 });
  } else {
    const chY = [-h * .27, -h * .09, h * .09, h * .27];
    chY.forEach(cy => {
      const cg = G(mid, { y: cy });
      mk('rect', { x: -hm - 14, y: -18, width: 2 * hm + 28, height: 36, rx: 6, fill: YC.connexon, stroke: YC.myosinEdge, 'stroke-width': 2 }, cg);
      path(cg, `M${-gapW / 2} -18V18M${gapW / 2} -18V18`, { stroke: YC.myosinEdge, 'stroke-width': 2 });
      mk('rect', { x: -hm - 14, y: -5, width: 2 * hm + 28, height: 10, fill: YC.cyto }, cg);
    });
    parts.channels = chY;
    const cols = [YC.cargo, YC.atp, YC.fluid];
    for (let j = 0; j < 8; j++) dots.push(mk('circle', { r: 5, fill: cols[j % 3] }, fx));
  }
  let cur = -1;
  const jc = Object.assign(g, {
    kind, cells: [cellL, cellR], parts,
    leak(k) {
      if (kind !== 'tight') return jc;
      k = Math.round(yClamp(k) * 4000) / 4000; const key = k; if (key === cur) return jc; cur = key;
      dots.forEach((d, j) => {
        const u = io(yRamp(k, j * .06, j * .06 + .5)), ty = tTop - 12 - 13 * Math.floor(j / 1) * .9, sx = (j % 2 ? 1 : -1) * (40 + j * 18);
        const ux = yRamp(u, 0, .4), uy = yRamp(u, .3, 1);
        yPose(d, yLerp(sx, (j % 2 ? 1 : -1) * 2.5, ux), yLerp(-h / 2 - 50, ty, uy) + (u >= 1 ? 2 * Math.sin(j * 3 + k * 30) : 0), yRamp(k, j * .06, j * .06 + .05));
      });
      yO(parts.block, yRamp(k, .8, .9));
      return jc;
    },
    pull(k) {
      if (kind !== 'desmosome') return jc;
      k = Math.round(yClamp(k) * 4000) / 4000; const key = k; if (key === cur) return jc; cur = key;
      const sh = 14 * io(k);
      yPose(cellL, -sh, 0); yPose(cellR, sh, 0);
      let d = '';
      for (let yv = -56; yv <= 56; yv += 14) d += `M${yF(-hm - sh + 6)} ${yv}L${yF(hm + sh - 6)} ${yv}`;
      yD(parts.links, d);
      return jc;
    },
    pass(k) {
      if (kind !== 'gap') return jc;
      k = Math.round(yClamp(k) * 4000) / 4000; const key = k; if (key === cur) return jc; cur = key;
      dots.forEach((d, j) => {
        const u = io(yRamp(k, j * .07, j * .07 + .45)), cy = parts.channels[j % 4], ex = hm + 18;
        const pts = [[-w * .36 + (j * 23) % 60, cy + ((j * 41) % 80 - 40)], [-ex, cy], [ex, cy], [w * .32 - (j * 19) % 60, cy + ((j * 29) % 80 - 40)]];
        const seg = Math.min(2, Math.floor(u * 3)), f = u * 3 - seg;
        yPose(d, yLerp(pts[seg][0], pts[seg + 1][0], f), yLerp(pts[seg][1], pts[seg + 1][1], f), 1);
      });
      return jc;
    },
    pt(key = 'junction', side = 1) {
      if (key === 'membrane') return yOut(g, [side * hm, h * .38]);
      if (key === 'space') return yOut(g, [0, h * .44]);
      if (key === 'filaments') return yOut(g, [side * (hm + 120), 30]);
      if (key === 'channel') return yOut(g, [0, -h * .09]);
      return yOut(g, [0, kind === 'tight' ? (tTop + tBot) / 2 : 0]);
    },
  });
  if (kind === 'tight') jc.leak(0); else if (kind === 'desmosome') jc.pull(0); else jc.pass(0);
  return jc;
}
