import { useEffect, useRef, useState } from 'react';
import { cities } from '../data/cities.js';
import { MAP, project } from '../data/mapProjection.js';

export const ZOOM = 2.2;
const MAJOR = ['Cologne', 'Frankfurt', 'Manchester', 'Copenhagen']; // on a tie the bigger city gives the pin its name
const NEAR = 12; // towns closer than this many map units share one pin

// Towns that would sit on top of each other share a pin, named after the town with the most brands.
export function clusterBrands(brands) {
  const byCity = {};
  for (const b of brands) if (cities[b.city]) (byCity[b.city] ||= []).push(b);
  const towns = Object.entries(byCity)
    .map(([name, list]) => { const [x, y] = project(cities[name]); return { name, list, x, y }; })
    .sort((a, b) => b.list.length - a.list.length || MAJOR.includes(b.name) - MAJOR.includes(a.name) || a.name.localeCompare(b.name));
  const clusters = [];
  for (const t of towns) {
    const home = clusters.find((c) => Math.hypot(c.x - t.x, c.y - t.y) < NEAR);
    if (home) { home.names.push(t.name); home.brands.push(...t.list); }
    else clusters.push({ key: t.name, name: t.name, names: [t.name], geo: cities[t.name], country: t.list[0].country, x: t.x, y: t.y, brands: [...t.list] });
  }
  for (const c of clusters) c.brands.sort((a, b) => a.name.localeCompare(b.name));
  return clusters;
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// Where the map layer sits for a zoom centred on (cx, cy), never showing empty space past an edge.
export const frame = ({ zoom, cx, cy }) => (zoom === 1
  ? { tx: 0, ty: 0 }
  : { tx: clamp(MAP.w / 2 - cx * zoom, MAP.w - MAP.w * zoom, 0), ty: clamp(MAP.h / 2 - cy * zoom, MAP.h - MAP.h * zoom, 0) });

const sizeOf = (n, zoomed, small) => (small ? (n >= 5 ? 22 : n >= 2 ? 17 : zoomed ? 10 : 7) : n >= 5 ? 26 : n >= 2 ? 20 : zoomed ? 12 : 9);

// pins: [{ key, name, x, y, n, ok, you }] in map units. The layer with the dots is scaled,
// the pins are not: each one moves to x * zoom + tx, so they keep their size while zooming.
export default function BrandMap({ pins, selected, view, onSelect, onZoomIn, onReset, you, copy }) {
  const box = useRef(null);
  const [width, setWidth] = useState(MAP.w);
  useEffect(() => {
    const el = box.current;
    const read = () => setWidth(el.clientWidth || MAP.w);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { zoom } = view;
  const { tx, ty } = frame(view);
  const zoomed = zoom > 1;
  const at = (x, y) => [x * zoom + tx, y * zoom + ty];
  const pct = ([x, y]) => ({ left: (x / MAP.w) * 100 + '%', top: (y / MAP.h) * 100 + '%' });

  // Labels: the selected city, yours, then the biggest first; one that would cover another is dropped.
  const px = width / MAP.w;
  const small = width < 520;
  const hits = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
  // every pin is an obstacle too, so a label never lies over a neighbouring city
  const placed = pins.filter((p) => p.ok).map((p) => { const [x, y] = at(p.x, p.y).map((v) => v * px); const h = sizeOf(p.n, zoomed, small) / 2 + 2; return { key: p.key, l: x - h, r: x + h, t: y - h, b: y + h }; });
  const labels = {};
  const wanted = pins
    .filter((p) => p.ok && (p.n >= 2 || p.key === selected || p.you || zoomed))
    .sort((a, b) => (b.key === selected) - (a.key === selected) || (b.you ? 1 : 0) - (a.you ? 1 : 0) || b.n - a.n);
  for (const p of wanted) {
    const [x, y] = at(p.x, p.y).map((v) => v * px);
    if (x < 0 || y < 0 || x > width || y > MAP.h * px) continue;
    const text = p.you ? `${p.name} · ${copy.you}` : p.name;
    const w = text.length * 6.7 + 12, gap = sizeOf(p.n, zoomed, small) / 2 + 6;
    const side = (flip) => ({ flip, l: flip ? x - gap - w : x + gap, r: flip ? x - gap : x + gap + w, t: y - 9, b: y + 9 });
    const free = (r) => r.l > 2 && r.r < width - 2 && !placed.some((q) => q.key !== p.key && hits(r, q));
    const right = side(false), left = side(true);
    const rect = free(right) ? right : free(left) ? left : p.key === selected ? (right.r < width - 2 ? right : left) : null;
    if (!rect) continue;
    placed.push(rect);
    labels[p.key] = { text, flip: rect.flip };
  }

  return (
    <div className={'dmap' + (zoomed ? ' zoomed' : '')} ref={box} style={{ aspectRatio: `${MAP.w} / ${MAP.h}` }}>
      <div className="dmap-layer" style={{ transform: `translate(${(tx / MAP.w) * 100}%, ${(ty / MAP.h) * 100}%) scale(${zoom})` }}>
        <img src={import.meta.env.BASE_URL + 'europe-dots.svg'} alt="" draggable="false" />
      </div>
      {you && !pins.some((p) => p.you) && (
        <span className="dpin-me" style={pct(at(you.x, you.y))}><i /><em>{copy.you}</em></span>
      )}
      {pins.map((p) => {
        const size = sizeOf(p.n, zoomed, small), hit = Math.max(size + 8, 24), label = labels[p.key];
        return (
          <button
            key={p.key} type="button"
            className={'dpin' + (p.key === selected ? ' on' : '') + (p.you ? ' you' : '') + (p.ok ? '' : ' off')}
            style={{ ...pct(at(p.x, p.y)), width: hit, height: hit, '--s': size + 'px', zIndex: p.key === selected ? 6 : p.n >= 5 ? 4 : p.n >= 2 ? 3 : 2 }}
            aria-label={`${p.name}, ${copy.brands(p.n)}`} aria-pressed={p.key === selected}
            tabIndex={p.ok ? 0 : -1} onClick={() => onSelect(p.key)}
          >
            <span className="dpin-dot">{p.n >= 2 ? p.n : ''}</span>
            {label && <span className={'dpin-label' + (label.flip ? ' flip' : '')}>{label.text}</span>}
          </button>
        );
      })}
      <div className="dmap-legend" aria-hidden="true">
        <span><i style={{ '--s': sizeOf(1, false, small) + 'px' }} />{copy.leg1}</span>
        <span><i style={{ '--s': sizeOf(2, false, small) + 'px' }} />2–4</span>
        <span><i style={{ '--s': sizeOf(5, false, small) + 'px' }} />5+</span>
      </div>
      <div className="dmap-zoom">
        <button type="button" onClick={onZoomIn} disabled={zoomed} aria-label={copy.zoomIn}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg></button>
        <button type="button" onClick={onReset} disabled={!zoomed} aria-label={copy.zoomOut}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 8h10" /></svg></button>
      </div>
    </div>
  );
}
