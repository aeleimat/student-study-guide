// Chalk sketches for the unit headers on the contents page, one per unit, drawn in the unit's colour.
// Each entry is the inside of an SVG with viewBox 0 0 600 180; keep the left ~200 px light (the unit title sits there
// on narrow screens). Classes, styled in lib/units.css:
//   d  a stroke that draws itself in when the unit scrolls into view (--k orders the strokes)
//   t  text or a filled shape that fades in
//   a  faint chalk white instead of the unit colour;  faint  even fainter
// A sketch may add one looping motion after it is drawn: give an element a class that lib/units.css animates (swap-a,
// hop, orbit, ride, spin, tilt, breathe, ...), or add your own .seen .unit-art .NAME rule and keyframes in a <style> in index.html.
'use strict';
(() => {
  let k = 0;
  const P = (d, cls = '', extra = '') => `<path class="d ${cls}" pathLength="1" style="--k:${k++}" d="${d}" ${extra}/>`;
  const Tx = (x, y, s, size = 24, cls = '', anchor = 'start') => `<text class="t ${cls}" style="--k:${k++}" x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}">${s}</text>`;
  const C = (cx, cy, r, cls = '') => `<circle class="d ${cls}" pathLength="1" style="--k:${k++}" cx="${cx}" cy="${cy}" r="${r}"/>`;
  const reset = s => { k = 0; return s; };

  // A bent water molecule: oxygen at (x, y), hydrogens at ±52° below, drawn as chalk circles and sticks.
  const water = (x, y, s = 1, tilt = 0) => {
    const h = a => [x + Math.sin((a + tilt) * Math.PI / 180) * 44 * s, y + Math.cos((a + tilt) * Math.PI / 180) * 44 * s];
    const [ax, ay] = h(-52), [bx, by] = h(52);
    return C(x, y, 22 * s) + P(`M${x} ${y}L${ax} ${ay}`, 'a') + P(`M${x} ${y}L${bx} ${by}`, 'a') + C(ax, ay, 11 * s, 'a') + C(bx, by, 11 * s, 'a');
  };

  window.UNIT_ART = [
    // Unit 3 (Chapter 3: Water and Life): two water molecules joined by a hydrogen bond that flickers, as H-bonds
    // break and re-form; small labels for the partial charges and the pH scale the chapter ends on.
    reset(water(300, 74, 1, 0) + water(470, 96, 1, 140) +
      `<path class="d hb-flicker" pathLength="1" style="--k:${k++}" stroke-dasharray=".08 .06" d="M330 108L440 102"/>` +
      Tx(286, 44, 'δ−', 18, 'a') + Tx(338, 140, 'δ+', 18, 'a') +
      P('M240 160H580', 'faint') + Tx(240, 176, 'pH 0', 13, 'faint') + Tx(580, 176, '14', 13, 'faint', 'end') +
      Tx(410, 176, '7', 13, 'faint', 'middle')),
    // Unit 5 (Chapter 5: Large Biological Molecules): a short double helix drawn sideways, its two backbones crossing,
    // dashed base-pair rungs between them, the ends marked 5′ and 3′, and a small bead chain (a polymer) above.
    reset((() => {
      const x0 = 250, x1 = 570, cy = 104, A = 34, w = 2 * Math.PI / 160;
      const strand = ph => 'M' + Array.from({ length: 33 }, (_, i) => { const x = x0 + i * 10; return `${x} ${(cy + A * Math.sin(w * (x - x0) + ph)).toFixed(1)}`; }).join('L');
      let rungs = '';
      for (let x = x0 + 14; x < x1; x += 22) {
        const y1 = cy + A * Math.sin(w * (x - x0) - Math.PI / 2), y2 = cy + A * Math.sin(w * (x - x0) + Math.PI / 2);
        if (Math.abs(y1 - y2) > 12) rungs += P(`M${x} ${y1.toFixed(1)}L${x} ${y2.toFixed(1)}`, 'a', 'stroke-dasharray=".12 .1"');
      }
      let beads = '';
      for (let i = 0; i < 5; i++) beads += C(300 + i * 26, 30, 9, i % 2 ? 'a' : '');
      return P(strand(-Math.PI / 2)) + P(strand(Math.PI / 2)) + rungs + beads + P('M309 30H317M335 30H343M361 30H369M387 30H395', 'a') +
        Tx(x0 - 8, cy - A + 5, '5′', 16, 'a', 'end') + Tx(x1 + 8, cy - A + 5, '3′', 16, 'a') +
        Tx(x0 - 8, cy + A + 5, '3′', 16, 'a', 'end') + Tx(x1 + 8, cy + A + 5, '5′', 16, 'a') +
        Tx(420, 36, 'A–T  G–C', 14, 'faint');
    })()),
    // Unit 6 (Chapter 6: A Tour of the Cell): a cell outline with its nucleus (nucleolus inside, two pores), a
    // mitochondrion with folded cristae, a Golgi stack shedding a vesicle, and a few ribosome dots.
    reset(`<g>` +
      P('M260 92C260 40 330 14 415 14C505 14 575 40 575 92C575 146 505 172 415 172C330 172 260 146 260 92Z') +
      C(340, 92, 40, 'a') + C(350, 84, 11) + P('M302 82L310 82M370 108L378 112', 'faint') +
      P('M430 128C430 112 450 106 478 106C506 106 524 112 524 128C524 144 506 150 478 150C450 150 430 144 430 128Z') +
      P('M444 128C450 116 456 140 462 120C468 140 474 116 480 134C486 116 492 140 498 120C504 140 508 118 512 128', 'a') +
      P('M440 46C470 40 500 40 530 46M444 58C472 52 498 52 526 58M448 70C474 64 496 64 522 70', 'a') + C(540, 80, 7) +
      C(398, 60, 3, 'faint') + C(410, 140, 3, 'faint') + C(392, 120, 3, 'faint') + C(552, 118, 3, 'faint') +
      `</g>`),
    // Unit 7 (Chapter 7: Membrane Structure and Function): a stretch of lipid bilayer (heads as circles, two tails
    // each, one kinked) with a channel protein in it; an ion drops through the channel again and again.
    reset((() => {
      let s = '';
      for (let i = 0; i < 10; i++) {
        const x = 250 + i * 34 + (i > 6 ? 14 : 0);
        if (i === 5 || i === 6) continue;
        s += C(x, 56, 9) + P(`M${x - 4} 65L${x - 4} 88M${x + 4} 65L${x + 4} 88`, 'a') +
          C(x, 132, 9) + P(i === 3 ? `M${x - 4} 123L${x - 4} 110L${x - 10} 100M${x + 4} 123L${x + 4} 100` : `M${x - 4} 123L${x - 4} 100M${x + 4} 123L${x + 4} 100`, 'a');
      }
      s += P('M418 40C406 40 404 48 404 60L404 130C404 142 406 148 418 148C428 148 430 142 430 130L430 60C430 48 428 40 418 40Z') +
        P('M472 40C462 40 460 48 460 60L460 130C460 142 462 148 472 148C484 148 486 142 486 130L486 60C486 48 484 40 472 40Z') +
        `<g class="t hop" style="offset-path: path('M445 6L445 176')"><circle r="9" fill="none" stroke="currentColor" stroke-width="2.5"/>` +
        `<text x="0" y="5" font-size="14" text-anchor="middle" fill="currentColor">+</text></g>` +
        Tx(588, 24, 'outside', 13, 'faint', 'end') + Tx(588, 176, 'cytoplasm', 13, 'faint', 'end');
      return s;
    })()),
    // Unit 8 (Chapter 8: An Introduction to Metabolism): an energy diagram, reactants high on the left, a tall
    // activation hump, products low on the right; a dashed lower hump is the enzyme's path. A ball rides over the
    // hump and down, again and again.
    reset(P('M236 18L236 166L590 166', 'faint') + Tx(244, 30, 'G', 13, 'faint') +
      P('M240 70C290 70 300 70 330 60C360 20 380 18 400 30C430 60 450 128 500 132C540 134 560 134 586 134') +
      P('M330 60C350 50 368 46 392 56C420 72 450 128 500 132', 'a', 'stroke-dasharray=".04 .03"') +
      P('M520 74L520 128', 'a') + P('M512 118L520 130L528 118', 'a') + Tx(530, 104, 'ΔG < 0', 13, 'faint') +
      `<g class="t hop" style="offset-path: path('M250 60C290 60 300 60 330 50C360 10 380 8 400 20C430 50 450 118 500 122C540 124 560 124 580 124')"><circle r="8" fill="none" stroke="currentColor" stroke-width="2.5"/></g>` +
      Tx(588, 160, 'progress', 13, 'faint', 'end')),
    // Unit 9 (Chapter 9: Cellular Respiration): a mitochondrion with folded cristae; beside it a free-energy
    // staircase that an electron pair steps down to O₂, again and again.
    reset(P('M250 90C250 40 300 22 360 22C420 22 446 40 446 90C446 140 420 158 360 158C300 158 250 140 250 90Z') +
      P('M268 90C268 54 300 38 360 38C420 38 430 54 430 90C430 126 420 142 360 142C300 142 268 126 268 90Z', 'a') +
      P('M290 46L290 110C290 120 304 120 304 110L304 66C304 56 318 56 318 66L318 128C318 138 332 138 332 128L332 56C332 46 346 46 346 56L346 124C346 134 360 134 360 124L360 52C360 42 374 42 374 52L374 128C374 138 388 138 388 128L388 58C388 48 402 48 402 58L402 116', 'a') +
      P('M470 34L500 34L500 66L530 66L530 98L560 98L560 130L590 130') + Tx(468, 26, 'e⁻', 13, 'faint') +
      Tx(588, 160, 'O₂', 13, 'faint', 'end') + Tx(255, 176, 'mitochondrion', 13, 'faint') +
      `<g class="t hop" style="offset-path: path('M478 26L508 26L508 58L538 58L538 90L568 90L568 122L586 122')"><circle r="5" fill="currentColor"/><circle cx="9" r="5" fill="currentColor"/></g>`),
  ];
})();
