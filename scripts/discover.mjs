#!/usr/bin/env node
// Find a brand's own store from its Instagram handle.
//   HANDLES="scuffers.co vicinity_de" node scripts/discover.mjs
// Tries likely domains and reads Shopify's public /meta.json (store name, country,
// currency, description, ships-to list). Prints one JSON line per store found.
const handles = (process.env.HANDLES || '').split(/[\s,]+/).filter(Boolean);
const TLDS = ['com', 'co', 'eu', 'de', 'store', 'shop', 'xyz', 'us', 'fr', 'es', 'uk', 'co.uk', 'world', 'online', 'net', 'ua', 'com.ua', 'jp', 'paris', 'it', 'pl', 'nl',
  'studio', 'clothing', 'wtf', 'cc', 'io', 'ru', 'by', 'se', 'dk', 'no', 'fi', 'at', 'ch', 'be', 'pt', 'cz', 'gr', 'ro', 'lt', 'lv', 'ee', 'ie', 'au', 'com.au', 'ca', 'supply', 'art', 'club', 'space', 'site', 'global', 'org', 'info', 'me', 'tokyo', 'berlin', 'london'];
const SUFFIX = /[._]*(us|usa|co|eu|jp|de|paris|official|store|stores|shop|worldwide|online|earth|std|clo|brand|nyc)$/;

function candidates(h) {
  const out = new Set();
  h = h.replace(/_+$/, '').replace(/__+/g, '_');
  const hint = h.match(/^(.+)\.(co|eu|jp|de|paris|online|us|store|earth|studio)$/);
  if (hint) out.add(`${hint[1].replace(/[._]/g, '')}.${hint[2]}`);
  const core = h.replace(SUFFIX, '');
  const flat = (x) => x.replace(/[._]/g, '');
  const bases = new Set([flat(h), flat(core), core.replace(/[._]/g, '-'),
    flat(h).replace(/std$/, 'studios').replace(/clo$/, 'clothing'), flat(core) + 'clothing', flat(core) + 'studios', flat(core) + 'studio',
    flat(core) + 'store', flat(core) + 'shop', flat(core) + 'official', flat(core) + 'brand', flat(core) + 'wear', flat(core).replace(/studios?$/, '')]);
  const few = ['com', 'co', 'eu', 'de', 'store', 'shop', 'net', 'us', 'online', 'xyz', 'fr', 'it', 'es', 'pl', 'ua', 'co.uk'];
  let n = 0;
  for (const b of bases) if (b.length > 2) for (const t of (n++ < 3 ? TLDS : few)) out.add(`${b}.${t}`);
  return [...out];
}

// A store that is not on Shopify: report the page title so a person can judge.
async function plain(handle, domain) {
  try {
    const res = await fetch(`https://${domain}/`, { signal: AbortSignal.timeout(7000), redirect: 'follow', headers: { 'user-agent': 'DropIndexBot/0.1 (+hobby aggregator)' } });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 200000);
    if (!/cart|basket|shop|store|корзин|кошик|warenkorb|panier/i.test(html)) return null;
    if (/domain (is )?for sale|buy this domain|parked|sedo|hugedomains|godaddy/i.test(html)) return null;
    const title = (html.match(/<title[^>]*>([^<]{0,140})/i) || [])[1] || '';
    const kind = /woocommerce/i.test(html) ? 'woocommerce' : /tilda/i.test(html) ? 'tilda' : /bigcartel/i.test(html) ? 'bigcartel' : /squarespace/i.test(html) ? 'squarespace' : /wix\.com/i.test(html) ? 'wix' : /shopify/i.test(html) ? 'shopify?' : 'other';
    return { handle, domain, site: true, kind, title: title.trim(), final: res.url };
  } catch { return null; }
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

// DOMAINS="a.com b.de" checks exact stores instead of guessing from handles.
const domains = (process.env.DOMAINS || '').split(/[\s,]+/).filter(Boolean);
const jobs = [...handles.flatMap((h) => candidates(h).map((d) => [h, d])), ...domains.map((d) => [d, d])];
const found = [];
let i = 0;
await Promise.all(Array.from({ length: 80 }, async () => {
  while (i < jobs.length) {
    const [h, d] = jobs[i++];
    const r = (await probe(h, d)) || (await plain(h, d));
    if (r) found.push(r);
  }
}));
found.sort((a, b) => a.handle.localeCompare(b.handle));
for (const f of found) console.log((f.site ? 'SITE ' : 'FOUND ') + JSON.stringify(f));
const hit = new Set(found.map((f) => f.handle));
console.log('MISSING ' + [...handles, ...domains].filter((h) => !hit.has(h)).join(' '));
