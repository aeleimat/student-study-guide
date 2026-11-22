'use strict';
// Large Biological Molecules (chapter 5): the book's element library for polymers and nucleic acids, loaded after
// engine.js and water.js (it uses waterMolecule, wLabel and WC). Every piece is drawn around its own origin and placed
// with put; each animated element has a set-style method that poses everything from its arguments alone (call it from
// prog(k => …) or clockRun), so replay and seek draw the same frame. Attributes are written only when they change.
//
// Exports (all lengths at s = 1; "parent" = the coordinates of the group you passed as p):
//   MC                                   chapter 5 colours (P, sugar, A G C T U, env, ribo, enzyme, hi, flash, newInk …)
//   mRamp(k, a, b) / mBump(k, a, b)      0→1 between a and b / a 0→1→0 hump between a and b
//   mComp(seq, rna) / mPair(b, rna)      reverse complement 5′→3′ ('ATGC' → 'GCAT') / one partner base
//   mArrow(p, [x1,y1], [x2,y2], {color, w, head, o})     a plain straight arrow
//   monomerBead(p, kind, {x, y, s, o, R=34, tags, label}) kind 'circle'|'square'|'hex'|'diamond'|'amino'; .tags(onL, onR)
//       shows the "HO" chip (left) and "H" chip (right); .tagL/.tagR/.stickL/.stickR, .ring (o 0), .R
//   enzyme(p, {x, y, s, o, R=60, dir=90}) a flat olive pac-man clamp, mouth toward dir (deg); .bite(open 0..1), .pose(x, y)
//   polymerChain(p, {x, y, s, o, n=4, kinds, R, bond=30, enzyme, water=.62, apart=90}) a row of n beads centred on x;
//       .show(m) m beads bonded (HO on the left end, H on the right); .dehydrate(i, k) bead i joins bead i−1 (k 0..1:
//       it arrives, H + OH leave as a waterMolecule that ends below the bond, the new bond flashes cream);
//       .hydrolyse(i, k) the bond i−1|i of the full chain breaks (water arrives, bond flashes and goes, H to bead i−1,
//       OH to bead i, beads ≥ i slide `apart` right). .beads, .bonds[j] (bond j joins j−1 and j), .waters[j], .enzyme
//       (with enzyme: true, it comes in above the bond for the reaction and leaves), .at(j) bead centre in parent,
//       .mid(j) bond j's middle in parent. Waters show only while their reaction is the one being set.
//   baseShape(p, letter, {x, y, s, o, dir=0, a=26, size}) origin = where it attaches to the sugar; dir 0 points it +x
//       (180 left, 90 down; the letter stays upright). Purines A G: 5-ring + 6-ring (length 3.27a), pyrimidines C T U:
//       one 6-ring (1.73a). .L, .purine, .ring (o 0), .body, .text, .tip() its far end in parent
//   nucleotide(p, {base, sugar:'deoxy'|'ribo', x, y, s, o, flip, nums, ink, oh3=true}) origin = sugar centre.
//       Phosphate above-left on C5′, base to the right on C1′, 3′ OH below C3′, 2′ OH (ribo) or 2′ H (deoxy) below C2′.
//       flip turns it 180° (antiparallel partner) with upright text. Pieces .phosphate .sugar .base (groups, put x/y to
//       move one), .bs (the baseShape), .links {P, B} (P–C5′ and C1′–base sticks), .rings {phosphate, sugar, base} (o 0),
//       .nums (1′–5′, o 0 unless nums), .oh3 .oh2; .split(k) pulls the three pieces apart (links fade);
//       .enclose('nucleoside'|'nucleotide', {label, color, size}) a dashed box (o 0) round sugar+base or all three, at
//       the pieces' current places, label under it; .pt(key) in parent: 'P' 'C5' 'C3' 'C1' 'O3' 'B' 'tip' 'S'
//   polynucleotide(p, {seq, sugar, x, y, s, o, flip, step=206, nums, ink, ends=true, size=34}) a vertical strand,
//       5′ end at (x, y) going down (flip: going up, bases to the left). Nucleotide i's sugar is at y ± i·step.
//       .grow(m) m nucleotides (m = 3.4: three plus the 4th arriving at the 3′ end, its phosphodiester link forming
//       and flashing); .nucs[i], .link(i) the orange highlight (o 0) of the 3′ O–P link between i and i+1,
//       .spine (o 0) a soft band over the sugar-phosphate backbone, .lab5/.lab3 end labels, .pt(i, key) in parent,
//       .place(i, dx, dy, o) + .linkOn(i, v) + .refresh() for custom motion. A free 3′ OH shows only where no link is.
//   dnaLadder(p, {seq, x=800, y=200, s=.6, o, step, half=190, perRow=40, D=270, arrows, size}) origin = middle of the
//       top row; left strand 5′→3′ down (seq), right strand its complement running up; A–T two and G–C three dashed cyan
//       H-bonds; 5′/3′ labels on all four ends and direction arrows. .twist(k) fades to a schematic projected double
//       helix (ribbons + two-colour rungs, perRow° of turn per row); .unzip(k, {dock=true}) the strands part from the
//       top (D each way) and new complementary nucleotides (MC.newInk backbone) rise into place and pair.
//       .left .right .newL .newR (polynucleotides), .hb[r], .labels {L5, L3, R5, R3}, .arrows, .detail, .schema
//   ribosome(p, {x, y, s, o}) large and small grey-lavender lobes; .split(k) parts them; .pt('site'|'exit') in parent
//       (site: where mRNA threads between the lobes, exit: top of the large lobe)
//   mRNA(p, {seq, x, y, s, o, step=46, a=13, ends}) a thin horizontal strand, 5′ end at (x, y), small ribose pentagons on
//       the line, bases hanging down; .reveal(k) shows the first k·n nucleotides (transcription); .at(i) sugar i in parent
//   polypeptide(p, {n=10, x, y, s, o, dir=-90, sp=40, r=15}) amino-acid beads leaving (x, y) along dir;
//       .set(m) m beads made (fractional: the newest joins at the origin and pushes the rest out)
//   cellScene(p, {x=800, y=450, w=1360, h=780, s, o, pores=6, ribos=6}) a flat cell: membrane, cytoplasm, nucleus
//       (double envelope with pores) on the left, chromatin DNA inside, ribosomes on the right. .nucleus {x, y, R} (local),
//       .pore(i) in parent (pore 0 faces right), .ribosomes, .dna, .envelope, .pt(lx, ly) local → parent

const MC = {
  P: '#bba8ee', Pedge: '#8a74cf', sugar: '#f3c95c', sugarEdge: '#b8902e', ink: '#14233a', oh: '#ffb3a6',
  A: '#f07a6a', G: '#8fd6b0', C: '#6c8cff', T: '#ffd27a', U: '#f39a2b',
  hbond: '#5fd3e8', env: '#5b82b8', nucleo: '#122844', cyto: '#183457', membrane: '#8fb0d6',
  ribo: '#aa9fc6', riboDk: '#8d82b0', riboEdge: '#6d6390', enzyme: '#a8c66c', enzymeEdge: '#6f8a3d',
  flash: '#fff6d8', newInk: '#bfe8d4', hi: '#f39a2b', dna: '#e9dcc0',
};
const mClamp = v => Math.max(0, Math.min(1, v));
const mRamp = (k, a, b) => mClamp((k - a) / (b - a));
const mBump = (k, a, b) => { const u = (k - a) / (b - a); return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u); };
const mLerp = (a, b, k) => a + (b - a) * k;
const mR1 = v => Math.round(v * 10) / 10;
const mPair = (b, rna = false) => ({ A: rna ? 'U' : 'T', T: 'A', U: 'A', G: 'C', C: 'G' })[b];
const mComp = (seq, rna = false) => [...seq].reverse().map(b => mPair(b, rna)).join('');
const mSeg = ([a, b], [c, d]) => `M${a.toFixed(1)} ${b.toFixed(1)}L${c.toFixed(1)} ${d.toFixed(1)}`;
function mD(e, d) { if (e._d !== d) e.setAttribute('d', e._d = d); return e; }
// Pose x, y, o (rounded) only when they change.
function mPose(e, x, y, o = st(e).o) {
  const X1 = mR1(x), Y1 = mR1(y), O1 = Math.round(o * 1000) / 1000, s = st(e);
  if (s.x !== X1 || s.y !== Y1 || s.o !== O1) put(e, { x: X1, y: Y1, o: O1 });
  return e;
}
function mO(e, o) { const O1 = Math.round(o * 1000) / 1000; if (st(e).o !== O1) put(e, { o: O1 }); return e; }
function mPoly(n, r, a0 = -90, cx = 0, cy = 0) {
  let d = '';
  for (let i = 0; i < n; i++) { const a = (a0 + i * 360 / n) * Math.PI / 180; d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2); }
  return d + 'Z';
}
// a point in a group's frame → its parent's (translate and scale only)
const mOut = (g, [lx, ly]) => { const { x, y, s } = st(g); return [x + s * lx, y + s * ly]; };

function mArrow(p, [x1, y1], [x2, y2], { color = COL.chalk, w = 6, head = 18, o = 1 } = {}) {
  const g = G(p, { o }), L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
  path(g, `M${x1} ${y1}L${(x2 - ux * head * .8).toFixed(1)} ${(y2 - uy * head * .8).toFixed(1)}`, { stroke: color, 'stroke-width': w });
  path(g, `M${(x2 - ux * head - uy * head * .7).toFixed(1)} ${(y2 - uy * head + ux * head * .7).toFixed(1)}L${x2} ${y2}L${(x2 - ux * head + uy * head * .7).toFixed(1)} ${(y2 - uy * head - ux * head * .7).toFixed(1)}Z`, { fill: color, stroke: color, 'stroke-width': 2 });
  return g;
}

// A small dark pill with coloured letters: parts [[str, colour], …]; origin at its centre; .w its width.
function mChip(p, parts, { x = 0, y = 0, size = 24, edge = COL.chalk, o = 1 } = {}) {
  const g = G(p, { x, y, o }), w = Math.round(parts.reduce((a, [s]) => a + uiW(s, size), 0) + 18), h = size + 10;
  mk('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: '#0b1626', stroke: edge, 'stroke-width': 2.5 }, g);
  const t = T(g, '', { y: size * .36, size, weight: 700, anchor: 'middle', o: 1 });
  for (const [s, c] of parts) { const ts = mk('tspan', { fill: c }, t); ts.textContent = s; }
  return Object.assign(g, { w, h });
}

/* ---------- monomerBead: a generic building block ---------- */
const M_BEAD = { circle: ['#f4a48c', '#c4705a'], square: ['#86c9e8', '#4f93b5'], hex: ['#8fd6b0', '#56a47e'], diamond: ['#e8a0c8', '#b56b95'], amino: ['#c9a0dc', '#8f68a6'] };
function mBeadPath(kind, R) {
  if (kind === 'square') { const h = R * .86, c = R * .3; return `M${-h + c} ${-h}H${h - c}Q${h} ${-h} ${h} ${-h + c}V${h - c}Q${h} ${h} ${h - c} ${h}H${-h + c}Q${-h} ${h} ${-h} ${h - c}V${-h + c}Q${-h} ${-h} ${-h + c} ${-h}Z`; }
  if (kind === 'hex') return mPoly(6, R * 1.04, 0);
  if (kind === 'diamond') return mPoly(4, R * 1.14, -90);
  const r = kind === 'amino' ? R * .9 : R;
  return `M${-r} 0a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
}
function monomerBead(p, kind = 'circle', { x = 0, y = 0, s = 1, o = 1, R = 34, tags = false, label = '', size } = {}) {
  const [fill, edge] = M_BEAD[kind] || M_BEAD.circle, g = G(p, { x, y, s, o }), d = mBeadPath(kind, R);
  const ring = path(g, d, { stroke: MC.hi, 'stroke-width': 12 }, { o: 0 });
  const stickL = path(g, `M${-R + 4} 0H${-R - 12}`, { stroke: WC.stick, 'stroke-width': 6 });
  const stickR = path(g, `M${R - 4} 0H${R + 12}`, { stroke: WC.stick, 'stroke-width': 6 });
  const tagL = mChip(g, [['H', '#f4f4f0'], ['O', '#ff8f7d']], { edge: '#ff8f7d' });
  const tagR = mChip(g, [['H', '#f4f4f0']], { edge: '#c9c9c0' });
  tagL.hx = -R - 10 - tagL.w / 2; tagR.hx = R + 10 + tagR.w / 2;
  put(tagL, { x: tagL.hx }); put(tagR, { x: tagR.hx });
  path(g, d, { fill, stroke: edge, 'stroke-width': 3 });
  mk('ellipse', { cx: -R * .34, cy: -R * .4, rx: R * .28, ry: R * .16, fill: '#fff', 'fill-opacity': .3 }, g);
  if (label) wLabel(g, label, { y: (size ?? 24) * .36, size: size ?? 24, fill: MC.ink, weight: 700, o: 1 });
  const b = Object.assign(g, {
    kind, R, ring, tagL, tagR, stickL, stickR,
    tags(onL = true, onR = onL) {
      mPose(tagL, tagL.hx, 0, onL ? 1 : 0); mO(stickL, onL ? 1 : 0);
      mPose(tagR, tagR.hx, 0, onR ? 1 : 0); mO(stickR, onR ? 1 : 0);
      return b;
    },
    pose(nx, ny) { mPose(g, nx, ny); return b; },
  });
  return b.tags(tags);
}

/* ---------- enzyme: a flat clamp that sits at a bond ---------- */
function enzyme(p, { x = 0, y = 0, s = 1, o = 1, R = 60, dir = 90 } = {}) {
  const g = G(p, { x, y, s, o }), body = G(g, { r: dir - 90 });
  const shape = path(body, '', { fill: MC.enzyme, stroke: MC.enzymeEdge, 'stroke-width': 3.5 });
  mk('ellipse', { cx: -R * .35, cy: -R * .45, rx: R * .26, ry: R * .14, fill: '#fff', 'fill-opacity': .25 }, body);
  mk('circle', { cx: R * .42, cy: -R * .3, r: 5, fill: '#24300f' }, body);
  const e = Object.assign(g, {
    R, shape, open: -1,
    bite(open = 1) {
      open = Math.round(mClamp(open) * 200) / 200; if (open === e.open) return e; e.open = open;
      const h = (10 + 30 * open) * Math.PI / 180, a1 = Math.PI / 2 + h, a2 = Math.PI / 2 - h;
      shape.setAttribute('d', `M0 ${R * .15}L${(R * Math.cos(a1)).toFixed(1)} ${(R * Math.sin(a1)).toFixed(1)}A${R} ${R} 0 1 1 ${(R * Math.cos(a2)).toFixed(1)} ${(R * Math.sin(a2)).toFixed(1)}Z`);
      return e;
    },
    pose(nx, ny) { mPose(g, nx, ny); return e; },
  });
  return e.bite(1);
}

/* ---------- polymerChain: beads joined by dehydration, split by hydrolysis ---------- */
function polymerChain(p, { x = 0, y = 0, s = 1, o = 1, n = 4, kinds = ['circle', 'square', 'hex', 'diamond'], R = 34, bond = 30, enzyme: withEnz = false, water = .62, apart = 90 } = {}) {
  const g = G(p, { x, y, s, o }), sp = 2 * R + bond, X0 = j => (j - (n - 1) / 2) * sp;
  const enzL = G(g), bondL = G(g), fxL = G(g), beadL = G(g), topL = G(g);
  const bonds = [], flashes = [], waters = [];
  for (let j = 0; j < n; j++) {
    bonds.push(path(bondL, '', { stroke: WC.stick, 'stroke-width': 10 }, { o: 0 }));
    flashes.push(put(mk('ellipse', { rx: 36, ry: 24, fill: MC.flash, 'fill-opacity': .7 }, fxL), { o: 0 }));
    waters.push(waterMolecule(topL, { s: water, o: 0 }));
  }
  const beads = Array.from({ length: n }, (_, j) => monomerBead(beadL, kinds[j % kinds.length], { x: X0(j), R, tags: true }));
  const enz = withEnz ? enzyme(enzL, { o: 0, R: 58 }) : null;
  const pos = beads.map((_, j) => [X0(j), 0]);
  // Each frame stages what every element should show, then writes each one once, only where it changed.
  const want = new Map(), W = (e, v) => want.set(e, Object.assign(want.get(e) || {}, v));
  function flush() {
    for (const [e, v] of want) {
      const s0 = st(e), nv = {};
      let ch = false;
      for (const key in v) { const r = key === 'o' || key === 's' ? Math.round(v[key] * 1000) / 1000 : mR1(v[key]); if (s0[key] !== r) { nv[key] = r; ch = true; } }
      if (ch) put(e, nv);
    }
    want.clear();
  }
  const tagsOn = (b, onL, onR) => { W(b.tagL, { x: b.tagL.hx, y: 0, o: onL ? 1 : 0 }); W(b.stickL, { o: onL ? 1 : 0 }); W(b.tagR, { x: b.tagR.hx, y: 0, o: onR ? 1 : 0 }); W(b.stickR, { o: onR ? 1 : 0 }); };
  const tagTo = (b, tag, [px, py], oo) => W(tag, { x: px - pos[beads.indexOf(b)][0], y: py - pos[beads.indexOf(b)][1], o: oo });   // a tag to a point of the chain
  function base(m) {
    beads.forEach((b, j) => { pos[j] = [X0(j), 0]; W(b, { x: X0(j), y: 0, o: j < m ? 1 : 0 }); tagsOn(b, false, false); });
    if (m > 0) { tagsOn(beads[0], true, m === 1); tagsOn(beads[m - 1], m === 1, true); }
    waters.forEach(w => W(w, { o: 0 })); flashes.forEach(f => W(f, { o: 0 }));
    if (enz) W(enz, { o: 0 });
  }
  function drawBonds(vis) {
    for (let j = 1; j < n; j++) { W(bonds[j], { o: vis(j) }); mD(bonds[j], mSeg([pos[j - 1][0] + R - 4, 0], [pos[j][0] - R + 4, 0])); }
  }
  function enzAt(bx, k, tIn, tBite, tOut) {
    if (!enz) return;
    const a = io(mRamp(k, tIn, tIn + .2)), l = io(mRamp(k, tOut, tOut + .15));
    W(enz, { x: bx, y: -R - 22 - 170 * (1 - a) - 170 * l, o: mRamp(k, tIn, tIn + .12) * (1 - mRamp(k, tOut + .05, tOut + .15)) });
    enz.bite(1 - .75 * mRamp(k, tBite, tBite + .1) + .75 * mRamp(k, tBite + .25, tBite + .32));
  }
  const ch = Object.assign(g, {
    beads, bonds, waters, enzyme: enz, n, sp, R,
    at(j) { return mOut(g, pos[j]); },
    mid(j) { return mOut(g, [(pos[j - 1][0] + pos[j][0]) / 2, 0]); },
    show(m = n) { base(m); drawBonds(j => j < m ? 1 : 0); flush(); return ch; },
    dehydrate(i, k) {
      base(i);
      const b = beads[i], pv = beads[i - 1], a = io(mRamp(k, 0, .35)), c = io(mRamp(k, .55, .75));
      pos[i] = [X0(i) + 90 + 200 * (1 - a) - 90 * c, -80 * (1 - a)];
      W(b, { x: pos[i][0], y: pos[i][1], o: mRamp(k, 0, .12) });
      tagsOn(b, true, true); tagsOn(pv, i === 1, true);
      const M0 = [(X0(i - 1) + X0(i) + 90) / 2, R + 50], mv = io(mRamp(k, .35, .55)), tagO = 1 - mRamp(k, .55, .6);
      const hp = [pos[i - 1][0] + pv.tagR.hx, 0], op = [pos[i][0] + b.tagL.hx, pos[i][1]];
      tagTo(pv, pv.tagR, [mLerp(hp[0], M0[0] - 24, mv), mLerp(hp[1], M0[1], mv)], tagO);
      tagTo(b, b.tagL, [mLerp(op[0], M0[0] + 14, mv), mLerp(op[1], M0[1], mv)], tagO);
      W(pv.stickR, { o: 1 - mRamp(k, .35, .4) }); W(b.stickL, { o: 1 - mRamp(k, .35, .4) });
      const d = io(mRamp(k, .6, 1)), bm = (X0(i - 1) + X0(i)) / 2;
      W(waters[i], { x: mLerp(M0[0], bm, d), y: M0[1] + 8 + 24 * d, o: mRamp(k, .55, .6), s: water * (.7 + .3 * mRamp(k, .55, .62)) });
      drawBonds(j => j < i ? 1 : j === i ? mRamp(k, .7, .75) : 0);
      W(flashes[i], { x: bm, y: 0, o: mBump(k, .7, .95), s: .7 + .6 * mRamp(k, .7, .95) });
      enzAt(bm, k, 0, .5, .82);
      flush(); return ch;
    },
    hydrolyse(i, k) {
      base(n);
      const sh = apart * io(mRamp(k, .45, .72)), bm = (X0(i - 1) + X0(i)) / 2, pv = beads[i - 1], nx = beads[i];
      for (let j = i; j < n; j++) { pos[j] = [X0(j) + sh, 0]; W(beads[j], { x: pos[j][0] }); }
      const a = io(mRamp(k, 0, .4)), W0 = [bm, R + 34];
      W(waters[i], { x: bm, y: R + 200 - (200 - 34) * a, o: mRamp(k, 0, .15) * (1 - mRamp(k, .48, .52)), s: water });
      drawBonds(j => j === i ? 1 - mRamp(k, .45, .5) : 1);
      W(flashes[i], { x: bm, y: 0, o: mBump(k, .36, .56), s: .8 + .5 * mRamp(k, .36, .56) });
      const mv = io(mRamp(k, .52, .85)), tagO = mRamp(k, .5, .55);
      tagsOn(pv, i === 1, true); tagsOn(nx, true, i === n - 1);
      tagTo(pv, pv.tagR, [mLerp(W0[0] - 18, pos[i - 1][0] + pv.tagR.hx, mv), mLerp(W0[1], 0, mv)], tagO);
      tagTo(nx, nx.tagL, [mLerp(W0[0] + 18, pos[i][0] + nx.tagL.hx, mv), mLerp(W0[1], 0, mv)], tagO);
      W(pv.stickR, { o: mRamp(k, .76, .84) }); W(nx.stickL, { o: mRamp(k, .76, .84) });
      enzAt(bm, k, 0, .3, .82);
      flush(); return ch;
    },
  });
  return ch.show(n);
}

/* ---------- baseShape: purines two fused rings, pyrimidines one ring ---------- */
function baseShape(p, letter, { x = 0, y = 0, s = 1, o = 1, dir = 0, a = 26, size } = {}) {
  const pur = letter === 'A' || letter === 'G', col = MC[letter] || COL.dim, edge = mix(col, '#000000', .35), g = G(p, { x, y, s, o });
  const c = Math.cos(dir * Math.PI / 180), sn = Math.sin(dir * Math.PI / 180), rot = ([u, v]) => [u * c - v * sn, u * sn + v * c];
  const Rp = a * .85065, k36 = Math.cos(Math.PI / 5), hx = (pur ? Rp * (1 + k36) : 0) + a * Math.sqrt(3) / 2;
  const deg = t => t * Math.PI / 180;
  const hex = [-90, -30, 30, 90, 150, 210].map(t => [hx + a * Math.cos(deg(t)), a * Math.sin(deg(t))]);
  const pv = t => [Rp + Rp * Math.cos(deg(t)), Rp * Math.sin(deg(t))];
  const pts = pur ? [pv(180), pv(-108), hex[5], hex[0], hex[1], hex[2], hex[3], hex[4], pv(108)] : hex;
  const d = 'M' + pts.map(rot).map(([u, v]) => u.toFixed(1) + ' ' + v.toFixed(1)).join('L') + 'Z';
  const ring = path(g, d, { stroke: MC.hi, 'stroke-width': 12 }, { o: 0 });
  const body = path(g, d, { fill: col, stroke: edge, 'stroke-width': 3 });
  if (pur) path(g, mSeg(rot(hex[5]), rot(hex[4])), { stroke: edge, 'stroke-width': 3 });
  const L = pur ? Rp * (1 + k36) + a * Math.sqrt(3) : a * Math.sqrt(3), [lx, ly] = rot([hx, 0]), fs = size ?? a * 1.15;
  const text = wLabel(g, letter, { x: lx, y: ly + fs * .36, size: fs, fill: MC.ink, weight: 800, o: 1 });
  const tipL = rot([L, 0]);
  return Object.assign(g, { letter, purine: pur, L, ring, body, text, color: col, tipL, tip() { return mOut(g, tipL); } });
}

/* ---------- nucleotide: phosphate + sugar + base ---------- */
const NU = { R: 40, O4: [0, -40], C1: [38.04, -12.36], C2: [23.51, 32.36], C3: [-23.51, 32.36], C4: [-38.04, -12.36],
  C5: [-50, -62], P: [-23.51, -104], Pr: 28, B: [80, -12.36], O3: [-23.51, 50], step: 206, a: 26 };
function nucleotide(p, { base = 'A', sugar = 'deoxy', x = 0, y = 0, s = 1, o = 1, flip = false, nums = false, ink = COL.chalk, oh3 = true } = {}) {
  const f = flip ? -1 : 1, q = ([a, b]) => [f * a, f * b], g = G(p, { x, y, s, o }), ribo = sugar === 'ribo';
  const tx = (par, str, pt, opts) => { const [px, py] = q(pt), sz = opts.size; return wLabel(par, str, { x: px, y: py + sz * .36, o: 1, ...opts }); };
  const linkB = path(g, mSeg(q(NU.C1), q(NU.B)), { stroke: ink, 'stroke-width': 7 });
  const linkP = path(g, mSeg(q(NU.C5), q(NU.P)), { stroke: ink, 'stroke-width': 7 });
  const sugarG = G(g), phosG = G(g), baseG = G(g);
  const pent = [NU.O4, NU.C1, NU.C2, NU.C3, NU.C4].map(q);
  const pentD = 'M' + pent.map(([u, v]) => u.toFixed(2) + ' ' + v.toFixed(2)).join('L') + 'Z';
  const sRing = path(sugarG, mPoly(5, NU.R + 11, -90 * f), { stroke: MC.hi, 'stroke-width': 10 }, { o: 0 });
  path(sugarG, mSeg(q(NU.C4), q(NU.C5)), { stroke: ink, 'stroke-width': 7 });
  const oh3G = G(sugarG, { o: oh3 ? 1 : 0 });
  path(oh3G, mSeg(q(NU.C3), q(NU.O3)), { stroke: ink, 'stroke-width': 6 });
  tx(oh3G, 'OH', [NU.C3[0], 70], { size: 24, fill: MC.oh, weight: 700 });
  const oh2G = G(sugarG);
  path(oh2G, mSeg(q(NU.C2), q([NU.C2[0], ribo ? 50 : 46])), { stroke: ink, 'stroke-width': ribo ? 6 : 4 });
  tx(oh2G, ribo ? 'OH' : 'H', [NU.C2[0], ribo ? 70 : 64], { size: ribo ? 24 : 22, fill: ribo ? MC.oh : COL.dim, weight: 700 });
  path(sugarG, pentD, { fill: MC.sugar, stroke: MC.sugarEdge, 'stroke-width': 3 });
  tx(sugarG, 'O', [0, -25], { size: 18, fill: MC.ink, weight: 700 });
  const numG = G(sugarG, { o: nums ? 1 : 0 });
  [[NU.C1, '1′'], [NU.C2, '2′'], [NU.C3, '3′'], [NU.C4, '4′']].forEach(([[u, v], str]) => tx(numG, str, [u * .58, v * .58], { size: 17, fill: MC.ink, weight: 800 }));
  tx(numG, '5′', [NU.C5[0] - 26, NU.C5[1] + 2], { size: 20, fill: COL.dim, weight: 700 });
  const pRing = put(mk('circle', { cx: q(NU.P)[0], cy: q(NU.P)[1], r: NU.Pr + 9, fill: 'none', stroke: MC.hi, 'stroke-width': 8 }, phosG), { o: 0 });
  mk('circle', { cx: q(NU.P)[0], cy: q(NU.P)[1], r: NU.Pr, fill: MC.P, stroke: MC.Pedge, 'stroke-width': 3 }, phosG);
  tx(phosG, 'P', NU.P, { size: 30, fill: MC.ink, weight: 800 });
  const bs = baseShape(baseG, base, { x: q(NU.B)[0], y: q(NU.B)[1], dir: flip ? 180 : 0, a: NU.a });
  const off = e => [st(e).x, st(e).y];
  const add = ([a, b], [c, d]) => [a + c, b + d];
  const nu = Object.assign(g, {
    letter: base, sugarKind: sugar, flip, phosphate: phosG, sugar: sugarG, base: baseG, bs, links: { P: linkP, B: linkB },
    rings: { phosphate: pRing, sugar: sRing, base: bs.ring }, nums: numG, oh3: oh3G, oh2: oh2G,
    local(key) {
      if (key === 'P') return add(q(NU.P), off(phosG));
      if (key === 'B') return add(q(NU.B), off(baseG));
      if (key === 'tip') return add(add(q(NU.B), bs.tipL), off(baseG));
      return add(key === 'S' ? [0, 0] : q(NU[key]), off(sugarG));
    },
    pt(key) { return mOut(g, nu.local(key)); },
    pose(nx, ny, no) { mPose(g, nx, ny, no); return nu; },
    split(k, { dx = 70, dy = 50 } = {}) {
      mPose(phosG, -f * dx * .5 * k, -f * dy * k); mPose(baseG, f * dx * k, 0);
      const lo = 1 - mRamp(k, 0, .35); mO(linkP, lo); mO(linkB, lo);
      return nu;
    },
    enclose(kind = 'nucleotide', { label = kind, color = COL.chalk, size = 28, pad = 14, side = kind === 'nucleotide' ? 'above' : 'below' } = {}) {
      let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9;
      const grow = (...pts) => { for (const [u, v] of pts) { x1 = Math.min(x1, u); y1 = Math.min(y1, v); x2 = Math.max(x2, u); y2 = Math.max(y2, v); } };
      const [sx, sy] = off(sugarG);
      grow(...[[-92, -48], [46, 84]].map(q).map(([u, v]) => [u + sx, v + sy]));   // the sugar, with its C5′ stick and OH tags
      const [bx, by] = off(baseG), at = q(NU.B), tip = add(at, bs.tipL);
      grow([at[0] + bx, at[1] - NU.a + by], [tip[0] + bx, at[1] + NU.a + by]);
      if (kind === 'nucleotide') { const [px, py] = add(q(NU.P), off(phosG)); grow([px - NU.Pr, py - NU.Pr], [px + NU.Pr, py + NU.Pr]); }
      const eg = G(g, { o: 0 });
      mk('rect', { x: x1 - pad, y: y1 - pad, width: x2 - x1 + 2 * pad, height: y2 - y1 + 2 * pad, rx: 22, fill: 'none', stroke: color, 'stroke-width': 3.5, 'stroke-dasharray': '12 9' }, eg);
      if (label) wLabel(eg, label, { x: (x1 + x2) / 2, y: side === 'above' ? y1 - pad - 14 : y2 + pad + 14 + size, size, fill: color, weight: 700, o: 1 });
      return eg;
    },
  });
  return nu;
}

/* ---------- polynucleotide: a strand with its sugar-phosphate backbone ---------- */
function polynucleotide(p, { seq = 'ATGC', sugar = 'deoxy', x = 0, y = 0, s = 1, o = 1, flip = false, step = NU.step, nums = false, ink = COL.chalk, ends = true, size = 34 } = {}) {
  const N = seq.length, f = flip ? -1 : 1, g = G(p, { x, y, s, o });
  const spine = path(g, '', { stroke: COL.chalk, 'stroke-width': 44, 'stroke-opacity': .16 }, { o: 0 });
  const hiL = G(g), linkL = G(g), nucL = G(g), fxL = G(g);
  const nucs = [...seq].map((b, i) => nucleotide(nucL, { base: b, sugar, flip, nums, ink, y: f * i * step }));
  const links = [], his = [], dots = [], flashes = [];
  for (let i = 0; i < N - 1; i++) {
    his.push(path(hiL, '', { stroke: MC.hi, 'stroke-width': 20 }, { o: 0 }));
    const lg = G(linkL, { o: 0 });
    lg.line = path(lg, '', { stroke: ink, 'stroke-width': 7 });
    lg.dot = mk('circle', { r: 9, fill: WC.O, stroke: WC.Oedge, 'stroke-width': 2 }, lg);
    links.push(lg);
    flashes.push(put(mk('circle', { r: 30, fill: MC.flash, 'fill-opacity': .7 }, fxL), { o: 0 }));
  }
  const off = nucs.map(() => [0, 0, 1]), linkK = Array(Math.max(0, N - 1)).fill(1), flashK = Array(Math.max(0, N - 1)).fill(0);
  const lab5 = ends ? wLabel(g, '5′', { size, weight: 700, o: 1 }) : null, lab3 = ends ? wLabel(g, '3′', { size, weight: 700, o: 1 }) : null;
  const pl = (i, k) => nucs[i].pt(k);
  const strand = Object.assign(g, {
    nucs, spine, lab5, lab3, N, step, flip, seq,
    link(i) { return his[i]; },
    pt(i, key) { return mOut(g, pl(i, key)); },
    place(i, dx = 0, dy = 0, oo = 1) { off[i] = [dx, dy, oo]; return strand; },
    linkOn(i, v) { linkK[i] = v; return strand; },
    refresh() {
      nucs.forEach((nu, i) => nu.pose(off[i][0], f * i * step + off[i][1], off[i][2]));
      let last = 0, sp = '';
      for (let i = 0; i < N - 1; i++) {
        const lo = Math.min(off[i][2], off[i + 1][2]) * linkK[i], a = pl(i, 'C3'), b = pl(i + 1, 'P');
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, od = Math.min(24, L * .4), O = [a[0] + (b[0] - a[0]) / L * od, a[1] + (b[1] - a[1]) / L * od];
        const d = mSeg(a, b);
        mO(links[i], lo); mD(links[i].line, d); mD(his[i], d);
        const cx = O[0].toFixed(1), cy = O[1].toFixed(1);
        if (links[i].dot._c !== cx + cy) { links[i].dot.setAttribute('cx', cx); links[i].dot.setAttribute('cy', cy); links[i].dot._c = cx + cy; }
        mPose(flashes[i], O[0], O[1], flashK[i]);
        mO(nucs[i].oh3, 1 - lo);
        if (lo >= .5 && last === i) last = i + 1;
      }
      if (N) mO(nucs[N - 1].oh3, 1);
      for (let i = 0; i < N; i++) if (off[i][2] > .5) { const P0 = pl(i, 'P'), S0 = pl(i, 'S'), C3 = pl(i, 'C3'); sp += `${sp ? 'L' : 'M'}${P0[0].toFixed(1)} ${P0[1].toFixed(1)}L${S0[0].toFixed(1)} ${S0[1].toFixed(1)}L${C3[0].toFixed(1)} ${C3[1].toFixed(1)}`; }
      mD(spine, sp);
      if (ends) {
        const P0 = pl(0, 'P'); mPose(lab5, P0[0] - f * 62, P0[1] + size * .36, off[0][2]);
        const O3 = pl(last, 'O3'); mPose(lab3, O3[0] - f * 62, O3[1] + f * 20 + size * .36, off[last][2]);
      }
      return strand;
    },
    grow(m = N) {
      const full = Math.min(N, Math.floor(m)), k = full < N ? m - full : 0;
      for (let i = 0; i < N; i++) {
        if (i < full) off[i] = [0, 0, 1];
        else if (i === full && k > 0) { const a = io(mRamp(k, 0, .6)); off[i] = [(1 - a) * f * -150, (1 - a) * f * 110, mRamp(k, 0, .25)]; }
        else off[i] = [0, 0, 0];
      }
      for (let i = 0; i < N - 1; i++) { linkK[i] = i < full - 1 ? 1 : i === full - 1 && k > 0 ? mRamp(k, .6, .72) : 0; flashK[i] = i === full - 1 ? mBump(k, .66, .95) : 0; }
      return strand.refresh();
    },
  });
  return strand.grow(N);
}

/* ---------- dnaLadder: two antiparallel strands, the double helix, replication ---------- */
function dnaLadder(p, { seq = 'ATGCAT', x = 800, y = 200, s = .6, o = 1, step = NU.step, half = 190, perRow = 40, D = 270, arrows = true, size = 34 } = {}) {
  const n = seq.length, comp = mComp(seq), g = G(p, { x, y, s, o });
  const detail = G(g), schema = G(g, { o: 0 }), labs = G(g);
  const yR = (n - 1) * step + 2 * NU.C1[1];          // the flipped strand's origin, so C1′ rows line up
  const hbLayer = G(detail);
  const left = polynucleotide(detail, { seq, x: -half, y: 0, step, ends: false });
  const right = polynucleotide(detail, { seq: comp, x: half, y: yR, step, flip: true, ends: false });
  const newL = polynucleotide(detail, { seq: comp, x: half - D, y: yR, step, flip: true, ends: false, ink: MC.newInk });
  const newR = polynucleotide(detail, { seq, x: -half + D, y: 0, step, ends: false, ink: MC.newInk });
  for (let i = 0; i < n; i++) { newL.place(i, 0, 0, 0); newR.place(i, 0, 0, 0); }
  newL.refresh(); newR.refresh();
  const nb = r => 'GC'.includes(seq[r]) ? [-13, 0, 13] : [-8, 8];
  const mkHb = () => Array.from({ length: n }, () => path(hbLayer, '', { stroke: MC.hbond, 'stroke-width': 4, 'stroke-dasharray': '6 5' }));
  const hb = mkHb(), hbL = mkHb(), hbR = mkHb();
  hbL.forEach(e => put(e, { o: 0 })); hbR.forEach(e => put(e, { o: 0 }));
  const hbSet = (e, a, b, r) => mD(e, nb(r).map(t => mSeg([Math.min(a[0], b[0]) + 3, a[1] + t], [Math.max(a[0], b[0]) - 3, b[1] + t])).join(''));
  // labels and arrows
  const L5 = wLabel(labs, '5′', { size, weight: 700, o: 1 }), L3 = wLabel(labs, '3′', { size, weight: 700, o: 1 });
  const R5 = wLabel(labs, '5′', { size, weight: 700, o: 1 }), R3 = wLabel(labs, '3′', { size, weight: 700, o: 1 });
  const yBot = (n - 1) * step;
  const arw = G(labs, { o: arrows ? 1 : 0 });
  mArrow(arw, [-half - 145, -70], [-half - 145, yBot + 40], { color: COL.dim, w: 5 });
  mArrow(arw, [half + 145, yBot + 40], [half + 145, -70], { color: COL.dim, w: 5 });
  const detailLabels = () => {
    const a = left.pt(0, 'P'), b = left.pt(n - 1, 'O3'), c = right.pt(n - 1, 'O3'), d = right.pt(0, 'P');
    return [[a[0] - 62, a[1] + size * .36], [b[0] - 62, b[1] + 20 + size * .36], [d[0] + 62, d[1] + size * .36], [c[0] + 62, c[1] - 20 + size * .36]];
  };
  const putLabels = ls => [L5, L3, R5, R3].forEach((e, i) => mPose(e, ls[i][0], ls[i][1]));
  // schema: ribbons and rungs
  const backP = path(schema, '', { stroke: mix(COL.chalk, '#0f1e33', .55), 'stroke-width': 14, 'stroke-linecap': 'butt' });
  const rungs = {}; for (const b of 'ATGCU') rungs[b] = path(schema, '', { stroke: MC[b], 'stroke-width': 16, 'stroke-linecap': 'butt' });
  const frontP = path(schema, '', { stroke: COL.chalk, 'stroke-width': 14 });
  const Lof = b => (b === 'A' || b === 'G' ? 3.271 : 1.732) * NU.a;
  const frac = r => (NU.B[0] + Lof(seq[r]) + (2 * half - 2 * NU.B[0] - Lof(seq[r]) - Lof(mPair(seq[r]))) / 2) / (2 * half);
  const yTop = NU.P[1], yEnd = yBot + 52;
  const lad = Object.assign(g, {
    left, right, newL, newR, hb, hbL, hbR, detail, schema, arrows: arw, labels: { L5, L3, R5, R3 }, seq, comp, n,
    pairs: () => { for (let r = 0; r < n; r++) hbSet(hb[r], left.pt(r, 'tip'), right.pt(n - 1 - r, 'tip'), r); },
    twist(k) {
      const fade = mRamp(k, 0, .25), tw = io(mRamp(k, .15, 1));
      mO(detail, 1 - fade); mO(schema, fade); mO(arw, (arrows ? 1 : 0) * (1 - fade));
      const ph = yy => tw * perRow * (yy - yTop) / step * Math.PI / 180;
      let back = '', front = '';
      for (const sg of [-1, 1]) {
        let prev = null, cls = null;
        for (let i = 0; i <= 64; i++) {
          const yy = yTop + (yEnd - yTop) * i / 64, a = ph(yy), px = sg * half * Math.cos(a), pt = `${px.toFixed(1)} ${yy.toFixed(1)}`;
          if (prev) {
            const am = ph(yy - (yEnd - yTop) / 128), c = sg * Math.sin(am) > 1e-6 ? 'b' : 'f';   // the segment's depth at its middle
            if (c !== cls) { if (c === 'b') back += `M${prev}`; else front += `M${prev}`; cls = c; }
            if (c === 'b') back += `L${pt}`; else front += `L${pt}`;
          }
          prev = pt;
        }
      }
      const rd = {}; for (const b in rungs) rd[b] = '';
      for (let r = 0; r < n; r++) {
        const yy = r * step + NU.C1[1], a = ph(yy), ax = -half * Math.cos(a), bx = half * Math.cos(a), jx = ax + (bx - ax) * frac(r);
        rd[seq[r]] += mSeg([ax, yy], [jx, yy]); rd[mPair(seq[r])] += mSeg([jx, yy], [bx, yy]);
      }
      mD(backP, back); mD(frontP, front); for (const b in rungs) mD(rungs[b], rd[b]);
      const xa = -half * Math.cos(ph(yEnd)), xb = -xa, sd = xa <= xb ? 1 : -1, dl = detailLabels();
      const sl = [[-half - 62, yTop + size * .36], [xa - sd * 70, yEnd + 30 + size * .36], [xb + sd * 70, yEnd + 30 + size * .36], [half + 62, yTop + size * .36]];
      putLabels(dl.map((v, i) => [mLerp(v[0], sl[i][0], fade), mLerp(v[1], sl[i][1], fade)]));
      return lad;
    },
    unzip(k, { dock = true } = {}) {
      mO(detail, 1); mO(schema, 0); mO(arw, (arrows ? 1 : 0) * (1 - mRamp(k, 0, .15)));
      const dk = [];
      for (let r = 0; r < n; r++) {
        const sep = io(mRamp(k, .3 * r / n, .3 * r / n + .3));
        left.place(r, -D * sep, 0, 1); right.place(n - 1 - r, D * sep, 0, 1);
        mO(hb[r], 1 - mRamp(sep, 0, .12));
        dk[r] = dock ? mRamp(k, .55 + .3 * r / n, .7 + .3 * r / n) : 0;
        const e = io(dk[r]), oo = mRamp(dk[r], 0, .5);
        newL.place(n - 1 - r, 0, (1 - e) * 90, oo); newR.place(r, 0, (1 - e) * 90, oo);
        mO(hbL[r], mRamp(dk[r], .85, 1)); mO(hbR[r], mRamp(dk[r], .85, 1));
      }
      for (let i = 0; i < n - 1; i++) {
        newR.linkOn(i, mRamp(Math.min(dk[i], dk[i + 1]), .9, 1));
        newL.linkOn(i, mRamp(Math.min(dk[n - 1 - i], dk[n - 2 - i]), .9, 1));
      }
      left.refresh(); right.refresh(); newL.refresh(); newR.refresh();
      lad.pairs();
      for (let r = 0; r < n; r++) { hbSet(hbL[r], left.pt(r, 'tip'), newL.pt(n - 1 - r, 'tip'), r); hbSet(hbR[r], newR.pt(r, 'tip'), right.pt(n - 1 - r, 'tip'), r); }
      putLabels(detailLabels());
      return lad;
    },
  });
  lad.pairs(); putLabels(detailLabels());
  return lad;
}

/* ---------- ribosome, mRNA, polypeptide ---------- */
function ribosome(p, { x = 0, y = 0, s = 1, o = 1 } = {}) {
  const g = G(p, { x, y, s, o }), big = G(g), small = G(g);
  mk('ellipse', { cy: -44, rx: 74, ry: 44, fill: MC.ribo, stroke: MC.riboEdge, 'stroke-width': 3 }, big);
  mk('ellipse', { cx: -26, cy: -62, rx: 20, ry: 10, fill: '#fff', 'fill-opacity': .22 }, big);
  mk('ellipse', { cy: 28, rx: 64, ry: 25, fill: MC.riboDk, stroke: MC.riboEdge, 'stroke-width': 3 }, small);
  const rb = Object.assign(g, {
    big, small,
    split(k) { mPose(big, 0, -34 * k); mPose(small, 0, 34 * k); return rb; },
    pt(key) { return mOut(g, key === 'exit' ? [0, -88 + st(big).y] : [0, 2]); },
    pose(nx, ny) { mPose(g, nx, ny); return rb; },
  });
  return rb;
}

function mRNA(p, { seq = 'AUGGCUUAC', x = 0, y = 0, s = 1, o = 1, step = 46, a = 13, ends = true, size = 28 } = {}) {
  const n = seq.length, g = G(p, { x, y, s, o });
  const line = path(g, '', { stroke: COL.chalk, 'stroke-width': 3.5 });
  const nts = [...seq].map((b, i) => {
    const ng = G(g, { x: i * step });
    path(ng, 'M0 8V20', { stroke: COL.chalk, 'stroke-width': 3 });
    baseShape(ng, b, { y: 20, dir: 90, a, size: 16 });
    path(ng, mPoly(5, 11), { fill: MC.sugar, stroke: MC.sugarEdge, 'stroke-width': 2 });
    return ng;
  });
  const l5 = ends ? wLabel(g, '5′', { x: -36, y: size * .36, size, weight: 700, o: 1 }) : null;
  const l3 = ends ? wLabel(g, '3′', { y: size * .36, size, weight: 700, o: 1 }) : null;
  const m = Object.assign(g, {
    n, step, nts, line, k: -1,
    at(i) { return mOut(g, [i * step, 0]); },
    reveal(k = 1) {
      k = Math.round(mClamp(k) * 1000) / 1000; if (k === m.k) return m; m.k = k;
      const c = k * n;
      nts.forEach((e, i) => mO(e, mClamp(c - i)));
      const end = Math.max(0, (c - 1)) * step;
      mD(line, c > 0 ? `M-14 0H${(end + 14).toFixed(1)}` : '');
      if (l3) mPose(l3, Math.max(0, Math.ceil(c) - 1) * step + 40, size * .36, mClamp(c));
      if (l5) mO(l5, mClamp(c));
      return m;
    },
  });
  return m.reveal(1);
}

function polypeptide(p, { n = 10, x = 0, y = 0, s = 1, o = 1, dir = -90, sp = 40, r = 15 } = {}) {
  const g = G(p, { x, y, s, o }), ux = Math.cos(dir * Math.PI / 180), uy = Math.sin(dir * Math.PI / 180);
  const cols = ['#c9a0dc', '#f4a48c', '#86c9e8', '#8fd6b0', '#e8a0c8', '#ffd27a'];
  const bond = path(g, '', { stroke: WC.stick, 'stroke-width': 6 });
  const beads = Array.from({ length: n }, (_, j) => { const c = cols[(j * 7 + 3) % cols.length]; return put(mk('circle', { r, fill: c, stroke: mix(c, '#000000', .3), 'stroke-width': 2.5 }, g), { o: 0 }); });
  const pp = Object.assign(g, {
    beads, m: -1,
    set(m) {
      m = Math.round(Math.max(0, Math.min(n, m)) * 1000) / 1000; if (m === pp.m) return pp; pp.m = m;
      let d = '';
      for (let j = 0; j < n; j++) {
        const dd = Math.max(0, m - 1 - j) * sp, w = 12 * Math.sin(dd / sp * 1.9 + .5) * Math.min(1, dd / sp);
        const px = ux * dd - uy * w, py = uy * dd + ux * w, oo = mClamp(m - j);
        mPose(beads[j], px, py, oo);
        if (oo > 0) d += `${d ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`;
      }
      mD(bond, d);
      return pp;
    },
  });
  return pp.set(n);
}

/* ---------- cellScene: a flat cell with its nucleus ---------- */
function cellScene(p, { x = 800, y = 450, w = 1360, h = 780, s = 1, o = 1, pores = 6, ribos = 6 } = {}) {
  const g = G(p, { x, y, s, o }), rx = w / 2, ry = h / 2;
  let d = '';
  for (let i = 0; i <= 72; i++) {
    const t = i / 72 * 2 * Math.PI, k = 1 + .025 * Math.sin(3 * t + .6) + .018 * Math.sin(5 * t + 2.1);
    d += (i ? 'L' : 'M') + (rx * k * Math.cos(t)).toFixed(1) + ' ' + (ry * k * Math.sin(t)).toFixed(1);
  }
  const membrane = path(g, d + 'Z', { fill: MC.cyto, stroke: MC.membrane, 'stroke-width': 7 });
  let specks = '';
  for (let i = 0; i < 70; i++) {
    const u = wHash(i, 11) * 2 - 1, v = wHash(i, 12) * 2 - 1; if (u * u + v * v > .8) continue;
    const px = u * rx * .95, py = v * ry * .95; specks += `M${px.toFixed(0)} ${py.toFixed(0)}h.1`;
  }
  path(g, specks, { stroke: '#2b4c75', 'stroke-width': 7 });
  const NX = -w * .2, NR = h * .3, nucG = G(g, { x: NX });
  mk('circle', { r: NR, fill: MC.nucleo }, nucG);
  const dna = G(nucG);
  const CH = [[-.35, -.3, 20], [.3, -.38, -35], [.32, .28, 60], [-.3, .32, -15], [0, 0, 100]];   // chromatin loops: centre (× NR) and turn
  CH.forEach(([cx, cy, tr], k) => {
    let dd = '';
    const ang = tr * Math.PI / 180, L = NR * .8;
    for (let i = 0; i <= 48; i++) {
      const t = i / 48, ax = (t - .5) * L, ay = Math.sin(t * Math.PI * 6 + k) * 13 + Math.sin(t * Math.PI * 1.3 + k) * 26;
      let px = cx * NR + ax * Math.cos(ang) - ay * Math.sin(ang), py = cy * NR + ax * Math.sin(ang) + ay * Math.cos(ang);
      const h = Math.hypot(px, py); if (h > NR * .82) { px *= NR * .82 / h; py *= NR * .82 / h; }
      dd += (i ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1);
    }
    path(dna, dd, { stroke: MC.dna, 'stroke-width': 4.5, 'stroke-opacity': .8 });
  });
  const envelope = G(nucG);
  mk('circle', { r: NR, fill: 'none', stroke: MC.env, 'stroke-width': 6 }, envelope);
  mk('circle', { r: NR - 13, fill: 'none', stroke: MC.env, 'stroke-width': 5 }, envelope);
  const poreList = [];
  for (let i = 0; i < pores; i++) {
    const a = i * 360 / pores, ar = a * Math.PI / 180, pr = NR - 6.5, px = pr * Math.cos(ar), py = pr * Math.sin(ar);
    const pg = G(envelope, { x: px, y: py, r: a });
    mk('rect', { x: -16, y: -15, width: 32, height: 30, fill: MC.nucleo }, pg);
    path(pg, 'M-14 -15H14M-14 15H14', { stroke: '#a9c6ea', 'stroke-width': 7 });
    poreList.push({ x: NX + (NR + 4) * Math.cos(ar), y: (NR + 4) * Math.sin(ar), a });
  }
  const riboL = G(g), ribosomes = [];
  const spots = [[.22, -.42], [.42, -.18], [.62, .1], [.3, .35], [.55, .48], [.15, .02], [.72, -.3], [.45, .2]];
  for (let i = 0; i < Math.min(ribos, spots.length); i++) ribosomes.push(ribosome(riboL, { x: spots[i][0] * rx, y: spots[i][1] * ry, s: .4 }));
  return Object.assign(g, {
    membrane, nucleusG: nucG, nucleus: { x: NX, y: 0, R: NR }, envelope, dna, pores: poreList, ribosomes,
    pt(lx, ly) { return mOut(g, [lx, ly]); },
    pore(i) { const q = poreList[i]; return mOut(g, [q.x, q.y]); },
  });
}
