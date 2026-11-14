// Builds src/data/europe.json: simplified country outlines for the Index map, in plain SVG paths.
// Run once (npm run map); the result is committed, so the site needs no map library or tiles.
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { geoMercator, geoPath } from 'd3-geo';

const topo = JSON.parse(readFileSync(new URL('../node_modules/world-atlas/countries-50m.json', import.meta.url)));
const all = feature(topo, topo.objects.countries).features;

const W = 1400, H = 780;
const box = { type: 'Feature', geometry: { type: 'MultiPoint', coordinates: [[-24, 34.5], [56, 34.5], [-24, 62.8], [56, 62.8]] } };
const proj = geoMercator().fitExtent([[0, 0], [W, H]], box).clipExtent([[0, 0], [W, H]]);
const path = geoPath(proj).digits(1);

const d = all.map((f) => path(f)).filter(Boolean).join('');
const [tx, ty] = proj.translate();
writeFileSync(new URL('../src/data/europe.json', import.meta.url), JSON.stringify({ w: W, h: H, k: +proj.scale().toFixed(3), tx: +tx.toFixed(2), ty: +ty.toFixed(2), d }));
console.log('europe.json', (d.length / 1024).toFixed(0) + ' KB');
