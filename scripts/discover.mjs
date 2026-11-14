#!/usr/bin/env node
// Find a brand's own store from its Instagram handle.
//   HANDLES="scuffers.co vicinity_de" node scripts/discover.mjs
// Tries likely domains and reads Shopify's public /meta.json (store name, country,
// currency, description, ships-to list). Prints one JSON line per store found.
const handles = (process.env.HANDLES || '').split(/[\s,]+/).filter(Boolean);
const TLDS = ['com', 'co', 'eu', 'de', 'store', 'shop', 'xyz', 'us', 'fr', 'es', 'uk', 'co.uk', 'world', 'online', 'net', 'ua', 'com.ua', 'jp', 'paris', 'it', 'pl', 'nl'];
const SUFFIX = /[._](us|usa|co|eu|jp|de|paris|official|store|worldwide|online|earth|std)$/;

function candidates(h) {
  const out = new Set();
  const hint = h.match(/^(.+)\.(co|eu|jp|de|paris|online|us|store|earth)$/);
  if (hint) out.add(`${hint[1].replace(/[._]/g, '')}.${hint[2]}`);
  const bases = new Set([h.replace(/[._]/g, ''), h.replace(SUFFIX, '').replace(/[._]/g, ''), h.replace(SUFFIX, '').replace(/[._]/g, '-')]);
  for (const b of bases) if (b.length > 2) for (const t of TLDS) out.add(`${b}.${t}`);
  return [...out];
}

async function probe(handle, domain) {
  try {
    const res = await fetch(`https://${domain}/meta.json`, { signal: AbortSignal.timeout(7000), redirect: 'follow', headers: { 'user-agent': 'DropIndexBot/0.1 (+hobby aggregator)' } });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) return null;
    const m = await res.json();
    if (!m.name || !m.currency) return null;
    return { handle, domain, name: m.name, country: m.country, city: m.city, currency: m.currency, description: (m.description || '').slice(0, 300), ships: (m.ships_to_countries || []).length, shipsUA: (m.ships_to_countries || []).includes('UA'), products: m.published_products_count };
  } catch { return null; }
}

const jobs = handles.flatMap((h) => candidates(h).map((d) => [h, d]));
const found = [];
let i = 0;
await Promise.all(Array.from({ length: 40 }, async () => {
  while (i < jobs.length) {
    const [h, d] = jobs[i++];
    const r = await probe(h, d);
    if (r) found.push(r);
  }
}));
found.sort((a, b) => a.handle.localeCompare(b.handle));
for (const f of found) console.log('FOUND ' + JSON.stringify(f));
const hit = new Set(found.map((f) => f.handle));
console.log('MISSING ' + handles.filter((h) => !hit.has(h)).join(' '));
