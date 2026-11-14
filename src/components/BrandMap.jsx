import europe from '../data/europe.json';
import { cities } from '../data/cities.js';

// Same Mercator as scripts/build-map.mjs, so pins land on the pre-drawn outlines.
export const project = ([lon, lat]) => [
  europe.tx + europe.k * (lon * Math.PI) / 180,
  europe.ty - europe.k * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
];

// Brands in the same or neighbouring towns share one pin.
export function clusterBrands(brands) {
  const out = [];
  for (const b of brands) {
    const geo = cities[b.city];
    if (!geo) continue;
    const [x, y] = project(geo);
    const near = out.find((c) => Math.hypot(c.x - x, c.y - y) < 22);
    if (near) { near.brands.push(b); if (!near.names.includes(b.city)) near.names.push(b.city); }
    else out.push({ key: b.city, x, y, names: [b.city], brands: [b] });
  }
  // the busiest town names the pin
  for (const c of out) c.names.sort((a, b) => c.brands.filter((x) => x.city === b).length - c.brands.filter((x) => x.city === a).length);
  return out;
}

// Where the map travels for each origin filter: Ukraine is a fixed frame, anything else
// frames the pins that are left.
const UKRAINE = [[21.5, 52.8], [40.8, 44]];
function view(focus, clusters) {
  let pts = null, cap = 2.4;
  if (focus === 'UA') { pts = UKRAINE.map(project); cap = 3.2; }
  else if (focus !== 'ALL' && clusters.length) {
    const xs = clusters.map((c) => c.x), ys = clusters.map((c) => c.y);
    pts = [[Math.min(...xs) - 70, Math.min(...ys) - 40], [Math.max(...xs) + 70, Math.max(...ys) + 40]];
  }
  if (!pts) return { z: 1, x: 0, y: 0 };
  const [[x0, y0], [x1, y1]] = pts;
  const z = Math.max(1, Math.min(cap, europe.w / (x1 - x0), europe.h / (y1 - y0)));
  const fit = (c, size) => Math.min(0, Math.max(-(z - 1) * 100, (50 - (c / size) * 100 * z)));
  return { z, x: fit((x0 + x1) / 2, europe.w), y: fit((y0 + y1) / 2, europe.h) };
}

export default function BrandMap({ clusters, selected, hot, onSelect, onHover, focus = 'ALL', you, youLabel }) {
  const v = view(focus, clusters);
  return (
    <div className="map" style={{ aspectRatio: `${europe.w} / ${europe.h}` }}>
     <div className="map-stage" style={{ '--z': v.z, transform: `translate(${v.x}%, ${v.y}%) scale(${v.z})` }}>
      <svg viewBox={`0 0 ${europe.w} ${europe.h}`} aria-hidden="true"><path d={europe.d} /></svg>
      {you && (() => { const [x, y] = project(you); return <span className="pin-you" data-label={youLabel} style={{ left: (x / europe.w) * 100 + '%', top: (y / europe.h) * 100 + '%' }}><i />{youLabel}</span>; })()}
      {clusters.map((c) => {
        const on = selected === c.key;
        const lit = on || c.brands.some((b) => b.id === hot);
        return (
          <button
            key={c.key}
            className={'pin' + (on ? ' on' : '') + (lit ? ' lit' : '') + (c.x * v.z + (v.x / 100) * europe.w > europe.w * 0.72 ? ' flip' : '')}
            style={{ left: (c.x / europe.w) * 100 + '%', top: (c.y / europe.h) * 100 + '%' }}
            onClick={() => onSelect(on ? null : c.key)}
            onMouseEnter={() => onHover(c.key)} onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(c.key)} onBlur={() => onHover(null)}
            aria-pressed={on}
          >
            <span className="pin-dot">{c.brands.length > 1 ? c.brands.length : ''}</span>
            <span className="pin-label">
              <span className="pin-city">{lit ? c.names.join(', ') : c.names[0]}</span>
              <span className="pin-brands">{c.brands.map((b) => b.name).join(', ')}</span>
            </span>
          </button>
        );
      })}
     </div>
    </div>
  );
}
