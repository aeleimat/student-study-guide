'use strict';
// An Introduction to Metabolism (chapter 8): the book's kit of pathways, energy diagrams, ATP, enzymes, inhibitors,
// rate curves, allosteric enzymes and small everyday backdrops. Loaded after engine.js, water.js, macro.js, cell.js,
// cyto.js and membrane.js (it reuses wLabel, wChem, wChemSet, wHash, waterMolecule, heatArrow; mArrow, mChip, mRamp,
// mBump, mClamp, mD, mO; cSet, cAttr, cF, cP, cSmooth, cOut, cFrac, cLabel; solute, zK, zT, zNgon, zStar, zPoly, zWob,
// zMix). Every piece is drawn around its own origin with { x, y, s, o } and placed with put. Each animated piece has
// set-style methods that pose everything from their arguments alone (call them every frame from prog(k => …) or
// clockRun(t => …)), so replay and seek draw the same frame. They first round their argument (k, u to 1/2000, t to
// 1/120 s) and draw only from the rounded value; attributes are written only when they change. No filters, blurs or
// clips. The kit never writes the root group's o or s (fade and pulse a piece freely); a piece's inner parts are
// written every call, so don't tween them by hand. Free energy is height: high-G states are drawn above low-G ones.
//
// Exports (lengths at s = 1; "parent" = the coordinates of the group you passed as p; k runs 0..1; t is seconds):
//   MC  extended with chapter 8's colours: exo (orange, ΔG < 0, downhill) endo (blue, ΔG > 0, uphill) glow (firefly
//       light) spark (ATP) adenine ribose sub (substrate coral) prod2 (second product, gold) ea (E_A pink) compInh
//       (red) nonInh (purple) activator (green) alloInh (red) cofactor (teal) coenzyme (peach) glu (mint) nh3 (blue)
//       order disorder pathA pathB pathC pathD (the strip's molecules) off (a switched-off enzyme) stop (…Edge forms too)
//   pathwayStrip(p, {x=800, y=450, s, o, w=1200, labels=['A','B','C','D'], names=['starting molecule','','','product'],
//       enzymes=['enzyme 1',…], colors, dirs=[1,1,1], drop=70, box=100, size=46, reactions=false}) the metabolic
//       pathway: n molecule boxes from left to right (origin = the strip's centre), an arrow between each pair with a
//       small olive enzyme and its name above it (reactions: "reaction i" under the arrows). Long labels (threonine,
//       isoleucine) widen their box and use a smaller font. Setters (combine; each redraws from the whole state):
//       .build(k) parts appear left to right (molecule, arrow, enzyme, molecule …); .focus(names, k) lights names and
//       dims the rest to .25 (names: 'A' … or a label, 'mol0'…, 'start', 'product', 'molecules', 'enzyme1'…,
//       'enzymes', 'arrow1'…, 'arrows', 'step1'… (arrow + enzyme), 'all'; [] or null lights all); .tilt(k) free energy
//       drops along the strip: molecule i+1 sits dirs[i]·drop lower than i at k 1 (dirs −1: an uphill step), the strip
//       stays centred, arrows tint orange (downhill) / blue (uphill) and a "free energy" axis appears on the left;
//       .spark(i, k) an ATP spark pops beside arrow i (0-based), under it; .flow(t, amt=1) dots run along the arrows
//       (amt a number or per-arrow array); .feedback(k) the product's copy rides a red loop under the strip back to
//       enzyme 1 (line draws 0–.45, the copy travels .3–.75), docks on enzyme 1, which goes grey with a red stop sign
//       (.75–.95), and the flow dots stop. .pt(name) in parent ('mol0'… 'enzyme1'… 'arrow1'… 'start' 'product'
//       'stop' 'loop'); .mols .arrows .enzymes .n
//   energyDiagram(p, {x, y, s, o, w=900, h=520, size=28, axes=true}) origin = the axes' corner (bottom left); free
//       energy G up, "progress of the reaction" across. Labels and the ΔG bracket stand about 150 past w on the right.
//       .set({r=.65, p=.25, hump=0, ea=0, dg=0, ghost=0, ghostO=0, eaG=0, enz=0, ball=-1, lab=1, ts=0, t=0}) the whole
//       pose (missing keys take these defaults, so every call is pure): r, p reactant and product levels (0..1 of the
//       height); hump the barrier above the higher level (0 a plain step down or up); ea the pink E_A bracket from the
//       reactant level up to the peak's height, standing just left of the hump with a dashed line across to the peak; dg the ΔG bracket at the right (orange down "ΔG < 0", blue up "ΔG > 0", cream flat
//       "ΔG = 0", from the levels' sign); ghost a dashed uncatalysed curve with that hump (ghostO its opacity, eaG its
//       own dimmer E_A bracket, further left); enz tints the main curve olive (the enzyme's path); ball ≥ 0 a coral
//       ball riding the curve at progress ball (0..1); lab the Reactants / Products labels (under their plateaus) and Transition state (above the higher peak); ts with
//       t a flickering pale outline at the peak (the transition state). .Y(level) .X(u) local; .pt('reactants'|
//       'products'|'peak'|'ball'|'ea'|'dg') in parent; .curveAt(u) the level at progress u
//   energyBurst(p, {x, y, s, o, r=60, color=MC.spark}) a star with rays; .set(k) grows and fades (0 and 1 empty)
//   atpMolecule(p, {x, y, s, o, n=3, name=true, labels=false, water=true}) origin = ribose centre; gold ribose
//       pentagon, coral adenine (pentagon + hexagon) up right, lavender phosphate tail to the left. name: "ATP"/"ADP"
//       under it. .labels(k) adenine / ribose / phosphate groups (o via k); .hydrolyse(k) a water comes in (.05–.35),
//       the last bond flashes (.3–.48), the terminal phosphate leaves down-left as Pᵢ (.42–.8) and an energy burst
//       pops at the broken bond (.42–.9); the name turns ATP → ADP (.5–.6). .charge(k) the reverse with no burst (Pᵢ
//       joins: ADP → ATP). .pt('tip'|'bond'|'pi'|'adenine'|'ribose'|'tail') in parent; .pi .burst
//   atpCycle(p, {x, y, s, o, R=190, labels=true}) ATP + H₂O at the top, ADP + Pᵢ at the bottom, an arc arrow down the
//       right (hydrolysis) and up the left (regeneration); yellow zigzag energy arrows: in from the left ("energy from
//       catabolism", exergonic) and out to the right ("energy for cellular work", endergonic). .set(u) u loops (any
//       real, wrapped): a token runs down the right arc (u 0–.5, spark → ADP chip) while the right zigzag glows, and up
//       the left (.5–1) while the left one glows; the station under the token pulses. .pt('atp'|'adp'|'in'|'out')
//   gluShape(p, {x, y, s, o, size=110, label='Glu'}) a mint triangle; .set({P=0, nh=0}) shows the phosphate ball on
//       its top right (phosphorylated) and/or the NH₂ trapezoid on its right side (glutamine). .pt('P'|'nh'|'base')
//   ammoniaShape(p, {x, y, s, o, kind='NH3'}) a blue inverted trapezoid labelled NH₃ (kind 'NH2': smaller, NH₂);
//       .kind(str) switches the label and size
//   coupledReaction(p, {x, y, s, o, labels=true}) the slide-30 coupling in one place: Glu, an ATP spark and NH₃.
//       .set(k): the ATP comes to the Glu (0–.22), hands it its phosphate (.22–.38; the spark becomes ADP, which
//       drifts off), "phosphorylated intermediate" (.36–.72); NH₃ comes in (.48–.68) and takes the phosphate's place
//       (.68–.8): Pᵢ leaves, NH₃ → NH₂, "glutamine" (.82–1). labels: glutamic acid / phosphorylated intermediate /
//       glutamine under the Glu and "ammonia" over the incoming NH₃ (the ATP, ADP and Pᵢ pieces carry their own
//       names). The whole piece is about 560 × 330 (−300…+300 across). .glu .atp .adp .pi .nh; .pt(name) for those
//   kcalLedger(p, {x, y, s, o, size=34}) a box: ΔG_Glu = +3.4 kcal/mol (blue), ΔG_ATP = −7.3 kcal/mol (orange), a
//       rule, Net ΔG = −3.9 kcal/mol. .set(k) rows count up in turn (0–.3, .35–.65, rule .68, net .72–1); origin =
//       the box's top left; .w .h
//   enzymeBlob(p, {x, y, s, o, R=150, color, edge, socket=false, label=''}) a large olive blob with a square
//       active-site notch on top (socket: a small dent low on the right, an allosteric/noncompetitive site). Setters
//       (combine): .fit(k) induced fit, the lips close round the notch; .bend(k) the notch is pulled out of shape (a
//       noncompetitive inhibitor); .tint(k) greys it (switched off). .site() parent point where a bound substrate's
//       centre sits; .pt('site'|'socket'|'centre'|'label'); .R
//   substrateShape(p, {x, y, s, o, R=150, two=false}) a coral block sized for an enzymeBlob of the same R (origin =
//       its centre): two halves along a seam. .convert(k) the right half turns gold (product 2); .split(k) the halves
//       part (each a product); two: the halves start as separate substrates (a gap) and .join(k) closes it.
//       .pose(x, y, r) .L .R
//   catalyticCycle(p, {x, y, s, o, R=150, labels=true}) slide 44 with the enzyme held still (origin = its centre) and a
//       faint ring arrow round it: .set(u) u loops (any real, wrapped): two substrate halves come in from the upper left
//       (.02–.18), fit closes (.17–.3), the site glows (.34–.56) and the right half turns gold (.44–.56), the products
//       leave to the upper right (.62–.84, fading .8–.9) and the site opens (.6–.7). labels: a numbered caption under
//       the ring, steps 1–6 (enter, held / induced fit, lowers E_A, converted, released, free again). .step(u) 1..6;
//       .enz .sub .glow; .pt('site')
//   sucrase(p, {x, y, s, o, R=150, labels=true}) the enzyme sucrase and sucrose (gold hexagon + pentagon). .set(k):
//       sucrose drops into the site (0–.3), fit (.25–.4), a water joins (.3–.48), the bond breaks (.48–.58), glucose
//       (hexagon) and fructose (pentagon) leave (.58–1) and the site opens. Labels sucrose / glucose / fructose.
//   inhibitorShape(p, {kind='competitive'|'noncompetitive', x, y, s, o, R=150}) red block that fits the notch / purple
//       lozenge that fits the socket. .pose(x, y, r)
//   enzymeInhibition(p, {kind='normal'|'competitive'|'noncompetitive', x, y, s, o, R=130, labels=true}) slide 51:
//       .set(k) normal: the substrate drops in (0–.6), fit (.55–.75); competitive: the red inhibitor takes the site
//       (0–.35), the substrate comes down (.35–.62) and is turned away (.62–1, a red curved arrow); noncompetitive: the
//       purple inhibitor binds the socket (0–.35), the site bends (.3–.55), the substrate comes but can't fit (.5–1).
//       .enz .sub .inh; .pt(name)
//   cofactorIon(p, {x, y, s, o, ion='Zn²⁺', r=24}) teal metal-ion disc; coenzymeRing(p, {x, y, s, o, r=26,
//       label=''}) a peach organic ring with a side chain. Both .pose(x, y)
//   rateCurve(p, {x, y, s, o, w=760, h=400, kind='temp'|'pH'|'substrate', curves, size=24, labels=true}) origin =
//       the axes' corner; axes cream with tick numbers (temp 0–120 °C, pH 0–10, substrate unnumbered), "rate of
//       reaction" up. curves default: temp human (opt 37) + thermophilic bacteria (opt 77); pH pepsin (2) + trypsin
//       (8); substrate one saturation curve. Each {lo, opt, hi, color, label} (substrate: {km, color, label}).
//       .draw(k) the curves draw on (one after another); .opt(i, k) curve i's optimum: dashed drop line + value;
//       .marker(i, v) a ball on curve i at x value v with a drop line and readout (v null hides it); .labels(k);
//       .rate(i, v) the curve's height 0..1; .X(v) .Y(r) local; .pt(i, v) in parent
//   allostericEnzyme(p, {x, y, s, o, R=70}) four subunits round a central regulatory socket, active-site notches
//       outward. .set({form=1, osc=0, t=0, act=0, inh=0, sub=[0,0,0,0]}) the whole pose: form 1 active (open notches,
//       olive) … 0 inactive (subunits twisted, notches closed, greyer); osc with t oscillates between the two; act a
//       green activator comes in from the left and binds the socket (stabilises active); inh a red inhibitor does the
//       same (stabilises inactive); sub[i] a substrate drops into subunit i's site. .coop(k) cooperativity: one
//       substrate binds (0–.35), the enzyme goes active (.3–.65), the other three bind (.65–1).
//       .pt('socket'|'site0'…'site3'|'centre')
//   entropyDots(p, {x, y, s, o, w=420, h=300, n=36, box=true, seed}) .set(dis, t) dis 0 rows (order, cream) … 1
//       scattered, jiggling (disorder, grey-cream); t moves them
//   ballSlope(p, {x, y, s, o, w=760, h=340, r=28, bars=true}) origin = ground under the middle: a high ledge on the
//       left, a slope down to the ground. .set(k) the ball rests on the ledge, rolls to its edge (.08–.2), down the
//       slope (.2–.85, speeding up) and along the ground (.85–1), turning as it rolls; bars: "potential" (blue) and
//       "kinetic" (orange) energy bars that trade off. .pt('ball'|'ledge'|'bottom')
//   hydroDam(p, {kind='isolated'|'open'|'multi', x, y, s, o, chips=true}) slide 24 in flat shapes: tanks, a turbine,
//       a bulb, ΔG chips. .set(k, t) isolated: k 0 → 1 the levels even out, the turbine slows to a stop, the bulb dims
//       and its chip turns from ΔG < 0 to ΔG = 0; open: a tap fills the top tank, an outlet drains the bottom one,
//       water keeps flowing (t); multi: three turbines on a staircase, all lit. origin = the middle at the ground.
//       .pt('bulb0'…|'tank0'…|'tap'|'outlet')
//   firefly(p, {x=800, y=450, s, o, w=1600, h=900, scene=true, bx=0, by=0}) a night backdrop (sky, moon, stars,
//       grass, distant fireflies) with a large flat firefly at (bx, by) whose abdomen glows; .set(t) it hovers,
//       flutters and flashes. .glowK(t) its glow then; .pt('bug'|'glow')
//   campfire(p, {x, y, s, o, w=220}) origin = ground centre; crossed logs, layered flames, sparks and heat waves
//       rising; .set(t). .pt('flame'|'top')
//   Internal helpers start with q (qArrow, qEnzD, qTxt …); lesson pages should not declare q-names of their own.

Object.assign(MC, {
  exo: '#f39a2b', endo: '#6c8cff', glow: '#d8f27a', spark: '#ffd27a', sparkEdge: '#c79a2e',
  adenine: '#f07a6a', adenineEdge: '#a84a3e', ribose: '#f3c95c', riboseEdge: '#a8862c',
  sub: '#f07a6a', subEdge: '#a84a3e', prod2: '#f3c95c', prod2Edge: '#a8862c', ea: '#ff7aa8',
  compInh: '#e5533d', compInhEdge: '#9e3022', nonInh: '#9a6cd0', nonInhEdge: '#64409a',
  activator: '#5bbf5b', activatorEdge: '#3a8a3a', alloInh: '#e5533d', alloInhEdge: '#9e3022',
  cofactor: '#4fa3a5', cofactorEdge: '#2a6668', coenzyme: '#e8a87c', coenzymeEdge: '#a8714b',
  glu: '#8fd6b0', gluEdge: '#4f9a78', nh3: '#6c8cff', nh3Edge: '#3d56b8',
  order: '#f2efe6', disorder: '#b9b2a0',
  pathA: '#8fd6b0', pathB: '#5fd3e8', pathC: '#d2a878', pathD: '#f07a6a', off: '#7d8794', stop: '#e5533d',
});

/* ---------- helpers ---------- */
const qU = u => Math.round(cFrac(+u || 0) * 2000) / 2000;           // a looping phase, wrapped and rounded
const qSS = v => { const c = mClamp(v); return c * c * (3 - 2 * c); };
const qL = (a, b, k) => a + (b - a) * k;
const qL2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
function qTxt(e, str) { if (e._q !== str) { e.textContent = str; e._q = str; } return e; }
function qChem(e, str) { return wChemSet(e, str); }
// a straight arrow as two path strings: shaft and head
function qArrowD(x1, y1, x2, y2, head = 16) {
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, h = Math.min(head, L * .6);
  const bx = x2 - ux * h, by = y2 - uy * h;
  return [`M${cF(x1)} ${cF(y1)}L${cF(x2 - ux * h * .8)} ${cF(y2 - uy * h * .8)}`,
    `M${cF(bx - uy * h * .62)} ${cF(by + ux * h * .62)}L${cF(x2)} ${cF(y2)}L${cF(bx + uy * h * .62)} ${cF(by - ux * h * .62)}Z`];
}
// a movable arrow: .set(x1, y1, x2, y2), .color(c)
function qArrow(p, { color = COL.chalk, w = 6, head = 18, o = 1, dash } = {}) {
  const g = G(p, { o });
  const sh = path(g, '', { stroke: color, 'stroke-width': w, ...(dash ? { 'stroke-dasharray': dash } : {}) });
  const hd = path(g, '', { fill: color, stroke: color, 'stroke-width': 2 });
  const a = Object.assign(g, {
    sh, hd,
    set(x1, y1, x2, y2) { const [s1, s2] = qArrowD(x1, y1, x2, y2, head); mD(sh, s1); mD(hd, s2); return a; },
    color(c) { cAttr(sh, 'stroke', c); cAttr(hd, 'fill', c); cAttr(hd, 'stroke', c); return a; },
  });
  return a;
}
// a vertical bracket arrow with its label: .set(x, y1, y2, label, color, side)
function qBracket(p, { size = 28, w = 6 } = {}) {
  const g = G(p, { o: 0 }), ar = qArrow(g, { w, head: 18 });
  const tick = path(g, '', { stroke: COL.chalk, 'stroke-width': 3 });
  const lab = wChem(g, '', { size, anchor: 'start', o: 1, weight: 700 });
  return Object.assign(g, {
    ar, lab,
    set(x, y1, y2, str, color, side = 1, dx = 14) {
      const flat = Math.abs(y2 - y1) < 2;
      if (flat) { mO(ar, 0); mD(tick, `M${cF(x - 16)} ${cF(y1)}H${cF(x + 16)}`); }
      else { mO(ar, 1); ar.set(x, y1, x, y2); ar.color(color); mD(tick, `M${cF(x - 12)} ${cF(y1)}H${cF(x + 12)}`); }
      cAttr(tick, 'stroke', color);
      qChem(lab, str); cAttr(lab, 'fill', color); cAttr(lab, 'text-anchor', side > 0 ? 'start' : 'end');
      cSet(lab, { x: x + side * dx, y: (y1 + y2) / 2 + size * .35 });
      return g;
    },
  });
}
// The enzyme outline: a rounded body with a square notch (the active site) on top. fit closes the lips round it, bend
// pulls the notch out of shape, socket dents the lower right. Returns { d, nb (notch floor y), top, b (half floor) }.
function qEnzGeo(R, fit = 0, bend = 0, socket = false) {
  const W = .62 * R, b = W * .5, depth = R * .5, top = -R * (.9 + .1 * fit), nb = top + depth;
  const a = W * (.8 - .32 * fit);
  const aR = a - bend * W * .2, topR = top + bend * R * .22, nbR = nb - bend * depth * .6, bR = b - bend * W * .12, tl = top - bend * R * .03;
  const body = [[aR, topR], [aR + R * .14, topR - R * .02], [R * .62, -R * .9 + bend * R * .1], [R * .97, -R * .55 + bend * R * .06], [R * 1.05, -R * .05]];
  if (socket) body.push([R * 1.0, R * .36], [R * .68, R * .5], [R * .76, R * .8]);
  else body.push([R * .92, R * .58]);
  body.push([R * .45, R * .96], [-R * .2, R * 1.0], [-R * .76, R * .76], [-R * 1.04, R * .15], [-R * .97, -R * .55], [-R * .62, -R * .9], [-a - R * .14, tl - R * .02], [-a, tl]);
  const d = cSmooth(body) + `L${cF(-b)} ${cF(nb)}L${cF(bR)} ${cF(nbR)}Z`;
  return { d, nb, top, b };
}
function qEnzBody(p, R, { color = MC.enzyme, edge = MC.enzymeEdge, socket = false, sw = 3.5, shine = true, fit = 0 } = {}) {
  const g = G(p);
  const body = path(g, qEnzGeo(R, fit, 0, socket).d, { fill: color, stroke: edge, 'stroke-width': sw });
  if (shine) mk('ellipse', { cx: -R * .45, cy: -R * .38, rx: R * .26, ry: R * .13, fill: '#fff', 'fill-opacity': .22, transform: 'rotate(-30)' }, g);
  return Object.assign(g, { body });
}
// a rounded rectangle path centred on (cx, cy)
const qRect = (w, h, r, cx = 0, cy = 0) => `M${cF(cx - w / 2 + r)} ${cF(cy - h / 2)}H${cF(cx + w / 2 - r)}Q${cF(cx + w / 2)} ${cF(cy - h / 2)} ${cF(cx + w / 2)} ${cF(cy - h / 2 + r)}V${cF(cy + h / 2 - r)}Q${cF(cx + w / 2)} ${cF(cy + h / 2)} ${cF(cx + w / 2 - r)} ${cF(cy + h / 2)}H${cF(cx - w / 2 + r)}Q${cF(cx - w / 2)} ${cF(cy + h / 2)} ${cF(cx - w / 2)} ${cF(cy + h / 2 - r)}V${cF(cy - h / 2 + r)}Q${cF(cx - w / 2)} ${cF(cy - h / 2)} ${cF(cx - w / 2 + r)} ${cF(cy - h / 2)}Z`;
// a point along a cubic Bézier and its tangent
function qBez(P0, P1, P2, P3, u) {
  const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
  const pt = [a * P0[0] + b * P1[0] + c * P2[0] + d * P3[0], a * P0[1] + b * P1[1] + c * P2[1] + d * P3[1]];
  const t = [3 * v * v * (P1[0] - P0[0]) + 6 * v * u * (P2[0] - P1[0]) + 3 * u * u * (P3[0] - P2[0]),
    3 * v * v * (P1[1] - P0[1]) + 6 * v * u * (P2[1] - P1[1]) + 3 * u * u * (P3[1] - P2[1])];
  return [pt, t];
}
// a polyline's point at fraction k of its length, with the total length
function qAlong(pts, k) {
  let tot = 0; const L = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let want = mClamp(k) * tot;
  for (let i = 0; i < L.length; i++) { if (want <= L[i] || i === L.length - 1) return qL2(pts[i], pts[i + 1], L[i] ? Math.min(1, want / L[i]) : 1); want -= L[i]; }
  return pts[pts.length - 1];
}
// an octagonal stop sign with a white bar, origin at its centre
function qStop(p, { r = 26, o = 1 } = {}) {
  const g = G(p, { o });
  path(g, zNgon(8, r, 0, 0, Math.PI / 8), { fill: MC.stop, stroke: '#fff', 'stroke-width': 3 });
  mk('rect', { x: -r * .55, y: -r * .14, width: r * 1.1, height: r * .28, rx: 2, fill: '#fff' }, g);
  return g;
}

/* ---------- energyBurst ---------- */
function energyBurst(p, { x = 0, y = 0, s = 1, o = 1, r = 60, color = MC.spark } = {}) {
  const g = G(p, { x, y, s, o }), inner = G(g, { o: 0 });
  let rays = ''; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + .3; rays += `M${cF(Math.cos(a) * r * .75)} ${cF(Math.sin(a) * r * .75)}L${cF(Math.cos(a) * r * 1.3)} ${cF(Math.sin(a) * r * 1.3)}`; }
  path(inner, rays, { stroke: color, 'stroke-width': 5 });
  path(inner, zStar(r * .8, r * .42, 9), { fill: color, stroke: MC.sparkEdge, 'stroke-width': 2 });
  mk('circle', { r: r * .25, fill: '#fff6d8' }, inner);
  const b = Object.assign(g, {
    inner,
    set(k) { k = zK(k); cSet(inner, { s: .3 + .9 * Math.sqrt(k), o: k <= 0 || k >= 1 ? 0 : Math.min(1, k * 6) * (1 - mRamp(k, .55, 1)), r: k * 40 }); return b; },
  });
  return b.set(0);
}

/* ---------- pathwayStrip ---------- */
function pathwayStrip(p, { x = 800, y = 450, s = 1, o = 1, w = 1200, labels = ['A', 'B', 'C', 'D'], names, enzymes, colors, dirs, drop = 70, box = 100, size = 46, reactions = false } = {}) {
  const n = labels.length, g = G(p, { x, y, s, o });
  names = names || labels.map((_, i) => i === 0 ? 'starting molecule' : i === n - 1 ? 'product' : '');
  enzymes = enzymes || labels.slice(1).map((_, i) => 'enzyme ' + (i + 1));
  const PAL = [MC.pathA, MC.pathB, MC.pathC, MC.pathD];
  colors = colors || labels.map((_, i) => i === n - 1 ? MC.pathD : PAL[i % 3]);
  dirs = dirs || labels.slice(1).map(() => 1);
  const backL = G(g), arrL = G(g), enzL = G(g), molL = G(g), front = G(g);
  const span = w / (n - 1), bx = i => -w / 2 + i * span;
  // the free-energy axis (shows with tilt)
  const axis = G(backL, { o: 0 });
  const axTop = -drop * (n - 1) / 2 - 90, axBot = drop * (n - 1) / 2 + 90, axX = -w / 2 - box / 2 - 70;
  mArrow(axis, [axX, axBot], [axX, axTop], { color: COL.dim, w: 4, head: 16 });
  const axLab = G(axis, { x: axX - 18, y: (axTop + axBot) / 2, r: -90 });
  wLabel(axLab, 'free energy', { size: 24, fill: COL.dim, o: 1 });
  // feedback loop (under the strip, from the product back to enzyme 1)
  const loop = path(backL, '', { stroke: MC.stop, 'stroke-width': 7, pathLength: 1, 'stroke-dasharray': '1 1' }, { d: 0 });
  const loopHead = path(backL, '', { fill: MC.stop, stroke: MC.stop, 'stroke-width': 2 }, { o: 0 });
  // molecules
  const mols = labels.map((lab, i) => {
    const long = lab.length > 2, fs = long ? Math.round(size * .56) : size;
    const bw = Math.max(box, Math.round(uiW(lab, fs) * 1.12 + 36)), mg = G(molL, { x: bx(i) });
    path(mg, qRect(bw, box, 18), { fill: colors[i], stroke: mix(colors[i], '#000000', .35), 'stroke-width': 3.5 });
    mk('ellipse', { cx: -bw * .28, cy: -box * .3, rx: Math.min(bw * .16, 26), ry: box * .08, fill: '#fff', 'fill-opacity': .3 }, mg);
    wLabel(mg, lab, { y: fs * .36, size: fs, fill: '#14233a', weight: 800, o: 1 });
    if (names[i]) wLabel(mg, names[i], { y: box / 2 + 34, size: 24, fill: COL.dim, weight: 600, o: 1 });
    return Object.assign(mg, { bw });
  });
  // arrows, flow dots and enzymes
  const arrows = [], dots = [], enzs = [];
  for (let i = 0; i < n - 1; i++) {
    const ag = G(arrL), ar = qArrow(ag, { w: 7, head: 22 });
    const dg = G(ag); // s .999: a dot at exactly (0, 0) would otherwise lose its transform attribute and regain it after its opacity,
    // so a played and a seeked frame would differ in attribute order (the e2e replay check)
    const ds = [0, 1, 2].map(() => put(mk('circle', { r: 6, fill: COL.chalk }, dg), { s: .999, o: 0 }));
    const rl = reactions ? wLabel(ag, 'reaction ' + (i + 1), { size: 22, fill: COL.dim, weight: 500, o: 1 }) : null;
    arrows.push(Object.assign(ag, { ar, rl })); dots.push(Object.assign(dg, { ds }));
    const eg = G(enzL), ebody = qEnzBody(eg, 30, { sw: 2.5, shine: false, fit: 1 });
    put(ebody, { s: 1 });
    const el = wLabel(eg, enzymes[i], { y: -46, size: 24, fill: COL.chalk, weight: 700, o: 1 });
    enzs.push(Object.assign(eg, { body: ebody.body, el }));
  }
  // feedback rider (a copy of the product) and the stop sign
  const rider = G(front, { o: 0 });
  path(rider, qRect(54, 54, 12), { fill: colors[n - 1], stroke: mix(colors[n - 1], '#000000', .35), 'stroke-width': 3 });
  wLabel(rider, labels[n - 1].length > 2 ? labels[n - 1][0].toUpperCase() : labels[n - 1], { y: 9, size: 26, fill: '#14233a', weight: 800, o: 1 });
  const stop = qStop(front, { r: 24, o: 0 });
  // spark
  const spk = solute(front, 'ATP', { r: 22 }); put(spk, { o: 0 });

  const N = 3 * n - 2;      // build order: mol0, arrow1, enzyme1, mol1, …
  const ALL = () => [...mols.map((_, i) => 'mol' + i), ...arrows.map((_, i) => 'arrow' + (i + 1)), ...enzs.map((_, i) => 'enzyme' + (i + 1))];
  function expand(nm) {
    if (nm == null) return [];
    const s = String(nm), i = labels.indexOf(s);
    if (i >= 0) return ['mol' + i];
    if (s === 'start') return ['mol0'];
    if (s === 'product') return ['mol' + (n - 1)];
    if (s === 'molecules') return mols.map((_, j) => 'mol' + j);
    if (s === 'enzymes') return enzs.map((_, j) => 'enzyme' + (j + 1));
    if (s === 'arrows') return arrows.map((_, j) => 'arrow' + (j + 1));
    if (s === 'all') return ALL();
    const m = s.match(/^step(\d+)$/); if (m) return ['arrow' + m[1], 'enzyme' + m[1]];
    return [s];
  }
  let bk = 1, lit = null, fk = 0, tk = 0, sI = -1, sK = 0, fT = 0, fAmt = 0, fb = 0;
  let geo = null;
  function layout() {
    let cum = 0; const ys = [0];
    for (let i = 0; i < n - 1; i++) { cum += dirs[i] * drop * tk; ys.push(cum); }
    const mid = (Math.max(...ys) + Math.min(...ys)) / 2;
    return ys.map((v, i) => [bx(i), v - mid]);
  }
  function apply() {
    const C = layout(); geo = C;
    const off = mRamp(fb, .75, .95);
    const fo = nm => (lit && lit.size ? (lit.has(nm) ? 1 : 1 - .75 * fk) : 1);
    const bo = j => mRamp(bk * N - j, 0, 1);
    mols.forEach((m, i) => cSet(m, { x: C[i][0], y: C[i][1], o: bo(i * 3) * fo('mol' + i) }));
    for (let i = 0; i < n - 1; i++) {
      const a = C[i], b = C[i + 1], x1 = a[0] + mols[i].bw / 2 + 10, x2 = b[0] - mols[i + 1].bw / 2 - 10;
      const L = Math.hypot(x2 - x1, b[1] - a[1]) || 1, ny = (x2 - x1) / L, nx = -(b[1] - a[1]) / L;   // normal (up is −)
      arrows[i].ar.set(x1, a[1], x2, b[1]);
      const tint = dirs[i] > 0 ? MC.exo : MC.endo, base = i === 0 ? zMix(COL.chalk, COL.faint, off) : COL.chalk;
      arrows[i].ar.color(zMix(base, tint, tk * (i === 0 ? 1 - off : 1)));
      const ab = bo(i * 3 + 1) * fo('arrow' + (i + 1));
      cSet(arrows[i], { o: ab });
      const mx = (x1 + x2) / 2, my = (a[1] + b[1]) / 2;
      if (arrows[i].rl) cSet(arrows[i].rl, { x: mx + nx * 36, y: my + ny * 36 + 8 });
      // enzyme above the arrow's middle
      cSet(enzs[i], { x: mx - nx * 52, y: my - ny * 52, o: bo(i * 3 + 2) * fo('enzyme' + (i + 1)) });
      // flow dots
      const amt = Array.isArray(fAmt) ? (fAmt[i] ?? 0) : fAmt;
      dots[i].ds.forEach((d, j) => {
        const u = cFrac(fT * .55 + j / 3 + i * .17), q = qL2([x1 + 6, a[1]], [x2 - 26, b[1]], u);
        cSet(d, { x: q[0], y: q[1], o: amt * (1 - off) * Math.sin(Math.PI * u) });
      });
      if (i === sI) {
        const sd = arrows[i].rl ? 96 : 62, sx = mx + nx * sd, sy = my + ny * sd;
        cSet(spk, { x: sx, y: sy, s: .4 + .6 * back(mRamp(sK, 0, .5)), o: mRamp(sK, 0, .2), r: 12 * Math.sin(sK * 9) });
      }
    }
    if (sI < 0) cSet(spk, { o: 0 });
    // enzyme 1 switched off
    cAttr(enzs[0].body, 'fill', zMix(MC.enzyme, MC.off, off)); cAttr(enzs[0].body, 'stroke', zMix(MC.enzymeEdge, '#4d5560', off));
    // feedback loop
    const P = C[n - 1];
    const low = Math.max(...C.map(c => c[1])) + box / 2 + 80;
    const e1 = [enzs[0]._st.x, enzs[0]._st.y];
    const lx = e1[0], pts = [[P[0], P[1] + box / 2 + 6], [P[0], low], [lx - 90, low], [lx - 90, e1[1] + 6], [lx - 26, e1[1] + 6]];
    mD(loop, 'M' + pts.map(cP).join('L'));
    cSet(loop, { d: mRamp(fb, 0, .45) * .97 });
    const [, h2] = qArrowD(lx - 90, e1[1] + 6, lx - 34, e1[1] + 6, 22);
    mD(loopHead, h2); cSet(loopHead, { o: mRamp(fb, .42, .47) });
    const rk = mRamp(fb, .3, .75), rp = qAlong(pts, io(rk));
    cSet(rider, { x: rp[0], y: rp[1], o: fb > .3 ? mRamp(fb, .3, .36) : 0, s: .9 });
    cSet(stop, { x: e1[0] + 2, y: e1[1] - 96, o: off, s: .6 + .4 * off });
    cSet(axis, { o: tk });
    return st_;
  }
  const st_ = Object.assign(g, {
    mols, arrows, enzymes: enzs, n,
    build(k) { bk = zK(k); return apply(); },
    focus(names, k = 1) { lit = new Set((Array.isArray(names) ? names : [names]).flatMap(expand)); fk = zK(k); return apply(); },
    tilt(k) { tk = zK(k); return apply(); },
    spark(i, k) { sI = i == null ? -1 : i; sK = zK(k); return apply(); },
    flow(t, amt = 1) { fT = zT(t); fAmt = Array.isArray(amt) ? amt.map(zK) : zK(amt); return apply(); },
    feedback(k) { fb = zK(k); return apply(); },
    pt(nm) {
      const C = geo || layout();
      let m = String(nm).match(/^mol(\d+)$/); if (m) return cOut(g, C[+m[1]]);
      if (nm === 'start') return cOut(g, C[0]);
      if (nm === 'product') return cOut(g, C[n - 1]);
      m = String(nm).match(/^enzyme(\d+)$/); if (m) { const e = enzs[+m[1] - 1]; return cOut(g, [e._st.x, e._st.y]); }
      m = String(nm).match(/^arrow(\d+)$/); if (m) { const i = +m[1] - 1; return cOut(g, [(C[i][0] + C[i + 1][0]) / 2, (C[i][1] + C[i + 1][1]) / 2]); }
      if (nm === 'stop') return cOut(g, [stop._st.x, stop._st.y]);
      if (nm === 'loop') return cOut(g, [rider._st.x, rider._st.y]);
      return cOut(g, [0, 0]);
    },
  });
  return apply();
}

/* ---------- energyDiagram ---------- */
function energyDiagram(p, { x = 0, y = 0, s = 1, o = 1, w = 900, h = 520, size = 28, axes = true } = {}) {
  const g = G(p, { x, y, s, o });
  const X = u => w * (.05 + .73 * u), Y = lv => -(h * .07 + lv * h * .86), BX = w * .86;
  if (axes) {
    mArrow(g, [0, 0], [0, -h - 10], { color: COL.chalk, w: 4, head: 16 });
    path(g, `M0 0H${w}`, { stroke: COL.chalk, 'stroke-width': 4 });
    const yl = G(g, { x: -24, y: -h / 2, r: -90 });
    wChem(yl, 'Free energy, G', { size: size * .9, fill: COL.chalk, o: 1 });
    wLabel(g, 'Progress of the reaction', { x: w * .42, y: size * 1.35, size: size * .9, o: 1 });
    mArrow(g, [w * .42 + uiW('Progress of the reaction', size * .9) / 2 + 16, size * .95], [w * .42 + uiW('Progress of the reaction', size * .9) / 2 + 110, size * .95], { color: COL.chalk, w: 3.5, head: 14 });
  }
  const guide = path(g, '', { stroke: COL.dim, 'stroke-width': 2.5, 'stroke-dasharray': '10 8' });
  const peakL = path(g, '', { stroke: MC.ea, 'stroke-width': 2.5, 'stroke-dasharray': '6 7' }, { o: 0 }), peakLG = path(g, '', { stroke: MC.ea, 'stroke-width': 2, 'stroke-dasharray': '6 7', 'stroke-opacity': .6 }, { o: 0 });
  const ghost = path(g, '', { stroke: COL.chalk, 'stroke-width': 4, 'stroke-dasharray': '12 10' }, { o: 0 });
  const curve = path(g, '', { stroke: COL.chalk, 'stroke-width': 7 });
  const tsRing = G(g, { o: 0 }); mk('ellipse', { rx: 46, ry: 30, fill: '#fff6d8', 'fill-opacity': .12, stroke: '#fff6d8', 'stroke-width': 3, 'stroke-dasharray': '8 7' }, tsRing);
  const eaG = qBracket(g, { size }), ea = qBracket(g, { size }), dg = qBracket(g, { size });
  const lR = wLabel(g, 'Reactants', { size, anchor: 'start', o: 0 }), lP = wLabel(g, 'Products', { size, anchor: 'end', o: 0 }), lT = wLabel(g, 'Transition state', { size, o: 0 });
  const ball = G(g, { o: 0 });
  mk('circle', { r: 17, fill: MC.sub, stroke: MC.subEdge, 'stroke-width': 3 }, ball);
  mk('circle', { cx: -5, cy: -6, r: 5, fill: '#fff', 'fill-opacity': .45 }, ball);
  let S = {};
  const lev = (u, r, pp, hump) => {
    const v = mClamp((u - .22) / .56), L = r + (pp - r) * qSS(v), b = Math.sin(Math.PI * v) ** 2;
    const E = (Math.max(r, pp) + hump - (r + pp) / 2) * Math.min(1, hump / .06);
    return L + b * E;
  };
  const dPath = (r, pp, hump) => { let d = ''; for (let i = 0; i <= 90; i++) { const u = i / 90; d += (i ? 'L' : 'M') + cF(X(u)) + ' ' + cF(Y(lev(u, r, pp, hump))); } return d; };
  const R2 = v => Math.round(v * 1000) / 1000;
  const ed = Object.assign(g, {
    X, Y,
    curveAt(u) { return lev(u, S.r, S.p, S.hump); },
    set({ r = .65, p: pp = .25, hump = 0, ea: eaK = 0, dg: dgK = 0, ghost: gh = 0, ghostO = 0, eaG: eaGK = 0, enz = 0, ball: bu = -1, lab = 1, ts = 0, t = 0 } = {}) {
      r = R2(r); pp = R2(pp); hump = R2(Math.max(0, hump)); gh = R2(Math.max(0, gh)); t = zT(t);
      S = { r, p: pp, hump };
      mD(curve, dPath(r, pp, hump)); cAttr(curve, 'stroke', zMix(COL.chalk, MC.enzyme, zK(enz)));
      mD(ghost, dPath(r, pp, gh)); mO(ghost, zK(ghostO));
      const peak = Math.max(r, pp) + hump, peakG = Math.max(r, pp) + gh, xm = X(.5);
      // guides: the reactant level across to the brackets, the product level across to the ΔG bracket
      const gO = Math.max(zK(eaK), zK(dgK), zK(eaGK));
      mD(guide, `M${cF(X(.2))} ${cF(Y(r))}H${cF(BX + 20)}M${cF(X(.8))} ${cF(Y(pp))}H${cF(BX + 20)}`); mO(guide, gO);
      const cE = hump > .005 ? 1 : 0;
      const xa = X(.19), xg = X(.1), eO = zK(eaK) * cE, gOn = zK(eaGK) * (gh > .005 ? 1 : 0);
      ea.set(xa, Y(r), Y(peak), 'E_A', MC.ea, -1); mO(ea, eO);
      eaG.set(xg, Y(r), Y(peakG), 'E_A', mix(MC.ea, '#0f1e33', .3), -1); mO(eaG, gOn);
      mD(peakL, `M${cF(xa)} ${cF(Y(peak))}H${cF(xm)}`); mO(peakL, eO);
      mD(peakLG, `M${cF(xg)} ${cF(Y(peakG))}H${cF(xm)}`); mO(peakLG, gOn);
      const dd = Math.round((pp - r) * 100);
      const dstr = dd < 0 ? 'ΔG < 0' : dd > 0 ? 'ΔG > 0' : 'ΔG = 0', dcol = dd < 0 ? MC.exo : dd > 0 ? MC.endo : COL.chalk;
      dg.set(BX, Y(r), Y(pp), dstr, dcol, 1); mO(dg, zK(dgK));
      const lk = zK(lab);
      cSet(lR, { x: X(0) + 4, y: Y(r) + size * 1.25, o: lk }); cSet(lP, { x: X(1), y: Y(pp) + size * 1.25, o: lk });
      cSet(lT, { x: xm, y: Y(Math.max(peak, gh > .005 && zK(ghostO) > 0 ? peakG : 0)) - 22, o: lk * Math.min(1, hump / .08) });
      cSet(tsRing, { x: xm, y: Y(peak) - 4, o: zK(ts) * (.55 + .45 * Math.sin(t * 9)) * Math.min(1, hump / .08) });
      if (bu >= 0) {
        const u = zK(bu), lv = lev(u, r, pp, hump), du = .004, sl = (Y(lev(Math.min(1, u + du), r, pp, hump)) - Y(lev(Math.max(0, u - du), r, pp, hump))) / (X(Math.min(1, u + du)) - X(Math.max(0, u - du)));
        const nl = Math.hypot(1, sl), nx = sl / nl, ny = -1 / nl;
        cSet(ball, { x: X(u) + nx * 19, y: Y(lv) + ny * 19, o: 1 });
      } else cSet(ball, { o: 0 });
      return ed;
    },
    pt(nm) {
      const { r = .65, p: pp = .25, hump = 0 } = S, peak = Math.max(r, pp) + hump;
      const at = { reactants: [X(.1), Y(r)], products: [X(.9), Y(pp)], peak: [X(.5), Y(peak)], ea: [X(.5), Y((r + peak) / 2)], dg: [BX, Y((r + pp) / 2)], ball: [ball._st.x, ball._st.y] }[nm] || [0, 0];
      return cOut(g, at);
    },
  });
  return ed.set({});
}

/* ---------- ATP ---------- */
function qPhos(p, { x = 0, y = 0, r = 19, i = false } = {}) {
  const g = G(p, { x, y });
  mk('circle', { r, fill: MC.P, stroke: MC.Pedge, 'stroke-width': 2.5 }, g);
  mk('ellipse', { cx: -r * .35, cy: -r * .4, rx: r * .3, ry: r * .17, fill: '#fff', 'fill-opacity': .4 }, g);
  wLabel(g, 'P', { x: 0, y: r * .36, size: r * 1.0, fill: '#24160a', weight: 800, o: 1 });
  const sub = wLabel(g, 'i', { x: r * .62, y: r * .7, size: r * .62, fill: '#24160a', weight: 800, o: i ? 1 : 0 });
  return Object.assign(g, { sub });
}
function atpMolecule(p, { x = 0, y = 0, s = 1, o = 1, n = 3, name = true, labels = false, water = true } = {}) {
  const g = G(p, { x, y, s, o });
  // ribose (point down), adenine (fused pentagon + hexagon) up right
  const a = 26, hx = 90.4, hy = -60, px = 50, py = -60;
  const sticks = G(g);
  path(sticks, 'M17.6 -24.3L43.2 -39', { stroke: COL.chalk, 'stroke-width': 4 });
  const PX = i => -60 - i * 50, PY = -42;
  const links = [];
  links.push(path(sticks, `M-17.6 -24.3L-34 ${PY}L${PX(0)} ${PY}`, { stroke: COL.chalk, 'stroke-width': 4 }));
  for (let i = 1; i < 3; i++) links.push(path(sticks, `M${PX(i - 1)} ${PY}L${PX(i)} ${PY}`, { stroke: COL.chalk, 'stroke-width': 4 }));
  const ad = G(g), ri = G(g);
  path(ad, zNgon(6, a, hx, hy, Math.PI / 6), { fill: MC.adenine, stroke: MC.adenineEdge, 'stroke-width': 3 });
  path(ad, zNgon(5, a * .8507, px, py, 36 * Math.PI / 180), { fill: MC.adenine, stroke: MC.adenineEdge, 'stroke-width': 3 });
  path(ri, zNgon(5, 30, 0, 0, Math.PI / 2), { fill: MC.ribose, stroke: MC.riboseEdge, 'stroke-width': 3 });
  const balls = [0, 1, 2].map(i => qPhos(g, { x: PX(i), y: PY }));
  if (n < 3) { put(balls[2], { o: 0 }); put(links[2], { o: 0 }); }
  const flash = G(g, { x: (PX(1) + PX(2)) / 2, y: PY, o: 0 }); mk('circle', { r: 16, fill: '#fff6d8', 'fill-opacity': .85 }, flash);
  const wat = water ? waterMolecule(g, { s: .42, face: false }) : null; if (wat) put(wat, { o: 0 });
  const burst = energyBurst(g, { x: (PX(1) + PX(2)) / 2, y: PY - 6, r: 46 });
  const nm = G(g, { y: 66, x: -40, o: name ? 1 : 0 });
  const nATP = wLabel(nm, 'ATP', { size: 30, weight: 800, fill: COL.chalk, o: 1 }), nADP = wLabel(nm, 'ADP', { size: 30, weight: 800, fill: COL.chalk, o: 0 });
  const labs = G(g, { o: 0 });
  wLabel(labs, 'adenine', { x: hx - 18, y: hy - 42, size: 24, fill: MC.adenine, o: 1 });
  wLabel(labs, 'ribose', { x: 40, y: 26, size: 24, fill: MC.ribose, anchor: 'start', o: 1 });
  wLabel(labs, 'phosphate groups', { x: PX(1), y: PY - 36, size: 24, fill: MC.P, o: 1 });
  const P0 = [PX(2), PY], P1 = [PX(2) - 64, PY + 84], W0 = [PX(2) - 40, PY + 110], W1 = [(PX(1) + PX(2)) / 2, PY + 30];
  const pi = balls[2];
  let mol;
  function pose(k, burstOn) {
    const full = n >= 3;
    const wk = mRamp(k, .05, .35), q = qL2(W0, W1, io(wk));
    if (wat) cSet(wat, { x: q[0], y: q[1], o: full && burstOn ? Math.min(mRamp(k, .05, .12), 1 - mRamp(k, .38, .46)) : 0 });
    mO(flash, full ? mBump(k, .3, .48) : 0);
    const m = io(mRamp(k, .42, .8)), pp = qL2(P0, P1, m);
    cSet(pi, { x: pp[0], y: pp[1], o: full ? 1 : 0 });
    mO(pi.sub, k > .45 ? 1 : 0);
    mO(links[2], full ? 1 - mRamp(k, .4, .46) : 0);
    burst.set(burstOn && full ? mRamp(k, .42, .9) : 0);
    const nk = full ? mRamp(k, .5, .6) : 1;
    mO(nATP, 1 - nk); mO(nADP, nk);
    return mol;
  }
  mol = Object.assign(g, {
    pi, burst, balls,
    labels(k) { mO(labs, zK(k)); return mol; },
    hydrolyse(k) { return pose(zK(k), true); },
    charge(k) { return pose(1 - zK(k), false); },
    pt(nmx) {
      const at = { tip: [pi._st.x, pi._st.y], pi: [pi._st.x, pi._st.y], bond: [(PX(1) + PX(2)) / 2, PY], adenine: [70, -60], ribose: [0, 0], tail: [PX(1), PY] }[nmx] || [0, 0];
      return cOut(g, at);
    },
  });
  if (labels) mO(labs, 1);
  return pose(0, false);
}

/* ---------- atpCycle ---------- */
function qZig(x1, x2, y, amp = 22, n = 6) {
  let d = `M${cF(x1)} ${cF(y)}`; const L = x2 - x1;
  for (let i = 1; i <= n * 2; i++) d += `L${cF(x1 + L * i / (n * 2 + 1))} ${cF(y + (i % 2 ? -amp : amp))}`;
  return d + `L${cF(x2)} ${cF(y)}`;
}
function atpCycle(p, { x = 0, y = 0, s = 1, o = 1, R = 190, labels = true } = {}) {
  const g = G(p, { x, y, s, o });
  const rad = a => a * Math.PI / 180;
  const arc = (a1, a2) => `M${cF(R * Math.cos(rad(a1)))} ${cF(R * Math.sin(rad(a1)))}A${R} ${R} 0 0 1 ${cF(R * Math.cos(rad(a2)))} ${cF(R * Math.sin(rad(a2)))}`;
  const headAt = a => { const px = R * Math.cos(rad(a)), py = R * Math.sin(rad(a)), tx = -Math.sin(rad(a)), ty = Math.cos(rad(a)); const [, h] = qArrowD(px - tx * 30, py - ty * 30, px, py, 28); return path(g, h, { fill: COL.chalk, stroke: COL.chalk, 'stroke-width': 2 }); };
  path(g, arc(-58, 52), { stroke: COL.chalk, 'stroke-width': 9 }); headAt(60);
  path(g, arc(122, 232), { stroke: COL.chalk, 'stroke-width': 9 }); headAt(240);
  // zigzag energy arrows
  const zL = G(g), zR = G(g);
  const zl = path(zL, qZig(-R - 380, -R - 60, 0), { stroke: MC.spark, 'stroke-width': 10, 'stroke-dasharray': '34 12' });
  path(zL, qArrowD(-R - 80, 0, -R - 14, 0, 34)[1], { fill: MC.spark, stroke: MC.spark, 'stroke-width': 2 });
  const zr = path(zR, qZig(R + 14, R + 300, 0), { stroke: MC.spark, 'stroke-width': 10, 'stroke-dasharray': '34 12' });
  path(zR, qArrowD(R + 300, 0, R + 340, 0, 34)[1], { fill: MC.spark, stroke: MC.spark, 'stroke-width': 2 });
  if (labels) {
    wLabel(g, 'energy from catabolism', { x: -R - 220, y: 76, size: 28, fill: COL.chalk, o: 1 });
    wLabel(g, 'exergonic, energy-releasing', { x: -R - 220, y: 110, size: 24, fill: MC.exo, weight: 500, o: 1 });
    wLabel(g, 'energy for cellular work', { x: R + 200, y: 76, size: 28, fill: COL.chalk, o: 1 });
    wLabel(g, 'endergonic, energy-consuming', { x: R + 200, y: 110, size: 24, fill: MC.endo, weight: 500, o: 1 });
  }
  // stations
  const top = G(g, { y: -R }), bot = G(g, { y: R });
  solute(top, 'ATP', { r: 34 });
  const h2o = G(top, { x: 124 }); mk('ellipse', { rx: 44, ry: 28, fill: '#3a8fd0', stroke: '#256aa0', 'stroke-width': 2.5 }, h2o);
  wChem(h2o, 'H_2O', { y: 10, size: 28, fill: '#fff', weight: 800, o: 1 });
  wLabel(top, '+', { x: 66, y: 11, size: 34, o: 1 });
  solute(bot, 'ADP', { x: -52, r: 30 }); wLabel(bot, '+', { x: 14, y: 11, size: 34, o: 1 });
  qPhos(bot, { x: 64, r: 24, i: true });
  // the travelling token
  const tok = G(g, { o: 0 }), tS = solute(tok, 'ATP', { r: 18, label: false }), tA = G(tok, { o: 0 });
  mk('rect', { x: -20, y: -11, width: 40, height: 22, rx: 11, fill: MC.adp, stroke: '#9d957a', 'stroke-width': 2 }, tA);
  const c = Object.assign(g, {
    set(u) {
      u = qU(u);
      const a = rad(-90 + 360 * u);
      const v = u < .5 ? mRamp(u, .1, .4) : 1 - mRamp(u, .6, .9);
      const dTop = Math.min(u, 1 - u), dBot = Math.abs(u - .5);
      cSet(tok, { x: R * Math.cos(a), y: R * Math.sin(a), o: Math.min(mRamp(dTop, .05, .1), mRamp(dBot, .05, .1)) });
      mO(tS, 1 - v); mO(tA, v);
      cSet(top, { s: 1 + .14 * Math.max(0, 1 - dTop / .07) }); cSet(bot, { s: 1 + .14 * Math.max(0, 1 - dBot / .07) });
      mO(zR, .5 + .5 * mBump(u, .06, .5)); mO(zL, .5 + .5 * mBump(u, .55, .99));
      cAttr(zr, 'stroke-dashoffset', cF(-u * 460)); cAttr(zl, 'stroke-dashoffset', cF(-u * 460));
      return c;
    },
    pt(nm) { return cOut(g, { atp: [0, -R], adp: [0, R], in: [-R - 220, 0], out: [R + 200, 0] }[nm] || [0, 0]); },
  });
  return c.set(0);
}

/* ---------- coupling: Glu, ammonia, the coupled reaction, the ledger ---------- */
function ammoniaShape(p, { x = 0, y = 0, s = 1, o = 1, kind = 'NH3' } = {}) {
  const g = G(p, { x, y, s, o }), body = G(g);
  path(body, 'M-48 -26H48L30 26H-30Z', { fill: MC.nh3, stroke: MC.nh3Edge, 'stroke-width': 3 });
  mk('ellipse', { cx: -20, cy: -15, rx: 14, ry: 4.5, fill: '#fff', 'fill-opacity': .3 }, body);
  const t = wChem(body, '', { y: 9, size: 28, fill: '#0e1a33', weight: 800, o: 1 });
  const a = Object.assign(g, {
    body,
    kind(kd) { qChem(t, kd === 'NH2' ? 'NH_2' : 'NH_3'); cSet(body, { s: kd === 'NH2' ? .82 : 1 }); return a; },
    pose(nx, ny, r) { cSet(g, r === undefined ? { x: nx, y: ny } : { x: nx, y: ny, r }); return a; },
  });
  return a.kind(kind);
}
function gluShape(p, { x = 0, y = 0, s = 1, o = 1, size = 110, label = 'Glu' } = {}) {
  const g = G(p, { x, y, s, o }), h = size * .866;
  const stick = path(g, `M${cF(size * .14)} ${cF(-h * .4)}L${cF(size * .5)} ${cF(-h * .78)}`, { stroke: COL.chalk, 'stroke-width': 4 }, { o: 0 });
  const nh = ammoniaShape(g, { x: size * .42, y: -h * .36, kind: 'NH2' }); put(nh, { o: 0 });
  path(g, `M0 ${cF(-h * .62)}L${cF(size / 2)} ${cF(h * .38)}L${cF(-size / 2)} ${cF(h * .38)}Z`, { fill: MC.glu, stroke: MC.gluEdge, 'stroke-width': 3.5 });
  mk('ellipse', { cx: -size * .07, cy: -h * .22, rx: size * .06, ry: size * .13, fill: '#fff', 'fill-opacity': .3 }, g);
  wLabel(g, label, { y: h * .25, size: size * .26, fill: '#12301f', weight: 800, o: 1 });
  const P = qPhos(g, { x: size * .58, y: -h * .86, r: 17 }); put(P, { o: 0 });
  const gl = Object.assign(g, {
    P, nh, stick,
    set({ P: pk = 0, nh: nk = 0 } = {}) { pk = zK(pk); nk = zK(nk); mO(P, pk); mO(stick, pk); mO(nh, nk); return gl; },
    pt(nm) { return cOut(g, { P: [size * .58, -h * .86], nh: [size * .42, -h * .36], base: [0, h * .38] }[nm] || [0, 0]); },
    pose(nx, ny) { cSet(g, { x: nx, y: ny }); return gl; },
  });
  return gl;
}
function coupledReaction(p, { x = 0, y = 0, s = 1, o = 1, labels = true } = {}) {
  const g = G(p, { x, y, s, o });
  const glu = gluShape(g, {});
  const adp = solute(g, 'ADP', { r: 26 }), atp = solute(g, 'ATP', { r: 34 });
  const pi = qPhos(g, { r: 17 });
  const nh = ammoniaShape(g, { kind: 'NH3' });
  const lab = (str, xx, yy, col = COL.chalk) => wLabel(g, str, { x: xx, y: yy, size: 26, fill: col, o: 0 });
  const L = labels ? {
    glu: lab('glutamic acid', 0, 86), inter: lab('phosphorylated intermediate', 0, 86), gln: lab('glutamine', 0, 86),
    nh3: lab('ammonia', 250, -186),
  } : null;
  const ATP0 = [-250, 0], ATP1 = [-104, -78], ADP1 = [-250, 110];
  const Pon = [glu.P._st.x, glu.P._st.y], PIoff = [250, 112];
  const NH0 = [250, -140], NHon = [glu.nh._st.x, glu.nh._st.y];
  let c;
  c = Object.assign(g, {
    glu, atp, adp, pi, nh,
    set(k) {
      k = zK(k);
      const m1 = io(mRamp(k, 0, .22)), qa = qL2(ATP0, ATP1, m1), xf = mRamp(k, .24, .32);
      const qd = qL2(ATP1, ADP1, io(mRamp(k, .36, .5)));
      cSet(atp, { x: qa[0], y: qa[1], o: 1 - xf, r: 14 * Math.sin(Math.PI * m1) });
      const qq = k < .36 ? qa : qd;
      cSet(adp, { x: qq[0], y: qq[1], o: xf });
      // the phosphate: from the spark to the Glu (.24–.38), on it (.38–.7), then off as Pi (.7–.84)
      const hand = io(mRamp(k, .24, .38)), leave = io(mRamp(k, .7, .84));
      const pp = k < .7 ? qL2([qa[0] - 24, qa[1] - 6], Pon, hand) : qL2(Pon, PIoff, leave);
      cSet(pi, { x: pp[0], y: pp[1], o: mRamp(k, .22, .26) });
      mO(pi.sub, k > .72 ? 1 : 0);
      mO(glu.stick, mRamp(k, .36, .39) * (1 - mRamp(k, .69, .72)));
      mO(glu.nh, mRamp(k, .7, .74)); mO(glu.P, 0);
      const na = io(mRamp(k, .48, .7)), qn = qL2(NH0, NHon, na);
      cSet(nh, { x: qn[0], y: qn[1], o: mRamp(k, .44, .5) * (1 - mRamp(k, .7, .74)) });
      if (L) {
        mO(L.glu, 1 - mRamp(k, .34, .4)); mO(L.inter, mRamp(k, .38, .44) * (1 - mRamp(k, .72, .78))); mO(L.gln, mRamp(k, .82, .9));
        mO(L.nh3, mRamp(k, .44, .5) * (1 - mRamp(k, .52, .58)));
      }
      return c;
    },
    pt(nm) { const e = { glu, atp, adp, pi, nh }[nm]; return e ? cOut(g, [e._st.x, e._st.y]) : cOut(g, [0, 0]); },
  });
  return c.set(0);
}
function kcalLedger(p, { x = 0, y = 0, s = 1, o = 1, size = 34 } = {}) {
  const g = G(p, { x, y, s, o }), lh = size * 1.5, w = Math.round(uiW('+ ΔGATP = −7.3 kcal/mol', size) * 1.1 + 64), h = Math.round(lh * 3.4 + 30);
  mk('rect', { x: 0, y: 0, width: w, height: h, rx: 14, fill: '#0b1626', stroke: COL.dim, 'stroke-width': 2.5 }, g);
  const row = (yy, col, wt = 700) => wChem(g, '', { x: w - 30, y: yy, size, fill: col, anchor: 'end', weight: wt, o: 0 });
  const y1 = 18 + lh * .75, y2 = y1 + lh, y3 = y2 + lh * 1.25;
  const r1 = row(y1, MC.endo), r2 = row(y2, MC.exo), r3 = row(y3, MC.exo, 800);
  const rule = path(g, `M${cF(w * .14)} ${cF(y2 + lh * .32)}H${cF(w - 26)}`, { stroke: COL.chalk, 'stroke-width': 3 }, { o: 0 });
  const box = path(g, qRect(w - 30, lh * .98, 10, w / 2, y3 - size * .34), { stroke: MC.exo, 'stroke-width': 2.5 }, { o: 0 });
  const f = v => Math.abs(v) < .05 ? '0.0' : (v < 0 ? '−' : '+') + Math.abs(v).toFixed(1);
  let l;
  l = Object.assign(g, {
    w, h,
    set(k) {
      k = zK(k);
      const a = mRamp(k, 0, .3), b = mRamp(k, .35, .65), c = mRamp(k, .72, 1);
      qChem(r1, `ΔG_{Glu} = ${f(3.4 * a)} kcal/mol`); mO(r1, mRamp(k, 0, .04));
      qChem(r2, `+ ΔG_{ATP} = ${f(-7.3 * b)} kcal/mol`); mO(r2, mRamp(k, .35, .39));
      mO(rule, mRamp(k, .66, .7));
      qChem(r3, `Net ΔG = ${f(-3.9 * c)} kcal/mol`); mO(r3, mRamp(k, .72, .76)); mO(box, mRamp(k, .95, 1));
      return l;
    },
  });
  return l.set(0);
}

/* ---------- enzymes and substrates ---------- */
function enzymeBlob(p, { x = 0, y = 0, s = 1, o = 1, R = 150, color = MC.enzyme, edge = MC.enzymeEdge, socket = false, label = '' } = {}) {
  const g = G(p, { x, y, s, o });
  const body = path(g, '', { fill: color, stroke: edge, 'stroke-width': 4 });
  mk('ellipse', { cx: -R * .5, cy: -R * .28, rx: R * .24, ry: R * .12, fill: '#fff', 'fill-opacity': .2, transform: 'rotate(-38)' }, g);
  const lab = label ? wLabel(g, label, { y: R * .45, size: Math.round(R * .2), fill: '#26360f', weight: 800, o: 1 }) : null;
  let fk = 0, bk = 0, tk = 0, geo = null;
  let e;
  function apply() {
    geo = qEnzGeo(R, fk, bk, socket); mD(body, geo.d);
    cAttr(body, 'fill', zMix(color, MC.off, tk)); cAttr(body, 'stroke', zMix(edge, '#4d5560', tk));
    return e;
  }
  e = Object.assign(g, {
    body, R, lab,
    fit(k) { fk = zK(k); return apply(); },
    bend(k) { bk = zK(k); return apply(); },
    tint(k) { tk = zK(k); return apply(); },
    siteLocal() { const gq = qEnzGeo(R, 0, 0, socket); return [0, gq.nb - R * .29]; },
    site() { return cOut(g, e.siteLocal()); },
    pt(nm) {
      const at = { site: e.siteLocal(), socket: [R * .9, R * .6], centre: [0, 0], label: [0, R * .45] }[nm] || [0, 0];
      return cOut(g, at);
    },
  });
  return apply();
}
// a substrate in two halves for an enzymeBlob of radius R (origin = its centre when bound)
function substrateShape(p, { x = 0, y = 0, s = 1, o = 1, R = 150, two = false } = {}) {
  const g = G(p, { x, y, s, o }), hw = R * .28, H = R * .58;
  const L = G(g), Rr = G(g);
  path(L, qRect(hw, H, 9), { fill: MC.sub, stroke: MC.subEdge, 'stroke-width': 3 });
  mk('ellipse', { cx: -hw * .18, cy: -H * .3, rx: hw * .2, ry: H * .07, fill: '#fff', 'fill-opacity': .3 }, L);
  const rb = path(Rr, qRect(hw, H * 1.22, 12, 0, -H * .11), { fill: MC.sub, stroke: MC.subEdge, 'stroke-width': 3 });
  mk('ellipse', { cx: -hw * .15, cy: -H * .5, rx: hw * .18, ry: H * .07, fill: '#fff', 'fill-opacity': .3 }, Rr);
  const gap0 = two ? R * .5 : 0;
  let ck = 0, sk = 0, jk = two ? 0 : 1, sb;
  function pos() {
    const gap = gap0 * (1 - jk), sp = sk * R * .9;
    cSet(L, { x: -hw / 2 - gap / 2 - sp, y: -sp * .35, r: -22 * sk });
    cSet(Rr, { x: hw / 2 + gap / 2 + sp, y: -sp * .55, r: 18 * sk });
    return sb;
  }
  function col() { cAttr(rb, 'fill', zMix(MC.sub, MC.prod2, ck)); cAttr(rb, 'stroke', zMix(MC.subEdge, MC.prod2Edge, ck)); return sb; }
  sb = Object.assign(g, {
    L, R: Rr, hw, H,
    convert(k) { ck = zK(k); return col(); },
    split(k) { sk = zK(k); return pos(); },
    join(k) { jk = zK(k); return pos(); },
    place(l, r) { cSet(L, { x: l[0], y: l[1], r: l[2] || 0 }); cSet(Rr, { x: r[0], y: r[1], r: r[2] || 0 }); return sb; },
    pose(nx, ny, nr) { cSet(g, nr === undefined ? { x: nx, y: ny } : { x: nx, y: ny, r: nr }); return sb; },
  });
  col(); return pos();
}
function qBadge(p, n, { r = 20, o = 1 } = {}) {
  const g = G(p, { o });
  mk('circle', { r, fill: '#2a7fd0', stroke: '#dbe9ff', 'stroke-width': 2 }, g);
  const t = wLabel(g, String(n), { y: r * .38, size: r * 1.1, fill: '#fff', weight: 800, o: 1 });
  return Object.assign(g, { t });
}
function catalyticCycle(p, { x = 0, y = 0, s = 1, o = 1, R = 150, labels = true } = {}) {
  const g = G(p, { x, y, s, o });
  // the cycle's track: a faint ring with an arrowhead, behind
  const tr = G(g, { o: .28 });
  const RT = R * 1.75;
  path(tr, `M${cF(RT * .85)} ${cF(-RT * .52)}A${RT} ${RT} 0 1 1 ${cF(-RT * .8)} ${cF(-RT * .6)}`, { stroke: COL.dim, 'stroke-width': 22 });
  path(tr, qArrowD(-RT * .92, -RT * .38, -RT * .72, -RT * .7, 46)[1], { fill: COL.dim, stroke: COL.dim, 'stroke-width': 2 });
  const enz = enzymeBlob(g, { R, label: 'enzyme' });
  const sub = substrateShape(g, { R });
  const glow = G(g, { o: 0 }); mk('circle', { r: R * .36, fill: '#fff6d8', 'fill-opacity': .35 }, glow);
  const [cx, cy] = enz.siteLocal(), hw = sub.hw;
  put(glow, { x: cx, y: cy });
  const capG = G(g, { x: -R * 1.6, y: R * 1.75 + 62 });
  const badge = qBadge(capG, 1, { r: 20 });
  const cap = wChem(capG, '', { x: 34, y: 10, size: 28, anchor: 'start', o: 1 });
  if (!labels) put(capG, { o: 0 });
  const STEPS = [[0, 'substrates enter the active site'], [.18, 'held by weak interactions: induced fit'], [.34, 'the active site lowers E_A'],
    [.48, 'substrates are converted to products'], [.62, 'products are released'], [.84, 'the active site is free again']];
  const Lb = [cx - hw / 2, cy], Rb = [cx + hw / 2, cy];
  const L0 = [-R * 2.3, -R * 1.5, -30], R0 = [-R * 1.45, -R * 2.2, 25];
  const L1 = [R * 1.45, -R * 1.55, -35], R1 = [R * 2.25, -R * 1.0, 30];
  let c;
  c = Object.assign(g, {
    enz, sub, glow,
    step(u) { u = qU(u); let i = 0; STEPS.forEach((q, j) => { if (u >= q[0]) i = j; }); return i + 1; },
    set(u) {
      u = qU(u);
      const a = io(mRamp(u, .02, .18)), b = io(mRamp(u, .62, .84));
      const lp = u < .62 ? [qL(L0[0], Lb[0], a), qL(L0[1], Lb[1], a), qL(L0[2], 0, a)] : [qL(Lb[0], L1[0], b), qL(Lb[1], L1[1], b), qL(0, L1[2], b)];
      const rp = u < .62 ? [qL(R0[0], Rb[0], a), qL(R0[1], Rb[1], a), qL(R0[2], 0, a)] : [qL(Rb[0], R1[0], b), qL(Rb[1], R1[1], b), qL(0, R1[2], b)];
      sub.place(lp, rp);
      sub.convert(mRamp(u, .44, .56));
      mO(sub, Math.min(mRamp(u, 0, .04), 1 - mRamp(u, .8, .9)));
      enz.fit(mRamp(u, .17, .3) * (1 - mRamp(u, .6, .7)));
      mO(glow, mBump(u, .34, .56));
      const st = c.step(u);
      qTxt(badge.t, String(st)); qChem(cap, STEPS[st - 1][1]);
      return c;
    },
    pt(nm) { return nm === 'site' ? enz.site() : cOut(g, [0, 0]); },
  });
  return c.set(0);
}
function sucrase(p, { x = 0, y = 0, s = 1, o = 1, R = 150, labels = true } = {}) {
  const g = G(p, { x, y, s, o });
  const enz = enzymeBlob(g, { R, label: 'sucrase' });
  const [cx, cy] = enz.siteLocal(), rh = R * .17, rp = R * .155;
  const glc = G(g), fru = G(g), bond = path(g, '', { stroke: MC.carbEdge, 'stroke-width': 5 });
  path(glc, zNgon(6, rh, 0, 0, 0), { fill: MC.carb, stroke: MC.carbEdge, 'stroke-width': 3 });
  path(fru, zNgon(5, rp, 0, 0, Math.PI), { fill: '#f6d98a', stroke: MC.carbEdge, 'stroke-width': 3 });
  const wat = waterMolecule(g, { s: .5, face: false }); put(wat, { o: 0 });
  const lab = (str) => wLabel(g, str, { size: 26, o: 0 });
  const lS = lab('sucrose'), lG = lab('glucose'), lF = lab('fructose');
  if (!labels) [lS, lG, lF].forEach(e => put(e, { s: 0 }));
  const by = cy + R * .29 - rh * .95, top0 = [cx, -R * 2.0], Gb = [cx - rh * 1.05, by], Fb = [cx + rp * 1.15, by];
  const G1 = [-R * 1.35, -R * 1.6], F1 = [R * 1.35, -R * 1.6];
  let c;
  c = Object.assign(g, {
    enz,
    set(k) {
      k = zK(k);
      const a = io(mRamp(k, 0, .3)), sp = io(mRamp(k, .58, 1));
      const base = qL2(top0, [cx, by], a);
      const gp = k < .58 ? [base[0] - rh * 1.05, base[1]] : qL2(Gb, G1, sp), fp = k < .58 ? [base[0] + rp * 1.15, base[1]] : qL2(Fb, F1, sp);
      cSet(glc, { x: gp[0], y: gp[1], r: -40 * sp }); cSet(fru, { x: fp[0], y: fp[1], r: 30 * sp });
      mD(bond, `M${cF(gp[0] + rh * .9)} ${cF(gp[1])}L${cF(fp[0] - rp * .75)} ${cF(fp[1])}`); mO(bond, 1 - mRamp(k, .5, .56));
      const wq = qL2([cx + R * .9, -R * 1.5], [cx + 6, cy - R * .32], io(mRamp(k, .3, .48)));
      cSet(wat, { x: wq[0], y: wq[1], o: mRamp(k, .3, .34) * (1 - mRamp(k, .5, .56)) });
      enz.fit(mRamp(k, .25, .4) * (1 - mRamp(k, .56, .68)));
      cSet(lS, { x: base[0], y: base[1] - R * .42, o: (1 - mRamp(k, .22, .28)) });
      cSet(lG, { x: gp[0], y: gp[1] - rh - 18, o: mRamp(k, .7, .8) });
      cSet(lF, { x: fp[0], y: fp[1] - rp - 18, o: mRamp(k, .7, .8) });
      return c;
    },
  });
  return c.set(0);
}
function inhibitorShape(p, { kind = 'competitive', x = 0, y = 0, s = 1, o = 1, R = 150 } = {}) {
  const g = G(p, { x, y, s, o });
  if (kind === 'competitive') {
    const w = R * .56, h = R * .6;
    path(g, `M${cF(-w / 2)} ${cF(h / 2 - 8)}V${cF(-h * .1)}Q${cF(-w / 2)} ${cF(-h * .72)} 0 ${cF(-h * .72)}Q${cF(w / 2)} ${cF(-h * .72)} ${cF(w / 2)} ${cF(-h * .1)}V${cF(h / 2 - 8)}Q${cF(w / 2)} ${cF(h / 2)} ${cF(w / 2 - 8)} ${cF(h / 2)}H${cF(-w / 2 + 8)}Q${cF(-w / 2)} ${cF(h / 2)} ${cF(-w / 2)} ${cF(h / 2 - 8)}Z`,
      { fill: MC.compInh, stroke: MC.compInhEdge, 'stroke-width': 3 });
    mk('ellipse', { cx: -w * .16, cy: -h * .4, rx: w * .14, ry: h * .07, fill: '#fff', 'fill-opacity': .35 }, g);
  } else {
    mk('ellipse', { rx: R * .2, ry: R * .13, fill: MC.nonInh, stroke: MC.nonInhEdge, 'stroke-width': 3, transform: 'rotate(-35)' }, g);
    mk('ellipse', { cx: -R * .07, cy: -R * .02, rx: R * .07, ry: R * .03, fill: '#fff', 'fill-opacity': .35, transform: 'rotate(-35)' }, g);
  }
  const i = Object.assign(g, { kind, pose(nx, ny, nr) { cSet(g, nr === undefined ? { x: nx, y: ny } : { x: nx, y: ny, r: nr }); return i; } });
  return i;
}
function enzymeInhibition(p, { kind = 'normal', x = 0, y = 0, s = 1, o = 1, R = 130, labels = true } = {}) {
  const g = G(p, { x, y, s, o });
  const enz = enzymeBlob(g, { R, socket: kind === 'noncompetitive' });
  const inh = kind === 'normal' ? null : inhibitorShape(g, { kind, R });
  const sub = substrateShape(g, { R });
  const [cx, cy] = enz.siteLocal();
  const away = path(g, '', { stroke: MC.compInh, 'stroke-width': 5 }, { o: 0 }), awayH = path(g, '', { fill: MC.compInh, stroke: MC.compInh, 'stroke-width': 2 }, { o: 0 });
  const lab = (str, col = COL.chalk) => wLabel(g, str, { size: 24, fill: col, anchor: 'start', o: 0 });
  const lS = lab('substrate'), lI = inh ? lab(kind === 'competitive' ? 'competitive inhibitor' : 'noncompetitive inhibitor', kind === 'competitive' ? MC.compInh : MC.nonInh) : null;
  const S0 = [cx, -R * 2.2];
  const SOCK = [R * .93, R * .62];
  let c;
  c = Object.assign(g, {
    enz, sub, inh,
    set(k) {
      k = zK(k);
      let sp, sr = 0;
      if (kind === 'normal') {
        sp = qL2(S0, [cx, cy], io(mRamp(k, 0, .6)));
        enz.fit(mRamp(k, .55, .75) * .9);
      } else if (kind === 'competitive') {
        const ip = qL2([-R * 1.9, -R * 1.6], [cx, cy - 6], io(mRamp(k, 0, .35)));
        inh.pose(ip[0], ip[1]);
        const down = io(mRamp(k, .35, .62)), off = io(mRamp(k, .62, 1));
        sp = k < .62 ? qL2(S0, [cx, -R * 1.5], down) : [cx + R * 1.3 * off, -R * 1.5 - R * .55 * Math.sin(off * Math.PI / 2)];
        sr = 25 * off;
        enz.fit(0);
        const ak = mRamp(k, .62, .7);
        mD(away, `M${cF(cx + R * .42)} ${cF(-R * 1.25)}Q${cF(cx + R * .95)} ${cF(-R * 1.15)} ${cF(cx + R * 1.18)} ${cF(-R * 1.62)}`);
        mD(awayH, qArrowD(cx + R * 1.05, -R * 1.38, cx + R * 1.2, -R * 1.68, 18)[1]);
        mO(away, ak); mO(awayH, ak);
      } else {
        const ip = qL2([R * 2.1, R * 1.5], SOCK, io(mRamp(k, 0, .35)));
        inh.pose(ip[0], ip[1]);
        enz.bend(mRamp(k, .3, .55));
        const down = io(mRamp(k, .5, .8));
        sp = qL2(S0, [cx, -R * 1.42], down);
        sp = [sp[0] + 7 * Math.sin(k * 60) * mRamp(k, .8, .85), sp[1]];
      }
      sub.pose(sp[0], sp[1], sr);
      cSet(lS, { x: sp[0] + R * .38, y: sp[1] - R * .45, o: labels ? 1 : 0 });
      if (lI) {
        const ip = [inh._st.x, inh._st.y];
        cSet(lI, kind === 'competitive' ? { x: ip[0] - R * .62, y: ip[1] - R * .35, o: labels ? mRamp(k, 0, .1) : 0 } : { x: ip[0] + R * .3, y: ip[1] + R * .5, o: labels ? mRamp(k, 0, .1) : 0 });
        cAttr(lI, 'text-anchor', 'end');
      }
      return c;
    },
    pt(nm) {
      if (nm === 'site') return enz.site();
      if (nm === 'socket') return cOut(g, SOCK);
      if (nm === 'substrate') return cOut(g, [sub._st.x, sub._st.y]);
      if (nm === 'inhibitor' && inh) return cOut(g, [inh._st.x, inh._st.y]);
      return cOut(g, [0, 0]);
    },
  });
  return c.set(0);
}
function cofactorIon(p, { x = 0, y = 0, s = 1, o = 1, ion = 'Zn²⁺', r = 24 } = {}) {
  const g = G(p, { x, y, s, o });
  mk('circle', { r, fill: MC.cofactor, stroke: MC.cofactorEdge, 'stroke-width': 3 }, g);
  mk('ellipse', { cx: -r * .35, cy: -r * .42, rx: r * .3, ry: r * .15, fill: '#fff', 'fill-opacity': .35 }, g);
  const fs = Math.min(r * .8, r * 1.7 / Math.max(1, uiW(ion, r * .8) / (r * .8)) * .8);
  wLabel(g, ion, { y: fs * .36, size: fs, fill: '#06201f', weight: 800, o: 1 });
  const c = Object.assign(g, { pose(nx, ny) { cSet(g, { x: nx, y: ny }); return c; } });
  return c;
}
function coenzymeRing(p, { x = 0, y = 0, s = 1, o = 1, r = 26, label = '' } = {}) {
  const g = G(p, { x, y, s, o });
  path(g, `M${cF(r * .86)} 0L${cF(r * 1.5)} ${cF(r * .5)}L${cF(r * 2.1)} ${cF(r * .1)}`, { stroke: MC.coenzymeEdge, 'stroke-width': 4 });
  path(g, zNgon(6, r, 0, 0, 0), { fill: MC.coenzyme, stroke: MC.coenzymeEdge, 'stroke-width': 3 });
  path(g, zNgon(6, r * .52, 0, 0, 0), { stroke: MC.coenzymeEdge, 'stroke-width': 2.5 });
  mk('circle', { cx: r * 2.1, cy: r * .1, r: r * .24, fill: MC.coenzyme, stroke: MC.coenzymeEdge, 'stroke-width': 2 }, g);
  if (label) wLabel(g, label, { y: r + 26, size: 22, fill: MC.coenzyme, o: 1 });
  const c = Object.assign(g, { pose(nx, ny) { cSet(g, { x: nx, y: ny }); return c; } });
  return c;
}

/* ---------- rateCurve ---------- */
function rateCurve(p, { x = 0, y = 0, s = 1, o = 1, w = 760, h = 400, kind = 'temp', curves, size = 24, labels = true } = {}) {
  const g = G(p, { x, y, s, o });
  const cfg = kind === 'temp' ? { min: 0, max: 120, step: 20, unit: ' °C', axis: 'Temperature (°C)' }
    : kind === 'pH' ? { min: 0, max: 10, step: 1, unit: '', axis: 'pH' } : { min: 0, max: 1, step: 0, unit: '', axis: 'Substrate concentration' };
  curves = curves || (kind === 'temp' ? [{ lo: 0, opt: 37, hi: 50, color: COL.chalk, label: 'typical human enzyme' }, { lo: 40, opt: 77, hi: 90, color: MC.exo, label: 'thermophilic bacteria' }]
    : kind === 'pH' ? [{ lo: .15, opt: 2, hi: 3.7, color: COL.chalk, label: 'pepsin (stomach)' }, { lo: 5.7, opt: 8, hi: 9.9, color: MC.pathB, label: 'trypsin (intestine)' }]
      : [{ km: .16, color: MC.enzyme, label: 'enzyme saturated' }]);
  const X = v => w * (v - cfg.min) / (cfg.max - cfg.min), Y = r => -h * .82 * r;
  const rate = (i, v) => {
    const c = curves[i];
    if (kind === 'substrate') return Math.max(0, v) * (1 + c.km) / (c.km + Math.max(0, v)) * .96;
    if (v <= c.lo || v >= c.hi) return 0;
    if (v <= c.opt) return Math.sin(Math.PI / 2 * (v - c.lo) / (c.opt - c.lo)) ** 2;
    const f = Math.cos(Math.PI / 2 * (v - c.opt) / (c.hi - c.opt));
    return kind === 'temp' ? Math.pow(f, 1.2) : f * f;
  };
  // grid, axes, ticks
  let gr = '';
  if (cfg.step) for (let v = cfg.min + cfg.step; v <= cfg.max + 1e-9; v += cfg.step) gr += `M${cF(X(v))} 0V${cF(-h)}`;
  for (let r = .25; r < 1.2; r += .25) gr += `M0 ${cF(Y(r))}H${w}`;
  path(g, gr, { stroke: COL.faint, 'stroke-width': 1.5, 'stroke-opacity': .6 });
  mArrow(g, [0, 0], [0, -h - 12], { color: COL.chalk, w: 4, head: 16 });
  path(g, `M0 0H${w + 10}`, { stroke: COL.chalk, 'stroke-width': 4 });
  if (cfg.step) for (let v = cfg.min; v <= cfg.max + 1e-9; v += cfg.step) wLabel(g, String(v), { x: X(v), y: size * 1.3, size, fill: COL.dim, o: 1 });
  wLabel(g, cfg.axis, { x: w / 2, y: size * (cfg.step ? 2.7 : 1.4), size: size * 1.1, fill: COL.chalk, o: 1 });
  const yl = G(g, { x: -22, y: -h / 2, r: -90 }); wLabel(yl, 'Rate of reaction', { size: size * 1.1, o: 1 });
  // curves
  const cur = curves.map((c, i) => {
    let d = ''; const n = 160;
    for (let j = 0; j <= n; j++) { const v = cfg.min + (cfg.max - cfg.min) * j / n; d += (j ? 'L' : 'M') + cF(X(v)) + ' ' + cF(Y(rate(i, v))); }
    if (kind !== 'substrate') {   // trim the flat zero runs so the line starts and ends at the curve
      d = ''; const a = Math.max(cfg.min, c.lo), b = Math.min(cfg.max, c.hi);
      for (let j = 0; j <= n; j++) { const v = a + (b - a) * j / n; d += (j ? 'L' : 'M') + cF(X(v)) + ' ' + cF(Y(rate(i, v))); }
    }
    return path(g, d, { stroke: c.color, 'stroke-width': 6 }, { d: 0 });
  });
  const peak = i => kind === 'substrate' ? [X(cfg.max), Y(rate(i, cfg.max))] : [X(curves[i].opt), Y(1)];
  const labs = curves.map((c, i) => {
    const [px, py] = peak(i), tw = uiW(c.label, size);
    const cx = Math.max(tw / 2, Math.min(w - tw / 2, kind === 'substrate' ? w - tw / 2 : px));
    return wLabel(g, c.label, { x: cx, y: kind === 'substrate' ? py - 22 : py - 30 - (i % 2) * size * 1.4, size, fill: c.color, o: 0 });
  });
  const opts = curves.map((c, i) => {
    const og = G(g, { o: 0 });
    if (kind === 'substrate') return og;
    path(og, `M${cF(X(c.opt))} ${cF(Y(1) + 8)}V-6`, { stroke: c.color, 'stroke-width': 3, 'stroke-dasharray': '8 7' });
    const vs = (Math.round(c.opt * 10) / 10) + cfg.unit, vw = uiW(vs, size) * 1.15 + 20;
    mk('rect', { x: X(c.opt) - vw / 2, y: Y(.3) - size * .75, width: vw, height: size * 1.5, rx: size * .75, fill: '#0b1626', stroke: c.color, 'stroke-width': 2 }, og);
    wLabel(og, vs, { x: X(c.opt), y: Y(.3) + size * .36, size, fill: c.color, weight: 800, o: 1 });
    return og;
  });
  const mk1 = G(g, { o: 0 }), mDrop = path(mk1, '', { stroke: COL.dim, 'stroke-width': 3, 'stroke-dasharray': '7 6' });
  const mBall = G(mk1); mk('circle', { r: 13, fill: MC.sub, stroke: MC.subEdge, 'stroke-width': 3 }, mBall);
  const mRead = wLabel(mk1, '', { size: size * 1.05, weight: 800, anchor: 'start', o: 1 });
  let rc;
  rc = Object.assign(g, {
    X, Y, curves,
    rate(i, v) { return rate(i, v); },
    draw(k) { k = zK(k); cur.forEach((c, i) => cSet(c, { d: mRamp(k, i / cur.length, (i + 1) / cur.length) })); return rc; },
    labels(k) { k = zK(k); labs.forEach(l => mO(l, k)); return rc; },
    opt(i, k) { mO(opts[i], zK(k)); return rc; },
    marker(i, v) {
      const hid = v == null || i == null;
      if (hid) { i = 0; v = cfg.min; }
      v = Math.round(v * 100) / 100;
      const r = rate(i, v), px = X(v), py = Y(r);
      cSet(mBall, { x: px, y: py }); mD(mDrop, `M${cF(px)} ${cF(py + 14)}V0`);
      const str = kind === 'substrate' ? '' : (kind === 'pH' ? 'pH ' + v.toFixed(1) : Math.round(v) + ' °C');
      qTxt(mRead, hid ? '' : str); cSet(mRead, { x: px + 20, y: py + 30 }); cAttr(mRead, 'fill', curves[i].color);
      mO(mk1, hid ? 0 : 1); return rc;
    },
    pt(i, v) { return cOut(g, [X(v), Y(rate(i, v))]); },
  });
  if (labels) rc.labels(1);
  return rc.draw(0);
}

/* ---------- allostericEnzyme ---------- */
function allostericEnzyme(p, { x = 0, y = 0, s = 1, o = 1, R = 70 } = {}) {
  const g = G(p, { x, y, s, o }), d0 = R * 1.0;
  const TH = [225, 315, 45, 135];       // subunit directions (SVG degrees): top-left, top-right, bottom-right, bottom-left
  const subs = TH.map(() => { const sg = G(g); const body = path(sg, '', { fill: MC.enzyme, stroke: MC.enzymeEdge, 'stroke-width': 3.5 }); mk('ellipse', { cx: -R * .45, cy: R * .1, rx: R * .2, ry: R * .1, fill: '#fff', 'fill-opacity': .2 }, sg); return Object.assign(sg, { body }); });
  const sock = G(g);
  path(sock, zNgon(4, R * .27, 0, 0, 0), { fill: '#0f1e33', stroke: MC.enzymeEdge, 'stroke-width': 3 });
  const drop = (col, edge) => { const dg = G(g, { o: 0 }); path(dg, `M0 ${cF(-R * .3)}Q${cF(R * .28)} ${cF(-R * .02)} ${cF(R * .2)} ${cF(R * .14)}Q0 ${cF(R * .32)} ${cF(-R * .2)} ${cF(R * .14)}Q${cF(-R * .28)} ${cF(-R * .02)} 0 ${cF(-R * .3)}Z`, { fill: col, stroke: edge, 'stroke-width': 3 }); mk('ellipse', { cx: -R * .07, cy: -R * .04, rx: R * .05, ry: R * .09, fill: '#fff', 'fill-opacity': .35 }, dg); return dg; };
  const act = drop(MC.activator, MC.activatorEdge), inh = drop(MC.alloInh, MC.alloInhEdge);
  const sp = TH.map(() => { const q = G(g, { o: 0 }); path(q, qRect(R * .5, R * .5, 8), { fill: MC.sub, stroke: MC.subEdge, 'stroke-width': 2.5 }); return q; });
  let ae;
  const pose = (i, f) => {
    const th = TH[i], tw = (1 - f) * (i % 2 ? 16 : -16), dd = d0 * (1 - .06 * (1 - f));
    const a = th * Math.PI / 180;
    return { x: dd * Math.cos(a), y: dd * Math.sin(a), r: th + 90 + tw, s: .84 * (1 - .06 * (1 - f)) };
  };
  const siteOf = (i, f) => { const q = pose(i, f), ly = qEnzGeo(R, 1 - f, .75 * (1 - f)).nb - R * .26, a = q.r * Math.PI / 180; return [q.x - q.s * ly * Math.sin(a), q.y + q.s * ly * Math.cos(a), q.r]; };
  let F = 1;
  ae = Object.assign(g, {
    set({ form = 1, osc = 0, t = 0, act: ak = 0, inh: ik = 0, sub = [0, 0, 0, 0] } = {}) {
      t = zT(t); ak = zK(ak); ik = zK(ik);
      const base = qL(mClamp(form), .5 + .5 * Math.sin(t * 1.4), zK(osc));
      const ab = mRamp(ak, .7, 1), ib = mRamp(ik, .7, 1);
      const f = Math.round(qL(qL(base, 1, ab), 0, ib) * 1000) / 1000; F = f;
      subs.forEach((sg, i) => {
        cSet(sg, pose(i, f));
        mD(sg.body, qEnzGeo(R, 1 - f, .75 * (1 - f)).d);
        cAttr(sg.body, 'fill', zMix(i % 2 ? '#bcd685' : MC.enzyme, '#8e9a78', 1 - f));
      });
      const ap = qL2([-R * 3.2, -R * .4], [0, 0], io(mRamp(ak, 0, .8))), ip = qL2([R * 3.2, R * .4], [0, 0], io(mRamp(ik, 0, .8)));
      cSet(act, { x: ap[0], y: ap[1], o: mRamp(ak, 0, .08) }); cSet(inh, { x: ip[0], y: ip[1], o: mRamp(ik, 0, .08) });
      sp.forEach((q, i) => {
        const k = zK(sub[i] || 0), [sx, sy, sr] = siteOf(i, f), a = TH[i] * Math.PI / 180, far = R * 1.6 * (1 - io(k));
        cSet(q, { x: sx + Math.cos(a) * far, y: sy + Math.sin(a) * far, r: sr, o: k > 0 ? mRamp(k, 0, .15) : 0 });
      });
      return ae;
    },
    coop(k) {
      k = zK(k);
      const rest = j => mRamp(k, .65 + j * .08, .83 + j * .08);
      return ae.set({ form: mRamp(k, .3, .65), sub: [mRamp(k, 0, .35), rest(0), rest(1), rest(2)] });
    },
    pt(nm) {
      if (nm === 'socket' || nm === 'centre') return cOut(g, [0, 0]);
      const m = String(nm).match(/^site(\d)$/); if (m) { const [sx, sy] = siteOf(+m[1], F); return cOut(g, [sx, sy]); }
      return cOut(g, [0, 0]);
    },
  });
  return ae.set({});
}

/* ---------- entropyDots ---------- */
function entropyDots(p, { x = 0, y = 0, s = 1, o = 1, w = 420, h = 300, n = 36, box = true, seed = 3 } = {}) {
  const g = G(p, { x, y, s, o });
  if (box) mk('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 16, fill: 'none', stroke: COL.dim, 'stroke-width': 3 }, g);
  const cols = Math.ceil(Math.sqrt(n * w / h)), rows = Math.ceil(n / cols);
  const dots = [], grid = [], rnd = [];
  for (let i = 0; i < n; i++) {
    dots.push(mk('circle', { r: 9, fill: MC.order }, g));
    grid.push([-w / 2 + (i % cols + .5) * w / cols, -h / 2 + (Math.floor(i / cols) + .5) * h / rows]);
    rnd.push([(wHash(i, seed) - .5) * (w - 40), (wHash(i, seed + 5) - .5) * (h - 40)]);
  }
  dots.forEach(d => put(d, {}));
  let e;
  e = Object.assign(g, {
    set(dis, t = 0) {
      dis = zK(dis); t = zT(t);
      const c = zMix(MC.order, MC.disorder, dis);
      dots.forEach((d, i) => {
        const jx = zWob(i, t * 2.2, 1) * 16 * dis, jy = zWob(i, t * 2.2, 7) * 16 * dis;
        cSet(d, { x: qL(grid[i][0], rnd[i][0] + jx, dis), y: qL(grid[i][1], rnd[i][1] + jy, dis) });
        cAttr(d, 'fill', c);
      });
      return e;
    },
  });
  return e.set(0, 0);
}

/* ---------- ballSlope ---------- */
function ballSlope(p, { x = 0, y = 0, s = 1, o = 1, w = 760, h = 340, r = 28, bars = true } = {}) {
  const g = G(p, { x, y, s, o });
  const L0 = -w / 2, E = [L0 + 200, -h], C1 = [L0 + 330, -h], C2 = [w / 2 - 330, 0], B = [w / 2 - 160, 0];
  let hill = `M${cF(L0)} 0V${cF(-h)}H${cF(E[0])}C${cP(C1)} ${cP(C2)} ${cP(B)}Z`;
  path(g, hill, { fill: '#24463a', stroke: '#5f8f6a', 'stroke-width': 4 });
  path(g, `M${cF(L0 - 20)} 0H${cF(w / 2 + 20)}`, { stroke: '#5f8f6a', 'stroke-width': 4 });
  // arc-length table along the slope
  const tab = [[0, E, [1, 0]]]; let acc = 0, prev = E;
  for (let i = 1; i <= 80; i++) { const [pt, tg] = qBez(E, C1, C2, B, i / 80); acc += Math.hypot(pt[0] - prev[0], pt[1] - prev[1]); tab.push([acc, pt, tg]); prev = pt; }
  const SL = acc, LED = 110, GR = w / 2 - 50 - B[0];
  const slopeAt = dd => { for (let i = 1; i < tab.length; i++) if (tab[i][0] >= dd) { const f = (dd - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0] || 1); return [qL2(tab[i - 1][1], tab[i][1], f), tab[i][2]]; } return [B, [1, 0]]; };
  const ball = G(g);
  mk('circle', { r, fill: MC.exo, stroke: '#a85f12', 'stroke-width': 3 }, ball);
  path(ball, `M${-r + 3} 0H${r - 3}`, { stroke: '#a85f12', 'stroke-width': 5 });
  const shine = mk('circle', { cx: -r * .35, cy: -r * .38, r: r * .22, fill: '#fff', 'fill-opacity': .4 }, g);
  let bg = null;
  if (bars) {
    bg = G(g, { x: w / 2 - 120, y: -h * .38 });
    const mkBar = (dx, col, lab) => { mk('rect', { x: dx - 18, y: -h * .58, width: 36, height: h * .58, fill: 'none', stroke: COL.faint, 'stroke-width': 2 }, bg); const b = mk('rect', { x: dx - 15, width: 30, fill: col }, bg); wLabel(bg, lab, { x: dx, y: 26, size: 20, fill: col, o: 1 }); return b; };
    bg.pe = mkBar(-40, MC.endo, 'potential'); bg.ke = mkBar(40, MC.exo, 'kinetic');
  }
  let e;
  e = Object.assign(g, {
    ball,
    set(k) {
      k = zK(k);
      let c, dist;
      const a = io(mRamp(k, .08, .2)), sl = mRamp(k, .2, .85) ** 2, gd = 1 - (1 - mRamp(k, .85, 1)) ** 2;
      if (k < .2) { c = [L0 + 90 + LED * a, -h - r]; dist = LED * a; }
      else if (k < .85) { const [pt, tg] = slopeAt(SL * sl), L = Math.hypot(tg[0], tg[1]) || 1; c = [pt[0] + tg[1] / L * r, pt[1] - tg[0] / L * r]; dist = LED + SL * sl; }
      else { c = [B[0] + GR * gd, -r]; dist = LED + SL + GR * gd; }
      cSet(ball, { x: c[0], y: c[1], r: dist / r * 180 / Math.PI });
      cSet(shine, { x: c[0], y: c[1] });
      if (bg) {
        const pe = mClamp((-(c[1] + r)) / h), hh = h * .58;
        cAttr(bg.pe, 'y', cF(-hh * pe)); cAttr(bg.pe, 'height', cF(hh * pe));
        const ke = k < .08 ? 0 : 1 - pe;
        cAttr(bg.ke, 'y', cF(-hh * ke)); cAttr(bg.ke, 'height', cF(hh * ke));
      }
      return e;
    },
    pt(nm) { return cOut(g, { ball: [ball._st.x, ball._st.y], ledge: [L0 + 100, -h], bottom: B }[nm] || [0, 0]); },
  });
  return e.set(0);
}

/* ---------- hydroDam ---------- */
function hydroDam(p, { kind = 'isolated', x = 0, y = 0, s = 1, o = 1, chips = true } = {}) {
  const g = G(p, { x, y, s, o }), WATER = '#3a8fd0', GLASS = '#a9c2df';
  const tanks = kind === 'multi'
    ? [0, 1, 2, 3].map(i => ({ x0: -470 + i * 250, x1: -320 + i * 250, yb: i * 70, yt: i * 70 - 200 }))
    : [{ x0: -300, x1: -140, yb: 0, yt: -240 }, { x0: 140, x1: 300, yb: 60, yt: -180 }];
  const waterL = G(g), glassL = G(g), turbL = G(g), top = G(g);
  // tap and outlet
  let stream = null, outlet = null;
  if (kind !== 'isolated') {
    const t0 = tanks[0], tx = (t0.x0 + t0.x1) / 2;
    path(top, `M${tx - 70} ${t0.yt - 96}H${tx}V${t0.yt - 70}`, { stroke: '#8fa3bd', 'stroke-width': 14 });
    mk('rect', { x: tx - 22, y: t0.yt - 116, width: 30, height: 10, rx: 4, fill: '#8fa3bd' }, top);
    stream = path(waterL, `M${tx} ${t0.yt - 66}V${t0.yb - 120}`, { stroke: WATER, 'stroke-width': 10, 'stroke-dasharray': '18 10' });
    const tl = tanks[tanks.length - 1];
    path(glassL, `M${tl.x1} ${tl.yb - 20}H${tl.x1 + 40}Q${tl.x1 + 70} ${tl.yb - 20} ${tl.x1 + 70} ${tl.yb + 10}V${tl.yb + 90}`, { stroke: GLASS, 'stroke-width': 26 });
    outlet = path(waterL, `M${tl.x1} ${tl.yb - 20}H${tl.x1 + 40}Q${tl.x1 + 70} ${tl.yb - 20} ${tl.x1 + 70} ${tl.yb + 10}V${tl.yb + 120}`, { stroke: WATER, 'stroke-width': 14, 'stroke-dasharray': '18 10' });
  }
  const water = tanks.map(t => { mk('rect', { x: t.x0, y: t.yt, width: t.x1 - t.x0, height: t.yb - t.yt, fill: '#16304f' }, waterL); return mk('rect', { x: t.x0, width: t.x1 - t.x0, fill: WATER }, waterL); });
  tanks.forEach(t => path(glassL, `M${t.x0} ${t.yt}V${t.yb}H${t.x1}V${t.yt}`, { stroke: GLASS, 'stroke-width': 6 }));
  const turbs = [];
  for (let i = 0; i < tanks.length - 1; i++) {
    const a = tanks[i], b = tanks[i + 1], P1 = [a.x1, a.yb - 30], P2 = [b.x0, b.yt + 70];
    const mx = (P1[0] + P2[0]) / 2, my = (P1[1] + P2[1]) / 2;
    path(glassL, `M${cP(P1)}L${cP(P2)}`, { stroke: '#2c4568', 'stroke-width': 34 });
    const flow = path(waterL, `M${cP(P1)}L${cP(P2)}`, { stroke: WATER, 'stroke-width': 18, 'stroke-dasharray': '22 10' });
    const hg = G(turbL, { x: mx, y: my });
    mk('rect', { x: -52, y: -60, width: 104, height: 104, rx: 18, fill: '#22395a', stroke: GLASS, 'stroke-width': 4 }, hg);
    const wheel = G(hg); let bl = '';
    for (let j = 0; j < 8; j++) { const an = j * Math.PI / 4; bl += `M${cF(Math.cos(an) * 10)} ${cF(Math.sin(an) * 10)}Q${cF(Math.cos(an + .5) * 30)} ${cF(Math.sin(an + .5) * 30)} ${cF(Math.cos(an + .3) * 40)} ${cF(Math.sin(an + .3) * 40)}`; }
    path(wheel, bl, { stroke: '#cfe0f2', 'stroke-width': 6 });
    mk('circle', { r: 11, fill: '#8fa3bd', stroke: '#22395a', 'stroke-width': 3 }, wheel);
    const bulb = G(hg, { y: -96 });
    const halo = G(bulb, { o: 0 });
    [60, 40, 26].forEach((rr, j) => mk('circle', { r: rr, fill: '#ffe27a', 'fill-opacity': [.12, .2, .35][j] }, halo));
    const glass = mk('circle', { r: 18, fill: '#59647a', stroke: '#cfd3d8', 'stroke-width': 3 }, bulb);
    mk('rect', { x: -12, y: 16, width: 24, height: 20, rx: 4, fill: '#8fa3bd' }, bulb);
    let chip = null, chipT = null;
    if (chips) {
      chip = G(hg, { x: 76, y: -104 });
      mk('rect', { x: 0, y: -24, width: 120, height: 46, rx: 8, fill: '#f6ef9a', stroke: '#14233a', 'stroke-width': 2 }, chip);
      chipT = wChem(chip, 'ΔG < 0', { x: 60, y: 10, size: 28, fill: '#14233a', weight: 800, o: 1 });
    }
    turbs.push({ wheel, halo, glass, flow, chipT, mx, my });
  }
  let e;
  e = Object.assign(g, {
    set(k = 0, t = 0) {
      k = zK(k); t = zT(t);
      let surf, phi, fl, glow, off;
      if (kind === 'isolated') {
        surf = [qL(-200, -80, k), qL(40, -80, k)]; phi = 900 * (k - k * k / 2); fl = 1 - k; glow = 1 - mRamp(k, .6, 1); off = -phi * .35;
      } else { surf = tanks.map(tk => tk.yb - (kind === 'multi' ? 110 : (tk === tanks[0] ? 170 : 40))); phi = t * 240; fl = 1; glow = 1; off = -t * 140; }
      water.forEach((wr, i) => { cAttr(wr, 'y', cF(surf[i])); cAttr(wr, 'height', cF(Math.max(0, tanks[i].yb - surf[i]))); });
      turbs.forEach(tb => {
        cSet(tb.wheel, { r: phi }); mO(tb.flow, fl); cAttr(tb.flow, 'stroke-dashoffset', cF(off));
        mO(tb.halo, glow); cAttr(tb.glass, 'fill', zMix('#59647a', '#fff3b0', glow));
        if (tb.chipT) qChem(tb.chipT, kind === 'isolated' && k >= .98 ? 'ΔG = 0' : 'ΔG < 0');
      });
      if (stream) cAttr(stream, 'stroke-dashoffset', cF(off));
      if (outlet) cAttr(outlet, 'stroke-dashoffset', cF(off));
      return e;
    },
    pt(nm) {
      const m = String(nm).match(/^(bulb|tank)(\d)$/);
      if (m && m[1] === 'bulb') { const tb = turbs[+m[2]]; return cOut(g, tb ? [tb.mx, tb.my - 96] : [0, 0]); }
      if (m) { const tk = tanks[+m[2]]; return cOut(g, tk ? [(tk.x0 + tk.x1) / 2, (tk.yt + tk.yb) / 2] : [0, 0]); }
      if (nm === 'tap') return cOut(g, [(tanks[0].x0 + tanks[0].x1) / 2, tanks[0].yt - 90]);
      if (nm === 'outlet') { const tl = tanks[tanks.length - 1]; return cOut(g, [tl.x1 + 70, tl.yb + 90]); }
      return cOut(g, [0, 0]);
    },
  });
  return e.set(0, 0);
}

/* ---------- firefly ---------- */
function firefly(p, { x = 800, y = 450, s = 1, o = 1, w = 1600, h = 900, scene = true, bx = 0, by = 0 } = {}) {
  const g = G(p, { x, y, s, o });
  const stars = [], far = [];
  if (scene) {
    mk('rect', { x: -w / 2, y: -h / 2, width: w, height: h, fill: '#0a1428' }, g);
    mk('rect', { x: -w / 2, y: -h / 2, width: w, height: h * .45, fill: '#0c1a33' }, g);
    mk('circle', { cx: w * .32, cy: -h * .28, r: 56, fill: '#f2efe6', 'fill-opacity': .92 }, g);
    mk('circle', { cx: w * .32 + 22, cy: -h * .28 - 12, r: 50, fill: '#0c1a33' }, g);
    for (let i = 0; i < 46; i++) stars.push(mk('circle', { cx: cF((wHash(i, 31) - .5) * w), cy: cF(-h / 2 + wHash(i, 37) * h * .5), r: 1.5 + 1.8 * wHash(i, 41), fill: '#f2efe6' }, g));
    // hills and grass
    path(g, `M${-w / 2} ${h * .22}Q${-w * .25} ${h * .08} 0 ${h * .2}T${w / 2} ${h * .16}V${h / 2}H${-w / 2}Z`, { fill: '#0f2a22' });
    let gr = '';
    for (let i = 0; i < 120; i++) { const gx = -w / 2 + i * w / 120 + wHash(i, 5) * 8, gh = 40 + wHash(i, 9) * 90, lean = (wHash(i, 13) - .5) * 40; gr += `M${cF(gx - 5)} ${h / 2}Q${cF(gx + lean * .4)} ${cF(h / 2 - gh * .6)} ${cF(gx + lean)} ${cF(h / 2 - gh)}Q${cF(gx + lean * .3 + 4)} ${cF(h / 2 - gh * .5)} ${cF(gx + 6)} ${h / 2}Z`; }
    path(g, gr, { fill: '#173b2c' });
    for (let i = 0; i < 9; i++) {
      const fg = G(g, { x: (wHash(i, 51) - .5) * w * .9, y: -h * .05 + wHash(i, 57) * h * .35 });
      mk('circle', { r: 14, fill: MC.glow, 'fill-opacity': .18 }, fg); mk('circle', { r: 4.5, fill: MC.glow }, fg);
      far.push(fg);
    }
  }
  const bug = G(g, { x: bx, y: by });
  const halo = G(bug, { x: -70, y: 6 });
  const halos = [150, 100, 64].map((rr, j) => mk('circle', { r: rr, fill: MC.glow, 'fill-opacity': [.08, .14, .24][j] }, halo));
  const wingB = G(bug, { x: 6, y: -20 }), wingF = G(bug, { x: 14, y: -22 });
  mk('ellipse', { cx: -46, cy: 0, rx: 60, ry: 18, fill: '#d7e2ee', 'fill-opacity': .35, stroke: '#d7e2ee', 'stroke-opacity': .6, 'stroke-width': 2 }, wingB);
  path(bug, 'M-20 22l-14 30M6 24l-4 32M30 22l10 30', { stroke: '#2a201b', 'stroke-width': 5 });
  const abd = path(bug, 'M-20 -18Q-110 -24 -126 6Q-112 36 -20 26Z', { fill: '#6b7343', stroke: '#2a201b', 'stroke-width': 3 });
  const lamp = path(bug, 'M-70 -16Q-118 -16 -126 6Q-116 30 -70 26Z', { fill: MC.glow });
  path(bug, 'M-40 -18V26M-56 -18V26', { stroke: '#2a201b', 'stroke-width': 2.5, 'stroke-opacity': .5 });
  mk('ellipse', { cx: 10, cy: 2, rx: 34, ry: 24, fill: '#3a2a22', stroke: '#1a120e', 'stroke-width': 3 }, bug);
  path(bug, 'M28 -18Q66 -22 70 4Q62 22 30 20Z', { fill: '#e0704a', stroke: '#8c3a1f', 'stroke-width': 3 });
  mk('circle', { cx: 74, cy: 8, r: 14, fill: '#1a120e' }, bug);
  mk('circle', { cx: 79, cy: 4, r: 4, fill: '#f2efe6' }, bug);
  path(bug, 'M80 -2Q100 -30 118 -36M76 -4Q86 -36 98 -48', { stroke: '#2a201b', 'stroke-width': 3 });
  mk('ellipse', { cx: -30, cy: 0, rx: 66, ry: 20, fill: '#e9eef5', 'fill-opacity': .3, stroke: '#e9eef5', 'stroke-opacity': .55, 'stroke-width': 2 }, wingF);
  const glowK = t => { const u = cFrac(t / 2.4); return Math.max(mBump(u, 0, .42), .08); };
  let f;
  f = Object.assign(g, {
    bug,
    glowK(t) { return glowK(zT(t)); },
    set(t) {
      t = zT(t); const gk = Math.round(glowK(t) * 100) / 100;
      cSet(bug, { x: bx + 40 * Math.sin(t * .5), y: by + 18 * Math.sin(t * 1.1) });
      cSet(wingB, { r: -14 + 12 * Math.sin(t * 38) }); cSet(wingF, { r: -24 + 14 * Math.sin(t * 38 + 1) });
      halos.forEach((hh, j) => mO(hh, gk)); cSet(halo, { s: .85 + .2 * gk });
      cAttr(lamp, 'fill', zMix('#7d8a4a', MC.glow, gk));
      stars.forEach((st0, i) => mO(st0, .35 + .65 * Math.abs(Math.sin(t * (.6 + wHash(i, 3)) + i))));
      far.forEach((fg, i) => mO(fg, mBump(cFrac(t / (2.5 + wHash(i, 7) * 2) + wHash(i, 11)), 0, .35)));
      return f;
    },
    pt(nm) { return cOut(g, nm === 'glow' ? [bug._st.x - 80, bug._st.y + 6] : [bug._st.x, bug._st.y]); },
  });
  return f.set(0);
}

/* ---------- campfire ---------- */
function campfire(p, { x = 0, y = 0, s = 1, o = 1, w = 220 } = {}) {
  const g = G(p, { x, y, s, o }), sc = w / 220;
  const heat = G(g), fl = G(g), logs = G(g), spark = G(g);
  [-18, 18].forEach(a => { const lg = G(logs, { y: -14 * sc, r: a }); mk('rect', { x: -110 * sc, y: -14 * sc, width: 220 * sc, height: 28 * sc, rx: 14 * sc, fill: '#7a5a3e', stroke: '#4a3524', 'stroke-width': 3 }, lg); mk('circle', { cx: 100 * sc, r: 10 * sc, fill: '#c9a27a' }, lg); });
  const flames = [[MC.exo, 80, 190], ['#f3c95c', 54, 140], ['#fff1c2', 30, 84]].map(([c, fw, fh]) => Object.assign(path(fl, '', { fill: c }), { fw: fw * sc, fh: fh * sc }));
  const waves = [0, 1, 2].map(() => path(heat, '', { stroke: MC.exo, 'stroke-width': 4, 'stroke-opacity': .55 }));
  const sparks = [0, 1, 2, 3, 4, 5].map(() => mk('circle', { r: 3.5 * sc, fill: '#ffd27a' }, spark));
  let c;
  c = Object.assign(g, {
    set(t) {
      t = zT(t);
      flames.forEach((f, i) => {
        const sw = (Math.sin(t * 5 + i * 1.7) * 14 + Math.sin(t * 8.3 + i) * 6) * sc, hh = f.fh * (1 + .08 * Math.sin(t * 6.1 + i * 2)), bw = f.fw;
        mD(f, `M${cF(-bw)} ${cF(-20 * sc)}Q${cF(-bw * 1.05)} ${cF(-20 * sc - hh * .55)} ${cF(sw)} ${cF(-20 * sc - hh)}Q${cF(bw * 1.05)} ${cF(-20 * sc - hh * .55)} ${cF(bw)} ${cF(-20 * sc)}Q0 ${cF(-4 * sc)} ${cF(-bw)} ${cF(-20 * sc)}Z`);
      });
      waves.forEach((wv, i) => {
        const u = cFrac(t * .35 + i / 3), y0 = -230 * sc - u * 180 * sc, xo = (i - 1) * 60 * sc; let d = '';
        for (let j = 0; j <= 12; j++) { const yy = y0 + 60 * sc - j * 10 * sc; d += (j ? 'L' : 'M') + cF(xo + 10 * sc * Math.sin(j * .9 + t * 4)) + ' ' + cF(yy); }
        mD(wv, d); mO(wv, Math.sin(Math.PI * u));
      });
      sparks.forEach((sp, i) => { const u = cFrac(t * .45 + i / 6); cSet(sp, { x: (wHash(i, 2) - .5) * 120 * sc + 18 * sc * Math.sin(t * 3 + i), y: -60 * sc - u * 300 * sc, o: 1 - u }); });
      return c;
    },
    pt(nm) { return cOut(g, nm === 'top' ? [0, -240 * sc] : [0, -90 * sc]); },
  });
  return c.set(0);
}
