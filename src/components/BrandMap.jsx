import { useEffect, useRef, useState } from 'react';
import { cities } from '../data/cities.js';
import { MAP, project } from '../data/mapProjection.js';

export const ZOOM = 2.2;
const MAX_ZOOM = 4, STEP = 1.6;
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
export const frame = ({ zoom, cx, cy }) => (zoom <= 1
  ? { tx: 0, ty: 0 }
  : { tx: clamp(MAP.w / 2 - cx * zoom, MAP.w - MAP.w * zoom, 0), ty: clamp(MAP.h / 2 - cy * zoom, MAP.h - MAP.h * zoom, 0) });

const sizeOf = (n, zoomed, small) => (small ? (n >= 5 ? 22 : n >= 2 ? 17 : zoomed ? 10 : 7) : n >= 5 ? 26 : n >= 2 ? 20 : zoomed ? 12 : 9);

// pins: [{ key, name, x, y, n, ok, you }] in map units. The layer with the dots is scaled,
// the pins are not: each one moves to x * zoom + tx, so they keep their size while zooming.
export default function BrandMap({ pins, selected, view, onSelect, onView, focus, you, copy }) {
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
  // ── Moving around by hand. Trackpad: pinch zooms at the cursor, two fingers slide the map.
  // Mouse and touch: drag to move, two fingers pinch. While a gesture runs the map follows
  // the fingers directly (class "live" switches the fly-to transition off).
  const now = useRef(view); now.current = view;
  const [live, setLive] = useState(false);
  const calm = useRef(0);
  const touch = () => { setLive(true); clearTimeout(calm.current); calm.current = setTimeout(() => setLive(false), 200); };
  const put = (z, x, y) => {
    let zoom = clamp(z, 1, MAX_ZOOM); if (zoom < 1.03) zoom = 1;
    const nx = clamp(x, MAP.w - MAP.w * zoom, 0), ny = clamp(y, MAP.h - MAP.h * zoom, 0);
    const next = { zoom, cx: (MAP.w / 2 - nx) / zoom, cy: (MAP.h / 2 - ny) / zoom };
    now.current = next; onView(next);
  };
  const zoomAt = (z, ux, uy) => { const v = now.current, f = frame(v); z = clamp(z, 1, MAX_ZOOM); put(z, ux - ((ux - f.tx) / v.zoom) * z, uy - ((uy - f.ty) / v.zoom) * z); };
  const step = (dir) => {
    const v = now.current;
    if (dir > 0 && v.zoom === 1 && focus) return onView({ zoom: STEP, cx: focus.x, cy: focus.y });
    const f = frame(v), ux = MAP.w / 2, uy = MAP.h / 2;
    const z = clamp(dir > 0 ? v.zoom * STEP : v.zoom / STEP, 1, MAX_ZOOM);
    put(z, ux - ((ux - f.tx) / v.zoom) * z, uy - ((uy - f.ty) / v.zoom) * z);
  };
  const moved = useRef(false);
  useEffect(() => {
    const el = box.current;
    const units = (e) => { const r = el.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * MAP.w, ((e.clientY - r.top) / r.height) * MAP.h, MAP.w / r.width]; };
    const wheel = (e) => {
      const v = now.current, f = frame(v), [ux, uy, k] = units(e);
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); touch(); zoomAt(v.zoom * Math.exp(-e.deltaY * 0.012), ux, uy); return; }
      if (v.zoom === 1) return; // not zoomed: the page scrolls as usual
      const nx = clamp(f.tx - e.deltaX * k, MAP.w - MAP.w * v.zoom, 0), ny = clamp(f.ty - e.deltaY * k, MAP.h - MAP.h * v.zoom, 0);
      if (nx === f.tx && ny === f.ty) return; // at the edge: let the page scroll on
      e.preventDefault(); touch(); put(v.zoom, nx, ny);
    };
    // Safari reports a trackpad pinch as gesture events instead of ctrl + wheel
    let base = 1;
    const gStart = (e) => { e.preventDefault(); base = now.current.zoom; };
    const gChange = (e) => { e.preventDefault(); touch(); const [ux, uy] = units(e); zoomAt(base * e.scale, ux, uy); };
    const fingers = new Map();
    let travel = 0;
    const down = (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; if (!fingers.size) { travel = 0; moved.current = false; } fingers.set(e.pointerId, [e.clientX, e.clientY]); };
    const move = (e) => {
      const was = fingers.get(e.pointerId); if (!was) return;
      const v = now.current, f = frame(v), [ux, uy, k] = units(e);
      const dx = e.clientX - was[0], dy = e.clientY - was[1];
      if (fingers.size === 2) {
        const other = [...fingers.entries()].find(([id]) => id !== e.pointerId)[1];
        const before = Math.hypot(was[0] - other[0], was[1] - other[1]), after = Math.hypot(e.clientX - other[0], e.clientY - other[1]);
        fingers.set(e.pointerId, [e.clientX, e.clientY]); moved.current = true; touch();
        if (before > 0) zoomAt(v.zoom * (after / before), ux, uy);
        return;
      }
      if (v.zoom === 1) return;
      travel += Math.abs(dx) + Math.abs(dy);
      if (travel < 5) return;
      if (!moved.current) { moved.current = true; try { el.setPointerCapture(e.pointerId); } catch {} }
      fingers.set(e.pointerId, [e.clientX, e.clientY]); touch(); put(v.zoom, f.tx + dx * k, f.ty + dy * k);
    };
    const up = (e) => { fingers.delete(e.pointerId); if (moved.current) setTimeout(() => { moved.current = false; }, 0); };
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('gesturestart', gStart); el.addEventListener('gesturechange', gChange);
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('wheel', wheel); el.removeEventListener('gesturestart', gStart); el.removeEventListener('gesturechange', gChange);
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
    };
  }, []);

  const { zoom } = view;
  const { tx, ty } = frame(view);
  const zoomed = zoom >= 1.5;
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
    <div className={'dmap' + (zoom > 1 ? ' zoomed' : '') + (live ? ' live' : '')} ref={box} onClickCapture={(e) => { if (moved.current) { e.preventDefault(); e.stopPropagation(); } }} style={{ aspectRatio: `${MAP.w} / ${MAP.h}` }}>
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
        <button type="button" onClick={() => step(1)} disabled={zoom >= MAX_ZOOM} aria-label={copy.zoomIn}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg></button>
        <button type="button" onClick={() => step(-1)} disabled={zoom <= 1} aria-label={copy.zoomOut}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 8h10" /></svg></button>
      </div>
    </div>
  );
}
