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

  window.UNIT_ART = [
    // Unit 1 (Chapter 1: Amino Acid Classifications): one amino acid drawn as a cross: the α-carbon in the middle,
    // the amino group left, the carboxyl group right, H above and the side chain R below, on a hexagon ring (an
    // aromatic side chain). The four classifications sit as faint tags at the right.
    reset(C(380, 74, 20) + Tx(380, 81, 'Cα', 17, '', 'middle') +
      P('M360 74H318', 'a') + Tx(310, 81, 'H₂N', 19, 'a', 'end') +
      P('M400 74H442', 'a') + Tx(450, 81, 'COOH', 19, 'a') +
      P('M380 54V32', 'a') + Tx(380, 24, 'H', 17, 'a', 'middle') +
      P('M380 94V112') +
      P('M380 112L401 124L401 148L380 160L359 148L359 124Z') + Tx(414, 142, 'R', 18, '', 'start') +
      Tx(588, 36, 'structural', 13, 'faint', 'end') + Tx(588, 70, 'chemical', 13, 'faint', 'end') +
      Tx(588, 104, 'nutritional', 13, 'faint', 'end') + Tx(588, 138, 'metabolic', 13, 'faint', 'end')),
    // Unit 2 (Chapter 2: Protein Types): a chain of amino-acid beads joined by peptide links, N at one end and C at
    // the other, branching below into the three classes: simple, conjugated (a bead carrying a small extra group)
    // and derived (broken pieces).
    reset((() => {
      let s = '';
      for (let i = 0; i < 7; i++) s += C(270 + i * 44, 40, 13, i % 2 ? 'a' : '') + (i < 6 ? P(`M${283 + i * 44} 40H${301 + i * 44}`, 'a') : '');
      s += Tx(246, 46, 'N', 15, 'faint', 'end') + Tx(550, 46, 'C', 15, 'faint');
      s += P('M402 60V84') + P('M300 84H510') + P('M300 84V100') + P('M402 84V100') + P('M510 84V100');
      s += C(300, 120, 11) + C(402, 120, 11) + P('M410 112L428 100L440 112L428 124Z', 'a') +
        P('M492 122L504 114M514 128L526 120', 'a') + C(498, 128, 6, 'a') + C(522, 112, 6, 'a');
      s += Tx(300, 156, 'simple', 13, 'faint', 'middle') + Tx(410, 156, 'conjugated', 13, 'faint', 'middle') + Tx(510, 156, 'derived', 13, 'faint', 'middle');
      return s;
    })()),
    // Unit 3 (Chapter 3: Protein Structure and Folding): the four levels left to right: a straight bead chain
    // (primary), a coil (secondary), a folded knot (tertiary) and four packed blobs (quaternary). The knot breathes.
    reset((() => {
      let s = '';
      for (let i = 0; i < 4; i++) s += C(232 + i * 18, 92, 6, 'a');
      let coil = 'M314 112';
      for (let i = 0; i < 4; i++) coil += `C${322 + i * 16} 60 ${336 + i * 16} 60 ${330 + i * 16} 112`;
      s += P(coil);
      s += `<path class="d fold-breathe" pathLength="1" style="--k:${k++}" d="M440 70C470 40 510 60 500 92C492 118 452 124 444 102C436 80 470 74 482 92C492 108 470 122 456 112"/>`;
      s += C(546, 70, 18) + C(582, 70, 18, 'a') + C(546, 108, 18, 'a') + C(582, 108, 18);
      s += Tx(250, 160, 'primary', 13, 'faint', 'middle') + Tx(348, 160, 'secondary', 13, 'faint', 'middle') +
        Tx(470, 160, 'tertiary', 13, 'faint', 'middle') + Tx(566, 160, 'quaternary', 13, 'faint', 'middle');
      return s;
    })()),
  ];
})();
