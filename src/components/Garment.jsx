import { useState } from 'react';

// Placeholder artwork for items without a photo: a flat garment silhouette, no outlines.
// Monochrome on purpose; real photos replace these once the store feed is ingested.
const paths = {
  hoodie: 'M36 26 Q34 8 50 8 Q66 8 64 26 L72 28 L84 54 L74 58 L70 50 L70 88 L30 88 L30 50 L26 58 L16 54 L28 28 Z',
  tee: 'M32 18 L42 14 Q50 22 58 14 L68 18 L84 32 L74 42 L68 36 L68 86 L32 86 L32 36 L26 42 L16 32 Z',
  pants: 'M32 14 L68 14 L72 86 L56 86 L50 40 L44 86 L28 86 Z',
  jacket: 'M28 20 L42 14 L50 24 L58 14 L72 20 L84 44 L74 50 L72 46 L72 86 L52 86 L50 26 L48 86 L28 86 L28 46 L26 50 L16 44 Z',
  knit: 'M30 20 L42 16 Q50 20 58 16 L70 20 L82 46 L72 50 L70 44 L70 84 L30 84 L30 44 L28 50 L18 46 Z',
  cap: 'M22 60 Q22 30 50 30 Q78 30 78 60 L90 64 Q90 70 78 68 L22 68 Z',
  shoes: 'M14 64 L16 46 L34 46 Q44 56 60 56 L84 60 Q90 62 88 72 L14 72 Z',
  accessories: 'M28 36 L72 36 L76 86 L24 86 Z M40 36 Q40 20 50 20 Q60 20 60 36 L57 36 Q57 23 50 23 Q43 23 43 36 Z',
};
const tones = [['#f1f1f0', '#1d1f22'], ['#e9e9e8', '#ffffff'], ['#f1f1f0', '#b9babb'], ['#1d1f22', '#f1f1f0']];

export default function Garment({ item, tone = 0 }) {
  const [bg, fg] = tones[tone % tones.length];
  const [broken, setBroken] = useState(false);
  // If a photo cannot load (offline preview, blocked host), fall back to the silhouette.
  if (item.image && !broken) return <img className="tile-img" src={item.image} alt={item.title} loading="lazy" onError={() => setBroken(true)} />;
  return (
    <svg className="tile-img" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" role="img" aria-label={item.title} style={{ background: bg }}>
      <g transform="translate(50 50) scale(0.62) translate(-50 -50)">
        <path d={paths[item.category] || paths.tee} fill={fg} />
        {item.category === 'hoodie' && (
          <g fill="none" stroke={bg} strokeWidth="1.2" strokeLinecap="round">
            <path d="M40 28 Q50 36 60 28" />
            <path d="M38 66 L62 66 L58 80 L42 80 Z" />
          </g>
        )}
        {item.category === 'jacket' && <path d="M50 26 L50 86" stroke={bg} strokeWidth="1.2" />}
      </g>
    </svg>
  );
}
