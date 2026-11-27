'use strict';
// A Tour of the Cell (chapter 6, lessons 1–5): the book's kit of cells and organelles, loaded after engine.js, water.js
// and macro.js (it reuses ribosome, enzyme, mArrow, waterMolecule, wAtom, wChem, wLabel and macro's mRamp/mPose/mO/mD).
// Every piece is drawn around its own origin with a scale s and opacity o, and placed with put. Each animated piece has
// set-style methods that pose everything from their arguments alone (call them from prog(k => …) or clockRun(t => …)),
// so replay and seek draw the same frame. Attributes are written only when they change; no filters, blurs or clips.
//
// Exports (all lengths at s = 1; "parent" = the coordinates of the group you passed as p; k runs 0..1; t is seconds):
//   CC                                   chapter 6 colours (membrane cyto env nucleo dna nucleolus ribo er erLumen golgi
//                                        vesicle cargo cargoMod tag lipid lyso enzyme food vac mito cristae matrix ims atp
//                                        chloro grana stroma light perox core mt actin ifil wall wall2 lamella capsule …)
//   cSet(e, {x, y, s, r, o, d})          put only the keys that changed (rounded); cAlong(pts, k) a point k along a polyline
//   cLabel(p, [ax, ay], [tx, ty], str, {size=28, color, line, o=0})  text at (tx, ty) with a leader to (ax, ay); text sits
//       left or right of the leader's end by which side it is on. Returns the group (o 0: show it).
//   scaleBar(p, {x, y, len=200, text='1 µm', size=26, color, o}) origin = left end; .set(len, text)
//   sizeLadder(p, {x, y, pxPerUm=10, items, gap=60, size=24, o}) side by side to scale, bottoms on y; items =
//       [{kind, um, label, text}] kind 'bacterium'|'animal'|'plant'|'nucleus'|'mitochondrion'|'chloroplast'|'peroxisome'|
//       'ribosome'|'dot'. .reveal(k) items one by one; .item(i) its group; .pt(i) top centre of item i in parent
//
//   cellMap(p, {kind='animal'|'plant', x=800, y=450, s=.7, o}) the whole eukaryotic cell (about 1100 × 700 at s = 1,
//       centred on its origin). Parts (names for piece/focus/pt/label): membrane cytoplasm nucleus (children envelope
//       nucleolus chromatin) roughER smoothER golgi vesicles mitochondria peroxisomes ribosomes (free) cytoskeleton;
//       animal: lysosomes centrosome; plant: wall vacuole chloroplasts plasmodesmata. Singular names and 'ER' (both ERs),
//       'plasmaMembrane', 'cellWall', 'centralVacuole' work too.
//       .piece(name) its group (named piece, not part: on an SVG element .part is the DOM's own Element.part, a
//       DOMTokenList, so a .part method can't be added or called); .focus(names, k) lights those parts and dims the
//       rest (k 0..1; names a string or array);
//       .build(k) assembles it piece by piece (membrane first … cytoskeleton last); build and focus combine.
//       .pt(name, i=0) the centre of a part (instance i) in parent coordinates, for camera pushes and leaders;
//       .label(name, str, {i, at:[x, y] parent, dx, dy, size=30, color, layer=p}) a label outside the cell with a leader
//       (o 0: show it). Labels are drawn in the parent: if you move the cell later, make them after it moves.
//       .order (the build order), .nu (its nucleus()), .mitos .chloros .lysos .peroxs (kit pieces)
//   prokaryote(p, {x, y, s, o, w=560, h=220, flagella=1, fimbriae=true}) a rod bacterium: capsule, cell wall, plasma
//       membrane, cytoplasm, nucleoid (cream tangle, no envelope), ribosomes, fimbriae, flagellum to the right.
//       .beat(t) whips the flagellum; .piece(name) the group of capsule wall membrane cytoplasm nucleoid ribosomes
//       fimbriae flagella (singular works; .parts is the same map as an object; no .part, see cellMap);
//       .pt(name) in parent (same names)
//   nucleus(p, {x, y, s, o, R=240, pores=10, lamina=true, ribos=true}) close-up: double envelope (two lines), pore
//       complexes, lamina mesh, nucleolus, chromatin, ribosomes on the outer membrane. .condense(k) chromatin → four X
//       chromosomes (the nucleolus fades); .ship(k, {i=0}) a ribosomal subunit leaves the nucleolus through pore i;
//       .pt(name, i) 'envelope' 'outer' 'inner' 'pore' 'lamina' 'nucleolus' 'chromatin' 'nucleoplasm' 'ribosome'
//       'chromosome'; .envelope .nucleolus .chromatin .chromosomes .lamina .poreAngles
//   er(p, {x, y, s, o, rough=true, w=460, n=4, gap=64, tube=32}) rough: n stacked cisternae studded with ribosome dots;
//       smooth: a network of tubes. .bud(k) a transport vesicle (coral protein / yellow lipid) buds off the right end and
//       moves away; .thread(k) (rough) a polypeptide threads from a bound ribosome into the lumen (.threadPath);
//       .pt(name) 'lumen' 'membrane' 'ribosome' 'bud' (the vesicle now) 'end'; .vesicle
//   roughER(p, opts) / smoothER(p, opts) = er with rough true / false
//   golgi(p, {x, y, s, o, n=5, h=300, gap=44, bow=46}) stacked curved cisternae, cis face to the left (−x), trans face
//       to the right. .flow(k) a vesicle arrives at cis and fuses (to .3), its cargo moves through the stack and is
//       modified (a tag added and its colour warms, .42–.6), a vesicle buds from trans (.7–.82) and leaves;
//       .labels({layer=p, size=28}) "cis face"/"trans face" under the stack (o 0); .pt('cis'|'trans'|'stack'|'cargo')
//   vesicle(p, {x, y, s, o, r=26, cargo='protein'|'lipid'|'enzyme'|'none', n=3, membrane=false, my=−(r+50), mw=300})
//       cyan-rimmed bubble with cargo. .fuse(k) exocytosis: it rises to a membrane lying at local y = my, opens into it
//       and the cargo leaves above (membrane: true draws that membrane piece, mw wide); .move(pts, k) along a polyline
//       of parent points; .pose(x, y); .cargo [dots]
//   lysosome(p, {x, y, s, o, r=60, n=3}) purple, with olive enzyme pac-men; .chomp(t) the enzymes bite; .enzymes; .pose
//   cAlong, cBlob(rx, ry, {seed, wob}), cSmooth(pts, closed), cStadium(w, h), cTube(p, d, {w, edge, lumen}) drawing helpers
//   digest(p, {x, y, s, o, kind='phago'|'auto', R=70}) phago: a food particle above a plasma membrane at y = 0 (cell
//       below); auto: a worn mitochondrion at the origin. .engulf(k) pseudopods (phago) or a double membrane (auto) wrap
//       it into a food vacuole / autophagosome (phago: it pinches off and sinks to (0, R + 100)); .fuse(k) a lysosome
//       comes in and fuses, enzymes enter; .breakdown(k) the contents break into fragments and small nutrients spread;
//       .run(k) all three (.45 / .25 / .3 of k). .pt('vacuole'|'lysosome'|'membrane'|'particle')
//   vacuole(p, {x, y, s, o, kind='central'|'food'|'contractile', w=420, h=300, r=40, edge=false}) central: big pale-blue
//       sac with its membrane (tonoplast), .swell(k) grows it 8 %; food: pale bubble with food bits; contractile: a star
//       of canals, .pump(k) fills (to .6), squeezes and water molecules leave upward (edge: true draws the cell membrane
//       above with a pore); .pt('centre'|'membrane'|'pore')
//   mitochondrion(p, {x, y, s, o, r=0, w=380, h=150, cut=1, worn=false}) (r: turn, degrees) outer membrane, intermembrane space, inner membrane
//       folded into cristae, matrix with free ribosomes and a DNA loop. .cut(k) 0 = whole outside, 1 = cutaway;
//       .spark(t, on=1) ATP sparks fly out (pure in t); .pt('outer'|'inner'|'cristae'|'ims'|'matrix'|'dna'|'ribosome')
//   chloroplast(p, {x, y, s, o, r=0, w=440, h=210}) double membrane, stroma, thylakoids stacked into grana with stroma
//       lamellae, ribosomes, DNA. .light(k) warm rays come in and the grana glow;
//       .pt('outer'|'inner'|'stroma'|'granum'|'thylakoid'|'dna'|'ribosome')
//   peroxisome(p, {x, y, s, o, r=110}) single membrane, crystalline core. .react(k) two H₂O₂ appear (to .2), catalase
//       bites them (.3–.5), two water molecules and an O₂ leave (.45–.8), labels H₂O / O₂ (.8–1). .pt('membrane'|'core')
//   microscope(p, {x, y, s, o}) flat light microscope, origin = bottom centre of its base (about 300 × 460);
//       .lamp(k) the light comes on; .pt('eyepiece'|'objective'|'stage'|'lamp')
//   centrifugeTube(p, {x, y, s, o, h=380, w=96}) origin = the tube's bottom; a homogenate of nuclei, mitochondria and
//       chloroplasts, ER bits and ribosomes; .spin(k) they settle into layers by size (biggest first and lowest) and the
//       liquid clears; .layerPt(i) right of layer i (0 nuclei … 3 ribosomes) in parent; .kinds (layer names)

const CC = {
  membrane: '#8fb0d6', cyto: '#183457', env: '#5b82b8', nucleo: '#122844', dna: '#e9dcc0', nucleolus: '#2c4f7d',
  ribo: '#aa9fc6', er: '#4fa3a5', erLumen: '#1d4c55', golgi: '#7fd1b9', golgiLumen: '#22574b',
  vesicle: '#a8e0ea', vesFill: '#1f4567', cargo: '#f07a6a', cargoMod: '#ffb070', tag: '#e8a0c8', lipid: '#f3c95c',
  lyso: '#9a6cd0', lysoFill: '#3b2c62', enzyme: '#a8c66c', food: '#d9c7a0', foodFill: '#2e5072',
  vac: '#3a6ea5', vacEdge: '#a9c6ea',
  mito: '#f39a2b', cristae: '#f8c27a', matrix: '#8a5617', ims: '#3a230c', atp: '#ffd27a',
  chloro: '#5bbf5b', chloroGap: '#1d4a29', grana: '#2f8f46', granaEdge: '#1d6a33', stroma: '#9fd89a', light: '#ffd86b',
  perox: '#c9d45c', peroxFill: '#353d1c', core: '#8f9a3c', coreLine: '#5d6626',
  mt: '#8fd6b0', actin: '#ff7aa8', ifil: '#f3c95c', wall: '#c9b27a', wall2: '#a68d55', lamella: '#efe3c0',
  capsule: '#d6e2ee', flag: '#f2efe6', board: '#0f1e33', hi: '#f39a2b',
};

/* ---------- helpers ---------- */
const cRound = (k, v) => k === 'o' || k === 's' || k === 'd' ? Math.round(v * 1000) / 1000 : Math.round(v * 10) / 10;
// put only what changed
function cSet(e, v) {
  const s0 = st(e), nv = {}; let ch = false;
  for (const k in v) { const r = cRound(k, v[k]); if (s0[k] !== r) { nv[k] = r; ch = true; } }
  if (ch) put(e, nv);
  return e;
}
function cAttr(e, name, val) { if (e['_a' + name] !== val) { e.setAttribute(name, val); e['_a' + name] = val; } return e; }
const cF = v => (Math.round(v * 10) / 10).toString();
const cP = ([x, y]) => cF(x) + ' ' + cF(y);
const cLerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
function cAlong(pts, k) {
  if (pts.length < 2) return pts[0];
  const L = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let want = mClamp(k) * tot;
  for (let i = 0; i < L.length; i++) { if (want <= L[i] || i === L.length - 1) return cLerp2(pts[i], pts[i + 1], L[i] ? Math.min(1, want / L[i]) : 1); want -= L[i]; }
  return pts[pts.length - 1];
}
// A wobbly closed outline (an organic cell or organelle)
function cBlobPt(rx, ry, t, seed = 1, wob = .035) {
  const k = 1 + wob * (Math.sin(3 * t + seed) + .6 * Math.sin(5 * t + 2.3 * seed));
  return [rx * k * Math.cos(t), ry * k * Math.sin(t)];
}
function cBlob(rx, ry, { seed = 1, wob = .035, n = 72, cx = 0, cy = 0 } = {}) {
  let d = '';
  for (let i = 0; i < n; i++) { const [px, py] = cBlobPt(rx, ry, i / n * 2 * Math.PI, seed, wob); d += (i ? 'L' : 'M') + cF(cx + px) + ' ' + cF(cy + py); }
  return d + 'Z';
}
// A smooth path through points (quadratic through the midpoints)
function cSmooth(pts, closed = false) {
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  if (n < 3) return 'M' + pts.map(cP).join('L');
  if (closed) {
    let d = 'M' + cP(mid(pts[n - 1], pts[0]));
    for (let i = 0; i < n; i++) d += 'Q' + cP(pts[i]) + ' ' + cP(mid(pts[i], pts[(i + 1) % n]));
    return d + 'Z';
  }
  let d = 'M' + cP(pts[0]);
  for (let i = 1; i < n - 1; i++) d += 'Q' + cP(pts[i]) + ' ' + cP(mid(pts[i], pts[i + 1]));
  return d + 'L' + cP(pts[n - 1]);
}
// the unit normal of a polyline at point i (left of the direction of travel)
function cNormal(pts, i) {
  const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(a[1] - b[1]) / L, (b[0] - a[0]) / L];
}
// densify a polyline to about `step` spacing
function cResample(pts, step) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], m = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let j = 1; j <= m; j++) out.push(cLerp2(a, b, j / m));
  }
  return out;
}
const cDots = pts => pts.map(q => 'M' + cP(q) + 'h.01').join('');
function cStadium(w, h, r = Math.min(w, h) / 2) {
  const a = w / 2, b = h / 2;
  return `M${-a + r} ${-b}H${a - r}A${r} ${r} 0 0 1 ${a} ${-b + r}V${b - r}A${r} ${r} 0 0 1 ${a - r} ${b}H${-a + r}A${r} ${r} 0 0 1 ${-a} ${b - r}V${-b + r}A${r} ${r} 0 0 1 ${-a + r} ${-b}Z`;
}
// a point u (0..1) round a stadium (r = h/2) with its outward normal: [x, y, nx, ny]
function cStadiumPt(w, h, u) {
  const r = h / 2, L1 = w - h, P = 2 * L1 + 2 * Math.PI * r; let d = (((u % 1) + 1) % 1) * P;
  if (d < L1) return [-L1 / 2 + d, -r, 0, -1]; d -= L1;
  if (d < Math.PI * r) { const a = -Math.PI / 2 + d / r; return [L1 / 2 + r * Math.cos(a), r * Math.sin(a), Math.cos(a), Math.sin(a)]; } d -= Math.PI * r;
  if (d < L1) return [L1 / 2 - d, r, 0, 1]; d -= L1;
  const a = Math.PI / 2 + d / r; return [-L1 / 2 + r * Math.cos(a), r * Math.sin(a), Math.cos(a), Math.sin(a)];
}
const cCircle = (r, cx = 0, cy = 0) => `M${cF(cx - r)} ${cF(cy)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
// a membrane-bounded tube: one outer stroke (membrane) and one inner stroke (lumen) for every subpath in d
function cTube(p, d, { w = 30, edge = CC.er, lumen = CC.erLumen } = {}) {
  const g = G(p);
  const outer = path(g, d, { stroke: edge, 'stroke-width': w });
  const inner = path(g, d, { stroke: lumen, 'stroke-width': Math.max(2, w - 12) });
  return Object.assign(g, { outer, inner });
}
const cFrac = v => v - Math.floor(v);
// a point in group g's frame → its parent's (translate, rotate, scale)
function cOut(g, [lx, ly]) {
  const { x, y, s, r } = st(g), a = (r || 0) * Math.PI / 180;
  return [x + s * (lx * Math.cos(a) - ly * Math.sin(a)), y + s * (lx * Math.sin(a) + ly * Math.cos(a))];
}

function cLabel(p, [ax, ay], [tx, ty], str, { size = 28, color = COL.chalk, line = COL.dim, o = 0, weight = 600 } = {}) {
  const g = G(p, { o }), right = tx >= ax, w = uiW(str, size);
  const ex = tx + (right ? -10 : 10), ey = ty;
  path(g, `M${cF(ax)} ${cF(ay)}L${cF(ex)} ${cF(ey)}`, { stroke: line, 'stroke-width': 2.5 });
  mk('circle', { cx: cF(ax), cy: cF(ay), r: 4.5, fill: line }, g);
  wLabel(g, str, { x: tx + (right ? w / 2 : -w / 2), y: ty + size * .36, size, fill: color, weight, o: 1 });
  return g;
}

/* ---------- scale bar and size ladder ---------- */
function scaleBar(p, { x = 0, y = 0, len = 200, text = '1 µm', size = 26, color = COL.chalk, o = 1 } = {}) {
  const g = G(p, { x, y, o });
  const ln = path(g, '', { stroke: color, 'stroke-width': 5, 'stroke-linecap': 'butt' });
  const t = wLabel(g, text, { y: size + 14, size, fill: color, weight: 700, o: 1 });
  const b = Object.assign(g, {
    set(L, str = text) {
      mD(ln, `M0 -10V10M0 0H${cF(L)}M${cF(L)} -10V10`); cSet(t, { x: L / 2 });
      if (t.textContent !== str) t.textContent = str;
      return b;
    },
  });
  return b.set(len, text);
}

function cIcon(p, kind, W) {
  const g = G(p);
  if (kind === 'animal') {
    path(g, cBlob(W / 2, W * .42, { seed: 2 }), { fill: CC.cyto, stroke: CC.membrane, 'stroke-width': 4 });
    mk('circle', { cx: -W * .08, cy: -W * .03, r: W * .13, fill: CC.nucleo, stroke: CC.env, 'stroke-width': 3 }, g);
    mk('circle', { cx: -W * .08, cy: -W * .03, r: W * .045, fill: CC.nucleolus }, g);
    put(g, { y: -W * .42 });
  } else if (kind === 'plant') {
    const h = W * .7;
    mk('rect', { x: -W / 2, y: -h / 2, width: W, height: h, rx: W * .08, fill: CC.cyto, stroke: CC.wall, 'stroke-width': 7 }, g);
    path(g, cBlob(W * .26, h * .3, { seed: 4, cx: W * .1 }), { fill: CC.vac, stroke: CC.vacEdge, 'stroke-width': 2.5 });
    mk('circle', { cx: -W * .3, cy: -h * .2, r: W * .08, fill: CC.nucleo, stroke: CC.env, 'stroke-width': 2.5 }, g);
    put(g, { y: -h / 2 });
  } else if (kind === 'bacterium') {
    const pk = prokaryote(g, { s: W / 604, flagella: 0, fimbriae: false });
    put(pk, { y: -132 * W / 604 });
  } else if (kind === 'nucleus') { const n = nucleus(g, { s: W / 480, lamina: false, ribos: false, pores: 6 }); put(n, { y: -W / 2 }); }
  else if (kind === 'mitochondrion') { const m = mitochondrion(g, { s: W / 380 }); put(m, { y: -75 * W / 380 }); }
  else if (kind === 'chloroplast') { const c = chloroplast(g, { s: W / 440 }); put(c, { y: -105 * W / 440 }); }
  else if (kind === 'peroxisome') { const c = peroxisome(g, { s: W / 220 }); put(c, { y: -W / 2 }); }
  else if (kind === 'ribosome') { mk('circle', { cy: -Math.max(3, W / 2), r: Math.max(3, W / 2), fill: CC.ribo }, g); }
  else mk('circle', { cy: -Math.max(3, W / 2), r: Math.max(3, W / 2), fill: COL.chalk }, g);
  return g;
}
const C_HEIGHT = { animal: .84, plant: .7, bacterium: 264 / 604, nucleus: 1, mitochondrion: 150 / 380, chloroplast: 210 / 440, peroxisome: 1, ribosome: 1, dot: 1 };
function sizeLadder(p, { x = 0, y = 0, pxPerUm = 10, gap = 60, size = 24, o = 1, items = [
  { kind: 'bacterium', um: 3, label: 'bacterium', text: '1–5 µm' },
  { kind: 'animal', um: 40, label: 'animal cell', text: '10–100 µm' },
] } = {}) {
  const g = G(p, { x, y, o }), groups = [], tops = [];
  let cx = 0;
  items.forEach((it, i) => {
    const W = Math.max(6, it.um * pxPerUm), ig = G(g, { x: cx + W / 2 });
    cIcon(ig, it.kind, W);
    const H = Math.max(6, W * (C_HEIGHT[it.kind] ?? 1));
    if (it.label) wLabel(ig, it.label, { y: size + 16, size, weight: 700, o: 1 });
    if (it.text) wLabel(ig, it.text, { y: 2 * size + 24, size: size * .9, fill: COL.dim, weight: 500, o: 1 });
    groups.push(ig); tops.push([cx + W / 2, -H]);
    cx += W + Math.max(gap, Math.max(uiW(it.label || '', size), uiW(it.text || '', size)) / 2 - W / 2 + gap * .5);
  });
  const lad = Object.assign(g, {
    groups, width: cx,
    item(i) { return groups[i]; },
    pt(i) { return cOut(g, tops[i]); },
    reveal(k) { const n = groups.length; groups.forEach((e, i) => mO(e, mRamp(k, i / n, (i + .7) / n))); return lad; },
  });
  return lad;
}

/* ---------- vesicle: a cyan-rimmed bubble with cargo; exocytosis ---------- */
function vesicle(p, { x = 0, y = 0, s = 1, o = 1, r = 26, cargo = 'protein', n = 3, membrane = false, my, mw = 300, seed = 1 } = {}) {
  const g = G(p, { x, y, s, o }), MY = my ?? -(r + 50);
  const memb = membrane ? path(g, '', { stroke: CC.membrane, 'stroke-width': 8 }) : null;
  const body = G(g);
  const cup = path(body, cCircle(r), { fill: CC.vesFill, stroke: CC.vesicle, 'stroke-width': 6 });
  const cargoL = G(g), dots = [], home = [], away = [];
  const col = cargo === 'lipid' ? CC.lipid : CC.cargo;
  for (let i = 0; i < (cargo === 'none' ? 0 : n); i++) {
    const a = (i / n) * 2 * Math.PI + seed, rr = n === 1 ? 0 : r * .42;
    home.push([rr * Math.cos(a), rr * Math.sin(a)]);
    away.push([(i - (n - 1) / 2) * r * 1.1 + (wHash(i, seed) - .5) * 14, MY - 40 - 50 * wHash(i, seed + 3)]);
    const d = cargo === 'enzyme' ? enzyme(cargoL, { R: r * .3, dir: a * 180 / Math.PI + 180 })
      : mk('circle', { r: Math.max(4, r * .24), fill: col, stroke: mix(col, '#000000', .3), 'stroke-width': 2 }, cargoL);
    put(d, { x: home[i][0], y: home[i][1] });
    dots.push(d);
  }
  let lastCup = 'c';
  const v = Object.assign(g, {
    r, cargo: dots, body, rim: cup,
    pose(nx, ny) { cSet(g, { x: nx, y: ny }); return v; },
    move(pts, k) { const q = cAlong(pts, k); return v.pose(q[0], q[1]); },
    fuse(k) {
      const a = io(mRamp(k, 0, .3)), u = io(mRamp(k, .3, .75)), cy = (MY + r) * a;
      let dd, c = 0;
      if (u <= .001) dd = cCircle(r, 0, cy);
      else {
        c = 2.2 * r * u; const dep = 2 * r * (1 - u);
        if (dep < .5) dd = `M${cF(-c)} ${MY}H${cF(c)}`;
        else { const R = (c * c + dep * dep) / (2 * dep); dd = `M${cF(-c)} ${MY}A${cF(R)} ${cF(R)} 0 ${dep > R ? 1 : 0} 0 ${cF(c)} ${MY}`; }
      }
      const key = dd; if (lastCup !== key) { cup.setAttribute('d', dd); lastCup = key; }
      cAttr(cup, 'stroke', mix(CC.vesicle, CC.membrane, Math.round(mRamp(k, .3, .7) * 20) / 20)); cAttr(cup, 'stroke-width', memb ? 6 + 2 * Math.round(mRamp(k, .3, .7) * 10) / 10 : 6);
      if (memb) mD(memb, c > 0 ? `M${-mw / 2} ${MY}H${cF(-c)}M${cF(c)} ${MY}H${mw / 2}` : `M${-mw / 2} ${MY}H${mw / 2}`);
      const out = io(mRamp(k, .4, .95));
      dots.forEach((d, i) => cSet(d, { x: home[i][0] + (away[i][0] - home[i][0]) * out, y: home[i][1] + cy + (away[i][1] - home[i][1] - cy) * out }));
      return v;
    },
  });
  if (memb) mD(memb, `M${-mw / 2} ${MY}H${mw / 2}`);
  return v;
}

/* ---------- ER: rough (sheets with ribosomes) or smooth (tubes) ---------- */
const C_SMOOTH = [
  [[-1, -.5], [-.6, -.7], [-.2, -.45], [.2, -.6], [.6, -.35], [1, -.5]],
  [[-.6, -.7], [-.5, -.1], [-.1, .15], [.3, .05], [.6, -.35]],
  [[-1, .2], [-.5, -.1]],
  [[-.1, .15], [-.2, .6], [.2, .8], [.7, .55], [1, .62]],
  [[.3, .05], [.7, .55]],
  [[-.2, .6], [-.75, .78]],
];
function er(p, { x = 0, y = 0, s = 1, o = 1, rough = true, w = 460, n = 4, gap = 64, tube = 32, seed = 2 } = {}) {
  const g = G(p, { x, y, s, o }), lines = [];
  let d = '';
  if (rough) {
    for (let i = 0; i < n; i++) {
      const L = w * (1 - .07 * ((i * 7) % 3)), pts = [];
      for (let j = 0; j <= 16; j++) { const u = j / 16; pts.push([(u - .5) * L, (i - (n - 1) / 2) * gap + 12 * Math.sin(u * Math.PI * 1.7 + i * .8 + seed)]); }
      lines.push(pts); d += cSmooth(pts);
    }
    for (let i = 0; i < n - 1; i++) { const j = i % 2 ? 13 : 3; d += `M${cP(lines[i][j])}L${cP(lines[i + 1][j])}`; }
  } else {
    const h = w * .6;
    for (const t of C_SMOOTH) { const pts = t.map(([u, v]) => [u * w / 2, v * h / 2]); lines.push(pts); d += cSmooth(pts); }
  }
  const sheets = cTube(g, d, { w: rough ? tube : tube * .75, edge: CC.er, lumen: CC.erLumen });
  const dotPts = [];
  if (rough) lines.forEach((pts, i) => {
    const dense = cResample(pts, 24);
    dense.forEach((q, j) => { if (j % 1 === 0) for (const sd of [1, -1]) { if ((j + (sd > 0 ? 0 : 1) + i) % 3 === 2) continue; const nn = cNormal(dense, j); dotPts.push([q[0] + nn[0] * sd * (tube / 2 + 6), q[1] + nn[1] * sd * (tube / 2 + 6)]); } });
  });
  const ribos = rough ? path(g, cDots(dotPts), { stroke: CC.ribo, 'stroke-width': 12 }) : null;
  // the bud: from the right end of the first sheet / tube
  const L0 = lines[0], E = L0[L0.length - 1], Pv = L0[L0.length - 2], el = Math.hypot(E[0] - Pv[0], E[1] - Pv[1]) || 1, dir = [(E[0] - Pv[0]) / el, (E[1] - Pv[1]) / el];
  const top = G(g);
  const neck = path(top, '', { stroke: CC.er, 'stroke-width': tube * .55 }, { o: 0 });
  const ves = vesicle(top, { r: 20, cargo: rough ? 'protein' : 'lipid', n: 2, o: 0 });
  // the thread: a polypeptide from a bound ribosome into the lumen
  let thread = null, thrRibo = null, thrPts = null;
  if (rough) {
    const dense = cResample(L0, 12), j0 = Math.round(dense.length * .25), nn = cNormal(dense, j0);
    const side = nn[1] < 0 ? 1 : -1, rp = [dense[j0][0] + nn[0] * side * (tube / 2 + 8), dense[j0][1] + nn[1] * side * (tube / 2 + 8)];
    thrPts = [rp, dense[j0], ...dense.slice(j0 + 1, j0 + 14)];
    thread = path(top, cSmooth(thrPts), { stroke: CC.cargo, 'stroke-width': 5 }, { d: 0 });
    thrRibo = ribosome(top, { x: rp[0], y: rp[1] + side * -10, s: .2, o: 0 });
    put(thrRibo, { r: Math.atan2(nn[1] * side, nn[0] * side) * 180 / Math.PI - 90 + 180 });
  }
  const mid = L0[Math.floor(L0.length / 2)], mn = cNormal(L0, Math.floor(L0.length / 2));
  const e = Object.assign(g, {
    rough, sheets, ribos, vesicle: ves, lines, threadPath: thread,
    bud(k) {
      const a = io(mRamp(k, 0, .45)), m = io(mRamp(k, .6, 1)), off = ves.r * (.2 + .9 * a) + 120 * m;
      cSet(ves, { x: E[0] + dir[0] * off, y: E[1] + dir[1] * off, s: .35 + .65 * a, o: k > 0 ? 1 : 0 });
      mD(neck, `M${cP(E)}L${cP([E[0] + dir[0] * ves.r * (.2 + .9 * a), E[1] + dir[1] * ves.r * (.2 + .9 * a)])}`);
      mO(neck, k > 0 ? 1 - mRamp(k, .45, .6) : 0);
      return e;
    },
    thread(k) { if (!thread) return e; cSet(thread, { d: io(mRamp(k, .15, 1)) }); mO(thrRibo, mRamp(k, 0, .15)); return e; },
    pt(name) {
      if (name === 'lumen') return cOut(g, mid);
      if (name === 'membrane') return cOut(g, [mid[0] + mn[0] * tube / 2, mid[1] + mn[1] * tube / 2]);
      if (name === 'ribosome') return cOut(g, rough ? dotPts[Math.floor(dotPts.length * .4)] : mid);
      if (name === 'bud') return cOut(g, [st(ves).x, st(ves).y]);
      if (name === 'thread') return cOut(g, thrPts ? thrPts[0] : mid);
      return cOut(g, E);
    },
  });
  return e;
}
const roughER = (p, o = {}) => er(p, { ...o, rough: true });
const smoothER = (p, o = {}) => er(p, { ...o, rough: false });

/* ---------- Golgi apparatus ---------- */
function golgi(p, { x = 0, y = 0, s = 1, o = 1, n = 5, h = 300, gap = 44, bow = 46, tube = 26 } = {}) {
  const g = G(p, { x, y, s, o }), xs = i => (i - (n - 1) / 2) * gap, cisX = i => xs(i) - bow, half = (n - 1) / 2 || 1;
  let d = '';
  const ends = [];
  for (let i = 0; i < n; i++) {
    const L = h * (1 - .16 * Math.abs(i - (n - 1) / 2) / half), pts = [];
    for (let j = 0; j <= 12; j++) { const v = (j / 12 - .5) * L; pts.push([xs(i) - bow * (1 - (2 * v / L) ** 2), v]); }
    d += cSmooth(pts); ends.push(pts[0], pts[12]);
  }
  cTube(g, d, { w: tube, edge: CC.golgi, lumen: CC.golgiLumen });
  // small vesicles budding at the ends of the trans side
  const deco = G(g);
  [[n - 1, 0, -1], [n - 1, 1, 1], [n - 2, 0, -1], [0, 1, 1]].forEach(([i, e, sd], j) => {
    const q = ends[2 * i + e];
    mk('circle', { cx: cF(q[0] + 14 + j * 3), cy: cF(q[1] + sd * 22), r: 10, fill: CC.vesFill, stroke: CC.golgi, 'stroke-width': 4 }, deco);
  });
  const top = G(g);
  const inV = vesicle(top, { r: 18, cargo: 'protein', n: 2, o: 0 });
  const outV = vesicle(top, { r: 20, cargo: 'none', o: 0 });
  const cargo = G(top, { o: 0 });
  const tagG = G(cargo, { s: 0 });
  path(tagG, 'M5 -5L14 -14M14 -14L22 -12M14 -14L13 -23', { stroke: CC.tag, 'stroke-width': 3.5 });
  mk('circle', { cx: 22, cy: -12, r: 4.5, fill: CC.tag }, tagG); mk('circle', { cx: 13, cy: -23, r: 4.5, fill: CC.tag }, tagG);
  const dot = mk('circle', { r: 8, fill: CC.cargo, stroke: '#a44a3e', 'stroke-width': 2 }, cargo);
  const S0 = [cisX(0) - 200, 70], E0 = [cisX(0) - 22, 0], T0 = [cisX(n - 1) + 30, 0], T1 = [cisX(n - 1) + 210, -70];
  let cargoAt = [cisX(0), 0];
  const gg = Object.assign(g, {
    n, cisX,
    flow(k) {
      const a = io(mRamp(k, 0, .22));
      cSet(inV, { x: S0[0] + (E0[0] - S0[0]) * a, y: S0[1] + (E0[1] - S0[1]) * a, s: 1 - .6 * mRamp(k, .22, .3), o: mRamp(k, 0, .04) * (1 - mRamp(k, .24, .3)) });
      const th = io(mRamp(k, .3, .7)), b = io(mRamp(k, .7, .8)), m = io(mRamp(k, .82, 1));
      let cx = cisX(0) + (cisX(n - 1) - cisX(0)) * th, cy = 0;
      if (k >= .7) { cx = cisX(n - 1) + (T0[0] - cisX(n - 1)) * b; }
      if (k >= .82) { cx = T0[0] + (T1[0] - T0[0]) * m; cy = T0[1] + (T1[1] - T0[1]) * m; }
      cargoAt = [cx, cy];
      cSet(cargo, { x: cx, y: cy, o: k > .22 ? mRamp(k, .22, .27) : 0 });
      const mod = mRamp(k, .42, .6);
      cSet(tagG, { s: io(mRamp(k, .42, .55)) });
      cAttr(dot, 'fill', mix(CC.cargo, CC.cargoMod, Math.round(mod * 20) / 20));
      const grow = io(mRamp(k, .7, .8));
      cSet(outV, { x: k >= .82 ? cx : T0[0], y: k >= .82 ? cy : T0[1], s: .3 + .7 * grow, o: k >= .7 ? 1 : 0 });
      return gg;
    },
    labels({ layer = p, size = 28 } = {}) {
      const lg = G(layer, { o: 0 }), yb = h / 2 + 46;
      const a = cOut(g, [cisX(0) - 10, yb]), b = cOut(g, [xs(n - 1) + 10, yb]);
      wLabel(lg, 'cis face', { x: a[0], y: a[1], size, fill: CC.golgi, anchor: 'end', weight: 700, o: 1 });
      wLabel(lg, 'trans face', { x: b[0], y: b[1], size, fill: CC.golgi, anchor: 'start', weight: 700, o: 1 });
      return lg;
    },
    pt(name) {
      if (name === 'cis') return cOut(g, [cisX(0) - 20, 0]);
      if (name === 'trans') return cOut(g, [xs(n - 1) + 20, 0]);
      if (name === 'cargo') return cOut(g, cargoAt);
      return cOut(g, [cisX(Math.floor(n / 2)), -h * .3]);
    },
  });
  return gg;
}

/* ---------- lysosome ---------- */
function lysosome(p, { x = 0, y = 0, s = 1, o = 1, r = 60, n = 3, seed = 1 } = {}) {
  const g = G(p, { x, y, s, o });
  mk('circle', { r, fill: CC.lysoFill, stroke: CC.lyso, 'stroke-width': 6 }, g);
  mk('ellipse', { cx: -r * .38, cy: -r * .5, rx: r * .26, ry: r * .13, fill: '#fff', 'fill-opacity': .18 }, g);
  const enzymes = [];
  for (let i = 0; i < n; i++) {
    const a = seed + i * 2 * Math.PI / n, rr = n === 1 ? 0 : r * .42;
    enzymes.push(enzyme(g, { x: rr * Math.cos(a), y: rr * Math.sin(a), R: r * .26, dir: (a * 180 / Math.PI + 140 + i * 50) % 360 }));
  }
  const l = Object.assign(g, {
    r, enzymes,
    chomp(t) { enzymes.forEach((e, i) => e.bite(.55 + .45 * Math.sin(t * 5 + i * 2.1))); return l; },
    pose(nx, ny) { cSet(g, { x: nx, y: ny }); return l; },
  });
  return l;
}

/* ---------- digest: phagocytosis or autophagy, then a lysosome digests ---------- */
function digest(p, { x = 0, y = 0, s = 1, o = 1, kind = 'phago', R = 70 } = {}) {
  const g = G(p, { x, y, s, o }), phago = kind === 'phago';
  const C = phago ? [0, -R - 14] : [0, 0], V = phago ? [0, R + 100] : [0, 0];
  const back = G(g), armL = G(g), vacL = G(g), front = G(g);
  let memb = null;
  if (phago) {
    mk('rect', { x: -380, y: 0, width: 760, height: 2 * R + 230, fill: CC.cyto }, back);
    memb = path(back, 'M-380 0H380', { stroke: CC.membrane, 'stroke-width': 8 });
  }
  // the wrapping arms
  const arms = [];
  const cy = C[1], Rw = R + (phago ? 18 : 0);
  const armD = phago
    ? [`M${-Rw - 60} 0Q${-Rw} 0 ${-Rw} ${cy}A${Rw} ${Rw} 0 0 1 0 ${cy - Rw}`, `M${Rw + 60} 0Q${Rw} 0 ${Rw} ${cy}A${Rw} ${Rw} 0 0 0 0 ${cy - Rw}`]
    : [Rw, Rw + 13].flatMap(rr => [`M0 ${rr}A${rr} ${rr} 0 0 1 0 ${-rr}`, `M0 ${rr}A${rr} ${rr} 0 0 0 0 ${-rr}`]);
  armD.forEach(dd => {
    if (phago) { arms.push(path(armL, dd, { stroke: CC.membrane, 'stroke-width': 34 }, { d: 0 })); arms.push(path(armL, dd, { stroke: CC.cyto, 'stroke-width': 20 }, { d: 0 })); }
    else arms.push(path(armL, dd, { stroke: CC.vacEdge, 'stroke-width': 6 }, { d: 0 }));
  });
  // the vacuole (food vacuole or autophagosome) with its contents
  const vac = G(vacL, { x: C[0], y: C[1] });
  const ring = G(vac, { o: 0 });
  const vFill = mk('circle', { r: R, fill: CC.foodFill, stroke: CC.vacEdge, 'stroke-width': 6 }, ring);
  if (!phago) mk('circle', { r: R + 13, fill: 'none', stroke: CC.vacEdge, 'stroke-width': 6 }, ring);
  const tint = put(mk('circle', { r: R - 3, fill: CC.lyso, 'fill-opacity': .35 }, vac), { o: 0 });
  const content = G(vac), pieces = [], dirs = [];
  if (phago) {
    [[0, 0, 22], [-20, -14, 16], [20, -12, 15], [-18, 16, 15], [19, 15, 16], [0, -24, 12], [2, 24, 12]].forEach(([px, py, rr], i) => {
      const e = G(content, { x: px, y: py });
      mk('circle', { r: rr, fill: i % 2 ? '#c99a62' : CC.food, stroke: '#8a6a3c', 'stroke-width': 2.5 }, e);
      pieces.push(e); const L = Math.hypot(px, py) || 1; dirs.push(i ? [px / L, py / L] : [0, 0]);
    });
  } else {
    const m = mitochondrion(content, { s: 1.6 * R / 380, worn: true });
    pieces.push(m); dirs.push([0, 0]);
  }
  const frags = G(content, { o: 0 }), fr = [];
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * 2 * Math.PI + .3, e = mk('circle', { r: 4 + 3 * wHash(i, 7), fill: phago ? CC.food : CC.mito }, frags);
    put(e, { x: 18 * Math.cos(a), y: 14 * Math.sin(a) }); fr.push([e, a]);
  }
  const enz = [0, 1, 2].map(i => enzyme(vac, { x: (R * .55) * Math.cos(i * 2.1 + .5), y: (R * .55) * Math.sin(i * 2.1 + .5), R: R * .2, dir: i * 120, o: 0 }));
  const lyso = lysosome(front, { r: R * .55, n: 2, o: 0 });
  const L0 = [V[0] + R + 230, V[1] + 120], L1 = [V[0] + R * 1.05, V[1] + R * .45];
  const dg = Object.assign(g, {
    lysosome: lyso, vacuole: vac, arms,
    engulf(k) {
      const w = io(mRamp(k, 0, .6)), close = mRamp(k, .58, .68), sink = phago ? io(mRamp(k, .7, 1)) : 0;
      arms.forEach(a => cSet(a, { d: w, o: phago ? 1 - close : 1 }));
      cSet(ring, { o: phago ? close : 0 });
      cSet(vac, { x: C[0] + (V[0] - C[0]) * sink, y: C[1] + (V[1] - C[1]) * sink });
      return dg;
    },
    fuse(k) {
      const a = io(mRamp(k, 0, .5)), m = io(mRamp(k, .5, 1));
      const q = cLerp2(cLerp2(L0, L1, a), V, m * .6);
      cSet(lyso, { x: q[0], y: q[1], s: 1 - .4 * m, o: k > 0 ? mRamp(k, 0, .1) * (1 - mRamp(k, .7, 1)) : 0 });
      mO(tint, mRamp(k, .55, 1));
      if (!phago) { mO(ring, k > 0 ? 1 : 0); arms.forEach(e => mO(e, k > 0 ? 0 : 1)); }
      enz.forEach((e, i) => mO(e, mRamp(k, .6 + i * .1, .8 + i * .07)));
      return dg;
    },
    breakdown(k) {
      const b = io(mRamp(k, 0, .7));
      pieces.forEach((e, i) => cSet(e, { x: st(e)._x0 + dirs[i][0] * 26 * b, y: st(e)._y0 + dirs[i][1] * 26 * b, s: st(e)._s0 * (1 - .65 * b), o: 1 - mRamp(k, .4, .85) }));
      mO(frags, mRamp(k, .2, .4));
      fr.forEach(([e, a]) => { const rr = 18 + (R * 1.6) * io(mRamp(k, .35, 1)); cSet(e, { x: rr * Math.cos(a), y: rr * .8 * Math.sin(a) }); });
      return dg;
    },
    run(k) { dg.engulf(mRamp(k, 0, .45)); dg.fuse(mRamp(k, .45, .7)); dg.breakdown(mRamp(k, .7, 1)); return dg; },
    pt(name) {
      if (name === 'lysosome') return cOut(g, [st(lyso).x, st(lyso).y]);
      if (name === 'membrane') return cOut(g, [-R * 2.6, 0]);
      if (name === 'particle') return cOut(g, C);
      return cOut(g, [st(vac).x, st(vac).y]);
    },
  });
  pieces.forEach(e => { st(e)._x0 = st(e).x; st(e)._y0 = st(e).y; st(e)._s0 = st(e).s; });
  if (!phago) arms.forEach(e => put(e, { o: 1 }));
  return dg.engulf(0);
}

/* ---------- vacuoles ---------- */
function vacuole(p, { x = 0, y = 0, s = 1, o = 1, kind = 'central', w = 420, h = 300, r = 40, edge = false, seed = 3 } = {}) {
  const g = G(p, { x, y, s, o }), body = G(g);
  let pump = null, pore = [0, -r * 2.6];
  if (kind === 'central') {
    path(body, cBlob(w / 2, h / 2, { seed, wob: .05 }), { fill: CC.vac, stroke: CC.vacEdge, 'stroke-width': 6 });
    mk('ellipse', { cx: -w * .18, cy: -h * .24, rx: w * .14, ry: h * .07, fill: '#fff', 'fill-opacity': .12 }, body);
  } else if (kind === 'food') {
    mk('circle', { r, fill: CC.foodFill, stroke: CC.vacEdge, 'stroke-width': 5 }, body);
    [[-.25, -.1, .3], [.2, .05, .26], [-.02, .3, .2]].forEach(([u, v, q]) => mk('circle', { cx: u * r, cy: v * r, r: q * r, fill: CC.food, stroke: '#8a6a3c', 'stroke-width': 2 }, body));
  } else {
    const ca = G(body), canals = [];
    let cd = '';
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + .3, L = r * (2.1 + .3 * wHash(i, seed)); cd += `M${cF(r * .6 * Math.cos(a))} ${cF(r * .6 * Math.sin(a))}Q${cF(L * .6 * Math.cos(a + .18))} ${cF(L * .6 * Math.sin(a + .18))} ${cF(L * Math.cos(a))} ${cF(L * Math.sin(a))}`; }
    const can = path(ca, cd, { stroke: CC.vacEdge, 'stroke-width': 16 }), canIn = path(ca, cd, { stroke: CC.vac, 'stroke-width': 9 });
    canals.push(can, canIn);
    const centre = G(body); mk('circle', { r, fill: CC.vac, stroke: CC.vacEdge, 'stroke-width': 5 }, centre);
    const wl = G(g), waters = [0, 1, 2, 3].map(i => waterMolecule(wl, { s: .26, face: false, o: 0, r: i * 70 }));
    if (edge) {
      const ey = -r * 2.6;
      path(g, `M${-r * 4} ${ey}H-14M14 ${ey}H${r * 4}`, { stroke: CC.membrane, 'stroke-width': 8 });
    }
    pump = k => {
      const f = io(mRamp(k, 0, .6)), c = io(mRamp(k, .6, .8)), size = (.55 + .45 * f) * (1 - .7 * c);
      cSet(centre, { s: size });
      const cw = Math.round((6 + 12 * f * (1 - c)) * 2) / 2;
      cAttr(can, 'stroke-width', cw + 7); cAttr(canIn, 'stroke-width', cw);
      waters.forEach((m, i) => {
        const q = io(mRamp(k, .6 + i * .04, .95)), sx = (i - 1.5) * 10;
        cSet(m, { x: sx * (1 - q) + (i - 1.5) * 34 * q, y: -r * 3.6 * q - 10 * (1 - q) + 0, o: k > .6 ? mRamp(k, .6, .66) * (1 - mRamp(k, .94, 1)) : 0 });
      });
    };
    pump(0);
  }
  const vc = Object.assign(g, {
    kind,
    swell(k) { cSet(body, { s: 1 + .08 * io(mClamp(k)) }); return vc; },
    pump(k) { if (pump) pump(k); return vc; },
    pt(name) {
      if (name === 'membrane') return cOut(g, kind === 'central' ? [w * .35, -h * .36] : [r * .7, -r * .7]);
      if (name === 'pore') return cOut(g, pore);
      return cOut(g, [0, 0]);
    },
  });
  return vc;
}

/* ---------- mitochondrion ---------- */
function mitochondrion(p, { x = 0, y = 0, s = 1, o = 1, w = 380, h = 150, cut = 1, worn = false, r = 0 } = {}) {
  const g = G(p, { x, y, s, o, r }), grey = c => worn ? mix(c, '#8b8f99', .55) : c;
  const m = 14, wi = w - 2 * m, hi = h - 2 * m, ri = hi / 2, sx = wi / 2 - ri - 4;
  path(g, cStadium(w, h), { fill: grey(CC.ims), stroke: grey(CC.mito), 'stroke-width': 7 });
  // the inner membrane with its cristae (fingers from top and bottom in turn)
  const F = Math.max(3, Math.floor(2 * sx / 32)), hw = 8, D = hi * .62, fx = [];
  for (let i = 0; i < F; i++) fx.push(-sx + 12 + i * (2 * sx - 24) / Math.max(1, F - 1));
  let d = `M${cF(-wi / 2 + ri)} ${cF(-hi / 2)}`;
  const T = -hi / 2, B = hi / 2;
  fx.forEach((x0, i) => { if (i % 2) return; d += `L${cF(x0 - hw)} ${cF(T)}L${cF(x0 - hw)} ${cF(T + D - hw)}Q${cF(x0 - hw)} ${cF(T + D)} ${cF(x0)} ${cF(T + D)}Q${cF(x0 + hw)} ${cF(T + D)} ${cF(x0 + hw)} ${cF(T + D - hw)}L${cF(x0 + hw)} ${cF(T)}`; });
  d += `L${cF(wi / 2 - ri)} ${cF(T)}A${cF(ri)} ${cF(ri)} 0 0 1 ${cF(wi / 2 - ri)} ${cF(B)}`;
  [...fx].reverse().forEach((x0, j) => { const i = F - 1 - j; if (!(i % 2)) return; d += `L${cF(x0 + hw)} ${cF(B)}L${cF(x0 + hw)} ${cF(B - D + hw)}Q${cF(x0 + hw)} ${cF(B - D)} ${cF(x0)} ${cF(B - D)}Q${cF(x0 - hw)} ${cF(B - D)} ${cF(x0 - hw)} ${cF(B - D + hw)}L${cF(x0 - hw)} ${cF(B)}`; });
  d += `L${cF(-wi / 2 + ri)} ${cF(B)}A${cF(ri)} ${cF(ri)} 0 0 1 ${cF(-wi / 2 + ri)} ${cF(T)}Z`;
  const inner = path(g, d, { fill: grey(CC.matrix), stroke: grey(CC.cristae), 'stroke-width': 5 });
  const contents = G(g);
  const dnaC = [fx.length > 2 ? (fx[1] + fx[2]) / 2 : 0, hi * .12];
  let dd = '';
  for (let i = 0; i <= 28; i++) { const a = i / 28 * 2 * Math.PI, rr = 15 + 3 * Math.sin(a * 5); dd += (i ? 'L' : 'M') + cF(dnaC[0] + rr * Math.cos(a)) + ' ' + cF(dnaC[1] + rr * .8 * Math.sin(a)); }
  path(contents, dd + 'Z', { stroke: grey(CC.dna), 'stroke-width': 3 });
  const riboPts = [];
  for (let i = 0; i < F - 1; i++) riboPts.push([(fx[i] + fx[i + 1]) / 2, (i % 2 ? -1 : 1) * hi * .3]);
  const rp = riboPts.filter((_, i) => i !== 1);
  path(contents, cDots(rp), { stroke: grey(CC.ribo), 'stroke-width': 9 });
  // the whole outside, over the cutaway
  const skin = G(g, { o: 1 - cut });
  path(skin, cStadium(w, h), { fill: grey(CC.mito), stroke: grey('#c9761b'), 'stroke-width': 7 });
  path(skin, `M${-w * .32} ${-h * .22}Q0 ${-h * .34} ${w * .3} ${-h * .2}`, { stroke: '#fff', 'stroke-opacity': .25, 'stroke-width': 10 });
  // ATP sparks
  const sparkL = G(g), sparks = [];
  for (let i = 0; i < 5; i++) {
    const sg = G(sparkL, { o: 0 });
    path(sg, 'M0 -14L4 -4L14 0L4 4L0 14L-4 4L-14 0L-4 -4Z', { fill: CC.atp, stroke: '#c99a2e', 'stroke-width': 1.5 });
    wLabel(sg, 'ATP', { x: 0, y: -20, size: 20, fill: CC.atp, weight: 800, o: 1 });
    const a = -Math.PI / 2 + (i - 2) * .55 + (i % 2 ? Math.PI : 0);
    sparks.push({ g: sg, from: [(wHash(i, 4) - .5) * wi * .6, (wHash(i, 5) - .5) * hi * .4], to: [Math.cos(a) * (w / 2 + 50), Math.sin(a) * (h / 2 + 60)] });
  }
  const A = {
    outer: [0, -h / 2], inner: [fx[0], T + 2], cristae: [fx[2] ?? fx[0], T + D * .7], ims: [-w / 2 + 7, 0],
    matrix: [(fx[2] + fx[3]) / 2 || 0, 0], dna: dnaC, ribosome: rp[0] || [0, 0],
  };
  const mt = Object.assign(g, {
    inner, skin, anchors: A,
    cut(k) { mO(skin, 1 - mClamp(k)); return mt; },
    spark(t, on = 1) {
      sparks.forEach((sp, i) => {
        const ph = cFrac(t * .45 + i / sparks.length), q = io(ph);
        cSet(sp.g, { x: sp.from[0] + (sp.to[0] - sp.from[0]) * q, y: sp.from[1] + (sp.to[1] - sp.from[1]) * q, s: .6 + .5 * ph, o: on * mBump(ph, 0, 1) });
      });
      return mt;
    },
    pt(name) { return cOut(g, A[name] || [0, 0]); },
  });
  return mt;
}

/* ---------- chloroplast ---------- */
function chloroplast(p, { x = 0, y = 0, s = 1, o = 1, w = 440, h = 210, r = 0 } = {}) {
  const g = G(p, { x, y, s, o, r });
  const ell = (rx, ry) => `M${-rx} 0A${rx} ${ry} 0 1 0 ${rx} 0A${rx} ${ry} 0 1 0 ${-rx} 0Z`;
  path(g, ell(w / 2, h / 2), { fill: CC.chloroGap, stroke: CC.chloro, 'stroke-width': 6 });
  path(g, ell(w / 2 - 12, h / 2 - 12), { fill: CC.stroma, stroke: CC.chloro, 'stroke-width': 5 });
  const stacks = [[-.55, .05, 4], [-.28, -.22, 6], [-.02, .18, 5], [.26, -.15, 6], [.52, .1, 4]];
  const cw = w * .13, ch = 11, cg = 3;
  // stroma lamellae joining the grana
  let ld = '';
  for (let i = 0; i < stacks.length - 1; i++) {
    const [a, b] = [stacks[i], stacks[i + 1]];
    ld += `M${cF(a[0] * w / 2 + cw * .3)} ${cF(a[1] * h / 2 + 4)}L${cF(b[0] * w / 2 - cw * .3)} ${cF(b[1] * h / 2 - 4)}`;
    ld += `M${cF(a[0] * w / 2 + cw * .3)} ${cF(a[1] * h / 2 - 10)}L${cF(b[0] * w / 2 - cw * .3)} ${cF(b[1] * h / 2 - 18)}`;
  }
  path(g, ld, { stroke: CC.grana, 'stroke-width': 5 });
  const glows = [], tops = [];
  stacks.forEach(([u, v, n]) => {
    const sx = u * w / 2, sy = v * h / 2, H = n * (ch + cg) - cg, gg = G(g, { x: sx, y: sy - H / 2 });
    for (let j = 0; j < n; j++) mk('rect', { x: -cw / 2, y: j * (ch + cg), width: cw, height: ch, rx: 5, fill: CC.grana, stroke: CC.granaEdge, 'stroke-width': 2 }, gg);
    glows.push(put(mk('rect', { x: -cw / 2 - 4, y: -4, width: cw + 8, height: H + 8, rx: 8, fill: '#e6ff9e' }, gg), { o: 0 }));
    tops.push([sx, sy - H / 2]);
  });
  const ex = G(g);
  path(ex, cDots([[-w * .14, h * .3], [w * .12, h * .32], [w * .38, -h * .26], [-w * .4, -h * .2]]), { stroke: CC.ribo, 'stroke-width': 9 });
  const dnaC = [w * .14, -h * .3];
  let dd = '';
  for (let i = 0; i <= 28; i++) { const a = i / 28 * 2 * Math.PI, rr = 13 + 3 * Math.sin(a * 5); dd += (i ? 'L' : 'M') + cF(dnaC[0] + rr * Math.cos(a)) + ' ' + cF(dnaC[1] + rr * .8 * Math.sin(a)); }
  path(ex, dd + 'Z', { stroke: '#6b5a2e', 'stroke-width': 3 });
  const rays = G(g), rayEls = [];
  [[-.3, -.25], [0, .1], [.28, -.15]].forEach(([u, v], i) => {
    const tx = u * w / 2, ty = v * h / 2 - 20, fx = tx - w * .38, fy = ty - h * .8;
    rayEls.push(path(rays, `M${cF(fx)} ${cF(fy)}L${cF(tx)} ${cF(ty)}`, { stroke: CC.light, 'stroke-width': 7, 'stroke-dasharray': '1 1' }, { d: 0 }));
  });
  const A = { outer: [0, -h / 2], inner: [-w * .2, -h / 2 + 12], stroma: [w * .38, h * .1], granum: tops[1], thylakoid: [tops[3][0], tops[3][1] + 20], dna: dnaC, ribosome: [-w * .14, h * .3] };
  const c = Object.assign(g, {
    anchors: A,
    light(k) {
      rayEls.forEach((e, i) => cSet(e, { d: io(mRamp(k, i * .1, .5 + i * .1)) }));
      glows.forEach((e, i) => mO(e, .45 * mRamp(k, .55 + i * .05, .85 + i * .03)));
      return c;
    },
    pt(name) { return cOut(g, A[name] || [0, 0]); },
  });
  return c;
}

/* ---------- peroxisome ---------- */
function peroxisome(p, { x = 0, y = 0, s = 1, o = 1, r = 110 } = {}) {
  const g = G(p, { x, y, s, o });
  path(g, cBlob(r, r * .94, { seed: 5, wob: .03 }), { fill: CC.peroxFill, stroke: CC.perox, 'stroke-width': 6 });
  const cs = r * .62, core = G(g, { x: r * .2, y: r * .22, r: 18 });
  mk('rect', { x: -cs / 2, y: -cs / 2, width: cs, height: cs, fill: CC.core }, core);
  let gd = '';
  for (let v = -cs / 2 + 8; v < cs / 2; v += 9) gd += `M${cF(-cs / 2)} ${cF(v)}H${cF(cs / 2)}M${cF(v)} ${cF(-cs / 2)}V${cF(cs / 2)}`;
  path(core, gd, { stroke: CC.coreLine, 'stroke-width': 2 });
  // the reaction: 2 H2O2 → 2 H2O + O2
  const rx = G(g);
  const hp = [[-r * .45, -r * .42], [-r * .55, r * .02]].map(([a, b]) => wChem(rx, 'H_2O_2', { x: a, y: b, size: r * .2, fill: '#ffd6a8', weight: 800 }));
  const cat = enzyme(rx, { x: -r * .02, y: -r * .32, R: r * .2, dir: 200, o: 0 });
  const W1 = waterMolecule(rx, { s: r * .0034, face: false, o: 0 }), W2 = waterMolecule(rx, { s: r * .0034, face: false, o: 0, r: 40 });
  const O2 = G(rx, { o: 0 });
  path(O2, `M${-r * .1} 0H${r * .1}`, { stroke: WC.stick, 'stroke-width': 6 });
  wAtom(O2, 'O', { x: -r * .1, r: r * .11, size: r * .1 }); wAtom(O2, 'O', { x: r * .1, r: r * .11, size: r * .1 });
  const labs = [wChem(rx, 'H_2O', { size: r * .17, weight: 700 }), wChem(rx, 'H_2O', { size: r * .17, weight: 700 }), wChem(rx, 'O_2', { size: r * .17, weight: 700 })];
  const mouth = [-r * .02 - r * .14, -r * .32 + r * .05];
  const dest = [[r * .5, -r * .55], [-r * .1, r * .62], [r * .72, -r * .02]];
  const px = Object.assign(g, {
    core,
    react(k) {
      const mk2 = io(mRamp(k, 0, .2)), go = io(mRamp(k, .3, .45));
      hp.forEach((t, i) => { const h0 = [[-r * .45, -r * .42], [-r * .55, r * .02]][i]; cSet(t, { x: h0[0] + (mouth[0] - h0[0]) * go, y: h0[1] + (mouth[1] - h0[1]) * go, o: mk2 * (1 - mRamp(k, .42, .5)), s: 1 - .4 * go }); });
      cSet(cat, { o: mRamp(k, .22, .3) * (1 - mRamp(k, .9, 1)) });
      cat.bite(1 - .8 * mBump(k, .38, .55));
      const out = io(mRamp(k, .48, .8));
      [W1, W2, O2].forEach((e, i) => cSet(e, { x: mouth[0] + (dest[i][0] - mouth[0]) * out, y: mouth[1] + (dest[i][1] - mouth[1]) * out, o: mRamp(k, .45, .52) }));
      labs.forEach((t, i) => cSet(t, { x: dest[i][0], y: dest[i][1] + r * .4, o: mRamp(k, .8, 1) }));
      return px;
    },
    pt(name) { return cOut(g, name === 'core' ? [r * .2, r * .22] : [r * .7, -r * .7]); },
  });
  return px.react(0);
}

/* ---------- nucleus close-up ---------- */
function nucleus(p, { x = 0, y = 0, s = 1, o = 1, R = 240, pores = 10, lamina = true, ribos = true, seed = 3 } = {}) {
  const g = G(p, { x, y, s, o });
  mk('circle', { r: R, fill: CC.nucleo }, g);
  const chromatin = G(g);
  const CH = [[-.38, -.3, 20], [.3, -.4, -35], [.36, .26, 60], [-.32, .34, -15], [-.05, .02, 100], [.05, -.5, 160]];
  CH.forEach(([cx, cy, tr], k) => {
    let dd = ''; const ang = tr * Math.PI / 180, L = R * .7;
    for (let i = 0; i <= 48; i++) {
      const t = i / 48, ax = (t - .5) * L, ay = Math.sin(t * Math.PI * 6 + k) * R * .05 + Math.sin(t * Math.PI * 1.3 + k) * R * .1;
      let px = cx * R + ax * Math.cos(ang) - ay * Math.sin(ang), py = cy * R + ax * Math.sin(ang) + ay * Math.cos(ang);
      const hh = Math.hypot(px, py); if (hh > R * .8) { px *= R * .8 / hh; py *= R * .8 / hh; }
      dd += (i ? 'L' : 'M') + cF(px) + ' ' + cF(py);
    }
    path(chromatin, dd, { stroke: CC.dna, 'stroke-width': Math.max(2.5, R * .017), 'stroke-opacity': .85 });
  });
  const NO = [R * .12, R * .08];
  const nucleolus = G(g, { x: NO[0], y: NO[1] });
  path(nucleolus, cBlob(R * .22, R * .19, { seed: 7, wob: .07 }), { fill: CC.nucleolus, stroke: '#4a6c9c', 'stroke-width': 3 });
  path(nucleolus, cDots([[-R * .07, -R * .04], [R * .06, R * .05], [R * .02, -R * .08], [-R * .03, R * .08]]), { stroke: CC.ribo, 'stroke-width': Math.max(4, R * .03), 'stroke-opacity': .7 });
  const chromosomes = G(g, { o: 0 }), Xs = [];
  [[-.4, -.25, 20], [.38, -.3, -30], [-.3, .4, 70], [.35, .38, -10]].forEach(([u, v, a]) => {
    const xg = G(chromosomes, { x: u * R, y: v * R, r: a, s: 0 }), L = R * .2, wd = R * .055;
    path(xg, `M${-wd} ${-L}Q${-wd * .1} 0 ${-wd} ${L}M${wd} ${-L}Q${wd * .1} 0 ${wd} ${L}`, { stroke: CC.dna, 'stroke-width': wd * 1.5 });
    mk('circle', { r: wd * .7, fill: '#c9b98f' }, xg);
    Xs.push(xg);
  });
  let laminaEl = null;
  if (lamina) {
    let ld = ''; const N = Math.round(R / 5.5), r1 = R - 16, r2 = R - 30;
    for (let i = 0; i <= N; i++) { const a = i / N * 2 * Math.PI, rr = i % 2 ? r2 : r1; ld += (i ? 'L' : 'M') + cF(rr * Math.cos(a)) + ' ' + cF(rr * Math.sin(a)); }
    ld += cCircle(r2) + cCircle(r1);
    laminaEl = path(g, ld, { stroke: '#7f9fd0', 'stroke-width': 2, 'stroke-opacity': .75 });
  }
  const envelope = G(g);
  mk('circle', { r: R - 6, fill: 'none', stroke: '#0b1828', 'stroke-width': 8 }, envelope);
  mk('circle', { r: R, fill: 'none', stroke: CC.env, 'stroke-width': 5 }, envelope);
  mk('circle', { r: R - 12, fill: 'none', stroke: CC.env, 'stroke-width': 5 }, envelope);
  const poreAngles = [];
  for (let i = 0; i < pores; i++) {
    const a = i * 360 / pores + 9, ar = a * Math.PI / 180; poreAngles.push(a);
    const pg = G(envelope, { x: (R - 6) * Math.cos(ar), y: (R - 6) * Math.sin(ar), r: a });
    mk('rect', { x: -12, y: -11, width: 24, height: 22, fill: CC.nucleo }, pg);
    path(pg, 'M-11 -11H11M-11 11H11', { stroke: '#a9c6ea', 'stroke-width': 5 });
    mk('circle', { cx: 0, cy: -11, r: 4, fill: '#a9c6ea' }, pg); mk('circle', { cx: 0, cy: 11, r: 4, fill: '#a9c6ea' }, pg);
  }
  if (ribos) {
    const rp = [];
    const NRB = Math.round(R / 4.2);
    for (let i = 0; i < NRB; i++) {
      const a = i / NRB * 360 + 3;
      if (poreAngles.some(b => Math.abs(((a - b + 540) % 360) - 180) < 6)) continue;
      if (i % 4 === 3) continue;
      rp.push([(R + 8) * Math.cos(a * Math.PI / 180), (R + 8) * Math.sin(a * Math.PI / 180)]);
    }
    path(envelope, cDots(rp), { stroke: CC.ribo, 'stroke-width': 10 });
  }
  const ship = G(g, { o: 0 });
  mk('ellipse', { cy: -6, rx: 13, ry: 9, fill: CC.ribo, stroke: '#6d6390', 'stroke-width': 2 }, ship);
  mk('ellipse', { cx: 18, cy: 6, rx: 10, ry: 6, fill: '#8d82b0', stroke: '#6d6390', 'stroke-width': 2 }, ship);
  const polar = (a, rr) => [rr * Math.cos(a * Math.PI / 180), rr * Math.sin(a * Math.PI / 180)];
  const nu = Object.assign(g, {
    R, envelope, nucleolus, chromatin, chromosomes, lamina: laminaEl, poreAngles,
    condense(k) {
      mO(chromatin, 1 - mRamp(k, 0, .6)); mO(nucleolus, 1 - mRamp(k, .2, .7)); mO(chromosomes, k > 0 ? 1 : 0);
      Xs.forEach((e, i) => cSet(e, { s: io(mRamp(k, .25 + i * .08, .7 + i * .08)) }));
      return nu;
    },
    ship(k, { i = 0 } = {}) {
      const a = poreAngles[i % poreAngles.length], path3 = [NO, polar(a, R - 40), polar(a, R + 14), polar(a, R + 90)];
      const q = cAlong(path3, io(mClamp(k)));
      cSet(ship, { x: q[0], y: q[1], o: k > 0 ? mRamp(k, 0, .08) : 0 });
      return nu;
    },
    pt(name, i = 0) {
      const A = {
        envelope: polar(-60, R), outer: polar(-35, R + 2), inner: polar(-35, R - 13), lamina: polar(150, R - 24),
        pore: polar(poreAngles[i % poreAngles.length], R), nucleolus: NO, chromatin: [-.38 * R, -.3 * R], nucleoplasm: [-.1 * R, .55 * R],
        ribosome: polar(poreAngles[0] + 18, R + 8), chromosome: [-.4 * R, -.25 * R],
      };
      return cOut(g, A[name] || [0, 0]);
    },
  });
  return nu;
}

/* ---------- prokaryote ---------- */
function prokaryote(p, { x = 0, y = 0, s = 1, o = 1, w = 560, h = 220, flagella = 1, fimbriae = true, seed = 4 } = {}) {
  const g = G(p, { x, y, s, o }), parts = {};
  const fl = G(g), fim = G(g, { o: fimbriae ? 1 : 0 });
  if (fimbriae) {
    let fd = '';
    for (let i = 0; i < 46; i++) { const [px, py, nx, ny] = cStadiumPt(w + 44, h + 44, i / 46 + .005); if (px > (w + 44) / 2 - 30 && Math.abs(py) < 40) continue; fd += `M${cF(px)} ${cF(py)}l${cF(nx * 22 + ny * 4)} ${cF(ny * 22 - nx * 4)}`; }
    path(fim, fd, { stroke: '#cfd8e3', 'stroke-width': 3 });
  }
  const cap = path(g, cStadium(w + 44, h + 44), { fill: '#1a3150', stroke: CC.capsule, 'stroke-width': 3, 'stroke-dasharray': '10 7' });
  const wall = path(g, cStadium(w + 16, h + 16), { fill: 'none', stroke: CC.wall, 'stroke-width': 12 });
  const memb = path(g, cStadium(w, h), { fill: CC.cyto, stroke: CC.membrane, 'stroke-width': 5 });
  const rp = [];
  for (let i = 0; i < 46; i++) { const u = wHash(i, seed) * 2 - 1, v = wHash(i, seed + 1) * 2 - 1; const px = u * (w / 2 - 40), py = v * (h / 2 - 22); if (Math.abs(px) < w * .22 && Math.abs(py) < h * .28) continue; const ex = Math.max(0, Math.abs(px) - (w / 2 - h / 2)); if (ex * ex + py * py > (h / 2 - 18) ** 2) continue; rp.push([px, py]); }
  const ribos = path(g, cDots(rp), { stroke: CC.ribo, 'stroke-width': 9 });
  const nuc = G(g), np = [];
  for (let i = 0; i < 70; i++) np.push([w * .21 * Math.sin(i * .31 + seed) * (.55 + .45 * Math.cos(i * .11)), h * .27 * Math.sin(i * .53) * (.55 + .45 * Math.sin(i * .17 + 1))]);
  path(nuc, cSmooth(np), { stroke: CC.dna, 'stroke-width': 3.5 });
  const flag = [];
  for (let i = 0; i < flagella; i++) flag.push(path(fl, '', { stroke: CC.flag, 'stroke-width': 6 }));
  const F0 = [(w + 44) / 2 - 4, 0];
  Object.assign(parts, { capsule: cap, wall, membrane: memb, cytoplasm: memb, nucleoid: nuc, ribosomes: ribos, fimbriae: fim, flagella: fl });
  const A = { capsule: [-w * .3, -h / 2 - 22], wall: [-w * .1, -h / 2 - 8], membrane: [w * .1, -h / 2], cytoplasm: [-w * .3, h * .1], nucleoid: [0, 0], ribosomes: rp[0] || [0, 0], ribosome: rp[0] || [0, 0], fimbriae: [-w * .2, h / 2 + 40], flagella: [F0[0] + 200, 0], flagellum: [F0[0] + 200, 0] };
  const pk = Object.assign(g, {
    parts,
    piece(name) { return parts[name] || parts[name + 's'] || null; },   // not .part: Element.part is the DOM's own
    beat(t) {
      flag.forEach((e, j) => {
        let d = '';
        for (let i = 0; i <= 46; i++) {
          const u = i * 10, amp = Math.min(1, u / 80) * 30, yy = amp * Math.sin(u / 56 - t * 7 + j * 2) + (j ? (j % 2 ? 1 : -1) * u * .25 : 0);
          d += (i ? 'L' : 'M') + cF(F0[0] + u) + ' ' + cF(F0[1] + yy);
        }
        mD(e, d);
      });
      return pk;
    },
    pt(name) { return cOut(g, A[name] || [0, 0]); },
  });
  return pk.beat(0);
}

/* ---------- light microscope and centrifuge tube (concept 6.1) ---------- */
function microscope(p, { x = 0, y = 0, s = 1, o = 1 } = {}) {
  const g = G(p, { x, y, s, o }), body = '#c9d3e0', dark = '#7f8fa6', edge = '#5b6f8c';
  const beam = put(mk('polygon', { points: '-20,-70 20,-70 34,-196 -34,-196', fill: CC.light, 'fill-opacity': .35 }, g), { o: 0 });
  path(g, 'M60 -40C150 -120 150 -300 40 -380', { stroke: body, 'stroke-width': 46 });
  mk('rect', { x: -130, y: -42, width: 260, height: 42, rx: 14, fill: body, stroke: edge, 'stroke-width': 3 }, g);
  mk('rect', { x: -120, y: -210, width: 200, height: 16, rx: 4, fill: dark, stroke: edge, 'stroke-width': 3 }, g);
  mk('rect', { x: -60, y: -216, width: 70, height: 8, rx: 2, fill: '#dfe8f0' }, g);
  mk('circle', { cx: 110, cy: -160, r: 24, fill: dark, stroke: edge, 'stroke-width': 3 }, g);
  mk('circle', { cx: 110, cy: -160, r: 11, fill: body }, g);
  const lamp = mk('circle', { cx: 0, cy: -70, r: 15, fill: '#5d6b80', stroke: edge, 'stroke-width': 3 }, g);
  const glow = put(mk('circle', { cx: 0, cy: -70, r: 15, fill: CC.light }, g), { o: 0 });
  mk('rect', { x: -30, y: -300, width: 70, height: 26, rx: 8, fill: dark, stroke: edge, 'stroke-width': 3 }, g);
  [[-22, 30], [2, 40], [26, 26]].forEach(([ox, L]) => mk('rect', { x: ox - 8, y: -276, width: 16, height: L, rx: 3, fill: body, stroke: edge, 'stroke-width': 2.5 }, g));
  const tube = G(g, { x: 5, y: -300, r: -22 });
  mk('rect', { x: -20, y: -120, width: 40, height: 120, rx: 6, fill: body, stroke: edge, 'stroke-width': 3 }, tube);
  mk('rect', { x: -15, y: -165, width: 30, height: 48, rx: 5, fill: dark, stroke: edge, 'stroke-width': 3 }, tube);
  void lamp;
  const ms = Object.assign(g, {
    lamp(k) { mO(beam, mClamp(k)); mO(glow, mClamp(k)); return ms; },
    pt(name) {
      const A = { eyepiece: cOut(tube, [0, -165]), objective: [2, -236], stage: [-100, -202], lamp: [0, -70] };
      return cOut(g, A[name] || [0, -200]);
    },
  });
  return ms;
}

function centrifugeTube(p, { x = 0, y = 0, s = 1, o = 1, h = 380, w = 96, seed = 6 } = {}) {
  const g = G(p, { x, y, s, o }), r = w / 2, top = -h, level = -h * .8;
  const shape = (yt, ins = 0) => `M${-r + ins} ${yt}V${-r}A${r - ins} ${r - ins} 0 0 0 ${r - ins} ${-r}V${yt}Z`;
  const liquid = path(g, shape(level, 4), { fill: '#4a5d7a', stroke: 'none' });
  const KINDS = [['nuclei', CC.env, 11, 6], ['mitochondria and chloroplasts', CC.mito, 7, 10], ['ER bits', CC.er, 4.5, 14], ['ribosomes', CC.ribo, 2.8, 18]];
  const H = [34, 26, 22, 18];   // band heights, bottom up
  const bands = []; let yb = -4;
  KINDS.forEach((_, i) => { bands.push([yb - H[i], yb]); yb -= H[i]; });
  const parts = [];
  const pl = G(g);
  KINDS.forEach(([name, col, rr, n], i) => {
    for (let j = 0; j < n; j++) {
      const sx = (wHash(j, seed + i * 3) - .5) * (w - 24), sy = level + 16 + wHash(j, seed + i * 3 + 1) * (-level - 40);
      const [b0, b1] = bands[i], ty = b0 + rr + (b1 - b0 - 2 * rr) * wHash(j, seed + i * 3 + 2);
      const half = ty > -r ? Math.sqrt(Math.max(0, (r - 6) ** 2 - (ty + r) ** 2)) : r - 6, tx = (wHash(j, seed + i * 5 + 7) - .5) * 2 * Math.max(4, half - rr);
      const e = mk('circle', { r: rr, fill: col }, pl);
      put(e, { x: sx, y: sy }); parts.push({ e, i, from: [sx, sy], to: [tx, ty] });
    }
  });
  path(g, `M${-r} ${top}V${-r}A${r} ${r} 0 0 0 ${r} ${-r}V${top}`, { stroke: '#a9c2df', 'stroke-width': 5 });
  mk('rect', { x: -r - 8, y: top - 16, width: w + 16, height: 18, rx: 5, fill: '#7f8fa6' }, g);
  const ct = Object.assign(g, {
    kinds: KINDS.map(q => q[0]),
    spin(k) {
      parts.forEach(({ e, i, from, to }) => { const q = io(mRamp(k, .04 + i * .12, .35 + i * .18)); cSet(e, { x: from[0] + (to[0] - from[0]) * q, y: from[1] + (to[1] - from[1]) * q }); });
      cAttr(liquid, 'fill', mix('#4a5d7a', '#24405f', Math.round(mRamp(k, .2, 1) * 20) / 20));
      return ct;
    },
    layerPt(i) { const [b0, b1] = bands[i]; return cOut(g, [r + 6, (b0 + b1) / 2]); },
  });
  return ct;
}

/* ---------- cellMap: the whole eukaryotic cell ---------- */
const C_ALIAS = {
  mitochondrion: 'mitochondria', lysosome: 'lysosomes', peroxisome: 'peroxisomes', chloroplast: 'chloroplasts', vesicle: 'vesicles',
  ribosome: 'ribosomes', plasmaMembrane: 'membrane', cellWall: 'wall', centralVacuole: 'vacuole', plasmodesma: 'plasmodesmata',
  centriole: 'centrosome', centrioles: 'centrosome', cytosol: 'cytoplasm', 'nuclear envelope': 'envelope', nucleoli: 'nucleolus',
};
function cellMap(p, { kind = 'animal', x = 800, y = 450, s = .7, o = 1 } = {}) {
  const plant = kind === 'plant', g = G(p, { x, y, s, o });
  const holders = {}, centres = {}, obstacles = [];
  const part = name => { const h = G(g); holders[name] = h; centres[name] = []; return h; };
  const at = (name, q, rr) => { centres[name].push(q); if (rr) obstacles.push([q[0], q[1], rr]); };
  const RX = 540, RY = 340, PW = 560, PH = 350;
  // the cell body
  const wallG = plant ? part('wall') : null;
  const cyto = part('cytoplasm'), memb = part('membrane');
  if (plant) {
    mk('rect', { x: -PW - 12, y: -PH - 12, width: 2 * PW + 24, height: 2 * PH + 24, rx: 70, fill: 'none', stroke: CC.wall, 'stroke-width': 26 }, wallG);
    mk('rect', { x: -PW - 24, y: -PH - 24, width: 2 * PW + 48, height: 2 * PH + 48, rx: 80, fill: 'none', stroke: CC.lamella, 'stroke-width': 2.5, 'stroke-opacity': .7 }, wallG);
    mk('rect', { x: -PW + 10, y: -PH + 10, width: 2 * PW - 20, height: 2 * PH - 20, rx: 58, fill: CC.cyto }, cyto);
    mk('rect', { x: -PW + 10, y: -PH + 10, width: 2 * PW - 20, height: 2 * PH - 20, rx: 58, fill: 'none', stroke: CC.membrane, 'stroke-width': 6 }, memb);
    at('wall', [-PW * .5, -PH - 12]); at('membrane', [PW * .2, -PH + 10]); at('cytoplasm', [-PW * .45, PH * .55]);
  } else {
    path(cyto, cBlob(RX, RY, { seed: 2 }), { fill: CC.cyto });
    path(memb, cBlob(RX, RY, { seed: 2 }), { stroke: CC.membrane, 'stroke-width': 7 });
    at('membrane', cBlobPt(RX, RY, -1.1, 2)); at('cytoplasm', [-370, 250]);
  }
  const inCell = ([px, py], pad = 30) => plant ? Math.abs(px) < PW - pad - 10 && Math.abs(py) < PH - pad - 10 && !(Math.abs(px) > PW - 70 && Math.abs(py) > PH - 70)
    : (px / (RX * .965 - pad)) ** 2 + (py / (RY * .965 - pad)) ** 2 < 1;
  // the layout
  const L = plant ? {
    N: [-350, -150], NR: 115, er: [30, 135], erR: [150, 182, 214], ser: [-400, 205], golgi: [-130, 245], golgiR: -100,
    ves: [[-40, 230], [-55, 290], [-20, 170]], vac: [140, 15, 340, 225],
    mito: [[100, 285, -6], [-262, 110, 4], [360, 275, 10]], perox: [[25, -262], [480, 292]],
    chloro: [[-120, -270, -4], [170, -265, 6], [455, -180, 62], [462, 160, -70]], centro: null, lyso: [],
  } : {
    N: [-100, -35], NR: 150, er: [-55, 80], erR: [192, 226, 260, 294], ser: [-375, -105], golgi: [300, 140], golgiR: 20,
    ves: [[415, 50], [430, 140], [395, 225], [470, 95]], vac: null,
    mito: [[-245, 225, 15], [350, -165, -25], [120, 268, -5]], perox: [[-300, -235], [240, -270]],
    chloro: [], centro: [-385, 110], lyso: [[-90, 280], [470, -45]],
  };
  // nucleus
  const nuH = part('nucleus');
  const nu = nucleus(nuH, { x: L.N[0], y: L.N[1], R: L.NR, pores: 8, lamina: false, ribos: true });
  at('nucleus', L.N, L.NR + 20);
  centres.envelope = [[L.N[0] + L.NR * .7, L.N[1] - L.NR * .7]]; centres.nucleolus = [[L.N[0] + L.NR * .12, L.N[1] + L.NR * .08]]; centres.chromatin = [[L.N[0] - L.NR * .38, L.N[1] - L.NR * .3]];
  // rough ER: cisternae curving round the nucleus
  const rer = part('roughER');
  {
    let d = ''; const dots = [], [a0, a1] = L.er;
    L.erR.forEach((rr, i) => {
      const pts = [], b0 = a0 + (i % 2) * 6, b1 = a1 - (i % 3) * 7;
      for (let j = 0; j <= 18; j++) { const a = (b0 + (b1 - b0) * j / 18) * Math.PI / 180, wv = rr + 7 * Math.sin(j * 1.3 + i); pts.push([L.N[0] + wv * Math.cos(a), L.N[1] + wv * Math.sin(a)]); }
      d += cSmooth(pts);
      const dense = cResample(pts, 20);
      dense.forEach((q, j) => { for (const sd of [1, -1]) { if ((j + i + (sd > 0 ? 0 : 1)) % 3 === 2) continue; const nn = cNormal(dense, j); dots.push([q[0] + nn[0] * sd * 19, q[1] + nn[1] * sd * 19]); } });
      if (i === 1) at('roughER', pts[9]);
    });
    const ca = (a0 + 12) * Math.PI / 180;
    d += `M${cF(L.N[0] + (L.NR + 4) * Math.cos(ca))} ${cF(L.N[1] + (L.NR + 4) * Math.sin(ca))}L${cF(L.N[0] + L.erR[0] * Math.cos(ca))} ${cF(L.N[1] + L.erR[0] * Math.sin(ca))}`;
    cTube(rer, d, { w: 24, edge: CC.er, lumen: CC.erLumen });
    path(rer, cDots(dots), { stroke: CC.ribo, 'stroke-width': 9 });
    const mr = L.erR[L.erR.length - 1];
    for (let a = L.er[0]; a <= L.er[1]; a += 10) { const ar = a * Math.PI / 180; obstacles.push([L.N[0] + (L.NR + mr) / 2 * Math.cos(ar), L.N[1] + (L.NR + mr) / 2 * Math.sin(ar), (mr - L.NR) / 2 + 22]); }
  }
  // smooth ER
  const ser = part('smoothER');
  {
    const sw = plant ? 190 : 210, sh = sw * .6; let d = '';
    for (const t of C_SMOOTH) d += cSmooth(t.map(([u, v]) => [L.ser[0] + u * sw / 2, L.ser[1] + v * sh / 2]));
    cTube(ser, d, { w: 18, edge: CC.er, lumen: CC.erLumen });
    at('smoothER', [L.ser[0], L.ser[1] - sh * .25], sw * .55);
  }
  // Golgi
  const gH = part('golgi');
  const gol = golgi(gH, { x: L.golgi[0], y: L.golgi[1], s: .52, n: 5 }); put(gol, { r: L.golgiR });
  at('golgi', L.golgi, 95);
  // vesicles
  const vH = part('vesicles');
  L.ves.forEach((q, i) => { vesicle(vH, { x: q[0], y: q[1], r: 13, n: 1 + (i % 2), cargo: i === 3 ? 'lipid' : 'protein', seed: i }); at('vesicles', q, 20); });
  // central vacuole
  if (plant) { const vh = part('vacuole'); vacuole(vh, { x: L.vac[0], y: L.vac[1], w: 2 * L.vac[2], h: 2 * L.vac[3] }); at('vacuole', [L.vac[0], L.vac[1]]); obstacles.push([L.vac[0], L.vac[1], L.vac[3] + 30], [L.vac[0] - 150, L.vac[1], L.vac[3] - 10], [L.vac[0] + 150, L.vac[1], L.vac[3] - 10]); }
  // mitochondria
  const mH = part('mitochondria'), mitos = [];
  L.mito.forEach(([mx, my, mr]) => { mitos.push(mitochondrion(mH, { x: mx, y: my, r: mr, s: .36 })); at('mitochondria', [mx, my], 72); });
  // chloroplasts
  const chloros = [];
  if (plant) { const cH = part('chloroplasts'); L.chloro.forEach(([cx, cy, cr]) => { chloros.push(chloroplast(cH, { x: cx, y: cy, r: cr, s: .32 })); at('chloroplasts', [cx, cy], 75); }); }
  // lysosomes
  const lysos = [];
  if (!plant) { const lH = part('lysosomes'); L.lyso.forEach(q => { lysos.push(lysosome(lH, { x: q[0], y: q[1], r: 60, s: .45, n: 2 })); at('lysosomes', q, 34); }); }
  // peroxisomes
  const pH = part('peroxisomes'), peroxs = [];
  L.perox.forEach(q => { peroxs.push(peroxisome(pH, { x: q[0], y: q[1], s: .22 })); at('peroxisomes', q, 32); });
  // centrosome with its centrioles
  const cyt = part('cytoskeleton');
  if (L.centro) {
    const ch = part('centrosome'), [cx, cy] = L.centro;
    mk('circle', { cx, cy, r: 30, fill: CC.mt, 'fill-opacity': .14 }, ch);
    mk('rect', { x: cx - 18, y: cy - 8, width: 26, height: 13, rx: 3, fill: '#1d4a3c', stroke: CC.mt, 'stroke-width': 3 }, ch);
    mk('rect', { x: cx + 4, y: cy - 4, width: 13, height: 26, rx: 3, fill: '#1d4a3c', stroke: CC.mt, 'stroke-width': 3 }, ch);
    at('centrosome', L.centro, 40);
  }
  // cytoskeleton hint: microtubules from the centrosome (or the nucleus), actin under the membrane, an intermediate filament
  {
    const o0 = L.centro || [L.N[0] - L.NR, L.N[1] + L.NR * .6];
    let md = '';
    [200, 150, 110, 250, 300, 30].forEach((a, i) => { const ar = a * Math.PI / 180; let far = plant ? 160 : 210 + 30 * (i % 2);
      while (far > 40 && !inCell([o0[0] + far * Math.cos(ar), o0[1] + far * Math.sin(ar)], 18)) far -= 10;
      md += `M${cF(o0[0])} ${cF(o0[1])}Q${cF(o0[0] + far * .5 * Math.cos(ar + .2))} ${cF(o0[1] + far * .5 * Math.sin(ar + .2))} ${cF(o0[0] + far * Math.cos(ar))} ${cF(o0[1] + far * Math.sin(ar))}`; });
    path(cyt, md, { stroke: CC.mt, 'stroke-width': 3, 'stroke-opacity': .55 });
    let ad = '';
    for (let i = 0; i <= 30; i++) { const t = -.4 + i / 30 * 1.6, q = plant ? [-PW + 34 + i * 12, PH - 34] : cBlobPt(RX - 22, RY - 22, t, 2); ad += (i ? 'L' : 'M') + cP(q); }
    path(cyt, ad, { stroke: CC.actin, 'stroke-width': 2.5, 'stroke-opacity': .6, 'stroke-dasharray': '7 4' });
    const fd = plant ? 'M-200 -300Q-120 -230 -20 -290' : 'M60 -270Q160 -220 200 -300M-470 -40Q-430 20 -470 80';
    path(cyt, fd, { stroke: CC.ifil, 'stroke-width': 3, 'stroke-opacity': .5 });
    at('cytoskeleton', plant ? [-110, -258] : [-470, 0]);
  }
  // plasmodesmata: channels through the wall
  if (plant) {
    const pd = part('plasmodesmata'); let d = '';
    [[-300, -PH], [250, -PH], [-150, PH], [PW, 0], [-PW, -40]].forEach(([qx, qy]) => {
      if (Math.abs(qy) === PH) d += `M${qx - 6} ${qy - 30 * Math.sign(qy)}V${qy + 30 * Math.sign(qy)}M${qx + 6} ${qy - 30 * Math.sign(qy)}V${qy + 30 * Math.sign(qy)}`;
      else d += `M${qx - 30 * Math.sign(qx)} ${qy - 6}H${qx + 30 * Math.sign(qx)}M${qx - 30 * Math.sign(qx)} ${qy + 6}H${qx + 30 * Math.sign(qx)}`;
    });
    [[-300, -PH], [250, -PH], [-150, PH]].forEach(([qx, qy]) => mk('rect', { x: qx - 4, y: qy - 26, width: 8, height: 52, fill: CC.cyto }, pd));
    [[PW, 0], [-PW, -40]].forEach(([qx, qy]) => mk('rect', { x: qx - 26, y: qy - 4, width: 52, height: 8, fill: CC.cyto }, pd));
    path(pd, d, { stroke: CC.membrane, 'stroke-width': 3 });
    at('plasmodesmata', [250, -PH]);
  }
  // free ribosomes: dots in the open cytosol
  const rH = part('ribosomes'), rp = [];
  for (let i = 0; rp.length < (plant ? 34 : 44) && i < 900; i++) {
    const q = [(wHash(i, 21) * 2 - 1) * (plant ? PW : RX), (wHash(i, 22) * 2 - 1) * (plant ? PH : RY)];
    if (!inCell(q, 22)) continue;
    if (obstacles.some(([ox, oy, orr]) => Math.hypot(q[0] - ox, q[1] - oy) < orr + 6)) continue;
    rp.push(q);
  }
  path(rH, cDots(rp), { stroke: CC.ribo, 'stroke-width': 9 });
  centres.ribosomes = [rp[0] || [0, 0], ...rp.slice(1)];
  // layering: the cytoskeleton and ribosomes under the organelles; the membrane over the cytoplasm
  g.insertBefore(rH, nuH); g.insertBefore(cyt, nuH);
  const ORDER = plant
    ? ['wall', 'membrane', 'cytoplasm', 'vacuole', 'nucleus', 'roughER', 'smoothER', 'golgi', 'vesicles', 'mitochondria', 'chloroplasts', 'peroxisomes', 'ribosomes', 'cytoskeleton', 'plasmodesmata']
    : ['membrane', 'cytoplasm', 'nucleus', 'roughER', 'smoothER', 'golgi', 'vesicles', 'mitochondria', 'lysosomes', 'peroxisomes', 'ribosomes', 'centrosome', 'cytoskeleton'];
  const BASE = new Set(['membrane', 'cytoplasm', 'wall']);
  const KIDS = { nucleus: { envelope: nu.envelope, nucleolus: nu.nucleolus, chromatin: nu.chromatin } };
  const norm = n => C_ALIAS[n] || n;
  let bk = 1, fk = 0, lit = new Set();
  function apply() {
    const nB = ORDER.length;
    ORDER.forEach((name, i) => {
      const h = holders[name]; if (!h) return;
      const t0 = i / nB * .9, bo = io(mRamp(bk, t0, t0 + .16));
      const kids = KIDS[name], anyKid = kids && Object.keys(kids).some(c => lit.has(c));
      const on = lit.size === 0 || lit.has(name) || anyKid, dimTo = BASE.has(name) ? .45 : .16;
      const fo = on ? 1 : 1 - (1 - dimTo) * fk;
      cSet(h, { y: -26 * (1 - bo), o: mRamp(bk, t0, t0 + .1) * fo });
      if (kids) for (const c in kids) cSet(kids[c], { o: anyKid && !lit.has(name) && !lit.has(c) ? 1 - .8 * fk : 1 });
    });
  }
  const cm = Object.assign(g, {
    kind, order: ORDER, nu, mitos, chloros, lysos, peroxs, golgi: gol,
    piece(name) { name = norm(name); return holders[name] || (KIDS.nucleus[name]) || null; },   // not .part (DOM's own)
    focus(names, k = 1) {
      const list = (Array.isArray(names) ? names : [names]).filter(Boolean).map(norm).flatMap(n => n === 'ER' ? ['roughER', 'smoothER'] : [n]);
      lit = new Set(list); fk = mClamp(k); apply(); return cm;
    },
    build(k) { bk = mClamp(k); apply(); return cm; },
    pt(name, i = 0) { name = norm(name); const list = centres[name === 'ER' ? 'roughER' : name] || [[0, 0]]; return cOut(g, list[Math.min(i, list.length - 1)]); },
    label(name, str, { i = 0, at: to, dx, dy, size = 30, color = COL.chalk, layer = p } = {}) {
      name = norm(name);
      const loc = (centres[name === 'ER' ? 'roughER' : name] || [[0, 0]])[Math.min(i, (centres[name] || [[0, 0]]).length - 1)];
      const a = cOut(g, loc);
      let tpos = to;
      if (!tpos && dx !== undefined) tpos = [a[0] + dx, a[1] + (dy || 0)];
      if (!tpos) {
        const L0 = Math.hypot(loc[0], loc[1]) || 1, ux = loc[0] / L0 || 0, uy = loc[1] / L0 || -1;
        const tt = plant ? Math.min((PW + 30) / Math.max(.01, Math.abs(ux)), (PH + 30) / Math.max(.01, Math.abs(uy))) : 1 / Math.sqrt((ux / RX) ** 2 + (uy / RY) ** 2);
        tpos = cOut(g, [ux * (tt + 70), uy * (tt + 70)]);
      }
      return cLabel(layer, a, tpos, str, { size, color });
    },
  });
  apply();
  return cm;
}
