'use strict';
// Water and Life: the book's element library, loaded after engine.js. Every piece is drawn around its own origin and
// placed with put/pose; motion is a pure function of beat time (crowds, thermometers), so replay and seek are true.
// Components (style.json): waterMolecule, hBond, moleculeCrowd, heatArrow, thermometer; plus beaker and wLabel.

const WC = {
  O: '#e5533d', Oedge: '#a83322', H: '#f4f4f0', Hedge: '#b9b9b0', stick: '#cfd3d8', face: '#3b0f0a',
  bond: '#5fd3e8', heat: '#f39a2b', cold: '#4a8fe7', gravity: '#8f9bb0',
  water: '#1b4a78', waterHi: '#2a679e', glass: '#a9c2df', sand: '#d8b06a', sandDk: '#b48a4a',
  leaf: '#4f9a5c', leafDk: '#357746', bark: '#7a5a3e', barkDk: '#5c412b', sky: '#16304f',
};
const W_HALF = 52.25 * Math.PI / 180;            // half of H–O–H, 104.5°
const W_OH = 52, W_RO = 30, W_RH = 17;           // bond length and atom radii at s = 1
const W_HX = W_OH * Math.sin(W_HALF), W_HY = W_OH * Math.cos(W_HALF);
// Rotations that point one hydrogen a given way: H1 sits at 37.75° from +x, H2 at 142.25° (SVG angles, clockwise).
const W_H1 = 37.75, W_H2 = 142.25;
const wHash = (i, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return v - Math.floor(v); };
// Molecular speed relative to 20 °C: √T, with the difference exaggerated 6× so warm and cold read at a glance.
const wSpeed = c => Math.max(.2, 1 + 6 * (Math.sqrt((c + 273) / 293) - 1));
const wDeg = c => (Math.round(c * 10) / 10).toFixed(Math.abs(c * 10 % 10) > .01 ? 1 : 0).replace('-', '−') + ' °C';
const wNum = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');   // 4184 → 4 184

// Text with the book's look; returns the text element (o 0 unless given).
function wLabel(p, str, { x = 0, y = 0, size = 30, fill = COL.chalk, anchor = 'middle', weight = 600, o = 0 } = {}) {
  return T(p, str, { x, y, size, fill, anchor, weight, o });
}

/* ---------- waterMolecule: ball-and-stick H2O, red O with a small upright face, white H ---------- */
// mol.pose(x, y, r) places it (the face stays upright); mol.atom('O' | 1 | 2) is that atom's point in the parent;
// mol.deltas(t0) shows δ− / δ+ beside the atoms; mol.blink(t0), mol.look(dx, dy, t0); mol.halo is a glow ring (o 0).
function waterMolecule(p, { x = 0, y = 0, r = 0, s = 1, o = 1, face = true, tint } = {}) {
  const g = G(p, { x, y, r, s, o });
  const halo = mk('circle', { r: W_RO + 16, fill: WC.heat, 'fill-opacity': .35 }, g); put(halo, { o: 0 });
  path(g, `M0 0L${W_HX} ${W_HY}M0 0L${-W_HX} ${W_HY}`, { stroke: WC.stick, 'stroke-width': 9 });
  for (const sx of [1, -1]) {
    mk('circle', { cx: sx * W_HX, cy: W_HY, r: W_RH, fill: WC.H, stroke: WC.Hedge, 'stroke-width': 2 }, g);
    mk('circle', { cx: sx * W_HX - 5, cy: W_HY - 6, r: 5, fill: '#fff' }, g);
  }
  const ball = mk('circle', { r: W_RO, fill: tint || WC.O, stroke: WC.Oedge, 'stroke-width': 2.5 }, g);
  mk('ellipse', { cx: -11, cy: -13, rx: 9, ry: 5.5, fill: '#fff', 'fill-opacity': .35 }, g);
  const fg = G(g, { r: -r }), eyes = [], pupils = G(fg);
  if (face) {
    for (const ex of [-9, 9]) eyes.push(mk('ellipse', { cx: ex, cy: -3, rx: 3.6, ry: 4.6, fill: WC.face }, pupils));
    path(fg, 'M-7 8q7 6 14 0', { stroke: WC.face, 'stroke-width': 2.6 });
  }
  let labels = null;
  const m = Object.assign(g, {
    halo, ball, face: fg,
    pose(nx = st(g).x, ny = st(g).y, nr = st(g).r) { put(g, { x: nx, y: ny, r: nr }); put(fg, { r: -nr }); if (labels) placeLabels(); return m; },
    atom(k) {
      const { x: gx, y: gy, r: gr, s: gs } = st(g), a = gr * Math.PI / 180;
      const [lx, ly] = k === 'O' ? [0, 0] : k === 1 ? [W_HX, W_HY] : [-W_HX, W_HY];
      return [gx + gs * (lx * Math.cos(a) - ly * Math.sin(a)), gy + gs * (lx * Math.sin(a) + ly * Math.cos(a))];
    },
    deltas(t0, { size = 30, layer = p, nudge = {} } = {}) {
      labels = G(layer, { o: 0 }); labels._n = nudge;
      labels._t = [wLabel(labels, 'δ−', { size, fill: '#ffb3a6', o: 1 }), wLabel(labels, 'δ+', { size, fill: '#ffffff', o: 1 }), wLabel(labels, 'δ+', { size, fill: '#ffffff', o: 1 })];
      placeLabels(); show(labels, t0, .8); return labels;
    },
    blink(t0) { eyes.forEach(e => { put(e, { a_ry: 4.6 }); tw(e, { a_ry: .5 }, t0, .08, lin); tw(e, { a_ry: 4.6 }, t0 + .1, .1, lin); }); },
    look(dx, dy, t0, dur = .3) { tw(pupils, { x: dx, y: dy }, t0, dur); },
  });
  function placeLabels() {
    const { x: gx, y: gy, s: gs } = st(g), [ox, oy] = [gx, gy];
    const out = (k, f) => { const [ax, ay] = m.atom(k); return [ox + (ax - ox) * f, oy + (ay - oy) * f]; };
    const [h1x, h1y] = out(1, 1.85), [h2x, h2y] = out(2, 1.85), mx = (h1x + h2x) / 2 - ox, my = (h1y + h2y) / 2 - oy, L = Math.hypot(mx, my) || 1;
    const n0 = labels._n[0] || [0, 0];
    put(labels._t[0], { x: ox - mx / L * 62 * gs + n0[0], y: oy - my / L * 62 * gs + 10 + n0[1] });
    const n1 = labels._n[1] || [0, 0], n2 = labels._n[2] || [0, 0];
    put(labels._t[1], { x: h1x + n1[0], y: h1y + 10 + n1[1] }); put(labels._t[2], { x: h2x + n2[0], y: h2y + 10 + n2[1] });
  }
  return m;
}

// Turn a molecule so its hydrogen hi (1 or 2) points at (tx, ty).
function wAim(m, hi, tx, ty) { const { x, y } = st(m); return m.pose(x, y, Math.atan2(ty - y, tx - x) * 180 / Math.PI - (hi === 1 ? W_H1 : W_H2)); }

/* ---------- hBond: dashed cyan link from an H to a neighbour's O ---------- */
// b.set([x, y], [x, y]) or b.link(molA, 1|2, molB) (trimmed to the atoms' edges); b.form(t0, dur) draws it on and
// flashes at the O; b.snap(t0) flashes and breaks it; b.flicker(t0, n, period) breaks and re-forms n times.
function hBond(p, { w = 4.5, color = WC.bond, dash = '10 8', o = 1, k = 1 } = {}) {
  const g = G(p, { o });
  const ln = path(g, '', { stroke: color, 'stroke-width': w, 'stroke-dasharray': dash });
  const fl = mk('circle', { r: 18, fill: 'none', stroke: color, 'stroke-width': 3.5 }, g); put(fl, { o: 0 });
  let A = [0, 0], B = [0, 0];
  const redraw = () => {
    const ex = A[0] + (B[0] - A[0]) * k, ey = A[1] + (B[1] - A[1]) * k;
    const d = `M${A[0].toFixed(1)} ${A[1].toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`;
    if (d !== ln._d) ln.setAttribute('d', ln._d = d);
    const f = st(fl); if (f.x !== B[0] || f.y !== B[1]) put(fl, { x: B[0], y: B[1] });
  };
  const b = Object.assign(g, {
    line: ln, flash: fl,
    set(a, c) { A = a; B = c; redraw(); return b; },
    link(m1, hi, m2, trimA = W_RH, trimB = W_RO) {
      const a = m1.atom(hi), c = m2.atom('O'), dx = c[0] - a[0], dy = c[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const sa = st(m1).s * trimA + 2, sb = st(m2).s * trimB + 3;
      return b.set([a[0] + dx / L * sa, a[1] + dy / L * sa], [c[0] - dx / L * sb, c[1] - dy / L * sb]);
    },
    form(t0, dur = .6) {
      k = 0; redraw();
      prog(q => { k = q; redraw(); }, t0, dur, out);
      b.ping(t0 + dur); return b;
    },
    open() { k = 1; redraw(); return b; },   // drawn in full from the start (call after form() when the bond exists before it re-forms)
    ping(t0) { put(fl, { o: 0, s: .4 }); tw(fl, { o: 1, s: 1 }, t0, .15, out); tw(fl, { o: 0, s: 1.9 }, t0 + .15, .5); },
    snap(t0) { b.ping(t0); tw(g, { o: 0 }, t0, .12, lin); return b; },
    flicker(t0, n = 2, period = .5) {
      for (let i = 0; i < n; i++) { const t = t0 + i * period; tw(g, { o: .08 }, t, .1, lin); tw(g, { o: 1 }, t + period * .55, .1, lin); b.ping(t + period * .55); }
      return b;
    },
  });
  return b;
}

/* ---------- moleculeCrowd: a region of molecules at a temperature ---------- */
// moleculeCrowd(p, { x, y, w, h, n, mode: 'liquid' | 'ice' | 'gas', temp, s, seed, bonds, trails, round })
// crowd.set(t, temp) poses every molecule from t alone (jiggle frequency ∝ √T, so faster when warmer); crowd.k[i] is a
// molecule's own speed factor (a spread, for speed bars and evaporation); crowd.bonds are the hBonds to neighbours.
function moleculeCrowd(p, { x = 0, y = 0, w = 400, h = 300, n = 12, mode = 'liquid', temp = 20, s = .6, seed = 1, bonds = false, trails = false, trail = WC.heat, round = false, face = true } = {}) {
  const g = G(p, { x, y });
  const bondLayer = G(g), trailPath = trails ? path(g, '', { stroke: trail, 'stroke-width': 4, 'stroke-opacity': .55 }) : null;
  const cols = Math.max(1, Math.round(Math.sqrt(n * w / h))), rows = Math.ceil(n / cols);
  const cw = w / cols, ch = h / rows, base = [], k = [], mols = [];
  for (let i = 0; i < n; i++) {
    const c = i % cols, r = Math.floor(i / cols), shift = mode === 'ice' && r % 2 ? cw / 2 : 0;
    let bx = (c + .5) * cw + shift - w / 2, by = (r + .5) * ch - h / 2;
    if (mode !== 'ice') { bx += (wHash(i, seed) - .5) * cw * .45; by += (wHash(i, seed + 1) - .5) * ch * .45; }
    if (round) { const L = Math.hypot(bx / (w / 2), by / (h / 2)); if (L > .82) { bx *= .82 / L; by *= .82 / L; } }
    base.push([bx, by, wHash(i, seed + 2) * 360]);
    k.push(.45 + 1.3 * wHash(i, seed + 3));
  }
  for (let i = 0; i < n; i++) mols.push(waterMolecule(g, { x: base[i][0], y: base[i][1], r: base[i][2], s, face }));
  const pairs = [];
  if (bonds) for (let i = 0; i < n; i++) {
    let best = -1, bd = 1e9;
    for (let j = 0; j < n; j++) if (j !== i && !pairs.some(q => q[0] === j && q[2] === i)) {
      const d = Math.hypot(base[i][0] - base[j][0], base[i][1] - base[j][1]); if (d < bd) { bd = d; best = j; }
    }
    if (best >= 0 && bd < 1.7 * Math.max(cw, ch)) pairs.push([i, 1 + (i % 2), best]);
  }
  const bondEls = pairs.map(() => hBond(bondLayer, { w: 3.5 * Math.max(.7, s / .6), dash: '8 7' }));
  const pos = (i, t, c) => {
    const v = wSpeed(c) * k[i], [bx, by, r0] = base[i], ph = wHash(i, seed + 4) * 6.28, ph2 = wHash(i, seed + 5) * 6.28;
    if (mode === 'ice') return [bx + 3 * Math.sin(9 * v * t + ph), by + 3 * Math.sin(8 * v * t + ph2), r0 + 4 * Math.sin(7 * v * t + ph)];
    if (mode === 'gas') {
      const vx = Math.cos(ph) * 120 * v, vy = Math.sin(ph) * 120 * v;
      const wrap = (a, L) => ((a % L) + L * 1.5) % L - L / 2;
      return [wrap(bx + vx * t, w), wrap(by + vy * t, h), r0 + 120 * v * t];
    }
    const A = .2 * Math.min(cw, ch);
    return [bx + A * (Math.sin(2.1 * v * t + ph) + .5 * Math.sin(3.7 * v * t + ph2)) / 1.5,
            by + A * (Math.sin(1.8 * v * t + ph2) + .5 * Math.sin(3.1 * v * t + ph)) / 1.5,
            r0 + 28 * Math.sin(1.6 * v * t + ph)];
  };
  const crowd = {
    g, mols, k, base, pairs, bonds: bondEls, temp, mode,
    set(t, c = crowd.temp) {
      let d = '';
      mols.forEach((m, i) => {
        if (m._frozen) return;
        const [px, py, pr] = pos(i, t, c); m.pose(px, py, pr);
        if (trailPath) { const [qx, qy] = pos(i, t - .14 * crowd.trailLen, c); d += `M${qx.toFixed(1)} ${qy.toFixed(1)}L${px.toFixed(1)} ${py.toFixed(1)}`; }
      });
      if (trailPath && d !== trailPath._d) trailPath.setAttribute('d', trailPath._d = d);
      pairs.forEach(([i, hi, j], q) => bondEls[q].link(mols[i], hi, mols[j]));
      return crowd;
    },
    trailLen: 1, trailPath, bondLayer,
  };
  crowd.set(0, temp);
  return crowd;
}

/* ---------- heatArrow: a wavy orange arrow of heat flow ---------- */
// heatArrow(p, [x1, y1], [x2, y2], { label, color, waves, amp, w }) — a.in(t0, dur) draws it on (head and label follow);
// a.label is the text, placed beside the arrow's middle (side ±1).
function heatArrow(p, [x1, y1], [x2, y2], { label = '', color = WC.heat, waves = 3, amp = 12, w = 9, side = -1, size = 30, o = 0 } = {}) {
  const g = G(p, { o: 1 });
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const body = L - 26; let d = `M${x1} ${y1}`;
  for (let i = 1; i <= 48; i++) {
    const f = i / 48, a = amp * Math.sin(f * waves * 2 * Math.PI) * Math.min(1, (1 - f) * 4);
    d += `L${(x1 + ux * body * f + nx * a).toFixed(1)} ${(y1 + uy * body * f + ny * a).toFixed(1)}`;
  }
  const line = path(g, d, { stroke: color, 'stroke-width': w }, { d: o });
  const hx = x2 - ux * 30, hy = y2 - uy * 30;
  const head = path(g, `M${(hx + nx * 20).toFixed(1)} ${(hy + ny * 20).toFixed(1)}L${x2} ${y2}L${(hx - nx * 20).toFixed(1)} ${(hy - ny * 20).toFixed(1)}Z`, { fill: color, stroke: color, 'stroke-width': 3 }, { o });
  // a steep arrow's label sits beside it, anchored away from the shaft
  const anchor = Math.abs(ux) < .5 ? (nx * side > 0 ? 'start' : 'end') : 'middle';
  const lab = label ? wLabel(g, label, { x: (x1 + x2) / 2 + nx * side * (amp + 22), y: (y1 + y2) / 2 + ny * side * (amp + 30) + size * .35, size, fill: color, anchor, o }) : null;
  return Object.assign(g, {
    line, head, label: lab,
    in(t0, dur = .8) { draw(line, t0, dur); show(head, t0 + dur * .75, .25); if (lab) show(lab, t0 + dur * .5); return g; },
  });
}

/* ---------- thermometer: tube and bulb, °C readout from the same value as the motion ---------- */
// thermometer(p, { x, y, h, min, max }) — origin at the bulb's centre; th.set(c) sets the column and the readout.
function thermometer(p, { x = 0, y = 0, h = 260, w = 24, min = 0, max = 50, side = 1, size = 32, color = WC.heat, o = 1, ticks = 5 } = {}) {
  const g = G(p, { x, y, o });
  const top = -h, R = w * .95;
  mk('rect', { x: -w / 2 - 5, y: top - 5, width: w + 10, height: h + 5, rx: w / 2 + 5, fill: '#0b1626', stroke: WC.glass, 'stroke-width': 3 }, g);
  mk('circle', { r: R + 5, fill: '#0b1626', stroke: WC.glass, 'stroke-width': 3 }, g);
  let tk = ''; for (let i = 0; i <= ticks; i++) tk += `M${-w / 2 - 16} ${(top + 14 + (h - 40) * i / ticks).toFixed(1)}h10`;
  path(g, tk, { stroke: COL.dim, 'stroke-width': 2.5 });
  const col = mk('rect', { x: -w / 2 + 4, width: w - 8, rx: (w - 8) / 2, fill: color }, g);
  mk('circle', { r: R - 2, fill: color }, g);
  const read = wLabel(g, '', { x: side * (w / 2 + 18), y: top + 24, size, anchor: side > 0 ? 'start' : 'end', fill: COL.chalk, o: 1 });
  const th = Object.assign(g, {
    read, c: min,
    set(c) {
      th.c = c; const f = Math.max(0, Math.min(1, (c - min) / (max - min))), hh = 10 + (h - 40) * f;
      const yy = (-10 - hh).toFixed(1);
      if (col._y !== yy) { col.setAttribute('y', yy); col.setAttribute('height', (hh + 10).toFixed(1)); col._y = yy; }
      const s = wDeg(c); if (read.textContent !== s) read.textContent = s;
      return th;
    },
  });
  return th.set(min);
}

/* ---------- beaker: a glass of water, origin at the bottom centre ---------- */
function beaker(p, { x = 0, y = 0, w = 360, h = 320, fill = WC.water, level = .85, o = 1 } = {}) {
  const g = G(p, { x, y, o });
  const water = mk('rect', { x: -w / 2 + 6, y: -h * level, width: w - 12, height: h * level - 6, rx: 10, fill }, g);
  mk('rect', { x: -w / 2 + 6, y: -h * level, width: w - 12, height: 8, fill: '#fff', 'fill-opacity': .12 }, g);
  path(g, `M${-w / 2 - 10} ${-h}h10V-12q0 12 12 12H${w / 2 - 12}q12 0 12 -12V${-h}h10`, { stroke: WC.glass, 'stroke-width': 6 });
  return Object.assign(g, { water, w, h, level, surface: -h * level });
}

/* ---------- lesson 1 additions: atoms, shared electrons, oxygen's negative regions, the bond angle ---------- */
WC.elec = '#ffd27a';   // shared electrons
WC.pos = '#4a8fe7';    // a positive side (glow)

// One atom as a ball with its symbol (no face): kind 'O' | 'H' | 'Na' | 'Cl'. Origin at the centre.
function wAtom(p, kind, { x = 0, y = 0, r, o = 1, letter = true, size } = {}) {
  const look = { O: [WC.O, WC.Oedge, '#fff', 60], H: [WC.H, WC.Hedge, '#3b3b36', 40], Na: ['#b28be0', '#7d5bb0', '#fff', 44], Cl: ['#7fcf8f', '#4f9a5c', '#10301a', 50],
    C: ['#5b6472', '#3d444f', '#fff', 46], N: ['#7f90bd', '#56658f', '#fff', 48], P: ['#e8a25a', '#b5763a', '#2a1806', 54] }[kind];   // C, N, P: lesson 5
  const R = r ?? look[3], g = G(p, { x, y, o });
  mk('circle', { r: R, fill: look[0], stroke: look[1], 'stroke-width': 3 }, g);
  mk('ellipse', { cx: -R * .36, cy: -R * .42, rx: R * .3, ry: R * .18, fill: '#fff', 'fill-opacity': .35 }, g);
  if (letter) wLabel(g, kind, { y: (size ?? R * .8) * .36, size: size ?? R * .8, fill: look[2], weight: 700, o: 1 });
  return Object.assign(g, { R });
}

// A cloud of shared electrons between points a and b, with two electrons circling in it. c.set(a, b, bias, t): the
// cloud's centre sits at a + (b − a)·bias (0.5 = shared equally, smaller = held nearer a); the electrons' angle comes
// from t alone, so seek and play agree.
function electronCloud(p, { rx = 80, ry = 44, color = WC.elec, o = 1, speed = 2.6 } = {}) {
  const g = G(p, { o });
  mk('ellipse', { rx, ry, fill: color, 'fill-opacity': .24, stroke: color, 'stroke-opacity': .55, 'stroke-width': 2.5, 'stroke-dasharray': '4 7' }, g);
  const dots = [0, 1].map(() => mk('circle', { r: Math.max(6, ry * .2), fill: color, stroke: '#fff3cf', 'stroke-width': 2 }, g));
  const c = Object.assign(g, {
    dots,
    set([ax, ay], [bx, by], bias = .5, t = 0) {
      const cx = ax + (bx - ax) * bias, cy = ay + (by - ay) * bias, ang = Math.atan2(by - ay, bx - ax) * 180 / Math.PI;
      put(g, { x: cx, y: cy, r: ang });
      dots.forEach((d, i) => { const f = speed * t + i * Math.PI; put(d, { x: rx * .62 * Math.cos(f), y: ry * .55 * Math.sin(f) }); });
      return c;
    },
  });
  return c;
}

// Oxygen's two negative regions, drawn inside the molecule (behind its atoms) on the side away from the hydrogens,
// so they follow every pose. Returns { els: [lobe1, lobe2] (o 0), at(i, f) — the point f × the lobe's reach from O in
// the molecule's parent }.
function wLobes(m, { color = WC.O, reach = 58 } = {}) {
  const els = [1, -1].map(sx => {
    const a = Math.atan2(-W_HY, sx * W_HX) * 180 / Math.PI, g = G(m, { r: a, o: 0 });
    mk('ellipse', { cx: reach * .62, rx: reach * .62, ry: 22, fill: color, 'fill-opacity': .38, stroke: '#ff9a88', 'stroke-width': 2.5 }, g);
    m.insertBefore(g, m.halo.nextSibling);
    return g;
  });
  const at = (i, f = 1) => {
    const { x, y, r, s } = st(m), a = (r + (i ? -W_H2 : -W_H1)) * Math.PI / 180;
    return [x + s * reach * f * Math.cos(a), y + s * reach * f * Math.sin(a)];
  };
  return { els, at };
}

// The H–O–H angle as an arc inside the molecule (drawn on with draw()); r is the arc's radius at s = 1.
function wAngle(m, { R = 30, color = COL.chalk, w = 3 } = {}) {
  const a1 = W_H1 * Math.PI / 180, a2 = W_H2 * Math.PI / 180;
  const e = path(m, `M${(R * Math.cos(a1)).toFixed(2)} ${(R * Math.sin(a1)).toFixed(2)}A${R} ${R} 0 0 1 ${(R * Math.cos(a2)).toFixed(2)} ${(R * Math.sin(a2)).toFixed(2)}`, { stroke: color, 'stroke-width': w }, { d: 0 });
  m.insertBefore(e, m.ball);
  return e;
}

// Turn a molecule so its two hydrogens point as nearly as they can at two targets (H1 at a, H2 at b).
function wAim2(m, [ax, ay], [bx, by]) {
  const { x, y } = st(m), r1 = Math.atan2(ay - y, ax - x) * 180 / Math.PI - W_H1, r2 = Math.atan2(by - y, bx - x) * 180 / Math.PI - W_H2;
  const d = ((r2 - r1 + 540) % 360) - 180;
  return m.pose(x, y, r1 + d / 2);
}

// A hydrogen bond that breaks and re-forms on its own clock: bond i is off for a short spell once every period
// (phase from its index), from t0 on. Returns { on, since } (since: seconds since it last re-formed, for a flash).
function wOnOff(i, t, t0, { period = 2.4, off = .4, seed = 3 } = {}) {
  if (t < t0) return { on: true, since: 99 };
  const P = period * (.75 + .5 * wHash(i, seed)), ph = wHash(i, seed + 1), e = t - t0, u = ((e / P + ph) % 1) * P;
  if (u < off) return { on: false, since: 99 };
  return { on: true, since: e >= (1 - ph) * P || ph * P < off ? u - off : 99 };
}

/* ---------- lesson 3 additions: ions, hydration shells, the volumetric flask ---------- */
WC.solute = '#f2c94c';   // a dissolved solute shown as dots (lesson 3)
WC.oil = '#d9a441';      // oil (hydrophobic)
WC.ice = '#e6f3fb';      // ice seen from outside

// An ion as a flat disc with a small upright face and a charge badge: kind 'Na' (small, +) or 'Cl' (larger, −), in the
// colours wAtom gives sodium and chlorine. Origin at the centre; ion.R is its radius in the parent (s included);
// ion.ring is a dashed ring (o 0) for marking it.
function wIon(p, kind, { x = 0, y = 0, s = 1, o = 1, face = true } = {}) {
  const [fill, edge, R0, sign] = { Na: ['#b28be0', '#7d5bb0', 30, '+'], Cl: ['#7fcf8f', '#4f9a5c', 44, '−'] }[kind];
  const g = G(p, { x, y, s, o });
  const ring = mk('circle', { r: R0 + 14, fill: 'none', stroke: COL.chalk, 'stroke-width': 3, 'stroke-dasharray': '6 6' }, g); put(ring, { o: 0 });
  mk('circle', { r: R0, fill, stroke: edge, 'stroke-width': 3 }, g);
  mk('ellipse', { cx: -R0 * .36, cy: -R0 * .42, rx: R0 * .3, ry: R0 * .18, fill: '#fff', 'fill-opacity': .35 }, g);
  if (face) {
    for (const ex of [-.3, .3]) mk('ellipse', { cx: ex * R0, cy: -R0 * .1, rx: 3.4, ry: 4.4, fill: WC.face }, g);
    path(g, `M${-R0 * .24} ${R0 * .26}q${R0 * .24} ${R0 * .2} ${R0 * .48} 0`, { stroke: WC.face, 'stroke-width': 2.6 });
  }
  const bx = R0 * .72, by = -R0 * .72;
  mk('circle', { cx: bx, cy: by, r: 13, fill: '#0f1e33', stroke: fill, 'stroke-width': 2.5 }, g);
  wLabel(g, sign, { x: bx, y: by + 8, size: 24, weight: 700, o: 1 });
  return Object.assign(g, { kind, sign, R: R0 * s, ring, pose(nx, ny) { put(g, { x: nx, y: ny }); return g; } });
}

// Where water molecule k of n sits in a hydration shell round an ion at (ix, iy), and its turn: around a positive ion the
// oxygen faces in (both hydrogens point out), around a negative ion one hydrogen points in. Returns [x, y, r] for a molecule
// of scale s; gap widens the shell (a molecule arriving), a0 turns the whole ring (degrees).
function wShellSlot(ion, ix, iy, k, n, { s = .6, gap = 0, a0 = 0 } = {}) {
  const a = (a0 + k * 360 / n) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  if (ion.sign === '+') {
    const d = ion.R + s * W_RO + 6 + gap;
    return [ix + d * ca, iy + d * sa, a * 180 / Math.PI - 90];
  }
  const d = ion.R + s * (W_RH + W_OH) + 4 + gap;
  return [ix + d * ca, iy + d * sa, a * 180 / Math.PI + 180 - W_H1];
}

// A volumetric flask, origin at the bottom centre: a round bulb of radius R and a narrow neck with a fill mark.
// f.set(k) fills it, k = 0 empty … 1 up to the mark (the bulb holds the first `bulb` share); f.markY is the mark's y,
// f.levelY(k) the liquid's top at k; f.label is the mark's text (o 0 unless given).
function volFlask(p, { x = 0, y = 0, R = 130, neck = 48, neckH = 230, markAt = 150, fill = WC.water, label = '', size = 26, o = 1, bulb = .9 } = {}) {
  const g = G(p, { x, y, o }), cy = -R, hw = neck / 2, yj = cy - Math.sqrt(R * R - hw * hw), top = -2 * R - neckH, ym = -2 * R - markAt;
  const liq = path(g, '', { fill });
  const sheen = path(g, '', { stroke: '#fff', 'stroke-opacity': .16, 'stroke-width': 6 });
  path(g, `M${-hw} ${top}V${yj.toFixed(1)}A${R} ${R} 0 1 0 ${hw} ${yj.toFixed(1)}V${top}`, { stroke: WC.glass, 'stroke-width': 5 });
  path(g, `M${-R * .5} 0H${R * .5}`, { stroke: WC.glass, 'stroke-width': 7 });
  path(g, `M${-hw - 10} ${ym}H${hw + 10}`, { stroke: COL.chalk, 'stroke-width': 3 });
  const lab = label ? wLabel(g, label, { x: hw + 18, y: ym + size * .35, size, anchor: 'start', fill: COL.chalk, o: 1 }) : null;
  const Ri = R - 5, yb = cy - Ri;
  const levelY = k => k <= bulb ? -5 + (yb + 4 - -5) * (k / bulb) : yb + 4 + (ym - (yb + 4)) * ((k - bulb) / (1 - bulb));
  const f = Object.assign(g, {
    markY: ym, top, R, label: lab, levelY, k: -1,
    set(k) {
      k = Math.max(0, Math.min(1.15, k)); if (k === f.k) return f; f.k = k;
      const yl = levelY(k); let d = '';
      if (k > 0) {
        const ys = Math.max(yl, yb + 1), w = Math.sqrt(Math.max(0, Ri * Ri - (ys - cy) ** 2));
        d = `M${(-w).toFixed(1)} ${ys.toFixed(1)}A${Ri} ${Ri} 0 ${ys < cy ? 1 : 0} 0 ${w.toFixed(1)} ${ys.toFixed(1)}Z`;
        if (yl < yb + 1) d += `M${-hw + 3} ${yl.toFixed(1)}V${(yb + 18).toFixed(1)}H${hw - 3}V${yl.toFixed(1)}Z`;   // same winding as the bulb, so the overlap stays filled
      }
      liq.setAttribute('d', d);
      sheen.setAttribute('d', k > .2 ? `M${(-Ri * .62).toFixed(1)} ${(cy + Ri * .1).toFixed(1)}A${Ri * .7} ${Ri * .7} 0 0 1 ${(-Ri * .2).toFixed(1)} ${(cy - Ri * .55).toFixed(1)}` : '');
      return f;
    },
  });
  return f.set(0);
}

/* ---------- lesson 4 additions: H+, OH−, H3O+ characters, chemistry text, the pH strip, a protein chain ---------- */
WC.acid = '#ff7aa8';   // acid / H+ (style.json)
WC.base = '#6c8cff';   // base / OH−
WC.prot = '#c9a0dc';   // a protein chain's beads
const W_HUP = -90;     // where the third hydrogen of H3O+ sits (local angle, SVG degrees): straight "up" from O
const wPH = h => -Math.log10(h);          // pH of a hydrogen-ion concentration (mol/L)
const wHof = pH => Math.pow(10, -pH);     // hydrogen-ion concentration at a pH
// A number shown to one decimal, the decimal dropped when it is whole: 7 → '7', 8.5 → '8.5', 7.44 → '7.4'.
const wDec = v => { const r = Math.round(v * 10) / 10; return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace('-', '−'); };
// A concentration in powers of ten, as wChem markup: 1e-7 → '1 × 10^{−7}', 3.162e-9 → '3.2 × 10^{−9}'.
function wSci(v) {
  let e = Math.floor(Math.log10(v) + 1e-9), m = Math.round(v / Math.pow(10, e) * 10) / 10;
  if (m >= 10) { m = 1; e += 1; }
  return `${wDec(m)} × 10^{${String(e).replace('-', '−')}}`;
}

// Chemistry text: '^x' or '^{…}' is raised, '_x' or '_{…}' lowered: 'H_3O^+', '10^{−7} M', 'K_{w}'. Letters stay upright.
function wChemParts(str) {
  const out = []; let i = 0, run = '';
  while (i < str.length) {
    const c = str[i];
    if ((c === '^' || c === '_') && i + 1 < str.length) {
      if (run) { out.push([run, 'n']); run = ''; }
      let body;
      if (str[i + 1] === '{') { const j = str.indexOf('}', i + 2); body = str.slice(i + 2, j); i = j + 1; }
      else { body = str[i + 1]; i += 2; }
      out.push([body, c === '^' ? 'sup' : 'sub']);
    } else { run += c; i++; }
  }
  if (run) out.push([run, 'n']);
  return out;
}
// Write chemistry markup into an SVG text element (only when it changes; Firefox repaints on every write).
function wChemSet(t, str) {
  if (t._chem === str) return t;
  t._chem = str; t.textContent = '';
  const size = parseFloat(t.getAttribute('font-size')); let shift = 0;
  for (const [s, k] of wChemParts(str)) {
    const dy = (k === 'sup' ? -.4 : k === 'sub' ? .24 : 0) * size, ts = mk('tspan', {}, t);
    if (dy !== shift) ts.setAttribute('dy', (dy - shift).toFixed(1));
    if (k !== 'n') ts.setAttribute('font-size', (size * .64).toFixed(1));
    ts.textContent = s; shift = dy;
  }
  return t;
}
// A text with chemistry markup on the stage, with wLabel's options (and font).
function wChem(p, str, { x = 0, y = 0, size = 30, fill = COL.chalk, anchor = 'middle', weight = 600, font = UI, o = 0 } = {}) {
  return wChemSet(T(p, '', { x, y, size, fill, anchor, weight, font, o }), str);
}
// The same markup as an HTML span, for question cards (prompts, options, feedback, grid rows).
function wChemEl(str) {
  const s = document.createElement('span');
  for (const [txt, k] of wChemParts(str)) { if (k === 'n') s.append(txt); else { const e = document.createElement(k); e.textContent = txt; s.append(e); } }
  return s;
}

// An ion character in the water molecule's own frame (so a water and its ion line up exactly when one replaces the
// other): kind 'H+' (a bare proton: a hydrogen ball), 'OH-' (O with one H, at H2's place), 'H3O+' (water plus a third H
// "up" from O, W_HUP), or 'H2O' (a plain water built the same way, unmarked). A marked ion shows a ring in its meaning's
// colour (pink H+, indigo OH−) and a charge badge; marked: false starts them hidden (o 0) to show later.
// ion.pose(x, y, r) keeps face and badge upright; ion.atom('O' | i) is hydrogen i's point in the parent (i indexes
// .balls); .sticks[i] / .balls[i] are each hydrogen's stick and ball (to hide one that leaves, or show one that arrives).
function wIonChar(p, kind, { x = 0, y = 0, r = 0, s = 1, o = 1, face = true, marked, ring, sign, badge } = {}) {
  const K = { 'H+': [[], WC.acid, '+'], 'OH-': [[W_H2], WC.base, '−'], 'H3O+': [[W_H1, W_H2, W_HUP], WC.acid, '+'], 'H2O': [[W_H1, W_H2], WC.base, ''] }[kind];
  const proton = kind === 'H+', col = ring ?? K[1], sg = sign ?? K[2];
  marked ??= kind !== 'H2O';
  const g = G(p, { x, y, r, s, o });
  const rg = mk('circle', { r: proton ? W_RH + 13 : W_OH + W_RH + 10, fill: col, 'fill-opacity': .13, stroke: col, 'stroke-width': proton ? 3 : 3.5 }, g);
  put(rg, { o: marked ? 1 : 0 });
  const hp = K[0].map(a => [W_OH * Math.cos(a * Math.PI / 180), W_OH * Math.sin(a * Math.PI / 180)]);
  const sticks = hp.map(([hx, hy]) => path(g, `M0 0L${hx.toFixed(2)} ${hy.toFixed(2)}`, { stroke: WC.stick, 'stroke-width': 9 }));
  const hBall = (q, cx, cy) => { const b = G(q, { x: cx, y: cy }); mk('circle', { r: W_RH, fill: WC.H, stroke: WC.Hedge, 'stroke-width': 2 }, b); mk('circle', { cx: -5, cy: -6, r: 5, fill: '#fff' }, b); return b; };
  const balls = hp.map(([hx, hy]) => hBall(g, hx, hy));
  if (proton) hBall(g, 0, 0);
  else { mk('circle', { r: W_RO, fill: WC.O, stroke: WC.Oedge, 'stroke-width': 2.5 }, g); mk('ellipse', { cx: -11, cy: -13, rx: 9, ry: 5.5, fill: '#fff', 'fill-opacity': .35 }, g); }
  const up = G(g, { r: -r });
  if (face && proton) {
    for (const ex of [-5, 5]) mk('ellipse', { cx: ex, cy: -1, rx: 2.2, ry: 2.9, fill: WC.face }, up);
    path(up, 'M-4 5q4 3.4 8 0', { stroke: WC.face, 'stroke-width': 2 });
  } else if (face) {
    for (const ex of [-9, 9]) mk('ellipse', { cx: ex, cy: -3, rx: 3.6, ry: 4.6, fill: WC.face }, up);
    path(up, 'M-7 8q7 6 14 0', { stroke: WC.face, 'stroke-width': 2.6 });
  }
  const [bx, by] = badge ?? (proton ? [W_RH + 8, -W_RH - 8] : [W_RO + 12, -W_RO - 12]);
  const bd = G(up, { x: bx, y: by, o: marked && sg ? 1 : 0 });
  mk('circle', { r: proton ? 11 : 13, fill: '#0f1e33', stroke: col, 'stroke-width': 2.5 }, bd);
  wLabel(bd, sg || '+', { y: proton ? 7 : 8, size: proton ? 21 : 24, weight: 700, fill: col, o: 1 });
  const ion = Object.assign(g, {
    kind, sign: sg, ring: rg, badge: bd, sticks, balls, up, R: (proton ? W_RH : W_OH + W_RH) * s,
    pose(nx = st(g).x, ny = st(g).y, nr = st(g).r) { put(g, { x: nx, y: ny, r: nr }); put(up, { r: -nr }); return ion; },
    atom(k) {
      const { x: gx, y: gy, r: gr, s: gs } = st(g), a = gr * Math.PI / 180, [lx, ly] = k === 'O' ? [0, 0] : hp[k];
      return [gx + gs * (lx * Math.cos(a) - ly * Math.sin(a)), gy + gs * (lx * Math.sin(a) + ly * Math.cos(a))];
    },
  });
  return ion;
}

// The pH scale as a horizontal strip, pink (acidic) through cream (neutral) to indigo (basic), with a tick and number at
// every `step`. strip.at(pH) is the x of a pH; strip.marker({ color, fmt, above }) a pointer with a readout that
// marker.set(pH) moves (writes only on change); strip.band(a, b, { color }) a translucent band over a..b (o 0).
// Strips over the same range share a gradient id (the same stops), so seeking and stepping build identical pages.
const W_PH_STOPS = [[0, WC.acid], [7, '#f2efe6'], [14, WC.base]];
function wPHColour(v) {
  const k = Math.max(0, Math.min(14, v)), i = k < 7 ? 0 : 1, [a, ca] = W_PH_STOPS[i], [b, cb] = W_PH_STOPS[i + 1];
  return mix(ca, cb, (k - a) / (b - a));
}
function pHStrip(p, { x = 170, y = 300, w = 1260, h = 36, min = 0, max = 14, step = 1, size = 24, numbers = true, o = 1, fade = .8, label = '' } = {}) {
  const g = G(p, { o }), at = v => x + (v - min) / (max - min) * w, id = `wph-${min}-${max}`;   // from what it shows, so every rebuild draws the same page (strips alike share one look)
  const lg = mk('linearGradient', { id, x1: 0, x2: 1, y1: 0, y2: 0 }, mk('defs', {}, g));
  for (let k = 0; k <= 8; k++) mk('stop', { offset: k / 8, 'stop-color': wPHColour(min + (max - min) * k / 8) }, lg);
  const bar = mk('rect', { x, y: y - h / 2, width: w, height: h, rx: h / 2, fill: `url(#${id})`, 'fill-opacity': fade }, g);
  let tk = ''; for (let v = min; v <= max + 1e-9; v += step) tk += `M${at(v).toFixed(1)} ${y + h / 2 + 4}v12`;
  path(g, tk, { stroke: COL.dim, 'stroke-width': 2.5 });
  const nums = [];
  if (numbers) for (let v = min; v <= max + 1e-9; v += step) nums.push(wLabel(g, wDec(v), { x: at(v), y: y + h / 2 + 18 + size, size, fill: COL.dim, weight: 500, o: 1 }));
  if (label) wLabel(g, label, { x: x - 22, y: y + size * .36, size: size + 4, anchor: 'end', fill: COL.dim, weight: 600, o: 1 });
  const strip = Object.assign(g, {
    at, y, h, x, w, bar, nums,
    marker({ color = COL.chalk, fmt = v => 'pH ' + wDec(v), above = true, size: ms = 28, o: mo = 0 } = {}) {
      const sd = above ? -1 : 1, m = G(g, { x: at(min), o: mo }), ty = y + sd * (h / 2 + 6);
      path(m, `M-13 ${ty + sd * 20}L13 ${ty + sd * 20}L0 ${ty}Z`, { fill: color, stroke: COL.board, 'stroke-width': 2 });
      const read = wChem(m, '', { y: above ? ty - 32 : ty + 32 + ms * .8 + (numbers ? size + 18 : 0), size: ms, fill: color, weight: 700, o: 1 });
      return Object.assign(m, { read, v: null, set(v) { if (v !== m.v) { m.v = v; put(m, { x: at(v) }); wChemSet(read, fmt(v)); } return m; } });
    },
    band(a, b, { color = '#8fd6b0', pad = 16, o: bo = 0 } = {}) {
      return put(mk('rect', { x: at(a), y: y - h / 2 - pad, width: at(b) - at(a), height: h + 2 * pad, rx: 10, fill: color, 'fill-opacity': .22, stroke: color, 'stroke-width': 3 }, g), { o: bo });
    },
  });
  return strip;
}

// A protein as a chain of 16 beads: fold 1 is a compact 4 × 4 snake held by five +/− pairs (dashed attraction lines),
// fold 0 a loose wavy string. pr.set(fold, t, { off, apart }) poses it from fold and t alone (a small jiggle); `off` lists beads
// whose charge is cancelled (their pair's line goes). pr.bead(i) is bead i's point in the parent after set; pr.signs[i]
// the sign on a charged bead; pr.beads (one path) takes a c_fill tween to grey it.
function wProtein(p, { x = 0, y = 0, s = 1, o = 1, sp = 56, r = 21, color = WC.prot, seed = 5 } = {}) {
  const g = G(p, { x, y, s, o }), n = 16, folded = [], loose = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 4), c = row % 2 ? 3 - i % 4 : i % 4;
    folded.push([(c - 1.5) * sp, (row - 1.5) * sp]);
    loose.push([(i - 7.5) * sp * .98, .9 * sp * Math.sin(i * .9 + .4)]);
  }
  const CH = { 0: '+', 7: '−', 2: '−', 5: '+', 8: '+', 15: '−', 10: '−', 13: '+', 6: '−', 9: '+' }, PAIRS = [[0, 7], [2, 5], [8, 15], [10, 13], [6, 9]];
  const back = path(g, '', { stroke: '#9a7fb0', 'stroke-width': 9, 'stroke-linejoin': 'round' });
  const links = path(g, '', { stroke: COL.chalk, 'stroke-width': 2.5, 'stroke-dasharray': '5 6', 'stroke-opacity': .75 });
  const beads = path(g, '', { fill: color, stroke: '#7d5f96', 'stroke-width': 2.5 }); put(beads, { c_fill: color });
  const signs = {};
  for (const i in CH) signs[i] = wLabel(g, CH[i], { size: 30, weight: 800, fill: '#2a1640', o: 1 });
  const pos = [];
  const pr = Object.assign(g, {
    folded, loose, charges: CH, pairs: PAIRS, beads, back, links, signs, pos,
    // apart: true pushes beads that would overlap mid-fold apart (to 2r), so their signs never sit on each other
    set(fold, t = 0, { off = [], apart = false } = {}) {
      let db = '', dl = '', dd = '';
      for (let i = 0; i < n; i++) {
        const [ax, ay] = loose[i], [bx, by] = folded[i];
        const jx = 2.5 * Math.sin(1.7 * t + 2.1 * i + seed), jy = 2.5 * Math.sin(1.3 * t + 1.4 * i + seed);
        pos[i] = [ax + (bx - ax) * fold + jx, ay + (by - ay) * fold + jy];
      }
      if (apart) for (let k = 0; k < 4; k++) for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const dx = pos[j][0] - pos[i][0], dy = pos[j][1] - pos[i][1], d = Math.hypot(dx, dy) || 1e-6, need = 2 * r + 2;
        if (d < need) { const f = (need - d) / 2 / d; pos[i][0] -= dx * f; pos[i][1] -= dy * f; pos[j][0] += dx * f; pos[j][1] += dy * f; }
      }
      for (let i = 0; i < n; i++) {
        const [px, py] = pos[i];
        db += `M${(px - r).toFixed(1)} ${py.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
        dd += (i ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1);
        if (signs[i]) { const sx = +px.toFixed(1), sy = +(py + 10).toFixed(1), q = st(signs[i]); if (q.x !== sx || q.y !== sy) put(signs[i], { x: sx, y: sy }); }
      }
      for (const [a, b] of PAIRS) {
        if (off.includes(a) || off.includes(b)) continue;
        const [ax, ay] = pos[a], [bx, by] = pos[b];
        if (Math.hypot(bx - ax, by - ay) < 1.45 * sp) dl += `M${ax.toFixed(1)} ${(ay + r * Math.sign(by - ay)).toFixed(1)}L${bx.toFixed(1)} ${(by - r * Math.sign(by - ay)).toFixed(1)}`;
      }
      for (const [e, d] of [[beads, db], [back, dd], [links, dl]]) if (e._d !== d) e.setAttribute('d', e._d = d);
      return pr;
    },
    bead(i) { const { x: gx, y: gy, s: gs } = st(g); return [gx + gs * pos[i][0], gy + gs * pos[i][1]]; },
  });
  return pr.set(1);
}

/* ---------- lesson 5 additions: a weak acid that lets go of its H+ and takes it back, a fraction bar, ammonia ---------- */
// The share of a weak acid present as its conjugate base at a pH (Henderson–Hasselbalch; used to draw, not taught).
const wBaseFrac = (pH, pKa) => 1 / (1 + Math.pow(10, pKa - pH));
// The share of a weak acid of constant Ka that dissociates at concentration C (mol/L), from Ka = x² / (C − x).
const wSplitFrac = (Ka, C) => (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * C)) / 2 / C;

// A weak acid as a character: a round body with a small face and one acidic hydrogen on a stick (HA). Without its proton
// it is the conjugate base (A−): the body turns from acid pink to base indigo and a − badge shows (style.json meanings).
// a.hold(k): 1 holds the H (HA), 0 has let it go (A−); in between blends (writes only on change). a.hp() is the H's point
// in the parent, where a leaving H+ (wIonChar 'H+' at the same s) starts and an arriving one lands; aH is its angle
// (SVG degrees). a.ring is a dashed ring (o 0) for marking it; a.pose(x, y).
function wAcid(p, { x = 0, y = 0, s = 1, o = 1, held = 1, aH = -35, R = 36, face = true } = {}) {
  const g = G(p, { x, y, s, o }), L = R + 22, ax = L * Math.cos(aH * Math.PI / 180), ay = L * Math.sin(aH * Math.PI / 180);
  const ring = mk('circle', { r: L + W_RH + 8, fill: 'none', stroke: COL.chalk, 'stroke-width': 3, 'stroke-dasharray': '6 6' }, g); put(ring, { o: 0 });
  const hg = G(g);
  path(hg, `M0 0L${ax.toFixed(1)} ${ay.toFixed(1)}`, { stroke: WC.stick, 'stroke-width': 9 });
  const hb = G(hg, { x: ax, y: ay });
  mk('circle', { r: W_RH, fill: WC.H, stroke: WC.Hedge, 'stroke-width': 2 }, hb); mk('circle', { cx: -5, cy: -6, r: 5, fill: '#fff' }, hb);
  const body = mk('circle', { r: R, 'stroke-width': 3 }, g);
  mk('ellipse', { cx: -R * .34, cy: -R * .4, rx: R * .28, ry: R * .17, fill: '#fff', 'fill-opacity': .35 }, g);
  if (face) {
    for (const ex of [-.28, .28]) mk('ellipse', { cx: ex * R, cy: -R * .08, rx: 3.6, ry: 4.6, fill: WC.face }, g);
    path(g, `M${-R * .22} ${R * .26}q${R * .22} ${R * .18} ${R * .44} 0`, { stroke: WC.face, 'stroke-width': 2.6 });
  }
  const bd = G(g, { x: -aH > 90 || aH < -90 ? R * .78 : -R * .78, y: -R * .78 });
  mk('circle', { r: 13, fill: '#0f1e33', stroke: WC.base, 'stroke-width': 2.5 }, bd);
  wLabel(bd, '−', { y: 8, size: 24, weight: 700, fill: WC.base, o: 1 });
  const a = Object.assign(g, {
    ring, body, badge: bd, hgroup: hg, R: R * s, k: null,
    hold(k) {
      k = Math.round(Math.max(0, Math.min(1, k)) * 1000) / 1000; if (k === a.k) return a; a.k = k;
      const f = mix(WC.base, WC.acid, k);
      body.setAttribute('fill', f); body.setAttribute('stroke', mix(f, '#000000', .3));
      put(hg, { o: k }); put(bd, { o: 1 - k });
      return a;
    },
    hp() { const { x: gx, y: gy, s: gs } = st(g); return [gx + gs * ax, gy + gs * ay]; },
    pose(nx, ny) { put(g, { x: nx, y: ny }); return a; },
  });
  return a.hold(held);
}

// A bar split in two: the acid form (pink, left) and the conjugate base (indigo, right), with each share in percent
// beside its end. bar.set(f) takes the base's share 0..1 (writes only on change); names are wChem markup.
function wFracBar(p, { x = 0, y = 0, w = 800, h = 56, size = 30, o = 1, names = ['HA', 'A^−'] } = {}) {
  const g = G(p, { o });
  mk('rect', { x: x - 4, y: y - h / 2 - 4, width: w + 8, height: h + 8, rx: 10, fill: '#0b1626', stroke: COL.faint, 'stroke-width': 2 }, g);
  const ra = mk('rect', { x, y: y - h / 2, height: h, fill: WC.acid }, g), rb = mk('rect', { y: y - h / 2, height: h, fill: WC.base }, g);
  const ta = wChem(g, '', { x: x - 18, y: y + size * .36, size, anchor: 'end', fill: WC.acid, weight: 700, o: 1 });
  const tb = wChem(g, '', { x: x + w + 18, y: y + size * .36, size, anchor: 'start', fill: WC.base, weight: 700, o: 1 });
  const bar = Object.assign(g, {
    f: null,
    set(f) {
      f = Math.round(Math.max(0, Math.min(1, f)) * 2000) / 2000; if (f === bar.f) return bar; bar.f = f;
      const wa = (w * (1 - f)).toFixed(1);
      ra.setAttribute('width', wa); rb.setAttribute('x', (x + +wa).toFixed(1)); rb.setAttribute('width', (w * f).toFixed(1));
      wChemSet(ta, `${names[0]} ${Math.round(100 * (1 - f))} %`); wChemSet(tb, `${names[1]} ${Math.round(100 * f)} %`);
      return bar;
    },
  });
  return bar.set(.5);
}

// Ammonia (NH3, a weak base) or, with plus, ammonium (NH4+, its conjugate acid): N with three hydrogens (local angles
// 30, 90, 150) and a fourth "up" (−90) when plus. ring colours a marking ring (o 0 unless marked).
function wAmmonia(p, { x = 0, y = 0, s = 1, o = 1, plus = false, ring = plus ? WC.acid : WC.base, marked = true } = {}) {
  const g = G(p, { x, y, s, o });
  const rg = mk('circle', { r: W_OH + W_RH + 10, fill: ring, 'fill-opacity': .13, stroke: ring, 'stroke-width': 3.5 }, g); put(rg, { o: marked ? 1 : 0 });
  for (const a of plus ? [30, 90, 150, -90] : [30, 90, 150]) {
    const hx = W_OH * Math.cos(a * Math.PI / 180), hy = W_OH * Math.sin(a * Math.PI / 180);
    path(g, `M0 0L${hx.toFixed(1)} ${hy.toFixed(1)}`, { stroke: WC.stick, 'stroke-width': 9 });
    const b = G(g, { x: hx, y: hy }); mk('circle', { r: W_RH, fill: WC.H, stroke: WC.Hedge, 'stroke-width': 2 }, b); mk('circle', { cx: -5, cy: -6, r: 5, fill: '#fff' }, b);
  }
  mk('circle', { r: 32, fill: '#7f90bd', stroke: '#56658f', 'stroke-width': 3 }, g);
  mk('ellipse', { cx: -11, cy: -13, rx: 9, ry: 5.5, fill: '#fff', 'fill-opacity': .35 }, g);
  wLabel(g, 'N', { y: 10, size: 28, weight: 700, fill: '#fff', o: 1 });
  if (plus) { const bd = G(g, { x: 44, y: -44 }); mk('circle', { r: 13, fill: '#0f1e33', stroke: ring, 'stroke-width': 2.5 }, bd); wLabel(bd, '+', { y: 8, size: 24, weight: 700, fill: ring, o: 1 }); }
  return Object.assign(g, { ring: rg });
}
