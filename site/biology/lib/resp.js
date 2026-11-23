'use strict';
// Cellular Respiration (chapter 9): the book's kit of electrons, carriers, carbon chains, the respiration map, glycolysis,
// the citric acid cycle, the mitochondrion, the electron transport chain, ATP synthase, fermentation, fuels and the
// phosphofructokinase valve. Loaded after engine.js, water.js, macro.js, cell.js, cyto.js, membrane.js and metab.js (it
// reuses wLabel, wChem, wChemSet, wAtom, wHash, waterMolecule; MC, mArrow, mRamp, mBump, mClamp, mD, mO; cSet, cAttr, cF, cP,
// cOut, cLabel, cBlob, cStadium, cCircle, cFrac, cRound; solute, zNgon, zStar, zWob; ammoniaShape). Every piece is drawn
// around its own origin with { x, y, s, o } and placed with put. Animated pieces have set-style methods that pose
// everything from their arguments alone: call them every frame from prog(k => …) or clockRun(t => …), so play, seek and
// ?beat=N&t=S draw the same frame. They first round their argument (k and u to 1/2000, t to 1/120 s) and draw only from
// the rounded value; attributes are written only when they change, and a moved part never falls back to the identity
// transform (jSet), so a played and a seeked frame have the same markup. Setters on one piece combine: each stores its
// own value and redraws the whole piece, so call every setter you use on every frame of the beat (not only inside a time
// window). Most pieces start in their finished pose (built, drawn, full): a page that reveals one calls its setter with
// 0 at once. No filters, blurs or clips. The kit never writes a piece's root o or s (fade it freely; to pulse() a piece
// placed with s ≠ 1, wrap it in a G first: the engine's pulse ends at s 1); .pose(x, y) writes the root's x and y, so
// don't tween those on a piece you pose. Text never cross-fades on one spot: a name that
// changes (NAD⁺ → NADH, ½ O₂ → H₂O, ADP → ATP, 6 C → 3 C + 3 C) fades out, swaps, and fades back in.
// Colours (brief): e⁻ gold, H⁺ pink, H atom white, NAD peach, FAD tan, oxidation orange (out), reduction blue (in),
// carbon grey beads, glucose gold, pyruvate coral, CoA teal, stage tints glycolysis #5fb8c9, pyruvate oxidation #d9826a,
// citric acid cycle #d0533d, oxidative phosphorylation #8a7ad1.
//
// Exports (lengths at s = 1; "parent" = the coordinates of the group you passed as p; k runs 0..1; u loops; t is seconds):
//   MC  extended with chapter 9's colours: elec proton hAtom nad fad oxid redu carbon oxy glucose pyruvate coa gly pyrOx cac
//       oxph invest payoff complex q cytc iron synth rotor mito matrix ims cristae cytosol ethanol acetald lactate yeast
//       inhib stim fatTail glycerol amino boom boomCore valve (most with …Edge)
//
//   SMALL PIECES
//   electron(p, {x, y, s, o, n=1, r=9, label=false, trail=0, size=22}) a gold dot (n 2: a pair side by side, 2.3r apart);
//       .pose(x, y, ang, len) places it, with a fading trail of length len (default trail) behind it when ang (degrees,
//       the direction of travel) is given; .tag(k) the "e⁻" / "2 e⁻" label above. .dots
//   proton(p, {x, y, s, o, r=15, label='sign'|'name'|false}) membrane.js's pink H⁺ disc ('sign' "+", 'name' "H⁺"); .pose
//   hAtom(p, {x, y, s, o, r=17, letter=true}) a white H ball carrying a gold electron; .split(k) it becomes H⁺ (pink, a +
//       beside it) and its electron moves off to its right (2.6 r); .pose(x, y); .ept() the electron's point in parent
//   co2Molecule(p, {x, y, s, o, r=16, label=false}) grey carbon between two red oxygens (about 4.4 r wide); .lab "CO₂"
//       below (jChem it to "2 CO₂"); .pose(x, y)
//   o2Molecule(p, {x, y, s, o, r=16, label=false}) two red balls (about 2.8 r wide); .lab "O₂"; .pose(x, y)
//   atpBurst(p, {x, y, s, o, r=34, label='ATP', size=r/2}) a gold ten-point star with rays and its label (rays reach 1.42 r).
//       .set(k) 0 hidden … 1 full (grows with a small overshoot; it stays); .shine(t) the rays turn and pulse; .empty(k) an
//       empty dashed star outline (hidden as the burst fills); .text(str). Starts full (set(1)).
//   explosion(p, {x, y, s, o, r=110}) a flat orange-yellow burst; .set(k, hold=false) flares (0–.3) and fades (.6–1),
//       or stays with hold
//   redoxArrow(p, 'ox'|'red', {x, y, s, o, dir=-90, len=80, label='oxidized'|'reduced', sub='', size=26, e=true}) origin =
//       the molecule's edge; dir (degrees) points away from it. 'ox': an orange arrow outward with an electron leaving
//       along it; 'red': a blue arrow inward with an electron arriving. Label (and sub, dim, under it) past the far end.
//       .draw(k) arrow (0–.6), electron (.3–1, gone at the end), label (.5–1). Starts drawn (draw(1)).
//   agentTag(p, 'reducing'|'oxidizing', {x, y, s, o, sub=true, size=22}) a dark pill, orange "reducing agent / electron
//       donor" or blue "oxidizing agent / electron acceptor", origin = centre; .w .h
//   nadShuttle(p, {x, y, s, o, kind='NAD'|'FAD', label=true, size=26}) the carrier as a small bus, origin = body centre:
//       NAD 124 × 54 peach (a "+" badge top right), FAD 96 × 46 tan; wheels below; name under it (about 50 below centre).
//       .set(red) 0 oxidized (empty dashed seats; NAD⁺ / FAD) … 1 reduced (two electrons and one H aboard, FAD two H;
//       NADH / FADH₂): badge goes (0–.35), electrons drop into their seats (.25–.7), H (.45–.85), the name swaps at .5.
//       .glow(k) a gold halo ("stored energy"); .seat(i) seat i in parent (0, 1 electrons, 2 (3) H); .pose(x, y); .red()
//   nicotinamide(p, {x, y, s, o, labels=true, size=26}) slide 15's ring close-up (ring radius 70; about 360 × 420 with the
//       H above, "rest of NAD" below and the C(=O)NH₂ group to the right). .set(red): the blue + on N goes (0–.4), a
//       second H joins the top carbon (.4–.8), a double bond moves (.3–.7); title NAD⁺ → NADH above and "nicotinamide
//       (oxidized form)" → "(reduced form)" below swap at .5. .pt('N'|'C'|'H'|'plus')
//   carbonChain(p, {x, y, s, o, n=3, color=MC.pyruvate, sp=34, r=13, label='', size=24, back=true}) n grey carbon beads on
//       a coloured backing (pyruvate coral, acetyl MC.pyrOx, acetaldehyde MC.acetald, ethanol MC.ethanol, lactate
//       MC.lactate), origin = the middle of the full chain, (n−1)·sp + 2r + 16 long. Setters combine:
//       .lose(k, {to=[60, -120], fade=true, i=n−1}) bead i leaves as CO₂ (its bonds cut 0–.25, it takes two red oxygens
//       .2–.45, moves by `to` .3–1, fades .85–1 unless fade false) and the backing shrinks (.3–.7); .tag(k) the teal CoA
//       tag slides on at the right end (acetyl CoA); .color(c) the backing's colour; .phos([k0, k1 …]) a lavender P on bead
//       i; .name(str) the label under it (o 0 if ''); .bead(i) in parent; .pose(x, y)
//   glucoseRing(p, {x, y, s, o, R=46, r=12, apart=50, sp=32, label='', size=24, color=MC.pyruvate}) the gold hexagon with six
//       carbon beads at its corners (bead 0 top right, clockwise). Setters combine: .split(k) the ring opens into two
//       3-bead chains (beads 0–2 at y −apart, 3–5 at +apart; hexagon fades 0–.5, coral backings .5–1); .morph(k) the
//       hexagon becomes a five-sided ring with bead 5 outside (fructose); .phos([k0…k5]); .count(k) "6 C" above, "3 C + 3 C"
//       above the top chain once split (swaps at .5); .bead(i) .chainPt(top) in parent; .pose(x, y)
//   respIcon(p, kind, {x, y, s, o}) a small icon for ledgers and tallies: 'ATP' 'NADH' 'NAD' 'FADH2' 'FAD' 'CO2' 'O2' 'H2O'
//       'pyruvate' 'acetyl' 'glucose' (about 36–66 wide, see J_ICON_W)
//   fuelIcon(p, kind, {x, y, s, o}) 'carb' (three gold hexagons, 120 wide), 'sugar', 'protein' (five beads, 140 wide),
//       'aminoAcid' (a bead with a blue NH₂), 'fat' (blue glycerol head on the left, three gold tails, 120 wide),
//       'glycerol', 'fattyAcid'
//   chainIcon(p, {x, y, s, o, label=true}) four blue boxes I–IV stepping down (about 230 × 110), "electron transport
//       chain" under it; .pt('in'|'out')
//
//   THE RESPIRATION MAP
//   respMap(p, {x=800, y=450, s=1, o, sub=true, size=1}) slide 19 redrawn, origin = the cell's centre; the cell is 1400 × 600
//       (−700…700, −300…300; the fuel chips stand above it to y −430). Cytosol: GLYCOLYSIS box (−470, 20) "glucose →
//       pyruvate". Mitochondrion outline (−250…670, −200…240): PYRUVATE OXIDATION (−110, 20) → "acetyl CoA" → the CITRIC
//       ACID CYCLE wheel (150, 20, R 80) and OXIDATIVE PHOSPHORYLATION (470, 20; 290 × 170). Gold electron arrows over
//       the top: e1 from glycolysis (up to y −255 across the cytosol, chip "electrons carried via NADH" at (−20, −255),
//       down at x 570), e2 from pyruvate oxidation (y −150 inside the mitochondrion, two-line chip "electrons carried
//       via / NADH and FADH₂" at (32, −150), down at x 500) and e3 from the cycle's top joining e2. ATP bursts atp1
//       (−470, 190, r 32, "substrate-level" under it), atp2 (150, 172, r 30, "substrate-level" to its right), atp3
//       (470, 170, r 40) the largest, inside the mitochondrion. Fuel chips (with .inputs) stand above the cell: carbohydrates (−560, −395) → glycolysis;
//       fats (−330, −400) → glycolysis and → acetyl CoA; proteins (150, −395) → pyruvate oxidation and → the cycle.
//       Parts (names for focus): cell mito glycolysis pyruvateOx cycle oxphos e1 e2 e3 atp1 atp2 atp3, and the extras
//       carbs proteins fats (fuel chips and dashed door arrows), cross (red X over the mitochondrion, "no O₂"), ferment
//       (an arrow from glycolysis to a "fermentation" chip), valve (a line from atp3 back to glycolysis with a red −,
//       "ATP slows phosphofructokinase"). Aliases: electrons atp stages inputs mitochondrion cytosol bridge fermentation
//       nadh fadh2 all. Setters (combine): .build(k) parts appear in .order (cell mito glycolysis pyruvateOx cycle oxphos
//       e1 e2 e3 atp1 atp2 atp3; electron arrows draw on, their label chips show at the end) and .kOf(name) the k at
//       which a part is complete; .focus(names, k) lights names, dims the rest to .25 ([] or null lights all);
//       .flow(t, amt=1) electron pairs run along the arrows (amt a number or [e1, e2, e3]); .shine(t) the ATP rays turn;
//       .slots(k) empty dashed stars under the bursts (fill one with .bursts[i].set(k)); .inputs(k | [carbs, proteins,
//       fats]); .cross(k); .ferment(k); .valve(k); .tick(names, k) green ticks on stage boxes ("done").
//       .pt(name) in parent: cell mito cytosol glycolysis glucose pyruvate pyruvateOx acetylCoA cycle oxphos atp1 atp2 atp3
//       e1 e2 e3 chip1 chip2 carbs proteins fats cross ferment valve innerMembrane; .along(i, k) a point k along electron
//       arrow i (0 e1, 1 e2, 2 e3 then e2) for a page's own carriers. .parts (groups), .bursts [3] (atpBurst), .chips [2]
//
//   STAGE PIECES
//   glycolysisStrip(p, {x=800, y=450, s, o, w=1440, size=16, beads=true}) the ten steps as chips (w/10 − 12 wide, 74 high),
//       numbered, enzyme names in two lines (steps 1–5 blue-lavender "investment", 6–10 gold "payoff"), chevrons between,
//       a bead glyph under each (6 grey beads for 1–4, 3 beads "×2" for 5–10, at y +59). Origin = the strip's centre.
//       Names shrink to fit their chip. .build(k) chips left to right; .focus(steps, k) steps 1..10 or 'invest' /
//       'payoff' (lit chips rise 8 px); .phases(k) brackets and "energy investment phase" / "energy payoff phase" above
//       (to y −95); .star(k) a pink star on chip 3's top right corner and "key regulation step" under its beads (y +99).
//       .pt(i) chip i's centre, .below(i) its bead glyph, in parent
//   citricCycle(p, {x=800, y=450, s, o, R=220, labels=true, beads=true, size=22, centre=true}) the wheel: eight nodes (dark
//       discs r 40 with their carbons as grey beads) clockwise from oxaloacetate (upper left, −112.5°): citrate (6),
//       isocitrate (6), α-ketoglutarate (5), succinyl CoA (4, a CoA tag), succinate, fumarate, malate (4); names outside at
//       R + 54, "n C" inside at R − 72, "citric acid cycle" in the middle; arrowheads clockwise. Overall about
//       (2R + 400) × (2R + 120); the acetyl CoA entry stands above to −R − 160. Setters (combine): .build(k) ring, centre,
//       nodes in order; .focus(names, k) 'ring' 'centre' 'node0'…'node7' 'nodes' or a name ('citrate' …); .draw(k) the
//       bright ring draws on clockwise; .badges(k) step numbers 1–8 just outside the ring (step 1 = oxaloacetate →
//       citrate); .entryOn(k) shows the acetyl CoA arrow and chain at the top; .join(k) acetyl CoA rides down (0–.5), its
//       CoA peels off up-left (.45–.95), the citrate node glows (.5–.85); .run(u) a token round the ring (u wraps; null
//       hides it), the node under it glows. .node(i) .stepPt(i, d) .stepDir(i) .entryPt() in parent; .acetyl (carbonChain)
//   mitoCutaway(p, {x=800, y=450, s, o, w=1300, h=620, porter=true, labels=true, size=24}) outer membrane (orange), a
//       lighter intermembrane band, the inner membrane folded into cristae from top and bottom, a dark matrix with
//       ribosomes and a DNA loop, and a pyruvate transport protein through both membranes at the left tip. Labels with
//       leaders stand outside (up to 50 above and below). Setters: .build(k) outer, inner, matrix, porter; .focus(names, k)
//       outer (ims) inner (cristae) matrix porter labels; .labels(k); .porter(k) the transporter glows. .pt('outer'|'ims'|
//       'inner'|'cristae'|'matrix'|'porter'|'cytosol'|'dna'|'right') in parent; .fx the cristae's x positions
//
//   OXIDATIVE PHOSPHORYLATION
//   etcChain(p, {x=800, y=450, s, o, w=1200, mem=110, top=230, bottom=250 (300 with synthase), bg=true, labels=true, synthase=false, final='O2',
//       size=24}) the inner membrane along y = 0 (intermembrane space above to −top, matrix below to +bottom), complexes I
//       (large, reaching into the matrix), II (small, matrix side), III, IV in blue, Q (peach, in the membrane) and
//       cytochrome c (blue, on the IMS face), ½ O₂ at the lower right; synthase: true adds atpSynthase at the right end
//       (the chain closes up). final: another acceptor's name (e.g. 'sulfate') as a red chip instead of O₂ and water.
//       Setters (combine): .build(k) membrane I II Q III cytc IV final (synthase); .focus(names, k) those, nadh fadh2, or
//       complexes carriers chain o2 all; .electron(u, src='NADH'|'FADH2', flash=true) one pair at u along its path from
//       the shuttle's dock (below I or II) through Q, III, cyt c, IV to O₂ (u < 0 or null hides it): the carrier holding it
//       wears a blue ring (reduced), then an orange one (oxidized) as it leaves; Q and cyt c ride with it and drift back;
//       .stations(src) the u of each stop; .dock(src, k) the NADH / FADH₂ shuttle comes in under I / II (0–.35), hands its
//       pair in (.38–.6, it turns NAD⁺ / FAD) and backs away (.6–1); .water(k) two H⁺ come to ½ O₂ (0–.45), water
//       forms (.55–.75; "½ O₂" → "H₂O"); .eqn(k) "2 H⁺ + ½ O₂ + 2 e⁻ → H₂O" under it; .pump(t, amt) H⁺ rise through I,
//       III and IV; .gradient(k, t) 34 H⁺ in the IMS, 6 in the matrix; .flow(t, amt) three pairs stream NADH → O₂;
//       .iron(k) iron dots on the cytochromes; .labels(k) INTERMEMBRANE SPACE (top left) / MITOCHONDRIAL MATRIX
//       (bottom centre) / inner membrane (in the membrane band, between III and IV). The synthase stands at x = w/2 − 140 at s .9. .pt('I'|'II'|'III'|'IV'|'Q'|'cytc'|'final'|'o2'|'ims'|'matrix'|'membrane'|'dockI'|
//       'dockII'|'synthase') in parent; .complexes .q .cytc .nadh .fadh .pair .synthase .cloudTop .cloudBottom
//   energyStair(p, {x, y, s, o, w=1000, h=560, size=22, axis=true}) slide 35: origin = the axis foot (0 kcal/mol); free
//       energy relative to O₂ up (0–50 kcal/mol over h, ticks every 10), carriers across (notes under the pills): NADH (50), I (45, "FMN, Fe·S"),
//       FADH₂ (43), II (40), Q (36), III (30), Cyt c (23), IV (12), ½ O₂ (0), dashed guides for the NADH and FADH₂ paths.
//       .build(k) / .focus(names, k) by carrier name ('NADH' 'I' 'FADH_2' 'II' 'Q' 'III' 'Cyt c' 'IV' 'O_2' 'guide'
//       'guideF', or carriers nadPath fadPath); .pair(u, src) the electron pair rests on each carrier and drops to the next
//       (a blue ring on the one it sits on; an orange wiggle shows at each drop it has passed); .wiggles(k) all wiggles at
//       k (null: follow the pair); .water(k) H₂O beside ½ O₂ with "2 H⁺ + ½ O₂ + 2 e⁻". .X(f) .Y(g) local; .pt(name)
//       .level(g) in parent
//   redoxDrop(p, {kind='explode'|'stairs', x, y, s, o, w=560, h=560, axis=true, size=26}) slide 17's panels, origin = the
//       axis foot. explode: "H₂ + ½ O₂" falls to H₂O with an explosion ("explosive release of heat and light energy");
//       stairs: "2 H + ½ O₂" splits to "2 H⁺ + 2 e⁻", the pair steps down four blue complexes with three ATP sparks and
//       heat wiggles, ½ O₂ takes it, H₂O ("controlled release of energy"). .set(k) (timings in the code comment);
//       starts finished (set(1))
//   protonCloud(p, {x, y, s, o, w=800, h=120, n=30, r=12, seed=3, label='sign'}) H⁺ scattered in a band; .set(k, t) k of
//       them shown (one by one), t jiggles them
//   atpSynthase(p, {x, y, s, o, mem=110, membrane=true, labels=false, size=24}) origin = the membrane's centre line: the
//       violet stator (in the membrane at x 52…126 with its two half-channels, and its arm down the right side to the
//       knob), the rotor ring (ten lighter subunits in the membrane, centred at x −15), the internal rod down to y 176,
//       the catalytic knob (three lobes, centre (−15, 222), held still). About 300 × 330 (y −150…+260 with protons).
//       .angle(deg) a still pose; .run(t, {speed=.5, flow=1, make=1}) the rotor turns speed turns/s, four H⁺ come down
//       the upper channel, ride the rotor about a turn and leave below (flow), and ADP + Pᵢ meet in the knob and an ATP
//       leaves downward three times a turn (make); .labels(k) stator / rotor / internal rod / catalytic knob (with
//       labels: true). .pt('stator'|'rotor'|'rod'|'knob'|'in'|'out'|'channel')
//
//   TALLIES
//   atpLedger(p, {x, y, s, o, w=640, rows, size=26, rowH=62, labelW=220, box=true}) origin = the box's top left;
//       rows [{label, kind (a respIcon kind), n icons, value, color}]. .row(i, k) label, icons one by one, value;
//       .set(k) all rows in turn; .strike(i, k) a red line through row i's icons; .hi(i, k) a gold highlight; .value(i,
//       str) changes a value (text, no cross-fade: dip the row yourself if you need one). .pt(i) in parent; .w .h
//   atpBar(p, {x, y, s, o, w=1000, h=46, max=32, segs=[{n, color, label}], size=22, ticks=true}) origin = the left end,
//       centred vertically; a segment is n·w/max long. .set(k) segments grow in turn; .values([…]) each segment's count
//       (2 + 2 + 26 → 2 + 2 + 28; a label holding the count follows it); .total(str, k) a gold label past the right end; .X(n) in parent
//
//   FERMENTATION AND BRANCHES
//   fermentation(p, {kind='alcohol'|'lactic', x=800, y=450, s, o, size=24}) slide 46: glucose (−540, −40) → glycolysis
//       (with "2 ADP + 2 Pᵢ" and a "2 ATP" burst above) → 2 pyruvate (−200) → alcohol: 2 CO₂ rise, 2 acetaldehyde (110),
//       2 ethanol (370) / lactic: 2 lactate (150); the NAD⁺ loop underneath (y 88…212): "2 NADH" on the top arc to the
//       reduction step, "2 NAD⁺" back along the bottom. .set(k) (timings in the code comment; starts finished);
//       .flow(t, amt) dots round the loop. .pt('glucose'|'glycolysis'|'pyruvate'|'co2'|'acetaldehyde'|'product'|'loop'|
//       'nadh'|'nad'|'atp'); .glucose .pyruvate .acetaldehyde .product (carbonChains) .co2 .atp
//   pyruvateFork(p, {x=800, y=450, s, o}) slide 50 in a cell outline (1300 × 760, centred at y −20): glucose (0, −320) →
//       glycolysis → pyruvate box (0, −130); left "no O₂: fermentation" → "ethanol, lactate, or other products"
//       (−400, 130); right "O₂ present: aerobic respiration" into a mitochondrion (330, 150) with acetyl CoA and a small
//       cycle wheel. .build(k) / .focus(names, k): cell glucose pyruvate left mito right, or fermentation aerobic all; .pt
//   fuelFunnel(p, {x=800, y=450, s, o, size=24}) slide 54, about 1300 × 640 (x −580…620, y −350…250): Carbohydrates,
//       Fats, Proteins (y −320) → Sugars, Glycerol, Fatty acids, Amino acids (y −130) → the pathway row (y 150): a
//       glycolysis band (Glucose, Glyceraldehyde 3-P, Pyruvate), Acetyl CoA, the cycle wheel, oxidative phosphorylation;
//       dashed feeds (sugars → glucose, glycerol → G3P, fatty acids → acetyl CoA "beta oxidation", amino acids →
//       pyruvate, acetyl CoA and the cycle). .build(k), .focus(names, k) (names in the code comment; groups
//       carbohydrates fat protein pathway); .deaminate(k) NH₃ (metab.js ammoniaShape) leaves the amino acids up-right;
//       .beta(k) three acetyl CoA pieces ride from the fatty acid to acetyl CoA in turn. .pt(name) in parent
//   pfkValve(p, {x=800, y=450, s, o, w=900, size=22, labels=true}) a pipe from "fructose 6-phosphate" (left) to
//       "fructose 1,6-bisphosphate" (right) through the olive phosphofructokinase (rx 110, ry 92; its name under the pipe's
//       left end) whose gap is the valve;
//       sockets: ATP upper left, citrate upper right, AMP below. .set({atp, cit, amp, open, t, flow}) the whole pose
//       (missing keys take defaults): each regulator comes in and docks (0–.6) and its tag shows (red − "inhibits" /
//       green + "stimulates", .6–.85); open defaults to .7 + .3·amp − .35·atp − .2·cit; sugars pass, fewer and slower when
//       narrow. .pt('atp'|'cit'|'amp'|'in'|'out'|'enzyme')
//
//   REDOX SCENES
//   dehydrogenase(p, {x=800, y=450, s, o, size=24, labels=true}) slide 14: a generic fuel R–C–O with an H on each, an olive
//       dehydrogenase under it (−170, 120), an NAD⁺ shuttle at (240, 60). .set(k): the enzyme presses (0–.15), both H
//       lift off (.15–.35) and C–O becomes C=O, each splits into H⁺ + e⁻ (.35–.45), the electron pair and one H⁺ ride onto
//       NAD⁺ (.45–.72; NADH .6–.8), the other H⁺ drifts off, "H⁺ released" (.55–.95). .nad .enzyme .fuel; .pt
//   nadLoop(p, {x=800, y=450, s, o, w=900, h=300, n=1}) a fuel station (left) and a chain icon (right) on a dashed loop;
//       .set(u) (u wraps) the shuttle loads (0–.12), rides the top (.12–.42), unloads into the chain (.42–.55) and returns
//       as NAD⁺ along the bottom; n shuttles share the loop. .buses .station .chain
//   substrateLevel(p, {x=800, y=450, s, o, size=24, labels=true}) slide 21: an olive enzyme (rx 190), a substrate with a P
//       and ADP come onto it (0–.25), the P hops to ADP (.3–.6), ADP → ATP (.5–.62), "substrate" → "product" (.38–.52),
//       both leave (.7–1). .set(k)
//   redoxEq(p, {kind='glucose'|'methane'|'salt'|'fuel', x=800, y=450, s, o, size=44, gap=26, oxLabel, redLabel}) the
//       equation centred on the origin with real sub- and superscripts; .ox(k) the orange bracket over it from the
//       oxidized reactant to its product ("becomes oxidized"); .red(k) the blue one under it; .reveal(k) terms left to
//       right; .focus(indices, k); .pt(i, side) term i (signs count) in parent
//
//   Internal helpers start with j (jK jT jU jSet jTxt jChip jParts jArrow …); lesson pages must not declare j-names of
//   their own.

Object.assign(MC, {
  elec: '#ffd27a', elecEdge: '#c79a2e', proton: '#ff7aa8', protonEdge: '#b8436c', hAtom: '#f4f4f0', hAtomEdge: '#b9b9b0',
  nad: '#e8a87c', nadEdge: '#a8714b', fad: '#c9b27a', fadEdge: '#8f7a48',
  oxid: '#f39a2b', redu: '#6c8cff', carbon: '#9aa3ad', carbonEdge: '#5f6873', oxy: '#e5533d', oxyEdge: '#a33424',
  glucose: '#f3c95c', glucoseEdge: '#a8862c', pyruvate: '#f07a6a', pyruvateEdge: '#a84a3e', coa: '#4fa3a5', coaEdge: '#2a6668',
  gly: '#5fb8c9', pyrOx: '#d9826a', cac: '#d0533d', oxph: '#8a7ad1', invest: '#86a8e6', payoff: '#f0c060',
  complex: '#6c8cff', complexEdge: '#3d56b8', q: '#e8a87c', qEdge: '#a8714b', cytc: '#6c8cff', iron: '#c46a3c',
  synth: '#5b6ee1', synthEdge: '#34419a', rotor: '#a3adf5', rotorEdge: '#5b6ee1',
  mito: '#f39a2b', mitoEdge: '#c9761b', matrix: '#4a2d10', ims: '#7a4c1c', cristae: '#f8c27a', cytosol: '#183457',
  ethanol: '#a8e0ea', acetald: '#d6f1f5', lactate: '#f2a0a0', yeast: '#efe3c0',
  inhib: '#e5533d', stim: '#5bbf5b', fatTail: '#e9c46a', glycerol: '#8fb0d6', amino: '#c9a0dc', aminoEdge: '#8f68a6',
  boom: '#f39a2b', boomCore: '#ffe08a', valve: '#a8c66c', valveEdge: '#6f8a3d',
});

/* ---------- helpers (prefix j) ---------- */
const jK = k => Math.round(mClamp(+k || 0) * 2000) / 2000;          // a progress, clamped and rounded
const jU = u => Math.round(cFrac(+u || 0) * 2000) / 2000;          // a looping phase, wrapped and rounded
const jT = t => Math.round((+t || 0) * 120) / 120;                 // seconds, rounded to 1/120
const jL = (a, b, k) => a + (b - a) * k;
const jL2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
const jSS = v => { const c = mClamp(v); return c * c * (3 - 2 * c); };
const jR = (k, a, b) => jSS(mRamp(k, a, b));                       // an eased ramp 0 → 1 between a and b
const jMix = (a, b, k) => mix(a, b, Math.round(mClamp(k) * 20) / 20);
const jDeg = a => a * Math.PI / 180;
// put only what changed (rounded like cSet), and never let a moved element fall back to the identity transform: the
// engine would drop its transform attribute and add it back after its opacity, so a played and a seeked frame would
// differ in attribute order (the e2e replay check)
function jSet(e, v) {
  const s0 = st(e), nv = {};
  for (const k in v) nv[k] = cRound(k, v[k]);
  const x = 'x' in nv ? nv.x : s0.x, y = 'y' in nv ? nv.y : s0.y, s = 's' in nv ? nv.s : s0.s, r = 'r' in nv ? nv.r : s0.r;
  if (('x' in nv || 'y' in nv || 's' in nv || 'r' in nv) && !x && !y && s === 1 && !r) { nv.s = .999; e._jg = 1; }
  else if (e._jg && !('s' in nv) && (x || y || r)) { nv.s = 1; e._jg = 0; }   // undo the nudge once it has moved off
  let ch = false; for (const k in nv) if (s0[k] !== nv[k]) { ch = true; break; }
  if (ch) put(e, nv);
  return e;
}
function jTxt(e, str) { if (e._j !== str) { e.textContent = str; e._j = str; } return e; }
const jChem = (e, str) => wChemSet(e, str);
function jText(p, str, { x = 0, y = 0, size = 26, fill = COL.chalk, anchor = 'middle', weight = 700, o = 1 } = {}) {
  return wChem(p, str, { x, y, size, fill, anchor, weight, o });
}
const jRect = (w, h, r, cx = 0, cy = 0) => {
  r = Math.min(r, w / 2, h / 2);
  const L = cx - w / 2, R = cx + w / 2, Tp = cy - h / 2, B = cy + h / 2;
  return `M${cF(L + r)} ${cF(Tp)}H${cF(R - r)}Q${cF(R)} ${cF(Tp)} ${cF(R)} ${cF(Tp + r)}V${cF(B - r)}Q${cF(R)} ${cF(B)} ${cF(R - r)} ${cF(B)}H${cF(L + r)}Q${cF(L)} ${cF(B)} ${cF(L)} ${cF(B - r)}V${cF(Tp + r)}Q${cF(L)} ${cF(Tp)} ${cF(L + r)} ${cF(Tp)}Z`;
};
const jCirc = (r, cx = 0, cy = 0) => cCircle(r, cx, cy);
const jPolyD = (pts, close = false) => 'M' + pts.map(cP).join('L') + (close ? 'Z' : '');
// arrow shaft and head as two path strings
function jArrowD(x1, y1, x2, y2, head = 16) {
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, h = Math.min(head, L * .6);
  const bx = x2 - ux * h, by = y2 - uy * h;
  return [`M${cF(x1)} ${cF(y1)}L${cF(x2 - ux * h * .8)} ${cF(y2 - uy * h * .8)}`,
    `M${cF(bx - uy * h * .62)} ${cF(by + ux * h * .62)}L${cF(x2)} ${cF(y2)}L${cF(bx + uy * h * .62)} ${cF(by - ux * h * .62)}Z`];
}
// a movable straight arrow: .set(x1, y1, x2, y2), .color(c)
function jArrow(p, { color = COL.chalk, w = 6, head = 18, o = 1, dash } = {}) {
  const g = G(p, { o });
  const sh = path(g, '', { stroke: color, 'stroke-width': w, ...(dash ? { 'stroke-dasharray': dash } : {}) });
  const hd = path(g, '', { fill: color, stroke: color, 'stroke-width': 2 });
  const a = Object.assign(g, {
    sh, hd,
    set(x1, y1, x2, y2) { const [s1, s2] = jArrowD(x1, y1, x2, y2, head); mD(sh, s1); mD(hd, s2); return a; },
    color(c) { cAttr(sh, 'stroke', c); cAttr(hd, 'fill', c); cAttr(hd, 'stroke', c); return a; },
  });
  return a;
}
// a polyline with its length table: .at(k) the point k of the way along, .dir(k) the unit direction there, .d the path
function jLine(pts) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = L[L.length - 1] || 1;
  const seg = k => { const want = mClamp(k) * tot; let i = 1; while (i < L.length - 1 && L[i] < want) i++; return [i, L[i] - L[i - 1] ? (want - L[i - 1]) / (L[i] - L[i - 1]) : 1]; };
  return {
    pts, len: tot, d: jPolyD(pts),
    at(k) { const [i, f] = seg(k); return jL2(pts[i - 1], pts[i], f); },
    dir(k) { const [i] = seg(k), a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; },
    upTo(k) { const [i, f] = seg(k); return jPolyD([...pts.slice(0, i), jL2(pts[i - 1], pts[i], f)]); },
  };
}
// a cubic Bézier sampled into a jLine
function jBezLine(P0, P1, P2, P3, n = 32) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
    pts.push([a * P0[0] + b * P1[0] + c * P2[0] + d * P3[0], a * P0[1] + b * P1[1] + c * P2[1] + d * P3[1]]);
  }
  return jLine(pts);
}
// an arrow along a jLine drawn up to k: shaft path + head; .set(line, k), .color(c)
function jPathArrow(p, { color = COL.chalk, w = 6, head = 18, o = 1, dash } = {}) {
  const g = G(p, { o });
  const sh = path(g, '', { stroke: color, 'stroke-width': w, ...(dash ? { 'stroke-dasharray': dash } : {}) });
  const hd = path(g, '', { fill: color, stroke: color, 'stroke-width': 2 });
  const a = Object.assign(g, {
    sh, hd,
    set(line, k = 1) {
      const kk = Math.max(.001, k), end = line.at(kk), [ux, uy] = line.dir(kk), h = Math.min(head, line.len * kk * .9 + 1);
      mD(sh, line.upTo(Math.max(.0005, kk - h * .8 / line.len)));
      const bx = end[0] - ux * h, by = end[1] - uy * h;
      mD(hd, `M${cF(bx - uy * h * .62)} ${cF(by + ux * h * .62)}L${cF(end[0])} ${cF(end[1])}L${cF(bx + uy * h * .62)} ${cF(by - ux * h * .62)}Z`);
      mO(sh, k > 0 ? 1 : 0); mO(hd, k > 0 ? 1 : 0);
      return a;
    },
    color(c) { cAttr(sh, 'stroke', c); cAttr(hd, 'fill', c); cAttr(hd, 'stroke', c); return a; },
  });
  return a;
}
// Parts that build in order and focus (lit / dimmed to .25): entries [name, group(s), inBuild=true]; aliases map a name
// to several. extra(name) multiplies a part's opacity (for parts shown by their own setters).
function jParts(entries, aliases = {}) {
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
    setBuild(k) { bk = jK(k); },
    setFocus(names, k = 1) { const L = (Array.isArray(names) ? names : [names]).flatMap(expand); lit = L.length ? new Set(L) : null; fk = jK(k); },
    // the build share of a part (0..1)
    b(name) { const i = order.indexOf(name); return i < 0 ? 1 : mRamp(bk * N - i, 0, 1); },
    f(name) { return lit ? (lit.has(name) ? 1 : 1 - .75 * fk) : 1; },
    lit(name) { return !lit || lit.has(name); },
    apply(extra = () => 1) { for (const n in groups) { const v = this.b(n) * this.f(n) * extra(n); groups[n].forEach(g => mO(g, v)); } },
    kOf(name) { const i = order.indexOf(name); return i < 0 ? 0 : (i + 1) / N; },
  };
}

/* ---------- electrons, protons, H atoms, small molecules ---------- */
function electron(p, { x = 0, y = 0, s = 1, o = 1, n = 1, r = 9, label = false, trail = 0, size = 22 } = {}) {
  const g = G(p, { x, y, s, o });
  const tr = path(g, '', { stroke: MC.elec, 'stroke-width': r * 1.3, 'stroke-opacity': .35 });
  const dots = [];
  for (let i = 0; i < n; i++) {
    const dg = G(g, { x: n > 1 ? (i - (n - 1) / 2) * r * 2.3 : 0, s: .999 });
    mk('circle', { r, fill: MC.elec, stroke: MC.elecEdge, 'stroke-width': 1.5 }, dg);
    mk('circle', { cx: -r * .3, cy: -r * .35, r: r * .3, fill: '#fff', 'fill-opacity': .6 }, dg);
    dots.push(dg);
  }
  const lab = jText(g, n > 1 ? n + ' e^−' : 'e^−', { y: -r - 10, size, fill: MC.elec, o: label ? 1 : 0 });
  const e = Object.assign(g, {
    dots, lab,
    // place it; ang (degrees, the direction of travel) and len draw a fading trail behind it
    pose(nx, ny, ang = null, len = trail) {
      jSet(g, { x: nx, y: ny });
      if (ang == null || !len) mD(tr, 'M0 0');
      else { const a = jDeg(ang); mD(tr, `M0 0L${cF(-Math.cos(a) * len)} ${cF(-Math.sin(a) * len)}`); }
      return e;
    },
    tag(k) { mO(lab, jK(k)); return e; },
  });
  return e.pose(x, y);
}
function proton(p, { x = 0, y = 0, s = 1, o = 1, r = 15, label = 'sign' } = {}) {
  const g = solute(p, 'H', { x, y, s, o, r, label });
  g.pose = (nx, ny) => { jSet(g, { x: nx, y: ny }); return g; };
  return g.pose(x, y);
}
function hAtom(p, { x = 0, y = 0, s = 1, o = 1, r = 17, letter = true } = {}) {
  const g = G(p, { x, y, s, o });
  const ball = mk('circle', { r, fill: MC.hAtom, stroke: MC.hAtomEdge, 'stroke-width': 2.5 }, g);
  mk('ellipse', { cx: -r * .35, cy: -r * .4, rx: r * .3, ry: r * .17, fill: '#fff', 'fill-opacity': .5 }, g);
  const let_ = letter ? wLabel(g, 'H', { y: r * .36, size: r, fill: '#3b3b36', weight: 800, o: 1 }) : null;
  const plus = wLabel(g, '+', { x: -r * .95, y: -r * .55, size: r * 1.1, fill: MC.protonEdge, weight: 800, o: 0 });
  const el = electron(g, { r: r * .42 });
  const h = Object.assign(g, {
    ball, el, plus,
    pose(nx, ny) { jSet(g, { x: nx, y: ny }); return h; },
    // k 0 an H atom (its electron rides on it); 1 the electron has moved off: H⁺ (pink) + e⁻
    split(k) {
      k = jK(k);
      cAttr(ball, 'fill', jMix(MC.hAtom, MC.proton, k)); cAttr(ball, 'stroke', jMix(MC.hAtomEdge, MC.protonEdge, k));
      mO(plus, jR(k, .5, .9));
      const a = jL(-35, 0, k), d = jL(r * .95, r * 2.6, jSS(k));
      el.pose(Math.cos(jDeg(a)) * d, Math.sin(jDeg(a)) * d);
      return h;
    },
    ept() { return cOut(g, [el._st.x, el._st.y]); },
  });
  return h.split(0);
}
function co2Molecule(p, { x = 0, y = 0, s = 1, o = 1, r = 16, label = false, size = 22 } = {}) {
  const g = G(p, { x, y, s, o });
  path(g, `M${-r * 1.1} 0H${r * 1.1}`, { stroke: '#cfd3d8', 'stroke-width': r * .45 });
  for (const sx of [-1, 1]) {
    mk('circle', { cx: sx * r * 1.15, r: r * .72, fill: MC.oxy, stroke: MC.oxyEdge, 'stroke-width': 2 }, g);
    mk('circle', { cx: sx * r * 1.15 - r * .22, cy: -r * .25, r: r * .2, fill: '#fff', 'fill-opacity': .4 }, g);
  }
  mk('circle', { r: r * .82, fill: MC.carbon, stroke: MC.carbonEdge, 'stroke-width': 2 }, g);
  mk('circle', { cx: -r * .25, cy: -r * .3, r: r * .22, fill: '#fff', 'fill-opacity': .4 }, g);
  const lab = jText(g, 'CO_2', { y: r + size + 2, size, fill: COL.chalk, o: label ? 1 : 0 });
  const c = Object.assign(g, { lab, pose(nx, ny) { jSet(g, { x: nx, y: ny }); return c; } });
  return c;
}
function o2Molecule(p, { x = 0, y = 0, s = 1, o = 1, r = 16, label = false, size = 22 } = {}) {
  const g = G(p, { x, y, s, o });
  for (const sx of [-1, 1]) {
    mk('circle', { cx: sx * r * .62, r: r * .8, fill: MC.oxy, stroke: MC.oxyEdge, 'stroke-width': 2 }, g);
    mk('circle', { cx: sx * r * .62 - r * .25, cy: -r * .28, r: r * .22, fill: '#fff', 'fill-opacity': .4 }, g);
  }
  const lab = jText(g, 'O_2', { y: r + size + 2, size, fill: COL.chalk, o: label ? 1 : 0 });
  const c = Object.assign(g, { lab, pose(nx, ny) { jSet(g, { x: nx, y: ny }); return c; } });
  return c;
}

/* ---------- ATP burst, explosion ---------- */
function atpBurst(p, { x = 0, y = 0, s = 1, o = 1, r = 34, label = 'ATP', size } = {}) {
  const g = G(p, { x, y, s, o });
  const slot = path(g, zStar(r, r * .66, 10), { stroke: MC.elec, 'stroke-width': 2.5, 'stroke-dasharray': '6 6', 'stroke-opacity': .7 }, { o: 0 });
  const inner = G(g, { s: .999, o: 0 });
  const rays = G(inner, { s: .999 });
  let d = ''; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + .31; d += `M${cF(Math.cos(a) * r * 1.12)} ${cF(Math.sin(a) * r * 1.12)}L${cF(Math.cos(a) * r * 1.42)} ${cF(Math.sin(a) * r * 1.42)}`; }
  path(rays, d, { stroke: MC.elec, 'stroke-width': Math.max(2.5, r * .1) });
  path(inner, zStar(r, r * .7, 10), { fill: MC.elec, stroke: MC.elecEdge, 'stroke-width': 2 });
  const txt = jText(inner, label, { y: (size ?? r * .5) * .36, size: size ?? r * .5, fill: '#3a2a06', weight: 800 });
  let K = 1, T0 = 0, SL = 0;
  const b = Object.assign(g, {
    inner, txt, r,
    apply() {
      const grow = K <= 0 ? 0 : K >= 1 ? 1 : back(K);
      jSet(inner, { s: Math.max(.05, grow) * (1 + .04 * Math.sin(T0 * 5)), o: mRamp(K, 0, .2), r: 0 });
      jSet(rays, { r: (T0 * 20) % 36, o: .6 + .4 * Math.sin(T0 * 4) ** 2 });
      mO(slot, SL * (1 - mRamp(K, 0, .3)));
      return b;
    },
    set(k) { K = jK(k); return b.apply(); },          // k 0 hidden … 1 full (a small overshoot on the way)
    shine(t) { T0 = jT(t); return b.apply(); },      // the rays turn and pulse
    empty(k) { SL = jK(k); return b.apply(); },      // an empty dashed star outline (shows until the burst fills it)
    // (not .slot: SVG elements have a DOM property of that name)
    text(str) { jChem(txt, str); return b; },
  });
  return b.set(1);
}
function explosion(p, { x = 0, y = 0, s = 1, o = 1, r = 110 } = {}) {
  const g = G(p, { x, y, s, o });
  const inner = G(g, { s: .999, o: 0 });
  const jag = (R1, R2, n, seed) => { const pts = []; for (let i = 0; i < 2 * n; i++) { const a = i * Math.PI / n + seed, rr = (i % 2 ? R2 : R1) * (1 + .12 * Math.sin(i * 2.7 + seed)); pts.push([rr * Math.cos(a), rr * Math.sin(a)]); } return jPolyD(pts, true); };
  path(inner, jag(r, r * .62, 12, .2), { fill: MC.boom, stroke: '#c96a12', 'stroke-width': 3 });
  path(inner, jag(r * .68, r * .42, 10, .5), { fill: MC.boomCore, stroke: 'none' });
  mk('circle', { r: r * .22, fill: '#fffbe8' }, inner);
  const b = Object.assign(g, {
    inner,
    // k 0 nothing; it flares (0–.3); hold: it stays, otherwise it fades (.6–1)
    set(k, hold = false) {
      k = jK(k);
      const sc = .15 + .85 * out(mRamp(k, 0, .3)), op = k <= 0 ? 0 : Math.min(1, k * 8) * (hold ? 1 : 1 - mRamp(k, .6, 1));
      jSet(inner, { s: sc, o: op, r: k * 25 }); return b;
    },
  });
  return b.set(0);
}

/* ---------- redox arrows and agent tags ---------- */
function redoxArrow(p, kind = 'ox', { x = 0, y = 0, s = 1, o = 1, dir = -90, len = 80, label, sub = '', size = 26, e = true } = {}) {
  const g = G(p, { x, y, s, o }), ox = kind === 'ox', color = ox ? MC.oxid : MC.redu;
  label = label ?? (ox ? 'oxidized' : 'reduced');
  const a = jDeg(dir), ux = Math.cos(a), uy = Math.sin(a);
  const ar = jArrow(g, { color, w: 6, head: 18 });
  const el = electron(g, { r: 7, o: e ? 1 : 0 });
  const anchor = Math.abs(ux) < .35 ? 'middle' : ux > 0 ? 'start' : 'end';
  const lx = ux * (len + 14), ly = uy * (len + 14) + (Math.abs(ux) < .35 ? (uy < 0 ? -8 : size) : size * .36);
  const lg = G(g, { o: 0 });
  const t1 = jText(lg, label, { x: lx, y: uy < 0 && Math.abs(ux) < .35 && sub ? ly - size * .95 : ly, size, fill: color, anchor });
  const t2 = sub ? jText(lg, sub, { x: lx, y: (uy < 0 && Math.abs(ux) < .35 ? ly - size * .95 : ly) + size * 1.05, size: size * .8, fill: COL.dim, anchor, weight: 600 }) : null;
  const ra = Object.assign(g, {
    ar, el, lab: lg,
    // the arrow draws (0–.6), its electron leaves along it (ox) or arrives (red) (.3–1), the label fades in (.5–1)
    draw(k) {
      k = jK(k);
      const f = jR(k, 0, .6), L0 = 6, L1 = len;
      if (ox) ar.set(ux * L0, uy * L0, ux * jL(L0 + 1, L1, f), uy * jL(L0 + 1, L1, f));
      else ar.set(ux * L1, uy * L1, ux * jL(L1 - 1, L0, f), uy * jL(L1 - 1, L0, f));
      mO(ar, k > 0 ? 1 : 0);
      const u = jR(k, .3, 1), d = ox ? jL(L0 + 12, L1 * .78, u) : jL(L1 * .9, L0 + 14, u);
      el.pose(ux * d + uy * 14, uy * d - ux * 14); mO(el, e ? mBump(k, .25, 1.02) : 0);
      mO(lg, jR(k, .5, 1));
      return ra;
    },
  });
  return ra.draw(1);
}
function agentTag(p, kind = 'reducing', { x = 0, y = 0, s = 1, o = 1, sub = true, size = 22 } = {}) {
  const g = G(p, { x, y, s, o }), red = kind === 'reducing', color = red ? MC.oxid : MC.redu;
  const s1 = red ? 'reducing agent' : 'oxidizing agent', s2 = red ? 'electron donor' : 'electron acceptor';
  const w = Math.round(Math.max(uiW(s1, size), sub ? uiW(s2, size * .82) : 0) * 1.08 + 30), h = sub ? size * 2.3 + 12 : size + 16;
  path(g, jRect(w, h, 12), { fill: '#0b1626', stroke: color, 'stroke-width': 3 });
  jText(g, s1, { y: sub ? -size * .25 : size * .36, size, fill: color });
  if (sub) jText(g, s2, { y: size * .95, size: size * .82, fill: COL.dim, weight: 600 });
  return Object.assign(g, { w, h });
}

/* ---------- NAD⁺/NADH and FAD/FADH₂ shuttles ---------- */
function nadShuttle(p, { x = 0, y = 0, s = 1, o = 1, kind = 'NAD', label = true, size = 26 } = {}) {
  const fad = kind === 'FAD', w = fad ? 96 : 124, h = fad ? 46 : 54, col = fad ? MC.fad : MC.nad, edge = fad ? MC.fadEdge : MC.nadEdge;
  const g = G(p, { x, y, s, o });
  const halo = path(g, jRect(w + 26, h + 26, (h + 26) / 2), { fill: MC.elec, 'fill-opacity': .22, stroke: MC.elec, 'stroke-width': 3 }, { o: 0 });
  for (const sx of [-1, 1]) mk('circle', { cx: sx * w * .3, cy: h / 2 + 3, r: h * .19, fill: '#2a2f3a', stroke: '#11151c', 'stroke-width': 2 }, g);
  path(g, jRect(w, h, h * .42), { fill: col, stroke: edge, 'stroke-width': 3 });
  mk('ellipse', { cx: -w * .26, cy: -h * .26, rx: w * .16, ry: h * .1, fill: '#fff', 'fill-opacity': .3 }, g);
  // three seats: two electrons and one H (FAD: two electrons and two H)
  const seatX = fad ? [-w * .3, -w * .1, w * .12, w * .32] : [-w * .3, -w * .08, w * .22];
  seatX.forEach(sx => mk('circle', { cx: sx, cy: -2, r: h * .2, fill: '#00000033', stroke: edge, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, g));
  const es = [0, 1].map(i => electron(g, { x: seatX[i], y: -2, r: h * .17, o: 0 }));
  const hs = (fad ? [2, 3] : [2]).map(i => { const a = hAtom(g, { x: seatX[i], y: -2, r: h * .2, letter: true }); a.el.dots[0].style.display = 'none'; mO(a, 0); return a; });
  const badge = G(g, { x: w / 2 - 6, y: -h / 2 + 2, o: fad ? 0 : 1 });
  if (!fad) { mk('circle', { r: 13, fill: '#fff6e8', stroke: MC.oxyEdge, 'stroke-width': 2.5 }, badge); wLabel(badge, '+', { y: 8, size: 24, fill: MC.oxyEdge, weight: 800, o: 1 }); }
  const lab = jText(g, fad ? 'FAD' : 'NAD^+', { y: h / 2 + size + 12, size, fill: col, o: label ? 1 : 0 });
  let R = 0, GL = 0;
  const names = fad ? ['FAD', 'FADH_2'] : ['NAD^+', 'NADH'];
  const sh = Object.assign(g, {
    kind, w, h, es, hs, badge, lab, halo,
    pose(nx, ny) { jSet(g, { x: nx, y: ny }); return sh; },
    // red 0 oxidized (empty seats, + badge; NAD⁺ / FAD) … 1 reduced (two electrons and the H aboard; NADH / FADH₂).
    // The name fades out (.35–.5), changes at .5 and fades back in (.5–.65): never two names on one spot.
    set(red) {
      R = jK(red);
      if (!fad) mO(badge, 1 - jR(R, 0, .35));
      es.forEach((e, i) => { const k = jR(R, .25 + i * .1, .6 + i * .1); e.pose(seatX[i], -2 - 26 * (1 - k)); mO(e, k); });
      hs.forEach((a, i) => { const k = jR(R, .45 + i * .1, .8 + i * .05); a.pose(seatX[2 + i], -2 - 22 * (1 - k)); mO(a, k); });
      jChem(lab, names[R < .5 ? 0 : 1]);
      mO(lab, label ? (R < .5 ? 1 - mRamp(R, .35, .5) : mRamp(R, .5, .65)) : 0);
      return sh;
    },
    glow(k) { GL = jK(k); mO(halo, GL); return sh; },      // a gold halo: "stored energy"
    seat(i) { return cOut(g, [seatX[i] ?? 0, -2]); },       // seat i's point in parent (0, 1 electrons; 2 (and 3) H)
    red() { return R; },
  });
  return sh.set(0);
}
// The nicotinamide ring of NAD⁺ / NADH, close up (slide 15): oxidized, a + on the ring nitrogen and one H on the top
// carbon; reduced, the + gone and a second H on that carbon. Origin = ring centre; ring radius 70.
function nicotinamide(p, { x = 0, y = 0, s = 1, o = 1, labels = true, size = 26 } = {}) {
  const g = G(p, { x, y, s, o }), Rr = 70;
  const V = i => { const a = jDeg(-90 + i * 60); return [Rr * Math.cos(a), Rr * Math.sin(a)]; };   // 0 top, 3 bottom (N)
  path(g, jPolyD([0, 1, 2, 3, 4, 5].map(V), true), { fill: '#1d3354', stroke: COL.chalk, 'stroke-width': 5 });
  const inner = (i, j) => { const a = V(i), b = V(j), c = [0, 0], q = .2; return `M${cP(jL2(a, c, q))}L${cP(jL2(b, c, q))}`; };
  const dOx = path(g, inner(1, 2) + inner(3, 4) + inner(5, 0), { stroke: COL.chalk, 'stroke-width': 4 });
  const dRed = path(g, inner(1, 2) + inner(4, 5), { stroke: COL.chalk, 'stroke-width': 4 }, { o: 0 });
  // N at the bottom vertex, R (the rest of NAD) below it
  const [nx, ny] = V(3);
  mk('circle', { cx: nx, cy: ny, r: 22, fill: '#7f90bd', stroke: '#56658f', 'stroke-width': 3 }, g);
  wLabel(g, 'N', { x: nx, y: ny + 9, size: 26, fill: '#fff', weight: 800, o: 1 });
  path(g, `M${nx} ${ny + 22}V${ny + 62}`, { stroke: COL.chalk, 'stroke-width': 4 });
  jText(g, 'rest of NAD', { x: nx, y: ny + 92, size: 22, fill: COL.dim, weight: 600 });
  const plus = G(g, { x: nx + 30, y: ny - 14 });
  mk('circle', { r: 15, fill: MC.redu, stroke: '#3d56b8', 'stroke-width': 2 }, plus); wLabel(plus, '+', { y: 9, size: 26, fill: '#fff', weight: 800, o: 1 });
  // the side group on the upper right vertex
  const [sx, sy] = V(1);
  path(g, `M${cF(sx)} ${cF(sy)}L${cF(sx + 52)} ${cF(sy - 30)}`, { stroke: COL.chalk, 'stroke-width': 4 });
  jText(g, 'C(=O)NH_2', { x: sx + 58, y: sy - 32, size: 22, fill: COL.chalk, anchor: 'start', weight: 600 });
  // the top carbon's hydrogens
  const [tx, ty] = V(0);
  const h1 = G(g); path(h1, `M${tx} ${ty}L${tx - 34} ${ty - 40}`, { stroke: COL.chalk, 'stroke-width': 4 }); hAtom(h1, { x: tx - 42, y: ty - 50, r: 16 }).el.dots[0].style.display = 'none';
  const h2 = G(g, { o: 0 }); path(h2, `M${tx} ${ty}L${tx + 34} ${ty - 40}`, { stroke: COL.chalk, 'stroke-width': 4 });
  const h2a = hAtom(h2, { x: tx + 42, y: ty - 50, r: 16 }); h2a.el.dots[0].style.display = 'none';
  const lg = G(g);
  const title = jText(lg, 'NAD^+', { y: -Rr - 92, size: size * 1.2, fill: MC.nad });
  const sub = jText(lg, 'nicotinamide (oxidized form)', { y: ny + 128, size, fill: COL.chalk });
  const nr = Object.assign(g, {
    plus, h2, title, sub,
    // red 0 oxidized … 1 reduced: the + fades (0–.4), the new H joins (.4–.8), one double bond moves (.3–.7); the names
    // fade out, change at .5 and fade back in
    set(red) {
      red = jK(red);
      mO(plus, 1 - jR(red, 0, .4)); jSet(h2, { o: jR(red, .4, .8), x: 0, y: -12 * (1 - jR(red, .4, .8)) });
      mO(dOx, 1 - jR(red, .3, .5)); mO(dRed, jR(red, .5, .7));
      jChem(title, red < .5 ? 'NAD^+' : 'NADH'); jTxt(sub, red < .5 ? 'nicotinamide (oxidized form)' : 'nicotinamide (reduced form)');
      mO(lg, labels ? (red < .5 ? 1 - mRamp(red, .35, .5) : mRamp(red, .5, .65)) : 0);
      return nr;
    },
    pt(name) { const P = { N: [nx, ny], C: [tx, ty], H: [tx + 42, ty - 50], plus: [nx + 30, ny - 14] }[name] || [0, 0]; return cOut(g, P); },
  });
  return nr.set(0);
}

/* ---------- carbon chains ---------- */
// carbonChain: n grey carbon beads on a coloured backing (pyruvate coral, acetyl salmon, ethanol pale blue …).
// Origin = the chain's centre at full length. Setters combine (each redraws from the whole state).
function carbonChain(p, { x = 0, y = 0, s = 1, o = 1, n = 3, color = MC.pyruvate, sp = 34, r = 13, label = '', size = 24, back = true } = {}) {
  const g = G(p, { x, y, s, o });
  const bx = i => (i - (n - 1) / 2) * sp;
  const backing = path(g, '', { fill: color, stroke: mix(color, '#000000', .35), 'stroke-width': 3 }, { o: back ? 1 : 0 });
  const bonds = path(g, '', { stroke: '#cfd3d8', 'stroke-width': 5 });
  const tagG = G(g, { o: 0 });
  path(tagG, jRect(70, 34, 10, 35, 0), { fill: MC.coa, stroke: MC.coaEdge, 'stroke-width': 3 });
  jText(tagG, 'CoA', { x: 35, y: 8, size: 22, fill: '#0b2224', weight: 800 });
  const beads = [], Ps = [], oxs = [];
  for (let i = 0; i < n; i++) {
    const bg = G(g, { x: bx(i), s: .999 });
    const ox = G(bg, { o: 0 });                 // the two oxygens a leaving carbon takes as CO₂
    for (const sx of [-1, 1]) mk('circle', { cx: sx * r * 1.15, r: r * .72, fill: MC.oxy, stroke: MC.oxyEdge, 'stroke-width': 2 }, ox);
    mk('circle', { r, fill: MC.carbon, stroke: MC.carbonEdge, 'stroke-width': 2.5 }, bg);
    mk('circle', { cx: -r * .3, cy: -r * .35, r: r * .28, fill: '#fff', 'fill-opacity': .45 }, bg);
    const P = G(bg, { y: -r - 14, s: .999, o: 0 });
    path(P, `M0 ${r * .6}V14`, { stroke: MC.P, 'stroke-width': 3 });
    mk('circle', { r: 12, fill: MC.P, stroke: MC.Pedge, 'stroke-width': 2 }, P); wLabel(P, 'P', { y: 6, size: 16, fill: '#24160a', weight: 800, o: 1 });
    beads.push(bg); Ps.push(P); oxs.push(ox);
  }
  const lab = jText(g, label, { y: r + size + 12, size, fill: color, o: label ? 1 : 0 });
  let LK = 0, LT = [60, -120], LF = true, TK = 0, COLR = color, PH = beads.map(() => 0), LI = n - 1;
  const ch = Object.assign(g, {
    n, beads, lab,
    apply() {
      const lk = LK, cut = jR(lk, .3, .7);     // the backing shrinks as the bead leaves
      const left = LI === 0 ? bx(0) + cut * sp : bx(0), right = LI === n - 1 ? bx(n - 1) - cut * sp : bx(n - 1);
      mD(backing, jRect(right - left + 2 * r + 16, 2 * r + 14, r + 7, (left + right) / 2, 0));
      cAttr(backing, 'fill', COLR); cAttr(backing, 'stroke', mix(COLR, '#000000', .35)); cAttr(lab, 'fill', COLR);
      let bd = '';
      for (let i = 0; i < n - 1; i++) { const gone = (i === LI || i + 1 === LI) ? jR(lk, 0, .25) : 0; if (gone < 1) bd += `M${cF(bx(i))} 0L${cF(bx(i + 1))} 0`; }
      mD(bonds, bd || 'M0 0');
      beads.forEach((b, i) => {
        if (i === LI) {
          const mv = jR(lk, .3, 1);
          jSet(b, { x: bx(i) + LT[0] * mv, y: LT[1] * mv, o: LF ? 1 - mRamp(lk, .85, 1) : 1 });
          mO(oxs[i], jR(lk, .2, .45));
        } else { jSet(b, { x: bx(i), y: 0, o: 1 }); mO(oxs[i], 0); }
        jSet(Ps[i], { o: PH[i], y: -r - 14 });
      });
      // the CoA tag joins at the end the carbon left (or the right end)
      const tagX = right + r + 6, tk = jR(TK, 0, 1);
      jSet(tagG, { x: tagX + 50 * (1 - tk), y: 0, o: mRamp(TK, 0, .3) });
      return ch;
    },
    lose(k, { to = [60, -120], fade = true, i = n - 1 } = {}) { LK = jK(k); LT = to; LF = fade; LI = i; return ch.apply(); },  // bead i leaves as CO₂
    tag(k) { TK = jK(k); return ch.apply(); },                    // the teal CoA tag slides on at the right end
    color(c) { COLR = c; return ch.apply(); },                    // the backing's colour (pyruvate → acetaldehyde …)
    phos(ks) { PH = beads.map((_, i) => jK(Array.isArray(ks) ? ks[i] || 0 : 0)); return ch.apply(); },   // P on bead i
    pose(nx, ny) { jSet(g, { x: nx, y: ny }); return ch; },
    bead(i) { return cOut(g, [beads[i]._st.x, beads[i]._st.y]); },
    name(str) { jChem(lab, str); mO(lab, str ? 1 : 0); return ch; },
  });
  return ch.apply();
}
// glucoseRing: the gold sugar hexagon with six grey carbon beads at its corners (origin = its centre, R = 46). Setters
// combine: .split(k) the ring opens into two 3-bead chains (above and below by `apart`), the hexagon fades and coral
// backings fade in; .morph(k) the hexagon becomes a five-sided ring with one carbon outside (fructose); .phos([k0…k5]) a
// phosphate on bead i (bead 0 is the top right corner, going clockwise; after the split beads 0–2 are the top chain);
// .count(k) a "6 C" label above, reading "3 C + 3 C" once split (it fades out, changes and fades back in at split .5).
function glucoseRing(p, { x = 0, y = 0, s = 1, o = 1, R = 46, r = 12, apart = 50, sp = 32, label = '', size = 24, color = MC.pyruvate } = {}) {
  const g = G(p, { x, y, s, o });
  const hexV = i => { const a = jDeg(-60 + i * 60); return [R * Math.cos(a), R * Math.sin(a)]; };
  // fructose: a pentagon of beads 0–4, bead 5 outside on the upper left
  const pentV = i => { if (i === 5) return [-R * 1.35, -R * .9]; const a = jDeg(-90 + i * 72); return [R * .92 * Math.cos(a), R * .92 * Math.sin(a) + 4]; };
  const chainV = i => i < 3 ? [(i - 1) * sp, -apart] : [(i - 4) * sp, apart];
  const backs = [-1, 1].map(sg => path(g, jRect(2 * sp + 2 * r + 16, 2 * r + 14, r + 7, 0, sg * apart), { fill: color, stroke: mix(color, '#000000', .35), 'stroke-width': 3 }, { o: 0 }));
  const ring = path(g, '', { fill: MC.glucose, stroke: MC.glucoseEdge, 'stroke-width': 4 });
  const bonds = path(g, '', { stroke: '#cfd3d8', 'stroke-width': 4.5 });
  const beads = [], Ps = [];
  for (let i = 0; i < 6; i++) {
    const bg = G(g, { s: .999 });
    mk('circle', { r, fill: MC.carbon, stroke: MC.carbonEdge, 'stroke-width': 2.5 }, bg);
    mk('circle', { cx: -r * .3, cy: -r * .35, r: r * .28, fill: '#fff', 'fill-opacity': .45 }, bg);
    const P = G(bg, { y: -r - 14, s: .999, o: 0 });
    path(P, `M0 ${r * .6}V14`, { stroke: MC.P, 'stroke-width': 3 });
    mk('circle', { r: 12, fill: MC.P, stroke: MC.Pedge, 'stroke-width': 2 }, P); wLabel(P, 'P', { y: 6, size: 16, fill: '#24160a', weight: 800, o: 1 });
    beads.push(bg); Ps.push(P);
  }
  const cnt = jText(g, '6 C', { y: -R - 34, size, fill: COL.chalk, o: 0 });
  const lab = jText(g, label, { y: R + size + 16, size, fill: MC.glucose, o: label ? 1 : 0 });
  let SK = 0, MK = 0, PH = [0, 0, 0, 0, 0, 0], CK = 0;
  const gr = Object.assign(g, {
    beads, lab, cnt,
    pos(i) { const a = jL2(hexV(i), pentV(i), jSS(MK)); return jL2(a, chainV(i), jSS(SK)); },
    apply() {
      const P6 = [0, 1, 2, 3, 4, 5].map(i => gr.pos(i)), m = jSS(MK);
      // the ring through the ring beads (bead 5 slides onto the pentagon's edge as it morphs), drawn a little inside them
      const rp = [0, 1, 2, 3, 4].map(i => jL2(hexV(i), pentV(i), m)).concat([jL2(hexV(5), jL2(pentV(4), pentV(0), .5), m)]);
      mD(ring, jPolyD(rp.map(q => [q[0] * .82, q[1] * .82]), true)); mO(ring, 1 - jR(SK, 0, .5));
      let bd = '';
      const pairs = SK < .5 ? (MK < .5 ? [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]] : [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [4, 5]]) : [[0, 1], [1, 2], [3, 4], [4, 5]];
      pairs.forEach(([a, b]) => { bd += `M${cP(P6[a])}L${cP(P6[b])}`; });
      mD(bonds, bd); mO(bonds, SK < .5 ? 1 - jR(SK, .2, .5) : jR(SK, .5, .8));
      beads.forEach((b, i) => { jSet(b, { x: P6[i][0], y: P6[i][1] }); jSet(Ps[i], { o: PH[i], y: -r - 14 }); });
      backs.forEach(bk => mO(bk, jR(SK, .5, 1)));
      jTxt(cnt, SK < .5 ? '6 C' : '3 C + 3 C');
      mO(cnt, CK * (SK < .5 ? 1 - mRamp(SK, .3, .5) : mRamp(SK, .5, .7)));
      jSet(cnt, { x: 0, y: SK < .5 ? -R - 34 : -apart - r - 30 });
      return gr;
    },
    split(k) { SK = jK(k); return gr.apply(); },
    morph(k) { MK = jK(k); return gr.apply(); },
    phos(ks) { PH = [0, 1, 2, 3, 4, 5].map(i => jK(Array.isArray(ks) ? ks[i] || 0 : 0)); return gr.apply(); },
    count(k) { CK = jK(k); return gr.apply(); },
    pose(nx, ny) { jSet(g, { x: nx, y: ny }); return gr; },
    bead(i) { return cOut(g, gr.pos(i)); },
    chainPt(top = true) { return cOut(g, [0, top ? -apart : apart]); },
  });
  return gr.apply();
}

/* ---------- chips ---------- */
// a dark pill with chemistry text, origin at its centre; .w .h; .text(str)
function jChip(p, str, { x = 0, y = 0, size = 22, fill = COL.chalk, edge = COL.chalk, o = 1, bg = '#0b1626', pad = 24, weight = 700 } = {}) {
  const g = G(p, { x, y, o });
  const lines = str.split('\n'), plain = l => l.replace(/[_^]\{([^}]*)\}/g, '$1').replace(/[_^](.)/g, '$1');
  const w = Math.round(Math.max(...lines.map(l => uiW(plain(l), size))) * 1.08 + pad), h = size * 1.2 * (lines.length - 1) + size + 14;
  const box = path(g, jRect(w, h, Math.min(h / 2, size * .9)), { fill: bg, stroke: edge, 'stroke-width': 2.5 });
  const ts = lines.map((l, i) => jText(g, l, { y: size * .36 + (i - (lines.length - 1) / 2) * size * 1.2, size, fill, weight }));
  return Object.assign(g, { w, h, box, t: ts[0], ts });
}
// a stage box: rounded rectangle in a stage tint with dark lines of text (lines: [str, size]…), origin at its centre
function jStageBox(p, lines, { x = 0, y = 0, w = 280, h = 130, fill, o = 1 } = {}) {
  const g = G(p, { x, y, o });
  path(g, jRect(w, h, 18), { fill, stroke: mix(fill, '#000000', .35), 'stroke-width': 3.5 });
  mk('ellipse', { cx: -w * .3, cy: -h * .32, rx: w * .14, ry: h * .07, fill: '#fff', 'fill-opacity': .25 }, g);
  const tot = lines.reduce((a, [, sz]) => a + sz * 1.18, 0); let yy = -tot / 2;
  lines.forEach(([str, sz, wt = 800]) => { yy += sz * 1.18; jText(g, str, { y: yy - sz * .28, size: sz, fill: '#14233a', weight: wt }); });
  return Object.assign(g, { w, h });
}
// a small cycle wheel glyph: a red ring with an arrowhead, text inside; origin = centre
function jWheel(p, { x = 0, y = 0, R = 80, o = 1, color = MC.cac, lines = [['CITRIC', 17], ['ACID', 17], ['CYCLE', 17]], w = 16 } = {}) {
  const g = G(p, { x, y, o });
  mk('circle', { r: R - w / 2 - 4, fill: mix(color, '#0f1e33', .55) }, g);
  const a0 = jDeg(-60), a1 = jDeg(250);
  path(g, `M${cF(R * Math.cos(a0))} ${cF(R * Math.sin(a0))}A${R} ${R} 0 1 1 ${cF(R * Math.cos(a1))} ${cF(R * Math.sin(a1))}`, { stroke: color, 'stroke-width': w });
  const hx = R * Math.cos(a0), hy = R * Math.sin(a0), tx = -Math.sin(a0), ty = Math.cos(a0), hh = w * 1.5;
  path(g, `M${cF(hx - tx * hh + Math.cos(a0) * hh * .9)} ${cF(hy - ty * hh + Math.sin(a0) * hh * .9)}L${cF(hx + tx * hh * .9)} ${cF(hy + ty * hh * .9)}L${cF(hx - tx * hh - Math.cos(a0) * hh * .9)} ${cF(hy - ty * hh - Math.sin(a0) * hh * .9)}Z`, { fill: color, stroke: color, 'stroke-width': 2 });
  const tot = lines.reduce((a, [, sz]) => a + sz * 1.15, 0); let yy = -tot / 2;
  lines.forEach(([str, sz]) => { yy += sz * 1.15; jText(g, str, { y: yy - sz * .25, size: sz, fill: COL.chalk, weight: 800 }); });
  return Object.assign(g, { R });
}

/* ---------- respMap: the respiration map (slide 19), the chapter's thread ---------- */
function respMap(p, { x = 800, y = 450, s = 1, o = 1, sub = true, size = 1 } = {}) {
  const g = G(p, { x, y, s, o });
  const L = {};
  // cell and mitochondrion outlines
  L.cell = G(g); path(L.cell, jRect(1400, 600, 44), { fill: MC.cytosol, 'fill-opacity': .55, stroke: MC.membrane, 'stroke-width': 6 });
  jText(L.cell, 'cytosol', { x: -650, y: -262, size: 24, fill: COL.dim, anchor: 'start', weight: 600 });
  L.mito = G(g);
  path(L.mito, `M-30 -200H450A220 220 0 0 1 450 240H-30A220 220 0 0 1 -30 -200Z`, { fill: '#3a2410', 'fill-opacity': .75, stroke: MC.mito, 'stroke-width': 7 });
  jText(L.mito, 'mitochondrion', { x: 210, y: 278, size: 24, fill: MC.mito, weight: 700 });
  // stage boxes
  L.glycolysis = jStageBox(g, [['GLYCOLYSIS', 27], ['glucose → pyruvate', 21, 700]], { x: -470, y: 20, w: 290, h: 130, fill: MC.gly });
  L.flow1 = G(g); mArrow(L.flow1, [-322, 20], [-205, 20], { color: COL.chalk, w: 6, head: 18 });
  L.pyruvateOx = jStageBox(g, [['PYRUVATE', 22], ['OXIDATION', 22]], { x: -110, y: 20, w: 180, h: 130, fill: MC.pyrOx });
  L.flow2 = G(g); mArrow(L.flow2, [-17, 20], [62, 20], { color: COL.chalk, w: 6, head: 18 });
  jText(L.flow2, 'acetyl', { x: 22, y: 60, size: 18, fill: COL.chalk, weight: 700 }); jText(L.flow2, 'CoA', { x: 22, y: 82, size: 18, fill: COL.chalk, weight: 700 });   // two lines: clear of the box and the ring
  L.cycle = jWheel(g, { x: 150, y: 20, R: 80 });
  L.oxphos = jStageBox(g, [['OXIDATIVE', 23], ['PHOSPHORYLATION', 23], ['electron transport', 17, 700], ['and chemiosmosis', 17, 700]], { x: 470, y: 20, w: 290, h: 170, fill: MC.oxph });
  // electron arrows over the top (slide 19's two label boxes sit on them)
  const E1 = jLine([[-470, -48], [-470, -205], ...[1, 2, 3, 4].map(i => { const a = jDeg(180 + i * 22.5); return [-420 + 50 * Math.cos(a), -205 + 50 * Math.sin(a)]; }), [520, -255], ...[1, 2, 3].map(i => { const a = jDeg(-90 + i * 22.5); return [520 + 50 * Math.cos(a), -205 + 50 * Math.sin(a)]; }), [570, -205], [570, -68]]);
  const E2 = jLine([[-110, -48], [-110, -110], ...[1, 2, 3].map(i => { const a = jDeg(180 + i * 30); return [-70 + 40 * Math.cos(a), -110 + 40 * Math.sin(a)]; }), [-70, -150], [460, -150], ...[1, 2].map(i => { const a = jDeg(-90 + i * 30); return [460 + 40 * Math.cos(a), -110 + 40 * Math.sin(a)]; }), [500, -110], [500, -68]]);
  const E3 = jLine([[150, -70], [150, -150]]);
  const E3flow = jLine([[150, -70], [150, -150], [460, -150], [500, -110], [500, -68]]);
  L.e1 = G(g); L.e2 = G(g); L.e3 = G(g);
  const a1 = jPathArrow(L.e1, { color: MC.elec, w: 6, head: 20 }), a2 = jPathArrow(L.e2, { color: MC.elec, w: 6, head: 20 }), a3 = jPathArrow(L.e3, { color: MC.elec, w: 6, head: 1 });
  const flows = [E1, E2, E3flow].map((ln, i) => { const fg = G([L.e1, L.e2, L.e3][i]); return { ln, fg, ds: [0, 1, 2].map(() => electron(fg, { n: 2, r: 6, s: .999 })) }; });
  const chip1 = jChip(L.e1, 'electrons carried via NADH', { x: -20, y: -255, size: 20 * size, fill: MC.elec, edge: MC.elec });
  const chip2 = jChip(L.e2, 'electrons carried via\nNADH and FADH_2', { x: 32, y: -150, size: 19 * size, fill: MC.elec, edge: MC.elec });
  // ATP bursts, the last the largest
  const mkAtp = (nm, bx, by, r, from, to, label) => {
    const gg = G(g); mArrow(gg, [bx, from], [bx, to], { color: COL.chalk, w: 5, head: 16 });
    const b = atpBurst(gg, { x: bx, y: by, r });
    if (sub && label) jText(gg, label, { x: bx, y: by + r * 1.42 + 22, size: 18, fill: COL.dim, weight: 600 });
    L[nm] = gg; return b;
  };
  const bursts = [mkAtp('atp1', -470, 190, 32, 88, 148, 'substrate-level'), mkAtp('atp2', 150, 172, 30, 104, 134, ''), mkAtp('atp3', 470, 170, 40, 108, 128, '')];
  if (sub) jText(L.atp2, 'substrate-level', { x: 200, y: 179, size: 18, fill: COL.dim, weight: 600, anchor: 'start' });
  // extras: fuel doors (lesson 9), cross-out (lesson 8), fermentation arrow, ATP feedback loop, ticks
  L.carbs = G(g); L.proteins = G(g); L.fats = G(g);
  const door = (gg, x1, y1, x2, y2) => { const a = jArrow(gg, { color: COL.chalk, w: 4, head: 16, dash: '10 8' }); a.set(x1, y1, x2, y2); return a; };
  fuelIcon(L.carbs, 'carb', { x: -560, y: -395, s: .8 }); jText(L.carbs, 'carbohydrates', { x: -560, y: -335, size: 20, fill: MC.glucose });
  door(L.carbs, -560, -318, -560, -92);
  fuelIcon(L.proteins, 'protein', { x: 150, y: -395, s: .8 }); jText(L.proteins, 'proteins', { x: 150, y: -335, size: 20, fill: MC.amino });
  door(L.proteins, 120, -318, -80, -92); door(L.proteins, 150, -318, 150, -72);
  fuelIcon(L.fats, 'fat', { x: -330, y: -400, s: .8 }); jText(L.fats, 'fats', { x: -330, y: -335, size: 20, fill: MC.fatTail });
  door(L.fats, -300, -318, 15, -12); door(L.fats, -350, -318, -420, -92);
  L.cross = G(g);
  path(L.cross, 'M-120 -150L560 200M-120 200L560 -150', { stroke: MC.inhib, 'stroke-width': 16 });
  jChip(L.cross, 'no O_2', { x: 220, y: 25, size: 30, fill: MC.inhib, edge: MC.inhib });
  L.ferment = G(g); mArrow(L.ferment, [-350, 88], [-310, 200], { color: MC.ethanol, w: 5, head: 16 });
  jChip(L.ferment, 'fermentation', { x: -300, y: 228, size: 19, fill: MC.ethanol, edge: MC.ethanol });
  L.valve = G(g);
  path(L.valve, 'M470 250V286H-405V92', { stroke: COL.chalk, 'stroke-width': 5 });
  path(L.valve, 'M-417 106L-405 86L-393 106Z', { fill: COL.chalk, stroke: COL.chalk, 'stroke-width': 3 });
  const vb = G(L.valve, { x: -405, y: 128 }); mk('circle', { r: 17, fill: MC.inhib, stroke: '#9e3022', 'stroke-width': 2 }, vb); wLabel(vb, '−', { y: 10, size: 30, fill: '#fff', weight: 800, o: 1 });
  jText(L.valve, 'ATP slows phosphofructokinase', { x: -200, y: 278, size: 18, fill: COL.chalk, weight: 600 });
  const ticks = {};
  [['glycolysis', -335, -40], ['pyruvateOx', -30, -40], ['cycle', 215, -55], ['oxphos', 600, -60]].forEach(([nm, tx, ty]) => {
    const tg = G(g, { x: tx, y: ty, s: .999, o: 0 });
    mk('circle', { r: 20, fill: MC.stim, stroke: '#3a8a3a', 'stroke-width': 2.5 }, tg); path(tg, 'M-9 0L-2 8L10 -8', { stroke: '#fff', 'stroke-width': 5 });
    ticks[nm] = tg;
  });
  const parts = jParts([
    ['cell', L.cell], ['mito', L.mito], ['glycolysis', L.glycolysis], ['flow1', L.flow1, false], ['pyruvateOx', L.pyruvateOx], ['flow2', L.flow2, false],
    ['cycle', L.cycle], ['oxphos', L.oxphos], ['e1', L.e1], ['e2', L.e2], ['e3', L.e3], ['atp1', L.atp1], ['atp2', L.atp2], ['atp3', L.atp3],
    ['carbs', L.carbs, false], ['proteins', L.proteins, false], ['fats', L.fats, false], ['cross', L.cross, false], ['ferment', L.ferment, false], ['valve', L.valve, false],
  ], {
    electrons: ['e1', 'e2', 'e3'], atp: ['atp1', 'atp2', 'atp3'], stages: ['glycolysis', 'pyruvateOx', 'cycle', 'oxphos'], inputs: ['carbs', 'proteins', 'fats'],
    mitochondrion: ['mito'], cytosol: ['cell'], citric: ['cycle'], krebs: ['cycle'], bridge: ['pyruvateOx'], fermentation: ['ferment'],
    nadh: ['e1', 'e2'], fadh2: ['e3', 'e2'],
  });
  // flow arrows between stages follow the stage after them
  const shareOf = { flow1: 'pyruvateOx', flow2: 'cycle' };
  let EX = { carbs: 0, proteins: 0, fats: 0, cross: 0, ferment: 0, valve: 0 }, FT = 0, FA = 0, ST = 0, SL = 0, TK = {};
  const rm = Object.assign(g, {
    parts: L, bursts, order: parts.order, chips: [chip1, chip2],
    apply() {
      parts.apply(nm => {
        if (nm in shareOf) return parts.b(shareOf[nm]) / Math.max(.001, parts.b(nm)) * (parts.f(shareOf[nm]) / Math.max(.001, parts.f(nm)));
        return nm in EX ? EX[nm] : 1;
      });
      a1.set(E1, parts.b('e1')); a2.set(E2, parts.b('e2')); a3.set(E3, parts.b('e3'));
      mO(chip1, mRamp(parts.b('e1'), .6, 1)); mO(chip2, mRamp(parts.b('e2'), .6, 1));
      flows.forEach(({ ln, ds }, i) => {
        const amt = Array.isArray(FA) ? FA[i] ?? 0 : FA, b = parts.b(['e1', 'e2', 'e3'][i]);
        ds.forEach((d, j) => { const u = cFrac(FT * (i === 0 ? .22 : .3) + j / 3 + i * .13), q = ln.at(u), dr = ln.dir(u); d.pose(q[0], q[1], Math.atan2(dr[1], dr[0]) * 180 / Math.PI, 0); mO(d, amt * b * mBump(u, 0, 1) ** .5); });
      });
      bursts.forEach(b => { b.shine(ST); b.empty(SL); });
      for (const nm in ticks) { const k = TK[nm] || 0; jSet(ticks[nm], { o: k * parts.f(nm), s: .4 + .6 * back(k) }); }
      return rm;
    },
    build(k) { parts.setBuild(k); return rm.apply(); },
    // names: cell mito glycolysis pyruvateOx cycle oxphos e1 e2 e3 atp1 atp2 atp3 carbs proteins fats cross ferment valve,
    // or electrons atp stages inputs mitochondrion bridge fermentation nadh fadh2 all; [] or null lights all
    focus(names, k = 1) { parts.setFocus(names || [], k); return rm.apply(); },
    flow(t, amt = 1) { FT = jT(t); FA = Array.isArray(amt) ? amt.map(jK) : jK(amt); return rm.apply(); },
    shine(t) { ST = jT(t); return rm.apply(); },
    slots(k) { SL = jK(k); return rm.apply(); },
    inputs(k) { const v = Array.isArray(k) ? k.map(jK) : [k, k, k].map(jK); EX.carbs = v[0]; EX.proteins = v[1]; EX.fats = v[2]; return rm.apply(); },
    cross(k) { EX.cross = jK(k); return rm.apply(); },
    ferment(k) { EX.ferment = jK(k); return rm.apply(); },
    valve(k) { EX.valve = jK(k); return rm.apply(); },
    tick(names, k = 1) { TK = {}; (Array.isArray(names) ? names : [names]).forEach(n => { TK[n] = jK(k); }); return rm.apply(); },
    kOf(name) { return parts.kOf(name); },
    pt(name) {
      const P = { cell: [0, 0], mito: [210, 20], cytosol: [-470, -150], glycolysis: [-470, 20], glucose: [-560, 40], pyruvate: [-340, 20],
        pyruvateOx: [-110, 20], acetylCoA: [22, 20], cycle: [150, 20], oxphos: [470, 20], atp1: [-470, 190], atp2: [150, 172], atp3: [470, 170],
        e1: [-20, -255], e2: [32, -150], e3: [150, -110], chip1: [-20, -255], chip2: [32, -150], carbs: [-560, -395], proteins: [150, -395], fats: [-330, -400],
        cross: [220, 25], ferment: [-300, 228], valve: [-405, 128], innerMembrane: [470, -65] }[name] || [0, 0];
      return cOut(g, P);
    },
    // a point k along electron arrow i (0, 1, 2) in parent, for a page's own carriers
    along(i, k) { return cOut(g, [E1, E2, E3flow][i].at(k)); },
  });
  return rm.apply();
}

/* ---------- glycolysisStrip: the ten steps as named chips ---------- */
const J_GLY = [['hexokinase'], ['phospho-', 'glucoisomerase'], ['phospho-', 'fructokinase'], ['aldolase'], ['isomerase'],
  ['triose phosphate', 'dehydrogenase'], ['phospho-', 'glycerokinase'], ['phospho-', 'glyceromutase'], ['enolase'], ['pyruvate', 'kinase']];
function glycolysisStrip(p, { x = 800, y = 450, s = 1, o = 1, w = 1440, size = 16, beads = true } = {}) {
  const g = G(p, { x, y, s, o }), cw = w / 10 - 12, chH = 74, cx = i => -w / 2 + (i + .5) * w / 10;
  const arrows = [];
  for (let i = 0; i < 9; i++) arrows.push(path(g, `M${cF(cx(i) + cw / 2 + 1)} -7L${cF(cx(i + 1) - cw / 2 - 1)} 0L${cF(cx(i) + cw / 2 + 1)} 7`, { stroke: COL.dim, 'stroke-width': 3 }));
  const chips = J_GLY.map((lines, i) => {
    const cg = G(g, { x: cx(i), s: .999 }), tint = i < 5 ? MC.invest : MC.payoff;
    const box = path(cg, jRect(cw, chH, 14), { fill: tint, stroke: mix(tint, '#000000', .35), 'stroke-width': 3 });
    const nb = G(cg, { x: -cw / 2 + 4, y: -chH / 2 + 2 });
    mk('circle', { r: 15, fill: '#0b1626', stroke: tint, 'stroke-width': 2.5 }, nb);
    jText(nb, String(i + 1), { y: 7, size: 19, fill: COL.chalk, weight: 800 });
    const n = lines.length, fs = Math.min(size, size * (cw - 14) / Math.max(...lines.map(l => uiW(l, size) * 1.06)));
    lines.forEach((ln, j) => jText(cg, ln, { y: (j - (n - 1) / 2) * fs * 1.2 + fs * .4 + 4, size: Math.round(fs * 10) / 10, fill: '#14233a', weight: 700 }));
    if (beads) {
      const nB = i < 4 ? 6 : 3, bw = 13;
      let d = ''; for (let b = 0; b < nB; b++) d += 'M' + cF((b - (nB - 1) / 2) * bw) + ' ' + (chH / 2 + 22) + 'h.01';
      path(cg, d, { stroke: MC.carbon, 'stroke-width': 11 });
      if (i >= 4) jText(cg, '×2', { x: (nB / 2) * bw + 18, y: chH / 2 + 29, size: 18, fill: COL.dim, weight: 700, anchor: 'middle' });
    }
    return Object.assign(cg, { box });
  });
  const ph = G(g, { o: 0 });
  [[0, 4, 'energy investment phase', MC.invest], [5, 9, 'energy payoff phase', MC.payoff]].forEach(([a, b, str, c]) => {
    const x1 = cx(a) - cw / 2, x2 = cx(b) + cw / 2, yy = -chH / 2 - 18;
    path(ph, `M${cF(x1)} ${yy + 10}V${yy}H${cF(x2)}V${yy + 10}`, { stroke: c, 'stroke-width': 3.5 });
    jText(ph, str, { x: (x1 + x2) / 2, y: yy - 12, size: 22, fill: c });
  });
  const star = G(g, { x: cx(2) + cw / 2 - 6, y: -chH / 2 - 4, s: .999, o: 0 });
  path(star, zStar(22, 10, 5), { fill: MC.proton, stroke: MC.protonEdge, 'stroke-width': 2 });
  const starLab = jText(g, 'key regulation step', { x: cx(2), y: chH / 2 + 62, size: 18, fill: MC.proton, o: 0 });
  let BK = 1, LIT = null, FK = 0, PK = 0, SK = 0;
  const gs = Object.assign(g, {
    chips, phasesG: ph, star, starLab,
    apply() {
      chips.forEach((c, i) => {
        const b = mRamp(BK * 10 - i, 0, 1), f = LIT ? (LIT.has(i + 1) ? 1 : 1 - .75 * FK) : 1, lit = LIT && LIT.has(i + 1) ? FK : 0;
        jSet(c, { o: b * f, y: -8 * lit, x: cx(i) });
        if (i < 9) mO(arrows[i], mRamp(BK * 10 - i - 1, 0, 1) * (LIT ? 1 - .75 * FK : 1));
      });
      mO(ph, PK);
      jSet(star, { o: SK, s: .5 + .5 * back(SK) }); mO(starLab, SK);
      return gs;
    },
    build(k) { BK = jK(k); return gs.apply(); },
    // steps: numbers 1..10, 'invest' (1–5) or 'payoff' (6–10); the lit chips also rise a little
    focus(steps, k = 1) {
      const L = (Array.isArray(steps) ? steps : [steps]).flatMap(v => v === 'invest' ? [1, 2, 3, 4, 5] : v === 'payoff' ? [6, 7, 8, 9, 10] : [+v]).filter(Boolean);
      LIT = L.length ? new Set(L) : null; FK = jK(k); return gs.apply();
    },
    phases(k) { PK = jK(k); return gs.apply(); },
    star(k) { SK = jK(k); return gs.apply(); },
    pt(i) { return cOut(g, [cx(i - 1), chips[i - 1]._st.y]); },          // chip i's centre (1..10) in parent
    below(i) { return cOut(g, [cx(i - 1), chH / 2 + 22]); },              // under chip i (its bead glyph)
  });
  return gs.apply();
}

/* ---------- citricCycle: the wheel of eight intermediates ---------- */
const J_CAC = [['oxaloacetate', 4], ['citrate', 6], ['isocitrate', 6], ['α-ketoglutarate', 5], ['succinyl CoA', 4], ['succinate', 4], ['fumarate', 4], ['malate', 4]];
function citricCycle(p, { x = 800, y = 450, s = 1, o = 1, R = 220, labels = true, beads = true, size = 22, centre = true } = {}) {
  const g = G(p, { x, y, s, o });
  const ang = i => jDeg(-112.5 + i * 45), np = (i, rr = R) => [rr * Math.cos(ang(i)), rr * Math.sin(ang(i))];
  const ringG = G(g);
  path(ringG, jCirc(R), { stroke: mix(MC.cac, '#0f1e33', .35), 'stroke-width': 12 });
  const ringHi = path(ringG, jCirc(R), { stroke: MC.cac, 'stroke-width': 12 }, { d: 0 });
  for (let i = 0; i < 8; i++) {   // an arrowhead in the middle of each step's arc, clockwise
    const a = ang(i) + jDeg(22.5), hx = R * Math.cos(a), hy = R * Math.sin(a), tx = -Math.sin(a), ty = Math.cos(a);
    path(ringG, `M${cF(hx - tx * 14 + Math.cos(a) * 13)} ${cF(hy - ty * 14 + Math.sin(a) * 13)}L${cF(hx + tx * 12)} ${cF(hy + ty * 12)}L${cF(hx - tx * 14 - Math.cos(a) * 13)} ${cF(hy - ty * 14 - Math.sin(a) * 13)}Z`, { fill: MC.cac, stroke: MC.cac, 'stroke-width': 2 });
  }
  const cen = G(g, { o: centre ? 1 : 0 });
  const cs = Math.round(30 * Math.min(1, R / 220));
  jText(cen, 'citric acid', { y: -cs * .2, size: cs, fill: MC.cac, weight: 800 }); jText(cen, 'cycle', { y: cs, size: cs, fill: MC.cac, weight: 800 });
  const nodes = J_CAC.map(([name, nb], i) => {
    const [nx, ny] = np(i), ngp = G(g, { x: nx, y: ny, s: .999 });
    const disc = mk('circle', { r: 40, fill: '#1a1220', stroke: MC.cac, 'stroke-width': 4 }, ngp);
    if (beads) {
      const rows = nb > 4 ? [3, nb - 3] : [2, 2]; let d = '';
      rows.forEach((m, ri) => { for (let b = 0; b < m; b++) d += 'M' + cF((b - (m - 1) / 2) * 17) + ' ' + cF((ri - .5) * 17) + 'h.01'; });
      path(ngp, d, { stroke: MC.carbon, 'stroke-width': 13 });
    }
    if (name === 'succinyl CoA') { const tg = G(ngp, { x: 30, y: 30 }); path(tg, jRect(44, 22, 7), { fill: MC.coa, stroke: MC.coaEdge, 'stroke-width': 2 }); jText(tg, 'CoA', { y: 6, size: 14, fill: '#0b2224', weight: 800 }); }
    const a = ang(i), ca = Math.cos(a), anchor = Math.abs(ca) < .3 ? 'middle' : ca > 0 ? 'start' : 'end';
    const lab = jText(g, name, { x: (R + 54) * ca, y: (R + 54) * Math.sin(a) + size * .36 + (Math.abs(ca) < .3 ? Math.sign(Math.sin(a)) * 14 : 0), size, fill: COL.chalk, anchor, o: labels ? 1 : 0 });
    const cnt = jText(g, nb + ' C', { x: (R - 68) * ca, y: (R - 68) * Math.sin(a) + 7, size: Math.round(19 * Math.min(1, R / 220)), fill: COL.dim, weight: 700, o: beads ? 1 : 0 });
    return Object.assign(ngp, { disc, lab, cnt, n: nb, name });
  });
  const badges = [];
  for (let i = 1; i <= 8; i++) {
    const a = ang(i - 1) + jDeg(22.5), bg = G(g, { x: (R + 34) * Math.cos(a), y: (R + 34) * Math.sin(a), o: 0 });
    mk('circle', { r: 15, fill: '#0b1626', stroke: COL.chalk, 'stroke-width': 2 }, bg); jText(bg, String(i), { y: 7, size: 18, fill: COL.chalk });
    badges.push(bg);
  }
  // acetyl CoA arrives from the top into step 1; its CoA peels off
  const entry = G(g, { o: 0 });
  const entA = jArrow(entry, { color: COL.chalk, w: 5, head: 16 }); const e1 = np(0), e2 = np(1), ePt = [(e1[0] + e2[0]) / 2 * 1.02, (e1[1] + e2[1]) / 2 * 1.02];
  entA.set(ePt[0], -R - 150, ePt[0], ePt[1] - 22);
  const acetyl = carbonChain(g, { n: 2, color: MC.pyrOx, r: 11, sp: 28 });
  const coaTag = G(g, { s: .999 }); path(coaTag, jRect(58, 28, 9), { fill: MC.coa, stroke: MC.coaEdge, 'stroke-width': 2.5 }); jText(coaTag, 'CoA', { y: 7, size: 18, fill: '#0b2224', weight: 800 });
  const acLab = jText(entry, 'acetyl CoA', { x: ePt[0] + 70, y: -R - 156, size, fill: MC.pyrOx, anchor: 'start' });
  const tok = G(g, { s: .999, o: 0 }); mk('circle', { r: 16, fill: '#fff6d8', 'fill-opacity': .9 }, tok);
  const parts = jParts([['ring', ringG], ['centre', cen], ...nodes.map((n, i) => ['node' + i, [n, ...(labels ? [n.lab] : []), ...(beads ? [n.cnt] : [])]])], {
    nodes: nodes.map((_, i) => 'node' + i), ...Object.fromEntries(J_CAC.map(([nm], i) => [nm, ['node' + i]])),
    oxaloacetate: ['node0'], citrate: ['node1'],
  });
  let JK = 0, RU = -1, BG = 0, DK = 1, EN = 0;
  const cc = Object.assign(g, {
    nodes, badges, acetyl, entry,
    apply() {
      parts.apply();
      mO(ringHi, 1); cSet(ringHi, { d: DK });
      badges.forEach(b => mO(b, BG));
      // the entry: acetyl CoA rides down (0–.5), its CoA peels off up-left (.45–.85), the acetyl merges into step 1 (.5–.7)
      const top = [ePt[0], -R - 120], down = jR(JK, 0, .5), pos = jL2(top, [ePt[0], ePt[1] - 10], down);
      mO(entry, EN * (1 - jR(JK, .7, .9)));
      acetyl.pose(pos[0] - 10, pos[1]); mO(acetyl, EN * (1 - jR(JK, .55, .72)));
      const peel = jR(JK, .45, .85), cp = jL2([pos[0] + 37, pos[1]], [ePt[0] - 120, ePt[1] - 120], peel);
      jSet(coaTag, { x: cp[0], y: cp[1], o: EN * (1 - jR(JK, .75, .95)) });
      // a token running round the ring; the node under it glows
      if (RU >= 0) { const a = jDeg(-112.5) + RU * 2 * Math.PI; jSet(tok, { x: R * Math.cos(a), y: R * Math.sin(a), o: 1 }); }
      else jSet(tok, { x: 0, y: -R, o: 0 });
      nodes.forEach((n, i) => {
        const d = RU >= 0 ? Math.abs(cFrac(RU - i / 8 + .5) - .5) * 8 : 9, hot = Math.max(0, 1 - d * 1.6) + (i === 1 ? jR(JK, .5, .7) * (1 - jR(JK, .85, 1)) : 0);
        cAttr(n.disc, 'fill', jMix('#1a1220', MC.cac, Math.min(1, hot) * .7));
      });
      return cc;
    },
    build(k) { parts.setBuild(k); return cc.apply(); },
    // names: ring centre node0…node7 nodes, or an intermediate's name ('citrate', 'α-ketoglutarate' …)
    focus(names, k = 1) { parts.setFocus(names || [], k); return cc.apply(); },
    draw(k) { DK = jK(k); return cc.apply(); },          // the bright ring draws on clockwise from oxaloacetate
    badges(k) { BG = jK(k); return cc.apply(); },
    entryOn(k) { EN = jK(k); return cc.apply(); },       // show the acetyl CoA arrow and chain at the top
    join(k) { JK = jK(k); return cc.apply(); },
    run(u) { RU = u == null || u < 0 ? -1 : jU(u); return cc.apply(); },   // a token round the ring (u 0..1, wraps); null hides it
    node(i) { return cOut(g, np(i)); },
    // the middle of step i's arc (1..8; step 1 runs oxaloacetate → citrate), pushed d outward; and its outward direction
    stepPt(i, d = 0) { const a = ang(i - 1) + jDeg(22.5); return cOut(g, [(R + d) * Math.cos(a), (R + d) * Math.sin(a)]); },
    stepDir(i) { const a = ang(i - 1) + jDeg(22.5); return [Math.cos(a), Math.sin(a)]; },
    entryPt() { return cOut(g, [ePt[0], -R - 120]); },
  });
  return cc.apply();
}

/* ---------- mitoCutaway: a large mitochondrion cut open ---------- */
function mitoCutaway(p, { x = 800, y = 450, s = 1, o = 1, w = 1300, h = 620, porter = true, labels = true, size = 24 } = {}) {
  const g = G(p, { x, y, s, o }), gap = 34, wi = w - 2 * gap, hi = h - 2 * gap, ri = hi / 2;
  const outer = G(g); path(outer, cStadium(w, h), { fill: MC.ims, stroke: MC.mito, 'stroke-width': 10 });
  // inner membrane with cristae: fingers from the top and the bottom in turn
  const sx = (wi - hi) / 2 + ri * .25, F = Math.max(3, Math.floor(2 * sx / 115) + 1), hw = 16, D = hi * .56, fx = [];
  for (let i = 0; i < F; i++) fx.push(-sx + i * 2 * sx / (F - 1));
  const Tp = -hi / 2, B = hi / 2;
  let d = `M${cF(-wi / 2 + ri)} ${cF(Tp)}`;
  fx.forEach((x0, i) => { if (i % 2) return; d += `L${cF(x0 - hw)} ${cF(Tp)}L${cF(x0 - hw)} ${cF(Tp + D - hw)}Q${cF(x0 - hw)} ${cF(Tp + D)} ${cF(x0)} ${cF(Tp + D)}Q${cF(x0 + hw)} ${cF(Tp + D)} ${cF(x0 + hw)} ${cF(Tp + D - hw)}L${cF(x0 + hw)} ${cF(Tp)}`; });
  d += `L${cF(wi / 2 - ri)} ${cF(Tp)}A${cF(ri)} ${cF(ri)} 0 0 1 ${cF(wi / 2 - ri)} ${cF(B)}`;
  [...fx].reverse().forEach((x0, j) => { const i = F - 1 - j; if (!(i % 2)) return; d += `L${cF(x0 + hw)} ${cF(B)}L${cF(x0 + hw)} ${cF(B - D + hw)}Q${cF(x0 + hw)} ${cF(B - D)} ${cF(x0)} ${cF(B - D)}Q${cF(x0 - hw)} ${cF(B - D)} ${cF(x0 - hw)} ${cF(B - D + hw)}L${cF(x0 - hw)} ${cF(B)}`; });
  d += `L${cF(-wi / 2 + ri)} ${cF(B)}A${cF(ri)} ${cF(ri)} 0 0 1 ${cF(-wi / 2 + ri)} ${cF(Tp)}Z`;
  const innerG = G(g); path(innerG, d, { fill: MC.matrix, stroke: MC.cristae, 'stroke-width': 8 });
  const matrixG = G(g);
  let rb = ''; for (let i = 0; i < F - 1; i++) rb += 'M' + cP([(fx[i] + fx[i + 1]) / 2 + 20, (i % 2 ? -1 : 1) * hi * .28]) + 'h.01';
  path(matrixG, rb, { stroke: '#aa9fc6', 'stroke-width': 12 });
  const dnaC = [(fx[1] + fx[2]) / 2, -hi * .05]; let dd = '';
  for (let i = 0; i <= 40; i++) { const a = i / 40 * 2 * Math.PI, rr = 26 + 5 * Math.sin(a * 5); dd += (i ? 'L' : 'M') + cF(dnaC[0] + rr * Math.cos(a)) + ' ' + cF(dnaC[1] + rr * .75 * Math.sin(a)); }
  path(matrixG, dd + 'Z', { stroke: '#e9dcc0', 'stroke-width': 3.5 });
  // the transport protein for pyruvate, through both membranes at the left end
  const portG = G(g, { x: -w / 2 + gap / 2 + 2, y: 0, o: porter ? 1 : 0 });
  const glowP = mk('ellipse', { rx: 46, ry: 52, fill: '#7fd1b9', 'fill-opacity': .35 }, portG); put(glowP, { o: 0 });
  for (const sy of [-1, 1]) path(portG, jRect(gap + 26, 26, 10, 0, sy * 17), { fill: '#7fd1b9', stroke: '#3f8f78', 'stroke-width': 3 });
  const L = {};
  if (labels) {
    const lab = (key, ax, ay, tx, ty, str) => { L[key] = cLabel(g, [ax, ay], [tx, ty], str, { size, o: 0 }); };
    lab('ims', -w * .2, -h / 2 + gap / 2, -w * .3, -h / 2 - 50, 'intermembrane space');
    lab('outer', w * .06, -h / 2 - 3, w * .02, -h / 2 - 50, 'outer membrane');
    lab('matrix', wi / 2 - ri * .55, -hi * .12, w * .34, -h / 2 - 50, 'matrix');
    lab('cristae', fx[1], B - D + 4, fx[1] - 150, h / 2 + 50, 'cristae');
    lab('inner', w * .3, hi / 2 + 2, w * .36, h / 2 + 50, 'inner membrane');
  }
  const parts = jParts([['outer', outer], ['inner', innerG], ['matrix', matrixG], ['porter', portG], ...Object.keys(L).map(k => ['lab_' + k, L[k], false])], { cristae: ['inner'], ims: ['outer'], labels: Object.keys(L).map(k => 'lab_' + k) });
  let LK = 0, PK = 0;
  const mc = Object.assign(g, {
    labelsG: L, fx,
    apply() {
      parts.apply(nm => nm.startsWith('lab_') ? LK : 1);
      mO(glowP, PK);
      return mc;
    },
    build(k) { parts.setBuild(k); return mc.apply(); },     // outer, inner, matrix contents, porter
    // names: outer (also ims) inner (also cristae) matrix porter, lab_outer … (labels); 'labels' all of them
    focus(names, k = 1) { parts.setFocus(names || [], k); return mc.apply(); },
    labels(k) { LK = jK(k); return mc.apply(); },
    porter(k) { PK = jK(k); return mc.apply(); },          // the transport protein glows
    pt(name) {
      const P = { outer: [0, -h / 2], ims: [0, -h / 2 + gap / 2], inner: [0, Tp], cristae: [fx[1] ?? 0, B - D * .5], matrix: [dnaC[0] + 120, 0],
        porter: [-w / 2 + gap / 2, 0], cytosol: [-w / 2 - 80, 0], dna: dnaC, right: [wi / 2 - 40, 0] }[name] || [0, 0];
      return cOut(g, P);
    },
  });
  return mc.apply();
}

/* ---------- protonCloud: H⁺ crowd in a band ---------- */
function protonCloud(p, { x = 0, y = 0, s = 1, o = 1, w = 800, h = 120, n = 30, r = 12, seed = 3, label = 'sign' } = {}) {
  const g = G(p, { x, y, s, o });
  const home = [], hs = [];
  for (let i = 0; i < n; i++) {
    home.push([(wHash(i, seed) - .5) * (w - 2 * r), (wHash(i, seed + 7) - .5) * (h - 2 * r)]);
    hs.push(proton(g, { x: home[i][0], y: home[i][1], r, label, o: 0 }));
  }
  const pc = Object.assign(g, {
    hs, n,
    // k: the share of the n protons shown (they appear one by one); t jiggles them
    set(k, t = 0) {
      k = jK(k); t = jT(t); const m = k * n;
      hs.forEach((hp, i) => { hp.pose(home[i][0] + 7 * zWob(i, t * 1.6, seed), home[i][1] + 6 * zWob(i + 50, t * 1.6, seed)); mO(hp, mClamp(m - i)); });
      return pc;
    },
  });
  return pc.set(1, 0);
}

/* ---------- atpSynthase ---------- */
function atpSynthase(p, { x = 0, y = 0, s = 1, o = 1, mem = 110, membrane = true, labels = false, size = 24 } = {}) {
  const g = G(p, { x, y, s, o }), cx = -15;
  if (membrane) {
    path(g, `M-190 ${-mem / 2}H200V${mem / 2}H-190Z`, { fill: '#5a3a16', stroke: 'none' });
    path(g, `M-190 ${-mem / 2}H200M-190 ${mem / 2}H200`, { stroke: MC.cristae, 'stroke-width': 7 });
  }
  // stator: the block in the membrane with the H⁺ half-channels, and the arm down to the knob
  const stat = G(g);
  path(stat, 'M62 -58H116Q126 -58 126 -48V50Q126 60 116 60H110V214Q110 226 98 226H62V200H90V60H62Q52 60 52 50V-48Q52 -58 62 -58Z', { fill: MC.synth, stroke: MC.synthEdge, 'stroke-width': 3.5 });
  path(stat, 'M94 -58V-6', { stroke: '#2b3570', 'stroke-width': 10 });          // upper half-channel (from the IMS)
  path(stat, 'M76 14V60', { stroke: '#2b3570', 'stroke-width': 10 });           // lower half-channel (to the matrix)
  // rod
  const rodG = G(g);
  path(rodG, `M${cx - 13} 30H${cx + 13}V176H${cx - 13}Z`, { fill: MC.rotor, stroke: MC.rotorEdge, 'stroke-width': 3 });
  const stripe = path(rodG, '', { stroke: MC.rotorEdge, 'stroke-width': 5 });
  // rotor: ten subunits round a ring in the membrane, drawn back to front
  const rotG = G(g), subs = [];
  for (let i = 0; i < 10; i++) { const sg = G(rotG, { s: .999 }); const b = path(sg, jRect(18, 74, 8), { fill: MC.rotor, stroke: MC.rotorEdge, 'stroke-width': 2.5 }); subs.push({ sg, b }); }
  // knob (three lobes, held still) with its stalk shadow
  const knob = G(g, { x: cx, y: 222 });
  [[-34, 0, '#7f8ff0'], [34, 0, '#6a7ae6'], [0, 30, '#93a0f4']].forEach(([kx, ky, c]) => mk('ellipse', { cx: kx, cy: ky, rx: 44, ry: 40, fill: c, stroke: MC.synthEdge, 'stroke-width': 3 }, knob));
  const site = mk('circle', { cx: 0, cy: 8, r: 18, fill: '#1c2252', stroke: MC.synthEdge, 'stroke-width': 2 }, knob);
  // protons and the ATP made
  const hs = [0, 1, 2, 3].map(() => proton(g, { r: 13, o: 0 }));
  const adp = solute(g, 'ADP', { r: 17, o: 0 }), pi = solute(g, 'Pi', { r: 15, o: 0 }), atp = solute(g, 'ATP', { r: 20, o: 0 });
  [adp, pi, atp].forEach(e => jSet(e, { x: cx, y: 300 }));
  const L = {};
  if (labels) {
    L.stator = cLabel(g, [118, 120], [180, 120], 'stator', { size, o: 0 });
    L.rotor = cLabel(g, [cx - 40, -30], [-150, -110], 'rotor', { size, o: 0 });
    L.rod = cLabel(g, [cx - 13, 120], [-150, 120], 'internal rod', { size, o: 0 });
    L.knob = cLabel(g, [cx - 70, 222], [-150, 250], 'catalytic knob', { size, o: 0 });
  }
  let TH = 0, FT = 0, FA = 0, MK = 0, SPD = .5, LK = 0;
  const ringX = th => cx + 52 * Math.sin(th), ringD = th => Math.cos(th);   // depth: + front, − back
  const sy = {
    subs, knob, hs, adp, pi, atp, labelsG: L,
    apply() {
      subs.forEach((sb, i) => {
        // fixed drawing order (no re-parenting, so a replay draws the same markup); depth shows as shade and width
        const th = TH + i * Math.PI / 5, d = ringD(th);
        jSet(sb.sg, { x: ringX(th), y: 0, s: .999, o: d >= 0 ? 1 : .55 });
        cAttr(sb.b, 'fill', jMix('#4a549e', MC.rotor, (d + 1) / 2));
      });
      mD(stripe, `M${cF(cx + 9 * Math.sin(TH))} 34V172`);
      // protons: in from the top through the upper half-channel, ride the rotor about one turn, out through the lower one
      hs.forEach((hp, j) => {
        const u = cFrac(FT * SPD + j / 4);
        let px, py;
        if (u < .18) { const k = u / .18; px = 94; py = jL(-150, -24, k); }
        else if (u < .86) { const k = (u - .18) / .68, th = jDeg(80) + k * 2 * Math.PI; px = jL(94, ringX(th), Math.min(1, k * 6)); py = jL(-24, 14, k); if (k > .85) px = jL(ringX(th), 76, (k - .85) / .15); }
        else { const k = (u - .86) / .14; px = 76; py = jL(14, 150, k); }
        hp.pose(px, py); mO(hp, FA * Math.min(1, u * 12, (1 - u) * 12));
      });
      // ATP: ADP + Pᵢ come to the knob (0–.35), join (.35–.5); the ATP leaves downward (.5–1); one per third of a turn
      const v = MK ? cFrac(FT * SPD * 3) : -1, on = MK;
      if (v >= 0) {
        const c1 = jR(v, 0, .35);
        adp.pose(jL(cx - 150, cx - 14, c1), jL(300, 236, c1)); pi.pose(jL(cx + 150, cx + 16, c1), jL(300, 236, c1));
        mO(adp, on * Math.min(1, v * 10) * (1 - mRamp(v, .4, .5))); mO(pi, on * Math.min(1, v * 10) * (1 - mRamp(v, .4, .5)));
        const a2 = jR(v, .5, 1); atp.pose(cx, jL(236, 330, a2)); mO(atp, on * mRamp(v, .5, .56) * (1 - mRamp(v, .9, 1)));
      } else { [adp, pi, atp].forEach(e => mO(e, 0)); }
      cAttr(site, 'fill', v >= 0 ? jMix('#1c2252', MC.elec, mBump(v, .4, .62) * on) : '#1c2252');
      Object.values(L).forEach(l => mO(l, LK));
      return g;
    },
    angle(deg) { TH = jDeg(Math.round((+deg || 0) * 10) / 10); return sy.apply(); },      // a still pose of the rotor
    // t seconds: the rotor turns at speed turns/s; flow (0..1) shows the protons; make (0..1) shows ADP + Pᵢ → ATP
    run(t, { speed = .5, flow = 1, make = 1 } = {}) { FT = jT(t); SPD = speed; TH = 2 * Math.PI * SPD * FT; FA = jK(flow); MK = jK(make); return sy.apply(); },
    labels(k) { LK = jK(k); return sy.apply(); },
    pt(name) { const P = { stator: [118, 120], rotor: [cx, 0], rod: [cx, 110], knob: [cx, 222], in: [94, -150], out: [76, 150], channel: [94, -40] }[name] || [0, 0]; return cOut(g, P); },
  };
  Object.assign(g, sy);
  return g.angle(0);
}

/* ---------- etcChain: the electron transport chain in the inner membrane ---------- */
function etcChain(p, { x = 800, y = 450, s = 1, o = 1, w = 1200, mem = 110, top = 230, bottom, bg = true, labels = true, synthase = false, final = 'O2', size = 24 } = {}) {
  const g = G(p, { x, y, s, o }), hm = mem / 2, X0 = -w / 2, X1 = w / 2;
  bottom = bottom ?? (synthase ? 300 : 250);
  const bgG = G(g);
  if (bg) {
    path(bgG, `M${X0} ${-top}H${X1}V${-hm}H${X0}Z`, { fill: MC.ims, 'fill-opacity': .55 });
    path(bgG, `M${X0} ${hm}H${X1}V${bottom}H${X0}Z`, { fill: MC.matrix, 'fill-opacity': .8 });
  }
  const memG = G(g);
  path(memG, `M${X0} ${-hm}H${X1}V${hm}H${X0}Z`, { fill: '#5a3a16' });
  path(memG, `M${X0} ${-hm}H${X1}M${X0} ${hm}H${X1}`, { stroke: MC.cristae, 'stroke-width': 7 });
  const regionL = G(g, { o: 0 });
  jText(regionL, 'INTERMEMBRANE SPACE', { x: X0 + 20, y: -top + 34, size: size * .9, fill: COL.dim, anchor: 'start' });
  jText(regionL, 'MITOCHONDRIAL MATRIX', { x: 0, y: bottom - 18, size: size * .9, fill: COL.dim });
  // positions (local x) of the carriers
  const span = synthase ? w - 320 : w - 140, ax = f => X0 + 70 + f * span;
  const C = { I: [ax(.04), 18], II: [ax(.22), 38], Qh: [ax(.36), 0], III: [ax(.52), 0], cHome: [ax(.62), -hm - 30], cEnd: [ax(.78), -hm - 30], IV: [ax(.88), 0] };
  // 'inner membrane' inside the membrane band, in the gap between III and IV (clear of IV and the synthase)
  jText(regionL, 'inner membrane', { x: (C.III[0] + 58 + C.IV[0] - 56) / 2, y: size * .8 * .36, size: size * .8, fill: MC.cristae });
  const O2 = [ax(.98), 150];
  const blob = (nm, [bx, by], rx, ry, seed) => {
    const cg = G(g, { x: bx, y: by, s: .999 });
    const halo = mk('ellipse', { rx: rx + 12, ry: ry + 12, fill: 'none', stroke: MC.redu, 'stroke-width': 8 }, cg); put(halo, { o: 0 });
    path(cg, cBlob(rx, ry, { seed, wob: .06 }), { fill: MC.complex, stroke: MC.complexEdge, 'stroke-width': 3.5 });
    mk('ellipse', { cx: -rx * .35, cy: -ry * .45, rx: rx * .25, ry: ry * .12, fill: '#fff', 'fill-opacity': .25 }, cg);
    jText(cg, nm, { y: 12, size: 34, fill: '#fff', weight: 800 });
    return Object.assign(cg, { halo });
  };
  const K = { I: blob('I', C.I, 62, 104, 2), II: blob('II', C.II, 42, 50, 5), III: blob('III', C.III, 58, 92, 3), IV: blob('IV', C.IV, 56, 90, 7) };
  const qG = G(g, { s: .999 }); const qHalo = mk('circle', { r: 26, fill: 'none', stroke: MC.redu, 'stroke-width': 6 }, qG); put(qHalo, { o: 0 });
  mk('circle', { r: 18, fill: MC.q, stroke: MC.qEdge, 'stroke-width': 3 }, qG); jText(qG, 'Q', { y: 8, size: 22, fill: '#3a1d08', weight: 800 });
  const cG = G(g, { s: .999 }); const cHalo = mk('circle', { r: 30, fill: 'none', stroke: MC.redu, 'stroke-width': 6 }, cG); put(cHalo, { o: 0 });
  mk('circle', { r: 22, fill: MC.cytc, stroke: MC.complexEdge, 'stroke-width': 3 }, cG); jText(cG, 'Cyt c', { y: -32, size: 20, fill: COL.chalk, weight: 700 });
  // iron dots on the cytochromes (III, IV, cyt c)
  const ironG = G(g, { o: 0 }), ironDots = [[C.III[0] - 16, 30], [C.III[0] + 18, -24], [C.IV[0] - 14, -20], [C.IV[0] + 16, 28]];
  path(ironG, ironDots.map(q => 'M' + cP(q) + 'h.01').join(''), { stroke: MC.iron, 'stroke-width': 14 });
  const cIron = mk('circle', { r: 7, fill: MC.iron }, cG); put(cIron, { o: 0 });
  // shuttles docking
  const nadhW = G(g, { o: 0 }), fadhW = G(g, { o: 0 });
  const nadh = nadShuttle(nadhW, { kind: 'NAD', size: 22 }).set(1), fadh = nadShuttle(fadhW, { kind: 'FAD', size: 22 }).set(1);
  const dockE = electron(g, { n: 2, r: 8, o: 0 });
  // final acceptor
  const finG = G(g);
  let o2m = null, h2o = null, ph = [], finLab;
  if (final === 'O2') {
    o2m = o2Molecule(finG, { x: O2[0] - 40, y: O2[1], r: 15 });
    ph = [0, 1].map(() => proton(finG, { r: 13 }));
    h2o = waterMolecule(finG, { x: O2[0] - 30, y: O2[1] + 6, s: .6, o: 0, face: false });
    finLab = jText(finG, '½ O_2', { x: O2[0] - 40, y: O2[1] + 44, size: 22, fill: MC.oxy });
  } else {
    jChip(finG, final, { x: O2[0] - 40, y: O2[1], size: 24, fill: MC.oxy, edge: MC.oxy });
  }
  const eqG = G(g, { o: 0 });
  jText(eqG, '2 H^+ + ½ O_2 + 2 e^− → H_2O', { x: O2[0] - 40, y: bottom + 34, size: 24, fill: COL.chalk });
  // electron paths (local); the pair moves along them
  const pathN = jLine([[C.I[0], 150], [C.I[0], 18], [C.Qh[0] - 2, 4], [C.III[0], 0], [C.cHome[0], C.cHome[1]], [C.cEnd[0], C.cEnd[1]], [C.IV[0], 0], [O2[0] - 40, O2[1] - 26]]);
  const pathF = jLine([[C.II[0], 150], [C.II[0], 38], [C.Qh[0] - 2, 4], [C.III[0], 0], [C.cHome[0], C.cHome[1]], [C.cEnd[0], C.cEnd[1]], [C.IV[0], 0], [O2[0] - 40, O2[1] - 26]]);
  const uAt = (ln, pt) => { let best = 0, bd = 1e9; for (let i = 0; i <= 400; i++) { const q = ln.at(i / 400), d = Math.hypot(q[0] - pt[0], q[1] - pt[1]); if (d < bd) { bd = d; best = i / 400; } } return best; };
  const ST = ln => ({ I: uAt(ln, [C.I[0], 18]), II: uAt(ln, [C.II[0], 38]), Q: uAt(ln, [C.Qh[0] - 2, 4]), III: uAt(ln, [C.III[0], 0]), c0: uAt(ln, C.cHome), c1: uAt(ln, C.cEnd), IV: uAt(ln, [C.IV[0], 0]) });
  const stN = ST(pathN), stF = ST(pathF);
  const pair = electron(g, { n: 2, r: 9, trail: 26, o: 0 });
  const flowPairs = [0, 1, 2].map(() => electron(g, { n: 2, r: 8, o: 0 }));
  // pumped protons at I, III and IV
  const pumpH = ['I', 'III', 'IV'].flatMap(nm => [0, 1].map(j => ({ nm, j, h: proton(g, { r: 13, o: 0 }) })));
  const cloudT = protonCloud(g, { y: -(top + hm) / 2 + 14, w: w - 60, h: top - hm - 70, n: 34, seed: 5 }), cloudB = protonCloud(g, { y: (bottom + hm) / 2, w: w - 60, h: bottom - hm - 80, n: 6, seed: 9 });
  let syn = null;
  if (synthase) syn = atpSynthase(g, { x: X1 - 140, mem, membrane: false, s: .9 });
  const parts = jParts([['membrane', [memG, bgG]], ['I', K.I], ['II', K.II], ['Q', qG], ['III', K.III], ['cytc', cG], ['IV', K.IV], ['final', finG], ...(syn ? [['synthase', syn]] : []),
    ['nadh', nadhW, false], ['fadh2', fadhW, false]], { complexes: ['I', 'II', 'III', 'IV'], carriers: ['Q', 'cytc'], chain: ['I', 'II', 'Q', 'III', 'cytc', 'IV'], o2: ['final'] });
  let EU = -1, ESRC = 'NADH', FL = true, DK = { NADH: 0, FADH2: 0 }, WK = 0, PT = 0, PA = 0, GK = 0, GT = 0, FT = 0, FAm = 0, IR = 0, LB = 0, EQ = 0;
  const ec = Object.assign(g, {
    complexes: K, q: qG, cytc: cG, nadh, fadh, pair, synthase: syn, cloudTop: cloudT, cloudBottom: cloudB,
    apply() {
      parts.apply(nm => nm === 'nadh' || nm === 'fadh2' ? 1 : 1);
      mO(regionL, LB); mO(ironG, IR); mO(cIron, IR); mO(eqG, EQ);
      // one electron pair along its path, carriers flashing blue (reduced) as it sits on them, orange (oxidized) after
      const ln = ESRC === 'FADH2' ? pathF : pathN, stt = ESRC === 'FADH2' ? stF : stN, u = EU;
      if (u >= 0 && u <= 1) { const q = ln.at(u), d = ln.dir(u); pair.pose(q[0], q[1], Math.atan2(d[1], d[0]) * 180 / Math.PI); mO(pair, Math.min(1, u * 30, (1 - u) * 30 + (u >= 1 ? 1 : 0))); }
      else { pair.pose(C.I[0], 150); mO(pair, 0); }
      const flash = (el, a, b, on_ = true) => {   // the pair holds it from a to b
        if (!FL || u < 0 || !on_) { cAttr(el, 'stroke', MC.redu); mO(el, 0); return; }
        const on = u >= a - .015 && u <= b + .015 ? 1 : 0, after = u > b + .015 ? 1 - mRamp(u, b + .015, b + .12) : 0;
        cAttr(el, 'stroke', on ? MC.redu : MC.oxid); mO(el, on || after);
      };
      flash(K.I.halo, stt.I, stt.I + .02, ESRC !== 'FADH2'); flash(K.II.halo, stt.II, stt.II + .02, ESRC === 'FADH2'); flash(K.III.halo, stt.III, stt.III + .02); flash(K.IV.halo, stt.IV, stt.IV + .02);
      flash(qHalo, stt.Q, stt.III); flash(cHalo, stt.c0, stt.c1);
      // Q rides with the pair from its home to III, then drifts back; cyt c likewise from III to IV
      let qx = C.Qh[0], qy = 0;
      if (u >= stt.Q && u <= stt.III) { const q = ln.at(u); qx = q[0] - 4; qy = q[1] + 4; }
      else if (u > stt.III) { const k = jR(u, stt.III, stt.III + .1); qx = jL(C.III[0] - 4, C.Qh[0], k); qy = jL(4, 0, k); }
      jSet(qG, { x: qx - 24, y: qy + 22 });
      let cx_ = C.cHome[0];
      if (u >= stt.c0 && u <= stt.c1) cx_ = ln.at(u)[0];
      else if (u > stt.c1) cx_ = jL(C.cEnd[0], C.cHome[0], jR(u, stt.c1, stt.c1 + .12));
      jSet(cG, { x: cx_, y: C.cHome[1] - 2 });
      // docking shuttles: arrive (0–.35), hand the pair in (.35–.6), leave as NAD⁺ / FAD (.6–1)
      [['NADH', nadhW, nadh, C.I], ['FADH2', fadhW, fadh, C.II]].forEach(([src, wr, sh, at]) => {
        const k = DK[src], dock = [at[0] - 6, 196], away = [at[0] - 150, 240];
        const pos = k < .35 ? jL2(away, dock, jR(k, 0, .35)) : jL2(dock, away, jR(k, .6, 1));
        jSet(wr, { x: pos[0], y: pos[1], o: (k > 0 ? Math.min(1, k * 12) : 0) * parts.f(src === 'NADH' ? 'nadh' : 'fadh2') });
        sh.set(1 - jR(k, .38, .6));
      });
      const dk = DK.NADH > 0 && DK.NADH < 1 ? 'NADH' : DK.FADH2 > 0 && DK.FADH2 < 1 ? 'FADH2' : null;
      if (dk) { const k = DK[dk], at = dk === 'NADH' ? C.I : C.II, a = [at[0] - 6, 190], b = [at[0], at[1] + 10], q = jL2(a, b, jR(k, .38, .6)); dockE.pose(q[0], q[1]); mO(dockE, mRamp(k, .36, .4) * (1 - mRamp(k, .58, .62))); }
      else { dockE.pose(C.I[0], 190); mO(dockE, 0); }
      // water at the final acceptor: two H⁺ come in (0–.45), the pair's electrons arrive (the page's pair, or this), water forms (.55–.75)
      if (final === 'O2') {
        const k = WK;
        ph.forEach((hp, i) => { const sx = i ? 1 : -1, a = [O2[0] - 40 + sx * 120, O2[1] + 70], b = [O2[0] - 40 + sx * 30, O2[1] + 8], q = jL2(a, b, jR(k, 0, .45)); hp.pose(q[0], q[1]); mO(hp, (k > 0 ? Math.min(1, k * 10) : 0) * (1 - jR(k, .55, .65))); });
        mO(o2m, 1 - jR(k, .55, .65)); mO(h2o, jR(k, .65, .75)); h2o.pose(O2[0] - 40, O2[1] + 4, 0);
        jChem(finLab, k < .6 ? '½ O_2' : 'H_2O'); mO(finLab, k < .6 ? 1 - mRamp(k, .5, .6) : mRamp(k, .6, .7));
        // ½ O₂ under the molecule; H₂O beside the water (left of it), swapped while the label is invisible
        jSet(finLab, k < .6 ? { x: O2[0] - 40, y: O2[1] + 44 } : { x: O2[0] - 85, y: O2[1] + 12 }); cAttr(finLab, 'text-anchor', k < .6 ? 'middle' : 'end');
      }
      // proton pumping
      pumpH.forEach(({ nm, j, h }) => {
        const uu = cFrac(PT * .45 + j / 2 + ['I', 'III', 'IV'].indexOf(nm) * .23), bx = C[nm][0] + (j ? 18 : -18);
        h.pose(bx, jL(bottom - 50, -top + 50, uu)); mO(h, PA * Math.min(1, uu * 8, (1 - uu) * 8) * parts.f(nm));
      });
      cloudT.set(GK, GT); cloudB.set(GK, GT); mO(cloudT, GK > 0 ? 1 : 0); mO(cloudB, GK > 0 ? 1 : 0);
      flowPairs.forEach((fp, j) => { const uu = cFrac(FT * .18 + j / 3), q = pathN.at(uu); fp.pose(q[0], q[1]); mO(fp, FAm * Math.min(1, uu * 12, (1 - uu) * 12)); });
      return ec;
    },
    build(k) { parts.setBuild(k); return ec.apply(); },
    // names: membrane I II Q III cytc IV final (synthase) nadh fadh2, or complexes carriers chain o2 all
    focus(names, k = 1) { parts.setFocus(names || [], k); return ec.apply(); },
    // one electron pair at u (0..1) along its path from NADH (into I) or FADH2 (into II) to the final acceptor; u < 0 hides
    // it. Carriers flash blue while it sits on them, orange as it leaves (flash false: no flashes). Q and cyt c ride with it.
    electron(u, src = 'NADH', flash = true) { EU = u == null || u < 0 ? -1 : jK(u); ESRC = src; FL = flash; return ec.apply(); },
    dock(src, k) { DK[src === 'FADH2' ? 'FADH2' : 'NADH'] = jK(k); return ec.apply(); },
    water(k) { WK = jK(k); return ec.apply(); },
    pump(t, amt = 1) { PT = jT(t); PA = jK(amt); return ec.apply(); },        // H⁺ rise through I, III and IV
    gradient(k, t = 0) { GK = jK(k); GT = jT(t); return ec.apply(); },        // many H⁺ above, few below
    flow(t, amt = 1) { FT = jT(t); FAm = jK(amt); return ec.apply(); },       // three pairs stream NADH → acceptor
    iron(k) { IR = jK(k); return ec.apply(); },
    labels(k) { LB = jK(k); return ec.apply(); },
    eqn(k) { EQ = jK(k); return ec.apply(); },
    stations(src = 'NADH') { return src === 'FADH2' ? stF : stN; },           // u of each stop: I II Q III c0 c1 IV
    pt(name) {
      const P = { I: C.I, II: C.II, III: C.III, IV: C.IV, Q: [qG._st.x, qG._st.y], cytc: [cG._st.x, cG._st.y], final: O2, o2: [O2[0] - 40, O2[1]], ims: [0, -(top + hm) / 2],
        matrix: [0, (bottom + hm) / 2], membrane: [0, 0], dockI: [C.I[0], 196], dockII: [C.II[0], 196], synthase: [X1 - 140, 0] }[name] || [0, 0];
      return cOut(g, P);
    },
  });
  return ec.apply();
}

/* ---------- energyStair: the free-energy staircase (slide 35) ---------- */
function energyStair(p, { x = 0, y = 0, s = 1, o = 1, w = 1000, h = 560, size = 22, axis = true } = {}) {
  const g = G(p, { x, y, s, o }), X = f => 80 + f * (w - 80), Y = gv => -gv / 50 * h;
  if (axis) {
    mArrow(g, [0, 10], [0, -h - 40], { color: COL.chalk, w: 4, head: 16 });
    for (let v = 0; v <= 50; v += 10) { path(g, `M-10 ${cF(Y(v))}H0`, { stroke: COL.chalk, 'stroke-width': 3 }); jText(g, String(v), { x: -16, y: Y(v) + 8, size: 20, fill: COL.chalk, anchor: 'end', weight: 600 }); }
    const yl = G(g, { x: -62, y: -h / 2, r: -90 }); jText(yl, 'free energy relative to O_2 (kcal/mol)', { size: 22, fill: COL.chalk, weight: 600 });
  }
  const S = [
    { nm: 'NADH', g: 50, f: .02, kind: 'nad' }, { nm: 'I', g: 45, f: .16, sub: 'FMN, Fe·S' }, { nm: 'FADH_2', g: 43, f: .27, kind: 'fad' },
    { nm: 'II', g: 40, f: .36, sub: 'Fe·S' }, { nm: 'Q', g: 36, f: .46, kind: 'q' }, { nm: 'III', g: 30, f: .58, sub: 'Cyt b, Fe·S, Cyt c_1', subX: 30 },
    { nm: 'Cyt c', g: 23, f: .7, kind: 'c' }, { nm: 'IV', g: 12, f: .82, sub: 'Cyt a, Cyt a_3', subX: 26 }, { nm: 'O_2', g: 0, f: .96, kind: 'o2' },
  ];
  const stairN = ['NADH', 'I', 'Q', 'III', 'Cyt c', 'IV', 'O_2'], stairF = ['FADH_2', 'II', 'Q', 'III', 'Cyt c', 'IV', 'O_2'];
  const at = nm => S.find(q => q.nm === nm), P = nm => { const q = at(nm); return [X(q.f), Y(q.g)]; };
  const lineN = jLine(stairN.map(P)), lineF = jLine(stairF.map(P));
  const guide = path(g, lineN.d, { stroke: COL.dim, 'stroke-width': 3, 'stroke-dasharray': '8 8' }, { o: 1 });
  const guideF = path(g, lineF.d, { stroke: MC.fad, 'stroke-width': 3, 'stroke-dasharray': '8 8' }, { o: 1 });
  const steps = S.map(q => {
    const sg = G(g, { x: X(q.f), y: Y(q.g), s: .999 });
    const halo = mk('ellipse', { rx: 54, ry: 30, fill: 'none', stroke: MC.redu, 'stroke-width': 5 }, sg); put(halo, { o: 0 });
    if (q.kind === 'nad' || q.kind === 'fad') { const c = q.kind === 'nad' ? MC.nad : MC.fad; path(sg, jRect(96, 38, 19), { fill: c, stroke: mix(c, '#000000', .35), 'stroke-width': 3 }); jText(sg, q.nm, { y: 8, size: 22, fill: '#2a1606' }); }
    else if (q.kind === 'q') { mk('circle', { r: 20, fill: MC.q, stroke: MC.qEdge, 'stroke-width': 3 }, sg); jText(sg, 'Q', { y: 8, size: 22, fill: '#3a1d08' }); }
    else if (q.kind === 'c') { mk('circle', { r: 20, fill: MC.cytc, stroke: MC.complexEdge, 'stroke-width': 3 }, sg); jText(sg, 'Cyt c', { x: 30, y: 8, size: 20, fill: COL.chalk, anchor: 'start' }); }
    else if (q.kind === 'o2') { o2Molecule(sg, { r: 17 }); jText(sg, '½ O_2', { y: 46, size: 22, fill: MC.oxy }); }
    else { path(sg, jRect(80, 44, 14), { fill: MC.complex, stroke: MC.complexEdge, 'stroke-width': 3 }); jText(sg, q.nm, { y: 10, size: 26, fill: '#fff', weight: 800 }); if (q.sub) jText(sg, q.sub, q.subX != null ? { x: q.subX, y: 44, size: 17, fill: COL.dim, weight: 600, anchor: 'end' } : { y: 44, size: 17, fill: COL.dim, weight: 600 }); }
    return Object.assign(sg, { halo, q });
  });
  // the orange wiggle (energy released) at each drop of the NADH path, and at II for FADH₂'s first drop
  const wig = (a, b) => {   // a short wavy orange line leaving the drop's middle, down and to the left
    const m = jL2(a, b, .5), L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    let d = ''; for (let i = 0; i <= 16; i++) { const f = i / 16, r = 14 + f * 50, wv = 7 * Math.sin(f * 4 * Math.PI); d += (i ? 'L' : 'M') + cF(m[0] + nx * r - ny * wv) + ' ' + cF(m[1] + ny * r + nx * wv); }
    return path(g, d, { stroke: MC.oxid, 'stroke-width': 4 }, { o: 0 });
  };
  const wigN = stairN.slice(1).map((nm, i) => wig(P(stairN[i]), P(nm))), wigF = [wig(P('FADH_2'), P('II')), wig(P('II'), P('Q'))];
  const pair = electron(g, { n: 2, r: 9, trail: 24, o: 0 });
  const waterG = G(g, { o: 0 }); waterMolecule(waterG, { x: X(.96) + 80, y: Y(0) - 4, s: .55, face: false }); jText(waterG, 'H_2O', { x: X(.96) + 80, y: Y(0) + 46, size: 22, fill: COL.chalk });
  jText(waterG, '2 H^+ + ½ O_2 + 2 e^−', { x: X(.96) - 10, y: Y(0) + 84, size: 20, fill: COL.dim, weight: 600 });
  const order = S.map(q => q.nm);
  const parts = jParts([...steps.map(sg => [sg.q.nm, sg]), ['guide', guide], ['guideF', guideF]], { carriers: order, nadPath: [...stairN, 'guide'], fadPath: [...stairF, 'guideF'] });
  let PU = -1, PS = 'NADH', WK = 0, WG = null;
  const es = Object.assign(g, {
    steps, pair, X, Y,
    apply() {
      parts.apply();
      const ln = PS === 'FADH2' ? lineF : lineN, names = PS === 'FADH2' ? stairF : stairN, u = PU;
      const n = names.length - 1;
      if (u >= 0) {
        // the pair rests on each carrier and then drops to the next (staircase timing)
        const seg = Math.min(n - 1, Math.floor(u * n)), f = u * n - seg, mv = jR(f, .45, 1);
        const q = jL2(P(names[seg]), P(names[seg + 1]), mv), d = [P(names[seg + 1])[0] - P(names[seg])[0], P(names[seg + 1])[1] - P(names[seg])[1]];
        pair.pose(q[0], q[1] - 28, mv > 0 && mv < 1 ? Math.atan2(d[1], d[0]) * 180 / Math.PI : null); mO(pair, 1);
      } else { pair.pose(P(names[0])[0], P(names[0])[1] - 28); mO(pair, 0); }
      const passed = i => u < 0 ? 0 : mRamp(u * n - i, .8, 1);
      const wl = PS === 'FADH2' ? [...wigF, ...wigN.slice(2)] : wigN;
      [...wigN, ...wigF].forEach(wg => { const i = wl.indexOf(wg); mO(wg, WG != null ? WG : i < 0 ? 0 : passed(i)); });
      steps.forEach(sg => { const i = names.indexOf(sg.q.nm), here = u >= 0 && i >= 0 && Math.abs(u * n - i) < .5 ? 1 : 0; mO(sg.halo, here); });
      mO(waterG, WK);
      return es;
    },
    build(k) { parts.setBuild(k); return es.apply(); },
    // names: NADH I FADH_2 II Q III 'Cyt c' IV O_2 guide guideF, or carriers nadPath fadPath all
    focus(names, k = 1) { parts.setFocus(names || [], k); return es.apply(); },
    // the electron pair at u (0..1) down the NADH or FADH2 staircase (u < 0 hides it); wiggles show at each drop it has passed
    pair(u, src = 'NADH') { PU = u == null || u < 0 ? -1 : jK(u); PS = src; return es.apply(); },
    wiggles(k) { WG = k == null ? null : jK(k); return es.apply(); },          // all wiggles at k (null: follow the pair)
    water(k) { WK = jK(k); return es.apply(); },
    pt(name) { const q = at(name); return cOut(g, q ? P(name) : [0, 0]); },
    level(gv) { return cOut(g, [0, Y(gv)]); },
  });
  return es.apply();
}

/* ---------- redoxDrop: slide 17's two panels ---------- */
function redoxDrop(p, { kind = 'explode', x = 0, y = 0, s = 1, o = 1, w = 560, h = 560, axis = true, size = 26 } = {}) {
  const g = G(p, { x, y, s, o }), ex = kind === 'explode';
  if (axis) { mArrow(g, [0, 0], [0, -h - 10], { color: COL.chalk, w: 4, head: 16 }); const yl = G(g, { x: -24, y: -h / 2, r: -90 }); jText(yl, 'free energy, G', { size: size * .85, fill: COL.chalk, weight: 600 }); }
  const topY = -h * .86, botY = -h * .08, cx = w * .5;
  const topG = G(g, { o: 0 }); const tb = jChip(topG, ex ? 'H_2 + ½ O_2' : '2 H + ½ O_2', { x: ex ? cx : cx * .7, y: topY, size, fill: COL.chalk, edge: COL.chalk });
  const botG = G(g, { o: 0 }); jChip(botG, 'H_2O', { x: cx, y: botY, size, fill: COL.chalk, edge: COL.chalk }); waterMolecule(botG, { x: cx + 110, y: botY - 4, s: .5, face: false });
  const L = { top: topG, bottom: botG };
  let boom = null, drop = null, ball = null, chain = [], pair = null, stairL = null, sparks = [], wigs = [], splitG = null, accG = null, lab = null;
  if (ex) {
    drop = jArrow(g, { color: MC.oxid, w: 8, head: 24 });
    ball = G(g, { o: 0 }); jChip(ball, 'H_2 + ½ O_2', { size: size * .8, fill: COL.chalk, edge: COL.dim });
    boom = explosion(g, { x: cx, y: -h * .46, r: 120 });
    lab = G(g, { o: 0 });
    jText(lab, 'explosive release of', { x: cx + 30, y: -h * .2, size: size * .8, fill: MC.boom, anchor: 'start' });
    jText(lab, 'heat and light energy', { x: cx + 30, y: -h * .2 + size, size: size * .8, fill: MC.boom, anchor: 'start' });
  } else {
    splitG = G(g, { o: 0 }); jChip(splitG, '2 H^+ + 2 e^−', { x: cx * .45, y: -h * .7, size: size * .85, fill: MC.elec, edge: MC.elec });
    path(splitG, `M${cF(cx * .62)} ${cF(topY + 22)}L${cF(cx * .5)} ${cF(-h * .7 - 20)}`, { stroke: COL.chalk, 'stroke-width': 3 });
    const pts = [[cx * .62, -h * .62], [cx * .9, -h * .52], [cx * 1.18, -h * .42], [cx * 1.46, -h * .32]];
    chain = pts.map(([px, py]) => { const cg = G(g, { x: px, y: py, s: .999, o: 0 }); path(cg, jRect(64, 34, 12), { fill: MC.complex, stroke: MC.complexEdge, 'stroke-width': 3 }); return cg; });
    stairL = jLine([[cx * .45, -h * .7 + 22], ...pts.map(q => [q[0], q[1] - 20]), [cx * 1.46 + 40, -h * .2], [cx * 1.3, botY - 46]]);
    pair = electron(g, { n: 2, r: 8, trail: 20, o: 0 });
    sparks = [1, 2, 3].map(i => atpBurst(g, { x: pts[i][0] - 46, y: pts[i][1] + 40, r: 18, label: '' }).set(0));
    wigs = [0, 1, 2].map(i => { let d = ''; for (let j = 0; j <= 12; j++) { const f = j / 12; d += (j ? 'L' : 'M') + cF(pts[i][0] + 36 + f * 40 + 6 * Math.sin(f * 4 * Math.PI)) + ' ' + cF(pts[i][1] + 8 + f * 36); } return path(g, d, { stroke: MC.oxid, 'stroke-width': 4 }, { o: 0 }); });
    jText(g, 'electron transport chain', { x: pts[0][0] + 44, y: pts[0][1] - 30, size: size * .72, fill: MC.complex, anchor: 'start' });
    accG = G(g, { o: 0 }); o2Molecule(accG, { x: cx * 1.3 - 70, y: botY - 52, r: 13 }); jText(accG, '½ O_2', { x: cx * 1.3 - 70, y: botY - 80, size: 20, fill: MC.oxy });
    lab = jText(g, 'controlled release of energy', { x: cx * 1.5, y: -h * .97, size: size * .8, fill: MC.oxid, o: 0 });
  }
  const rd = Object.assign(g, {
    parts: L, boom, chain, sparks,
    // explode: the top box (0–.15), it falls (.2–.5) with the burst (.45–1) and the water (.5–.65);
    // stairs: top (0–.12), split into H⁺ and e⁻ (.12–.25), the chain (.25–.4), the pair steps down (.4–.85) with ATP
    // sparks and heat wiggles at three steps, O₂ takes it and water shows (.85–1)
    set(k) {
      k = jK(k);
      mO(topG, jR(k, 0, .12));
      if (ex) {
        const f = jR(k, .2, .5);
        drop.set(cx, topY + 30, cx, jL(topY + 31, botY - 30, f)); mO(drop, k > .2 ? 1 : 0);
        jSet(ball, { x: cx, y: jL(topY, botY - 10, io(f)), o: k > .2 && k < .52 ? 1 : 0 });
        boom.set(mRamp(k, .45, 1) * .55, true); mO(botG, jR(k, .5, .65)); mO(lab, jR(k, .55, .75));
      } else {
        mO(splitG, jR(k, .12, .25)); chain.forEach((c, i) => mO(c, jR(k, .25 + i * .03, .32 + i * .03)));
        const u = jR(k, .4, .85); const q = stairL.at(u), d = stairL.dir(u);
        pair.pose(q[0], q[1], Math.atan2(d[1], d[0]) * 180 / Math.PI); mO(pair, k > .4 && k < .9 ? 1 : 0);
        sparks.forEach((sp, i) => sp.set(jR(k, .5 + i * .1, .58 + i * .1))); wigs.forEach((wg, i) => mO(wg, jR(k, .5 + i * .1, .56 + i * .1)));
        mO(accG, jR(k, .4, .55) * (1 - jR(k, .88, .95))); mO(botG, jR(k, .88, 1)); mO(lab, jR(k, .4, .6));
      }
      return rd;
    },
  });
  return rd.set(1);
}

/* ---------- ATP ledger and ATP bar ---------- */
// small icons for ledgers: kind 'ATP' 'NADH' 'NAD' 'FADH2' 'FAD' 'CO2' 'O2' 'H2O' 'pyruvate' 'glucose' 'acetyl'; origin = centre
function respIcon(p, kind, { x = 0, y = 0, s = 1, o = 1 } = {}) {
  const g = G(p, { x, y, s, o });
  if (kind === 'ATP') atpBurst(g, { r: 17, label: 'ATP', size: 10 });
  else if (kind === 'NADH' || kind === 'NAD') nadShuttle(g, { s: .42, label: false }).set(kind === 'NADH' ? 1 : 0);
  else if (kind === 'FADH2' || kind === 'FAD') nadShuttle(g, { s: .45, kind: 'FAD', label: false }).set(kind === 'FADH2' ? 1 : 0);
  else if (kind === 'CO2') co2Molecule(g, { r: 11 });
  else if (kind === 'O2') o2Molecule(g, { r: 12 });
  else if (kind === 'H2O') waterMolecule(g, { s: .36, face: false });
  else if (kind === 'pyruvate') carbonChain(g, { n: 3, r: 7, sp: 17 });
  else if (kind === 'acetyl') carbonChain(g, { n: 2, r: 7, sp: 17, color: MC.pyrOx });
  else if (kind === 'glucose') glucoseRing(g, { R: 20, r: 6 });
  return g;
}
const J_ICON_W = { ATP: 44, NADH: 60, NAD: 60, FADH2: 50, FAD: 50, CO2: 46, O2: 36, H2O: 44, pyruvate: 66, acetyl: 50, glucose: 54 };
// atpLedger: rows of label, icons and a value; origin = the box's top left. rows: [{label, kind, n, value, color}]
function atpLedger(p, { x = 0, y = 0, s = 1, o = 1, w = 640, rows = [], size = 26, rowH = 62, labelW = 220, box = true } = {}) {
  const g = G(p, { x, y, s, o }), h = rows.length * rowH + 24;
  if (box) path(g, jRect(w, h, 16, w / 2, h / 2), { fill: '#0b1626', 'fill-opacity': .85, stroke: COL.dim, 'stroke-width': 2.5 });
  const R = rows.map((r, i) => {
    const yy = 12 + rowH * (i + .5), rg = G(g, { o: 0 });
    const hi = path(rg, jRect(w - 16, rowH - 8, 10, w / 2, yy), { fill: MC.elec, 'fill-opacity': .18, stroke: MC.elec, 'stroke-width': 2 }, { o: 0 });
    const lab = jText(rg, r.label || '', { x: 22, y: yy + size * .36, size, fill: r.color || COL.chalk, anchor: 'start' });
    const iw = J_ICON_W[r.kind] || 44, icons = [];
    for (let j = 0; j < (r.n || 0); j++) icons.push(respIcon(rg, r.kind, { x: labelW + iw / 2 + j * iw, y: yy, o: 0 }));
    const val = jText(rg, r.value ?? '', { x: w - 22, y: yy + size * .36, size: size * 1.05, fill: r.color || COL.chalk, anchor: 'end', weight: 800 });
    const strike = path(rg, `M${labelW - 8} ${yy}H${labelW + (r.n || 0) * iw + 8}`, { stroke: MC.inhib, 'stroke-width': 5 }, { d: 0 });
    return { rg, hi, lab, icons, val, strike, yy };
  });
  const RK = rows.map(() => 0), SK = rows.map(() => 0), HK = rows.map(() => 0);
  const lg = Object.assign(g, {
    rows: R, w, h,
    apply() {
      R.forEach((r, i) => {
        mO(r.rg, mRamp(RK[i], 0, .2));
        const n = r.icons.length; r.icons.forEach((ic, j) => jSet(ic, { o: mRamp(RK[i] * (n + 2) - 1 - j, 0, 1), s: .999 }));
        mO(r.val, mRamp(RK[i], .85, 1)); cSet(r.strike, { d: SK[i] }); mO(r.hi, HK[i]);
      });
      return lg;
    },
    row(i, k) { RK[i] = jK(k); return lg.apply(); },        // row i: label, then its icons one by one, then the value
    set(k) { k = jK(k); const n = R.length; R.forEach((_, i) => { RK[i] = jK(k * n - i); }); return lg.apply(); },
    strike(i, k) { SK[i] = jK(k); return lg.apply(); },     // a red line through row i's icons ("used")
    hi(i, k) { HK[i] = jK(k); return lg.apply(); },         // a gold highlight behind row i
    value(i, str) { jChem(R[i].val, String(str)); return lg; },
    pt(i) { return cOut(g, [w - 60, R[i].yy]); },
  });
  return lg.apply();
}
// atpBar: a bar of ATP counts in segments; origin = its left end, vertically centred. segs: [{n, color, label}]
function atpBar(p, { x = 0, y = 0, s = 1, o = 1, w = 1000, h = 46, max = 32, segs = [], size = 22, ticks = true } = {}) {
  const g = G(p, { x, y, s, o });
  path(g, jRect(w, h, 10, w / 2, 0), { fill: '#0b1626', stroke: COL.dim, 'stroke-width': 2.5 });
  const tk = G(g, { o: ticks ? 1 : 0 }); let td = ''; for (let i = 1; i < max; i++) td += `M${cF(i * w / max)} ${h / 2 - 8}V${h / 2}`; path(tk, td, { stroke: COL.faint, 'stroke-width': 2 });
  const S = segs.map(sg => { const sgG = G(g); const r = path(sgG, '', { fill: sg.color || MC.elec, stroke: mix(sg.color || MC.elec, '#000000', .35), 'stroke-width': 2 }); const t = jText(sgG, sg.label || '', { y: size * .36, size, fill: '#14233a', weight: 800 }); return { sgG, r, t }; });
  const tot = jText(g, '', { x: w + 18, y: size * .4, size: size * 1.2, fill: MC.elec, anchor: 'start', weight: 800, o: 0 });
  let K = 1, V = segs.map(sg => sg.n || 0), TS = '', TK = 0;
  const b = Object.assign(g, {
    apply() {
      let acc = 0; const n = S.length;
      S.forEach((sg, i) => {
        const k = mRamp(K * n - i, 0, 1), ww = V[i] * w / max * jSS(k), x0 = acc;
        mD(sg.r, ww > 1 ? jRect(ww, h - 8, 6, x0 + ww / 2, 0) : 'M0 0');
        // a label that shows the segment's count follows .values() (instant, like total)
        const lb = segs[i].label || '', n0 = String(segs[i].n || 0), str = lb && lb.includes(n0) ? lb.replace(n0, String(V[i])) : lb;
        jChem(sg.t, str);
        jSet(sg.t, { x: x0 + ww / 2, y: size * .36, o: ww > uiW(sg.t.textContent || '', size) + 12 ? mRamp(k, .7, 1) : 0 });
        acc += ww;
      });
      jChem(tot, TS); mO(tot, TK);
      return b;
    },
    set(k) { K = jK(k); return b.apply(); },                  // segments grow in turn
    values(arr) { V = arr.map(v => +v || 0); return b.apply(); },   // each segment's count (e.g. [2, 2, 26] → [2, 2, 28])
    total(str, k = 1) { TS = str; TK = jK(k); return b.apply(); },  // a label past the right end
    X(n) { return cOut(g, [n * w / max, 0]); },
  });
  return b.apply();
}

/* ---------- fermentation (slide 46) ---------- */
function fermentation(p, { kind = 'alcohol', x = 800, y = 450, s = 1, o = 1, size = 24 } = {}) {
  const g = G(p, { x, y, s, o }), alc = kind === 'alcohol', Y0 = -40;
  const glc = glucoseRing(g, { x: -540, y: Y0, R: 40, r: 10, label: 'glucose', size });
  const glyA = G(g); mArrow(glyA, [-470, Y0], [-300, Y0], { color: MC.gly, w: 8, head: 22 }); jText(glyA, 'glycolysis', { x: -385, y: Y0 + 40, size: 22, fill: MC.gly });
  const atpG = G(g, { o: 0 }); jChip(atpG, '2 ADP + 2 P_i', { x: -385, y: Y0 - 150, size: 20 }); mArrow(atpG, [-385, Y0 - 126], [-385, Y0 - 62], { color: COL.chalk, w: 4, head: 14 });
  const atpB = atpBurst(atpG, { x: -300, y: Y0 - 92, r: 26, label: '2 ATP', size: 12 });
  const pyr = carbonChain(g, { x: -200, y: Y0, n: 3, label: '2 pyruvate', size, color: MC.pyruvate });
  const L = {};
  let co2 = null, acet = null, prod, redX;
  if (alc) {
    L.a2 = G(g); mArrow(L.a2, [-120, Y0], [40, Y0], { color: COL.chalk, w: 6, head: 18 });
    co2 = co2Molecule(g, { x: -40, y: Y0, r: 15, label: true, o: 0 }); jChem(co2.lab, '2 CO_2');
    acet = carbonChain(g, { x: 110, y: Y0, n: 2, color: MC.acetald, label: '2 acetaldehyde', size });
    L.a3 = G(g); mArrow(L.a3, [170, Y0], [300, Y0], { color: COL.chalk, w: 6, head: 18 });
    prod = carbonChain(g, { x: 370, y: Y0, n: 2, color: MC.ethanol, label: '2 ethanol', size });
    redX = 235;
  } else {
    L.a3 = G(g); mArrow(L.a3, [-120, Y0], [60, Y0], { color: COL.chalk, w: 6, head: 18 });
    prod = carbonChain(g, { x: 150, y: Y0, n: 3, color: MC.lactate, label: '2 lactate', size });
    redX = -30;
  }
  // the NAD⁺ loop under the row: NADH runs along the top arc from glycolysis to the reduction, NAD⁺ back along the bottom
  const lx0 = -385, lx1 = redX, cxL = (lx0 + lx1) / 2, rx = (lx1 - lx0) / 2, cyL = 150, ry = 62;
  const loopG = G(g);
  const loopPath = path(loopG, `M${cF(lx0)} ${cyL}A${cF(rx)} ${ry} 0 0 1 ${cF(lx1)} ${cyL}A${cF(rx)} ${ry} 0 0 1 ${cF(lx0)} ${cyL}`, { stroke: MC.nad, 'stroke-width': 6 });
  const headAt = (hx, hy, dir) => path(loopG, `M${cF(hx - dir * 16)} ${cF(hy - 11)}L${cF(hx)} ${cF(hy)}L${cF(hx - dir * 16)} ${cF(hy + 11)}Z`, { fill: MC.nad, stroke: MC.nad, 'stroke-width': 2 });
  headAt(cxL + 30, cyL - ry, 1); headAt(cxL - 30, cyL + ry, -1);
  path(loopG, `M${lx0} ${Y0 + 52}V${cyL - 4}M${lx1} ${Y0 + 22}V${cyL - 4}`, { stroke: MC.nad, 'stroke-width': 3, 'stroke-dasharray': '6 6' });
  const loopHi = path(loopG, `M${cF(lx0)} ${cyL}A${cF(rx)} ${ry} 0 0 1 ${cF(lx1)} ${cyL}A${cF(rx)} ${ry} 0 0 1 ${cF(lx0)} ${cyL}`, { stroke: MC.elec, 'stroke-width': 4, 'stroke-opacity': .8 }, { d: 0 });
  const dots = [0, 1, 2].map(() => electron(loopG, { r: 6, o: 0 }));
  const nadhC = jChip(loopG, '2 NADH', { x: cxL, y: cyL - ry, size: 22, fill: MC.nad, edge: MC.nad });
  const nadC = jChip(loopG, '2 NAD^+', { x: cxL, y: cyL + ry, size: 22, fill: MC.nad, edge: MC.nad });
  const regenLab = jText(loopG, 'NAD^+ regenerated', { x: cxL, y: cyL + ry + 50, size: 22, fill: MC.nad, o: 0 });
  const hop = electron(g, { n: 2, r: 8, trail: 18, o: 0 });
  const redTag = jText(g, alc ? 'reduced' : 'reduced by NADH', { x: alc ? 370 : 150, y: Y0 - 54, size: 22, fill: MC.redu, o: 0 });
  const fe = Object.assign(g, {
    glucose: glc, pyruvate: pyr, product: prod, acetaldehyde: acet, co2, atp: atpB, loop: loopG,
    // alcohol: glycolysis (0–.2) with 2 ATP and 2 NADH (.12–.3), pyruvate (.2–.32), CO₂ leaves (.32–.5) and
    // acetaldehyde shows (.42–.52), electrons hop from NADH onto it (.55–.72), ethanol (.68–.8), the loop lights and
    // NAD⁺ returns (.78–1). lactic: the same without CO₂: the electrons hop onto pyruvate (.42–.62), lactate (.6–.72).
    set(k) {
      k = jK(k);
      mO(glc, 1); mO(glyA, jR(k, 0, .12)); mO(atpG, jR(k, .12, .22)); atpB.set(jR(k, .14, .3));
      mO(pyr, jR(k, .2, .32));
      const tRed = alc ? [.55, .72] : [.42, .62], tProd = alc ? [.68, .8] : [.6, .72];
      if (alc) {
        mO(L.a2, jR(k, .32, .4)); const c = jR(k, .32, .5); co2.pose(-40, jL(Y0, Y0 - 150, c)); mO(co2, mRamp(k, .32, .36));
        mO(acet, jR(k, .42, .52)); mO(L.a3, jR(k, .6, .68));
      } else mO(L.a3, jR(k, .38, .46));
      mO(prod, jR(k, tProd[0], tProd[1]));
      mO(nadhC, jR(k, .15, .3)); mO(nadC, jR(k, .78, .9)); mO(loopPath, jR(k, .15, .3) * .6 + jR(k, .78, .9) * .4);
      cSet(loopHi, { d: jR(k, .8, 1) }); mO(regenLab, jR(k, .85, 1));
      const hk = jR(k, tRed[0], tRed[1]), from = [cxL, cyL - ry], to = [alc ? 110 : -200, Y0], q = jL2(from, to, hk);
      hop.pose(q[0], q[1], hk > 0 && hk < 1 ? Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI : null); mO(hop, k > tRed[0] && k < tRed[1] + .03 ? 1 : 0);
      mO(redTag, jR(k, tRed[1] - .04, tRed[1] + .06));
      return fe;
    },
    flow(t, amt = 1) {      // dots run round the loop
      t = jT(t); amt = jK(amt);
      dots.forEach((d, j) => { const a = (t * .35 + j / 3) * 2 * Math.PI; d.pose(cxL + rx * Math.cos(Math.PI + a), cyL + ry * Math.sin(Math.PI + a)); mO(d, amt); });
      return fe;
    },
    pt(name) { const P = { glucose: [-540, Y0], glycolysis: [-385, Y0], pyruvate: [-200, Y0], co2: [-40, Y0 - 150], acetaldehyde: [110, Y0], product: [alc ? 370 : 150, Y0], loop: [cxL, cyL], nadh: [cxL, cyL - ry], nad: [cxL, cyL + ry], atp: [-300, Y0 - 92] }[name] || [0, 0]; return cOut(g, P); },
  });
  fe.flow(0, 0);
  return fe.set(1);
}

/* ---------- pyruvateFork (slide 50) ---------- */
function pyruvateFork(p, { x = 800, y = 450, s = 1, o = 1, size = 24 } = {}) {
  const g = G(p, { x, y, s, o }), L = {};
  L.cell = G(g); path(L.cell, jRect(1300, 760, 40, 0, -20), { fill: MC.cytosol, 'fill-opacity': .5, stroke: MC.membrane, 'stroke-width': 5 });
  jText(L.cell, 'cytosol', { x: -600, y: -360, size: 22, fill: COL.dim, anchor: 'start', weight: 600 });
  L.glucose = G(g); glucoseRing(L.glucose, { x: 0, y: -320, R: 34, r: 9 }); jText(L.glucose, 'glucose', { x: 70, y: -312, size, fill: MC.glucose, anchor: 'start' });
  mArrow(L.glucose, [0, -268], [0, -178], { color: MC.gly, w: 7, head: 20 }); jText(L.glucose, 'glycolysis', { x: 22, y: -214, size: 22, fill: MC.gly, anchor: 'start' });
  L.pyruvate = jStageBox(g, [['pyruvate', 26]], { x: 0, y: -130, w: 190, h: 70, fill: '#6c9fe0' });
  L.left = G(g);
  mArrow(L.left, [-100, -110], [-330, 40], { color: COL.chalk, w: 6, head: 20 });
  jText(L.left, 'no O_2: fermentation', { x: -240, y: -60, size: 22, fill: COL.chalk, anchor: 'end' });
  jStageBox(L.left, [['ethanol,', 22], ['lactate, or', 22], ['other products', 22]], { x: -400, y: 130, w: 230, h: 130, fill: MC.stim });
  L.mito = G(g); path(G(L.mito, { x: 330, y: 150 }), cStadium(520, 300), { fill: MC.ims, 'fill-opacity': .5, stroke: MC.mito, 'stroke-width': 6 });
  jText(L.mito, 'mitochondrion', { x: 330, y: 335, size: 22, fill: MC.mito });
  L.right = G(g);
  mArrow(L.right, [100, -110], [210, 40], { color: COL.chalk, w: 6, head: 20 });
  jText(L.right, 'O_2 present: aerobic respiration', { x: 190, y: -60, size: 22, fill: COL.chalk, anchor: 'start' });
  jStageBox(L.right, [['acetyl CoA', 22]], { x: 230, y: 110, w: 160, h: 60, fill: MC.pyrOx });
  mArrow(L.right, [312, 110], [380, 130], { color: COL.chalk, w: 5, head: 16 });
  jWheel(L.right, { x: 455, y: 160, R: 70, lines: [['citric', 16], ['acid', 16], ['cycle', 16]], w: 12 });
  const parts = jParts([['cell', L.cell], ['glucose', L.glucose], ['pyruvate', L.pyruvate], ['left', L.left], ['mito', L.mito], ['right', L.right]], { aerobic: ['mito', 'right'], fermentation: ['left'] });
  const pf = Object.assign(g, {
    parts: L,
    build(k) { parts.setBuild(k); parts.apply(); return pf; },
    // names: cell glucose pyruvate left mito right, or fermentation (left) aerobic (mito right) all
    focus(names, k = 1) { parts.setFocus(names || [], k); parts.apply(); return pf; },
    pt(name) { const P = { glucose: [0, -320], pyruvate: [0, -130], left: [-400, 130], right: [330, 150], acetylCoA: [230, 110], cycle: [455, 160], mito: [330, 150] }[name] || [0, 0]; return cOut(g, P); },
  });
  parts.apply();
  return pf;
}

/* ---------- fuels: icons and the funnel (slide 54) ---------- */
function fuelIcon(p, kind = 'carb', { x = 0, y = 0, s = 1, o = 1 } = {}) {
  const g = G(p, { x, y, s, o });
  const hex = (hx, hy, r = 20) => path(g, zNgon(6, r, hx, hy, 0), { fill: MC.glucose, stroke: MC.glucoseEdge, 'stroke-width': 3 });
  const bead = (bx, by, c = MC.amino, e = MC.aminoEdge, r = 14) => mk('circle', { cx: bx, cy: by, r, fill: c, stroke: e, 'stroke-width': 2.5 }, g);
  const tail = (tx, ty, n = 7, step = 14) => { let d = `M${tx} ${ty}`; for (let i = 1; i <= n; i++) d += `L${cF(tx + i * step)} ${cF(ty + (i % 2 ? 6 : -6))}`; return path(g, d, { stroke: MC.fatTail, 'stroke-width': 5 }); };
  if (kind === 'carb') { path(g, 'M-34 0H34', { stroke: MC.glucoseEdge, 'stroke-width': 4 }); hex(-40, 0); hex(0, 0); hex(40, 0); }
  else if (kind === 'sugar') hex(0, 0, 22);
  else if (kind === 'protein') { path(g, 'M-56 6L-28 -6L0 6L28 -6L56 6', { stroke: MC.aminoEdge, 'stroke-width': 4 }); [-56, -28, 0, 28, 56].forEach((bx, i) => bead(bx, i % 2 ? -6 : 6, i % 2 ? '#e8a0c8' : MC.amino)); }
  else if (kind === 'aminoAcid') { bead(0, 0); path(g, jPolyD([[14, -10], [40, -10], [34, 6], [20, 6]], true), { fill: MC.nh3, stroke: MC.nh3Edge, 'stroke-width': 2 }); }
  else if (kind === 'fat') { path(g, jRect(26, 80, 8, -44, 0), { fill: MC.glycerol, stroke: '#4f6f99', 'stroke-width': 3 }); [-26, 0, 26].forEach(ty => tail(-30, ty, 6, 14)); }
  else if (kind === 'glycerol') { path(g, jRect(26, 66, 8, 0, 0), { fill: MC.glycerol, stroke: '#4f6f99', 'stroke-width': 3 }); [-20, 0, 20].forEach(by => mk('circle', { cx: 0, cy: by, r: 7, fill: MC.carbon }, g)); }
  else if (kind === 'fattyAcid') tail(-50, 0, 7, 15);
  return g;
}
function fuelFunnel(p, { x = 800, y = 450, s = 1, o = 1, size = 24 } = {}) {
  const g = G(p, { x, y, s, o }), L = {}, A = {};
  const node = (nm, kind, nx, ny, label, color) => { const ng = G(g); fuelIcon(ng, kind, { x: nx, y: ny }); jText(ng, label, { x: nx, y: ny + (kind === 'fat' ? 64 : 50), size, fill: color }); L[nm] = ng; };
  node('carbs', 'carb', -500, -320, 'Carbohydrates', MC.glucose); node('fats', 'fat', -150, -320, 'Fats', MC.fatTail); node('proteins', 'protein', 370, -320, 'Proteins', MC.amino);
  node('sugars', 'sugar', -500, -130, 'Sugars', MC.glucose); node('glycerol', 'glycerol', -300, -130, 'Glycerol', MC.glycerol);
  node('fattyAcids', 'fattyAcid', -20, -130, 'Fatty acids', MC.fatTail); node('amino', 'aminoAcid', 370, -130, 'Amino acids', MC.amino);
  const down = (nm, x1, y1, x2, y2) => { const ag = G(g); mArrow(ag, [x1, y1], [x2, y2], { color: COL.dim, w: 5, head: 16 }); A[nm] = ag; };
  down('d_carbs', -500, -262, -500, -162); down('d_fats1', -170, -262, -290, -172); down('d_fats2', -120, -262, -40, -162); down('d_prot', 370, -262, 370, -162);
  const nh = G(g, { s: .999 }); ammoniaShape(nh, { s: .8 });
  // the pathway row
  const RY = 150;
  L.glycolysis = G(g); path(L.glycolysis, jRect(640, 120, 22, -300, RY), { fill: MC.gly, 'fill-opacity': .3, stroke: MC.gly, 'stroke-width': 4 });
  jText(L.glycolysis, 'Glycolysis', { x: -300, y: RY + 92, size, fill: MC.gly });
  const chip = (nm, str, cx_, c) => { L[nm] = jChip(g, str, { x: cx_, y: RY, size: 22, fill: c, edge: c }); };
  chip('glucose', 'Glucose', -530, MC.glucose); chip('g3p', 'Glyceraldehyde 3-P', -305, COL.chalk); chip('pyruvate', 'Pyruvate', -75, MC.pyruvate);
  chip('acetylCoA', 'Acetyl CoA', 125, MC.pyrOx);
  L.cycle = jWheel(g, { x: 325, y: RY, R: 64, lines: [['citric', 15], ['acid', 15], ['cycle', 15]], w: 12 });
  L.oxphos = jStageBox(g, [['oxidative', 18], ['phosphorylation', 18]], { x: 540, y: RY, w: 190, h: 100, fill: MC.oxph });
  const row = G(g), edges = [[-530, L.glucose.w], [-305, L.g3p.w], [-75, L.pyruvate.w], [125, L.acetylCoA.w], [325, 140], [540, 190]];
  for (let i = 0; i < 5; i++) mArrow(row, [edges[i][0] + edges[i][1] / 2 + 5, RY], [edges[i + 1][0] - edges[i + 1][1] / 2 - 5, RY], { color: COL.chalk, w: 4, head: 14 });
  L.row = row;
  const feed = (nm, x1, y1, x2, y2, label) => { const ag = G(g); const a = jArrow(ag, { color: COL.chalk, w: 4, head: 16, dash: '10 7' }); a.set(x1, y1, x2, y2); if (label) jText(ag, label, { x: x1 + (x2 - x1) * .25 + 16, y: y1 + (y2 - y1) * .25, size: 20, fill: COL.dim, anchor: 'start', weight: 600 }); A[nm] = ag; };
  feed('f_sugars', -500, -64, -525, RY - 24); feed('f_glycerol', -300, -64, -305, RY - 24); feed('f_fatty', -20, -64, 110, RY - 24, 'beta oxidation');
  feed('f_amino1', 340, -64, -60, RY - 24); feed('f_amino2', 360, -64, 145, RY - 24); feed('f_amino3', 380, -64, 330, RY - 68);
  // beta oxidation: two-carbon pieces leave the fatty acid as acetyl CoA chips
  const betas = [0, 1, 2].map(() => { const bg = G(g, { s: .999, o: 0 }); carbonChain(bg, { n: 2, r: 7, sp: 16, color: MC.pyrOx }).tag(1); return bg; });
  const parts = jParts([...['carbs', 'fats', 'proteins'].map(n => [n, L[n]]), ...['d_carbs', 'd_fats1', 'd_fats2', 'd_prot'].map(n => [n, A[n]]),
    ...['sugars', 'glycerol', 'fattyAcids', 'amino'].map(n => [n, L[n]]), ['glycolysis', L.glycolysis], ['glucose', L.glucose], ['g3p', L.g3p], ['pyruvate', L.pyruvate], ['row', L.row],
    ['acetylCoA', L.acetylCoA], ['cycle', L.cycle], ['oxphos', L.oxphos], ...['f_sugars', 'f_glycerol', 'f_fatty', 'f_amino1', 'f_amino2', 'f_amino3'].map(n => [n, A[n]]), ['nh3', nh, false]],
  { carbohydrates: ['carbs', 'd_carbs', 'sugars', 'f_sugars'], fat: ['fats', 'd_fats1', 'd_fats2', 'glycerol', 'fattyAcids', 'f_glycerol', 'f_fatty'],
    protein: ['proteins', 'd_prot', 'amino', 'f_amino1', 'f_amino2', 'f_amino3', 'nh3'], pathway: ['glycolysis', 'glucose', 'g3p', 'pyruvate', 'row', 'acetylCoA', 'cycle', 'oxphos'] });
  let DK = 0, BK = 0;
  const ff = Object.assign(g, {
    parts: L, arrows: A,
    apply() {
      parts.apply(nm => nm === 'nh3' ? (DK > 0 ? 1 : 0) : 1);
      const q = jL2([408, -144], [560, -200], jR(DK, .15, 1)); jSet(nh, { x: q[0], y: q[1] });
      betas.forEach((b, i) => { const k = jR(BK, i * .25, i * .25 + .45), pt = jL2([-20 + (i - 1) * 30, -130], [125, RY - 40], k); jSet(b, { x: pt[0], y: pt[1], o: k > 0 && k < 1 ? 1 : 0 }); });
      return ff;
    },
    build(k) { parts.setBuild(k); return ff.apply(); },
    // names: carbs fats proteins sugars glycerol fattyAcids amino glycolysis glucose g3p pyruvate acetylCoA cycle oxphos nh3,
    // arrows d_carbs d_fats1 d_fats2 d_prot f_sugars f_glycerol f_fatty f_amino1–3 row; groups carbohydrates fat protein pathway all
    focus(names, k = 1) { parts.setFocus(names || [], k); return ff.apply(); },
    deaminate(k) { DK = jK(k); return ff.apply(); },          // NH₃ leaves the amino acid (shows from k > 0)
    beta(k) { BK = jK(k); return ff.apply(); },               // three acetyl CoA pieces ride from the fatty acid to acetyl CoA
    pt(name) {
      const P = { carbs: [-500, -320], fats: [-150, -320], proteins: [370, -320], sugars: [-500, -130], glycerol: [-300, -130], fattyAcids: [-20, -130], amino: [370, -130],
        glucose: [-530, RY], g3p: [-305, RY], pyruvate: [-75, RY], acetylCoA: [125, RY], cycle: [325, RY], oxphos: [540, RY], nh3: [nh._st.x, nh._st.y] }[name] || [0, 0];
      return cOut(g, P);
    },
  });
  return ff.apply();
}

/* ---------- pfkValve: phosphofructokinase as the valve of glycolysis ---------- */
function pfkValve(p, { x = 800, y = 450, s = 1, o = 1, w = 900, size = 22, labels = true } = {}) {
  const g = G(p, { x, y, s, o }), hw = w / 2, ph = 46;
  path(g, `M${-hw} ${-ph}H${-60}M${60} ${-ph}H${hw}M${-hw} ${ph}H${-60}M${60} ${ph}H${hw}`, { stroke: MC.gly, 'stroke-width': 8 });
  path(g, `M${-hw} ${-ph}H${hw}V${ph}H${-hw}Z`, { fill: MC.gly, 'fill-opacity': .12 });
  const lab = G(g, { o: labels ? 1 : 0 });
  jText(lab, 'fructose 6-phosphate', { x: -hw + 10, y: -ph - 22, size, fill: COL.chalk, anchor: 'start' });
  jText(lab, 'fructose 1,6-bisphosphate', { x: hw - 10, y: -ph - 22, size, fill: COL.chalk, anchor: 'end' });
  // the enzyme: an olive body with two jaws that narrow the pipe
  const body = path(g, cBlob(110, 92, { seed: 4, wob: .05 }), { fill: MC.valve, stroke: MC.valveEdge, 'stroke-width': 4 });
  const gap = path(g, '', { fill: '#0f1e33', stroke: MC.valveEdge, 'stroke-width': 3 });
  jText(g, 'phosphofructokinase', { x: -hw + 10, y: ph + 36, size, fill: MC.valve, anchor: 'start' });
  // sockets for the regulators
  const sockets = { atp: [-70, -88], cit: [70, -88], amp: [0, 96] };
  Object.values(sockets).forEach(([sx, sy]) => mk('circle', { cx: sx, cy: sy, r: 22, fill: '#2b3a18', stroke: MC.valveEdge, 'stroke-width': 3 }, g));
  const dots = [0, 1, 2, 3, 4, 5].map(i => { const d = G(g, { s: .999 }); path(d, zNgon(6, 14, 0, 0, 0), { fill: MC.glucose, stroke: MC.glucoseEdge, 'stroke-width': 2 }); return d; });
  const reg = (key, make, tag, color, from) => {
    const rg = G(g, { s: .999, o: 0 }); make(rg);
    const tg = G(g, { o: 0 }); const [sx, sy] = sockets[key], up = sy < 0;
    path(tg, `M${sx} ${up ? sy - 26 : sy + 26}L${sx} ${up ? sy - 74 : sy + 74}`, { stroke: color, 'stroke-width': 5 });
    const b = G(tg, { x: sx + (key === 'amp' ? 0 : sx < 0 ? -34 : 34), y: up ? sy - 50 : sy + 50 });
    mk('circle', { r: 15, fill: color }, b); wLabel(b, key === 'amp' ? '+' : '−', { y: 9, size: 26, fill: '#fff', weight: 800, o: 1 });
    jText(tg, tag, { x: sx + (key === 'amp' ? 50 : sx < 0 ? -56 : 56), y: (up ? sy - 50 : sy + 50) + 8, size, fill: color, anchor: key === 'amp' ? 'start' : sx < 0 ? 'end' : 'start' });
    return { rg, tg, from };
  };
  const R = {
    atp: reg('atp', rg => atpBurst(rg, { r: 22, label: 'ATP', size: 12 }), 'inhibits', MC.inhib, [-260, -230]),
    cit: reg('cit', rg => { mk('circle', { r: 20, fill: MC.cac, stroke: '#8e2f20', 'stroke-width': 3 }, rg); jText(rg, 'citrate', { x: -24, y: -32, size: 18, fill: MC.cac, anchor: 'end' }); }, 'inhibits', MC.inhib, [260, -230]),
    amp: reg('amp', rg => { path(rg, jRect(60, 34, 12), { fill: MC.stim, stroke: '#3a8a3a', 'stroke-width': 3 }); jText(rg, 'AMP', { y: 7, size: 18, fill: '#0f2a0f' }); }, 'stimulates', MC.stim, [-200, 260]),
  };
  const pv = Object.assign(g, {
    sockets: R,
    // the whole pose (missing keys take these defaults): atp, cit, amp 0..1 each regulator comes in from outside and docks
    // (its tag shows at the end); open 0..1 the jaws' opening (default: from the regulators, .7 + .3·amp − .35·atp − .2·cit);
    // t with flow moves sugars through, fewer and slower when it is narrow
    set({ atp = 0, cit = 0, amp = 0, open = null, t = 0, flow = 1 } = {}) {
      atp = jK(atp); cit = jK(cit); amp = jK(amp); t = jT(t); flow = jK(flow);
      const op = open == null ? mClamp(.7 + .3 * jR(amp, .6, 1) - .35 * jR(atp, .6, 1) - .2 * jR(cit, .6, 1)) : jK(open);
      const gw = 10 + 70 * op;
      mD(gap, `M-60 ${cF(-gw / 2)}H60V${cF(gw / 2)}H-60Z`);
      [['atp', atp], ['cit', cit], ['amp', amp]].forEach(([key, k]) => {
        const r = R[key], [sx, sy] = sockets[key], q = jL2(r.from, [sx, sy], jR(k, 0, .6));
        jSet(r.rg, { x: q[0], y: q[1], o: mRamp(k, 0, .1) }); mO(r.tg, jR(k, .6, .85));
      });
      dots.forEach((d, i) => {
        const u = cFrac(t * (.08 + .22 * op) + i / 6), xx = -hw + 30 + u * (w - 60), inGap = Math.abs(xx) < 70;
        const pass = i / 6 < .2 + .8 * op;
        jSet(d, { x: xx, y: 0, s: inGap ? Math.max(.3, Math.min(1, gw / 34)) : .999, o: flow * (pass ? Math.min(1, u * 10, (1 - u) * 10) : 0) });
      });
      return pv;
    },
    pt(name) { const P = { atp: sockets.atp, cit: sockets.cit, amp: sockets.amp, in: [-hw, 0], out: [hw, 0], enzyme: [0, 0] }[name] || [0, 0]; return cOut(g, P); },
  });
  return pv.set({});
}

/* ---------- dehydrogenase: the hand-off of two H from a fuel to NAD⁺ (slide 14) ---------- */
function dehydrogenase(p, { x = 800, y = 450, s = 1, o = 1, size = 24, labels = true } = {}) {
  const g = G(p, { x, y, s, o }), C = [-200, 0], Op = [-110, 0];
  const enz = G(g, { x: -170, y: 120 }); path(enz, cBlob(120, 52, { seed: 2, wob: .06 }), { fill: MC.enzyme, stroke: MC.enzymeEdge, 'stroke-width': 4 });
  const enzLab = jText(enz, 'dehydrogenase', { y: 9, size, fill: '#1f2d10', o: labels ? 1 : 0 });
  const fuel = G(g);
  path(fuel, `M${C[0] - 80} 0H${C[0]}M${C[0]} 0H${Op[0]}`, { stroke: COL.chalk, 'stroke-width': 6 });
  const dbl = path(fuel, `M${C[0] + 14} -10H${Op[0] - 14}`, { stroke: COL.chalk, 'stroke-width': 6 }, { o: 0 });
  wAtom(fuel, 'C', { x: C[0], y: C[1], r: 26 }); wAtom(fuel, 'O', { x: Op[0], y: Op[1], r: 28 });
  jText(fuel, 'R', { x: C[0] - 96, y: 9, size: 26, fill: COL.dim, anchor: 'end' });
  const fuelLab = jText(fuel, 'fuel (generic)', { x: C[0] - 40, y: -96, size: size * .85, fill: COL.dim, o: labels ? 1 : 0 });
  const bonds = path(g, '', { stroke: COL.chalk, 'stroke-width': 5 });
  const H1 = hAtom(g, { r: 17 }), H2 = hAtom(g, { r: 17 });
  const nad = nadShuttle(g, { x: 240, y: 60, size });
  const pair = electron(g, { n: 2, r: 8, o: 0 }), hp = proton(g, { r: 14, o: 0 }), free = proton(g, { r: 14, o: 0 });
  const freeLab = jText(g, 'H^+ released', { x: 60, y: -232, size: size * .85, fill: MC.proton, o: 0 });
  const H1home = [C[0], -58], H2home = [Op[0] + 58, -10];
  const dh = Object.assign(g, {
    nad, enzyme: enz, fuel, H1, H2,
    // k: the enzyme presses in (0–.15); both H leave the fuel (.15–.35) and C–O becomes C=O; each H splits into H⁺ + e⁻
    // (.35–.45); the two e⁻ and one H⁺ ride onto NAD⁺ (.45–.72), which becomes NADH (.6–.8); the other H⁺ drifts off (.55–.9)
    set(k) {
      k = jK(k);
      jSet(enz, { x: -170, y: 120 - 16 * jR(k, 0, .15) });
      const lift = jR(k, .15, .35), a1 = jL2(H1home, [-120, -150], lift), a2 = jL2(H2home, [-40, -130], lift);
      const sp = jR(k, .35, .45);
      H1.pose(a1[0], a1[1]); H2.pose(a2[0], a2[1]); H1.split(sp); H2.split(sp);
      mD(bonds, `M${cF(C[0])} ${cF(C[1] - 24)}L${cF(a1[0])} ${cF(a1[1] + 16)}M${cF(Op[0] + 26)} ${cF(Op[1] - 4)}L${cF(a2[0] - 16)} ${cF(a2[1] + 4)}`);
      mO(bonds, 1 - jR(k, .15, .25)); mO(dbl, jR(k, .25, .35));
      // the hand-off: the H atoms' own electrons hide while a pair + H⁺ (this piece's) travel; the atoms fade
      const go = jR(k, .45, .72), seatE = [240 - 37, 58], seatH = [240 + 27, 58];
      const e0 = jL2([(a1[0] + a2[0]) / 2 + 40, (a1[1] + a2[1]) / 2], seatE, go), h0 = jL2(a1, seatH, go);
      pair.pose(e0[0], e0[1]); mO(pair, k > .45 && k < .62 ? 1 : 0);
      hp.pose(h0[0], h0[1]); mO(hp, k > .45 && k < .66 ? 1 : 0);
      mO(H1, 1 - mRamp(k, .44, .46)); mO(H2, 1 - mRamp(k, .44, .46));
      const fr = jR(k, .55, .9), f0 = jL2(a2, [60, -200], fr); free.pose(f0[0], f0[1]); mO(free, k > .44 ? 1 : 0);
      mO(freeLab, jR(k, .8, .95));
      nad.set(jR(k, .6, .8));
      return dh;
    },
    pt(name) { const P = { fuel: C, enzyme: [-170, 120], nad: [240, 60], free: [60, -200], h: [-120, -150] }[name] || [0, 0]; return cOut(g, P); },
  });
  void enzLab; void fuelLab;
  return dh.set(0);
}

/* ---------- chain icon, NAD loop ---------- */
function chainIcon(p, { x = 0, y = 0, s = 1, o = 1, label = true, size = 22 } = {}) {
  const g = G(p, { x, y, s, o });
  [0, 1, 2, 3].forEach(i => { const bx = -90 + i * 60, by = -45 + i * 30; path(g, jRect(52, 40, 10, bx, by), { fill: MC.complex, stroke: MC.complexEdge, 'stroke-width': 3 }); jText(g, ['I', 'II', 'III', 'IV'][i], { x: bx, y: by + 8, size: 20, fill: '#fff', weight: 800 }); });
  if (label) jText(g, 'electron transport chain', { y: 96, size, fill: MC.complex });
  return Object.assign(g, { pt(name) { return cOut(g, name === 'in' ? [-90, -45] : name === 'out' ? [90, 45] : [0, 0]); } });
}
function nadLoop(p, { x = 800, y = 450, s = 1, o = 1, w = 900, h = 300, n = 1, size = 24 } = {}) {
  const g = G(p, { x, y, s, o }), hw = w / 2, hh = h / 2;
  path(g, jRect(w, h, hh * .9), { stroke: MC.nad, 'stroke-width': 5, 'stroke-dasharray': '14 10', 'stroke-opacity': .7 });
  const st = G(g, { x: -hw - 10, y: 0 }); path(st, jRect(150, 120, 16), { fill: '#3b4a22', stroke: MC.enzymeEdge, 'stroke-width': 3 }); glucoseRing(st, { R: 26, r: 7 }); jText(st, 'fuel', { y: -76, size, fill: MC.glucose });
  const ch = chainIcon(g, { x: hw + 20, y: 0, s: .9, size: 20 });
  const ln = jLine([[-hw + 80, -hh], [hw - 80, -hh], [hw - 80, hh], [-hw + 80, hh], [-hw + 80, -hh]]);
  const buses = Array.from({ length: n }, () => nadShuttle(g, { size: 22 }));
  const es = Array.from({ length: n }, () => electron(g, { n: 2, r: 7, o: 0 }));
  const nl = Object.assign(g, {
    buses, station: st, chain: ch,
    // u loops (any real, wrapped): the shuttle loads at the fuel (0–.12, NAD⁺ → NADH), rides the top to the chain (.12–.42),
    // unloads its pair into the chain (.42–.55, back to NAD⁺), and returns along the bottom (.55–1). n buses share the loop
    set(u) {
      u = jU(u);
      buses.forEach((b, i) => {
        const v = cFrac(u + i / n), L1 = .5 * (w - 160) / ln.len;
        let pos;
        if (v < .12) pos = ln.at(0);
        else if (v < .42) pos = ln.at(jL(0, 2 * L1, jR(v, .12, .42)));
        else if (v < .55) pos = ln.at(2 * L1);
        else pos = ln.at(jL(2 * L1, 1, jR(v, .55, 1)));
        b.pose(pos[0], pos[1]); b.set(v < .12 ? jR(v, 0, .1) : v < .42 ? 1 : 1 - jR(v, .44, .55));
        const ek = jR(v, .44, .54), e0 = jL2(b.seat(0), ch.pt('in'), ek); es[i].pose(e0[0], e0[1]); mO(es[i], v > .44 && v < .54 ? 1 : 0);
      });
      return nl;
    },
  });
  return nl.set(0);
}

/* ---------- substrate-level phosphorylation (slide 21) ---------- */
function substrateLevel(p, { x = 800, y = 450, s = 1, o = 1, size = 24, labels = true } = {}) {
  const g = G(p, { x, y, s, o });
  const enz = G(g, { x: 0, y: 70 }); path(enz, cBlob(190, 90, { seed: 6, wob: .05 }), { fill: MC.enzyme, stroke: MC.enzymeEdge, 'stroke-width': 4 });
  jText(enz, 'enzyme', { y: 50, size, fill: '#1f2d10', o: labels ? 1 : 0 });
  const sub = G(g, { s: .999 }); path(sub, jRect(110, 60, 14), { fill: MC.sub, stroke: MC.subEdge, 'stroke-width': 3 });
  const subLab = jText(g, 'substrate', { size, fill: MC.sub, o: 0 });
  const P = G(g, { s: .999 }); mk('circle', { r: 20, fill: MC.P, stroke: MC.Pedge, 'stroke-width': 2.5 }, P); wLabel(P, 'P', { y: 8, size: 22, fill: '#24160a', weight: 800, o: 1 });
  // one name each: the label under the molecule when labels is on, else the molecule's own text
  const adp = G(g, { s: .999 }); solute(adp, 'ADP', { r: 24, label: labels ? false : 'name' });
  const atp = G(g, { s: .999, o: 0 }); solute(atp, 'ATP', { r: 26, label: labels ? false : 'name' });
  const nLab = jText(g, 'ADP', { size, fill: COL.chalk, o: 0 });
  const prodLab = jText(g, 'product', { size, fill: MC.sub, o: 0 });
  const sl = Object.assign(g, {
    enzyme: enz,
    // the substrate (with its P) and ADP come in onto the enzyme (0–.25); the P hops to ADP (.3–.6); ADP becomes ATP (its
    // name fades out by .55, ATP fades in from .55); the product and ATP leave (.7–1)
    set(k) {
      k = jK(k);
      const inK = jR(k, 0, .25), outK = jR(k, .7, 1);
      const sp = jL2([-360, -40], [-90, -10], inK), sp2 = jL2(sp, [-330, -150], outK);
      jSet(sub, { x: sp2[0], y: sp2[1], o: 1 });
      jSet(subLab, { x: sp2[0], y: sp2[1] + 62, o: labels ? 1 : 0 }); jTxt(subLab, k < .45 ? 'substrate' : 'product');
      mO(subLab, labels ? (k < .45 ? 1 - mRamp(k, .38, .45) : mRamp(k, .45, .52)) : 0);
      mO(prodLab, 0);
      const ap = jL2([360, -40], [90, -10], inK), ap2 = jL2(ap, [330, -150], outK);
      jSet(adp, { x: ap2[0], y: ap2[1], o: 1 - mRamp(k, .5, .55) }); jSet(atp, { x: ap2[0], y: ap2[1], o: mRamp(k, .55, .62) });
      const hop = jR(k, .3, .6), pp = jL2([sp[0] + 55, sp[1] - 34], [ap[0] - 42, ap[1] - 30], hop), arc = -60 * Math.sin(Math.PI * hop);
      const pfin = k < .62 ? pp : [ap2[0] - 42, ap2[1] - 30];
      jSet(P, { x: pfin[0], y: pfin[1] + (k < .62 ? arc : 0), o: k < .6 ? 1 : 0 });
      jSet(nLab, { x: ap2[0], y: ap2[1] + 64 }); jTxt(nLab, k < .55 ? 'ADP' : 'ATP'); mO(nLab, labels ? (k < .55 ? 1 - mRamp(k, .48, .55) : mRamp(k, .55, .62)) : 0);
      return sl;
    },
  });
  void prodLab;
  return sl.set(0);
}

/* ---------- redoxEq: an equation with its oxidized / reduced brackets ---------- */
const J_EQ = {
  glucose: { t: ['C_6H_{12}O_6', '+', '6 O_2', '→', '6 CO_2', '+', '6 H_2O', '+', 'energy'], ox: [0, 4], red: [2, 6] },
  methane: { t: ['CH_4', '+', '2 O_2', '→', 'CO_2', '+', '2 H_2O', '+', 'energy'], ox: [0, 4], red: [2, 6] },
  salt: { t: ['Na', '+', 'Cl', '→', 'Na^+', '+', 'Cl^−'], ox: [0, 4], red: [2, 6] },
  fuel: { t: ['XH', '+', 'NAD^+', '→', 'X', '+', 'NADH'], ox: [0, 4], red: [2, 6] },
};
function redoxEq(p, { kind = 'glucose', x = 800, y = 450, s = 1, o = 1, size = 44, gap = 26, oxLabel = 'becomes oxidized', redLabel = 'becomes reduced' } = {}) {
  const g = G(p, { x, y, s, o }), E = J_EQ[kind] || J_EQ.glucose;
  const plain = str => str.replace(/[_^]\{([^}]*)\}/g, '$1').replace(/[_^](.)/g, '$1');
  const ws = E.t.map(t => uiW(plain(t), size) * (t.includes('_') || t.includes('^') ? .9 : 1) * 1.04);
  const tot = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1); let cx = -tot / 2;
  const xs = ws.map(wd => { const c = cx + wd / 2; cx += wd + gap; return c; });
  const terms = E.t.map((t, i) => { const tg = G(g, { x: xs[i], s: .999 }); jText(tg, t, { y: size * .36, size, fill: COL.chalk, weight: 700 }); return tg; });
  const br = (pair, up, color, label) => {
    const bg = G(g), a = xs[pair[0]], b = xs[pair[1]], yy = up ? -size * 1.05 : size * 1.05, tip = up ? yy - 24 : yy + 24;
    const ln = path(bg, `M${cF(a)} ${cF(yy)}V${cF(tip)}H${cF(b)}V${cF(yy)}`, { stroke: color, 'stroke-width': 5 }, { d: 0 });
    const hd = path(bg, `M${cF(b - 10)} ${cF(yy + (up ? -14 : 14))}L${cF(b)} ${cF(yy)}L${cF(b + 10)} ${cF(yy + (up ? -14 : 14))}Z`, { fill: color, stroke: color, 'stroke-width': 2 }, { o: 0 });
    const lt = jText(bg, label, { x: (a + b) / 2, y: up ? tip - 14 : tip + 32, size: size * .6, fill: color, o: 0 });
    return { ln, hd, lt };
  };
  const OX = br(E.ox, true, MC.oxid, oxLabel), RED = br(E.red, false, MC.redu, redLabel);
  let LIT = null, FK = 0;
  const re = Object.assign(g, {
    terms,
    ox(k) { k = jK(k); cSet(OX.ln, { d: jR(k, 0, .7) }); mO(OX.hd, mRamp(k, .65, .75)); mO(OX.lt, jR(k, .5, 1)); return re; },
    red(k) { k = jK(k); cSet(RED.ln, { d: jR(k, 0, .7) }); mO(RED.hd, mRamp(k, .65, .75)); mO(RED.lt, jR(k, .5, 1)); return re; },
    // terms by index (0-based, signs count), the rest dim to .25
    focus(idx, k = 1) { LIT = idx && [].concat(idx).length ? new Set([].concat(idx)) : null; FK = jK(k); terms.forEach((t, i) => mO(t, LIT ? (LIT.has(i) ? 1 : 1 - .75 * FK) : 1)); return re; },
    reveal(k) { k = jK(k); const n = terms.length; terms.forEach((t, i) => mO(t, mRamp(k * n - i, 0, 1))); return re; },   // terms left to right
    pt(i, side = 0) { return cOut(g, [xs[i], side * size]); },     // term i's centre (side −1 above it, 1 below)
  });
  return re.ox(0).red(0);
}
