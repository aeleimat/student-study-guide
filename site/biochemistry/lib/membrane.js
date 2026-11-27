'use strict';
// Membrane Structure and Function (chapter 7): the book's kit of phospholipids, bilayers, membrane proteins,
// transporters, solutes, osmosis apparatus, tonicity cells, membrane potential and bulk transport. Loaded after
// engine.js, water.js, macro.js, cell.js and cyto.js (it reuses waterMolecule, wLabel, wChem, wHash, WC; mArrow, mRamp,
// mClamp, mD, mO, enzyme; CC, cSet, cAttr, cF, cP, cOut, cLabel, cBlob, cSmooth, cCircle, cStadium, vesicle, vacuole;
// microfilament). Every piece is drawn around its own origin with { x, y, s, o } (some take r, degrees) and placed with
// put. Each animated piece has set-style methods that pose everything from their arguments alone (call them from
// prog(k => …) or clockRun(t => …)), so replay and seek draw the same frame. Those methods first round their argument
// (k and v to 1/2000, t to 1/120 s) and draw only from the rounded value; attributes are written only when they change
// (cSet, mD, cAttr). No filters, blurs or clips. By convention the extracellular fluid is up (−y, the board) and the
// cytoplasm down (+y, MC.cyto).
//
// Exports (lengths at s = 1; "parent" = the coordinates of the group you passed as p; k runs 0..1; t is seconds):
//   MC                                   macro.js's colour object, extended here with chapter 7's colours: ecf cyto head
//       headEdge tail chol integral peripheral channel carrier pump receptor enzyme carb Na K Cl H sugar O2 Cgas dye1
//       dye2 water atp P adp down against plus minus rbc wall vac vacEdge ecm actin coat ligand vesicle food (and …Edge)
//   solute(p, kind, {x, y, s, o, r=15 (ions 20), label='name'|'sign'|false}) one particle, origin at its centre. kind: 'Na' (amber
//       disc +), 'K' (violet rounded square +), 'Cl' (green disc −), 'H' (pink disc +), 'sugar' (gold hexagon),
//       'sucrose' (hexagon + pentagon), 'O2', 'CO2', 'dye1' (coral dot), 'dye2' (cyan dot), 'water' (small cyan-white
//       dot), 'waterMol' (water.js molecule), 'ATP' (yellow spark), 'ADP' (pale chip), 'P' / 'Pi' (lavender ball),
//       'ligand' / 'signal' (coral triangle), 'food' (a lumpy particle). Ions are labelled with their symbol (Na⁺ K⁺ H⁺
//       Cl⁻) by default, r 20; label 'sign' shows only + / − (crowded clouds), false none.
//       .kind .r, .pose(x, y)
//   gradArrow(p, [x1, y1], [x2, y2], {against=false, w=7, head=22, o=1}) "down the gradient" (cream) or "against it"
//       (orange, with an ATP spark beside its middle, .atp)
//   gradientWedge(p, {x, y, w=320, h=90, color=COL.chalk, dir=1, n=40, o=1}) a ramp dense (left for dir 1) → sparse,
//       dots thinning out; origin at its centre
//   phospholipid(p, {x, y, s, o, r=0, kink=false, head=11, len=38, color=MC.head, seed}) origin = head centre, two
//       gold tails down (+y; r 180 for the inner leaflet); kink: the second tail bends (unsaturated). .wobble(t, amp=1)
//       sways the tails; .pose(x, y, r); .head .tails; .pt('head'|'tails')
//   cholesterol(p, {x, y, s, o, r=0, a=4.6}) small OH ball at the origin, four fused rings and a short tail down (+y),
//       about 48 long
//   bilayer(p, {x, y, s, o, w=900, sp=26, head=11, len=38, unsat=.3, chol=0, cholLayer, gaps=[[x, half], …], seed=1,
//       fluid=.5}) two leaflets centred on y = 0 (heads at ±.yH ≈ ±47.6, outer faces at ±.face ≈ ±59). Lipids keep out
//       of gaps (room for proteins). chol: the share of gaps between lipids holding a cholesterol (cholLayer: a group
//       in the same frame to draw them in, so they can dim separately). Setters (combine; each redraws from the whole
//       state): .fluid(f) 0 packed tight, still tails → 1 loose, wobbling; .kinks(u) the share of unsaturated (kinked)
//       tails; .drift(t) lateral jiggle and tail sway; .cholesterol(k) fades them in; .hop(j, leaf, k, n=3, color) lipid
//       j of a leaflet (−1 outer, +1 inner) moves sideways past n neighbours (lateral movement); .flipflop(j, k, color)
//       outer lipid j turns over into the inner leaflet. .pt('heads'|'tails'|'inner'|'outer'), .cholPt(i) (local)
//   selfAssembly(p, {x, y, s, o, n=16, kind='bilayer'|'micelle', spread=560, water=14, seed}) lipids scattered in water
//       (k 0) gather into a micelle (heads out, tails in) or a two-row bilayer (k 1). .set(k, t) (t: wobble)
//   carbChain(p, {x, y, s, o, n=5, a=7, branch=2, dir=-1, seed}) small gold hexagons in a short branched chain from the
//       origin upward (dir 1: down). .grow(k); .tip() in parent
//   integralProtein(p, {x, y, s, o, w=80, h=150, color, edge, seed}) a rounded blob spanning the membrane (centred);
//       .pt('top'|'bottom'|'centre') in parent
//   peripheralProtein(p, {x, y, s, o, w=84, h=46, seed}) a lavender blob (centred), set it against a face
//   helixProtein(p, {x, y, s, o, n=1, mem=110, color}) a transmembrane protein as a chain: N-terminus outside (up),
//       n α-helix spans through the membrane (|y| < mem/2), loops between them, C-terminus at the end (inside for odd
//       n). .hydro(k) tints the spans gold (hydrophobic); .labels(k) shows N and C; .spans; .pt('N'|'C'|'span')
//   receptorProtein(p, {x, y, s, o, h=150}) a transmembrane stalk with a binding cup on top. .bind(k) a signalling
//       molecule comes in and docks (to .6), the receptor brightens and a relay spark pops inside (.6–1). .signal .relay
//   enzymeProtein(p, {x, y, s, o, w=84, h=150}) olive, an active-site notch on top. .react(k) a substrate docks (.4),
//       flashes, and two product pieces leave (.55–1)
//   channelProtein(p, {x, y, s, o, w=46, h=150, pore=30, aqua=false, gated=!aqua, kind, n=4}) two teal halves round
//       a pore (origin = membrane centre). .gate(k) the lid opens (0 shut, 1 open); .flow(t, {dir=1, speed=70}) n
//       particles (kind, default 'K'; aqua: water molecules) pass through, top → bottom (dir −1: up); past a shut lid
//       they fade. .pt('top'|'bottom'|'pore')
//   aquaporin(p, opts) channelProtein with aqua: true (a teal channel passing water molecules single file)
//   carrierProtein(p, {x, y, s, o, w=56, h=150, A=10, solutes=['sugar'], color, edge}) two mint halves; .flip(u) u 0
//       open to the outside (top), .5 shut on both sides, 1 open to the inside; .carry(k) the solutes come from above
//       and bind (.25), it flips (.28–.55), they leave below (.58–.82), it flips back (.85–1). .sol (the pieces)
//   cotransporter(p, opts) carrierProtein with solutes ['H', 'sucrose'] (the sucrose–H⁺ cotransporter)
//   naKPump(p, {x, y, s, o, w=66, h=176}) the indigo sodium-potassium pump; .cycle(k) poses the six steps, one per
//       sixth of k: 1 three Na⁺ bind from inside; 2 ATP phosphorylates it (P sticks, ADP leaves); 3 it opens outward
//       and the Na⁺ leave; 4 two K⁺ bind from outside; 5 the P is released (Pi) and it opens inward again; 6 the K⁺
//       leave inside. .step(k) 1..6; .na[3] .k[2] .atp .adp .p .pi; .pt('out'|'in'|'p')
//   protonPump(p, {x, y, s, o, w=60, h=160, n=4}) indigo; .run(k) n H⁺ pumped out one by one, each paid with an ATP
//       (which leaves as ADP). .h[n]
//   particleCloud(p, {x, y, s, o, w=640, h=360, membrane=true, box=true, solutes=[{kind:'dye1', left:16, right:0,
//       perm:true}], r=14, exchange=true, seed}) a box split by a membrane at x = 0. .set(k, t): k 0 the starting
//       sides, 1 equilibrium (half of the difference has crossed, staggered; with exchange one particle each way
//       crosses near the end: dynamic equilibrium); t jiggles them. .counts(k) [{kind, left, right, toRight, toLeft,
//       net}] per solute, from the same k. perm: false never crosses. .pieces
//   uTube(p, {x, y, s, o, w=560, h=460, aw=150, left=4, right=12, waters=22, seed}) origin = bottom centre; a U-tube
//       with a selectively permeable membrane at the bottom middle, sugar (left/right counts) in water. .set(k, t): the
//       left level falls and the right rises with k (osmosis toward the higher solute side), water dots cross left →
//       right while k < 1. .levels() [left y, right y] in parent; .pt('left'|'right'|'membrane')
//   redCell(p, {x, y, s, o, R=100, water=true}) a red blood cell (tilted biconcave disc). .set(v, t) v −1 shriveled
//       (hypertonic: small, spiky), 0 normal, +1 swollen; from v .82 it tears and its contents spill (lysed). Water dots
//       show the net flow (in for v > 0, out for v < 0, both ways at 0); t moves them.
//   plantCell(p, {x, y, s, o, w=300, h=220, water=true}) wall (tan), membrane, cytoplasm, central vacuole, nucleus,
//       chloroplasts. .set(v, t) v +1 turgid (vacuole big, wall bulging), 0 flaccid, −1 plasmolyzed (the membrane pulls
//       away from the wall); water dots as in redCell. .pt('wall'|'membrane'|'vacuole')
//   paramecium(p, {x, y, s, o, L=440}) cilia, oral groove, nuclei, food vacuoles and two contractile vacuoles (cell.js).
//       .beat(t) the cilia; .pump(k) both contractile vacuoles fill and squeeze (cell.js vacuole.pump; the second one
//       half a cycle behind). .cvs [2]
//   voltmeter(p, {x, y, s, o, min=-200, max=0}) a dial meter, origin at its centre; .set(mV) needle and readout
//       ("−70 mV"); .terminals() [[x, y] −, [x, y] +] in parent
//   membranePotential(p, {x, y, s, o, w=760, n=9, meter=true, mV=-70}) a membrane strip, + signs outside, − signs
//       inside, a voltmeter to the right with leads; .set(mV) shows |mV|/200 of the signs and sets the meter from the
//       same value. .meter
//   exocytosis(p, {x, y, s, o, w=640, r=50, n=4, depth=360}) membrane at y = 0, cell below. .set(k) a vesicle rises
//       (to .45), fuses, opens into the membrane (.5–.85) and its cargo leaves above (.6–1). .pt('vesicle'|'membrane')
//   endocytosis(p, {kind='pino'|'receptor'|'phago', x, y, s, o, w=640, r=56, depth=420}) membrane at y = 0, cell below.
//       .set(k): pino: a coated pit dips round a droplet with solutes, closes, pinches off a coated vesicle that sinks;
//       receptor: receptors cluster and bind their ligands (to .25), then the same coated pit and vesicle; phago:
//       pseudopodia wrap a food particle (to .6) into a food vacuole that sinks (.7–1). .pt('vesicle'|'pit'|'membrane')
//   proteinFunction(p, {kind, x, y, s, o, w=380}) a small vignette of one of the six functions: 'transport' (a carrier),
//       'enzyme', 'signal' (receptor), 'recognition' (two cells' glycoproteins meet), 'joining' (two membranes link),
//       'attachment' (ECM fibre above, microfilament below). .play(k)
//   membranePatch(p, {x=800, y=450, s=1, o, w=1500, top=400, depth=400, transport=true, vesicle=true, ecm=true,
//       filaments=true, chol=.14, seed}) the recurring fluid-mosaic patch: bilayer with cholesterol, integral and
//       peripheral proteins, glycoproteins and glycolipids with carbohydrate chains, ECM fibres above, microfilaments
//       below, and (transport) a channel, a carrier, a receptor and the Na⁺/K⁺ pump, (vesicle) a vesicle beneath.
//       Parts: bilayer cholesterol integral peripheral glycoprotein glycolipid carbohydrate ecm microfilaments channel
//       carrier receptor pump vesicle; aliases phospholipids, transmembrane (= integral), cytoskeleton, aquaporin
//       (= channel), proteins (all proteins), transport (channel carrier pump). .focus(names, k) lights them and dims
//       the rest; .build(k) assembles it part by part; .drift(t) lipids jiggle, proteins drift; .fluid(f);
//       .pt(name) in parent; .label(name, str, {at, dx, dy, size=28, color, layer=p}) (o 0: show it); .sides({size})
//       EXTRACELLULAR FLUID / CYTOPLASM labels (o 0); .piece(name) its first group; .bilayer .channel .carrier .pump
//       .receptor .ves (kit pieces, so their own set methods work)
//   Internal helpers start with z (zK zV zT zBand zCup zHalves …); lesson pages should not declare z-names of their own.

Object.assign(MC, {
  ecf: '#0f1e33', head: '#8fb0d6', headEdge: '#4f6f99', tail: '#e9c46a', tailDk: '#b8953f',
  chol: '#e8a87c', cholEdge: '#a8714b',
  integral: '#6c8cff', integralEdge: '#3d56b8', peripheral: '#bba8ee', peripheralEdge: '#7e68b8',
  channel: '#4fa3a5', channelEdge: '#2a6668', carrier: '#7fd1b9', carrierEdge: '#3f8f78',
  pump: '#5b6ee1', pumpEdge: '#34419a', receptor: '#8fd6b0', receptorEdge: '#4f9a78',
  carb: '#f3c95c', carbEdge: '#a8862c',
  Na: '#ffb347', NaEdge: '#b87516', K: '#c07ae0', KEdge: '#8346a3', Cl: '#8fd6b0', ClEdge: '#4f9a78', H: '#ff7aa8', HEdge: '#b8436c',
  O2: '#e5533d', Cgas: '#5b6472', dye1: '#f07a6a', dye2: '#5fd3e8', water: '#cfeefa',
  atp: '#ffd27a', adp: '#e9e2c8', down: '#f2efe6', against: '#f39a2b', plus: '#e5533d', minus: '#6c8cff',
  rbc: '#d9534f', rbcDk: '#9e2f2c', wall: '#c9b27a', wallDk: '#8f7a48', vac: '#3a6ea5', vacEdge: '#a9c6ea',
  ecm: '#f0b45a', fibronectin: '#8fd6b0', actin: '#ff7aa8', coat: '#bba8ee', ligand: '#f07a6a', vesicle: '#a8e0ea', food: '#d9c7a0',
});

/* ---------- helpers ---------- */
const zK = k => Math.round(mClamp(+k || 0) * 2000) / 2000;
const zV = v => Math.round(Math.max(-1, Math.min(1, +v || 0)) * 2000) / 2000;
const zT = t => Math.round((+t || 0) * 120) / 120;
const zLerp = (a, b, k) => a + (b - a) * k;
const zL2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const zPoly = (pts, close = true) => 'M' + pts.map(cP).join('L') + (close ? 'Z' : '');
const zMix = (a, b, k) => mix(a, b, Math.round(mClamp(k) * 20) / 20);
function zNgon(n, r, cx = 0, cy = 0, rot = -Math.PI / 2) {
  const pts = []; for (let i = 0; i < n; i++) { const a = rot + i * 2 * Math.PI / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return zPoly(pts);
}
function zStar(r1, r2, n = 8, rot = -Math.PI / 2) {
  const pts = []; for (let i = 0; i < 2 * n; i++) { const a = rot + i * Math.PI / n, rr = i % 2 ? r2 : r1; pts.push([rr * Math.cos(a), rr * Math.sin(a)]); }
  return zPoly(pts);
}
// a smooth wander −1..1, pure in (i, t)
function zWob(i, t, seed = 0) { const a = wHash(i, seed + 11), b = wHash(i, seed + 23); return (Math.sin(t * (1.1 + a) + 6.283 * b) + .5 * Math.sin(t * (2.3 + b) + 6.283 * a)) / 1.5; }
// a membrane drawn as a band: blue faces with a gold core (heads, tails, heads); .set(d)
function zBand(p, d = '', { w = 24, dash } = {}) {
  const g = G(p), ex = dash ? { 'stroke-dasharray': dash, 'stroke-linecap': 'butt' } : {};
  const outer = path(g, d, { stroke: MC.head, 'stroke-width': w, ...ex });
  const inner = path(g, d, { stroke: MC.tail, 'stroke-width': Math.round(w * .4), ...ex });
  return Object.assign(g, { outer, inner, set(dd) { mD(outer, dd); mD(inner, dd); return g; } });
}
// a superellipse outline (n 2 ellipse … 8 rounded box); bulge pushes the middle of each side out (− in)
function zSuper(a, b, n = 6, { m = 72, bulge = 0, wob = 0, seed = 1, cx = 0, cy = 0 } = {}) {
  const pts = [];
  for (let i = 0; i < m; i++) {
    const th = i / m * 2 * Math.PI, c = Math.cos(th), s = Math.sin(th);
    let x = a * Math.sign(c) * Math.abs(c) ** (2 / n), y = b * Math.sign(s) * Math.abs(s) ** (2 / n);
    x += bulge * Math.sign(c) * Math.max(0, 1 - 2 * s * s); y += bulge * Math.sign(s) * Math.max(0, 1 - 2 * c * c);
    const k = 1 + wob * Math.sin(5 * th + seed);
    pts.push([cx + x * k, cy + y * k]);
  }
  return pts;
}
// two tails from (x, y0) running dir (1 down, −1 up); kink bends the second one; sw sways the ends
function zTails(x, y0, len, kink, sw, dir = 1) {
  const e = y0 + dir * len, m = y0 + dir * len * .55;
  let d = `M${cF(x - 3.6)} ${cF(y0)}Q${cF(x - 3.6 + sw * .3)} ${cF(m)} ${cF(x - 3.6 + sw)} ${cF(e)}`;
  if (kink) { const ky = y0 + dir * len * .45; d += `M${cF(x + 3.6)} ${cF(y0)}L${cF(x + 3.6)} ${cF(ky)}L${cF(x + 3.6 + len * .3 + sw * .6)} ${cF(e - dir * len * .06)}`; }
  else d += `M${cF(x + 3.6)} ${cF(y0)}Q${cF(x + 3.6 + sw * .3)} ${cF(m)} ${cF(x + 3.6 + sw)} ${cF(e)}`;
  return d;
}
// water dots crossing a closed outline: n dots on rays, in (dir 1), out (−1) or both (0); pure in t
function zWaterDots(p, n = 6) {
  const g = G(p), dots = [];
  for (let i = 0; i < n; i++) dots.push(solute(g, 'water', { r: 15 }));
  return Object.assign(g, {
    set(dir, t, rIn, rOut, ry = 1) {
      dots.forEach((d, i) => {
        const a = i / n * 2 * Math.PI + .5, u = cFrac(t * .45 + i / n), di = dir === 0 ? (i % 2 ? 1 : -1) : dir;
        const rr = di > 0 ? zLerp(rOut, rIn, u) : zLerp(rIn, rOut, u);
        cSet(d, { x: rr * Math.cos(a), y: rr * ry * Math.sin(a), o: Math.sin(Math.PI * u) });
      });
      return g;
    },
  });
}

/* ---------- solutes ---------- */
function solute(p, kind, { x = 0, y = 0, s = 1, o = 1, r, label = 'name' } = {}) {
  const g = G(p, { x, y, s, o }), dark = '#24160a', isIon = kind === 'Na' || kind === 'K' || kind === 'Cl' || kind === 'H';
  r = r ?? (isIon ? 20 : 15);
  const txt = (str, size, fill = dark) => wLabel(g, str, { y: size * .36, size, fill, weight: 800, o: 1 });
  const ion = { Na: ['+', 'Na⁺'], K: ['+', 'K⁺'], Cl: ['−', 'Cl⁻'], H: ['+', 'H⁺'] }[kind];
  if (kind === 'Na' || kind === 'Cl' || kind === 'H') {
    const rr = kind === 'H' ? r * .8 : r;
    mk('circle', { r: rr, fill: MC[kind], stroke: MC[kind + 'Edge'], 'stroke-width': 2.5 }, g);
    mk('ellipse', { cx: -rr * .35, cy: -rr * .42, rx: rr * .3, ry: rr * .17, fill: '#fff', 'fill-opacity': .4 }, g);
  } else if (kind === 'K') {
    mk('rect', { x: -r, y: -r, width: 2 * r, height: 2 * r, rx: r * .35, fill: MC.K, stroke: MC.KEdge, 'stroke-width': 2.5 }, g);
    mk('ellipse', { cx: -r * .38, cy: -r * .45, rx: r * .3, ry: r * .16, fill: '#fff', 'fill-opacity': .35 }, g);
  } else if (kind === 'sugar') {
    path(g, zNgon(6, r, 0, 0, 0), { fill: MC.carb, stroke: MC.carbEdge, 'stroke-width': 2.5 });
  } else if (kind === 'sucrose') {
    path(g, `M${-r * .3} 0H${r * .3}`, { stroke: MC.carbEdge, 'stroke-width': 3 });
    path(g, zNgon(6, r * .85, -r * .95, 0, 0), { fill: MC.carb, stroke: MC.carbEdge, 'stroke-width': 2.5 });
    path(g, zNgon(5, r * .78, r * .95, 0, Math.PI), { fill: '#f6d98a', stroke: MC.carbEdge, 'stroke-width': 2.5 });
  } else if (kind === 'O2') {
    for (const sx of [-1, 1]) mk('circle', { cx: sx * r * .45, r: r * .58, fill: MC.O2, stroke: '#a33424', 'stroke-width': 2 }, g);
  } else if (kind === 'CO2') {
    for (const sx of [-1, 1]) mk('circle', { cx: sx * r * .95, r: r * .5, fill: MC.O2, stroke: '#a33424', 'stroke-width': 2 }, g);
    mk('circle', { r: r * .58, fill: MC.Cgas, stroke: '#3d444f', 'stroke-width': 2 }, g);
  } else if (kind === 'dye1' || kind === 'dye2') {
    mk('circle', { r: r * .62, fill: MC[kind], stroke: mix(MC[kind], '#000000', .3), 'stroke-width': 1.5 }, g);
  } else if (kind === 'water') {
    mk('circle', { r: r * .36, fill: MC.water }, g);
  } else if (kind === 'waterMol') {
    waterMolecule(g, { s: r / 55, face: false });
  } else if (kind === 'ATP') {
    path(g, zStar(r * 1.45, r * .95, 9), { fill: MC.atp, stroke: '#c79a2e', 'stroke-width': 2 });
    if (label) txt('ATP', r * .72);
  } else if (kind === 'ADP') {
    mk('rect', { x: -r * 1.35, y: -r * .62, width: r * 2.7, height: r * 1.24, rx: r * .6, fill: MC.adp, stroke: '#9d957a', 'stroke-width': 2 }, g);
    if (label) txt('ADP', r * .72);
  } else if (kind === 'P' || kind === 'Pi') {
    mk('circle', { r: r * .8, fill: MC.P, stroke: MC.Pedge, 'stroke-width': 2 }, g);
    if (label) { if (kind === 'Pi') wChem(g, 'P_i', { y: r * .3, size: r * .85, fill: dark, weight: 800, o: 1 }); else txt('P', r * .85); }
  } else if (kind === 'ligand' || kind === 'signal') {
    path(g, zNgon(3, r, 0, 0, -Math.PI / 2), { fill: MC.ligand, stroke: '#a44a3e', 'stroke-width': 2 });
  } else if (kind === 'food') {
    path(g, cBlob(r, r * .8, { seed: 3, wob: .12 }), { fill: MC.food, stroke: '#8a6a3c', 'stroke-width': 3 });
    mk('circle', { cx: -r * .3, cy: -r * .1, r: r * .25, fill: '#c99a62' }, g);
  }
  if (ion && label) {
    const str = label === 'sign' ? ion[0] : ion[1], room = (kind === 'H' ? 1.5 : 1.78) * r;
    txt(str, label === 'sign' ? r * 1.25 : Math.min(r * (kind === 'H' ? .85 : .95), r * .95 * room / Math.max(1, uiW(str, r * .95))));
  }
  const sp = Object.assign(g, { kind, r, pose(nx, ny) { cSet(g, { x: nx, y: ny }); return sp; } });
  return sp;
}

function gradArrow(p, [x1, y1], [x2, y2], { against = false, w = 7, head = 22, o = 1 } = {}) {
  const g = G(p, { o });
  mArrow(g, [x1, y1], [x2, y2], { color: against ? MC.against : MC.down, w, head });
  let atp = null;
  if (against) {
    const L = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
    atp = solute(g, 'ATP', { x: (x1 + x2) / 2 + nx * 34, y: (y1 + y2) / 2 + ny * 34, r: 15 });
  }
  return Object.assign(g, { atp });
}

function gradientWedge(p, { x = 0, y = 0, w = 320, h = 90, color = COL.chalk, dir = 1, n = 40, o = 1, seed = 2 } = {}) {
  const g = G(p, { x, y, o }), hx = u => (h / 2) * (1 - .85 * u);
  const X = u => dir * (-w / 2 + u * w);
  path(g, zPoly([[X(0), -hx(0)], [X(1), -hx(1)], [X(1), hx(1)], [X(0), hx(0)]]), { fill: color, 'fill-opacity': .16, stroke: color, 'stroke-opacity': .4, 'stroke-width': 2 });
  let d = '';
  for (let i = 0; i < n; i++) { const u = 1 - Math.sqrt(wHash(i, seed)), v = wHash(i, seed + 7) * 2 - 1; d += `M${cF(X(u))} ${cF(v * hx(u) * .8)}h.01`; }
  path(g, d, { stroke: color, 'stroke-width': 8 });
  return g;
}

/* ---------- phospholipid and cholesterol ---------- */
function phospholipid(p, { x = 0, y = 0, s = 1, o = 1, r = 0, kink = false, head = 11, len = 38, color = MC.head, seed = 1 } = {}) {
  const g = G(p, { x, y, s, o, r });
  const tails = path(g, '', { stroke: MC.tail, 'stroke-width': 4.5 });
  const hd = mk('circle', { r: head, fill: color, stroke: MC.headEdge, 'stroke-width': 2 }, g);
  mk('circle', { cx: -head * .35, cy: -head * .35, r: head * .28, fill: '#fff', 'fill-opacity': .35 }, g);
  let last = null;
  const pl = Object.assign(g, {
    head: hd, tails, kink,
    wobble(t, amp = 1) {
      const sw = Math.round(amp * 4 * zWob(seed, zT(t), 3) * 10) / 10;
      if (sw !== last) { last = sw; mD(tails, zTails(0, head * .6, len, kink, sw)); }
      return pl;
    },
    pose(nx, ny, nr) { cSet(g, nr === undefined ? { x: nx, y: ny } : { x: nx, y: ny, r: nr }); return pl; },
    pt(name) { return cOut(g, name === 'head' ? [0, 0] : [0, head + len * .55]); },
  });
  return pl.wobble(0, 0);
}

function cholesterol(p, { x = 0, y = 0, s = 1, o = 1, r = 0, a = 4.6 } = {}) {
  const g = G(p, { x, y, s, o, r });
  const look = { fill: MC.chol, stroke: MC.cholEdge, 'stroke-width': 1.6 };
  let d = '';
  for (let i = 0; i < 3; i++) d += zNgon(6, a, (i % 2) * a * .9, 1.7 * a + i * a * 1.55, 0);
  d += zNgon(5, a * .9, a * .9 * ((3) % 2), 1.7 * a + 3 * a * 1.5, -Math.PI / 2);
  const ty = 1.7 * a + 3 * a * 1.5 + a;
  path(g, `M${cF(a * .9)} ${cF(ty)}l${cF(-a * .7)} ${cF(a)}l${cF(a * .7)} ${cF(a)}l${cF(-a * .6)} ${cF(a)}`, { stroke: MC.cholEdge, 'stroke-width': 2.4 });
  path(g, d, look);
  mk('circle', { r: a * .62, fill: MC.head, stroke: MC.headEdge, 'stroke-width': 1.4 }, g);
  return g;
}

/* ---------- bilayer ---------- */
function bilayer(p, { x = 0, y = 0, s = 1, o = 1, w = 900, sp = 26, head = 11, len = 38, unsat = .3, chol = 0, cholLayer, gaps = [], seed = 1, fluid = .5 } = {}) {
  const g = G(p, { x, y, s, o }), yH = 2 + len + head * .6, N = Math.ceil(w / (sp * .8) / 2) + 2;
  const tailP = path(g, '', { stroke: MC.tail, 'stroke-width': 4.2 });
  const cholG = G(cholLayer || g, { x: cholLayer ? x : 0, y: cholLayer ? y : 0, s: cholLayer ? s : 1, o: chol ? 1 : 0 });
  const edgeP = path(g, '', { stroke: MC.headEdge, 'stroke-width': 2 * head + 3 });
  const headP = path(g, '', { stroke: MC.head, 'stroke-width': 2 * head });
  const shineP = path(g, '', { stroke: '#ffffff', 'stroke-width': head * .55, 'stroke-opacity': .3 });
  const marks = G(g), markP = {};
  const chols = [];
  for (const leaf of [-1, 1]) for (let j = -N; j < N; j++) if (chol && wHash(j, seed + (leaf > 0 ? 5 : 9)) < chol) chols.push({ j, leaf, e: cholesterol(cholG, { r: leaf > 0 ? 180 : 0 }) });
  const S = { f: mClamp(fluid), u: unsat, t: 0, hop: null, flip: null };
  let key = '';
  const inGap = xx => gaps.some(([gx, gh]) => Math.abs(xx - gx) < gh);
  const markPiece = (k, color) => markP[k] || (markP[k] = phospholipid(marks, { head, len, color, o: 0 }));
  const xAt = (j, leaf, spc, amp) => j * spc + amp * zWob(j * 2 + (leaf > 0 ? 1 : 0), S.t, seed);
  function draw() {
    const k = JSON.stringify([S.f, S.u, S.t, S.hop, S.flip]); if (k === key) return; key = k;
    const spc = sp * (.86 + .28 * S.f), amp = .4 + 3.4 * S.f, sway = 1 + 5 * S.f;
    let dh = '', dt = '', ds = '';
    const hop = S.hop, flip = S.flip;
    for (const leaf of [-1, 1]) for (let j = -N; j <= N; j++) {
      let xj = xAt(j, leaf, spc, amp);
      if (hop && hop.leaf === leaf) {
        if (j === hop.j) continue;
        const m = j - hop.j; if (m >= 1 && m <= hop.n) xj -= spc * mClamp(hop.k * hop.n - (m - 1));
      }
      if (flip && leaf < 0 && j === flip.j) continue;
      if (Math.abs(xj) > w / 2 - head || inGap(xj)) continue;
      dh += `M${cF(xj)} ${cF(leaf * yH)}h.01`; ds += `M${cF(xj - head * .35)} ${cF(leaf * yH - head * .35)}h.01`;
      const kink = wHash(j, seed + (leaf > 0 ? 7 : 3)) < S.u;
      dt += zTails(xj, leaf * (yH - head * .6), len, kink, sway * zWob(j * 3 + leaf + 5, S.t * 1.7, seed + 1), -leaf);
    }
    mD(headP, dh); mD(edgeP, dh); mD(shineP, ds); mD(tailP, dt);
    chols.forEach(c => { const xc = xAt(c.j, c.leaf, spc, amp) + spc / 2; cSet(c.e, { x: xc, y: c.leaf * (yH - head * .5), o: Math.abs(xc) > w / 2 - head || inGap(xc) ? 0 : 1 }); });
    // Marked lipids exist only while in use, so stepping and seeking leave the same DOM (replay check).
    const used = new Set([hop && 'h' + hop.leaf + ':' + hop.j, flip && 'f' + flip.j]);
    for (const k2 in markP) if (!used.has(k2)) { markP[k2].remove(); delete markP[k2]; }
    if (hop) {
      const pc = markPiece('h' + hop.leaf + ':' + hop.j, hop.color), xh = xAt(hop.j, hop.leaf, spc, amp) + spc * hop.k * hop.n;
      const bump = Math.abs(Math.sin(Math.PI * cFrac(hop.k * hop.n))) * 10;
      pc.pose(xh, hop.leaf * (yH + bump), hop.leaf > 0 ? 180 : 0); mO(pc, 1);
    }
    if (flip) {
      const pc = markPiece('f' + flip.j, flip.color), q = io(flip.k), xf = xAt(flip.j, -1, spc, amp) + spc * .5 * q;
      pc.pose(xf, -yH * Math.cos(Math.PI * q), 180 * q); mO(pc, 1);
    }
  }
  const b = Object.assign(g, {
    yH, face: yH + head, thick: 2 * (yH + head), cholG,
    fluid(f) { S.f = zK(f); draw(); return b; },
    kinks(u) { S.u = zK(u); draw(); return b; },
    drift(t) { S.t = zT(t); draw(); return b; },
    cholesterol(k) { mO(cholG, zK(k)); return b; },
    hop(j, leaf, k, n = 3, color = MC.against) { S.hop = { j, leaf, k: zK(k), n, color }; if (!(k > 0)) S.hop = null; draw(); return b; },
    flipflop(j, k, color = MC.against) { S.flip = { j, k: zK(k), color }; if (!(k > 0)) S.flip = null; draw(); return b; },
    cholPt(i) { const c = chols[i] || chols[0]; if (!c) return [0, 0]; const st0 = st(c.e); return [st0.x, st0.y + c.leaf * 18]; },
    pt(name) {
      const ly = name === 'inner' ? yH : name === 'tails' ? -yH * .45 : name === 'heads' || name === 'outer' ? -yH : 0;
      return cOut(g, [0, ly]);
    },
  });
  draw();
  return b;
}

/* ---------- self-assembly in water ---------- */
function selfAssembly(p, { x = 0, y = 0, s = 1, o = 1, n = 16, kind = 'bilayer', spread = 560, water = 14, seed = 4 } = {}) {
  const g = G(p, { x, y, s, o }), wl = G(g), lipids = [], from = [], to = [];
  const wd = [];
  for (let i = 0; i < water; i++) wd.push(solute(wl, 'water', { r: 16, x: (wHash(i, seed + 40) - .5) * spread * 1.1, y: (wHash(i, seed + 41) - .5) * spread * .6 }));
  const Rm = Math.max(58, n * 24 / (2 * Math.PI)), yH = 2 + 38 + 11 * .6;
  for (let i = 0; i < n; i++) {
    lipids.push(phospholipid(g, { seed: i + seed, kink: wHash(i, seed) < .3 }));
    from.push([(wHash(i, seed + 1) - .5) * spread, (wHash(i, seed + 2) - .5) * spread * .55, wHash(i, seed + 3) * 360 - 180]);
    if (kind === 'micelle') { const a = i / n * 2 * Math.PI; to.push([Rm * Math.cos(a), Rm * Math.sin(a), a * 180 / Math.PI + 90]); }
    else { const h = Math.ceil(n / 2), row = i < h ? -1 : 1, jj = i < h ? i : i - h; to.push([(jj - (h - 1) / 2) * 26, row * yH, row > 0 ? 180 : 0]); }
  }
  const sa = Object.assign(g, {
    lipids,
    set(k, t = 0) {
      k = zK(k); t = zT(t);
      lipids.forEach((l, i) => {
        const a0 = wHash(i, seed + 9) * .45, c = io(mRamp(k, a0, a0 + .55)), f = from[i], e = to[i];
        let dr = ((e[2] - f[2]) % 360 + 540) % 360 - 180;
        const j = (1 - c) * 14;
        l.pose(zLerp(f[0], e[0], c) + j * zWob(i, t, seed), zLerp(f[1], e[1], c) + j * zWob(i + 30, t, seed), f[2] + dr * c);
        l.wobble(t, .4 + .6 * (1 - c));
      });
      wd.forEach((d, i) => cSet(d, { x: st(d)._x0 + 8 * zWob(i + 60, t, seed), y: st(d)._y0 + 8 * zWob(i + 90, t, seed) }));
      return sa;
    },
  });
  wd.forEach(d => { st(d)._x0 = st(d).x; st(d)._y0 = st(d).y; });
  return sa.set(0, 0);
}

/* ---------- carbohydrate chain ---------- */
function carbChain(p, { x = 0, y = 0, s = 1, o = 1, n = 5, a = 7, branch = 2, dir = -1, seed = 1 } = {}) {
  const g = G(p, { x, y, s, o }), pts = [];
  for (let i = 0; i < n; i++) pts.push([i ? ((i + seed) % 2 ? 4 : -4) : 0, dir * (a * 1.1 + i * a * 1.95)]);
  const bp = [];
  if (branch && n > 2) { const b0 = pts[1], sd = seed % 2 ? 1 : -1; for (let j = 0; j < branch; j++) bp.push([b0[0] + sd * a * 1.75 * (j + 1), b0[1] + dir * a * .9 * (j + .6)]); }
  const links = path(g, zPoly([[0, 0], ...pts], false) + (bp.length ? zPoly([pts[1], ...bp], false) : ''), { stroke: MC.carbEdge, 'stroke-width': 2.5 }, { d: 0 });
  const hex = [...pts, ...bp].map(q => put(path(g, zNgon(6, a, q[0], q[1], 0), { fill: MC.carb, stroke: MC.carbEdge, 'stroke-width': 1.5 }), { o: 0 }));
  const top = pts[n - 1];
  const c = Object.assign(g, {
    hexes: hex,
    grow(k) { k = zK(k); cSet(links, { d: k }); hex.forEach((h, i) => mO(h, mRamp(k, i / hex.length * .9, i / hex.length * .9 + .12))); return c; },
    tip() { return cOut(g, top); },
  });
  return c.grow(1);
}

/* ---------- membrane proteins ---------- */
function integralProtein(p, { x = 0, y = 0, s = 1, o = 1, w = 80, h = 150, color = MC.integral, edge = MC.integralEdge, seed = 1 } = {}) {
  const g = G(p, { x, y, s, o });
  const body = path(g, cBlob(w / 2, h / 2, { seed, wob: .05 }), { fill: color, stroke: edge, 'stroke-width': 3.5 });
  mk('ellipse', { cx: -w * .17, cy: -h * .24, rx: w * .15, ry: h * .12, fill: '#fff', 'fill-opacity': .22 }, g);
  return Object.assign(g, { body, w, h, pt(name) { return cOut(g, name === 'top' ? [0, -h / 2] : name === 'bottom' ? [0, h / 2] : [0, 0]); } });
}
function peripheralProtein(p, { x = 0, y = 0, s = 1, o = 1, w = 84, h = 46, seed = 2 } = {}) {
  return integralProtein(p, { x, y, s, o, w, h, color: MC.peripheral, edge: MC.peripheralEdge, seed });
}

function helixProtein(p, { x = 0, y = 0, s = 1, o = 1, n = 1, mem = 110, color = MC.integral } = {}) {
  const g = G(p, { x, y, s, o }), H = mem / 2, gap = 46, xs = i => (i - (n - 1) / 2) * gap;
  const loopL = G(g), spanL = G(g), labL = G(g, { o: 0 });
  let ld = `M${cF(xs(0) - 46)} ${-H - 80}C${cF(xs(0) - 46)} ${-H - 30} ${cF(xs(0))} ${-H - 40} ${cF(xs(0))} ${-H + 2}`;
  const spans = [];
  for (let i = 0; i < n; i++) {
    const down = i % 2 === 0, pts = [];
    for (let yy = -H; yy <= H + .1; yy += 2) { const u = (yy + H) / (2 * H); pts.push([xs(i) + 13 * Math.sin(u * 2 * Math.PI * (mem / 16)), down ? yy : -yy]); }
    spans.push(path(spanL, zPoly(pts, false), { stroke: color, 'stroke-width': 6 }));
    if (i < n - 1) { const yE = down ? H : -H, b = down ? 1 : -1; ld += `M${cF(xs(i))} ${yE}C${cF(xs(i))} ${yE + b * 50} ${cF(xs(i + 1))} ${yE + b * 50} ${cF(xs(i + 1))} ${yE}`; }
  }
  const endDown = (n - 1) % 2 === 0, yEnd = endDown ? H : -H, b = endDown ? 1 : -1, cEnd = [xs(n - 1) + 46, yEnd + b * 80];
  ld += `M${cF(xs(n - 1))} ${yEnd}C${cF(xs(n - 1))} ${yEnd + b * 40} ${cF(cEnd[0])} ${yEnd + b * 30} ${cF(cEnd[0])} ${cF(cEnd[1])}`;
  path(loopL, ld, { stroke: color, 'stroke-width': 6 });
  const nPt = [xs(0) - 46, -H - 80];
  wLabel(labL, 'N', { x: nPt[0], y: nPt[1] - 14, size: 28, fill: COL.chalk, weight: 800, o: 1 });
  wLabel(labL, 'C', { x: cEnd[0], y: cEnd[1] + (b > 0 ? 34 : -14), size: 28, fill: COL.chalk, weight: 800, o: 1 });
  const hp = Object.assign(g, {
    spans,
    hydro(k) { k = zK(k); spans.forEach(sp => cAttr(sp, 'stroke', zMix(color, MC.tail, k))); return hp; },
    labels(k) { mO(labL, zK(k)); return hp; },
    pt(name) { return cOut(g, name === 'N' ? nPt : name === 'C' ? cEnd : [xs(0), 0]); },
  });
  return hp;
}

function receptorProtein(p, { x = 0, y = 0, s = 1, o = 1, h = 150 } = {}) {
  const g = G(p, { x, y, s, o }), top = -h / 2;
  const stalk = path(g, cStadium(42, h, 21), { fill: MC.receptor, stroke: MC.receptorEdge, 'stroke-width': 3.5 });
  const cup = path(g, `M-30 ${top - 30}Q-30 ${top + 6} 0 ${top + 6}Q30 ${top + 6} 30 ${top - 30}`, { stroke: MC.receptor, 'stroke-width': 14 });
  const relay = put(path(g, zStar(22, 10, 6), { fill: COL.chalk, stroke: '#b9b39c', 'stroke-width': 2 }), { y: h / 2 + 34, s: 0, o: 0 });
  const sig = solute(g, 'signal', { r: 15 });
  const A = [80, top - 150], B = [0, top - 10];
  const rc = Object.assign(g, {
    signal: sig, relay,
    bind(k) {
      k = zK(k); const a = io(mRamp(k, 0, .6)), q = zL2(A, B, a);
      cSet(sig, { x: q[0], y: q[1], r: 180 * (1 - a) });
      const lit = mRamp(k, .6, .75);
      cAttr(stalk, 'fill', zMix(MC.receptor, '#c9f2dc', lit)); cAttr(cup, 'stroke', zMix(MC.receptor, '#c9f2dc', lit));
      cSet(relay, { s: io(mRamp(k, .65, .85)), o: mRamp(k, .65, .75), r: 40 * mRamp(k, .65, 1) });
      return rc;
    },
  });
  return rc.bind(0);
}

function enzymeProtein(p, { x = 0, y = 0, s = 1, o = 1, w = 84, h = 150 } = {}) {
  const g = G(p, { x, y, s, o });
  integralProtein(g, { w, h, color: MC.enzyme, edge: MC.enzymeEdge, seed: 4 });
  path(g, `M-16 ${-h / 2 - 4}L0 ${-h / 2 + 18}L16 ${-h / 2 - 4}Z`, { fill: MC.ecf });
  const sub = solute(g, 'dye1', { r: 20 }), flash = put(mk('circle', { r: 22, fill: '#fff6d8', 'fill-opacity': .7 }, g), { y: -h / 2 + 4, o: 0 });
  const pr1 = solute(g, 'sugar', { r: 10 }), pr2 = solute(g, 'dye1', { r: 15 });
  const S0 = [-90, -h / 2 - 90], B = [0, -h / 2 + 4];
  const ez = Object.assign(g, {
    react(k) {
      k = zK(k); const a = io(mRamp(k, 0, .4)), q = zL2(S0, B, a), m = io(mRamp(k, .55, 1));
      cSet(sub, { x: q[0], y: q[1], o: 1 - mRamp(k, .45, .5) });
      mO(flash, Math.sin(Math.PI * mRamp(k, .4, .58)));
      const a1 = zL2(B, [60, -h / 2 - 90], m), a2 = zL2(B, [105, -h / 2 - 40], m), on = k > .5 ? mRamp(k, .5, .55) : 0;
      cSet(pr1, { x: a1[0], y: a1[1], o: on }); cSet(pr2, { x: a2[0], y: a2[1], o: on });
      return ez;
    },
  });
  return ez.react(0);
}

/* ---------- channels and carriers ---------- */
function zHalves(g, w, h, A, fill, edge, sep) {
  const sinA = Math.sin(A * Math.PI / 180), cx0 = sep ?? (w / 2 + h / 2 * sinA);
  const mkHalf = sd => { const hg = G(g, { x: sd * cx0 }); path(hg, cStadium(w, h, w / 2), { fill, stroke: edge, 'stroke-width': 3.5 }); mk('ellipse', { cx: -w * .12, cy: -h * .28, rx: w * .16, ry: h * .1, fill: '#fff', 'fill-opacity': .2 }, hg); return hg; };
  const L = mkHalf(-1), R = mkHalf(1);
  // u 0: open at the top (outside), .5 shut, 1: open at the bottom (inside)
  return { L, R, cx0, set(u) { const ang = A * (1 - 2 * u); cSet(L, { r: -ang }); cSet(R, { r: ang }); } };
}

function channelProtein(p, { x = 0, y = 0, s = 1, o = 1, w = 46, h = 150, pore = 30, aqua = false, gated = !aqua, kind, n = 4 } = {}) {
  const g = G(p, { x, y, s, o });
  const hv = zHalves(g, w, h, 0, MC.channel, MC.channelEdge, pore / 2 + w / 2);
  const partL = G(g), parts = [];
  for (let i = 0; i < n; i++) parts.push(aqua ? waterMolecule(partL, { s: .26, face: false }) : solute(partL, kind || 'K', { r: 15 }));
  if (aqua) { const pinch = G(g); for (const sd of [-1, 1]) mk('ellipse', { cx: sd * (pore / 2 + 2), cy: 0, rx: 6, ry: 22, fill: MC.channel }, pinch); }
  const lid = gated ? G(g, { x: -pore / 2 - 4, y: -h / 2 + 8 }) : null;
  if (lid) mk('rect', { x: 0, y: -6, width: pore + 10, height: 12, rx: 6, fill: '#3d8587', stroke: MC.channelEdge, 'stroke-width': 2.5 }, lid);
  let open = gated ? 0 : 1, lastT = 0, fl = { dir: 1, speed: 70 };
  function flowDraw() {
    const L = h + 170;
    parts.forEach((e, i) => {
      const u = cFrac(lastT * fl.speed / L + i / n), yy = (fl.dir > 0 ? -L / 2 + L * u : L / 2 - L * u);
      const fade = mRamp(u, 0, .12) * mRamp(1 - u, 0, .12), beyond = fl.dir > 0 ? yy > -h / 2 - 16 : yy < h / 2 + 16;
      cSet(e, { x: (aqua ? 0 : 2.5 * zWob(i, lastT, 3)), y: yy, o: fade * (beyond ? open : 1), ...(aqua ? { r: Math.round((i * 70 + lastT * 40) % 360) } : {}) });
    });
  }
  const ch = Object.assign(g, {
    halves: hv, lid, parts,
    gate(k) { if (!lid) return ch; open = zK(k); cSet(lid, { r: -80 * open }); flowDraw(); return ch; },
    flow(t, { dir = 1, speed = 70 } = {}) { lastT = zT(t); fl = { dir, speed }; flowDraw(); return ch; },
    pt(name) { return cOut(g, name === 'top' ? [0, -h / 2 - 20] : name === 'bottom' ? [0, h / 2 + 20] : [hv.cx0 + w / 2, -h * .2]); },
  });
  flowDraw();
  return ch;
}
const aquaporin = (p, opts = {}) => channelProtein(p, { ...opts, aqua: true });

function carrierProtein(p, { x = 0, y = 0, s = 1, o = 1, w = 56, h = 150, A = 10, solutes = ['sugar'], color = MC.carrier, edge = MC.carrierEdge } = {}) {
  const g = G(p, { x, y, s, o });
  const hv = zHalves(g, w, h, A, color, edge), solL = G(g);
  const m = solutes.length, ys = m === 1 ? [0] : solutes.map((_, i) => (i - (m - 1) / 2) * 36);
  const sol = solutes.map(kd => solute(solL, kd, { r: kd === 'H' ? 19 : 16 }));
  const start = ys.map((_, i) => [m === 1 ? -30 : -40 + 80 * i / (m - 1), -h / 2 - 80 - 22 * i]);
  const end = ys.map((_, i) => [m === 1 ? 30 : -50 + 100 * i / (m - 1), h / 2 + 80 + 22 * i]);
  const cr = Object.assign(g, {
    halves: hv, sol,
    flip(u) { hv.set(zK(u)); return cr; },
    carry(k) {
      k = zK(k);
      const a = io(mRamp(k, 0, .25)), e = io(mRamp(k, .58, .82));
      hv.set(io(mRamp(k, .28, .55)) - io(mRamp(k, .85, 1)));
      sol.forEach((sp, i) => { const site = [0, ys[i]], q = e > 0 ? zL2(site, end[i], e) : zL2(start[i], site, a); cSet(sp, { x: q[0], y: q[1] }); });
      return cr;
    },
  });
  return cr.carry(0);
}
const cotransporter = (p, opts = {}) => carrierProtein(p, { solutes: ['H', 'sucrose'], ...opts });

function naKPump(p, { x = 0, y = 0, s = 1, o = 1, w = 66, h = 176, A = 10 } = {}) {
  const g = G(p, { x, y, s, o });
  const hv = zHalves(g, w, h, A, MC.pump, MC.pumpEdge), cx0 = hv.cx0, ionL = G(g);
  const pAtt = solute(hv.R, 'P', { x: -w * .05, y: h / 2 + 8, r: 15, o: 0 });
  const top = G(g);
  const na = [0, 1, 2].map(() => solute(ionL, 'Na', { r: 18 })), kk = [0, 1].map(() => solute(ionL, 'K', { r: 17 }));
  const atp = solute(top, 'ATP', { r: 16 }), adp = solute(top, 'ADP', { r: 16, o: 0 }), pi = solute(top, 'Pi', { r: 15, o: 0 });
  const H2 = h / 2;
  const naIn = [[-70, H2 + 60], [5, H2 + 95], [75, H2 + 55]], naSite = [[0, -38], [0, 0], [0, 38]], naOut = [[-70, -H2 - 70], [10, -H2 - 115], [85, -H2 - 60]];
  const kOut = [[-115, -H2 - 45], [130, -H2 - 110]], kSite = [[0, -18], [0, 24]], kIn = [[-45, H2 + 70], [45, H2 + 105]];
  const atp0 = [160, H2 + 80], atp1 = [cx0 + 6, H2 + 34];
  const pm = Object.assign(g, {
    halves: hv, na, k: kk, atp, adp, p: pAtt, pi,
    step(k) { return Math.min(6, Math.floor(zK(k) * 6) + 1); },
    cycle(k) {
      k = zK(k); const q = k * 6;
      // shape: open inside (u 1) until step 3, outside (u 0) from step 3 to 5, inside again
      hv.set(1 - io(mRamp(q, 2, 2.5)) + io(mRamp(q, 4.4, 5)));
      na.forEach((e, i) => {
        const b = io(mRamp(q, i * .3, i * .3 + .6)), l = io(mRamp(q, 2.45 + i * .1, 3));
        const pt = l > 0 ? zL2(naSite[i], naOut[i], l) : zL2(naIn[i], naSite[i], b);
        cSet(e, { x: pt[0], y: pt[1] });
      });
      kk.forEach((e, i) => {
        const b = io(mRamp(q, 3 + i * .25, 3.6 + i * .25)), l = io(mRamp(q, 5 + i * .1, 5.8));
        const pt = l > 0 ? zL2(kSite[i], kIn[i], l) : zL2(kOut[i], kSite[i], b);
        cSet(e, { x: pt[0], y: pt[1], o: q < 2.6 ? 0 : mRamp(q, 2.6, 2.9) });
      });
      const a = io(mRamp(q, 1, 1.45)), ap = zL2(atp0, atp1, a);
      cSet(atp, { x: ap[0], y: ap[1], o: q < 1.45 ? 1 : 1 - mRamp(q, 1.45, 1.6) });
      const dm = io(mRamp(q, 1.5, 2)), dp = zL2(atp1, [190, H2 + 120], dm);
      cSet(adp, { x: dp[0], y: dp[1], o: q < 1.5 ? 0 : mRamp(q, 1.5, 1.6) * (1 - mRamp(q, 2.2, 2.5)) });
      mO(pAtt, q < 1.45 ? 0 : q < 4 ? mRamp(q, 1.45, 1.6) : 0);
      const pm2 = io(mRamp(q, 4, 4.5)), pp = zL2([cx0 - w * .05, H2 + 8], [cx0 + 110, H2 + 70], pm2);
      cSet(pi, { x: pp[0], y: pp[1], o: q < 4 ? 0 : 1 - mRamp(q, 5.3, 5.6) });
      return pm;
    },
    pt(name) { return cOut(g, name === 'out' ? [0, -H2 - 40] : name === 'in' ? [0, H2 + 40] : [cx0, H2 + 10]); },
  });
  return pm.cycle(0);
}

function protonPump(p, { x = 0, y = 0, s = 1, o = 1, w = 60, h = 160, n = 4 } = {}) {
  const g = G(p, { x, y, s, o });
  const hv = zHalves(g, w, h, 6, MC.pump, MC.pumpEdge), ionL = G(g); hv.set(.5);
  const top = G(g), H2 = h / 2;
  const hs = [], atps = [], adps = [];
  for (let i = 0; i < n; i++) { hs.push(solute(ionL, 'H', { r: 19 })); atps.push(solute(top, 'ATP', { r: 14, o: 0 })); adps.push(solute(top, 'ADP', { r: 14, o: 0 })); }
  const start = i => [-60 + 40 * i, H2 + 60 + 18 * (i % 2)], fin = i => [-120 + 80 * i, -H2 - 50 - 34 * (i % 2)];
  const pp = Object.assign(g, {
    h: hs,
    run(k) {
      k = zK(k);
      hs.forEach((e, i) => {
        const a = i / n, b = (i + 1) / n, u = mRamp(k, a, b);
        const atp0 = [130, H2 + 90], atp1 = [hv.cx0 + 8, H2 + 26];
        const am = io(mRamp(u, 0, .35)), ap = zL2(atp0, atp1, am);
        cSet(atps[i], { x: ap[0], y: ap[1], o: u <= 0 || u >= 1 ? 0 : mRamp(u, 0, .08) * (1 - mRamp(u, .35, .45)) });
        const dm = io(mRamp(u, .4, .8)), dp = zL2(atp1, [150, H2 + 120], dm);
        cSet(adps[i], { x: dp[0], y: dp[1], o: u <= .38 || u >= 1 ? 0 : mRamp(u, .38, .45) * (1 - mRamp(u, .8, .95)) });
        const m1 = io(mRamp(u, .3, .6)), m2 = io(mRamp(u, .6, .95));
        const q = m2 > 0 ? zL2([0, -10], fin(i), m2) : zL2(start(i), [0, 10], m1);
        cSet(e, { x: q[0], y: q[1] });
      });
      return pp;
    },
    pt(name) { return cOut(g, name === 'out' ? [0, -H2 - 40] : [0, H2 + 40]); },
  });
  return pp.run(0);
}

/* ---------- diffusion: a particle cloud across a membrane ---------- */
function particleCloud(p, { x = 0, y = 0, s = 1, o = 1, w = 640, h = 360, membrane = true, box = true, solutes = [{ kind: 'dye1', left: 16, right: 0 }], r = 14, exchange = true, seed = 1, pad = 26 } = {}) {
  const g = G(p, { x, y, s, o });
  if (box) mk('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 18, fill: '#15304f', stroke: '#a9c2df', 'stroke-width': 4 }, g);
  if (membrane) zBand(g, `M0 ${-h / 2 + 3}V${h / 2 - 3}`, { w: 18, dash: '34 14' });
  const pl = G(g), parts = [];
  solutes.forEach((sd, si) => {
    const list = [];
    for (let i = 0; i < sd.left + sd.right; i++) {
      const side = i < sd.left ? -1 : 1, id = parts.length;
      const e = solute(pl, sd.kind, { r });
      list.push({ e, side, id, si, cross: [] });
      parts.push(list[list.length - 1]);
    }
    if (sd.perm === false) return;
    const dense = sd.left >= sd.right ? -1 : 1, m = Math.floor(Math.abs(sd.left - sd.right) / 2);
    const cand = list.filter(q => q.side === dense).sort((a, b) => wHash(a.id, seed + 3) - wHash(b.id, seed + 3));
    cand.slice(0, m).forEach((q, rk) => q.cross.push({ k0: .05 + .7 * (rk / Math.max(1, m)) + .04 * wHash(q.id, seed + 5), to: -dense }));
    if (exchange && sd.left + sd.right >= 4) {
      const L = list.find(q => q.side === -1 && !q.cross.length), R = list.slice().reverse().find(q => q.side === 1 && !q.cross.length);
      if (L && R) { L.cross.push({ k0: .82, to: 1 }); R.cross.push({ k0: .85, to: -1 }); }
    }
  });
  const wander = (q, side, t) => {
    const hx = wHash(q.id, seed + 11), hy = wHash(q.id, seed + 13), inner = pad + r;
    let bx = side * (inner + (w / 2 - 2 * inner) * hx) + 14 * zWob(q.id, t, seed);
    if (side * bx < inner * .7) bx = side * inner * .7;
    return [bx, -h / 2 + inner + (h - 2 * inner) * hy + 12 * zWob(q.id + 500, t, seed)];
  };
  const where = (q, k, t) => {
    const c = q.cross[0]; if (!c) return wander(q, q.side, t);
    const u = mRamp(k, c.k0, c.k0 + .14), from = q.side, to = c.to;
    if (u <= 0) return wander(q, from, t);
    if (u >= 1) return wander(q, to, t);
    const yc = wander(q, from, c.k0 * 10)[1];
    return u < .5 ? zL2(wander(q, from, t), [0, yc], io(u * 2)) : zL2([0, yc], wander(q, to, t), io(u * 2 - 1));
  };
  const pc = Object.assign(g, {
    pieces: parts.map(q => q.e),
    set(k, t = 0) { k = zK(k); t = zT(t); parts.forEach(q => { const pt = where(q, k, t); cSet(q.e, { x: pt[0], y: pt[1] }); }); return pc; },
    counts(k) {
      k = zK(k);
      return solutes.map((sd, si) => {
        const c = { kind: sd.kind, left: 0, right: 0, toRight: 0, toLeft: 0, net: 0 };
        parts.filter(q => q.si === si).forEach(q => {
          const x0 = q.cross[0], done = x0 && k >= x0.k0 + .07, side = done ? x0.to : q.side;
          if (side < 0) c.left++; else c.right++;
          if (done) { if (x0.to > 0) c.toRight++; else c.toLeft++; }
        });
        c.net = c.toRight - c.toLeft; return c;
      });
    },
  });
  return pc.set(0, 0);
}

/* ---------- osmosis: U-tube ---------- */
function uTube(p, { x = 0, y = 0, s = 1, o = 1, w = 560, h = 460, aw = 150, left = 4, right = 12, waters = 22, seed = 2 } = {}) {
  const g = G(p, { x, y, s, o }), R = 50, W2 = w / 2;
  const fill = path(g, '', { fill: '#1f5285' });
  const mem = zBand(g, `M0 ${-aw + 4}V-4`, { w: 12, dash: '16 8' });
  const pl = G(g);
  path(g, `M${-W2} ${-h}V${-R}Q${-W2} 0 ${-W2 + R} 0H${W2 - R}Q${W2} 0 ${W2} ${-R}V${-h}M${-W2 + aw} ${-h}V${-aw}H${W2 - aw}V${-h}`, { stroke: WC.glass, 'stroke-width': 6 });
  const sug = [], wat = [];
  const mkP = (side, kind, i, list) => list.push({ e: solute(pl, kind, { r: kind === 'sugar' ? 13 : 13 }), side, i, conn: wHash(i, seed + (kind === 'sugar' ? 1 : 2) + side) < .45 });
  for (let i = 0; i < left; i++) mkP(-1, 'sugar', i, sug);
  for (let i = 0; i < right; i++) mkP(1, 'sugar', i + 40, sug);
  for (let i = 0; i < waters; i++) mkP(i % 2 ? 1 : -1, 'water', i + 80, wat);
  const cross = [0, 1, 2, 3].map(() => solute(pl, 'water', { r: 13 }));
  const h0 = h * .55, dl = h * .17;
  let lv = [-h0, -h0];
  const placeIn = (q, t, yl, yr) => {
    const hx = wHash(q.i, seed + 7), hy = wHash(q.i, seed + 9), lvl = q.side < 0 ? yl : yr, m = 16;
    let px, py;
    if (q.conn) { px = q.side * (m + (W2 - 2 * m) * hx); py = -aw + m + (aw - 2 * m) * hy; }
    else { px = q.side * (W2 - aw + m + (aw - 2 * m) * hx); py = lvl + m + (-aw - lvl - m) * hy; }
    return [px + 5 * zWob(q.i, t, seed), py + 5 * zWob(q.i + 9, t, seed)];
  };
  const ut = Object.assign(g, {
    set(k, t = 0) {
      k = zK(k); t = zT(t);
      const yl = -(h0 - dl * k), yr = -(h0 + dl * k); lv = [yl, yr];
      mD(fill, `M${-W2 + 3} ${cF(yl)}H${-W2 + aw - 3}V${-aw + 3}H${W2 - aw + 3}V${cF(yr)}H${W2 - 3}V${-R}Q${W2 - 3} -3 ${W2 - R} -3H${-W2 + R}Q${-W2 + 3} -3 ${-W2 + 3} ${-R}Z`);
      [...sug, ...wat].forEach(q => { const pt = placeIn(q, t, yl, yr); cSet(q.e, { x: pt[0], y: pt[1] }); });
      cross.forEach((e, i) => { const u = cFrac(t * .35 + i / 4), yy = -aw * (.25 + .5 * wHash(i, seed + 30)); cSet(e, { x: -90 + 180 * u, y: yy, o: (1 - k) * Math.sin(Math.PI * u) }); });
      return ut;
    },
    levels() { return [cOut(g, [-W2 + aw / 2, lv[0]]), cOut(g, [W2 - aw / 2, lv[1]])]; },
    pt(name) { return cOut(g, name === 'left' ? [-W2 + aw / 2, lv[0]] : name === 'right' ? [W2 - aw / 2, lv[1]] : [0, -aw / 2]); },
  });
  return ut.set(0, 0);
}

/* ---------- tonicity: red blood cell, plant cell, Paramecium ---------- */
function redCell(p, { x = 0, y = 0, s = 1, o = 1, R = 100, water = true } = {}) {
  const g = G(p, { x, y, s, o });
  const spill = G(g), bits = [];
  for (let i = 0; i < 9; i++) bits.push(put(mk('circle', { r: 5 + 3 * wHash(i, 4), fill: MC.rbc }, spill), { o: 0 }));
  const body = path(g, '', { fill: MC.rbc, stroke: MC.rbcDk, 'stroke-width': 4 });
  const dimple = path(g, '', { fill: '#b33f3b' });
  const shine = path(g, '', { fill: '#ffffff', 'fill-opacity': .18 });
  const wd = water ? zWaterDots(g, 6) : null;
  const GAP = -Math.PI / 3;
  const rc = Object.assign(g, {
    set(v, t = 0) {
      v = zV(v); t = zT(t);
      const sw = Math.max(0, v), sh = Math.max(0, -v), b = mRamp(v, .82, 1);
      const sc = 1 - .24 * sh + .06 * sw, rx = R * sc * (1 + .04 * sw), ry = R * sc * (.6 + .38 * sw - .04 * sh);
      const pts = [], gw = .5 * b + .05;
      for (let i = 0; i < 120; i++) {
        const th = i / 120 * 2 * Math.PI;
        let rr = 1 + .26 * sh * Math.abs(Math.sin(7 * th + .4)) ** 6;
        const dth = Math.abs(((th - GAP + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
        if (b > 0 && dth < gw) rr *= 1 - b * .42 * (.55 + .45 * Math.abs(Math.sin(11 * th))) * (1 - dth / gw);
        pts.push([rx * rr * Math.cos(th), ry * rr * Math.sin(th)]);
      }
      mD(body, zPoly(pts));
      cAttr(body, 'fill', zMix(MC.rbc, '#6a2b33', b * .6));
      const dk = Math.max(0, 1 - sw * 1.3) * (1 - .4 * sh);
      mD(dimple, dk > .02 ? `M${cF(-rx * .5 * dk)} ${cF(-ry * .08)}a${cF(rx * .5 * dk)} ${cF(ry * .34 * dk)} 0 1 0 ${cF(rx * dk)} 0a${cF(rx * .5 * dk)} ${cF(ry * .34 * dk)} 0 1 0 ${cF(-rx * dk)} 0Z` : '');
      mD(shine, `M${cF(-rx * .55)} ${cF(-ry * .55)}a${cF(rx * .22)} ${cF(ry * .12 + 2)} 0 1 0 ${cF(rx * .44)} 0a${cF(rx * .22)} ${cF(ry * .12 + 2)} 0 1 0 ${cF(-rx * .44)} 0Z`);
      const gp = [rx * Math.cos(GAP), ry * Math.sin(GAP)];
      bits.forEach((e, i) => {
        const a = GAP + (wHash(i, 8) - .5) * 1.4, d = 10 + (60 + 70 * wHash(i, 9)) * io(b);
        cSet(e, { x: gp[0] + d * Math.cos(a), y: gp[1] + d * Math.sin(a), o: b > 0 ? mRamp(b, 0, .3) * (1 - .4 * mRamp(b, .7, 1)) : 0 });
      });
      if (wd) wd.set(v > .04 ? 1 : v < -.04 ? -1 : 0, t, R * .45 * sc, R * 1.8, .75);
      return rc;
    },
  });
  return rc.set(0, 0);
}

function plantCell(p, { x = 0, y = 0, s = 1, o = 1, w = 300, h = 220, water = true } = {}) {
  const g = G(p, { x, y, s, o });
  const strands = path(g, '', { stroke: MC.head, 'stroke-width': 2 }, { o: 0 });
  const proto = path(g, '', { fill: '#24466f', stroke: MC.head, 'stroke-width': 4 });
  const vac = path(g, '', { fill: MC.vac, stroke: MC.vacEdge, 'stroke-width': 3 });
  const nuc = G(g); mk('circle', { r: 15, fill: CC.nucleo, stroke: CC.env, 'stroke-width': 3 }, nuc); mk('circle', { r: 5, fill: CC.nucleolus }, nuc);
  const chl = [0, 1, 2, 3].map(() => { const c = G(g); mk('ellipse', { rx: 13, ry: 7, fill: CC.chloro, stroke: '#2f8f46', 'stroke-width': 2 }, c); return c; });
  const wall = path(g, '', { stroke: MC.wall, 'stroke-width': 14 });
  const wd = water ? zWaterDots(g, 6) : null;
  let pa = w / 2, pb = h / 2;
  const pc = Object.assign(g, {
    set(v, t = 0) {
      v = zV(v); t = zT(t);
      const bulge = v > 0 ? zLerp(-5, 9, v) : -5, pp = Math.max(0, -v);
      mD(wall, zPoly(zSuper(w / 2, h / 2, 7, { bulge })));
      pa = (w / 2 - 10) * (1 - .4 * pp); pb = (h / 2 - 10) * (1 - .36 * pp);
      const pn = 7 - 4.4 * pp, pts = zSuper(pa, pb, pn, { bulge: v > 0 ? bulge : -5 * (1 - pp), wob: .05 * pp, seed: 2 });
      mD(proto, cSmooth(pts, true));
      const vs = v >= 0 ? .64 + .18 * v : .64 - .3 * pp;
      mD(vac, cSmooth(zSuper(pa * vs, pb * vs * .95, 4, { cx: pa * .1 }), true));
      cSet(nuc, { x: -pa * .7, y: -pb * .45 });
      [.6, 1.9, 3.5, 4.6].forEach((th, i) => {
        const q = pts[Math.round(th / (2 * Math.PI) * pts.length) % pts.length];
        cSet(chl[i], { x: q[0] * .84, y: q[1] * .84, r: th * 180 / Math.PI + 90 });
      });
      let sd = '';
      for (const [cx, cy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const q = pts[Math.round((Math.atan2(cy * pb, cx * pa) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI) * pts.length) % pts.length]; sd += `M${cP(q)}L${cF(cx * (w / 2 - 6))} ${cF(cy * (h / 2 - 6))}`; }
      mD(strands, sd); mO(strands, mRamp(pp, .3, .7));
      if (wd) wd.set(v > .04 ? 1 : v < -.04 ? -1 : 0, t, Math.min(pa, pb) * .6, Math.max(w, h) * .78, h / w);
      return pc;
    },
    pt(name) { return cOut(g, name === 'wall' ? [w / 2 + 6, -h * .3] : name === 'membrane' ? [pa, -pb * .3] : [pa * .2, 0]); },
  });
  return pc.set(1, 0);
}

function paramecium(p, { x = 0, y = 0, s = 1, o = 1, L = 440, seed = 3 } = {}) {
  const g = G(p, { x, y, s, o }), a = L / 2, b = L * .2;
  const cil = path(g, '', { stroke: '#cfe0f2', 'stroke-width': 2.5 });
  path(g, cBlob(a, b, { seed, wob: .04 }), { fill: '#2a4f7a', stroke: MC.head, 'stroke-width': 5 });
  path(g, `M${-a * .1} ${-b * .25}Q${a * .15} ${b * .05} ${a * .08} ${b * .55}`, { stroke: MC.head, 'stroke-width': 5 });
  mk('ellipse', { cx: -a * .05, cy: b * .05, rx: a * .2, ry: b * .32, fill: CC.nucleo, stroke: CC.env, 'stroke-width': 3 }, g);
  mk('circle', { cx: a * .16, cy: -b * .2, r: 7, fill: CC.nucleolus, stroke: CC.env, 'stroke-width': 2 }, g);
  [[-.45, .3], [.35, .35], [.55, -.05]].forEach(([u, v]) => mk('circle', { cx: a * u, cy: b * v, r: b * .16, fill: CC.foodFill, stroke: CC.vacEdge, 'stroke-width': 2.5 }, g));
  const cvs = [[-.62, -.1], [.68, -.12]].map(([u, v]) => vacuole(g, { kind: 'contractile', x: a * u, y: b * v, r: 40, s: .5 }));
  const n = 64;
  const pm = Object.assign(g, {
    cvs,
    beat(t) {
      t = zT(t); let d = '';
      for (let i = 0; i < n; i++) {
        const th = i / n * 2 * Math.PI, px = a * Math.cos(th), py = b * Math.sin(th);
        let nx = Math.cos(th) / a, ny = Math.sin(th) / b; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
        const sw = .55 * Math.sin(t * 7 - i * .45), cx = nx * Math.cos(sw) - ny * Math.sin(sw), cy = nx * Math.sin(sw) + ny * Math.cos(sw);
        d += `M${cF(px + nx * 3)} ${cF(py + ny * 3)}L${cF(px + cx * 18)} ${cF(py + cy * 18)}`;
      }
      mD(cil, d); return pm;
    },
    pump(k) { k = zK(k); cvs[0].pump(k); cvs[1].pump(cFrac(k + .5)); return pm; },
  });
  return pm.beat(0).pump(0);
}

/* ---------- membrane potential ---------- */
function voltmeter(p, { x = 0, y = 0, s = 1, o = 1, min = -200, max = 0 } = {}) {
  const g = G(p, { x, y, s, o }), A0 = 205, A1 = 335, cy = 28, Rr = 78;
  mk('rect', { x: -110, y: -86, width: 220, height: 190, rx: 20, fill: '#132a46', stroke: COL.chalk, 'stroke-width': 4 }, g);
  const ang = v => (A0 + (A1 - A0) * (v - min) / (max - min)) * Math.PI / 180;
  let tk = '';
  for (let v = min; v <= max; v += 50) { const a = ang(v); tk += `M${cF(Rr * Math.cos(a))} ${cF(cy + Rr * Math.sin(a))}L${cF((Rr - 12) * Math.cos(a))} ${cF(cy + (Rr - 12) * Math.sin(a))}`; }
  path(g, `M${cF(Rr * Math.cos(ang(min)))} ${cF(cy + Rr * Math.sin(ang(min)))}A${Rr} ${Rr} 0 0 1 ${cF(Rr * Math.cos(ang(max)))} ${cF(cy + Rr * Math.sin(ang(max)))}` + tk, { stroke: COL.dim, 'stroke-width': 3 });
  for (const v of [min, (min + max) / 2, max]) { const a = ang(v); wLabel(g, v < 0 ? '−' + Math.abs(v) : String(v), { x: (Rr + 24) * Math.cos(a), y: cy + (Rr + 16) * Math.sin(a) + 5, size: 16, fill: COL.dim, weight: 600, o: 1 }); }
  const needle = path(g, '', { stroke: MC.against, 'stroke-width': 5 });
  mk('circle', { cx: 0, cy, r: 8, fill: COL.chalk }, g);
  const read = wLabel(g, '', { y: 82, size: 30, fill: COL.chalk, weight: 800, o: 1 });
  for (const [sx, c] of [[-60, MC.minus], [60, MC.plus]]) mk('circle', { cx: sx, cy: 100, r: 9, fill: c, stroke: COL.chalk, 'stroke-width': 2 }, g);
  const vm = Object.assign(g, {
    set(mV) {
      const v = Math.round(Math.max(min, Math.min(max, +mV || 0))), a = ang(v);
      mD(needle, `M0 ${cy}L${cF((Rr - 16) * Math.cos(a))} ${cF(cy + (Rr - 16) * Math.sin(a))}`);
      const str = (v < 0 ? '−' : '') + Math.abs(v) + ' mV'; if (read.textContent !== str) read.textContent = str;
      return vm;
    },
    terminals() { return [cOut(g, [-60, 100]), cOut(g, [60, 100])]; },
  });
  return vm.set(min / 2);
}

function membranePotential(p, { x = 0, y = 0, s = 1, o = 1, w = 760, n = 9, meter = true, mV = -70 } = {}) {
  const g = G(p, { x, y, s, o });
  mk('rect', { x: -w / 2, y: 0, width: w, height: 130, fill: MC.cyto }, g);
  zBand(g, `M${-w / 2} 0H${w / 2}`, { w: 30 });
  const plus = [], minus = [], order = [];
  for (let i = 0; i < n; i++) {
    const xx = (i - (n - 1) / 2) * (w - 80) / Math.max(1, n - 1);
    plus.push(wLabel(g, '+', { x: xx, y: -42 + 14, size: 40, fill: MC.plus, weight: 800, o: 0 }));
    minus.push(wLabel(g, '−', { x: xx, y: 58 + 14, size: 40, fill: MC.minus, weight: 800, o: 0 }));
    order.push(i);
  }
  order.sort((a, b) => Math.abs(a - (n - 1) / 2) - Math.abs(b - (n - 1) / 2) || a - b);
  let vm = null, wires = null;
  if (meter) {
    vm = voltmeter(g, { x: w / 2 + 170, y: -10, s: .9 });
    const [tm, tp] = vm.terminals();
    wires = path(g, `M${cP(tm)}C${cF(tm[0])} ${cF(tm[1] + 70)} ${cF(w / 2 - 40)} 120 ${cF(w / 2 - 50)} 70` +
      `M${cP(tp)}C${cF(w / 2 + 330)} ${cF(tp[1] + 10)} ${cF(w / 2 + 330)} -170 ${cF(w / 2 + 170)} -170C${cF(w / 2 + 40)} -170 ${cF(w / 2 - 50)} -140 ${cF(w / 2 - 50)} -60`, { stroke: COL.dim, 'stroke-width': 3 });
    for (const [px, py] of [[w / 2 - 50, 70], [w / 2 - 50, -60]]) mk('circle', { cx: px, cy: py, r: 6, fill: COL.chalk }, g);
  }
  const mp = Object.assign(g, {
    meter: vm,
    set(v) {
      v = Math.round(+v || 0); const m = mClamp(-v / 200) * n;
      order.forEach((i, rk) => { const q = mClamp(m - rk); mO(plus[i], q); mO(minus[i], q); });
      if (vm) vm.set(v);
      return mp;
    },
  });
  return mp.set(mV);
}

/* ---------- bulk transport ---------- */
// a pit: q 0 flat … 1 a full circle of radius r hanging under the line, touching it at the origin
function zCup(q, r, W) {
  const c = Math.max(1.2, 2.2 * r * (1 - q)), dep = 2 * r * q;
  if (dep < .5) return { flat: true, d: `M${-W} 0H${W}`, fill: '', c, dep, at: a => [a * 2.2 * r, 0, 0, -1] };
  const R = (c * c + dep * dep) / (2 * dep), cy = dep - R, phi = Math.PI / 2 - Math.atan2(R - dep, c), big = dep > R ? 1 : 0;
  const arc = `A${cF(R)} ${cF(R)} 0 ${big} 0 ${cF(c)} 0`;
  return {
    d: `M${-W} 0H${cF(-c)}${arc}H${W}`, fill: `M${cF(-c)} 0${arc}Z`, R, cy, phi, c, dep,
    at: a => { const th = Math.PI / 2 - a * phi; return [R * Math.cos(th), cy + R * Math.sin(th), -Math.cos(th), -Math.sin(th)]; },
  };
}
const zBristles = (at, bw, m = 26, len = 14) => { let d = ''; for (let i = 0; i <= m; i++) { const [px, py, nx, ny] = at(-1 + 2 * i / m); d += `M${cF(px - nx * (bw / 2 + 3))} ${cF(py - ny * (bw / 2 + 3))}L${cF(px - nx * (bw / 2 + 3 + len))} ${cF(py - ny * (bw / 2 + 3 + len))}`; } return d; };

function exocytosis(p, { x = 0, y = 0, s = 1, o = 1, w = 640, r = 50, n = 4, depth = 360 } = {}) {
  const g = G(p, { x, y, s, o }), W = w / 2, BW = 24;
  mk('rect', { x: -W, y: 0, width: w, height: depth, fill: MC.cyto }, g);
  const cupFill = path(g, '', { fill: MC.ecf });
  const ves = G(g); mk('circle', { r, fill: MC.ecf }, ves); zBand(ves, cCircle(r), { w: BW });
  const cargoL = G(g), cargo = [];
  for (let i = 0; i < n; i++) cargo.push(solute(cargoL, 'dye1', { r: 15 }));
  const memb = zBand(g, '', { w: BW });
  let vy = r;
  const ex = Object.assign(g, {
    set(k) {
      k = zK(k);
      const rise = io(mRamp(k, 0, .45)); vy = zLerp(r + 190, r, rise);
      const q = 1 - io(mRamp(k, .5, .85)), open = k >= .5;
      cSet(ves, { y: vy, o: open ? 0 : 1 });
      const cup = open ? zCup(q, r, W) : zCup(0, r, W);
      memb.set(cup.d); mD(cupFill, open ? cup.fill : '');
      const out = io(mRamp(k, .6, 1));
      cargo.forEach((e, i) => {
        const a = i / n * 2 * Math.PI + .6, home = [r * .45 * Math.cos(a), vy + r * .45 * Math.sin(a)];
        const away = [(i - (n - 1) / 2) * 60 + 10 * wHash(i, 3), -70 - 60 * wHash(i, 4)];
        const pt = zL2(home, away, out); cSet(e, { x: pt[0], y: pt[1] });
      });
      return ex;
    },
    pt(name) { return cOut(g, name === 'vesicle' ? [0, vy] : [-W * .6, 0]); },
  });
  return ex.set(0);
}

function endocytosis(p, { kind = 'pino', x = 0, y = 0, s = 1, o = 1, w = 640, r = 56, depth = 420, seed = 5 } = {}) {
  const g = G(p, { x, y, s, o }), W = w / 2, BW = 24, phago = kind === 'phago', rec = kind === 'receptor';
  mk('rect', { x: -W, y: 0, width: w, height: depth, fill: MC.cyto }, g);
  const coat = path(g, '', { stroke: MC.coat, 'stroke-width': 3 }, { o: 0 });
  const cupFill = path(g, '', { fill: MC.ecf });
  const ves = G(g, { o: 0 }); mk('circle', { r: phago ? r + 26 : r, fill: MC.ecf }, ves); zBand(ves, cCircle(phago ? r + 26 : r), { w: BW });
  const vcoat = path(ves, '', { stroke: MC.coat, 'stroke-width': 3 });
  const memb = zBand(g, `M${-W} 0H${W}`, { w: BW });
  const top = G(g);
  let vy = 0;
  let api;
  if (phago) {
    const Rw = r + 26, cy = -r - 30;
    const arms = [`M${-Rw - 70} 0Q${-Rw} 0 ${-Rw} ${cy}A${Rw} ${Rw} 0 0 1 0 ${cy - Rw}`, `M${Rw + 70} 0Q${Rw} 0 ${Rw} ${cy}A${Rw} ${Rw} 0 0 0 0 ${cy - Rw}`];
    const armL = G(g); g.insertBefore(armL, top);
    const strokes = [];
    arms.forEach(d => [[MC.head, 46], [MC.tail, 36], [MC.head, 28], [MC.cyto, 20]].forEach(([c, wd]) => strokes.push(path(armL, d, { stroke: c, 'stroke-width': wd }, { d: 0 }))));
    const food = solute(top, 'food', { r });
    g.insertBefore(ves, top);
    api = k => {
      const wv = io(mRamp(k, 0, .6)), close = mRamp(k, .58, .68), sink = io(mRamp(k, .7, 1));
      strokes.forEach(e => cSet(e, { d: wv, o: 1 - close }));
      vy = cy + (r + 190 - cy) * sink;
      cSet(ves, { y: vy, o: close });
      cSet(food, { x: 0, y: vy });
    };
  } else {
    const n = rec ? 5 : 0, recs = [], ligs = [], dots = [];
    for (let i = 0; i < n; i++) {
      const rg = G(top); path(rg, 'M0 0V-14M0 -14L-9 -26M0 -14L9 -26', { stroke: MC.receptor, 'stroke-width': 6 }); recs.push(rg);
      ligs.push(solute(top, 'ligand', { r: 10 }));
    }
    const nd = rec ? 3 : 6, free = rec ? 6 : 12;
    for (let i = 0; i < nd + free; i++) dots.push(solute(top, i % 3 === 2 ? 'ligand' : 'dye2', { r: i % 3 === 2 ? 9 : 14 }));
    const spreadX = i => (i - (n - 1) / 2) * (w * .8 / Math.max(1, n - 1)), aI = i => (i - (n - 1) / 2) / Math.max(1, (n - 1) / 2) * .78;
    api = k => {
      const q = io(mRamp(k, .25, .72)), pinch = k >= .74, sink = io(mRamp(k, .74, 1));
      const cup = pinch ? null : zCup(q, r, W);
      vy = r + 190 * sink;
      memb.set(pinch ? `M${-W} 0H${W}` : cup.d); mD(cupFill, pinch || cup.flat ? '' : cup.fill);
      mD(coat, pinch || cup.flat ? '' : zBristles(cup.at, BW)); mO(coat, pinch ? 0 : mRamp(q, 0, .3));
      cSet(ves, { y: vy, o: pinch ? 1 : 0 });
      const full = zCup(1, r, W), at = a => { if (!pinch) return cup.at(a); const [px, py, nx, ny] = full.at(a); return [px, py + 190 * sink, nx, ny]; };
      const gather = io(mRamp(k, 0, .25));
      recs.forEach((e, i) => {
        let px, py, nx, ny;
        if (q <= 0) { px = zLerp(spreadX(i), aI(i) * 2.2 * r, gather); py = 0; nx = 0; ny = -1; }
        else [px, py, nx, ny] = at(aI(i));
        px += nx * BW / 2; py += ny * BW / 2;
        cSet(e, { x: px, y: py, r: Math.atan2(ny, nx) * 180 / Math.PI + 90 });
        const tip = [px + nx * 32, py + ny * 32], fr = [spreadX(i) + 30 * (wHash(i, seed) - .5), -110 - 70 * wHash(i, seed + 1)];
        const lp = zL2(fr, tip, io(mRamp(k, .03 + .03 * i, .22 + .02 * i)));
        cSet(ligs[i], { x: lp[0], y: lp[1], r: Math.atan2(ny, nx) * 180 / Math.PI + 90 });
      });
      dots.forEach((e, i) => {
        const fx = (wHash(i, seed + 20) - .5) * w * .9, fy = -40 - 150 * wHash(i, seed + 21);
        if (i < nd) {
          const a = i / nd * 2 * Math.PI + .4, tgt = [r * .45 * Math.cos(a), r + r * .45 * Math.sin(a) + 190 * sink];
          const st0 = [(i - (nd - 1) / 2) * r * .7, -30 - 30 * (i % 2)];
          const pt = zL2(zL2([fx, fy], st0, io(mRamp(k, 0, .2))), tgt, io(mRamp(k, .2, .72)));
          cSet(e, { x: pt[0], y: pt[1] });
        } else cSet(e, { x: fx, y: fy });
      });
      mD(vcoat, zBristles(full.at.bind(null), BW).replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m0, a1, b1) => a1 + ' ' + cF(+b1 - r)));
    };
  }
  const en = Object.assign(g, {
    set(k) { api(zK(k)); return en; },
    pt(name) { return cOut(g, name === 'vesicle' ? [0, vy] : name === 'pit' ? [0, r] : [-W * .6, 0]); },
  });
  return en.set(0);
}

/* ---------- the six functions of membrane proteins ---------- */
function proteinFunction(p, { kind = 'transport', x = 0, y = 0, s = 1, o = 1, w = 380 } = {}) {
  const g = G(p, { x, y, s, o }), two = kind === 'recognition' || kind === 'joining';
  const low = G(g, { y: two ? 70 : 0 });
  mk('rect', { x: -w / 2, y: 46, width: w, height: 104, fill: MC.cyto }, low);
  bilayer(low, { w, gaps: [[0, two ? 36 : 60]], chol: 0, fluid: .3 });
  let up = null, play;
  if (kind === 'transport') { const c = carrierProtein(low, { solutes: ['sugar'] }); play = k => c.carry(k); }
  else if (kind === 'enzyme') { const e = enzymeProtein(low, {}); play = k => e.react(k); }
  else if (kind === 'signal') { const rcp = receptorProtein(low, {}); play = k => rcp.bind(k); }
  else if (kind === 'attachment') {
    const lk = G(low);
    integralProtein(low, { w: 70, h: 150, seed: 2 });
    path(low, `M${-w / 2} -170Q0 -150 ${w / 2} -175`, { stroke: MC.ecm, 'stroke-width': 16 });
    const mf = microfilament(low, { x: -w / 2, y: 120, len: w, nm: 2 });
    const l1 = path(lk, 'M0 -70C10 -110 -10 -130 0 -162', { stroke: MC.fibronectin, 'stroke-width': 5 }, { d: 0 });
    const l2 = path(lk, 'M0 70C-8 90 8 100 0 116', { stroke: MC.actin, 'stroke-width': 5 }, { d: 0 });
    play = k => { cSet(l1, { d: io(mRamp(k, 0, .5)) }); cSet(l2, { d: io(mRamp(k, .4, .9)) }); mf.grow(1); };
  } else {
    up = G(g, { y: -70, r: 180 });
    mk('rect', { x: -w / 2, y: 46, width: w, height: 104, fill: '#1d3d63' }, up);
    bilayer(up, { w, gaps: [[0, 36]], chol: 0, fluid: .3, seed: 3 });
    const recog = kind === 'recognition';
    for (const [grp, sd] of [[low, 1], [up, -1]]) {
      integralProtein(grp, { w: 64, h: 140, seed: sd > 0 ? 3 : 6 });
      if (recog) carbChain(grp, { y: -68, n: 3, a: 7, branch: sd > 0 ? 1 : 2, seed: sd > 0 ? 1 : 2 });
      else { const hk = G(grp); path(hk, 'M-14 -60V-92H14V-80', { stroke: MC.integral, 'stroke-width': 10 }); }
    }
    const spark = put(path(g, zStar(18, 8, 6), { fill: COL.chalk }), { o: 0, s: 0 });
    play = k => {
      const m = io(mRamp(k, 0, .65));
      cSet(up, { y: zLerp(recog ? -270 : -240, recog ? -150 : -106, m) });
      cSet(spark, { y: recog ? -40 : -20, s: io(mRamp(k, .65, .8)), o: mRamp(k, .65, .72) });
    };
  }
  const pf = Object.assign(g, { kind, play(k) { play(zK(k)); return pf; } });
  return pf.play(0);
}

/* ---------- the fluid-mosaic patch ---------- */
const Z_ALIAS = { phospholipids: 'bilayer', phospholipid: 'bilayer', lipids: 'bilayer', transmembrane: 'integral', cytoskeleton: 'microfilaments',
  microfilament: 'microfilaments', aquaporin: 'channel', carbohydrates: 'carbohydrate', glycoproteins: 'glycoprotein', glycolipids: 'glycolipid',
  extracellularMatrix: 'ecm', ECM: 'ecm', proteinsPeripheral: 'peripheral' };
const Z_GROUPS = { proteins: ['integral', 'peripheral', 'glycoprotein', 'channel', 'carrier', 'pump', 'receptor'], transport: ['channel', 'carrier', 'pump'] };
function membranePatch(p, { x = 800, y = 450, s = 1, o = 1, w = 1500, top = 400, depth = 400, transport = true, vesicle: withVes = true, ecm = true, filaments = true, chol = .14, seed = 3 } = {}) {
  const g = G(p, { x, y, s, o }), W2 = w / 2, X = f => f * 750 * w / 1500;
  const ORDER = ['bilayer', 'cholesterol', 'integral', 'peripheral', 'channel', 'carrier', 'pump', 'receptor', 'glycoprotein', 'glycolipid', 'carbohydrate', 'ecm', 'microfilaments', 'vesicle'];
  const entries = [], centres = {}, movers = [];
  const cytoTop = 2 + 38 + 11 * .6;
  mk('rect', { x: -W2, y: cytoTop, width: w, height: depth - cytoTop, fill: MC.cyto }, g);
  const ecmL = G(g), filL = G(g), bilL = G(g), cholL = G(g), protL = G(g), carbL = G(g), vesL = G(g);
  const part = (name, parent, base = false) => { const h = G(parent); entries.push({ g: h, name, base }); return h; };
  const mover = (parent, bx, ph, amp = 6) => { const m = G(parent, { x: bx }); movers.push({ m, bx, ph, amp }); return m; };
  const P = {
    attach: X(-.86), gp: X(-.65), gl: X(-.5), ch: X(-.35), int: X(-.15), peri: X(.03), car: X(.2), rec: X(.38), pump: X(.58), gl2: X(.74), gp2: X(.87),
  };
  const gaps = [[P.attach, 42], [P.gp, 44], [P.gl, 12], [P.int, 48], [P.gl2, 12], [P.gp2, 40]];
  if (transport) gaps.push([P.ch, 66], [P.car, 72], [P.rec, 26], [P.pump, 84]);
  const bl = bilayer(part('bilayer', bilL, true), { w, gaps, chol, cholLayer: part('cholesterol', cholL), seed, fluid: .5 });
  const yH = bl.yH;
  centres.bilayer = [() => 0, X(.1), -yH]; centres.cholesterol = [() => 0, ...bl.cholPt(0)];
  // integral proteins: the anchor (linked to the ECM and microfilaments) and a plain one, with peripheral proteins
  const pInt = part('integral', protL);
  const mA = mover(pInt, P.attach, 0, 0); integralProtein(mA, { w: 70, h: 150, seed: 2 });
  const mI = mover(pInt, P.int, 1.3); integralProtein(mI, { w: 86, h: 158, seed: 7 });
  centres.integral = [mI, 0, 0];
  const pPer = part('peripheral', protL);
  const mP1 = mover(pPer, P.int + 14, 1.3); peripheralProtein(mP1, { y: 79 + 20, w: 78, h: 42 });
  const mP2 = mover(pPer, P.peri, 2.1, 4); peripheralProtein(mP2, { y: yH + 11 + 20, w: 86, h: 44, seed: 5 });
  centres.peripheral = [mP2, 0, yH + 31];
  // glycoproteins and glycolipids with their carbohydrate chains
  const pGp = part('glycoprotein', protL), pCarb = part('carbohydrate', carbL), pGl = part('glycolipid', protL);
  for (const [bx, ph, sd] of [[P.gp, 2.7, 1], [P.gp2, 4.1, 2]]) {
    const m = mover(pGp, bx, ph); integralProtein(m, { w: bx === P.gp ? 76 : 70, h: 146, seed: 4 + sd });
    const mc = mover(pCarb, bx, ph); carbChain(mc, { y: -72, n: 5, seed: sd, branch: 2 });
    if (sd === 1) { centres.glycoprotein = [m, 0, -40]; centres.carbohydrate = [mc, 0, -72 - 40]; }
  }
  for (const [bx, ph, sd] of [[P.gl, 3.3, 1], [P.gl2, 5.2, 2]]) {
    const m = mover(pGl, bx, ph, 4); phospholipid(m, { y: -yH, seed: sd + 20, color: '#a9c4e4' });
    carbChain(mover(pCarb, bx, ph, 4), { y: -yH - 11, n: 4, seed: sd + 1, branch: 1 });
    if (sd === 1) centres.glycolipid = [m, 0, -yH];
  }
  // transport proteins
  let channel = null, carrier = null, pump = null, receptor = null;
  if (transport) {
    channel = channelProtein(mover(part('channel', protL), P.ch, 3.9, 3), { kind: 'K' }); centres.channel = [movers[movers.length - 1].m, 0, -20];
    carrier = carrierProtein(mover(part('carrier', protL), P.car, 4.6, 3), {}); centres.carrier = [movers[movers.length - 1].m, 0, -20];
    receptor = receptorProtein(mover(part('receptor', protL), P.rec, 5.5, 3), {}); centres.receptor = [movers[movers.length - 1].m, 0, -75 - 20];
    pump = naKPump(mover(part('pump', protL), P.pump, 6.3, 3), {}); centres.pump = [movers[movers.length - 1].m, 0, -20];
  }
  // ECM above and microfilaments below
  if (ecm) {
    const pe = part('ecm', ecmL);
    [[-236, 0, 18], [-280, 1.7, 16], [-320, 3.1, 14]].forEach(([yy, ph, wd]) => {
      const pts = []; for (let i = 0; i <= 12; i++) { const xx = -W2 + w * i / 12; pts.push([xx, yy + 16 * Math.sin(i * .9 + ph)]); }
      const d = cSmooth(pts);
      path(pe, d, { stroke: MC.ecm, 'stroke-width': wd });
      path(pe, d, { stroke: '#f8d9a4', 'stroke-width': 5, 'stroke-dasharray': '22 18', 'stroke-linecap': 'butt' });
    });
    path(pe, `M${cF(P.attach)} -75C${cF(P.attach + 30)} -140 ${cF(P.attach - 30)} -200 ${cF(P.attach + 10)} -232`, { stroke: MC.fibronectin, 'stroke-width': 5 });
    centres.ecm = [() => 0, X(-.45), -262];
  }
  if (filaments) {
    const pf = part('microfilaments', filL);
    microfilament(pf, { x: -W2, y: 175, len: W2 * .95, nm: 2 });
    microfilament(pf, { x: -W2 + 60, y: 232, len: W2 * .7, nm: 2 });
    microfilament(pf, { x: P.attach, y: 72, len: 118, nm: 2, r: 62 });
    centres.microfilaments = [() => 0, X(-.45), 175];
  }
  let ves = null;
  if (withVes) { ves = vesicle(part('vesicle', vesL), { x: X(.3), y: 268, r: 40, cargo: 'protein' }); centres.vesicle = [() => 0, X(.3), 268]; }
  const norm = nm => Z_ALIAS[nm] || nm;
  let bk = 1, fk = 0, lit = new Set();
  function apply() {
    const nB = ORDER.length;
    entries.forEach(e => {
      const i = ORDER.indexOf(e.name), t0 = i / nB * .9, bo = io(mRamp(bk, t0, t0 + .14));
      const on = lit.size === 0 || lit.has(e.name) || (e.name === 'carbohydrate' && (lit.has('glycoprotein') || lit.has('glycolipid')));
      const fo = on ? 1 : 1 - (1 - (e.base ? .4 : .16)) * fk;
      cSet(e.g, { y: (e.name === 'microfilaments' || e.name === 'vesicle' || e.name === 'peripheral' ? 26 : -26) * (1 - bo), o: mRamp(bk, t0, t0 + .1) * fo });
    });
  }
  const local = nm => { const c = centres[norm(nm)]; if (!c) return [0, 0]; const m = c[0]; const ox = typeof m === 'function' ? m() : st(m).x; return [ox + c[1], c[2]]; };
  const mp = Object.assign(g, {
    bilayer: bl, channel, carrier, pump, receptor, ves, order: ORDER,
    piece(nm) { const e = entries.find(q => q.name === norm(nm)); return e ? e.g : null; },
    focus(names, k = 1) {
      const list = (Array.isArray(names) ? names : [names]).filter(Boolean).map(norm).flatMap(n => Z_GROUPS[n] || [n]);
      lit = new Set(list); fk = zK(k); apply(); return mp;
    },
    build(k) { bk = zK(k); apply(); return mp; },
    drift(t) {
      t = zT(t); bl.drift(t);
      movers.forEach(q => cSet(q.m, { x: q.bx + q.amp * zWob(Math.round(q.ph * 10), t * .5, 9) }));
      centres.cholesterol = [() => 0, ...bl.cholPt(0)];
      return mp;
    },
    fluid(f) { bl.fluid(f); return mp; },
    pt(nm) { return cOut(g, local(nm)); },
    label(nm, str, { at: to, dx, dy, size = 28, color = COL.chalk, layer = p } = {}) {
      const lc = local(nm), a = cOut(g, lc);
      const ss = st(g).s;
      const tpos = to || [a[0] + (dx ?? 60) * ss, a[1] + (dy ?? (lc[1] < 0 ? -150 : 150)) * ss];
      return cLabel(layer, a, tpos, str, { size, color });
    },
    sides({ size = 26 } = {}) {
      const lg = G(g, { o: 0 });
      wLabel(lg, 'EXTRACELLULAR FLUID', { x: -W2 + 24, y: -top + 30, size, fill: COL.dim, anchor: 'start', weight: 700, o: 1 });
      wLabel(lg, 'CYTOPLASM', { x: -W2 + 24, y: depth - 30, size, fill: COL.dim, anchor: 'start', weight: 700, o: 1 });
      return lg;
    },
  });
  apply();
  return mp.drift(0);
}
