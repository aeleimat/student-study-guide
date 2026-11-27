'use strict';
// Biochemistry: the book's shared kit of amino acids, peptide bonds, chains, protein classes, the secondary,
// tertiary and quaternary structures, bonds, denaturation and misfolding, and the three chapter threads (the amino acid
// card, the protein family tree, the four-levels strip). Loaded after engine.js, water.js and macro.js (it uses
// waterMolecule, wChem, wChemSet, wChemParts; mClamp, mRamp, mBump, mD, mO). It does NOT need metab.js. Note: this book's
// metab.js copy calls helpers from Biology's cell.js and membrane.js (cAttr, cOut, zK, zMix …), which are not in
// site/biochemistry/lib/, so metab.js's enzymeBlob throws unless those are copied in too.
//
// Conventions (as resp.js): every piece is drawn around its own origin with { x, y, s, o } and placed with put. Animated
// pieces have set-style methods that pose everything from their arguments alone: call them every frame from prog(k => …)
// or clockRun(t => …), so play, seek and ?beat=N&t=S draw the same frame. They round their argument (k to 1/2000) and draw
// only from the rounded value; attributes are written only when they change. Setters on one piece combine: each stores
// its own value and redraws the whole piece, so call every setter you use on every frame of the beat (not only inside a
// time window). Most pieces start finished (built, drawn, folded, packed): a page that reveals one calls its setter with 0
// at once. The kit never writes a piece's root o or s (fade it freely; to pulse() a piece placed with s ≠ 1, wrap it in a
// G first: the engine's pulse ends at s 1); only prosthetic().toward writes a root's x and y. Text never cross-fades on
// one spot: NH₂ → NH₃⁺, COOH → COO⁻, a swapped chip or tab value fade fully out before the new text fades in. No
// filters, blurs or clips. Colours: PC, one table from BRIEF.md (amino, carboxyl, ca, h, N, O, S; the structural classes
// simple hydroxy sulfur branched acidic basic aromatic hetero imino (+ amide for asparagine and glutamine, pale pink);
// neutral essential nonEssential semi gluco keto; peptide hbond ss saltMinus saltPlus hydrophobic; primary secondary
// tertiary quaternary helix sheet; nTerm cTerm; simpleP conjugated derived (protein classes); sugar lipid phosphate metal
// heme flavin nucleic; heat acid uv aggregate plaque; …Edge forms). Data: P_AA (pAA(name|'Lys'|'K') → {name, three, one,
// cls, chem, nutr 'essential'|'semi'|'non', fate 'gluco'|'keto'|'both', f (R formula), color}); P_STANDARD (the 20 names).
// The lecture's lists: essential = the 8 + arginine and histidine as 'semi'; ketogenic only leucine, lysine; both phe,
// ile, tyr, trp, thr; the 13 others glucogenic. Internal helpers start with pk (pkK pkSet pkText …) and tables with P_;
// lesson pages must not declare pk- or P_-names of their own.
//
// PIECES (full signatures and setters in the comment above each function; "parent" = the group you passed as p)
//   AMINO ACIDS
//   aminoAcid(p, {aa | r, rClass, shape, down, name})   slide 6's general structure: Cα, NH₂ pill, COOH pill, H, R badge
//       (or the side chain drawn as atoms with shape: true). .parts .ionise .focus .glow .labels .name .counts .hi .setR
//       .rSwap .setAcid .pt
//   aaFormula(p, name, opts)              = aminoAcid with shape: true and its name (structural formula, count tags)
//   sideChain(p, name, {b, down, ion})    one R as atoms, group pills and rings; .ion .hi .mark (proline) .tip .count
//   ring(p, 'benzene'|'indole'|'imidazole'|'pyrrolidine', {b, label, sub})  a ring on its own; .hi .nHi .labels
//   aaChip(p, name, {code, badge, dots, dashed})  a chip in its class colour; .badge .dots .split .half .dash .edge .glow
//   classIcon(p, kind)                    ring, charge, plus, minus, neutral, plate, star, halfStar, cell, glucose, ketone, fork
//   aminoCard(p, {aa})                    THE CHAPTER 1 THREAD: the amino acid on a card with Structural (top), Chemical
//       (right), Nutritional (bottom), Metabolic (left) tabs; .build .focus .glow .fill .setAcid .aa .pt
//   CHAINS AND BONDS
//   peptideBond(p, {a, b})                two amino acids join, water leaves, the orange –CO–NH– forms; .form .hydrolyse
//   beadChain(p, {n | aa | classes | colors, numbers, gap, marks})  the polypeptide: beads, orange links, N and C tags;
//       .reveal .links .ends .numbers .marks .curl .tangle .straighten .cut .swap .glow .bond .lift .focus .readArrow .pt
//   backbone(p, {units, strands, mode})   N–Cα–C atoms with C=O and N–H; 2 strands with their H-bonds; .draw .atoms .rDim
//       .hbonds .hbond .deltas .ends .pt
//   hBondMark(p) .set(x1, y1, x2, y2, k) .deltas .glow   (water.js already has hBond: a different piece)
//   saltBridge(p) .set(minus, plus, k)    disulfideMark(p) .set(a, b, k)
//   cysPair(p, {mode: 'aa'|'chain'})      two cysteines → cystine / an S–S bridge in a chain; .near .bridge .name .glow
//   hydrophobicCore(p)                    non-polar beads gather inside, water pushed out; .fold
//   bondChip(p, kind)                     peptide, disulfide, hydrogen, salt / ionic, hydrophobic icons on cards; .lock .lit
//   SECONDARY, TERTIARY, QUATERNARY
//   alphaHelix(p, {n, r, rise, axis})     right-handed, 100° per residue (3.6 per turn), numbered; .draw .numbers .bonds
//       (n → n + 4) .bond .turnBracket .tilt (axis view) .unwind .glow .pt
//   betaSheet(p, {strands, dir})          broad pleated arrows; .strands .hbonds .anti/.parallel .hairpin .tags .glow .pt
//   pleatSide(p)                          the sheet's zigzag side view; .draw .badges .hbonds
//   globule(p, {R, pocket, beads, mini})  one folded chain; .fold .tangle/.unfold .pocket .partner .lobe .bonds .labels
//       .tint .glow .slotPt .pt .chainPt
//   subunitComplex(p, {n, labels, hemes}) 2–4 subunits; .pack/.apart .contacts .labels .label .hemes .focus .sub .pt
//   hemoglobin(p)                         α₁ α₂ β₁ β₂ with hemes and Fe²⁺
//   misfoldedChain(p) .set .tint          aggregate(p) .clump .plaque (amyloid plaque)
//   levelsStrip(p, {vertical})            THE CHAPTER 3 THREAD: primary → quaternary chevrons; .build .focus/.lit .tags
//       .tick .glow .contents .unfold .pt; pieces .chain .helix .sheet .glob .quat
//   PROTEIN CLASSES
//   proteinTree(p)                        THE CHAPTER 2 THREAD: root chain → simple / conjugated / derived, leaves;
//       .grow .focus .leaves .leafGlow .tick .glow .label .captions .root .pt
//   prosthetic(p, kind, {symbol})         sugar lipid phosphate metal heme flavin nucleic; .label .glow .toward
//   lipoprotein(p, {label})               .core .shell .label .glow     collagenRope(p) .draw .loosen .glow
//
// PLAN NAMES → KIT NAMES (the plans were written apart; use the kit name and its setters)
//   aminoAcid / aaFormula (1.3) / aminoAcidBead (3.2: use beadChain or aaChip) → aminoAcid (setters: .parts = part
//       reveal; .ionise = .ionised / .ionise / .ion; .glow = .lit / .pulseGroup / .glow; .setR = .rLabel; .hi = .hi;
//       .pt(name) = .pos.*; .counts = count badges; .focus = .focus / .dim)
//   cardMap (1.1) / aminoCard (1.2) / aaCard (1.3) / aminoAcidCard (1.4) → aminoCard (.focus = .focus / .lit / .tab(name,
//       'lit'|'dim'); .fill(tab, k, text, color) = .fill / .fillTab / .tab(name, 'filled'); .setAcid; shrink to a corner:
//       move and scale the root yourself, in a wrapper G)
//   rShape / sideChain → sideChain (.hi = highlight(group)); rings / ring glyphs → ring; R badge by class = aminoAcid's
//       badge or aaChip(cls); classColours table → PC + P_CLASS + pClassColor(cls)
//   aaChip (1.1, 1.3, 1.4, 2.2 mini chips) → aaChip (badge 'star' = essential, 'halfStar' semi, 'cell' made here,
//       'plus' / 'minus'; .split = gold / violet halves; .half; .dash = 'dashed'; .edge = selenocysteine rim; drop into a
//       column: move the root yourself)
//   glucoseHex / ketoneFlask / dietIcon → classIcon('glucose' | 'ketone' | 'plate' | 'cell' | 'star')
//   peptideBond (2.1) / peptideForm (3.1) → peptideBond (.form = .join, the water is part of it; .hydrolyse)
//   beadChain / peptideChain / aaChain → beadChain (.reveal, .numbers, .ends, .bond, .swap = .setClass, .glow = .glowAt,
//       .count / .readArrow, .curl, .tangle (shape only, links kept), .straighten, .cut (water adds), .lift, .gap, marks,
//       .focus = .dim)
//   backbone / backboneStrand → backbone (strands: 2 for the antiparallel / parallel pairs)
//   hBond / hbond (plans) → hBondMark (water.js's hBond is a different, older piece); disulfide / disulfideBridge →
//       disulfideMark; disulfideJoin (1.2) / cysPair (3.1) → cysPair; hydrophobicCore / hydrophobicCluster → hydrophobicCore
//       (a cluster in a picture: a few pkBall-like beads in PC.hydrophobic, or globule .bonds({core})); bondGlyph /
//       bond chips → bondChip (card: false for the bare glyph)
//   helix → alphaHelix (.number = .numbers; .rotate = .tilt); sheet / betaSheet → betaSheet; pleat side view → pleatSide
//   foldedGlobule / globule / proteinBlob / foldChain / foldedProtein → globule (.fold, .tangle = .unfold / .wobble
//       (partial), .tint, .pocket = .notch, .partner, .lobe, .bonds, .slotPt = passenger slots; sideChainPatch: page-local)
//   quaternary(n) / subunitComplex → subunitComplex; hemoglobinTetramer → hemoglobin
//   misfoldedChain, aggregate → misfoldedChain, aggregate (.clump; .plaque)
//   levelStrip / levelsStrip / fourLevelsStrip → levelsStrip (.lit = .focus; .light(i, k) = .glow + .tags;
//       .fill = .build; empty frames = .contents(0); .small: move and scale the root yourself; vertical: true)
//   proteinTree / familyTree → proteinTree (.light = .focus, .fill(branch, k) = .leaves, .dim(f) = fade the root)
//   prostheticIcon → prosthetic (.attach(blob, t) = .toward(glob.slotPt(i), k)); lipoproteinParticle → lipoprotein;
//   collagenRope → collagenRope (u: .loosen)
//   Left page-local (one lesson each): groupCounter, cmpSign, chipBin, classColumns, metabolicFork, foodIcons, eggFry,
//   the blood-vessel strip, sideChainPatch, effect rows, case card, brain outline.

/* ---------- colours (BRIEF.md "Colour meanings", one table) ---------- */
const PC = {
  // the amino acid
  amino: '#6c8cff', aminoEdge: '#3d56b8', carboxyl: '#ff7aa8', carboxylEdge: '#b8436c', ca: '#9aa3ad', caEdge: '#5f6873',
  h: '#f4f4f0', hEdge: '#b9b9b0', N: '#6c8cff', NEdge: '#3d56b8', O: '#e5533d', OEdge: '#a83322', S: '#e9d045', SEdge: '#a8922a',
  C: '#7d8794', CEdge: '#4f5864', Se: '#f0a35a', SeEdge: '#a8692e', ink: '#0f1e33', stick: '#cfd3d8',
  // side chain R by structural class
  simple: '#f3c95c', hydroxy: '#7fd1b9', sulfur: '#e9d045', branched: '#e8a87c', acidic: '#ff7aa8', basic: '#6c8cff',
  aromatic: '#bba8ee', hetero: '#8fd6b0', imino: '#f0b45a', amide: '#f7b6cc', generic: '#f3c95c',
  // chemical, nutritional, metabolic
  neutral: '#f2efe6', essential: '#ffd27a', nonEssential: '#7fd1b9', semi: '#ffd27a', gluco: '#f3c95c', keto: '#9a6cd0',
  // bonds
  peptide: '#f39a2b', hbond: '#5fd3e8', ss: '#e9d045', saltMinus: '#ff7aa8', saltPlus: '#6c8cff', hydrophobic: '#c9b27a',
  hydrophobicEdge: '#8f7a48', water: '#5fa8e8',
  // structure levels, helix and sheet
  primary: '#f3c95c', secondary: '#5fd3e8', tertiary: '#8fd6b0', quaternary: '#bba8ee', helix: '#5fd3e8', helixBack: '#2f7f8f',
  sheet: '#5fd3e8', sheetEdge: '#2f8fa0', ribbon: '#8fd6b0', ribbonEdge: '#4f9a78',
  // chain ends
  nTerm: '#6c8cff', cTerm: '#ff7aa8',
  // protein classes (chapter 2) and prosthetic groups
  simpleP: '#8fd6b0', conjugated: '#bba8ee', derived: '#f0b45a', sugar: '#f3c95c', sugarEdge: '#b8902e', lipid: '#e9c46a',
  lipidEdge: '#a8862c', phosphate: '#bba8ee', phosphateEdge: '#8a74cf', metal: '#4fa3a5', metalEdge: '#2a6668', heme: '#d9534f',
  hemeEdge: '#8f2a26', flavin: '#f5e05a', flavinEdge: '#b0a02a', nucleic: '#e9dcc0', nucleicEdge: '#a89a78',
  globule: '#8fd6b0', globuleEdge: '#4f9a78',
  // denaturing agents, misfolding
  heat: '#f39a2b', acid: '#ff7aa8', uv: '#9a6cd0', aggregate: '#8a7a6a', aggregateEdge: '#5e5246', plaque: '#9c6a1e', plaqueEdge: '#6a4510',
  // ui
  card: '#14233a', cardEdge: '#3a5578', tab: '#172a45', dim: '#8f9bb0', good: '#5bbf5b', glow: '#fff6d8',
};
// class key → [colour, name shown]. Rings: aromatic benzene, hetero indole / imidazole, imino pyrrolidine.
const P_CLASS = {
  simple: [PC.simple, 'simple'], hydroxy: [PC.hydroxy, 'hydroxy'], sulfur: [PC.sulfur, 'sulfur-containing'],
  branched: [PC.branched, 'branched-chain'], acidic: [PC.acidic, 'acidic'], amide: [PC.amide, 'amide'], basic: [PC.basic, 'basic'],
  aromatic: [PC.aromatic, 'aromatic'], hetero: [PC.hetero, 'heterocyclic'], imino: [PC.imino, 'imino'], generic: [PC.generic, 'side chain'],
};
const pClassColor = c => (P_CLASS[c] || P_CLASS.generic)[0];
// The amino acids (lecture lists). cls structural, chem neutral|acidic|basic, nutr essential|semi|non (arginine and
// histidine: 'semi', the lecture also counts them in its essential ten), fate gluco|keto|both, f the R formula (wChem markup).
const P_AA = {};
[
  ['glycine', 'Gly', 'G', 'simple', 'neutral', 'non', 'gluco', 'H'],
  ['alanine', 'Ala', 'A', 'simple', 'neutral', 'non', 'gluco', 'CH_3'],
  ['serine', 'Ser', 'S', 'hydroxy', 'neutral', 'non', 'gluco', 'CH_2OH'],
  ['threonine', 'Thr', 'T', 'hydroxy', 'neutral', 'essential', 'both', 'CH(OH)CH_3'],
  ['cysteine', 'Cys', 'C', 'sulfur', 'neutral', 'non', 'gluco', 'CH_2SH'],
  ['cystine', 'Cys–Cys', '', 'sulfur', 'neutral', 'non', 'gluco', 'CH_2S–SCH_2'],
  ['methionine', 'Met', 'M', 'sulfur', 'neutral', 'essential', 'gluco', 'CH_2CH_2SCH_3'],
  ['valine', 'Val', 'V', 'branched', 'neutral', 'essential', 'gluco', 'CH(CH_3)_2'],
  ['leucine', 'Leu', 'L', 'branched', 'neutral', 'essential', 'keto', 'CH_2CH(CH_3)_2'],
  ['isoleucine', 'Ile', 'I', 'branched', 'neutral', 'essential', 'both', 'CH(CH_3)CH_2CH_3'],
  ['aspartic acid', 'Asp', 'D', 'acidic', 'acidic', 'non', 'gluco', 'CH_2COOH'],
  ['glutamic acid', 'Glu', 'E', 'acidic', 'acidic', 'non', 'gluco', 'CH_2CH_2COOH'],
  ['asparagine', 'Asn', 'N', 'amide', 'neutral', 'non', 'gluco', 'CH_2CONH_2'],
  ['glutamine', 'Gln', 'Q', 'amide', 'neutral', 'non', 'gluco', 'CH_2CH_2CONH_2'],
  ['lysine', 'Lys', 'K', 'basic', 'basic', 'essential', 'keto', '(CH_2)_4NH_2'],
  ['arginine', 'Arg', 'R', 'basic', 'basic', 'semi', 'gluco', '(CH_2)_3NHC(NH)NH_2'],
  ['histidine', 'His', 'H', 'hetero', 'basic', 'semi', 'gluco', 'CH_2–imidazole'],
  ['phenylalanine', 'Phe', 'F', 'aromatic', 'neutral', 'essential', 'both', 'CH_2C_6H_5'],
  ['tyrosine', 'Tyr', 'Y', 'aromatic', 'neutral', 'non', 'both', 'CH_2C_6H_4OH'],
  ['tryptophan', 'Trp', 'W', 'hetero', 'neutral', 'essential', 'both', 'CH_2–indole'],
  ['proline', 'Pro', 'P', 'imino', 'neutral', 'non', 'gluco', 'ring to N'],
  ['selenocysteine', 'Sec', 'U', 'sulfur', 'neutral', 'non', 'gluco', 'CH_2SeH'],
].forEach(([name, three, one, cls, chem, nutr, fate, f]) => {
  const v = { name, three, one, cls, chem, nutr, fate, f, color: pClassColor(cls) };
  P_AA[name] = v; P_AA[three.toLowerCase()] = v; if (one) P_AA[one] = v;
  P_AA[name.split(' ')[0]] = v;                                     // 'aspartic', 'glutamic'
});
// look an amino acid up by name, three-letter or one-letter code ('lysine', 'Lys', 'lys', 'K'); null if unknown
const pAA = n => (n == null ? null : P_AA[n] || P_AA[String(n).toLowerCase()] || null);
const P_STANDARD = ['glycine', 'alanine', 'serine', 'threonine', 'cysteine', 'methionine', 'valine', 'leucine', 'isoleucine',
  'aspartic acid', 'glutamic acid', 'asparagine', 'glutamine', 'lysine', 'arginine', 'histidine', 'phenylalanine', 'tyrosine',
  'tryptophan', 'proline'];

/* ---------- helpers (prefix pk; tables P_) ---------- */
const pkK = k => Math.round(mClamp(+k || 0) * 2000) / 2000;                 // a progress, clamped and rounded
const pkT = t => Math.round((+t || 0) * 120) / 120;                         // seconds, rounded to 1/120
const pkU = u => { const v = +u || 0; return Math.round((v - Math.floor(v)) * 2000) / 2000; };   // a looping phase
const pkL = (a, b, k) => a + (b - a) * k;
const pkL2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const pkSS = v => { const c = mClamp(v); return c * c * (3 - 2 * c); };
const pkR = (k, a, b) => pkSS(mRamp(k, a, b));                             // eased ramp 0 → 1 between a and b
const pkMix = (a, b, k) => mix(a, b, Math.round(mClamp(k) * 20) / 20);
const pkRad = a => a * Math.PI / 180;
const pkF = v => (Math.round(v * 10) / 10).toString();
const pkP = ([x, y]) => pkF(x) + ' ' + pkF(y);
const pkHash = (i, k = 0) => { const v = Math.sin(i * 127.1 + k * 311.7 + 17.3) * 43758.5453; return v - Math.floor(v); };
const pkRound = (k, v) => k === 'o' || k === 's' || k === 'd' ? Math.round(v * 1000) / 1000 : Math.round(v * 10) / 10;
// put only what changed, rounded; a moved element never falls back to the identity transform (the engine would drop
// its transform attribute and add it back after opacity, and a played and a seeked frame would differ in markup)
function pkSet(e, v) {
  const s0 = st(e), nv = {};
  for (const k in v) nv[k] = pkRound(k, v[k]);
  const x = 'x' in nv ? nv.x : s0.x, y = 'y' in nv ? nv.y : s0.y, s = 's' in nv ? nv.s : s0.s, r = 'r' in nv ? nv.r : s0.r;
  if (('x' in nv || 'y' in nv || 's' in nv || 'r' in nv) && !x && !y && s === 1 && !r) { nv.s = .999; e._pkg = 1; }
  else if (e._pkg && !('s' in nv) && (x || y || r)) { nv.s = 1; e._pkg = 0; }   // undo the nudge once it has moved off
  let ch = false; for (const k in nv) if (s0[k] !== nv[k]) { ch = true; break; }
  if (ch) put(e, nv);
  return e;
}
const pkO = (e, o) => mO(e, o);
const pkD = (e, d) => mD(e, d);
function pkA(e, name, val) { if (e['_p' + name] !== val) { e.setAttribute(name, val); e['_p' + name] = val; } return e; }
function pkTx(e, str) { return wChemSet(e, String(str)); }
function pkText(p, str, { x = 0, y = 0, size = 26, fill = COL.chalk, anchor = 'middle', weight = 700, o = 1 } = {}) {
  return wChem(p, String(str), { x, y, size, fill, anchor, weight, o });
}
// a rough text width (no layout needed): wChem markup counts sub/superscripts at .64
function pkTW(str, size) {
  let w = 0; for (const [s, k] of wChemParts(String(str))) w += s.length * (k === 'n' ? 1 : .64);
  return w * size * .6;
}
// a measured text width (canvas, the UI font at this weight; sub/superscripts at .64), rounded to 1 px and cached
// per string, so a played and a seeked frame size a pill alike; falls back to pkTW if nothing can be measured
const P_TWC = new Map();
function pkMeasure(str, size, weight = 800) {
  const key = weight + '|' + size + '|' + str;
  if (P_TWC.has(key)) return P_TWC.get(key);
  let w = 0;
  try { for (const [t2, k] of wChemParts(String(str))) { ctx2d.font = `${weight} ${k === 'n' ? size : size * .64}px ${UI}`; w += ctx2d.measureText(t2).width; } } catch (e) { w = 0; }
  w = Math.round(w > 0 ? w : pkTW(str, size));
  P_TWC.set(key, w);
  return w;
}
function pkRect(w, h, r, cx = 0, cy = 0) {
  r = Math.min(r, w / 2, h / 2);
  const L = cx - w / 2, R = cx + w / 2, Tp = cy - h / 2, B = cy + h / 2;
  return `M${pkF(L + r)} ${pkF(Tp)}H${pkF(R - r)}Q${pkF(R)} ${pkF(Tp)} ${pkF(R)} ${pkF(Tp + r)}V${pkF(B - r)}Q${pkF(R)} ${pkF(B)} ${pkF(R - r)} ${pkF(B)}H${pkF(L + r)}Q${pkF(L)} ${pkF(B)} ${pkF(L)} ${pkF(B - r)}V${pkF(Tp + r)}Q${pkF(L)} ${pkF(Tp)} ${pkF(L + r)} ${pkF(Tp)}Z`;
}
const pkCirc = (r, cx = 0, cy = 0) => `M${pkF(cx - r)} ${pkF(cy)}a${pkF(r)} ${pkF(r)} 0 1 0 ${pkF(2 * r)} 0a${pkF(r)} ${pkF(r)} 0 1 0 ${pkF(-2 * r)} 0Z`;
const pkPoly = (pts, close = false) => pts.length ? 'M' + pts.map(pkP).join('L') + (close ? 'Z' : '') : 'M0 0';
// n-gon corner points, radius R, first corner at angle a0 (degrees, SVG: 90 = down)
const pkNgon = (n, R, a0 = -90, cx = 0, cy = 0) => Array.from({ length: n }, (_, i) => { const a = pkRad(a0 + i * 360 / n); return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; });
// a smooth path through points (quadratic through the midpoints)
function pkSmooth(pts, closed = false) {
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], n = pts.length;
  if (n < 3) return pkPoly(pts, closed);
  if (closed) {
    let d = 'M' + pkP(mid(pts[n - 1], pts[0]));
    for (let i = 0; i < n; i++) d += 'Q' + pkP(pts[i]) + ' ' + pkP(mid(pts[i], pts[(i + 1) % n]));
    return d + 'Z';
  }
  let d = 'M' + pkP(pts[0]);
  for (let i = 1; i < n - 1; i++) d += 'Q' + pkP(pts[i]) + ' ' + pkP(mid(pts[i], pts[i + 1]));
  return d + 'L' + pkP(pts[n - 1]);
}
// a wobbly closed outline round (0, 0)
function pkBlob(rx, ry, seed = 1, wob = .06, n = 48, cx = 0, cy = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / n * 2 * Math.PI, k = 1 + wob * (Math.sin(3 * t + seed) + .6 * Math.sin(5 * t + 2.3 * seed) + .35 * Math.sin(2 * t + 4.1 * seed));
    pts.push([cx + rx * k * Math.cos(t), cy + ry * k * Math.sin(t)]);
  }
  return pkSmooth(pts, true);
}
// a point in group g's frame → its parent's (translate, rotate, scale)
function pkOut(g, [lx, ly]) {
  const { x, y, s, r } = st(g), a = (r || 0) * Math.PI / 180;
  return [x + s * (lx * Math.cos(a) - ly * Math.sin(a)), y + s * (lx * Math.sin(a) + ly * Math.cos(a))];
}
// arrow shaft and head as two path strings
function pkArrowD(x1, y1, x2, y2, head = 16) {
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, h = Math.min(head, L * .6);
  const bx = x2 - ux * h, by = y2 - uy * h;
  return [`M${pkF(x1)} ${pkF(y1)}L${pkF(x2 - ux * h * .8)} ${pkF(y2 - uy * h * .8)}`,
    `M${pkF(bx - uy * h * .62)} ${pkF(by + ux * h * .62)}L${pkF(x2)} ${pkF(y2)}L${pkF(bx + uy * h * .62)} ${pkF(by - ux * h * .62)}Z`];
}
// a movable straight arrow: .set(x1, y1, x2, y2, k = 1) (drawn k of the way), .color(c)
function pkArrow(p, { color = COL.chalk, w = 5, head = 16, o = 1, dash } = {}) {
  const g = G(p, { o });
  const sh = path(g, 'M0 0', { stroke: color, 'stroke-width': w, ...(dash ? { 'stroke-dasharray': dash } : {}) });
  const hd = path(g, 'M0 0', { fill: color, stroke: color, 'stroke-width': 2 });
  const a = Object.assign(g, {
    sh, hd,
    set(x1, y1, x2, y2, k = 1) {
      const kk = Math.max(.02, k), ex = x1 + (x2 - x1) * kk, ey = y1 + (y2 - y1) * kk, [s1, s2] = pkArrowD(x1, y1, ex, ey, head);
      pkD(sh, s1); pkD(hd, s2); pkO(sh, k > 0 ? 1 : 0); pkO(hd, k > 0 ? 1 : 0); return a;
    },
    color(c) { pkA(sh, 'stroke', c); pkA(hd, 'fill', c); pkA(hd, 'stroke', c); return a; },
  });
  return a;
}
// parts that build in order and focus (lit / dimmed to .25): entries [name, group(s), inBuild=true]; aliases map a
// name to several; extra(name) multiplies a part's opacity (for parts shown by their own setters)
function pkParts(entries, aliases = {}, dimTo = .25) {
  const order = entries.filter(e => e[2] !== false).map(e => e[0]), N = order.length;
  const groups = {}; entries.forEach(([n, gs]) => { groups[n] = Array.isArray(gs) ? gs : [gs]; });
  let bk = 1, lit = null, fk = 0;
  const expand = nm => {
    if (nm == null) return [];
    if (aliases[nm]) return aliases[nm].flatMap(expand);
    if (nm === 'all') return Object.keys(groups);
    return [nm];
  };
  return {
    order, groups,
    setBuild(k) { bk = pkK(k); },
    setFocus(names, k = 1) { const L = (Array.isArray(names) ? names : [names]).flatMap(expand); lit = L.length ? new Set(L) : null; fk = pkK(k); },
    b(name) { const i = order.indexOf(name); return i < 0 ? 1 : mRamp(bk * N - i, 0, 1); },
    f(name) { return lit ? (lit.has(name) ? 1 : 1 - (1 - dimTo) * fk) : 1; },
    lit(name) { return !lit || lit.has(name); },
    apply(extra = () => 1) { for (const n in groups) { const v = this.b(n) * this.f(n) * extra(n); groups[n].forEach(g => pkO(g, v)); } },
    kOf(name) { const i = order.indexOf(name); return i < 0 ? 0 : (i + 1) / N; },
  };
}
// a shiny ball (atom or bead) drawn at (cx, cy) in g
function pkBall(g, r, fill, edge, { cx = 0, cy = 0, letter = '', size, ink = PC.ink, sw = 2.5 } = {}) {
  const c = mk('circle', { cx: pkF(cx), cy: pkF(cy), r: pkF(r), fill, stroke: edge, 'stroke-width': sw }, g);
  mk('ellipse', { cx: pkF(cx - r * .35), cy: pkF(cy - r * .4), rx: pkF(r * .32), ry: pkF(r * .2), fill: '#fff', 'fill-opacity': .4 }, g);
  const t = letter ? pkText(g, letter, { x: cx, y: cy + (size ?? r * 1.05) * .36, size: size ?? r * 1.05, fill: ink, weight: 800 }) : null;
  return { c, t };
}
// a chip: rounded pill with markup text; returns { g, bg, tx, w }
function pkPill(p, str, { x = 0, y = 0, h = 30, size = 20, fill = PC.card, edge = COL.dim, ink = COL.chalk, w, pad = 14, sw = 2.5, weight = 800 } = {}) {
  const g = G(p, { x, y }), W = w ?? Math.max(h, pkTW(str, size) + 2 * pad);
  const bg = path(g, pkRect(W, h, h / 2), { fill, stroke: edge, 'stroke-width': sw });
  const tx = pkText(g, str, { y: size * .36, size, fill: ink, weight });
  return { g, bg, tx, w: W, h };
}
// a small charge badge ("+" indigo, "−" pink) centred at (x, y)
function pkCharge(p, sign, { x = 0, y = 0, r = 11, o = 1 } = {}) {
  const g = G(p, { x, y, o }), plus = sign === '+';
  mk('circle', { r: pkF(r), fill: plus ? PC.basic : PC.acidic, stroke: PC.ink, 'stroke-width': 2 }, g);
  path(g, plus ? `M${-r * .55} 0H${r * .55}M0 ${-r * .55}V${r * .55}` : `M${-r * .55} 0H${r * .55}`, { stroke: PC.ink, 'stroke-width': Math.max(2, r * .26) });
  return g;
}
// a glow ring (o 0) behind a part
const pkHalo = (p, r, color = PC.glow, cx = 0, cy = 0) => { const h = mk('circle', { cx: pkF(cx), cy: pkF(cy), r: pkF(r), fill: color, 'fill-opacity': .28, stroke: color, 'stroke-width': 3, 'stroke-opacity': .8 }, p); put(h, { o: 0 }); return h; };
// a green tick at (x, y), o 0
function pkTick(p, { x = 0, y = 0, s = 1 } = {}) {
  const g = G(p, { x, y, s, o: 0 });
  mk('circle', { r: 17, fill: PC.good, stroke: '#2f7a2f', 'stroke-width': 2.5 }, g);
  path(g, 'M-8 0L-2 7L9 -7', { stroke: '#fff', 'stroke-width': 4.5 });
  return g;
}

/* ---------- side chains and rings ---------- */
// Geometry in bond units (1 = one bond), y up negative, origin = where the bond from Cα arrives.
const pkZ = k => [((k + 1) % 2) * .6, -1 - .8 * (k - 1)];             // zigzag chain atom k (1 = Cβ)
const P_R5 = .5 / Math.sin(Math.PI / 5);                               // pentagon circumradius for side 1
// ring templates: verts (local), attach vertex, outward direction there, N marks {i: 'NH'|'N'}, aromatic, fused
const P_RINGS = {
  benzene: () => ({ polys: [pkNgon(6, 1, -90)], at: [0, 1], u: [0, 1], N: {}, arom: [true], top: [0, -1] }),
  indole: () => {
    const pent = [-36, 36, 108, 180, 252].map(a => [P_R5 * Math.cos(pkRad(a)), P_R5 * Math.sin(pkRad(a))]);
    const cx = P_R5 * Math.cos(pkRad(36)) + Math.sqrt(3) / 2, hex = pkNgon(6, 1, 30, cx, 0);
    const a = pent[4], L = Math.hypot(a[0], a[1]);
    return { polys: [pent, hex], at: a, u: [a[0] / L, a[1] / L], N: { '0:2': 'NH' }, arom: [false, true] };
  },
  imidazole: () => {
    const pent = [90, 162, 234, 306, 18].map(a => [P_R5 * Math.cos(pkRad(a)), P_R5 * Math.sin(pkRad(a))]);
    return { polys: [pent], at: pent[0], u: [0, 1], N: { '0:1': 'Nplus', '0:3': 'NH' }, arom: [false] };
  },
  pyrrolidine: () => {
    const pent = [54, 126, 198, 270, 342].map(a => [P_R5 * Math.cos(pkRad(a)), P_R5 * Math.sin(pkRad(a))]);
    return { polys: [pent], at: pent[0], u: null, N: { '0:1': 'NH' }, arom: [false], ca: 0 };
  },
};
// side-chain specs: nodes [id, kind, [x, y]], bonds [a, b, order]; ring: [kind, from-node] attaches a ring above it
const P_SIDE = {
  glycine: { nodes: [['h', 'H', [0, -.8]]], bonds: [['o', 'h']] },
  alanine: { nodes: [['c1', 'C', pkZ(1)]], bonds: [['o', 'c1']] },
  serine: { nodes: [['c1', 'C', pkZ(1)], ['g', 'OH', [.75, -2]]], bonds: [['o', 'c1'], ['c1', 'g']] },
  threonine: { nodes: [['c1', 'C', pkZ(1)], ['g', 'OH', [-.95, -1.75]], ['c2', 'C', [.8, -1.6]]], bonds: [['o', 'c1'], ['c1', 'g'], ['c1', 'c2']] },
  cysteine: { nodes: [['c1', 'C', pkZ(1)], ['g', 'SH', [.75, -2]]], bonds: [['o', 'c1'], ['c1', 'g']] },
  selenocysteine: { nodes: [['c1', 'C', pkZ(1)], ['g', 'SeH', [.75, -2]]], bonds: [['o', 'c1'], ['c1', 'g']] },
  methionine: { nodes: [['c1', 'C', pkZ(1)], ['c2', 'C', pkZ(2)], ['s', 'S', pkZ(3)], ['c3', 'C', pkZ(4)]], bonds: [['o', 'c1'], ['c1', 'c2'], ['c2', 's'], ['s', 'c3']] },
  valine: { nodes: [['c1', 'C', pkZ(1)], ['c2', 'C', [-.8, -1.6]], ['c3', 'C', [.8, -1.6]]], bonds: [['o', 'c1'], ['c1', 'c2'], ['c1', 'c3']] },
  leucine: { nodes: [['c1', 'C', pkZ(1)], ['c2', 'C', pkZ(2)], ['c3', 'C', [-.1, -2.55]], ['c4', 'C', [1.4, -2.4]]], bonds: [['o', 'c1'], ['c1', 'c2'], ['c2', 'c3'], ['c2', 'c4']] },
  isoleucine: { nodes: [['c1', 'C', pkZ(1)], ['c2', 'C', [-.8, -1.6]], ['c3', 'C', [.6, -1.8]], ['c4', 'C', [.6, -2.8]]], bonds: [['o', 'c1'], ['c1', 'c2'], ['c1', 'c3'], ['c3', 'c4']] },
  'aspartic acid': { nodes: [['c1', 'C', pkZ(1)], ['g', 'COOH', [.75, -2.05]]], bonds: [['o', 'c1'], ['c1', 'g']] },
  'glutamic acid': { nodes: [['c1', 'C', pkZ(1)], ['c2', 'C', pkZ(2)], ['g', 'COOH', [0, -2.9]]], bonds: [['o', 'c1'], ['c1', 'c2'], ['c2', 'g']] },
  asparagine: { nodes: [['c1', 'C', pkZ(1)], ['g', 'CONH2', [.75, -2.05]]], bonds: [['o', 'c1'], ['c1', 'g']] },
  glutamine: { nodes: [['c1', 'C', pkZ(1)], ['c2', 'C', pkZ(2)], ['g', 'CONH2', [0, -2.9]]], bonds: [['o', 'c1'], ['c1', 'c2'], ['c2', 'g']] },
  lysine: { nodes: [['c1', 'C', pkZ(1)], ['c2', 'C', pkZ(2)], ['c3', 'C', pkZ(3)], ['c4', 'C', pkZ(4)], ['g', 'NH2', [0, -4.5]]], bonds: [['o', 'c1'], ['c1', 'c2'], ['c2', 'c3'], ['c3', 'c4'], ['c4', 'g']] },
  arginine: { nodes: [['c1', 'C', pkZ(1)], ['c2', 'C', pkZ(2)], ['c3', 'C', pkZ(3)], ['n', 'N', pkZ(4)], ['cz', 'C', [0, -4.25]], ['g2', 'NH2n', [-1.15, -5.0]], ['g', 'NH', [1.2, -5.0]]],
    bonds: [['o', 'c1'], ['c1', 'c2'], ['c2', 'c3'], ['c3', 'n'], ['n', 'cz'], ['cz', 'g2'], ['cz', 'g', 2]] },
  phenylalanine: { nodes: [['c1', 'C', pkZ(1)]], bonds: [['o', 'c1']], ring: ['benzene', 'c1'] },
  tyrosine: { nodes: [['c1', 'C', pkZ(1)]], bonds: [['o', 'c1']], ring: ['benzene', 'c1'], ringTop: 'OH' },
  tryptophan: { nodes: [['c1', 'C', pkZ(1)]], bonds: [['o', 'c1']], ring: ['indole', 'c1'] },
  histidine: { nodes: [['c1', 'C', pkZ(1)]], bonds: [['o', 'c1']], ring: ['imidazole', 'c1'] },
  proline: { nodes: [], bonds: [], ring: ['pyrrolidine', 'o'] },
};
// pill groups: [text, ionised text, fill, ink, charge]
const P_GROUP = {
  COOH: ['COOH', 'COO^−', PC.carboxyl, PC.ink, '−'], NH2: ['NH_2', 'NH_3^+', PC.amino, PC.ink, '+'], NH: ['=NH', '=NH_2^+', PC.amino, PC.ink, '+'],
  NH2n: ['NH_2', 'NH_2', PC.amino, PC.ink, ''], OH: ['OH', 'OH', PC.O, '#fff', ''], SH: ['SH', 'SH', PC.S, PC.ink, ''], SeH: ['SeH', 'SeH', PC.Se, PC.ink, ''], CONH2: ['CONH_2', 'CONH_2', PC.amide, PC.ink, ''],
};
// the group name a kind belongs to (for .hi)
const P_HI = { COOH: 'COOH', NH2: 'NH2', NH2n: 'NH2', NH: 'NH2', OH: 'OH', SH: 'SH', SeH: 'SH', CONH2: 'CONH2', S: 'S', N: 'N', C: 'C', H: 'H' };

// sideChain(p, name, {x, y, s, o, b=34, down=false, ion=0, ca=true}): one amino acid's R drawn as atoms (grey C
// beads, blue N, red O, yellow S, white H), coloured pills for the groups that matter (COOH pink, NH₂ indigo, OH red,
// SH yellow, CONH₂ pale pink, =NH indigo) and rings as polygons in the class colour (benzene with its aromatic circle,
// indole = pentagon + hexagon, imidazole and pyrrolidine pentagons, N corners blue). Origin = the end of the bond from
// Cα; the chain grows up (down: true mirrors it to grow down). Proline's ring includes Cα (drawn at the origin as a
// small grey "Cα" bead unless ca false) and the amino N (its N corner is one bond to the left).
//   .ion(k) ionised side-chain groups: COOH → COO⁻, NH₂ → NH₃⁺, =NH → =NH₂⁺ (the text fades out, swaps, fades in; a charge
//   badge pops), histidine's ring N gains an H and a "+"; .hi(group, k) halos: 'COOH' 'NH2' 'OH' 'SH' 'CONH2' 'S' 'N'
//   'ring' 'C' 'all'; .mark(k) proline's "N in the ring" tag; .tip() the far end in parent; .groups the group names it
//   has; .count(kind) how many 'COOH' / 'NH2' groups it carries; .h its height in px
function sideChain(p, name, { x = 0, y = 0, s = 1, o = 1, b = 34, down = false, ion = 0, ca = true } = {}) {
  const aa = pAA(name), key = aa ? aa.name : name, spec = P_SIDE[key];
  if (!spec) throw new Error('sideChain: no side chain "' + name + '"');
  const col = aa ? aa.color : PC.generic, fy = down ? -1 : 1;
  const g = G(p, { x, y, s, o });
  const U = ([ux, uy]) => [ux * b, uy * b * fy];
  const pos = { o: [0, 0] };
  for (const [id, , at] of spec.nodes) pos[id] = U(at);
  const sticks = G(g), ringG = G(g), haloG = G(g), nodeG = G(g), ionG = G(g);
  const halos = {}; const addHalo = (grp, el) => { (halos[grp] = halos[grp] || []).push(el); };
  const swaps = [], pills = [];             // [neutral text el, ionised text el, badge] for .ion; [kind, at] per pill
  let stickD = '';
  const seg = (a, c) => `M${pkP(a)}L${pkP(c)}`;
  for (const [a, c, order] of spec.bonds) {
    const A = pos[a], C = pos[c];
    if (order === 2) { const L = Math.hypot(C[0] - A[0], C[1] - A[1]) || 1, nx = -(C[1] - A[1]) / L * 4, ny = (C[0] - A[0]) / L * 4; stickD += seg([A[0] + nx, A[1] + ny], [C[0] + nx, C[1] + ny]) + seg([A[0] - nx, A[1] - ny], [C[0] - nx, C[1] - ny]); }
    else stickD += seg(A, C);
  }
  const ball = (at, kind, grp) => {
    const R = { C: .27, N: .36, O: .36, S: .4, H: .22 }[kind] * b, F = { C: [PC.C, PC.CEdge], N: [PC.N, PC.NEdge], O: [PC.O, PC.OEdge], S: [PC.S, PC.SEdge], H: [PC.h, PC.hEdge] }[kind];
    addHalo(grp || P_HI[kind], pkHalo(haloG, R + 8, PC.glow, at[0], at[1]));
    pkBall(nodeG, R, F[0], F[1], { cx: at[0], cy: at[1], letter: kind === 'C' ? '' : kind, size: kind === 'H' ? R * 1.3 : R * 1.1, ink: kind === 'O' ? '#fff' : PC.ink, sw: 2 });
  };
  const pill = (at, kind) => {
    pills.push([kind, at]);
    const [t0, t1, fill, ink, ch] = P_GROUP[kind], size = Math.round(b * .5), h = Math.round(b * .78);
    const w = Math.max(pkTW(t0, size), pkTW(t1, size)) + b * .5;
    addHalo(P_HI[kind], (() => { const e = path(haloG, pkRect(w + 14, h + 14, (h + 14) / 2, at[0], at[1]), { fill: PC.glow, 'fill-opacity': .28, stroke: PC.glow, 'stroke-width': 3 }); put(e, { o: 0 }); return e; })());
    const pg = G(nodeG, { x: at[0], y: at[1] });
    path(pg, pkRect(w, h, h / 2), { fill, stroke: PC.ink, 'stroke-width': 2 });
    const a = pkText(pg, t0, { y: size * .36, size, fill: ink, weight: 800 });
    if (t1 !== t0) {
      const c = pkText(pg, t1, { y: size * .36, size, fill: ink, weight: 800, o: 0 });
      const bd = pkCharge(ionG, ch, { x: at[0] + w / 2 + 2, y: at[1] - h / 2 - 2, r: b * .27, o: 0 });
      swaps.push([a, c, bd]);
    }
    return w;
  };
  // ring
  let ringInfo = null;
  if (spec.ring) {
    const [rk, from] = spec.ring, R = P_RINGS[rk](), F = pos[from];
    let map;
    if (rk === 'pyrrolidine') {
      // Cα corner at the origin, N corner one bond to the left: the pentagon stands above them
      const a0 = R.polys[0][0], a1 = R.polys[0][1];
      map = v => [(v[0] - a0[0]) * b, (v[1] - a0[1]) * b * fy];
      void a1;
    } else {
      // attach corner one bond above `from`; the ring's outward direction at it points back down the bond
      const A = [F[0], F[1] - b * fy], th = Math.atan2(fy, 0) - Math.atan2(R.u[1], R.u[0]), c = Math.cos(th), sn = Math.sin(th);
      map = v => { const dx = (v[0] - R.at[0]) * b, dy = (v[1] - R.at[1]) * b; return [A[0] + dx * c - dy * sn, A[1] + dx * sn + dy * c]; };
      stickD += seg(F, A);
    }
    const polys = R.polys.map(pl => pl.map(map));
    const rh = path(haloG, polys.map(pl => pkPoly(pl, true)).join(''), { fill: 'none', stroke: PC.glow, 'stroke-width': 12, 'stroke-opacity': .6 });
    put(rh, { o: 0 }); addHalo('ring', rh);
    polys.forEach((pl, i) => {
      path(ringG, pkPoly(pl, true), { fill: col, 'fill-opacity': .2, stroke: col, 'stroke-width': Math.max(3, b * .12) });
      if (R.arom[i]) { const cx = pl.reduce((s2, q) => s2 + q[0], 0) / pl.length, cy = pl.reduce((s2, q) => s2 + q[1], 0) / pl.length; mk('circle', { cx: pkF(cx), cy: pkF(cy), r: pkF(b * .52), fill: 'none', stroke: col, 'stroke-width': 3 }, ringG); }
    });
    const nNodes = [];
    for (const k2 in R.N) {
      const [pi, vi] = k2.split(':').map(Number), at = polys[pi][vi], kind = R.N[k2];
      const cen = polys[pi].reduce((s2, q) => [s2[0] + q[0] / polys[pi].length, s2[1] + q[1] / polys[pi].length], [0, 0]);
      const L = Math.hypot(at[0] - cen[0], at[1] - cen[1]) || 1, out = [at[0] + (at[0] - cen[0]) / L * b * .8, at[1] + (at[1] - cen[1]) / L * b * .8];
      nNodes.push([at, kind, out]);
    }
    ringInfo = { polys, nNodes, top: R.top ? map(R.top) : null, ca: rk === 'pyrrolidine' ? map(R.polys[0][0]) : null, n: rk === 'pyrrolidine' ? map(R.polys[0][1]) : null };
    if (spec.ringTop) { const tp = ringInfo.top, L = Math.hypot(tp[0] - map([0, 0])[0], tp[1] - map([0, 0])[1]) || 1; const cen = map([0, 0]); pos.top = [tp[0] + (tp[0] - cen[0]) / L * b * 1.05, tp[1] + (tp[1] - cen[1]) / L * b * 1.05]; stickD += seg(tp, pos.top); }
  }
  path(sticks, stickD || 'M0 0', { stroke: PC.stick, 'stroke-width': Math.max(3, b * .16) });
  for (const [id, kind] of spec.nodes) { if (P_GROUP[kind]) pill(pos[id], kind); else ball(pos[id], kind); }
  if (spec.ringTop) pill(pos.top, spec.ringTop);
  let hisH = null;
  if (ringInfo) {
    for (const [at, kind, out] of ringInfo.nNodes) {
      if (kind === 'NH') { path(sticks, seg(at, out), { stroke: PC.stick, 'stroke-width': Math.max(3, b * .14) }); ball(out, 'H', 'N'); }
      if (kind === 'Nplus') {
        const hg = G(ionG, { o: 0 }); path(hg, seg(at, out), { stroke: PC.stick, 'stroke-width': Math.max(3, b * .14) });
        pkBall(hg, .22 * b, PC.h, PC.hEdge, { cx: out[0], cy: out[1], letter: 'H', size: .3 * b, sw: 2 });
        const bd = pkCharge(ionG, '+', { x: out[0] - b * .5, y: out[1] - b * .35, r: b * .27, o: 0 });
        hisH = [hg, bd];
      }
      ball(at, 'N', 'N');
    }
    if (ringInfo.ca && ca) ball(ringInfo.ca, 'C', 'C');
  }
  const caLab = ringInfo && ringInfo.ca && ca ? pkText(nodeG, 'Cα', { x: ringInfo.ca[0] + b * .55, y: ringInfo.ca[1] + b * .2, size: b * .45, fill: COL.dim, anchor: 'start' }) : null;
  const mark = ringInfo && ringInfo.n ? pkText(g, 'N in the ring', { x: ringInfo.n[0] - b * .9, y: ringInfo.n[1] + b * 1.55, size: Math.round(b * .55), fill: PC.imino, anchor: 'middle', o: 0 }) : null;
  // extent
  const all = [...Object.values(pos)]; if (ringInfo) ringInfo.polys.forEach(pl => all.push(...pl));
  const ext = all.reduce((m, q) => Math.max(m, -q[1] * fy), 0);
  const groups = [...new Set([...spec.nodes.map(n => P_HI[n[1]]), ...(spec.ringTop ? [P_HI[spec.ringTop]] : []), ...(ringInfo ? ['ring', 'N'] : [])])].filter(Boolean);
  const nCount = k => spec.nodes.filter(n => n[1] === k || (k === 'NH2' && n[1] === 'NH')).length;
  let ik = -1, hiState = {};
  const sc = Object.assign(g, {
    aa, groups, h: ext + b * .5, caLab, ring: ringInfo, pills,
    ion(k) {
      const kk = pkK(k); if (kk === ik) return sc; ik = kk;
      const a = 1 - pkR(kk, 0, .45), c = pkR(kk, .55, 1);
      for (const [t0, t1, bd] of swaps) { pkO(t0, a); pkO(t1, c); pkO(bd, c); }
      if (hisH) { pkO(hisH[0], pkR(kk, .3, .7)); pkO(hisH[1], c); }
      return sc;
    },
    hi(grp, k) {
      const kk = pkK(k), names = grp === 'all' ? Object.keys(halos) : [grp];
      for (const n of names) { if (hiState[n] === kk) continue; hiState[n] = kk; (halos[n] || []).forEach(e => pkO(e, kk)); }
      return sc;
    },
    mark(k) { if (mark) pkO(mark, pkK(k)); return sc; },
    count: nCount,
    tip() { return pkOut(g, [0, -ext * fy]); },
    nPt() { return ringInfo && ringInfo.n ? pkOut(g, ringInfo.n) : null; },
  });
  return sc.ion(ion);
}

// ring(p, kind, {x, y, s, o, b=60, color, label, sub}): a ring on its own, big, centred on the origin: 'benzene'
// (hexagon with its aromatic circle), 'indole' (pentagon fused to a hexagon, N–H at the pentagon's bottom),
// 'imidazole' (pentagon, two N), 'pyrrolidine' (pentagon, one N–H). label (name under it) and sub (smaller line).
// .hi(k) a glow round it; .nHi(k) halos on the N corners; .labels(k)
function ring(p, kind, { x = 0, y = 0, s = 1, o = 1, b = 60, color, label, sub, size = 30 } = {}) {
  const R = P_RINGS[kind](), col = color || { benzene: PC.aromatic, indole: PC.hetero, imidazole: PC.hetero, pyrrolidine: PC.imino }[kind];
  const g = G(p, { x, y, s, o });
  // centre the ring system on its middle
  const all = R.polys.flat(), cx = (Math.min(...all.map(q => q[0])) + Math.max(...all.map(q => q[0]))) / 2, cy = (Math.min(...all.map(q => q[1])) + Math.max(...all.map(q => q[1]))) / 2;
  const M = v => [(v[0] - cx) * b, (v[1] - cy) * b];
  const polys = R.polys.map(pl => pl.map(M));
  const halo = path(g, polys.map(pl => pkPoly(pl, true)).join(''), { fill: 'none', stroke: PC.glow, 'stroke-width': 18, 'stroke-opacity': .5 }); put(halo, { o: 0 });
  polys.forEach((pl, i) => {
    path(g, pkPoly(pl, true), { fill: col, 'fill-opacity': .2, stroke: col, 'stroke-width': Math.max(4, b * .1) });
    if (R.arom[i]) { const c2 = pl.reduce((a, q) => [a[0] + q[0] / pl.length, a[1] + q[1] / pl.length], [0, 0]); mk('circle', { cx: pkF(c2[0]), cy: pkF(c2[1]), r: pkF(b * .55), fill: 'none', stroke: col, 'stroke-width': 4 }, g); }
  });
  const nh = G(g, { o: 0 }), ng = G(g);
  for (const k2 in R.N) {
    const [pi, vi] = k2.split(':').map(Number), at = polys[pi][vi], cen = polys[pi].reduce((a, q) => [a[0] + q[0] / polys[pi].length, a[1] + q[1] / polys[pi].length], [0, 0]);
    const L = Math.hypot(at[0] - cen[0], at[1] - cen[1]) || 1, out = [at[0] + (at[0] - cen[0]) / L * b * .6, at[1] + (at[1] - cen[1]) / L * b * .6];
    mk('circle', { cx: pkF(at[0]), cy: pkF(at[1]), r: pkF(b * .42), fill: PC.glow, 'fill-opacity': .35 }, nh);
    if (R.N[k2] === 'NH') { path(ng, `M${pkP(at)}L${pkP(out)}`, { stroke: PC.stick, 'stroke-width': 4 }); pkBall(ng, b * .2, PC.h, PC.hEdge, { cx: out[0], cy: out[1], letter: 'H', size: b * .26, sw: 2 }); }
    pkBall(ng, b * .3, PC.N, PC.NEdge, { cx: at[0], cy: at[1], letter: 'N', size: b * .34, sw: 2 });
  }
  const ys = polys.flat().map(q => q[1]), bottom = Math.max(...ys) + b * .7;
  const lab = label ? pkText(g, label, { y: bottom + size * .8, size, fill: col }) : null;
  const sb = sub ? pkText(g, sub, { y: bottom + size * 1.9, size: size * .72, fill: COL.dim, weight: 600 }) : null;
  const r2 = Object.assign(g, {
    halo, lab, sub: sb,
    hi(k) { pkO(halo, pkK(k)); return r2; },
    nHi(k) { pkO(nh, pkK(k)); return r2; },
    labels(k) { if (lab) pkO(lab, pkK(k)); if (sb) pkO(sb, pkK(k)); return r2; },
  });
  return r2;
}

/* ---------- small icons ---------- */
// classIcon(p, kind, {x, y, s, o, size=60}) centred icons for tabs and chips: 'ring' (lavender hexagon, structural),
// 'charge' (pink − and indigo +), 'minus' 'plus', 'plate' (a plate with a gold star: from the diet), 'star' (gold),
// 'halfStar' (semi-essential), 'cell' (mint cell, "made here"), 'glucose' (gold hexagon), 'ketone' (violet flask),
// 'fork' (glucose and flask), 'neutral' (cream circle). .w its width
function classIcon(p, kind, { x = 0, y = 0, s = 1, o = 1, size = 60 } = {}) {
  const g = G(p, { x, y, s, o }), u = size / 60;
  const star = (cx, cy, r, fill, half = false) => {
    const pts = []; for (let i = 0; i < 10; i++) { const a = pkRad(-90 + i * 36), rr = i % 2 ? r * .45 : r; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
    if (half) { path(g, pkPoly(pts, true), { fill: 'none', stroke: PC.essential, 'stroke-width': 2.5 * u }); path(g, pkPoly(pts.filter(q => q[0] <= cx + .01), true), { fill }); }
    else path(g, pkPoly(pts, true), { fill, stroke: '#b8902e', 'stroke-width': 2 * u });
  };
  const hex = (cx, cy, r) => path(g, pkPoly(pkNgon(6, r, -90, cx, cy), true), { fill: PC.gluco, stroke: '#a8862c', 'stroke-width': 2.5 * u });
  const flask = (cx, cy, r) => {
    path(g, `M${pkF(cx - r * .3)} ${pkF(cy - r)}V${pkF(cy - r * .25)}L${pkF(cx - r * .85)} ${pkF(cy + r * .8)}Q${pkF(cx - r * .9)} ${pkF(cy + r)} ${pkF(cx - r * .6)} ${pkF(cy + r)}H${pkF(cx + r * .6)}Q${pkF(cx + r * .9)} ${pkF(cy + r)} ${pkF(cx + r * .85)} ${pkF(cy + r * .8)}L${pkF(cx + r * .3)} ${pkF(cy - r * .25)}V${pkF(cy - r)}Z`, { fill: PC.keto, stroke: '#5f3f8f', 'stroke-width': 2.5 * u });
    path(g, `M${pkF(cx - r * .45)} ${pkF(cy - r)}H${pkF(cx + r * .45)}`, { stroke: '#d9c8f0', 'stroke-width': 3 * u });
  };
  let w = size;
  if (kind === 'ring') { path(g, pkPoly(pkNgon(6, 26 * u), true), { fill: PC.aromatic, 'fill-opacity': .3, stroke: PC.aromatic, 'stroke-width': 4 * u }); mk('circle', { r: pkF(13 * u), fill: 'none', stroke: PC.aromatic, 'stroke-width': 3 * u }, g); }
  else if (kind === 'charge') { pkCharge(g, '−', { x: -17 * u, r: 15 * u }); pkCharge(g, '+', { x: 17 * u, r: 15 * u }); w = 70 * u; }
  else if (kind === 'minus' || kind === 'plus') pkCharge(g, kind === 'plus' ? '+' : '−', { r: 18 * u });
  else if (kind === 'neutral') mk('circle', { r: pkF(16 * u), fill: PC.neutral, stroke: '#a8a498', 'stroke-width': 2.5 * u }, g);
  else if (kind === 'plate') { mk('ellipse', { cy: pkF(12 * u), rx: pkF(28 * u), ry: pkF(11 * u), fill: '#f2efe6', stroke: '#a8a498', 'stroke-width': 2.5 * u }, g); mk('ellipse', { cy: pkF(12 * u), rx: pkF(17 * u), ry: pkF(6 * u), fill: 'none', stroke: '#c8c4b8', 'stroke-width': 2 * u }, g); star(0, -12 * u, 14 * u, PC.essential); }
  else if (kind === 'star') star(0, 0, 24 * u, PC.essential);
  else if (kind === 'halfStar') star(0, 0, 24 * u, PC.essential, true);
  else if (kind === 'cell') { path(g, pkBlob(26 * u, 21 * u, 2, .05, 24), { fill: PC.nonEssential, 'fill-opacity': .35, stroke: PC.nonEssential, 'stroke-width': 3.5 * u }); mk('circle', { cx: pkF(-5 * u), cy: pkF(2 * u), r: pkF(8 * u), fill: PC.nonEssential }, g); }
  else if (kind === 'glucose') hex(0, 0, 22 * u);
  else if (kind === 'ketone') flask(0, 0, 22 * u);
  else if (kind === 'fork') { hex(-20 * u, 0, 17 * u); flask(22 * u, 0, 17 * u); w = 84 * u; }
  return Object.assign(g, { w, kind });
}

// aaChip(p, name, {x, y, s, o, code='three'|'name'|'one', size=22, h, w, color, cls, badge, dots=false, dashed=false})
// a rounded chip for one amino acid (or any label: name not in the table), filled in its structural class colour
// (or color / cls). badge: 'star' 'halfStar' 'cell' 'plus' 'minus' 'ring' 'glucose' 'ketone' 'fork' (small, top right,
// o 0). dots: four small dots under it (structural colour, chemical charge, nutritional gold / mint, fate gold / violet).
// .badge(k) .dots(k) .split(k) gold (glucogenic) and violet (ketogenic) halves over it (mixed fate; the text stays);
// .half(k) the right half dims (semi-essential); .dash(k) a dashed rim (not on the slide); .edge(color) rim colour
// (selenocysteine's gold rim); .glow(k); .w .h
function aaChip(p, name, { x = 0, y = 0, s = 1, o = 1, code = 'three', size = 22, h, w, color, cls, badge, dots = false, dashed = false } = {}) {
  const aa = pAA(name), label = aa ? (code === 'name' ? aa.name : code === 'one' ? aa.one : aa.three) : String(name);
  const fill = color || (cls ? pClassColor(cls) : aa ? aa.color : PC.neutral);
  const H = h ?? Math.round(size * 1.6), W = w ?? Math.max(H * 1.6, pkTW(label, size) + size * 1.2);
  const g = G(p, { x, y, s, o });
  const glow = path(g, pkRect(W + 16, H + 16, (H + 16) / 2), { fill: PC.glow, 'fill-opacity': .3, stroke: PC.glow, 'stroke-width': 3 }); put(glow, { o: 0 });
  const bg = path(g, pkRect(W, H, H / 2), { fill, stroke: PC.ink, 'stroke-width': 2.5 });
  const sg = G(g, { o: 0 });
  path(sg, `M${pkF(-W / 2 + H / 2)} ${pkF(-H / 2)}H0V${pkF(H / 2)}H${pkF(-W / 2 + H / 2)}A${pkF(H / 2)} ${pkF(H / 2)} 0 0 1 ${pkF(-W / 2 + H / 2)} ${pkF(-H / 2)}Z`, { fill: PC.gluco });
  path(sg, `M0 ${pkF(-H / 2)}H${pkF(W / 2 - H / 2)}A${pkF(H / 2)} ${pkF(H / 2)} 0 0 1 ${pkF(W / 2 - H / 2)} ${pkF(H / 2)}H0Z`, { fill: PC.keto });
  const halfG = path(g, `M0 ${pkF(-H / 2)}H${pkF(W / 2 - H / 2)}A${pkF(H / 2)} ${pkF(H / 2)} 0 0 1 ${pkF(W / 2 - H / 2)} ${pkF(H / 2)}H0Z`, { fill: PC.ink, 'fill-opacity': .55 }); put(halfG, { o: 0 });
  const rim = path(g, pkRect(W, H, H / 2), { fill: 'none', stroke: PC.ink, 'stroke-width': 2.5 });
  const dash = path(g, pkRect(W + 8, H + 8, (H + 8) / 2), { fill: 'none', stroke: COL.chalk, 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }); put(dash, { o: dashed ? 1 : 0 });
  const tx = pkText(g, label, { y: size * .36, size, fill: PC.ink, weight: 800 });
  const bdg = badge ? classIcon(g, badge, { x: W / 2 - 4, y: -H / 2 + 2, size: H * .9, o: 0 }) : null;
  let dg = null;
  if (aa) {
    dg = G(g, { o: 0 }); const cols = [aa.color, aa.chem === 'acidic' ? PC.acidic : aa.chem === 'basic' ? PC.basic : PC.neutral,
      aa.nutr === 'non' ? PC.nonEssential : PC.essential, aa.fate === 'keto' ? PC.keto : PC.gluco];
    cols.forEach((c, i) => mk('circle', { cx: pkF((i - 1.5) * 15), cy: pkF(H / 2 + 11), r: 5.5, fill: c, stroke: PC.ink, 'stroke-width': 1.5 }, dg));
    if (aa.fate === 'both') mk('circle', { cx: pkF(1.5 * 15), cy: pkF(H / 2 + 11), r: 2.6, fill: PC.keto }, dg);
  }
  const c = Object.assign(g, {
    aa, w: W, h: H, bg, tx,
    badge(k) { if (bdg) pkO(bdg, pkK(k)); return c; },
    dots(k) { if (dg) pkO(dg, pkK(k)); return c; },
    split(k) { pkO(sg, pkK(k)); return c; },
    half(k) { pkO(halfG, pkK(k) * .9); return c; },
    dash(k) { pkO(dash, pkK(k)); return c; },
    edge(col) { pkA(rim, 'stroke', col); pkA(rim, 'stroke-width', col === PC.ink ? 2.5 : 5); return c; },
    glow(k) { pkO(glow, pkK(k)); return c; },
  });
  if (dots) c.dots(1);
  return c;
}

/* ---------- the amino acid ---------- */
const P_AAG = { amX: -142, cbX: 150, hY: 88, rY: -112, ca: 32, pillH: 52, pillSize: 30, hR: 18 };
// aminoAcid(p, {x, y, s, o, aa, r='R', rClass='generic', shape=false, down=false, b=34, name=false, size=30})
// slide 6's general structure, origin = Cα: the grey Cα bead (labelled Cα), the indigo amino group pill on the left
// (NH₂), the pink carboxyl group pill on the right (COOH), the white H below and the side chain R above (down: R below,
// H above). R is a badge in its structural class colour holding the formula (aa: 'lysine' / 'Lys' / 'K' takes formula,
// colour and name from the table; or r and rClass), or with shape: true the side chain drawn as atoms (sideChain).
// Proline's shape bends its ring back to the amino group, which reads NH. b: the side chain's bond length (56). About 380 × 260 at s 1 (badge mode).
// Setters combine (each stores its own value and redraws): .parts({ca, amino, carboxyl, h, r}) reveal 0..1 per part
// (missing keys keep their value; the groups slide in from their side, R from above); .ionise(k) NH₂ → NH₃⁺ and
// COOH → COO⁻ (each text fades fully out before the other fades in; + and − badges pop; side-chain groups too);
// .focus(parts, k) lights parts and dims the rest to .25 (names: ca amino carboxyl h r, or 'groups' = amino and
// carboxyl); .glow(part, k) a halo behind one part; .labels(k) "α-carbon", "amino group", "carboxyl group",
// "hydrogen", "side chain (R)" beside the parts; .name(k) the amino acid's name under it; .counts(k) numbered tags on
// every amino (indigo) and carboxyl (pink) group, side chain included (chemical classification);
// .hi(group, k) halos by group: 'amino' 'carboxyl' (main and side chain) or a sideChain group; .setR(label, cls)
// the badge's text and colour (no fade); .rSwap(a, b, k, clsA, clsB) badge text a fades out, b fades in (colour and
// width follow); .setAcid(name) the badge and name from the table (badge mode). .pt('ca'|'amino'|'carboxyl'|'h'|'r'|
// 'rTop'|'name') in parent; .side the sideChain (shape mode)
function aminoAcid(p, { x = 0, y = 0, s = 1, o = 1, aa: aaName, r, rClass, shape = false, down = false, b, name = false, size = 30 } = {}) {
  b = b ?? 56;
  const A = P_AAG, aa = pAA(aaName), fy = down ? -1 : 1, isPro = aa && aa.name === 'proline' && shape;
  const g = G(p, { x, y, s, o });
  const haloG = G(g), stickG = G(g);
  const part = { ca: G(g), amino: G(g), carboxyl: G(g), h: G(g), r: G(g) };
  // R first (under the groups), then the rest on top
  g.insertBefore(part.r, part.ca);
  const halo = {
    ca: pkHalo(haloG, A.ca + 12), amino: path(haloG, pkRect(118, A.pillH + 18, 35, A.amX, 0), { fill: PC.glow, 'fill-opacity': .28, stroke: PC.glow, 'stroke-width': 3 }),
    carboxyl: path(haloG, pkRect(150, A.pillH + 18, 35, A.cbX, 0), { fill: PC.glow, 'fill-opacity': .28, stroke: PC.glow, 'stroke-width': 3 }),
    h: pkHalo(haloG, A.hR + 12, PC.glow, 0, A.hY * fy), r: null,
  };
  put(halo.amino, { o: 0 }); put(halo.carboxyl, { o: 0 });
  // sticks, one per part
  const sticks = {
    amino: path(stickG, `M0 0L${A.amX} 0`, { stroke: PC.stick, 'stroke-width': 7 }),
    carboxyl: path(stickG, `M0 0L${A.cbX} 0`, { stroke: PC.stick, 'stroke-width': 7 }),
    h: path(stickG, `M0 0L0 ${A.hY * fy}`, { stroke: PC.stick, 'stroke-width': 7 }),
    r: path(stickG, `M0 0L0 ${(shape ? -A.ca - 30 : A.rY + 24) * fy}`, { stroke: PC.stick, 'stroke-width': 7 }),
  };
  pkBall(part.ca, A.ca, PC.ca, PC.caEdge, { letter: '', sw: 3 });
  pkText(part.ca, 'Cα', { y: 10, size: 28, fill: PC.ink, weight: 800 });
  // the groups: neutral and ionised texts on one spot (one fades fully out before the other shows)
  const grp = (gp, cx, w, fill, t0, t1, sign) => {
    const gg = G(gp, { x: cx });
    path(gg, pkRect(w, A.pillH, A.pillH / 2), { fill, stroke: PC.ink, 'stroke-width': 3 });
    const a = pkText(gg, t0, { y: A.pillSize * .36, size: A.pillSize, fill: PC.ink, weight: 800 });
    const c = pkText(gg, t1, { y: A.pillSize * .36, size: A.pillSize, fill: PC.ink, weight: 800, o: 0 });
    const bd = pkCharge(gg, sign, { x: (cx < 0 ? -1 : 1) * (w / 2 - 4), y: -A.pillH / 2 - 4, r: 14, o: 0 });
    return { a, c, bd, w };
  };
  const am = grp(part.amino, A.amX, 108, PC.amino, isPro ? 'NH' : 'NH_2', isPro ? 'NH_2^+' : 'NH_3^+', '+');
  const cb = grp(part.carboxyl, A.cbX, 140, PC.carboxyl, 'COOH', 'COO^−', '−');
  pkBall(part.h, A.hR, PC.h, PC.hEdge, { cy: A.hY * fy, letter: 'H', size: 22, sw: 2.5 });
  // R
  let side = null, badge = null, tA = null, tB = null, rTopY;
  if (shape && aa) {
    if (isPro) {
      const pent = P_RINGS.pyrrolidine().polys[0], a0 = pent[0], a1 = pent[1], sc2 = Math.abs(A.amX) / Math.hypot(a1[0] - a0[0], a1[1] - a0[1]);
      const pts = pent.map(v => [(v[0] - a0[0]) * sc2, (v[1] - a0[1]) * sc2 * fy]);
      path(part.r, pkPoly(pts, true), { fill: PC.imino, 'fill-opacity': .12, stroke: PC.imino, 'stroke-width': 7 });
      for (const q of pts.slice(2)) pkBall(part.r, 11, PC.C, PC.CEdge, { cx: q[0], cy: q[1], sw: 2 });
      halo.r = path(haloG, pkPoly(pts, true), { fill: 'none', stroke: PC.glow, 'stroke-width': 18, 'stroke-opacity': .5 }); put(halo.r, { o: 0 });
      rTopY = Math.min(...pts.map(q => q[1] * fy)) * fy;
      sticks.r.setAttribute('d', 'M0 0');
    } else {
      side = sideChain(part.r, aa.name, { y: (-A.ca - 30) * fy, b, down });
      halo.r = pkHalo(haloG, 1, PC.glow, 0, 0); put(halo.r, { o: 0 });
      rTopY = (-A.ca - 30 - side.h) * fy;
    }
  } else {
    const bg = G(part.r, { y: A.rY * fy });
    badge = { g: bg, bg: path(bg, pkRect(80, 54, 16), { fill: PC.generic, stroke: PC.ink, 'stroke-width': 3 }) };
    tA = pkText(bg, '', { y: size * .36, size, fill: PC.ink, weight: 800 });
    tB = pkText(bg, '', { y: size * .36, size, fill: PC.ink, weight: 800, o: 0 });
    halo.r = path(haloG, pkRect(110, 80, 26, 0, A.rY * fy), { fill: PC.glow, 'fill-opacity': .28, stroke: PC.glow, 'stroke-width': 3 }); put(halo.r, { o: 0 });
    rTopY = (A.rY - 27) * fy;
  }
  // labels and name
  const labG = G(g, { o: 0 });
  const L = (str, lx, ly, anchor = 'middle') => pkText(labG, str, { x: lx, y: ly, size: 24, fill: COL.chalk, anchor, weight: 600 });
  L('amino group', A.amX, 62); L('carboxyl group', A.cbX, 62); L('α-carbon', -40, -44 * fy + (down ? 10 : 0), 'end');
  L('hydrogen', 30, A.hY * fy + 9, 'start');
  L('side chain (R)', shape ? 70 : 60, (shape ? (-A.ca - 50) : A.rY + 8) * fy, 'start');
  const nameT = pkText(g, aa ? aa.name : '', { y: (A.hY + A.hR + 44) * (down ? -1 : 1) + (down ? -10 : 0), size: 30, fill: COL.chalk, o: 0 });
  // count tags (chemical classification): main groups + side-chain pills
  const cntG = G(g, { o: 0 });
  const tag = (cx, cy, n, col) => { const tg = G(cntG, { x: cx, y: cy }); mk('circle', { r: 15, fill: col, stroke: PC.ink, 'stroke-width': 2.5 }, tg); pkText(tg, String(n), { y: 7, size: 20, fill: PC.ink, weight: 900 }); };
  let nAm = 1, nCb = 1;
  tag(A.amX - 50, A.pillH / 2 + 8, 1, PC.amino); tag(A.cbX + 66, A.pillH / 2 + 8, 1, PC.carboxyl);
  if (side) for (const [kind, at] of side.pills) {
    const P0 = pkOut(side, at);
    if (kind === 'NH2' || kind === 'NH') tag(P0[0] - b * 1.1, P0[1] + b * .3, ++nAm, PC.amino);
    if (kind === 'COOH') tag(P0[0] - b * 1.25, P0[1] + b * .3, ++nCb, PC.carboxyl);
  }
  // state
  const pk = { ca: 1, amino: 1, carboxyl: 1, h: 1, r: 1 }, gl = { ca: 0, amino: 0, carboxyl: 0, h: 0, r: 0 };
  let ionK = 0, lit = null, fk = 0, rA = aa ? aa.f : (r ?? 'R'), rB = rA, rk = 0, cA = aa ? aa.cls : (rClass || 'generic'), cB = cA;
  const slide = { amino: [-46, 0], carboxyl: [46, 0], h: [0, 34 * fy], r: [0, -40 * fy], ca: [0, 0] };
  let m;
  function apply() {
    for (const n in part) {
      const k = pk[n], f = lit ? (lit.has(n) ? 1 : 1 - .75 * fk) : 1, e = pkSS(k);
      pkSet(part[n], { x: slide[n][0] * (1 - e), y: slide[n][1] * (1 - e), o: k * f });
      if (sticks[n]) pkO(sticks[n], k * f);
      if (halo[n]) pkO(halo[n], gl[n] * k);
    }
    const a = 1 - pkR(ionK, 0, .45), c = pkR(ionK, .55, 1);
    pkO(am.a, a); pkO(am.c, c); pkO(am.bd, c); pkO(cb.a, a); pkO(cb.c, c); pkO(cb.bd, c);
    if (side) side.ion(ionK);
    if (badge) {
      pkTx(tA, rA); pkTx(tB, rB);
      const wa = Math.max(80, pkMeasure(rA, size) + 36), wb = Math.max(80, pkMeasure(rB, size) + 36), e = pkSS(rk), bw = pkL(wa, wb, rB === rA ? 0 : e);
      pkD(badge.bg, pkRect(bw, 54, 16)); pkD(halo.r, pkRect(bw + 30, 80, 26, 0, A.rY * fy));
      pkA(badge.bg, 'fill', pkMix(pClassColor(cA), pClassColor(cB), e));
      pkO(tA, rB === rA ? 1 : 1 - pkR(rk, 0, .45)); pkO(tB, rB === rA ? 0 : pkR(rk, .55, 1));
    }
    return m;
  }
  m = Object.assign(g, {
    aa, side, pieces: part, nameT,
    parts(v) { for (const k in v) if (k in pk) pk[k] = pkK(v[k]); return apply(); },
    ionise(k) { ionK = pkK(k); return apply(); },
    focus(names, k = 1) {
      const L2 = (Array.isArray(names) ? names : [names]).filter(n => n != null).flatMap(n => n === 'groups' ? ['amino', 'carboxyl'] : [n]);
      lit = L2.length ? new Set(L2) : null; fk = pkK(k); return apply();
    },
    glow(n, k) { if (n in gl) gl[n] = pkK(k); return apply(); },
    labels(k) { pkO(labG, pkK(k)); return m; },
    name(k) { pkO(nameT, pkK(k)); return m; },
    counts(k) { pkO(cntG, pkK(k)); return m; },
    hi(group, k) {
      const kk = pkK(k);
      if (group === 'amino') { gl.amino = kk; if (side) side.hi('NH2', kk); }
      else if (group === 'carboxyl') { gl.carboxyl = kk; if (side) side.hi('COOH', kk); }
      else if (side) side.hi(group, kk);
      return apply();
    },
    setR(label, cls) { rA = rB = String(label); if (cls) cA = cB = cls; rk = 0; return apply(); },
    rSwap(a, b2, k, clsA, clsB) { rA = String(a); rB = String(b2); cA = clsA || cA; cB = clsB || clsA || cB; rk = pkK(k); return apply(); },
    setAcid(nm) { const v = pAA(nm); if (v) { rA = rB = v.f; cA = cB = v.cls; rk = 0; pkTx(nameT, v.name); m.aa = v; } return apply(); },
    pt(nm) {
      const at = { ca: [0, 0], amino: [A.amX, 0], carboxyl: [A.cbX, 0], h: [0, A.hY * fy], r: [0, shape ? (rTopY + (-A.ca - 30) * fy) / 2 : A.rY * fy], rTop: [0, rTopY], name: [0, (A.hY + A.hR + 34) * fy] }[nm] || [0, 0];
      return pkOut(g, at);
    },
  });
  if (name) m.name(1);
  return apply();
}
// a short alias used by several plans
const aaFormula = (p, name, opts = {}) => aminoAcid(p, { aa: name, shape: true, name: true, ...opts });

/* ---------- the chapter 1 thread: the amino acid card ---------- */
const P_TABS = {
  structural: { at: [0, -292], w: 460, h: 118, color: '#bba8ee', title: 'Structural', cap: 'shape of R', icon: 'ring' },
  chemical: { at: [566, 0], w: 300, h: 236, color: '#ff7aa8', title: 'Chemical', cap: 'charge', icon: 'charge' },
  nutritional: { at: [0, 292], w: 460, h: 118, color: '#ffd27a', title: 'Nutritional', cap: 'from the diet?', icon: 'plate' },
  metabolic: { at: [-566, 0], w: 300, h: 236, color: '#8fd6b0', title: 'Metabolic', cap: 'fate of the skeleton', icon: 'fork' },
};
const P_TAB_ORDER = ['structural', 'chemical', 'nutritional', 'metabolic'];
// aminoCard(p, {x=800, y=450, s, o, aa, r='R', rClass, name=true}) the chapter 1 card: the amino acid (aminoAcid at
// s .78) on a rounded card (560 × 400) and four tabs round it: Structural above (ring icon, "shape of R"), Chemical
// right (− +, "charge"), Nutritional below (plate and star, "from the diet?"), Metabolic left (glucose and ketone
// flask, "fate of the skeleton"). About 1430 × 710 at s 1 (tabs reach x ±716, y ±351). Starts built.
// Setters combine: .build(k) the card and the amino acid's parts (0–.5), then the tabs slide out one by one (.5–1);
// .focus(tabs, k) lights the named tabs ('structural' …, an array, or null / 'all') and dims the others to .25 (the
// centre stays lit); .glow(tab, k) a halo round a tab; .fill(tab, k, text, color) the caption fades out and the
// value fades in on its place (text: one line, or two split by '|'; color tints the value and the tab's edge);
// .setAcid(name) the centre amino acid (badge, colour, name). .aa the aminoAcid; .tab(name) its group;
// .pt(tab|'centre') in parent
function aminoCard(p, { x = 800, y = 450, s = 1, o = 1, aa, r = 'R', rClass, name = true } = {}) {
  const g = G(p, { x, y, s, o });
  const stubs = G(g), tabG = G(g);
  const cardG = G(g);
  path(cardG, pkRect(560, 400, 34), { fill: PC.card, stroke: PC.cardEdge, 'stroke-width': 4 });
  const am = aminoAcid(cardG, { aa, r, rClass, s: .78, y: aa ? -14 : 10 });
  if (aa && name) am.name(1);
  const tabs = {}, st2 = {};
  for (const nm of P_TAB_ORDER) {
    const T0 = P_TABS[nm], tg = G(tabG, { x: T0.at[0], y: T0.at[1] }), side = nm === 'chemical' || nm === 'metabolic';
    const glow = path(tg, pkRect(T0.w + 22, T0.h + 22, 30), { fill: PC.glow, 'fill-opacity': .2, stroke: PC.glow, 'stroke-width': 4 }); put(glow, { o: 0 });
    const bg = path(tg, pkRect(T0.w, T0.h, 22), { fill: PC.tab, stroke: T0.color, 'stroke-width': 4 });
    const ic = classIcon(tg, T0.icon, side ? { y: -62, size: 64 } : { x: -T0.w / 2 + 62, size: 62 });
    const tx = side ? 0 : -T0.w / 2 + 112, an = side ? 'middle' : 'start';
    const title = pkText(tg, T0.title, { x: tx, y: side ? 14 : -10, size: 32, fill: T0.color, anchor: an, weight: 800 });
    const cap = pkText(tg, T0.cap, { x: tx, y: side ? 54 : 30, size: 24, fill: COL.dim, anchor: an, weight: 600 });
    const v1 = pkText(tg, '', { x: tx, y: side ? 54 : 30, size: side ? 26 : 24, fill: COL.chalk, anchor: an, weight: 800, o: 0 });
    const v2 = pkText(tg, '', { x: tx, y: side ? 86 : 30, size: side ? 26 : 24, fill: COL.chalk, anchor: an, weight: 800, o: 0 });
    tabs[nm] = { g: tg, glow, bg, ic, title, cap, v1, v2, side };
    st2[nm] = { fill: 0, text: '', color: null, glow: 0 };
    const [ax, ay] = T0.at, d = side ? `M${Math.sign(ax) * 280} 0L${ax - Math.sign(ax) * T0.w / 2} 0` : `M0 ${Math.sign(ay) * 200}L0 ${ay - Math.sign(ay) * T0.h / 2}`;
    path(stubs, d, { stroke: COL.faint || '#44536b', 'stroke-width': 4, 'stroke-dasharray': '2 9' });
  }
  let bk = 1, lit = null, fk = 0, c;
  function apply() {
    const cardK = pkR(bk, 0, .12);
    pkO(cardG, cardK); pkO(stubs, pkR(bk, .5, .7));
    am.parts({ ca: pkR(bk, .05, .17), amino: pkR(bk, .14, .26), carboxyl: pkR(bk, .22, .34), h: pkR(bk, .3, .4), r: pkR(bk, .36, .5) });
    P_TAB_ORDER.forEach((nm, i) => {
      const T0 = P_TABS[nm], tb = tabs[nm], S2 = st2[nm], k = pkR(bk, .5 + i * .1, .7 + i * .1), f = lit ? (lit.has(nm) ? 1 : 1 - .75 * fk) : 1;
      pkSet(tb.g, { x: T0.at[0] * (.55 + .45 * k), y: T0.at[1] * (.55 + .45 * k), o: k * f });
      pkO(tb.glow, S2.glow);
      const fv = S2.fill, a = 1 - pkR(fv, 0, .45), b2 = pkR(fv, .55, 1), [l1, l2] = S2.text.split('|');
      pkO(tb.cap, a); pkTx(tb.v1, l1 || ''); pkTx(tb.v2, l2 || ''); pkO(tb.v1, b2); pkO(tb.v2, l2 ? b2 : 0);
      if (!tb.side) { pkSet(tb.v1, { y: l2 ? 12 : 30 }); pkSet(tb.v2, { y: 40 }); pkSet(tb.title, { y: l2 ? -26 : -10 }); }
      const col = S2.color || COL.chalk;
      pkA(tb.v1, 'fill', col); pkA(tb.v2, 'fill', col);
      pkA(tb.bg, 'stroke', S2.color ? pkMix(T0.color, S2.color, b2) : T0.color);
    });
    return c;
  }
  c = Object.assign(g, {
    aa: am, tabs: Object.fromEntries(P_TAB_ORDER.map(n => [n, tabs[n].g])),
    build(k) { bk = pkK(k); return apply(); },
    focus(names, k = 1) {
      const L2 = (Array.isArray(names) ? names : [names]).filter(n => n != null && n !== 'all');
      lit = L2.length ? new Set(L2) : null; fk = pkK(k); return apply();
    },
    glow(nm, k) { if (st2[nm]) st2[nm].glow = pkK(k); return apply(); },
    fill(nm, k, text = '', color = null) { const S2 = st2[nm]; if (S2) { S2.fill = pkK(k); S2.text = String(text); S2.color = color; } return apply(); },
    setAcid(nm) { am.setAcid(nm); am.name(1); return c; },
    tab(nm) { return tabs[nm] && tabs[nm].g; },
    pt(nm) { return pkOut(g, nm === 'centre' || !P_TABS[nm] ? [0, 0] : P_TABS[nm].at); },
  });
  return apply();
}

/* ---------- peptide bond formation and hydrolysis ---------- */
// peptideBond(p, {x, y, s, o, a='glycine', b='alanine', shape=false, apart=560, joined=420, labels=true})
// two aminoAcids side by side (A left, B right; origin = midway between their Cα at the joined distance), about
// 980 × 300 apart and 840 wide joined. .form(k): they slide together (0–.4); the OH of A's carboxyl and an H of B's
// amino group lift off (.3–.45) and fall to a water below (.4–.65); the two pills fade out (.35–.5) and the orange
// "–CO–NH–" link fades in on their place (.5–.68); the water (water.js) fades in (.55–.7) and drifts down
// (.7–1), "H₂O" beside it; "peptide bond" under the link (.75–1). .hydrolyse(k) runs it backwards (the water comes
// in and splits). Starts apart (form(0)). .A .B the aminoAcids; .water; .pt('link'|'water'|'A'|'B') in parent
function peptideBond(p, { x = 0, y = 0, s = 1, o = 1, a = 'glycine', b = 'alanine', shape = false, apart = 560, joined = 420, labels = true } = {}) {
  const g = G(p, { x, y, s, o });
  const gA = G(g, { x: -joined / 2 }), gB = G(g, { x: joined / 2 });
  const A = aminoAcid(gA, { aa: a, shape, name: labels }), B = aminoAcid(gB, { aa: b, shape, name: labels });
  const jx = (P_AAG.cbX + joined + P_AAG.amX) / 2 - joined / 2;          // the link's centre (between the two pills)
  const link = G(g, { x: jx, o: 0 });
  path(link, pkRect(250, 56, 28), { fill: PC.peptide, stroke: PC.ink, 'stroke-width': 3 });
  pkText(link, '–CO–NH–', { y: 11, size: 30, fill: PC.ink, weight: 900 });
  const lab = labels ? pkText(g, 'peptide bond', { x: jx, y: -48, size: 26, fill: PC.peptide, o: 0 }) : null;
  const oh = G(g, { o: 0 }), hh = G(g, { o: 0 });
  path(oh, 'M0 0L20 10', { stroke: PC.stick, 'stroke-width': 5 });
  pkBall(oh, 15, PC.O, PC.OEdge, { letter: 'O', size: 16, ink: '#fff', sw: 2 }); pkBall(oh, 10, PC.h, PC.hEdge, { cx: 20, cy: 10, letter: 'H', size: 12, sw: 2 });
  pkBall(hh, 10, PC.h, PC.hEdge, { letter: 'H', size: 12, sw: 2 });
  const wg = G(g, { o: 0 }), water = waterMolecule(wg, { s: .6 });
  const wl = pkText(wg, 'H_2O', { x: 52, y: 10, size: 26, fill: COL.chalk, anchor: 'start' });
  let fk = -1, m;
  function apply(k) {
    const slideK = pkR(k, 0, .4), d = pkL(apart, joined, slideK);
    pkSet(gA, { x: -d / 2 }); pkSet(gB, { x: d / 2 });
    const cAx = -d / 2 + P_AAG.cbX + 50, nBx = d / 2 + P_AAG.amX - 30, wy = 120;
    const lift = pkR(k, .3, .45), fall = pkR(k, .4, .65);
    pkSet(oh, { x: pkL(cAx, jx - 18, fall), y: pkL(-30 * lift, wy, fall), o: lift * (1 - pkR(k, .58, .66)) });
    pkSet(hh, { x: pkL(nBx, jx + 22, fall), y: pkL(-30 * lift, wy + 8, fall), o: lift * (1 - pkR(k, .58, .66)) });
    const pf = 1 - pkR(k, .35, .5);
    pkO(A.pieces.carboxyl, pf); pkO(B.pieces.amino, pf);
    pkO(link, pkR(k, .5, .68));
    if (lab) pkO(lab, pkR(k, .75, 1));
    pkSet(wg, { x: jx, y: wy + 50 * pkR(k, .7, 1), o: pkR(k, .55, .7) });
    pkO(wl, pkR(k, .7, .9));
    return m;
  }
  m = Object.assign(g, {
    A, B, water, link,
    form(k) { const kk = pkK(k); if (kk !== fk) { fk = kk; apply(kk); } return m; },
    hydrolyse(k) { return m.form(1 - pkK(k)); },
    pt(nm) { return pkOut(g, { link: [jx, 0], water: [jx, 170], A: [st(gA).x, 0], B: [st(gB).x, 0] }[nm] || [0, 0]); },
  });
  return m.form(0);
}

/* ---------- the bead chain ---------- */
const P_CHAIN_COLS = [PC.simple, PC.basic, PC.hydroxy, PC.acidic, PC.aromatic, PC.branched, PC.hetero, PC.sulfur, PC.imino];
// layouts (local, centred on 0, bead spacing sp): straight with a gentle wave, a compact spiral (curl), a loose
// random coil (tangle)
function pkChainLayouts(n, sp, wave, seed) {
  const straight = [], spiral = [], coil = [];
  for (let i = 0; i < n; i++) straight.push([(i - (n - 1) / 2) * sp, wave * Math.sin(i * 1.1 + .5)]);
  // a compact snake: rows of about √n beads, each row running back the other way, slightly bowed
  const cols = Math.max(2, Math.ceil(Math.sqrt(n * 1.3))), rows = Math.ceil(n / cols);
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols, cc = r % 2 ? cols - 1 - c : c;
    spiral.push([(cc - (cols - 1) / 2) * sp * .98, (r - (rows - 1) / 2) * sp * .95 + sp * .12 * Math.sin(cc * 1.3 + r)]);
  }
  let ang = 0, px = 0, py = 0; const c0 = [];
  for (let i = 0; i < n; i++) { c0.push([px, py]); ang += (pkHash(i, seed) - .5) * 2.3; px += sp * Math.cos(ang); py += sp * Math.sin(ang); }
  const mx = c0.reduce((s2, q) => s2 + q[0], 0) / n, my = c0.reduce((s2, q) => s2 + q[1], 0) / n;
  c0.forEach(q => coil.push([q[0] - mx, (q[1] - my) * .8]));
  return { straight, spiral, coil };
}
// beadChain(p, {x, y, s, o, n=8, aa, classes, colors, labels, chips=true, sp=64, r=24, wave=0, numbers=false, ends=true,
//   endText='neutral'|'ionised'|false, gap=[], marks={}, seed=3, from='tangle'}) a polypeptide: beads in a row (centred
// on the origin, bead i at x = (i − (n−1)/2)·sp), orange peptide links between them, an indigo N tag on the left end and
// a pink C tag on the right. Colours: aa (names or codes, e.g. ['Val','His','Leu',…]: class colour and three-letter
// chip), classes (class keys), colors, or a 9-colour cycle; labels override the chip text. numbers: true (1…n) or a
// list of the numbers to show (e.g. [1, 5, 10, 15, 20]), under the beads. gap: indices drawn as dashed empty slots (a
// missing amino acid). marks: {i: '+' | '−' | 'star'} small badges above beads. Starts built, straight, links and ends
// shown, numbers hidden. Setters combine: .reveal(k) beads draw on one by one (links with them, ends at the end);
// .links(k) the orange links; .ends(k) the N and C tags (and their end text, "H₂N" / "COOH" or ionised);
// .numbers(k) numbers appear left to right; .marks(k); .curl(k) straight → a compact snake of rows (the same chain, links
// kept); .tangle(k) straight → loose random coil; .straighten(u) undoes the `from` shape ('tangle' or 'curl': that
// shape at 1 − u); .cut(i, k) hydrolysis of link i (bead i | i+1): a water comes up to it (0–.4), the link flashes and
// breaks (.4–.6), the right part slides 1.2 sp away (.5–1) (several cuts add up; the water shows for the lowest link
// in progress); .swap(i, cls, k, label) bead i's colour turns to the class colour and its chip text fades out and
// label fades in (one swap at a time); .glow(i, k) a halo on bead i (or 'all'); .bond(i, k) link i glows;
// .lift(i, k) bead i rises 1.1 sp out of the row (its links stretch); .focus(indices, k) lights those beads and dims
// the rest to .25 ([] or null: all lit); .readArrow(k) an arrow under the chain from the N end to the C end.
// .pt(i) bead i, .linkPt(i) link i, .endPt('N'|'C') in parent; .n .sp .beads
function beadChain(p, { x = 0, y = 0, s = 1, o = 1, n = 8, aa, classes, colors, labels, chips = true, sp = 64, r = 24, wave = 0, numbers = false,
  ends = true, endText = 'neutral', gap = [], marks = {}, seed = 3, from = 'tangle' } = {}) {
  if (aa) n = aa.length; else if (classes) n = classes.length; else if (colors) n = colors.length;
  const info = Array.from({ length: n }, (_, i) => {
    const A2 = aa ? pAA(aa[i]) : null;
    const col = colors ? colors[i] : classes ? pClassColor(classes[i]) : A2 ? A2.color : P_CHAIN_COLS[i % P_CHAIN_COLS.length];
    const lab = labels ? labels[i] : A2 ? A2.three : '';
    return { col, lab, gap: gap.includes(i) };
  });
  const L = pkChainLayouts(n, sp, wave, seed);
  const g = G(p, { x, y, s, o });
  const arrowG = pkArrow(g, { color: COL.dim, w: 4, head: 14 });
  const linkG = G(g), glowG = G(g), beadG = G(g), tagG = G(g), numG = G(g), markG = G(g);
  const links = [], linkGlow = [];
  for (let i = 0; i < n - 1; i++) {
    linkGlow.push(path(linkG, 'M0 0', { stroke: PC.glow, 'stroke-width': 18, 'stroke-opacity': .5 })); put(linkGlow[i], { o: 0 });
    links.push(path(linkG, 'M0 0', { stroke: PC.peptide, 'stroke-width': 9 }));
  }
  const beads = [], halos = [];
  info.forEach((b2, i) => {
    halos.push(pkHalo(glowG, r + 11));
    const bg = G(beadG);
    let disc;
    if (b2.gap) disc = mk('circle', { r: pkF(r), fill: PC.card, stroke: COL.chalk, 'stroke-width': 3, 'stroke-dasharray': '6 6' }, bg);
    else { disc = mk('circle', { r: pkF(r), fill: b2.col, stroke: PC.ink, 'stroke-width': 2.5 }, bg); mk('ellipse', { cx: pkF(-r * .35), cy: pkF(-r * .4), rx: pkF(r * .3), ry: pkF(r * .18), fill: '#fff', 'fill-opacity': .4 }, bg); }
    const fs = Math.round(r * .66);
    const tx = chips && b2.lab ? pkText(bg, b2.lab, { y: fs * .36, size: fs, fill: PC.ink, weight: 800 }) : null;
    beads.push({ g: bg, disc, tx });
  });
  const fs = Math.round(r * .66), swapTx = pkText(beadG, '', { y: fs * .36, size: fs, fill: PC.ink, weight: 800, o: 0 });
  const numEls = [];
  if (numbers) {
    const list = numbers === true ? info.map((_, i) => i + 1) : numbers;
    for (const nn of list) if (nn >= 1 && nn <= n) numEls.push([nn - 1, pkText(numG, String(nn), { size: 22, fill: COL.dim, weight: 700 })]);
  }
  const markEls = [];
  for (const i in marks) {
    const kind = marks[i], mg = G(markG);
    if (kind === 'star') classIcon(mg, 'star', { size: 30 }); else pkCharge(mg, kind === '+' ? '+' : '−', { r: 11 });
    markEls.push([+i, mg]);
  }
  const tagN = G(tagG), tagC = G(tagG);
  mk('circle', { r: pkF(r * .82), fill: PC.nTerm, stroke: PC.ink, 'stroke-width': 2.5 }, tagN); pkText(tagN, 'N', { y: r * .3, size: r * .85, fill: PC.ink, weight: 900 });
  mk('circle', { r: pkF(r * .82), fill: PC.cTerm, stroke: PC.ink, 'stroke-width': 2.5 }, tagC); pkText(tagC, 'C', { y: r * .3, size: r * .85, fill: PC.ink, weight: 900 });
  const eN = endText ? pkText(tagN, endText === 'ionised' ? 'H_3N^+' : 'H_2N', { y: -r * 1.25, size: r * .8, fill: PC.nTerm }) : null;
  const eC = endText ? pkText(tagC, endText === 'ionised' ? 'COO^−' : 'COOH', { y: -r * 1.25, size: r * .8, fill: PC.cTerm }) : null;
  const wG = G(g, { o: 0 }); waterMolecule(wG, { s: .42 });
  // state
  let rv = 1, lk = 1, ek = ends ? 1 : 0, nk = 0, mkk = 1, ck = 0, tk = 0, rk = 0;
  const cuts = {}, glows = {}, bonds = {}, lifts = {};
  let sw = null, lit = null, fk = 0, ch;
  const pts = () => {
    const out = [];
    let shift = 0;
    for (let i = 0; i < n; i++) {
      if (i > 0 && cuts[i - 1]) shift += 1.2 * sp * pkR(cuts[i - 1], .5, 1);
      const a = L.straight[i], b2 = L.spiral[i], c2 = L.coil[i];
      let px = a[0] + ck * (b2[0] - a[0]) + tk * (c2[0] - a[0]) + shift, py = a[1] + ck * (b2[1] - a[1]) + tk * (c2[1] - a[1]);
      if (lifts[i]) py -= 1.1 * sp * pkSS(lifts[i]);
      out.push([px, py]);
    }
    return out;
  };
  function apply() {
    const P0 = pts();
    for (let i = 0; i < n; i++) {
      const bk = mRamp(rv * (n + .6) - i, 0, 1), f = lit ? (lit.has(i) ? 1 : 1 - .75 * fk) : 1;
      pkSet(beads[i].g, { x: P0[i][0], y: P0[i][1], o: bk * f });
      pkSet(halos[i], { x: P0[i][0], y: P0[i][1], o: (glows[i] ?? glows.all ?? 0) * bk });
      if (sw && sw.i === i) {
        pkA(beads[i].disc, 'fill', info[i].gap ? PC.card : pkMix(info[i].col, pClassColor(sw.cls), pkSS(sw.k)));
        if (beads[i].tx) pkO(beads[i].tx, 1 - pkR(sw.k, 0, .45));
      } else { pkA(beads[i].disc, 'fill', info[i].gap ? PC.card : info[i].col); if (beads[i].tx) pkO(beads[i].tx, 1); }
    }
    if (sw && sw.i >= 0 && sw.i < n) { pkTx(swapTx, sw.label); pkSet(swapTx, { x: P0[sw.i][0], y: P0[sw.i][1] + fs * .36, o: pkR(sw.k, .55, 1) * mRamp(rv * (n + .6) - sw.i, 0, 1) }); }
    else pkO(swapTx, 0);
    let wi = -1;
    for (let i = 0; i < n - 1; i++) {
      const a = P0[i], b2 = P0[i + 1], dx = b2[0] - a[0], dy = b2[1] - a[1], D = Math.hypot(dx, dy) || 1, ux = dx / D, uy = dy / D;
      const cut = cuts[i] || 0, brk = pkR(cut, .4, .6), e = r * .7;
      const d = brk > 0 ? `M${pkP([a[0] + ux * e, a[1] + uy * e])}L${pkP([a[0] + ux * (e + (D / 2 - e) * (1 - brk)), a[1] + uy * (e + (D / 2 - e) * (1 - brk))])}M${pkP([b2[0] - ux * (e + (D / 2 - e) * (1 - brk)), b2[1] - uy * (e + (D / 2 - e) * (1 - brk))])}L${pkP([b2[0] - ux * e, b2[1] - uy * e])}`
        : `M${pkP([a[0] + ux * e, a[1] + uy * e])}L${pkP([b2[0] - ux * e, b2[1] - uy * e])}`;
      pkD(links[i], d); pkD(linkGlow[i], d);
      const vis = mRamp(rv * (n + .6) - i - 1, 0, 1) * lk * (1 - brk), f = lit ? (lit.has(i) && lit.has(i + 1) ? 1 : 1 - .75 * fk) : 1;
      pkO(links[i], vis * f);
      pkO(linkGlow[i], Math.max(bonds[i] || 0, mBump(cut, .3, .6)) * mRamp(rv * (n + .6) - i - 1, 0, 1));
      if (wi < 0 && cut > 0 && cut < 1) wi = i;
    }
    if (wi >= 0) {
      const a = P0[wi], b2 = P0[wi + 1], c = cuts[wi], mx2 = (a[0] + b2[0]) / 2, my2 = (a[1] + b2[1]) / 2;
      pkSet(wG, { x: mx2, y: my2 + pkL(sp * 1.6, sp * .55, pkR(c, 0, .4)), o: pkR(c, 0, .2) * (1 - pkR(c, .45, .62)) });
    } else pkSet(wG, { x: 0, y: 0, o: 0 });
    // ends
    const endK = mRamp(rv * (n + .6) - n + .4, 0, 1) * ek;
    const d0 = [P0[0][0] - P0[Math.min(1, n - 1)][0], P0[0][1] - P0[Math.min(1, n - 1)][1]], l0 = Math.hypot(...d0) || 1;
    const d1 = [P0[n - 1][0] - P0[Math.max(0, n - 2)][0], P0[n - 1][1] - P0[Math.max(0, n - 2)][1]], l1 = Math.hypot(...d1) || 1;
    pkSet(tagN, { x: P0[0][0] + d0[0] / l0 * r * 2, y: P0[0][1] + d0[1] / l0 * r * 2, o: endK });
    pkSet(tagC, { x: P0[n - 1][0] + d1[0] / l1 * r * 2, y: P0[n - 1][1] + d1[1] / l1 * r * 2, o: endK });
    void eN; void eC;
    numEls.forEach(([i, t2], j) => pkSet(t2, { x: P0[i][0], y: P0[i][1] + r + 30, o: mRamp(nk * (numEls.length + .5) - j, 0, 1) * mRamp(rv * (n + .6) - i, 0, 1) }));
    markEls.forEach(([i, mg]) => pkSet(mg, { x: P0[i][0] + r * .75, y: P0[i][1] - r * .85, o: mkk * mRamp(rv * (n + .6) - i, 0, 1) }));
    arrowG.set(P0[0][0] - r, P0[0][1] + r + (numEls.length ? 62 : 34), P0[n - 1][0] + r, P0[n - 1][1] + r + (numEls.length ? 62 : 34), rk);
    return ch;
  }
  ch = Object.assign(g, {
    n, sp, beads: beads.map(b2 => b2.g), tagN, tagC,
    reveal(k) { rv = pkK(k); return apply(); },
    links(k) { lk = pkK(k); return apply(); },
    ends(k) { ek = pkK(k); return apply(); },
    numbers(k) { nk = pkK(k); return apply(); },
    marks(k) { mkk = pkK(k); return apply(); },
    curl(k) { ck = pkK(k); return apply(); },
    tangle(k) { tk = pkK(k); return apply(); },
    straighten(u) { if (from === 'curl') ck = pkK(1 - u); else tk = pkK(1 - u); return apply(); },
    cut(i, k) { cuts[i] = pkK(k); return apply(); },
    swap(i, cls, k, label = '') { sw = { i, cls, k: pkK(k), label: String(label) }; return apply(); },
    glow(i, k) { glows[i] = pkK(k); return apply(); },
    bond(i, k) { bonds[i] = pkK(k); return apply(); },
    lift(i, k) { lifts[i] = pkK(k); return apply(); },
    focus(idx, k = 1) { const L2 = idx == null ? [] : Array.isArray(idx) ? idx : [idx]; lit = L2.length ? new Set(L2) : null; fk = pkK(k); return apply(); },
    readArrow(k) { rk = pkK(k); return apply(); },
    pt(i) { const P0 = pts(); return pkOut(g, P0[Math.max(0, Math.min(n - 1, i))]); },
    linkPt(i) { const P0 = pts(), a = P0[i], b2 = P0[Math.min(n - 1, i + 1)]; return pkOut(g, [(a[0] + b2[0]) / 2, (a[1] + b2[1]) / 2]); },
    endPt(e) { const t2 = e === 'C' ? tagC : tagN; return pkOut(g, [st(t2).x, st(t2).y]); },
  });
  return apply();
}

/* ---------- bond marks ---------- */
// hBondMark(p, {color, w=4, dots=true, size=22}) a dashed cyan hydrogen bond with end dots; .set(x1, y1, x2, y2, k=1)
// draws it k of the way from the first point (the C=O end); .deltas(k) "δ−" by the first end, "δ+" by the second
// (placed with set; side −1 puts both on the other side: left of an upright bond); .glow(k)
function hBondMark(p, { color = PC.hbond, w = 4, dots = true, size = 22, o = 1 } = {}) {
  const g = G(p, { o });
  const gl = path(g, 'M0 0', { stroke: PC.glow, 'stroke-width': w + 10, 'stroke-opacity': .35 }); put(gl, { o: 0 });
  const ln = path(g, 'M0 0', { stroke: color, 'stroke-width': w, 'stroke-dasharray': `${w * 2} ${w * 1.6}` });
  const d1 = mk('circle', { r: dots ? w * .9 : 0, fill: color }, g), d2 = mk('circle', { r: dots ? w * .9 : 0, fill: color }, g);
  const dm = pkText(g, 'δ−', { size, fill: '#ffb3a6', o: 0 }), dp = pkText(g, 'δ+', { size, fill: '#ffffff', o: 0 });
  let dk = 0, gk = 0, last = null, sd = 1, h;
  h = Object.assign(g, {
    set(x1, y1, x2, y2, k = 1) {
      const kk = pkK(k); last = [x1, y1, x2, y2, kk];
      const ex = x1 + (x2 - x1) * kk, ey = y1 + (y2 - y1) * kk, d = `M${pkF(x1)} ${pkF(y1)}L${pkF(ex)} ${pkF(ey)}`;
      pkD(ln, d); pkD(gl, d); pkO(ln, kk > 0 ? 1 : 0); pkO(gl, kk > 0 ? gk : 0);
      pkA(d1, 'cx', pkF(x1)); pkA(d1, 'cy', pkF(y1)); pkA(d2, 'cx', pkF(x2)); pkA(d2, 'cy', pkF(y2));
      pkA(d1, 'opacity', kk > 0 ? 1 : 0); pkA(d2, 'opacity', kk >= 1 ? 1 : 0);
      const L = Math.hypot(x2 - x1, y2 - y1) || 1; let nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
      if (nx < -.01 || (Math.abs(nx) <= .01 && ny < 0)) { nx = -nx; ny = -ny; } nx *= sd; ny *= sd;
      pkSet(dm, { x: x1 + nx * 26 - (x2 - x1) / L * 6, y: y1 + ny * 26 + 8, o: dk }); pkSet(dp, { x: x2 + nx * 26 + (x2 - x1) / L * 6, y: y2 + ny * 26 + 8, o: dk });
      return h;
    },
    deltas(k, side = 1) { dk = pkK(k); sd = side < 0 ? -1 : 1; if (last) h.set(...last); return h; },
    glow(k) { gk = pkK(k); if (last) h.set(...last); return h; },
  });
  return h;
}
// saltBridge(p, {r=18, w=4, arrows=true}) a pink "−" and an indigo "+" with a dashed line between (pink half to
// indigo half) and small attraction arrows; .set([x, y] minus, [x, y] plus, k=1): the discs at the two points, the line
// draws k (.0–.6) and the arrows show (.6–1)
function saltBridge(p, { r = 18, w = 4, arrows = true, o = 1 } = {}) {
  const g = G(p, { o });
  const l1 = path(g, 'M0 0', { stroke: PC.saltMinus, 'stroke-width': w, 'stroke-dasharray': `${w * 2} ${w * 1.6}` });
  const l2 = path(g, 'M0 0', { stroke: PC.saltPlus, 'stroke-width': w, 'stroke-dasharray': `${w * 2} ${w * 1.6}` });
  const ar = path(g, 'M0 0', { stroke: COL.chalk, 'stroke-width': 3 });
  const mn = pkCharge(g, '−', { r }), pl = pkCharge(g, '+', { r });
  let b;
  b = Object.assign(g, {
    minus: mn, plus: pl,
    set([x1, y1], [x2, y2], k = 1) {
      const kk = pkK(k), dk = pkR(kk, 0, .6), L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      pkSet(mn, { x: x1, y: y1 }); pkSet(pl, { x: x2, y: y2 });
      const a = [x1 + ux * r, y1 + uy * r], c = [x2 - ux * r, y2 - uy * r], m = pkL2(a, c, .5), e = pkL2(a, c, dk);
      pkD(l1, `M${pkP(a)}L${pkP(dk < .5 ? e : m)}`); pkD(l2, dk > .5 ? `M${pkP(m)}L${pkP(e)}` : 'M0 0');
      pkO(l1, dk > 0 ? 1 : 0); pkO(l2, dk > .5 ? 1 : 0);
      if (arrows && L > 4 * r) {
        const nx = -uy * 16, ny = ux * 16, q1 = pkL2(a, c, .3), q2 = pkL2(a, c, .7), h = 8;
        pkD(ar, `M${pkP([q1[0] + nx - ux * 14, q1[1] + ny - uy * 14])}L${pkP([q1[0] + nx + ux * 14, q1[1] + ny + uy * 14])}l${pkF(-ux * h - uy * h)} ${pkF(-uy * h + ux * h)}M${pkP([q1[0] + nx + ux * 14, q1[1] + ny + uy * 14])}l${pkF(-ux * h + uy * h)} ${pkF(-uy * h - ux * h)}` +
          `M${pkP([q2[0] + nx + ux * 14, q2[1] + ny + uy * 14])}L${pkP([q2[0] + nx - ux * 14, q2[1] + ny - uy * 14])}l${pkF(ux * h - uy * h)} ${pkF(uy * h + ux * h)}M${pkP([q2[0] + nx - ux * 14, q2[1] + ny - uy * 14])}l${pkF(ux * h + uy * h)} ${pkF(uy * h - ux * h)}`);
      } else pkD(ar, 'M0 0');
      pkO(ar, pkR(kk, .6, 1));
      return b;
    },
  });
  return b;
}
// disulfideMark(p, {w=12, r=16, labels=true}) a thick yellow S–S bar between two yellow S balls; .set([x, y], [x, y], k=1)
// the balls at the points, the bar grows from both ends (k)
function disulfideMark(p, { w = 12, r = 16, labels = true, o = 1 } = {}) {
  const g = G(p, { o });
  const bar = path(g, 'M0 0', { stroke: PC.ss, 'stroke-width': w, 'stroke-linecap': 'round' });
  const s1 = G(g), s2 = G(g);
  pkBall(s1, r, PC.S, PC.SEdge, { letter: labels ? 'S' : '', size: r * 1.1, sw: 2 }); pkBall(s2, r, PC.S, PC.SEdge, { letter: labels ? 'S' : '', size: r * 1.1, sw: 2 });
  let d;
  d = Object.assign(g, {
    set(a, b2, k = 1) {
      const kk = pkK(k), m = pkL2(a, b2, .5);
      pkSet(s1, { x: a[0], y: a[1] }); pkSet(s2, { x: b2[0], y: b2[1] });
      pkD(bar, `M${pkP(pkL2(m, a, kk))}L${pkP(pkL2(m, b2, kk))}`); pkO(bar, kk > 0 ? 1 : 0);
      return d;
    },
  });
  return d;
}

/* ---------- the backbone: N, Cα, C with C=O and N–H ---------- */
// one strand's atom places (local): residue i = N, Cα, C along x (step 3a), zigzag ±z; side[i] = +1 (down) / −1 (up)
function pkStrand(units, a, dir, x0, y0, side) {
  const res = [];
  for (let i = 0; i < units; i++) {
    const bx = x0 + dir * 3 * a * i, sd = side(i);
    const N = [bx, y0 - sd * 8], CA = [bx + dir * a, y0 + sd * 8], C = [bx + dir * 2 * a, y0 - sd * 8];
    res.push({ N, CA, C, H: [N[0], N[1] + sd * a * .85], O: [C[0], C[1] + sd * a * .85], R: [CA[0], CA[1] - sd * a * .95], sd });
  }
  return res;
}
// backbone(p, {x, y, s, o, units=6, a=40, strands=1, mode='anti'|'parallel', gap=170, showR=true, ends=true})
// the polypeptide backbone as atoms: N (blue), Cα (grey), C (grey) in a zigzag, each C with its =O (red) and each N with
// its H (white); the C–N peptide bonds orange; small faded side-chain badges on Cα (showR). strands 2: a second strand
// gap below (antiparallel: running right to left; parallel: the same way), its C=O and N–H facing the first's, with the
// hydrogen bonds between them (pairs found by facing O and H; antiparallel pairs are straight, parallel ones slant).
// Origin = the middle of the strand(s). Setters combine: .draw(k) residues appear left to right; .atoms(k) halos on
// every C=O and N–H; .rDim(k) the side-chain badges fade to .15; .hbonds(k) the hydrogen bonds draw one by one;
// .hbond(i, k) one of them (by .pairs order, left to right); .deltas(k) δ− on the bonded O, δ+ on the H; .ends(k) N and
// C tags at each strand's ends.
// .pairs (count) .pt(strand, i, 'N'|'CA'|'C'|'O'|'H'|'R') in parent
function backbone(p, { x = 0, y = 0, s = 1, o = 1, units = 6, a = 40, strands = 1, mode = 'anti', gap = 170, showR = true, ends = true } = {}) {
  const g = G(p, { x, y, s, o });
  const W = 3 * a * units - a, x0 = -W / 2 + a / 2;
  const top = pkStrand(units, a, 1, x0, strands === 2 ? -gap / 2 : 0, i => (i % 2 ? 1 : -1));
  let bot = null;
  if (strands === 2) {
    if (mode === 'parallel') bot = pkStrand(units, a, 1, x0 + 2 * a, gap / 2, j => -top[j].sd);
    else { const M = units - 1; bot = pkStrand(units, a, -1, x0 + 2 * a + 3 * a * M, gap / 2, j => -top[M - j].sd); }
  }
  const S = bot ? [top, bot] : [top];
  // pairs: a top atom facing down (sd +1) with a bottom atom facing up (sd −1), O with H, nearest in x
  const pairs = [];
  if (bot) {
    const used = new Set();
    for (const r1 of top) if (r1.sd > 0) for (const kind of ['O', 'H']) {
      const want = kind === 'O' ? 'H' : 'O'; let best = null, bd = 2.3 * a;
      bot.forEach((r2, j) => { if (r2.sd < 0 && !used.has(want + j)) { const dx = Math.abs(r2[want][0] - r1[kind][0]); if (dx < bd) { bd = dx; best = j; } } });
      if (best != null) { used.add(want + best); pairs.push(kind === 'O' ? [r1.O, bot[best].H] : [bot[best].O, r1.H]); }
    }
    pairs.sort((u, v) => (u[0][0] + u[1][0]) - (v[0][0] + v[1][0]));
  }
  const hbG = G(g), haloG = G(g), bondG = G(g), atomG = G(g), rG = G(g), tagG = G(g);
  const resG = [];
  const halos = [];
  S.forEach((strand, si) => {
    strand.forEach((rr, i) => {
      const rg = G(atomG), bg = G(bondG);
      resG.push({ si, i, g: rg, b: bg });
      const nx = strand[i + 1];
      path(bg, `M${pkP(rr.N)}L${pkP(rr.CA)}L${pkP(rr.C)}`, { stroke: PC.stick, 'stroke-width': 6 });
      path(bg, `M${pkP(rr.N)}L${pkP(rr.H)}`, { stroke: PC.stick, 'stroke-width': 4 });
      const ox = 4; path(bg, `M${pkF(rr.C[0] - ox)} ${pkF(rr.C[1])}L${pkF(rr.O[0] - ox)} ${pkF(rr.O[1])}M${pkF(rr.C[0] + ox)} ${pkF(rr.C[1])}L${pkF(rr.O[0] + ox)} ${pkF(rr.O[1])}`, { stroke: PC.stick, 'stroke-width': 3.5 });
      if (nx) path(bg, `M${pkP(rr.C)}L${pkP(nx.N)}`, { stroke: PC.peptide, 'stroke-width': 7 });
      halos.push(pkHalo(haloG, a * .42, PC.glow, rr.O[0], rr.O[1]), pkHalo(haloG, a * .36, PC.glow, rr.H[0], rr.H[1]));
      pkBall(rg, a * .3, PC.N, PC.NEdge, { cx: rr.N[0], cy: rr.N[1], letter: 'N', size: a * .34, sw: 2 });
      pkBall(rg, a * .26, PC.ca, PC.caEdge, { cx: rr.CA[0], cy: rr.CA[1], sw: 2 });
      pkBall(rg, a * .26, PC.C, PC.CEdge, { cx: rr.C[0], cy: rr.C[1], letter: 'C', size: a * .3, ink: '#fff', sw: 2 });
      pkBall(rg, a * .3, PC.O, PC.OEdge, { cx: rr.O[0], cy: rr.O[1], letter: 'O', size: a * .34, ink: '#fff', sw: 2 });
      pkBall(rg, a * .21, PC.h, PC.hEdge, { cx: rr.H[0], cy: rr.H[1], letter: 'H', size: a * .26, sw: 2 });
      if (showR) {
        path(rG, `M${pkP(rr.CA)}L${pkP(rr.R)}`, { stroke: PC.stick, 'stroke-width': 3 });
        pkBall(rG, a * .24, P_CHAIN_COLS[(i + si * 3) % P_CHAIN_COLS.length], PC.ink, { cx: rr.R[0], cy: rr.R[1], letter: 'R', size: a * .26, sw: 1.5 });
      }
    });
  });
  const hbs = pairs.map(() => hBondMark(hbG, { w: 4 }));
  const tags = [];
  if (ends) S.forEach(strand => {
    const f = strand[0], l = strand[strand.length - 1], dir = l.N[0] > f.N[0] ? 1 : -1;
    const tn = G(tagG, { x: f.N[0] - dir * a * .9, y: f.N[1] }), tc = G(tagG, { x: l.C[0] + dir * a * .9, y: l.C[1] });
    mk('circle', { r: pkF(a * .4), fill: PC.nTerm, stroke: PC.ink, 'stroke-width': 2 }, tn); pkText(tn, 'N', { y: a * .15, size: a * .42, fill: PC.ink, weight: 900 });
    mk('circle', { r: pkF(a * .4), fill: PC.cTerm, stroke: PC.ink, 'stroke-width': 2 }, tc); pkText(tc, 'C', { y: a * .15, size: a * .42, fill: PC.ink, weight: 900 });
    tags.push(tn, tc);
  });
  let dk = 1, ak = 0, rd = 0, hk = 0, dl = 0, ek = 0; const one = {};
  let b;
  function apply() {
    const N = resG.length;
    resG.forEach((r2, j) => { const v = mRamp(dk * (N / S.length + .5) - r2.i, 0, 1); pkO(r2.g, v); pkO(r2.b, v); });
    halos.forEach(h => pkO(h, ak * dk));
    pkO(rG, (1 - .85 * rd) * pkR(dk, .8, 1));
    pkO(tagG, ek);
    pairs.forEach(([A2, B2], i) => {
      const v = Math.max(mRamp(hk * (pairs.length + .5) - i, 0, 1), one[i] || 0);
      hbs[i].set(A2[0], A2[1] + Math.sign(B2[1] - A2[1]) * a * .32, B2[0], B2[1] - Math.sign(B2[1] - A2[1]) * a * .26, v).deltas(dl * (v >= 1 ? 1 : 0), i % 2 ? 1 : -1);
    });
    return b;
  }
  b = Object.assign(g, {
    pairs: pairs.length,
    draw(k) { dk = pkK(k); return apply(); },
    atoms(k) { ak = pkK(k); return apply(); },
    rDim(k) { rd = pkK(k); return apply(); },
    hbonds(k) { hk = pkK(k); return apply(); },
    hbond(i, k) { one[i] = pkK(k); return apply(); },
    deltas(k) { dl = pkK(k); return apply(); },
    ends(k) { ek = pkK(k); return apply(); },
    pt(si, i, kind = 'CA') { const st2 = S[si] || S[0], r2 = st2[Math.max(0, Math.min(st2.length - 1, i))]; return pkOut(g, r2[kind] || r2.CA); },
  });
  return apply();
}

/* ---------- the disulfide bridge: two cysteines ---------- */
// cysPair(p, {x, y, s, o, mode='aa'|'chain', gap=330, apart=160, labels=true}) two cysteines facing each other, origin
// = midway. 'aa': two aminoAcids (the top one upside down, R pointing down) whose CH₂–SH side chains meet in the
// middle (cysteine + cysteine → cystine); 'chain': the same side chains on two short stretches of bead chain (inside a
// folded protein). Setters combine: .near(k) the two come together from `apart` further away; .bridge(k) one H leaves
// each S (0–.5, they drift off left and right, "2 H" beside them, gone with them by .5), the thick yellow S–S bar grows (.4–.8) and "S–S"
// / "disulfide bridge" shows beside it (.7–1), the "SH" tags fade out (0–.3); .name(k) "cystine" under it (aa mode);
// .glow(k) halos on the two S. Starts near, unbridged. .pt('S1'|'S2'|'top'|'bottom') in parent
function cysPair(p, { x = 0, y = 0, s = 1, o = 1, mode = 'aa', gap = 330, apart = 160, labels = true } = {}) {
  const g = G(p, { x, y, s, o });
  const T2 = G(g), B2 = G(g);
  const sy = 34, cy0 = gap / 2;
  const unit = (gp, sgn) => {
    if (mode === 'aa') { const am = aminoAcid(gp, { r: '', down: sgn > 0, y: -sgn * cy0 }); am.parts({ r: 0 }); }
    else {
      const ch = G(gp, { y: -sgn * cy0 });
      path(ch, 'M-150 0L150 0', { stroke: PC.peptide, 'stroke-width': 8 });
      [-120, -60, 0, 60, 120].forEach((bx, i) => { mk('circle', { cx: bx, r: 22, fill: i === 2 ? PC.sulfur : P_CHAIN_COLS[(i * 2) % 9], stroke: PC.ink, 'stroke-width': 2.5 }, ch); });
      pkText(ch, 'Cys', { y: 6, size: 15, fill: PC.ink, weight: 800 });
    }
    path(gp, `M0 ${pkF(-sgn * (cy0 - 30))}L0 ${pkF(-sgn * sy)}`, { stroke: PC.stick, 'stroke-width': 7 });
    pkBall(gp, 12, PC.C, PC.CEdge, { cy: -sgn * (cy0 - 72), sw: 2 });
  };
  unit(T2, 1); unit(B2, -1);
  const glow = G(g, { o: 0 }); mk('circle', { cy: -sy, r: 28, fill: PC.glow, 'fill-opacity': .3 }, glow); mk('circle', { cy: sy, r: 28, fill: PC.glow, 'fill-opacity': .3 }, glow);
  const ssm = disulfideMark(g, { w: 14, r: 19 });
  const h1 = G(g), h2 = G(g);
  pkBall(h1, 11, PC.h, PC.hEdge, { letter: 'H', size: 13, sw: 2 }); pkBall(h2, 11, PC.h, PC.hEdge, { letter: 'H', size: 13, sw: 2 });
  const sh1 = pkText(g, 'SH', { x: -46, y: -sy + 9, size: 24, fill: PC.S, anchor: 'end' }), sh2 = pkText(g, 'SH', { x: -46, y: sy + 9, size: 24, fill: PC.S, anchor: 'end' });
  const two = pkText(g, '2 H', { x: 0, y: 0, size: 24, fill: COL.chalk, o: 0 });
  const lab = labels ? pkText(g, 'S–S  disulfide bridge', { x: 46, y: 9, size: 26, fill: PC.ss, anchor: 'start', o: 0 }) : null;
  const nm = mode === 'aa' ? pkText(g, 'cystine', { y: cy0 + 150, size: 32, fill: PC.sulfur, o: 0 }) : null;
  let nk = 1, bk = 0, c;
  function apply() {
    const d = apart * (1 - pkSS(nk));
    pkSet(T2, { y: -d / 2 }); pkSet(B2, { y: d / 2 });
    const s1 = [0, -sy - d / 2], s2 = [0, sy + d / 2];
    ssm.set(s1, s2, pkR(bk, .4, .8));
    const hl = pkR(bk, 0, .5);
    pkSet(h1, { x: -hl * 120, y: s1[1] + 24 - hl * 40, o: 1 - pkR(bk, .35, .5) }); pkSet(h2, { x: hl * 120, y: s2[1] - 24 + hl * 40, o: 1 - pkR(bk, .35, .5) });
    pkSet(sh1, { y: s1[1] + 9, o: 1 - pkR(bk, 0, .3) }); pkSet(sh2, { y: s2[1] + 9, o: 1 - pkR(bk, 0, .3) });
    pkSet(two, { y: 8, x: -150, o: pkR(bk, .15, .3) * (1 - pkR(bk, .35, .5)) });
    if (lab) pkO(lab, pkR(bk, .7, 1));
    pkSet(glow, { y: 0 });
    return c;
  }
  c = Object.assign(g, {
    near(k) { nk = pkK(k); return apply(); },
    bridge(k) { bk = pkK(k); return apply(); },
    name(k) { if (nm) pkO(nm, pkK(k)); return c; },
    glow(k) { pkO(glow, pkK(k)); return c; },
    pt(n2) { const d = apart * (1 - pkSS(nk)); return pkOut(g, { S1: [0, -sy - d / 2], S2: [0, sy + d / 2], top: [0, -cy0 - d / 2], bottom: [0, cy0 + d / 2] }[n2] || [0, 0]); },
  });
  return apply();
}

/* ---------- hydrophobic core ---------- */
// hydrophobicCore(p, {x, y, s, o, R=200, seed=2, chain=true, labels=true}) a chain of 14 side chains (6 non-polar
// grey-gold, 8 polar: mint, indigo +, pink −) loose in water (8 water molecules among them). .fold(k): the non-polar
// beads gather in the middle, the polar ones go to the surface, the water is pushed outside the dashed outline
// (k 1); labels "non-polar inside" and "water pushed out" (.7–1). Starts loose (fold(0)). .pt('core') in parent
function hydrophobicCore(p, { x = 0, y = 0, s = 1, o = 1, R = 200, seed = 2, chain = true, labels = true } = {}) {
  const g = G(p, { x, y, s, o });
  const kinds = ['n', 'p', 'n', 'p', 'p', 'n', 'p', 'n', 'p', 'n', 'p', 'p', 'n', 'p'];
  const pcol = [PC.hydroxy, PC.basic, PC.acidic, PC.amide];
  const outline = path(g, pkBlob(R * .92, R * .82, seed, .05), { fill: PC.globule, 'fill-opacity': .08, stroke: PC.globule, 'stroke-width': 3, 'stroke-dasharray': '10 9' });
  const chainP = path(g, 'M0 0', { stroke: PC.peptide, 'stroke-width': 5, 'stroke-opacity': .7 });
  const loose = [], packed = [];
  let ni = 0, pi = 0;
  kinds.forEach((kd, i) => {
    const t = i / kinds.length * 2 * Math.PI;
    loose.push([(i - (kinds.length - 1) / 2) * R * .19, R * .42 * Math.sin(i * 1.1 + seed) + R * .12 * (pkHash(i, seed) - .5)]);
    if (kd === 'n') { const a = ni * 2 * Math.PI / 6 + .4; packed.push([R * .22 * Math.cos(a), R * .2 * Math.sin(a)]); ni++; }
    else { const a = pi * 2 * Math.PI / 8 + .2; packed.push([R * .66 * Math.cos(a), R * .58 * Math.sin(a)]); pi++; }
  });
  const beads = kinds.map((kd, i) => {
    const bg = G(g);
    if (kd === 'n') pkBall(bg, 22, PC.hydrophobic, PC.hydrophobicEdge, { sw: 2.5 });
    else { const c = pcol[i % 4]; pkBall(bg, 20, c, PC.ink, { sw: 2 }); if (c === PC.basic) pkText(bg, '+', { y: 8, size: 24, fill: PC.ink, weight: 900 }); if (c === PC.acidic) pkText(bg, '−', { y: 8, size: 24, fill: PC.ink, weight: 900 }); }
    return bg;
  });
  const wIn = [], wOut = [], waters = [];
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * 2 * Math.PI + .5;
    wIn.push([(i - 3.5) * R * .33 + R * .1 * (pkHash(i, seed + 4) - .5), (i % 2 ? 1 : -1) * R * (.2 + .25 * pkHash(i, seed + 5))]);
    wOut.push([R * 1.32 * Math.cos(a), R * 1.18 * Math.sin(a)]);
    const wg = G(g); waterMolecule(wg, { s: .42, r: i * 40 }); waters.push(wg);
  }
  const l1 = labels ? pkText(g, 'non-polar inside', { y: -R * .92 - 14, size: 24, fill: PC.hydrophobic, o: 0 }) : null;
  const l2 = labels ? pkText(g, 'water pushed out', { y: R * 1.42 + 24, size: 24, fill: PC.water, o: 0 }) : null;
  let fk = -1, h;
  function apply(k) {
    const e = pkSS(k), P0 = loose.map((q, i) => pkL2(q, packed[i], e));
    P0.forEach((q, i) => pkSet(beads[i], { x: q[0], y: q[1] }));
    pkD(chainP, chain ? pkSmooth(P0) : 'M0 0'); pkO(chainP, chain ? 1 : 0);
    waters.forEach((w2, i) => { const q = pkL2(wIn[i], wOut[i], pkR(k, .1, .9)); pkSet(w2, { x: q[0], y: q[1] }); });
    pkO(outline, pkR(k, .5, 1));
    if (l1) { pkO(l1, pkR(k, .7, 1)); pkO(l2, pkR(k, .7, 1)); }
    return h;
  }
  h = Object.assign(g, {
    fold(k) { const kk = pkK(k); if (kk !== fk) { fk = kk; apply(kk); } return h; },
    pt() { return pkOut(g, [0, 0]); },
  });
  return h.fold(0);
}

/* ---------- bond chips ---------- */
const P_BONDS = {
  peptide: ['peptide bond', PC.peptide, true], disulfide: ['disulfide bridge', PC.ss, true], hydrogen: ['hydrogen bond', PC.hbond, false],
  salt: ['salt bridge', PC.saltMinus, false], ionic: ['ionic bond', PC.saltMinus, false], hydrophobic: ['hydrophobic', PC.hydrophobic, false],
};
// bondChip(p, kind, {x, y, s, o, card=true, label=true, w=190, h=150, lock=false}) the five bonds as small icons:
// 'peptide' (two beads joined by an orange link), 'disulfide' (two yellow S joined by a thick bar), 'hydrogen' (O ··· H
// with a cyan dash), 'salt' / 'ionic' (pink − ··· indigo +), 'hydrophobic' (grey-gold beads in a clump); on a small card
// with its name under the icon (card false: the icon alone). A lock badge (top right) for the strong covalent ones:
// .lock(k); .lit(k) a glow round the card; .w .h
function bondChip(p, kind, { x = 0, y = 0, s = 1, o = 1, card = true, label = true, w = 190, h = 150, lock = false } = {}) {
  const [name, col] = P_BONDS[kind];
  const g = G(p, { x, y, s, o });
  const glow = path(g, pkRect(w + 18, h + 18, 26), { fill: PC.glow, 'fill-opacity': .2, stroke: PC.glow, 'stroke-width': 4 }); put(glow, { o: 0 });
  if (card) path(g, pkRect(w, h, 20), { fill: PC.card, stroke: col, 'stroke-width': 3.5 });
  const ic = G(g, { y: label ? -16 : 0 });
  if (kind === 'peptide') { path(ic, 'M-34 0H34', { stroke: PC.peptide, 'stroke-width': 10 }); pkBall(ic, 20, PC.simple, PC.ink, { cx: -42 }); pkBall(ic, 20, PC.basic, PC.ink, { cx: 42 }); }
  else if (kind === 'disulfide') { path(ic, 'M-30 0H30', { stroke: PC.ss, 'stroke-width': 13 }); pkBall(ic, 18, PC.S, PC.SEdge, { cx: -36, letter: 'S', size: 20 }); pkBall(ic, 18, PC.S, PC.SEdge, { cx: 36, letter: 'S', size: 20 }); }
  else if (kind === 'hydrogen') { path(ic, 'M-22 0H22', { stroke: PC.hbond, 'stroke-width': 5, 'stroke-dasharray': '8 6' }); pkBall(ic, 17, PC.O, PC.OEdge, { cx: -40, letter: 'O', size: 19, ink: '#fff' }); pkBall(ic, 13, PC.h, PC.hEdge, { cx: 38, letter: 'H', size: 15 }); }
  else if (kind === 'salt' || kind === 'ionic') { path(ic, 'M-22 0H0', { stroke: PC.saltMinus, 'stroke-width': 5, 'stroke-dasharray': '8 6' }); path(ic, 'M0 0H22', { stroke: PC.saltPlus, 'stroke-width': 5, 'stroke-dasharray': '8 6' }); pkCharge(ic, '−', { x: -40, r: 17 }); pkCharge(ic, '+', { x: 40, r: 17 }); }
  else { [[-22, 8], [0, -12], [22, 8], [0, 18], [-6, 2]].forEach(([bx, by]) => pkBall(ic, 15, PC.hydrophobic, PC.hydrophobicEdge, { cx: bx, cy: by, sw: 2 })); }
  if (label) pkText(g, name, { y: h / 2 - 22, size: 22, fill: col });
  const lk = G(g, { x: w / 2 - 14, y: -h / 2 + 14, o: lock ? 1 : 0 });
  path(lk, 'M-8 -2V-9A8 8 0 0 1 8 -9V-2', { stroke: COL.chalk, 'stroke-width': 3.5 });
  path(lk, pkRect(24, 18, 4, 0, 6), { fill: COL.chalk });
  const c = Object.assign(g, {
    w, h, kind,
    lock(k) { pkO(lk, pkK(k)); return c; },
    lit(k) { pkO(glow, pkK(k)); return c; },
  });
  return c;
}

/* ---------- the α-helix ---------- */
// alphaHelix(p, {x, y, s, o, n=14, r=70, rise=26, axis=-90, w=18, beads=true, numbers=true, colors, bead=13, size=20})
// a right-handed α-helix: residue i sits exactly i·100° round the axis (3.6 residues per turn) and i·rise along it, so
// one turn (pitch) is 3.6·rise long; a cyan ribbon (darker where it runs behind) with numbered beads (1 … n), origin =
// the middle of the axis; axis is the direction it grows (degrees, −90 up, 0 right); seen from the side the front
// strands slope like "/" (right-handed). About (2r + 60) wide and (n − 1)·rise + 60 long. Starts drawn, no bonds.
// Setters combine: .draw(k) the ribbon draws on from residue 1 and the beads with it; .numbers(k); .bonds(k) the
// hydrogen bonds n → n + 4 (C=O of residue n to N–H of residue n + 4; dashed cyan) appear one by one;
// .bond(i, k) the bond from residue i + 1 to i + 5 alone; .turnBracket(k, start=0) a bracket beside one turn from bead
// start + 1 ("one turn = 3.6 amino acids", "0.54 nm per turn", "0.15 nm per residue", outside the bracket); .tilt(deg) turns the helix
// toward you about its middle (90: looking down the axis, the beads on a circle, 100° apart); .unwind(k) the coil
// loosens into a wavy chain stretched (1 + stretch) times (denaturation; numbers and bonds fade); .glow(i, k) a halo on bead i (0-based)
// or 'all'. .pt(i) bead i in parent; .len the axis length
function alphaHelix(p, { x = 0, y = 0, s = 1, o = 1, n = 14, r = 70, rise = 26, axis = -90, w = 18, beads = true, numbers = true, colors, bead = 13, size = 20, stretch = 1.3 } = {}) {
  const g = G(p, { x, y, s, o });
  const ah = [Math.cos(pkRad(axis)), Math.sin(pkRad(axis))], bh = [-ah[1], ah[0]];
  const backE = path(g, 'M0 0', { stroke: '#1d4f5a', 'stroke-width': w + 5 }), back = path(g, 'M0 0', { stroke: PC.helixBack, 'stroke-width': w });
  const backB = G(g), hbG = G(g), brG = G(g);
  const frontE = path(g, 'M0 0', { stroke: '#1f6f7f', 'stroke-width': w + 5 }), front = path(g, 'M0 0', { stroke: PC.helix, 'stroke-width': w });
  const haloG = G(g), frontB = G(g), numG = G(g);
  const bs = [], halos = [], nums = [];
  for (let i = 0; i < n; i++) {
    const bg = G(frontB);
    if (beads) pkBall(bg, bead, colors ? colors[i % colors.length] : PC.neutral, PC.ink, { sw: 2 });
    bs.push(bg); bg._side = 1;
    halos.push(pkHalo(haloG, bead + 9));
    nums.push(numbers ? pkText(numG, String(i + 1), { size, fill: COL.chalk, weight: 800 }) : null);
  }
  const hbs = []; for (let i = 0; i + 4 < n; i++) hbs.push(hBondMark(hbG, { w: 3.5, dots: false }));
  // turn bracket
  const br = path(brG, 'M0 0', { stroke: PC.secondary, 'stroke-width': 4 });
  const brA = Math.abs(bh[0]) > .5 ? (bh[0] > 0 ? 'end' : 'start') : 'middle';
  const bls = [['one turn = 3.6 amino acids', 24, PC.secondary, 800], ['0.54 nm per turn', 20, COL.dim, 600], ['0.15 nm per residue', 20, COL.dim, 600]]
    .map(([str, sz, c, wt]) => pkText(brG, str, { size: sz, fill: c, anchor: brA, weight: wt }));
  let dk = 1, nk = 1, bk = 0, tb = 0, tbs = 0, tilt = 0, uw = 0; const one = {}, gl = {};
  let h;
  const z0 = -(n - 1) / 2;
  // a residue parameter t → [screen x, y, depth]
  const at = t => {
    const th = pkRad(t * 100), R = r * (1 - uw), ris = rise * (1 + stretch * uw);
    const lat = -R * Math.cos(th) + uw * 18 * Math.sin(t * 2.2), dep = R * Math.sin(th), z = (t + z0) * ris;
    const ph = pkRad(tilt), al = z * Math.cos(ph) + dep * Math.sin(ph), d2 = -z * Math.sin(ph) + dep * Math.cos(ph);
    return [al * ah[0] + lat * bh[0], al * ah[1] + lat * bh[1], d2];
  };
  function apply() {
    const tEnd = dk * (n - 1) + .001, step = .1;
    let fd = '', bd = '', side = null, cur = '';
    let prev = null;
    for (let t = -.4; t <= tEnd + 1e-9; t = Math.round((t + step) * 1000) / 1000) {
      const q = at(Math.min(t, tEnd)), sd = q[2] >= 0;
      if (side === null || sd !== side) {
        if (cur) { if (side) fd += cur; else bd += cur; }
        cur = prev ? `M${pkF(prev[0])} ${pkF(prev[1])}L${pkF(q[0])} ${pkF(q[1])}` : `M${pkF(q[0])} ${pkF(q[1])}`;
        side = sd;
      } else cur += `L${pkF(q[0])} ${pkF(q[1])}`;
      prev = q;
    }
    if (cur) { if (side) fd += cur; else bd += cur; }
    pkD(front, fd || 'M0 0'); pkD(frontE, fd || 'M0 0'); pkD(back, bd || 'M0 0'); pkD(backE, bd || 'M0 0');
    // beads: re-parent all (in order) when any changes side
    const sides = []; let moved = false;
    for (let i = 0; i < n; i++) { const q = at(i); sides.push(q[2] >= 0 ? 1 : 0); if (bs[i]._side !== sides[i]) moved = true; }
    if (moved) for (let i = 0; i < n; i++) { (sides[i] ? frontB : backB).appendChild(bs[i]); bs[i]._side = sides[i]; }
    for (let i = 0; i < n; i++) {
      const q = at(i), v = mRamp(dk * (n - 1) + .6 - i, 0, .6);
      pkSet(bs[i], { x: q[0], y: q[1], o: v * (sides[i] ? 1 : .75) });
      pkSet(halos[i], { x: q[0], y: q[1], o: (gl[i] ?? gl.all ?? 0) * v });
      if (nums[i]) { const L = -r * Math.cos(pkRad(i * 100)), sg = L >= 0 ? 1 : -1, ox = sg * (bead + 16); pkSet(nums[i], { x: q[0] + ox * bh[0] + 2 * ah[0], y: q[1] + ox * bh[1] + 7, o: v * nk * (1 - uw) }); }
    }
    hbs.forEach((hb, i) => {
      const a = at(i), b2 = at(i + 4), v = Math.max(mRamp(bk * (hbs.length + .5) - i, 0, 1), one[i] || 0) * (1 - pkR(uw, 0, .3));
      hb.set(a[0], a[1], b2[0], b2[1], v * mRamp(dk * (n - 1) - i - 4 + .6, 0, .6));
    });
    // bracket on the left of the axis from residue tbs to tbs + 3.6
    const ris = rise * (1 + stretch * uw), off = -(r + bead + (numbers ? 58 : 30)), z1 = (tbs + z0) * ris, z2 = (tbs + 3.6 + z0) * ris, ph = pkRad(tilt);
    const P1 = [z1 * Math.cos(ph) * ah[0] + off * bh[0], z1 * Math.cos(ph) * ah[1] + off * bh[1]], P2 = [z2 * Math.cos(ph) * ah[0] + off * bh[0], z2 * Math.cos(ph) * ah[1] + off * bh[1]];
    const tk = [bh[0] * 12, bh[1] * 12];
    pkD(br, `M${pkP([P1[0] + tk[0], P1[1] + tk[1]])}L${pkP(P1)}L${pkP(pkL2(P1, P2, pkR(tb, 0, .6)))}${tb >= .6 ? `L${pkP([P2[0] + tk[0], P2[1] + tk[1]])}` : ''}`);
    pkO(br, tb > 0 ? 1 : 0);
    const mid = pkL2(P1, P2, .5);
    const Q = [mid[0] - bh[0] * 18, mid[1] - bh[1] * 18];
    bls.forEach((t2, j) => pkSet(t2, { x: Q[0], y: brA === 'middle' ? Q[1] - (2 - j) * 26 - 8 : Q[1] + (j - 1) * 27 + 8, o: pkR(tb, .5 + j * .12, .8 + j * .1) }));
    return h;
  }
  h = Object.assign(g, {
    n, len: (n - 1) * rise,
    draw(k) { dk = pkK(k); return apply(); },
    numbers(k) { nk = pkK(k); return apply(); },
    bonds(k) { bk = pkK(k); return apply(); },
    bond(i, k) { one[i] = pkK(k); return apply(); },
    turnBracket(k, start = 0) { tb = pkK(k); tbs = start; return apply(); },
    tilt(deg) { tilt = Math.round((+deg || 0) * 10) / 10; return apply(); },
    unwind(k) { uw = pkK(k); return apply(); },
    glow(i, k) { gl[i] = pkK(k); return apply(); },
    pt(i) { const q = at(i); return pkOut(g, [q[0], q[1]]); },
  });
  return apply();
}

/* ---------- the β-sheet ---------- */
// one broad arrow along x from x1 to x2 (either way), half-width hw, with a pleated (zigzag) edge
function pkArrowStrand(x1, x2, y, hw, k, pleat = 7, folds = 7) {
  const dir = x2 > x1 ? 1 : -1, L = Math.abs(x2 - x1) * k, hl = Math.min(hw * 1.5, L * .45), body = L - hl;
  const xs = t => x1 + dir * t;
  if (L < 2) return 'M0 0';
  const top = [], bot = [], nZ = Math.max(1, Math.round(folds * body / Math.abs(x2 - x1)));
  for (let i = 0; i <= nZ * 2; i++) { const t = body * i / (nZ * 2), zz = i % 2 ? pleat : 0; top.push([xs(t), y - hw + zz]); bot.push([xs(t), y + hw + zz]); }
  const tip = [xs(L), y], hb = xs(body);
  return 'M' + top.map(pkP).join('L') + `L${pkF(hb)} ${pkF(y - hw * 1.6)}L${pkP(tip)}L${pkF(hb)} ${pkF(y + hw * 1.6)}L` + bot.reverse().map(pkP).join('L') + 'Z';
}
// betaSheet(p, {x, y, s, o, strands=4, len=440, hw=26, gap=110, dir='parallel'|'anti', rungs=5, tags=true}) the β-sheet
// seen from above: broad cyan arrows (N → C, pleated edges) side by side, origin = the middle. dir 'anti' starts with
// every second strand pointing back. Starts drawn, no bonds. Setters combine: .strands(k) the arrows draw on in turn;
// .hbonds(k) dashed cyan hydrogen bonds between neighbouring strands (rungs per gap); .anti(k) every second arrow
// turns round (its arrow fades out, the reversed one fades in; tags too): 0 parallel, 1 antiparallel; .hairpin(k) a U
// turn joins strand 1's head to strand 2's tail (one chain folding back: antiparallel); .tags(k) N and C tags at
// each arrow's tail and head; .glow(i, k). .pt(i, 'tail'|'head'|'mid') in parent
function betaSheet(p, { x = 0, y = 0, s = 1, o = 1, strands = 4, len = 440, hw = 26, gap = 110, dir = 'parallel', rungs = 5, tags = true } = {}) {
  const g = G(p, { x, y, s, o });
  const ys = Array.from({ length: strands }, (_, i) => (i - (strands - 1) / 2) * gap);
  const hairE = path(g, 'M0 0', { stroke: PC.sheetEdge, 'stroke-width': hw * .9 + 5 }), hair = path(g, 'M0 0', { stroke: PC.sheet, 'stroke-width': hw * .9 });
  const hbG = G(g), haloG = G(g), arG = G(g), tagG = G(g);
  const fw = [], bw = [], halos = [], tg = [];
  ys.forEach((yy, i) => {
    halos.push(path(haloG, pkRect(len + 40, hw * 3.6, hw * 1.2, 0, yy), { fill: PC.glow, 'fill-opacity': .22, stroke: PC.glow, 'stroke-width': 3 })); put(halos[i], { o: 0 });
    fw.push(path(arG, 'M0 0', { fill: PC.sheet, 'fill-opacity': .85, stroke: PC.sheetEdge, 'stroke-width': 3.5 }));
    bw.push(i % 2 ? path(arG, 'M0 0', { fill: PC.sheet, 'fill-opacity': .85, stroke: PC.sheetEdge, 'stroke-width': 3.5 }) : null);
    const mkTag = (lt, col) => { const t2 = G(tagG); mk('circle', { r: 15, fill: col, stroke: PC.ink, 'stroke-width': 2 }, t2); pkText(t2, lt, { y: 6, size: 17, fill: PC.ink, weight: 900 }); return t2; };
    tg.push({ nF: mkTag('N', PC.nTerm), cF: mkTag('C', PC.cTerm), nB: i % 2 ? mkTag('N', PC.nTerm) : null, cB: i % 2 ? mkTag('C', PC.cTerm) : null });
  });
  const hbs = [];
  for (let i = 0; i + 1 < strands; i++) for (let j = 0; j < rungs; j++) hbs.push([i, j, hBondMark(hbG, { w: 4 })]);
  let sk = 1, hk = 0, ak = dir === 'anti' ? 1 : 0, hp = 0, tk = tags ? 1 : 0; const gl = {};
  let b;
  function apply() {
    const x1 = -len / 2, x2 = len / 2, aOut = 1 - pkR(ak, 0, .45), aIn = pkR(ak, .55, 1);
    ys.forEach((yy, i) => {
      const k = mRamp(sk * (strands + .3) - i, 0, 1);
      pkD(fw[i], pkArrowStrand(x1, x2, yy, hw, k)); pkO(fw[i], i % 2 ? aOut : 1);
      if (bw[i]) { pkD(bw[i], pkArrowStrand(x2, x1, yy, hw, k)); pkO(bw[i], aIn); }
      pkO(halos[i], gl[i] ?? gl.all ?? 0);
      const T3 = tg[i], tv = tk * (k >= 1 ? 1 : 0);
      const hpI = 1 - pkR(hp, 0, .3);
      pkSet(T3.nF, { x: x1 - 26, y: yy, o: tv * (i % 2 ? aOut : 1) }); pkSet(T3.cF, { x: x2 + 26, y: yy, o: tv * (i % 2 ? aOut : 1) * (i === 0 ? hpI : 1) });
      if (T3.nB) { pkSet(T3.nB, { x: x2 + 26, y: yy, o: tv * aIn * (i === 1 ? hpI : 1) }); pkSet(T3.cB, { x: x1 - 26, y: yy, o: tv * aIn }); }
    });
    const N = hbs.length;
    hbs.forEach(([i, j, hb], q) => {
      const xx = -len / 2 + len * (j + .5) / rungs - hw * .6, v = mRamp(hk * (N + .5) - q, 0, 1) * mRamp(sk * (strands + .3) - i - 1, 0, 1);
      hb.set(xx, ys[i] + hw * 1.15, xx, ys[i + 1] - hw * 1.05, v);
    });
    if (strands > 1) {
      const R2 = (ys[1] - ys[0]) / 2, cx = len / 2 - 6, cy = (ys[0] + ys[1]) / 2;
      const pts = []; const m = Math.max(1, Math.round(24 * hp));
      for (let i = 0; i <= m; i++) { const a = -Math.PI / 2 + Math.PI * hp * i / m; pts.push([cx + R2 * 1.05 * Math.cos(a) + 10, cy + R2 * Math.sin(a)]); }
      const d = hp > 0 ? pkPoly(pts) : 'M0 0'; pkD(hair, d); pkD(hairE, d); pkO(hair, hp > 0 ? 1 : 0); pkO(hairE, hp > 0 ? 1 : 0);
    }
    return b;
  }
  b = Object.assign(g, {
    strands(k) { sk = pkK(k); return apply(); },
    hbonds(k) { hk = pkK(k); return apply(); },
    anti(k) { ak = pkK(k); return apply(); },
    parallel(k) { ak = pkK(1 - k); return apply(); },
    hairpin(k) { hp = pkK(k); return apply(); },
    tags(k) { tk = pkK(k); return apply(); },
    glow(i, k) { gl[i] = pkK(k); return apply(); },
    pt(i, w = 'mid') { const back2 = i % 2 && ak > .5, xx = w === 'mid' ? 0 : (w === 'head') !== back2 ? len / 2 : -len / 2; return pkOut(g, [xx, ys[Math.max(0, Math.min(strands - 1, i))]]); },
  });
  return apply();
}
// pleatSide(p, {x, y, s, o, len=520, folds=8, amp=26, strands=1, gap=170, rBadges=true}) the β-sheet's side view: a
// strand as a zigzag (pleated) line with side-chain badges alternately above and below its corners (strands 2: a second
// one gap below, H-bond rungs between). .draw(k) the zigzags draw on; .badges(k); .hbonds(k) dashed cyan rungs between the strands
function pleatSide(p, { x = 0, y = 0, s = 1, o = 1, len = 520, folds = 8, amp = 26, strands = 1, gap = 170, rBadges = true } = {}) {
  const g = G(p, { x, y, s, o });
  const hbG = G(g), lines = [], badgeG = G(g, { o: rBadges ? 1 : 0 }), pts = [];
  for (let si = 0; si < strands; si++) {
    const yy = (si - (strands - 1) / 2) * gap, P0 = [];
    for (let i = 0; i <= folds * 2; i++) P0.push([-len / 2 + len * i / (folds * 2), yy + (i % 2 ? -amp : amp) / 2]);
    pts.push(P0);
    lines.push(path(g, 'M0 0', { stroke: PC.sheet, 'stroke-width': 9 }));
    P0.forEach((q, i) => { if (i % 2 === 0 && i > 0 && i < folds * 2) { const up = (i / 2) % 2 ? -1 : 1; path(badgeG, `M${pkP(q)}L${pkF(q[0])} ${pkF(q[1] + up * 28)}`, { stroke: PC.stick, 'stroke-width': 3 }); mk('circle', { cx: pkF(q[0]), cy: pkF(q[1] + up * 34), r: 9, fill: P_CHAIN_COLS[(i / 2 + si) % 9], stroke: PC.ink, 'stroke-width': 1.5 }, badgeG); } });
  }
  const hbs = []; for (let si = 0; si + 1 < strands; si++) for (let i = 1; i < folds * 2; i += 2) hbs.push([si, i, hBondMark(hbG, { w: 3.5, dots: false })]);
  let dk = 1, bk = 1, hk = 0, pl;
  function apply() {
    pts.forEach((P0, si) => { const m = Math.max(1, Math.round(dk * (P0.length - 1))); pkD(lines[si], dk > 0 ? pkPoly(P0.slice(0, m + 1)) : 'M0 0'); pkO(lines[si], dk > 0 ? 1 : 0); });
    pkO(badgeG, rBadges ? bk * dk : 0);
    hbs.forEach(([si, i, hb], q) => { const a = pts[si][i], c = pts[si + 1][i]; hb.set(a[0], a[1] + 8, c[0], c[1] - 8, mRamp(hk * (hbs.length + .5) - q, 0, 1)); });
    return pl;
  }
  pl = Object.assign(g, {
    draw(k) { dk = pkK(k); return apply(); },
    badges(k) { bk = pkK(k); return apply(); },
    hbonds(k) { hk = pkK(k); return apply(); },
  });
  return apply();
}

/* ---------- the folded globule ---------- */
// resample a polyline into m points evenly spaced along it
function pkResample(pts, m) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = L[L.length - 1] || 1, out = []; let j = 1;
  for (let i = 0; i < m; i++) {
    const want = tot * i / (m - 1); while (j < L.length - 1 && L[j] < want) j++;
    const f = L[j] - L[j - 1] ? (want - L[j - 1]) / (L[j] - L[j - 1]) : 0; out.push(pkL2(pts[j - 1], pts[j], mClamp(f)));
  }
  return { pts: out, len: tot };
}
// the three layouts of a globule's chain: folded (a meander of rows inside the blob), extended (a gentle wave across),
// coil (a loose random walk)
function pkGlobLayouts(R, m, seed, rows) {
  const raw = [];
  for (let r = 0; r < rows; r++) {
    const yy = (r - (rows - 1) / 2) * R * 1.5 / rows, half = Math.sqrt(Math.max(0, 1 - (yy / (R * .95)) ** 2)) * R * .78, dir = r % 2 ? -1 : 1;
    for (let i = 0; i <= 8; i++) { const f = i / 8, xx = dir * (-half + 2 * half * f); raw.push([xx + R * .05 * Math.sin(i * 1.7 + seed + r), yy + R * .07 * Math.sin(i * 2.3 + seed * 1.3 + r)]); }
  }
  const F = pkResample(raw, m), L = F.len;
  const ext = [], coil = [];
  const EL = Math.min(L * .92, R * 6);
  for (let i = 0; i < m; i++) { const f = i / (m - 1); ext.push([(f - .5) * EL, R * .12 * Math.sin(f * 9 + seed)]); }
  let a = seed, px = 0, py = 0; const c0 = [], st2 = L / (m - 1) * .95;
  for (let i = 0; i < m; i++) { c0.push([px, py]); a += (pkHash(i, seed + 7) - .5) * 1.9; px += st2 * Math.cos(a); py += st2 * Math.sin(a); }
  const mx = c0.reduce((s2, q) => s2 + q[0], 0) / m, my = c0.reduce((s2, q) => s2 + q[1], 0) / m;
  let mr = 1; c0.forEach(q => { mr = Math.max(mr, Math.hypot(q[0] - mx, (q[1] - my) * 1.2)); });
  const sc = Math.min(1, R * 1.7 / mr);
  c0.forEach(q => coil.push([(q[0] - mx) * sc, (q[1] - my) * sc]));
  return { fold: F.pts, ext, coil };
}
// a surface outline with an optional pocket (a dent at angle pa)
function pkSurface(R, seed, pocket, pa = -50, n = 56) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / n * 2 * Math.PI; let k = 1 + .05 * (Math.sin(3 * t + seed) + .6 * Math.sin(5 * t + 2.3 * seed));
    if (pocket) { let d = t - pkRad(pa); d = Math.atan2(Math.sin(d), Math.cos(d)); k -= .3 * Math.exp(-(d * d) / .05); }
    pts.push([R * k * Math.cos(t), R * .88 * k * Math.sin(t)]);
  }
  return pkSmooth(pts, true);
}
// globule(p, {x, y, s, o, R=150, seed=1, color=PC.globule, m=72, rows=5, helices, sheets, beads=0, beadColors, pocket=false,
//   pa=-50, slots=4, mini=false}) one folded polypeptide (tertiary structure): a green ribbon packed inside a soft surface,
// with α-helix coils and β-strand arrows (cyan) on parts of it. helices / sheets: index ranges along the m chain points
// (defaults: two helices, two sheet strands; mini: one of each). beads: that many class-coloured beads spaced along the
// chain (its primary sequence, kept through unfolding). pocket: a dent in the surface (active site). Origin = centre;
// about 2R × 1.8R folded. Starts folded. Setters combine: .fold(k) extended (a wavy line 6R long, the helices and
// sheets already formed) → folded; .tangle(k) → a loose random coil (denatured: the coils and arrows fade, the surface
// goes; the beads keep their order); .pocket(k) a glow in the pocket; .partner(k) a coral partner slides in from up
// right and docks in the pocket; .lobe(i, k) a dashed outline round the left (0) or right (1) half (a domain);
// .bonds({peptide, ss, h, salt, core}) each 0..1: orange peptide links along the chain, a yellow S–S bridge, cyan
// hydrogen bonds, a salt bridge, grey-gold hydrophobic beads in the core (pairs picked where the folded chain comes
// close); .labels(k) "α-helix", "β-sheet", "loop" tags on the parts; .tint(color) ribbon and surface colour (pass the
// same colour every frame); .glow(k). .slotPt(i) a point on the surface (i from the top, clockwise; for prosthetic
// groups), .pt('pocket'|'centre'|'start'|'end') in parent; .chainPt(i)
function globule(p, { x = 0, y = 0, s = 1, o = 1, R = 150, seed = 1, color = PC.globule, m, rows, helices, sheets, beads = 0, beadColors, pocket = false,
  pa = -50, slots = 4, mini = false } = {}) {
  m = m || (mini ? 44 : 72); rows = rows || (mini ? 4 : 5);
  helices = helices || (mini ? [[4, 14]] : [[6, 20], [44, 58]]);
  sheets = sheets || (mini ? [[24, 32], [33, 40]] : [[24, 31], [32, 40]]);
  const L = pkGlobLayouts(R, m, seed, rows);
  const g = G(p, { x, y, s, o });
  const glow = path(g, pkSurface(R * 1.08, seed, pocket, pa), { fill: PC.glow, 'fill-opacity': .15, stroke: PC.glow, 'stroke-width': 5 }); put(glow, { o: 0 });
  const surf = path(g, pkSurface(R, seed, pocket, pa), { fill: color, 'fill-opacity': .18, stroke: color, 'stroke-width': mini ? 3 : 4 });
  const lobeG = [0, 1].map(i => { const e = path(g, pkRect(R * 1.08, R * 1.65, R * .5, (i ? 1 : -1) * R * .5, 0), { fill: 'none', stroke: COL.chalk, 'stroke-width': 3.5, 'stroke-dasharray': '10 8' }); put(e, { o: 0 }); return e; });
  const pg = pkHalo(g, R * .26, PC.glow, R * .82 * Math.cos(pkRad(pa)), R * .72 * Math.sin(pkRad(pa)));
  const rib = path(g, 'M0 0', { stroke: color, 'stroke-width': mini ? 6 : 9 });
  const pepDots = path(g, 'M0 0', { stroke: PC.peptide, 'stroke-width': mini ? 7 : 11 }); put(pepDots, { o: 0 });
  const hel = helices.map(() => path(g, 'M0 0', { stroke: PC.helix, 'stroke-width': mini ? 4 : 6 }));
  const shE = sheets.map(() => path(g, 'M0 0', { fill: PC.sheet, stroke: PC.sheetEdge, 'stroke-width': 2.5 }));
  const beadG = G(g), bs = [];
  for (let i = 0; i < beads; i++) { const bg = G(beadG); pkBall(bg, mini ? 7 : 11, beadColors ? beadColors[i % beadColors.length] : P_CHAIN_COLS[i % 9], PC.ink, { sw: 1.5 }); bs.push([Math.round((i + .5) * (m - 1) / beads), bg]); }
  // bond pairs: chain points far apart in sequence but close when folded
  const F = L.fold, close = [];
  for (let i = 0; i < m; i++) for (let j = i + 10; j < m; j++) { const d = Math.hypot(F[i][0] - F[j][0], F[i][1] - F[j][1]); if (d < R * .45 && d > R * .12) close.push([d, i, j]); }
  close.sort((a, b2) => a[0] - b2[0]);
  const used = new Set(), pick = () => { for (const [, i, j] of close) if (!used.has(i) && !used.has(j) && ![...used].some(u => Math.abs(u - i) < 4 || Math.abs(u - j) < 4)) { used.add(i); used.add(j); return [i, j]; } return [0, m - 1]; };
  const ssP = pick(), hP = [pick(), pick(), pick()], saltP = pick();
  const byC = F.map((q, i) => [Math.hypot(q[0], q[1]), i]).sort((a, b2) => a[0] - b2[0]).slice(0, mini ? 3 : 5).map(v => v[1]);
  const bondG = G(g);
  const ssM = disulfideMark(bondG, { w: mini ? 7 : 10, r: mini ? 8 : 12, labels: !mini });
  const hM = hP.map(() => hBondMark(bondG, { w: mini ? 3 : 4 }));
  const sM = saltBridge(bondG, { r: mini ? 9 : 14, arrows: false });
  const coreG = G(bondG), cores = byC.map(() => { const c = G(coreG); pkBall(c, mini ? 9 : 14, PC.hydrophobic, PC.hydrophobicEdge, { sw: 2 }); return c; });
  const labG = G(g, { o: 0 });
  const lH = pkText(labG, 'α-helix', { size: 24, fill: PC.helix }), lS = pkText(labG, 'β-sheet', { size: 24, fill: PC.sheet }), lL = pkText(labG, 'loop', { size: 24, fill: color });
  const part = G(g, { o: 0 });
  path(part, pkRect(R * .34, R * .2, R * .06), { fill: '#f07a6a', stroke: '#a84a3e', 'stroke-width': 3 });
  let fk = 1, uk = 0, pk = 0, ptk = 0, lb = [0, 0], bd = { peptide: 0, ss: 0, h: 0, salt: 0, core: 0 }, col = color, h;
  const ptsNow = () => F.map((q, i) => { const a = pkL2(L.ext[i], q, pkSS(fk)); return pkL2(a, L.coil[i], pkSS(uk)); });
  function apply() {
    const P0 = ptsNow(), sec = 1 - pkR(uk, 0, .6);
    pkD(rib, pkSmooth(P0));
    pkA(rib, 'stroke', col); pkA(surf, 'stroke', col); pkA(surf, 'fill', col);
    pkO(surf, pkSS(fk) * (1 - pkR(uk, 0, .5)));
    pkO(glow, gk2);
    helices.forEach(([a, b2], i) => {
      const seg = P0.slice(a, b2 + 1), res = pkResample(seg, Math.max(8, Math.round((b2 - a) * 4))), q = res.pts, amp = (mini ? 7 : 11) * sec;
      const out = q.map((pt, j) => { const nb = q[Math.min(q.length - 1, j + 1)], pv = q[Math.max(0, j - 1)], dx = nb[0] - pv[0], dy = nb[1] - pv[1], l = Math.hypot(dx, dy) || 1; const ph = j * 1.25; return [pt[0] - dy / l * amp * Math.sin(ph) + dx / l * amp * .4 * Math.cos(ph), pt[1] + dx / l * amp * Math.sin(ph) + dy / l * amp * .4 * Math.cos(ph)]; });
      pkD(hel[i], pkSmooth(out)); pkO(hel[i], sec);
    });
    sheets.forEach(([a, b2], i) => {
      const q = P0.slice(a, b2 + 1), hw = (mini ? 6 : 10), n2 = q.length, top = [], bot = [];
      for (let j = 0; j < n2 - 1; j++) { const nb = q[j + 1], pv = q[Math.max(0, j - 1)], dx = nb[0] - pv[0], dy = nb[1] - pv[1], l = Math.hypot(dx, dy) || 1; top.push([q[j][0] - dy / l * hw, q[j][1] + dx / l * hw]); bot.push([q[j][0] + dy / l * hw, q[j][1] - dx / l * hw]); }
      const e = q[n2 - 1], pv = q[n2 - 2], dx = e[0] - pv[0], dy = e[1] - pv[1], l = Math.hypot(dx, dy) || 1, b0 = q[n2 - 2];
      const d = 'M' + top.map(pkP).join('L') + `L${pkP([b0[0] - dy / l * hw * 1.9, b0[1] + dx / l * hw * 1.9])}L${pkP([e[0] + dx / l * 4, e[1] + dy / l * 4])}L${pkP([b0[0] + dy / l * hw * 1.9, b0[1] - dx / l * hw * 1.9])}L` + bot.reverse().map(pkP).join('L') + 'Z';
      pkD(shE[i], d); pkO(shE[i], sec);
    });
    bs.forEach(([i, bg]) => pkSet(bg, { x: P0[i][0], y: P0[i][1] }));
    let dots = ''; for (let i = 1; i < m; i += 3) dots += `M${pkP(pkL2(P0[i - 1], P0[i], .5))}h.01`;
    pkD(pepDots, dots); pkO(pepDots, bd.peptide);
    const keep = 1 - pkR(uk, 0, .4);
    ssM.set(P0[ssP[0]], P0[ssP[1]], bd.ss); pkO(ssM, bd.ss > 0 ? 1 : 0);
    hM.forEach((hb, i) => hb.set(P0[hP[i][0]][0], P0[hP[i][0]][1], P0[hP[i][1]][0], P0[hP[i][1]][1], mRamp(bd.h * 3.3 - i, 0, 1) * keep));
    sM.set(P0[saltP[0]], P0[saltP[1]], bd.salt); pkO(sM, bd.salt > 0 ? keep : 0);
    cores.forEach((c, i) => pkSet(c, { x: P0[byC[i]][0], y: P0[byC[i]][1], o: bd.core * keep }));
    const hm = P0[Math.round((helices[0][0] + helices[0][1]) / 2)], sm = P0[Math.round((sheets[0][0] + sheets[0][1]) / 2)], lm = P0[Math.round((sheets[sheets.length - 1][1] + (helices[1] || [m - 1])[0]) / 2)] || P0[m - 1];
    pkSet(lH, { x: hm[0], y: hm[1] - (mini ? 18 : 30) }); pkSet(lS, { x: sm[0], y: sm[1] + (mini ? 30 : 44) }); pkSet(lL, { x: lm[0], y: lm[1] - 26 });
    pkO(pg, pk);
    const pp = [R * .78 * Math.cos(pkRad(pa)), R * .68 * Math.sin(pkRad(pa))], far = [pp[0] + R * 1.1 * Math.cos(pkRad(pa)), pp[1] + R * 1.1 * Math.sin(pkRad(pa))], e = pkSS(ptk);
    pkSet(part, { x: pkL(far[0], pp[0], e), y: pkL(far[1], pp[1], e), r: pa + 90, o: pkR(ptk, 0, .2) });
    pkO(lobeG[0], lb[0]); pkO(lobeG[1], lb[1]);
    return h;
  }
  let gk2 = 0;
  h = Object.assign(g, {
    R, m,
    fold(k) { fk = pkK(k); return apply(); },
    tangle(k) { uk = pkK(k); return apply(); },
    unfold(k) { return h.tangle(k); },
    pocket(k) { pk = pocket ? pkK(k) : 0; return apply(); },
    partner(k) { ptk = pkK(k); return apply(); },
    lobe(i, k) { lb[i ? 1 : 0] = pkK(k); return apply(); },
    bonds(v = {}) { for (const k in v) if (k in bd) bd[k] = pkK(v[k]); return apply(); },
    labels(k) { pkO(labG, pkK(k)); return h; },
    tint(c) { col = c; return apply(); },
    glow(k) { gk2 = pkK(k); return apply(); },
    slotPt(i) { const a = pkRad(-90 + (i % slots) * 360 / slots); return pkOut(g, [R * 1.02 * Math.cos(a), R * .9 * Math.sin(a)]); },
    chainPt(i) { return pkOut(g, ptsNow()[Math.max(0, Math.min(m - 1, i))]); },
    pt(nm) { const P0 = ptsNow(); return pkOut(g, { pocket: [R * .78 * Math.cos(pkRad(pa)), R * .68 * Math.sin(pkRad(pa))], start: P0[0], end: P0[m - 1] }[nm] || [0, 0]); },
  });
  return apply();
}

/* ---------- subunits: dimers, tetramers, hemoglobin ---------- */
const P_PACK = {
  1: [[0, 0]], 2: [[-1.02, 0], [1.02, 0]], 3: [[-1.02, .55], [1.02, .55], [0, -1.05]], 4: [[-1.02, -.92], [1.02, -.92], [-1.02, .92], [1.02, .92]],
};
// subunitComplex(p, {x, y, s, o, n=4, R=90, tints, labels, seeds, hemes=false, contacts=true}) n (1–4) folded subunits
// (globule, mini; each turned its own way) packed together (quaternary structure), origin = the centre; each its own tint (default lavender,
// green, peach, pink). labels: a text per subunit (in its centre, o 0). hemes: a red heme disc with "Fe²⁺" in each.
// Packed about 4R × 3.7R (n 4). Starts packed. Setters combine: .pack(k) scattered (spread = 2.3× further out, turned) →
// packed; .contacts(k) cyan H-bond dashes and grey-gold hydrophobic patches between touching subunits; .labels(k);
// .label(i, text); .hemes(k); .focus(i | [i…] | null, k) dims the others to .25. .sub(i) the globule; .pt(i) its centre
// in parent
function subunitComplex(p, { x = 0, y = 0, s = 1, o = 1, n = 4, R = 90, tints, labels, seeds, hemes = false, contacts = true, spread = 2.3 } = {}) {
  const g = G(p, { x, y, s, o });
  const tl = tints || [PC.quaternary, PC.tertiary, PC.branched, PC.carboxyl];
  const pos = P_PACK[n].map(([a, b2]) => [a * R, b2 * R]);
  const ctG = G(g, { o: 0 }), wraps = [], subs = [], labs = [], hm = [];
  pos.forEach((q, i) => {
    const w = G(g); wraps.push(w);
    const rot = G(w, { r: [0, 180, 90, 270][i % 4] + (i % 2 ? 12 : -10) });
    subs.push(globule(rot, { R: R * .96, mini: true, seed: seeds ? seeds[i] : i * 1.7 + 1, color: tl[i % tl.length] }));
    const hg = G(w, { o: hemes ? 1 : 0 });
    mk('circle', { r: R * .24, fill: PC.heme, stroke: PC.hemeEdge, 'stroke-width': 3 }, hg);
    pkText(hg, 'Fe^{2+}', { y: 6, size: Math.round(R * .17), fill: '#fff', weight: 800 });
    hm.push(hg);
    labs.push(pkText(w, labels ? labels[i] : '', { y: R * (hemes ? .55 : .1), size: Math.round(R * .3), fill: COL.chalk, weight: 800, o: 0 }));
  });
  // contacts between neighbours closer than 2.1R
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = pos[i], b2 = pos[j], d = Math.hypot(b2[0] - a[0], b2[1] - a[1]); if (d > 2.1 * R) continue;
    const m2 = pkL2(a, b2, .5), ux = (b2[0] - a[0]) / d, uy = (b2[1] - a[1]) / d, nx = -uy, ny = ux;
    [-.35, .35].forEach(f => { const hb = hBondMark(ctG, { w: 3.5 }); hb.set(m2[0] + nx * R * f - ux * R * .2, m2[1] + ny * R * f - uy * R * .2, m2[0] + nx * R * f + ux * R * .2, m2[1] + ny * R * f + uy * R * .2); });
    [[0, -.05], [-.1, .08], [.1, .06]].forEach(([u, v]) => pkBall(ctG, R * .1, PC.hydrophobic, PC.hydrophobicEdge, { cx: m2[0] + nx * R * (u + .02) + ux * R * v, cy: m2[1] + ny * R * (u + .02) + uy * R * v, sw: 1.5 }));
  }
  let pk = 1, ck = 0, lk = 0, hk = hemes ? 1 : 0, lit = null, fk = 0, c;
  function apply() {
    const e = pkSS(pk);
    pos.forEach((q, i) => {
      const f = lit ? (lit.has(i) ? 1 : 1 - .75 * fk) : 1, sx = q[0] || (i - (n - 1) / 2) * R * .3, sy = q[1] || -R * .3;
      pkSet(wraps[i], { x: pkL(sx * spread, q[0], e), y: pkL(sy * spread, q[1], e), r: (1 - e) * (i % 2 ? 24 : -20), o: f });
      pkO(labs[i], lk); pkO(hm[i], hk);
    });
    pkO(ctG, contacts ? ck * pkR(pk, .85, 1) : 0);
    return c;
  }
  c = Object.assign(g, {
    subs,
    pack(k) { pk = pkK(k); return apply(); },
    apart(k) { pk = pkK(1 - k); return apply(); },
    contacts(k) { ck = pkK(k); return apply(); },
    labels(k) { lk = pkK(k); return apply(); },
    label(i, str) { if (labs[i]) pkTx(labs[i], str); return c; },
    hemes(k) { hk = pkK(k); return apply(); },
    focus(idx, k = 1) { const L2 = idx == null ? [] : Array.isArray(idx) ? idx : [idx]; lit = L2.length ? new Set(L2) : null; fk = pkK(k); return apply(); },
    sub(i) { return subs[i]; },
    pt(i) { return pkOut(g, [st(wraps[i]).x, st(wraps[i]).y]); },
  });
  return apply();
}
// hemoglobin(p, {x, y, s, o, R=90}) subunitComplex with four subunits: α₁ α₂ (lavender, top) and β₁ β₂ (pink, bottom),
// each with its red heme disc and Fe²⁺, labels shown. Same setters (.apart(k) = pack(1 − k), .hemes(k), .labels(k) …)
function hemoglobin(p, { x = 0, y = 0, s = 1, o = 1, R = 90, contacts = true } = {}) {
  const h = subunitComplex(p, { x, y, s, o, n: 4, R, tints: [PC.quaternary, PC.quaternary, '#f0a0c8', '#f0a0c8'], labels: ['α_1', 'α_2', 'β_1', 'β_2'], hemes: true, contacts, seeds: [1, 2.6, 4.1, 5.3] });
  return h.labels(1);
}

/* ---------- misfolding ---------- */
// misfoldedChain(p, {x, y, s, o, R=60, seed=4, m=30, color=PC.aggregate}) one chain that cannot fold well: .set(k) a loose
// wavy line (0) becomes a dense, knotted tangle (1); .tint(color). Starts tangled.
function misfoldedChain(p, { x = 0, y = 0, s = 1, o = 1, R = 60, seed = 4, m = 30, color = PC.aggregate } = {}) {
  const g = G(p, { x, y, s, o });
  const line = [], knot = [];
  for (let i = 0; i < m; i++) {
    const f = i / (m - 1); line.push([(f - .5) * R * 4, R * .25 * Math.sin(f * 10 + seed)]);
  }
  { let a = seed * 2, px = 0, py = 0; const stp = R * .42;
    for (let i = 0; i < m; i++) { knot.push([px, py]); a += .9 + (pkHash(i, seed + 9) - .5) * 1.6; if (Math.hypot(px, py) > R * .7) a = Math.atan2(-py, -px) + (pkHash(i, seed) - .5); px += stp * Math.cos(a); py += stp * Math.sin(a) * .85; } }
  const ln = path(g, 'M0 0', { stroke: color, 'stroke-width': 6 });
  let k0 = -1, col = color, mc;
  mc = Object.assign(g, {
    set(k) { const kk = pkK(k); if (kk !== k0) { k0 = kk; pkD(ln, pkSmooth(line.map((q, i) => pkL2(q, knot[i], pkSS(kk))))); } return mc; },
    tint(c) { col = c; pkA(ln, 'stroke', col); return mc; },
  });
  return mc.set(1);
}
// aggregate(p, {x, y, s, o, n=6, R=55, seed=2, spread=260}) several misfolded chains (brown-grey tangles) scattered;
// .clump(k) they gather into one dense insoluble clump (fibrous lines across it at the end); .plaque(k) the clump
// darkens to amyloid amber with a dense outline (an amyloid plaque); .pt('centre')
function aggregate(p, { x = 0, y = 0, s = 1, o = 1, n = 6, R = 55, seed = 2, spread = 260 } = {}) {
  const g = G(p, { x, y, s, o });
  const halo = path(g, pkBlob(R * 2.2, R * 1.7, seed, .1), { fill: PC.plaque, 'fill-opacity': .35, stroke: PC.plaqueEdge, 'stroke-width': 5 }); put(halo, { o: 0 });
  const ws = [], ch = [], far = [], near = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * 2 * Math.PI + seed;
    far.push([spread * Math.cos(a) * (.7 + .3 * pkHash(i, seed)), spread * .6 * Math.sin(a) * (.7 + .3 * pkHash(i, seed + 1))]);
    near.push([R * 1.1 * Math.cos(a) * (.4 + .6 * pkHash(i, seed + 2)), R * .75 * Math.sin(a) * (.4 + .6 * pkHash(i, seed + 3))]);
    const w = G(g); ws.push(w); ch.push(misfoldedChain(w, { R, seed: seed + i * 1.3, m: 24 }));
  }
  const fib = path(g, Array.from({ length: 7 }, (_, i) => `M${pkF(-R * 1.75)} ${pkF((i - 3) * R * .3)}Q0 ${pkF((i - 3) * R * .3 + R * .25 * (i % 2 ? 1 : -1))} ${pkF(R * 1.75)} ${pkF((i - 3) * R * .28)}`).join(''), { stroke: PC.plaqueEdge, 'stroke-width': 3, 'stroke-opacity': .7 }); put(fib, { o: 0 });
  let ck = 0, pk = 0, a2;
  function apply() {
    const e = pkSS(ck), col = pkMix(PC.aggregate, PC.plaque, pk);
    ws.forEach((w, i) => pkSet(w, { x: pkL(far[i][0], near[i][0], e), y: pkL(far[i][1], near[i][1], e), r: (1 - e) * (i * 37 % 90) }));
    ch.forEach(c => c.tint(col));
    pkO(fib, pkR(ck, .7, 1) * .9); pkO(halo, pk);
    return a2;
  }
  a2 = Object.assign(g, {
    chains: ch,
    clump(k) { ck = pkK(k); return apply(); },
    plaque(k) { pk = pkK(k); return apply(); },
    pt() { return pkOut(g, [0, 0]); },
  });
  return apply();
}

/* ---------- the chapter 3 thread: the four-levels strip ---------- */
const P_LEVELS = ['primary', 'secondary', 'tertiary', 'quaternary'];
const P_LEVEL_TAG = { primary: 'peptide bonds', secondary: 'backbone H-bonds', tertiary: 'side-chain bonds', quaternary: 'between subunits' };
const pkLevel = v => typeof v === 'number' ? P_LEVELS[v - 1] : v;
// levelsStrip(p, {x=800, y=450, s, o, w=1440, h=330, vertical=false, tags=false}) the four levels as chevrons in their
// tints, names written in full: primary (a gold-tinted bead chain with N and C tags), secondary (an α-helix and a
// two-strand β-sheet, cyan), tertiary (one folded globule, green), quaternary (four packed globules, lavender).
// Origin = the strip's centre; horizontal: primary left → quaternary right, w × h; vertical: quaternary on top,
// primary at the bottom, 600 × h (h defaults to 860), the names to the right of the pictures.
// Starts built with the bond tags hidden. Setters combine: .build(k) frames appear in turn, each picture after its
// frame; .focus(levels, k) lights levels (names, numbers 1–4, or arrays; null all) and dims the rest to .25;
// .tags(k) the bond tag under each name (peptide bonds / backbone H-bonds / side-chain bonds / between subunits);
// .tick(level, k) a green tick on a frame; .glow(level, k); .contents(k) the pictures (0: empty frames);
// .unfold(level, u) that level dissolves into the one below and its frame dims (quaternary: the subunits drift
// apart; tertiary: the globule opens into a loose coil; secondary: the helix unwinds and the sheet fades into a
// wavy strand; primary never changes): run them top-down for denaturation. .chain .helix .sheet .glob .quat (the
// pieces); .pt(level) in parent
function levelsStrip(p, { x = 800, y = 450, s = 1, o = 1, w = 1440, h, vertical = false, tags = false } = {}) {
  h = h ?? (vertical ? 860 : 330);
  const g = G(p, { x, y, s, o });
  const pw = vertical ? 600 : w / 4, ph = vertical ? h / 4 : h, a = vertical ? 24 : 30;
  const at = i => vertical ? [0, (1.5 - i) * ph] : [(i - 1.5) * pw, 0];
  const chev = () => {
    if (!vertical) { const L = -pw / 2 + 6, R = pw / 2 - 6, H = ph / 2; return `M${L} ${-H}L${R - a} ${-H}L${R + a * .55} 0L${R - a} ${H}L${L} ${H}L${L + a} 0Z`; }
    const T = -ph / 2 + 5, B = ph / 2 - 5, W = pw / 2; return `M${-W} ${B}L${-W} ${T + a}L0 ${T - a * .55}L${W} ${T + a}L${W} ${B}L0 ${B - a}Z`;
  };
  const panels = {}, st2 = {};
  const cx = vertical ? -120 : 0, cy = vertical ? 0 : -34, cs = vertical ? .82 : 1;
  P_LEVELS.forEach((lv, i) => {
    const tint = PC[lv], pg = G(g, { x: at(i)[0], y: at(i)[1] });
    const glow = path(pg, chev(), { fill: PC.glow, 'fill-opacity': .12, stroke: PC.glow, 'stroke-width': 10 }); put(glow, { o: 0 });
    const frame = path(pg, chev(), { fill: tint, 'fill-opacity': .1, stroke: tint, 'stroke-width': 4 });
    const cg = G(pg, { x: cx, y: cy, s: cs });
    const lx = vertical ? 150 : 0, ly = vertical ? -4 : ph / 2 - 52;
    const name = pkText(pg, lv, { x: lx, y: ly, size: 30, fill: tint, weight: 800 });
    const tag = pkText(pg, P_LEVEL_TAG[lv], { x: lx, y: ly + 30, size: 20, fill: COL.dim, weight: 600, o: 0 });
    const tk = pkTick(pg, { x: vertical ? pw / 2 - 34 : pw / 2 - a - 30, y: -ph / 2 + 32 });
    panels[lv] = { g: pg, glow, frame, cg, name, tag, tk };
    st2[lv] = { tick: 0, glow: 0, u: 0 };
  });
  const chain = beadChain(panels.primary.cg, { n: 7, sp: 38, r: 14, wave: 10, chips: false, endText: false, colors: [PC.simple, PC.basic, PC.hydroxy, PC.acidic, PC.aromatic, PC.branched, PC.hetero] });
  const helix = alphaHelix(panels.secondary.cg, { x: -70, n: 9, r: 26, rise: 15, w: 9, bead: 6, numbers: false, stretch: .25 });
  const sheet = betaSheet(panels.secondary.cg, { x: 58, strands: 2, len: 110, hw: 12, gap: 52, rungs: 3, tags: false, dir: 'anti' }).hbonds(1);
  const wavy = path(panels.secondary.cg, 'M0 0', { stroke: PC.secondary, 'stroke-width': 6 });
  const glob = globule(panels.tertiary.cg, { R: 78, mini: true, seed: 2 });
  const quat = subunitComplex(panels.quaternary.cg, { n: 4, R: 44, contacts: false, spread: 1.45, tints: [PC.quaternary, PC.tertiary, PC.quaternary, PC.tertiary] });
  let bk = 1, lit = null, fk = 0, tg = tags ? 1 : 0, ck = 1, ls;
  function apply() {
    P_LEVELS.forEach((lv, i) => {
      const P2 = panels[lv], S2 = st2[lv], k = mRamp(bk * 4.4 - i * 1.1, 0, .6), kc = mRamp(bk * 4.4 - i * 1.1 - .5, 0, .5);
      const f = lit ? (lit.has(lv) ? 1 : 1 - .75 * fk) : 1, dimU = 1 - .65 * pkR(S2.u, .2, 1);
      pkO(P2.frame, k * f * dimU); pkO(P2.name, k * f * dimU); pkO(P2.tag, k * f * tg * dimU);
      pkO(P2.cg, kc * f * ck); pkO(P2.glow, S2.glow * k); pkO(P2.tk, S2.tick * k);
    });
    const us = st2.secondary.u;
    helix.unwind(us);
    pkO(sheet, 1 - pkR(us, 0, .6));
    let d = ''; for (let i = 0; i <= 20; i++) { const f = i / 20; d += (i ? 'L' : 'M') + pkF(10 + (f - .5) * 120) + ' ' + pkF(10 * Math.sin(f * 12)); }
    pkD(wavy, d); pkO(wavy, pkR(us, .4, 1));
    glob.tangle(st2.tertiary.u);
    quat.apart(st2.quaternary.u);
    return ls;
  }
  ls = Object.assign(g, {
    chain, helix, sheet, glob, quat,
    build(k) { bk = pkK(k); return apply(); },
    focus(levels, k = 1) {
      const L2 = (levels == null ? [] : Array.isArray(levels) ? levels : [levels]).map(pkLevel).filter(v => v && v !== 'all');
      lit = L2.length ? new Set(L2) : null; fk = pkK(k); return apply();
    },
    lit(levels, k = 1) { return ls.focus(levels, k); },
    tags(k) { tg = pkK(k); return apply(); },
    tick(lv, k) { lv = pkLevel(lv); if (st2[lv]) st2[lv].tick = pkK(k); return apply(); },
    glow(lv, k) { lv = pkLevel(lv); if (st2[lv]) st2[lv].glow = pkK(k); return apply(); },
    contents(k) { ck = pkK(k); return apply(); },
    unfold(lv, u) { lv = pkLevel(lv); if (st2[lv] && lv !== 'primary') st2[lv].u = pkK(u); return apply(); },
    panel(lv) { return panels[pkLevel(lv)].g; },
    pt(lv) { const i = P_LEVELS.indexOf(pkLevel(lv)); return pkOut(g, at(Math.max(0, i))); },
  });
  return apply();
}

/* ---------- the chapter 2 thread: the protein family tree ---------- */
const P_TREE = {
  simple: { x: -470, color: PC.simpleP, title: 'Simple', cap: 'amino acids only', leaves: ['albumins', 'globulins', 'histones', 'albuminoids'] },
  conjugated: { x: 0, color: PC.conjugated, title: 'Conjugated', cap: 'protein + non-protein part', leaves: ['glycoproteins', 'lipoproteins', 'phosphoproteins', 'metalloproteins', 'chromoproteins', 'nucleoproteins'] },
  derived: { x: 470, color: PC.derived, title: 'Derived', cap: 'products of breakdown', leaves: ['primary', 'secondary'] },
};
const P_BRANCHES = ['simple', 'conjugated', 'derived'];
// proteinTree(p, {x=800, y=450, s, o, leaves, caps, title='Proteins'}) the chapter 2 family tree, growing upward:
// the root is an eight-bead chain with N and C tags at the bottom (y +270; "Proteins" above it at +232), a trunk up
// to a fork (+150), three branches to the class boxes (y +44; 300 × 96) at x −470 simple (green), 0 conjugated
// (lavender), +470 derived (amber), each with a one-line caption; leaves are chips stacked above each box (52 apart
// from y −34; conjugated in two columns of three). Defaults: simple albumins, globulins, histones, albuminoids;
// conjugated glyco-, lipo-, phospho-, metallo-, chromo-, nucleoproteins; derived primary, secondary (leaves:
// {branch: [...]} to change them). The layout never changes, so lessons can open on it. Extent about 1260 × 520
// (y −215 … +300). Starts grown, no leaves. Setters combine: .grow(k) root, title, trunk, then the branches and
// boxes left to right, then the captions; .focus(branches, k) lights those branches (and their leaves) and dims the
// others to .25 (root and trunk stay lit); .leaves(branch, k) its leaves draw on one by one ('all' for every
// branch); .leafGlow(branch, i, k); .tick(branch, k) a green tick on the box; .glow(branch, k); .label(branch, text)
// the caption (no fade); .captions(k). .root (the beadChain); .pt(branch | 'root' | 'title', i) in parent (i: a leaf)
function proteinTree(p, { x = 800, y = 450, s = 1, o = 1, leaves = {}, caps = {}, title = 'Proteins' } = {}) {
  const g = G(p, { x, y, s, o });
  const brG = G(g);
  const root = beadChain(g, { y: 270, n: 8, sp: 46, r: 17, chips: false, endText: false, colors: [PC.simple, PC.basic, PC.hydroxy, PC.acidic, PC.aromatic, PC.branched, PC.hetero, PC.imino] });
  const tt = pkText(g, title, { y: 232, size: 36, fill: COL.chalk, weight: 800 });
  const trunk = path(brG, 'M0 192L0 150', { stroke: COL.chalk, 'stroke-width': 7 }, { d: 0 });
  const B = {}, st2 = {};
  P_BRANCHES.forEach(nm => {
    const T0 = P_TREE[nm], lv = leaves[nm] || T0.leaves;
    const ln = path(brG, T0.x ? `M0 150C0 120 ${T0.x} 125 ${T0.x} 92` : 'M0 150L0 92', { stroke: T0.color, 'stroke-width': 7 }, { d: 0 });
    const bx = G(g, { x: T0.x, y: 44 });
    const glow = path(bx, pkRect(324, 120, 26), { fill: PC.glow, 'fill-opacity': .15, stroke: PC.glow, 'stroke-width': 5 }); put(glow, { o: 0 });
    path(bx, pkRect(300, 96, 20), { fill: PC.card, stroke: T0.color, 'stroke-width': 4 });
    pkText(bx, T0.title, { y: -4, size: 34, fill: T0.color, weight: 800 });
    const cap = pkText(bx, caps[nm] || T0.cap, { y: 30, size: 20, fill: COL.dim, weight: 600 });
    const tk = pkTick(bx, lv.length > 4 ? { x: 166, y: -20 } : { x: 150, y: -48 });
    const two = lv.length > 4, lfs = lv.map((str, i) => {
      const col = two ? i % 2 : 0, row = two ? Math.floor(i / 2) : i;
      const lx = T0.x + (two ? (col ? 111 : -111) : 0), ly = -34 - row * 52;
      const lg = G(g, { x: lx, y: ly });
      const gl2 = path(lg, pkRect((two ? 214 : 230) + 14, 54, 27), { fill: PC.glow, 'fill-opacity': .25, stroke: PC.glow, 'stroke-width': 3 }); put(gl2, { o: 0 });
      path(lg, pkRect(two ? 214 : 230, 42, 21), { fill: PC.tab, stroke: T0.color, 'stroke-width': 3 });
      pkText(lg, str, { y: 8, size: 22, fill: COL.chalk, weight: 700 });
      return { g: lg, glow: gl2, at: [lx, ly] };
    });
    B[nm] = { ln, bx, glow, cap, tk, lfs };
    st2[nm] = { leaves: 0, tick: 0, glow: 0, lg: {} };
  });
  let gk = 1, lit = null, fk = 0, ck = 1, t;
  function apply() {
    root.reveal(pkR(gk, 0, .15));
    pkO(tt, pkR(gk, .1, .2));
    pkSet(trunk, { d: pkR(gk, .15, .32) });
    P_BRANCHES.forEach((nm, i) => {
      const b2 = B[nm], S2 = st2[nm], k = pkR(gk, .3 + i * .12, .5 + i * .12), f = lit ? (lit.has(nm) ? 1 : 1 - .75 * fk) : 1;
      pkSet(b2.ln, { d: k, o: f });
      pkO(b2.bx, pkR(gk, .42 + i * .12, .56 + i * .12) * f);
      pkO(b2.cap, ck * pkR(gk, .8, 1));
      pkO(b2.glow, S2.glow); pkO(b2.tk, S2.tick);
      const n = b2.lfs.length;
      b2.lfs.forEach((L, j) => { const v = mRamp(S2.leaves * (n + .5) - j, 0, 1); pkSet(L.g, { x: L.at[0], y: L.at[1] + 14 * (1 - pkSS(v)), o: v * f }); pkO(L.glow, S2.lg[j] || 0); });
    });
    return t;
  }
  t = Object.assign(g, {
    root,
    grow(k) { gk = pkK(k); return apply(); },
    focus(names, k = 1) { const L2 = (names == null ? [] : Array.isArray(names) ? names : [names]).filter(n => n !== 'all'); lit = L2.length ? new Set(L2) : null; fk = pkK(k); return apply(); },
    leaves(nm, k) { (nm === 'all' ? P_BRANCHES : [nm]).forEach(n => { if (st2[n]) st2[n].leaves = pkK(k); }); return apply(); },
    leafGlow(nm, i, k) { if (st2[nm]) st2[nm].lg[i] = pkK(k); return apply(); },
    tick(nm, k) { if (st2[nm]) st2[nm].tick = pkK(k); return apply(); },
    glow(nm, k) { if (st2[nm]) st2[nm].glow = pkK(k); return apply(); },
    label(nm, str) { if (B[nm]) pkTx(B[nm].cap, str); return t; },
    captions(k) { ck = pkK(k); return apply(); },
    pt(nm, i) {
      if (nm === 'root') return pkOut(g, [0, 270]); if (nm === 'title') return pkOut(g, [0, 215]);
      const b2 = B[nm]; if (!b2) return pkOut(g, [0, 0]);
      return pkOut(g, i == null ? [P_TREE[nm].x, 44] : b2.lfs[Math.max(0, Math.min(b2.lfs.length - 1, i))].at);
    },
  });
  return apply();
}

/* ---------- prosthetic groups, lipoprotein, collagen ---------- */
const P_PROS = { sugar: 'carbohydrate', lipid: 'lipid', phosphate: 'phosphate', metal: 'metal', heme: 'heme', flavin: 'flavin', nucleic: 'nucleic acid' };
// prosthetic(p, kind, {x, y, s, o, symbol='Fe', label, size=22}) the non-protein parts of conjugated proteins, about
// 70 across, origin = centre: 'sugar' (three gold hexagons), 'lipid' (a tan head with two wavy tails), 'phosphate'
// (lavender disc "P"), 'metal' (teal disc with symbol: Cu, Zn, Fe), 'heme' (red disc, a ring of four and Fe in the
// middle), 'flavin' (three fused yellow rings), 'nucleic' (a short DNA ladder). label: the name under it (default by
// kind; o 0). .label(k); .glow(k); .toward([x, y], k) moves it from where it was made to a point in its parent (e.g.
// a globule's .slotPt(i)): this one setter writes the root's x and y
function prosthetic(p, kind, { x = 0, y = 0, s = 1, o = 1, symbol = 'Fe', label, size = 22 } = {}) {
  const g = G(p, { x, y, s, o }), hx = x, hy = y;
  const glow = pkHalo(g, 46);
  if (kind === 'sugar') [[-17, 8], [17, 8], [0, -21]].forEach(([cx, cy]) => path(g, pkPoly(pkNgon(6, 17, -90, cx, cy), true), { fill: PC.sugar, stroke: PC.sugarEdge, 'stroke-width': 2.5 }));
  else if (kind === 'lipid') { [-8, 8].forEach(dx => path(g, `M${dx} -6Q${dx + 10} 8 ${dx} 20T${dx} 46`, { stroke: PC.lipid, 'stroke-width': 6 })); pkBall(g, 15, PC.lipid, PC.lipidEdge, { cy: -18 }); }
  else if (kind === 'phosphate') pkBall(g, 24, PC.phosphate, PC.phosphateEdge, { letter: 'P', size: 26 });
  else if (kind === 'metal') pkBall(g, 26, PC.metal, PC.metalEdge, { letter: symbol, size: 22, ink: '#fff' });
  else if (kind === 'heme') { mk('circle', { r: 30, fill: PC.heme, stroke: PC.hemeEdge, 'stroke-width': 3 }, g); [0, 90, 180, 270].forEach(a => { const q = [19 * Math.cos(pkRad(a + 45)), 19 * Math.sin(pkRad(a + 45))]; path(g, pkPoly(pkNgon(5, 8, a + 45, q[0], q[1]), true), { fill: '#f08a80', stroke: PC.hemeEdge, 'stroke-width': 1.5 }); }); pkText(g, 'Fe', { y: 6, size: 15, fill: '#fff', weight: 900 }); }
  else if (kind === 'flavin') [-28, 0, 28].forEach((cx, i) => path(g, pkPoly(pkNgon(6, 16, -90 + 30, cx, 0), true), { fill: PC.flavin, stroke: PC.flavinEdge, 'stroke-width': 2.5, 'fill-opacity': i === 1 ? 1 : .85 }));
  else if (kind === 'nucleic') { let d1 = '', d2 = '', rr = ''; for (let i = 0; i <= 12; i++) { const yy = -32 + i * 5.33, a = i * .55; d1 += (i ? 'L' : 'M') + pkF(14 * Math.sin(a)) + ' ' + pkF(yy); d2 += (i ? 'L' : 'M') + pkF(-14 * Math.sin(a)) + ' ' + pkF(yy); if (i % 2) rr += `M${pkF(14 * Math.sin(a))} ${pkF(yy)}L${pkF(-14 * Math.sin(a))} ${pkF(yy)}`; } path(g, rr, { stroke: PC.hbond, 'stroke-width': 3 }); path(g, d1, { stroke: PC.nucleic, 'stroke-width': 5 }); path(g, d2, { stroke: '#c9b98f', 'stroke-width': 5 }); }
  const lab = pkText(g, label ?? (kind === 'metal' ? 'metal (' + symbol + ')' : P_PROS[kind]), { y: 74, size, fill: COL.chalk, o: 0 });
  const c = Object.assign(g, {
    kind,
    label(k) { pkO(lab, pkK(k)); return c; },
    glow(k) { pkO(glow, pkK(k)); return c; },
    toward([tx, ty], k) { const e = pkSS(pkK(k)); pkSet(g, { x: pkL(hx, tx, e), y: pkL(hy, ty, e) }); return c; },
  });
  return c;
}
// lipoprotein(p, {x, y, s, o, R=110, label='', size=26}) a lipoprotein particle: a core of tan lipid (triglyceride tails and
// cholesterol), a shell of phospholipid heads round it and green apolipoprotein bands on the surface; label under it.
// .core(k) a glow on the core; .shell(k) the protein bands glow; .label(str) (no fade); .glow(k)
function lipoprotein(p, { x = 0, y = 0, s = 1, o = 1, R = 110, label = '', size = 26 } = {}) {
  const g = G(p, { x, y, s, o });
  const glow = pkHalo(g, R + 18);
  mk('circle', { r: pkF(R * .82), fill: '#6d5a2a' }, g);
  const coreGlow = mk('circle', { r: pkF(R * .78), fill: PC.lipid, 'fill-opacity': .35 }, g); put(coreGlow, { o: 0 });
  for (let i = 0; i < 9; i++) { const a = i * 2.4, rr = R * .5 * Math.sqrt(pkHash(i, 3)), cx = rr * Math.cos(a), cy = rr * Math.sin(a); path(g, `M${pkF(cx - 14)} ${pkF(cy)}q7 -7 14 0t14 0`, { stroke: PC.lipid, 'stroke-width': 5 }); }
  [[-.25, -.2], [.3, .15]].forEach(([u, v]) => path(g, pkPoly(pkNgon(5, 11, -90, u * R, v * R), true), { fill: PC.flavin, stroke: PC.flavinEdge, 'stroke-width': 2 }));
  const nH = Math.round(R / 6); let heads = '';
  for (let i = 0; i < nH; i++) { const a = i / nH * 2 * Math.PI; heads += `M${pkF(R * .9 * Math.cos(a))} ${pkF(R * .9 * Math.sin(a))}h.01`; }
  path(g, heads, { stroke: '#f2efe6', 'stroke-width': R * .13 });
  const bands = G(g);
  [[-130, -60], [30, 95], [150, 200]].forEach(([a1, a2]) => path(bands, `M${pkF(R * 1.01 * Math.cos(pkRad(a1)))} ${pkF(R * 1.01 * Math.sin(pkRad(a1)))}A${R * 1.01} ${R * 1.01} 0 0 1 ${pkF(R * 1.01 * Math.cos(pkRad(a2)))} ${pkF(R * 1.01 * Math.sin(pkRad(a2)))}`, { stroke: PC.globule, 'stroke-width': R * .16 }));
  const bandGlow = path(g, pkCirc(R * 1.01), { stroke: PC.glow, 'stroke-width': R * .24, 'stroke-opacity': .3 }); put(bandGlow, { o: 0 });
  const lab = pkText(g, label, { y: R + size * 1.4, size, fill: COL.chalk });
  const l = Object.assign(g, {
    core(k) { pkO(coreGlow, pkK(k)); return l; },
    shell(k) { pkO(bandGlow, pkK(k)); return l; },
    label(str) { pkTx(lab, str); return l; },
    glow(k) { pkO(glow, pkK(k)); return l; },
  });
  return l;
}
// collagenRope(p, {x, y, s, o, len=600, amp=20, turns=6, w=10}) collagen's triple helix: three strands (gold, peach, pink)
// wound round one axis along x, origin = the middle. .draw(k) left to right; .loosen(u) the strands unwind and drift
// apart into three loose wavy chains (boiling collagen → gelatin); .glow(k)
function collagenRope(p, { x = 0, y = 0, s = 1, o = 1, len = 600, amp = 20, turns = 6, w = 10 } = {}) {
  const g = G(p, { x, y, s, o });
  const glow = path(g, pkRect(len + 40, amp * 2 + 50, amp + 25), { fill: PC.glow, 'fill-opacity': .15, stroke: PC.glow, 'stroke-width': 4 }); put(glow, { o: 0 });
  const cols = ['#f3c95c', '#e8a87c', '#ff9fc0'];
  const edges = cols.map(() => path(g, 'M0 0', { stroke: PC.ink, 'stroke-width': w + 4 })), lines = cols.map(c => path(g, 'M0 0', { stroke: c, 'stroke-width': w }));
  let dk = 1, uk = 0, cr;
  function apply() {
    cols.forEach((_, j) => {
      const pts = [], m = 90, e = pkSS(uk);
      for (let i = 0; i <= Math.round(m * dk); i++) {
        const f = i / m, ph = f * turns * 2 * Math.PI * (1 - .7 * e) + j * 2.094;
        pts.push([(f - .5) * len, amp * (1 + .3 * e) * Math.sin(ph) + e * (j - 1) * 42 + e * 10 * Math.sin(f * 7 + j * 2)]);
      }
      const d = pts.length > 1 ? pkSmooth(pts) : 'M0 0';
      pkD(lines[j], d); pkD(edges[j], d);
    });
    return cr;
  }
  cr = Object.assign(g, {
    draw(k) { dk = pkK(k); return apply(); },
    loosen(u) { uk = pkK(u); return apply(); },
    glow(k) { pkO(glow, pkK(k)); return cr; },
  });
  return apply();
}
