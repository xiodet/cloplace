#!/usr/bin/env node
// Automatic collection of items and news.
//
//   node scripts/ingest.mjs            → fetch every source in src/data/sources.js
//   node scripts/ingest.mjs --fixture  → run against local fixtures (offline self-test)
//
// Writes src/data/generated/items.json and news.json. The site falls back to demo
// data for any brand without collected items. News is merged with the previous run,
// so the feed keeps its history.
import { readFile, writeFile, mkdir, rm, readdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brands } from '../src/data/brands.js';
import sources from '../src/data/sources.js';
import { categoryWords } from '../src/search.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = process.argv.includes('--fixture');
const outDir = FIXTURE ? join(root, 'scripts/fixtures/out') : join(root, 'src/data/generated');
const NEW_DAYS = 14;
// --images: keep a small local copy of the first photo of the newest items (used by offline previews)
const IMAGES = process.argv.includes('--images');
const IMAGE_QUOTA = { clothes: 6, acc: 2, shoes: 3 }; // photos cached per brand for the offline preview
const ITEMS_PER_BRAND = 120; // newest items kept per brand, so the site stays light
const now = FIXTURE ? new Date('2026-11-14T00:00:00Z') : new Date();

// Latin words must start a word ("steel" is not a "tee"); short ones must also end it ("baggy" is not a "bag").
function hasWord(s, w) {
  w = w.trim();
  if (!/^[a-z-]+$/.test(w)) return s.includes(w);
  return new RegExp(`(^|[^a-z])${w}${w.length <= 4 ? '(s|es)?([^a-z]|$)' : ''}`).test(s);
}
const extraWords = {
  hoodie: ['crewneck', 'crew neck', 'pullover', 'hooded', 'tracksuit', 'sudadera', 'zipper', 'twinset'],
  tee: ['shirt', 'polo', 'jersey', 'tank', 'top', 'dress', 'bodysuit', 'singlet', 'long sleeve', 'short sleeve', 'camiseta', 'chemise', 'tanktop', 'rugby', 'flannel', 'body', 'bralette', 'maglia', 'camisa', 'corset'],
  pants: ['jogger', 'short', 'skirt', 'legging', 'jorts', 'pant', 'chino', 'bottom', 'sweatpant', 'sweatshort', 'trackpant', 'swimshort', 'jean', 'pantalon', 'pantalón', 'panttalón', 'hose', 'suit', 'workpant'],
  jacket: ['vest', 'gilet', 'parka', 'fleece', 'windbreaker', 'blazer', 'anorak', 'overshirt', 'shell', 'chaqueta', 'cortavientos', 'veste', 'jacke', 'manteau', 'doudoune', 'poncho'],
  cap: ['gorra', 'casquette', 'bonnet', 'balaclava', 'bucket', 'gorro', 'panama'],
  knit: ['turtleneck', 'pull'],
  shoes: ['boot', 'jordan', 'asics', 'adistar', 'air max', 'dunk', 'samba', 'zapatilla', 'chaussure', 'loafer', 'footwear', 'trainer', 'sandal', 'slide', 'mule', 'derby', 'slipper', 'clog'],
  accessories: ['belt', 'wallet', 'scarf', 'glove', 'jewel', 'necklace', 'ring', 'bracelet', 'earring', 'sunglass', 'eyewear', 'keychain', 'sock', 'backpack', 'pouch', 'cardholder', 'lighter', 'sticker', 'poster', 'candle', 'towel', 'umbrella', 'insole', 'lace', 'underwear', 'boxer', 'panty', 'bandana', 'tie', 'pendant', 'spray', 'mug', 'deck', 'brush', 'bufanda', 'calcetin', 'chaussette', 'echarpe', 'décapsuleur', 'voiture', 'duffle', 'musette', 'ceinture', 'sacoche', 'handbag', 'holdall', 'carabiner', 'charm', 'pin', 'chain'],
};
// The store's own product type is the best hint, then the title, then the tags.
function guessCategory(type, title, tags, fallback = 'other') {
  for (const text of [type, title, tags]) {
    const s = String(text || '').toLowerCase();
    if (!s) continue;
    for (const [cat, words] of Object.entries(categoryWords)) if ([...words, ...(extraWords[cat] || [])].some((w) => hasWord(s, w))) return cat;
  }
  return fallback; // nothing recognisable: plain clothing for a clothing brand, accessories for a jewellery one
}

function guessNewsType(text) {
  const s = text.toLowerCase();
  if (/(sale|discount|% off|−\d|-\d+%|скидк|знижк|распрод|розпрод|black friday)/.test(s)) return 'sale';
  if (/(collab|x |коллаб|колаб|in collaboration)/.test(s)) return 'collab';
  if (/(drop|release|launch|collection|capsule|дроп|релиз|колекц|коллекц|капсул)/.test(s)) return 'drop';
  return 'news';
}

async function fetchText(url) {
  if (FIXTURE) {
    const name = url.includes('products.json') ? 'shopify-products.json' : 'feed.xml';
    return readFile(join(root, 'scripts/fixtures', name), 'utf8');
  }
  const res = await fetch(url, { headers: { 'user-agent': 'DropIndexBot/0.1 (+hobby aggregator)' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// Store facts published by Shopify itself: country, city, currency, ships-to list.
async function storeInfo(base) {
  const root = base.replace(/\/$/, '');
  const m = JSON.parse(await fetchText(root + '/meta.json'));
  const info = { name: m.name, country: m.country, city: m.city, currency: m.currency, shipsTo: m.ships_to_countries || [] };
  // Return window: first "N days" mentioned in the refund policy. A guess, shown as unverified.
  try {
    const policy = (await fetchText(root + '/policies/refund-policy')).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ');
    const hit = policy.match(/(\d{1,2})\s*[- ]?\s*(?:calendar |business |working )?(?:days|day|tage|tagen|jours|días|dias|giorni|dni|днів|дней|дня)/i);
    if (hit && +hit[1] >= 7 && +hit[1] <= 60) info.returnDays = +hit[1];
  } catch {}
  // The product feed is priced in the currency the store shows this visitor, which can differ from the shop's own.
  try {
    const hit = (await fetchText(root + '/')).match(/Shopify\.currency\s*=\s*\{\s*"active"\s*:\s*"([A-Z]{3})"/);
    if (hit) info.priced = hit[1];
  } catch {}
  return info;
}

async function shopify(brand, base, currency, fallback) {
  const data = JSON.parse(await fetchText(base.replace(/\/$/, '') + '/products.json?limit=250'));
  return (data.products || []).slice(0, ITEMS_PER_BRAND * 2).filter((p) => p.variants?.some((v) => parseFloat(v.price) > 0) && !/gift ?card|gutschein|e-?gift/i.test(p.title)).map((p) => {
    const prices = p.variants.map((v) => parseFloat(v.price)).filter((n) => !isNaN(n));
    const compare = p.variants.map((v) => parseFloat(v.compare_at_price)).filter((n) => !isNaN(n));
    const price = Math.min(...prices);
    const compareAt = compare.length ? Math.max(...compare) : null;
    return {
      id: `${brand.id}-${p.handle}`,
      brandId: brand.id,
      title: p.title,
      category: guessCategory(p.product_type, p.title, (Array.isArray(p.tags) ? p.tags : [p.tags]).join(' '), fallback),
      price,
      compareAt: compareAt && compareAt > price ? compareAt : null,
      currency: currency || brand.currency,
      url: `${base.replace(/\/$/, '')}/products/${p.handle}`,
      image: p.images?.[0]?.src || null,
      inStock: p.variants.some((v) => v.available !== false),
      publishedAt: p.published_at || p.created_at,
    };
  }).slice(0, ITEMS_PER_BRAND);
}

const plural = (n, one, few, many) => (n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? few : many);
function newsFromItems(brand, items) {
  const out = [];
  const cutoff = new Date(now - NEW_DAYS * 864e5);
  const fresh = items.filter((i) => i.publishedAt && new Date(i.publishedAt) > cutoff);
  if (fresh.length) {
    const date = fresh.map((i) => i.publishedAt).sort().at(-1).slice(0, 10);
    const names = fresh.slice(0, 3).map((i) => i.title).join(', ');
    out.push({
      id: `${brand.id}-drop-${date}`, brandId: brand.id, type: 'drop', date,
      title: { en: `New in store: ${fresh.length}`, ru: `Новинки в магазине: ${fresh.length}`, uk: `Новинки в магазині: ${fresh.length}` },
      summary: { en: `New in: ${names}${fresh.length > 3 ? '…' : ''}`, ru: `Новинки: ${names}${fresh.length > 3 ? '…' : ''}`, uk: `Новинки: ${names}${fresh.length > 3 ? '…' : ''}` },
      source: { kind: 'shopify', url: fresh[0].url },
    });
  }
  const sale = items.filter((i) => i.compareAt);
  if (sale.length >= 3) {
    const maxOff = Math.max(...sale.map((i) => Math.round((1 - i.price / i.compareAt) * 100)));
    const week = now.toISOString().slice(0, 10);
    out.push({
      id: `${brand.id}-sale-${week.slice(0, 7)}`, brandId: brand.id, type: 'sale', date: week,
      title: { en: `Sale: up to −${maxOff}%`, ru: `Скидки до −${maxOff}%`, uk: `Знижки до −${maxOff}%` },
      summary: { en: `${sale.length} items discounted.`, ru: `${sale.length} ${plural(sale.length, 'вещь', 'вещи', 'вещей')} со скидкой.`, uk: `${sale.length} ${plural(sale.length, 'річ', 'речі', 'речей')} зі знижкою.` },
      source: { kind: 'shopify', url: sale[0].url },
    });
  }
  return out;
}

async function rss(brand, url) {
  const xml = await fetchText(url);
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/g) || [];
  const pick = (b, tag) => {
    const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
    return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim() : '';
  };
  return blocks.slice(0, 20).map((b) => {
    const title = pick(b, 'title');
    const link = pick(b, 'link') || (b.match(/<link[^>]*href="([^"]+)"/) || [])[1] || null;
    const date = new Date(pick(b, 'pubDate') || pick(b, 'published') || pick(b, 'updated') || now).toISOString().slice(0, 10);
    const desc = pick(b, 'description') || pick(b, 'summary');
    const text = desc.slice(0, 220);
    // Original language is kept for both locales; translation can be added later.
    return {
      id: `${brand.id}-rss-${createHash('sha1').update(link || title).digest('hex').slice(0, 12)}`,
      brandId: brand.id, type: guessNewsType(title + ' ' + desc), date,
      title: { en: title, ru: title }, summary: { en: text, ru: text },
      source: { kind: 'rss', url: link },
    };
  });
}

async function cacheImages(items) {
  const dir = join(outDir, 'img');
  await mkdir(dir, { recursive: true });
  const perBrand = {};
  const keep = new Set();
  let saved = 0;
  for (const it of items) {
    if (!it.image) continue;
    // a few photos of each kind, so the preview can show clothing, accessories and shoes separately
    const kind = it.category === 'shoes' ? 'shoes' : ['accessories', 'cap'].includes(it.category) ? 'acc' : 'clothes';
    const key = it.brandId + ':' + kind;
    perBrand[key] = (perBrand[key] || 0) + 1;
    if (perBrand[key] > IMAGE_QUOTA[kind]) continue;
    const file = join(dir, it.id + '.jpg');
    keep.add(it.id + '.jpg');
    try { await readFile(file); continue; } catch {}
    try {
      const url = it.image + (it.image.includes('?') ? '&' : '?') + 'width=480&format=jpg';
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await writeFile(file, Buffer.from(await res.arrayBuffer()));
      saved++;
    } catch (e) { console.log(`✗ image ${it.id}: ${e.message}`); }
  }
  // drop photos of items that are no longer in the cached set, and unused cover images
  let dropped = 0;
  for (const f of await readdir(dir)) {
    if (f.startsWith('_logo-') || keep.has(f)) continue;
    await unlink(join(dir, f)); dropped++;
  }
  console.log(`→ ${saved} new images cached, ${dropped} stale removed`);
}

// Brand visuals from the store's homepage: logo mark (site icon) and a campaign photo (og:image).
async function brandMedia(brand, base) {
  const dir = join(outDir, 'img');
  await mkdir(dir, { recursive: true });
  const html = await fetchText(base);
  const abs = (u) => new URL(u.replace(/&amp;/g, '&'), base).href;
  const attr = (tag, name) => (tag.match(new RegExp(name + '=["\']([^"\']+)["\']')) || [])[1];
  const links = html.match(/<link[^>]+>/g) || [];
  const icon = links.find((l) => /rel=["']apple-touch-icon/.test(l)) || links.find((l) => /rel=["'](shortcut )?icon["']/.test(l));
  const og = (html.match(/<meta[^>]+property=["']og:image(:secure_url)?["'][^>]*>/) || [])[0];
  const out = {};
  const save = async (kind, url) => {
    const res = await fetch(url, { headers: { 'user-agent': 'DropIndexBot/0.1 (+hobby aggregator)' }, signal: AbortSignal.timeout(20000) });
    const type = res.headers.get('content-type') || '';
    const ext = type.includes('png') ? 'png' : type.includes('jpeg') ? 'jpg' : type.includes('webp') ? 'webp' : null;
    if (!res.ok || !ext) throw new Error(`${kind}: HTTP ${res.status} ${type}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > 1_500_000) throw new Error(`${kind}: too large (${bytes.length} bytes)`);
    await writeFile(join(dir, `_${kind}-${brand.id}.${ext}`), bytes);
    out[kind] = true;
  };
  if (icon && attr(icon, 'href')) {
    // Shopify serves icons at 32px by default; ask for a larger render.
    const url = abs(attr(icon, 'href')).replace(/([?&])width=\d+/, '$1width=256').replace(/([?&])height=\d+/, '$1height=256');
    await save('logo', url).catch((e) => console.log(`✗ ${brand.id} ${e.message}`));
  }
  if (false && og && attr(og, 'content')) { // cover images are not used by the site any more
    let url = abs(attr(og, 'content'));
    if (/cdn\.shopify\.com|\/cdn\/shop\//.test(url)) url = url.replace(/([?&])width=\d+/, '$1width=1400');
    await save('hero', url).catch((e) => console.log(`✗ ${brand.id} ${e.message}`));
  }
  return out;
}

async function readJSON(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return fallback; }
}

async function main() {
  const srcs = FIXTURE ? { 'scuffers': { shopify: 'https://fixture.test', rss: 'https://fixture.test/feed' } } : sources;
  const items = [];
  const stores = {};
  let news = [];
  if (IMAGES && !FIXTURE) await rm(join(outDir, 'img'), { recursive: true, force: true }); // photos are re-collected each run
  const report = [];
  for (const brand of brands) {
    const s = srcs[brand.id];
    if (!s) continue;
    if (s.shopify) {
      try {
        const info = FIXTURE ? null : await storeInfo(s.shopify).catch((e) => (report.push(`✗ ${brand.id} store info: ${e.message}`), null));
        if (info) stores[brand.id] = info;
        const its = await shopify(brand, s.shopify, info?.priced || info?.currency, s.mostly);
        if (info?.priced && info.priced !== info.currency) report.push(`• ${brand.id}: feed priced in ${info.priced}, shop currency ${info.currency}`);
        items.push(...its);
        news.push(...newsFromItems(brand, its));
        report.push(`✓ ${brand.id} shopify: ${its.length} items`);
        if (IMAGES && !FIXTURE) {
          const m = await brandMedia(brand, s.shopify).catch((e) => (report.push(`✗ ${brand.id} media: ${e.message}`), {}));
          report.push(`  ${brand.id} media: ${Object.keys(m).join(', ') || 'none'}`);
        }
      } catch (e) { report.push(`✗ ${brand.id} shopify: ${e.message}`); }
    }
    if (s.rss) {
      try {
        const n = await rss(brand, s.rss);
        news.push(...n);
        report.push(`✓ ${brand.id} rss: ${n.length} posts`);
      } catch (e) { report.push(`✗ ${brand.id} rss: ${e.message}`); }
    }
  }
  // merge with previous news so history survives; newest version of an id wins
  const prev = FIXTURE ? [] : await readJSON(join(outDir, 'news.json'), []);
  const known = new Set(brands.map((b) => b.id));
  const byId = new Map(prev.filter((n) => known.has(n.brandId)).map((n) => [n.id, n]));
  for (const n of news) byId.set(n.id, n);
  news = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 500);

  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'items.json'), JSON.stringify(items, null, 1));
  if (!FIXTURE) await writeFile(join(outDir, 'stores.json'), JSON.stringify(stores, null, 1));
  await writeFile(join(outDir, 'news.json'), JSON.stringify(news, null, 1));
  if (IMAGES && !FIXTURE) await cacheImages(items);
  console.log(report.join('\n'));
  console.log(`→ ${items.length} items, ${news.length} news written to ${outDir}`);

  if (FIXTURE) {
    const assert = (c, m) => { if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
    assert(items.length === 3, 'expected 3 items');
    assert(items.find((i) => i.title.includes('Hoodie')).category === 'hoodie', 'hoodie category');
    assert(items.find((i) => i.title.includes('Hoodie')).compareAt === 150, 'compare price');
    assert(news.some((n) => n.type === 'drop' && n.title.en === 'New in store: 2'), 'drop news from fresh products');
    assert(news.some((n) => n.source.kind === 'rss' && n.type === 'sale'), 'rss sale post');
    assert(news.some((n) => n.source.kind === 'rss' && n.type === 'collab'), 'rss collab post');
    console.log('fixture test passed');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
