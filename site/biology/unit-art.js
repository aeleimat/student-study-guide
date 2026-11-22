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
  ];
})();
