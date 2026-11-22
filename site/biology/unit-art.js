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
  ];
})();
