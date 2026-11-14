import { useEffect, useState } from 'react';

// Brand marks come from each store's site icon, and some of those are unusable: tiny,
// a blank square, or a wordmark cut off by the square crop. A mark is shown only if it
// passes these checks; otherwise the brand name stands alone.
const verdicts = new Map();

function inspect(img) {
  if (img.naturalWidth < 64 || img.naturalHeight < 64) return false;
  const n = 32;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, n, n);
  ctx.drawImage(img, 0, 0, n, n);
  let d;
  try { d = ctx.getImageData(0, 0, n, n).data; } catch { return true; }
  const lum = (x, y) => { const i = (y * n + x) * 4; return (d[i] * 2 + d[i + 1] * 3 + d[i + 2]) / 6; };
  let min = 255, max = 0;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const l = lum(x, y); if (l < min) min = l; if (l > max) max = l; }
  if (max - min < 40) return false; // one flat colour
  // ink running off both the left and the right edge means a cropped wordmark
  const bg = lum(0, 0);
  const edge = (x) => { let k = 0; for (let y = 4; y < n - 4; y++) if (Math.abs(lum(x, y) - bg) > 90) k++; return k; };
  if (Math.abs(lum(n - 1, 0) - bg) < 30 && edge(0) >= 2 && edge(n - 1) >= 2) return false;
  return true;
}

export default function Logo({ src, className }) {
  const [ok, setOk] = useState(src ? verdicts.get(src) : false);
  useEffect(() => {
    if (!src) return setOk(false);
    if (verdicts.has(src)) return setOk(verdicts.get(src));
    let live = true;
    const img = new Image();
    img.onload = () => { const v = inspect(img); verdicts.set(src, v); if (live) setOk(v); };
    img.onerror = () => { verdicts.set(src, false); if (live) setOk(false); };
    img.src = src;
    return () => { live = false; };
  }, [src]);
  return ok ? <img className={className} src={src} alt="" /> : null;
}
