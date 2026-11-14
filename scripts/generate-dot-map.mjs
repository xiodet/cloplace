// Draws Europe as a grid of dots and writes it once to public/europe-dots.svg (npm run dots).
// A dot is kept when its centre lies on land (Natural Earth 1:50m via world-atlas).
// Options: --step=9 --r=2 --fill=#cfcfcf --hex (every other row shifted by half a step) --out=path
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { feature } from 'topojson-client';
import { geoContains, geoBounds } from 'd3-geo';
import { MAP, project, unproject } from '../src/data/mapProjection.js';

const arg = (name, fallback) => { const hit = process.argv.find((a) => a.startsWith(`--${name}`)); return hit ? (hit.includes('=') ? hit.split('=')[1] : true) : fallback; };
const step = +arg('step', 9), r = +arg('r', 2), fill = arg('fill', '#cfcfcf'), hex = arg('hex', false);
const out = arg('out', new URL('../public/europe-dots.svg', import.meta.url));

const topo = JSON.parse(readFileSync(new URL('../node_modules/world-atlas/land-50m.json', import.meta.url)));
const land = feature(topo, topo.objects.land);
// Only the pieces of land that touch the map box, each with its bounding box for a quick reject.
const pad = 1;
const parts = (land.features ? land.features.flatMap((f) => f.geometry.coordinates) : land.geometry.coordinates)
  .map((coordinates) => { const g = { type: 'Polygon', coordinates }; const b = geoBounds(g); if (b[0][0] > b[1][0]) { b[0][0] = -180; b[1][0] = 180; } return { g, b }; }) // a box that wraps the date line counts as every longitude
  .filter(({ b: [[w, s], [e, n]] }) => e >= MAP.lon[0] - pad && w <= MAP.lon[1] + pad && n >= MAP.lat[0] - pad && s <= MAP.lat[1] + pad);
const onLand = (p) => parts.some(({ g, b: [[w, s], [e, n]] }) => p[0] >= w && p[0] <= e && p[1] >= s && p[1] <= n && geoContains(g, p));

const dots = [];
let row = 0;
for (let y = step / 2; y < MAP.h; y += hex ? step * 0.866 : step, row++) {
  for (let x = step / 2 + (hex && row % 2 ? step / 2 : 0); x < MAP.w; x += step) {
    if (onLand(unproject([x, y]))) dots.push([+x.toFixed(1), +y.toFixed(1)]);
  }
}
// One path of tiny arcs keeps the file small: "M x y h 0" with a round cap is a circle.
const d = dots.map(([x, y]) => `M${x} ${y}h0`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP.w} ${MAP.h}"><path d="${d}" fill="none" stroke="${fill}" stroke-width="${r * 2}" stroke-linecap="round"/></svg>\n`;
if (typeof out !== 'string') mkdirSync(new URL('../public/', import.meta.url), { recursive: true });
writeFileSync(out, svg);
console.log(`${dots.length} dots, ${(svg.length / 1024).toFixed(0)} KB`);
