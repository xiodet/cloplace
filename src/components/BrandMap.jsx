import europe from '../data/europe.json';
import { cities } from '../data/cities.js';

// Same Mercator as scripts/build-map.mjs, so pins land on the pre-drawn outlines.
const project = ([lon, lat]) => [
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

export default function BrandMap({ clusters, selected, hot, onSelect, onHover }) {
  return (
    <div className="map" style={{ aspectRatio: `${europe.w} / ${europe.h}` }}>
      <svg viewBox={`0 0 ${europe.w} ${europe.h}`} aria-hidden="true"><path d={europe.d} /></svg>
      {clusters.map((c) => {
        const on = selected === c.key;
        const lit = on || c.brands.some((b) => b.id === hot);
        return (
          <button
            key={c.key}
            className={'pin' + (on ? ' on' : '') + (lit ? ' lit' : '') + (c.x > europe.w * 0.72 ? ' flip' : '')}
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
  );
}
