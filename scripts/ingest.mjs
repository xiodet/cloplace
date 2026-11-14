#!/usr/bin/env node
// Automatic collection of items and news.
//
//   node scripts/ingest.mjs            → fetch every source in src/data/sources.js
//   node scripts/ingest.mjs --fixture  → run against local fixtures (offline self-test)
//
// Writes src/data/generated/items.json and news.json. The site falls back to demo
// data for any brand without collected items. News is merged with the previous run,
// so the feed keeps its history.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
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
const IMAGES_PER_BRAND = 12;
const now = FIXTURE ? new Date('2026-11-14T00:00:00Z') : new Date();

function guessCategory(text) {
  const s = ' ' + text.toLowerCase() + ' ';
  for (const [cat, words] of Object.entries(categoryWords)) if (words.some((w) => s.includes(w))) return cat;
  return 'accessories';
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

async function shopify(brand, base) {
  const data = JSON.parse(await fetchText(base.replace(/\/$/, '') + '/products.json?limit=250'));
  return (data.products || []).filter((p) => p.variants?.some((v) => parseFloat(v.price) > 0)).map((p) => {
    const prices = p.variants.map((v) => parseFloat(v.price)).filter((n) => !isNaN(n));
    const compare = p.variants.map((v) => parseFloat(v.compare_at_price)).filter((n) => !isNaN(n));
    const price = Math.min(...prices);
    const compareAt = compare.length ? Math.max(...compare) : null;
    return {
      id: `${brand.id}-${p.handle}`,
      brandId: brand.id,
      title: p.title,
      category: guessCategory(`${p.product_type} ${p.title} ${(p.tags || []).join(' ')}`),
      price,
      compareAt: compareAt && compareAt > price ? compareAt : null,
      currency: brand.currency,
      url: `${base.replace(/\/$/, '')}/products/${p.handle}`,
      image: p.images?.[0]?.src || null,
      inStock: p.variants.some((v) => v.available !== false),
      publishedAt: p.published_at || p.created_at,
    };
  });
}

function newsFromItems(brand, items) {
  const out = [];
  const cutoff = new Date(now - NEW_DAYS * 864e5);
  const fresh = items.filter((i) => i.publishedAt && new Date(i.publishedAt) > cutoff);
  if (fresh.length) {
    const date = fresh.map((i) => i.publishedAt).sort().at(-1).slice(0, 10);
    const names = fresh.slice(0, 3).map((i) => i.title).join(', ');
    out.push({
      id: `${brand.id}-drop-${date}`, brandId: brand.id, type: 'drop', date,
      title: { en: `New in store: ${fresh.length}`, ru: `Новинки в магазине: ${fresh.length}` },
      summary: { en: `New in: ${names}${fresh.length > 3 ? '…' : ''}`, ru: `Новинки: ${names}${fresh.length > 3 ? '…' : ''}` },
      source: { kind: 'shopify', url: fresh[0].url },
    });
  }
  const sale = items.filter((i) => i.compareAt);
  if (sale.length >= 3) {
    const maxOff = Math.max(...sale.map((i) => Math.round((1 - i.price / i.compareAt) * 100)));
    const week = now.toISOString().slice(0, 10);
    out.push({
      id: `${brand.id}-sale-${week.slice(0, 7)}`, brandId: brand.id, type: 'sale', date: week,
      title: { en: `Sale: up to −${maxOff}%`, ru: `Скидки до −${maxOff}%` },
      summary: { en: `${sale.length} items discounted.`, ru: `${sale.length} вещей со скидкой.` },
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
  let saved = 0;
  for (const it of items) {
    if (!it.image) continue;
    perBrand[it.brandId] = (perBrand[it.brandId] || 0) + 1;
    if (perBrand[it.brandId] > IMAGES_PER_BRAND) continue;
    const file = join(dir, it.id + '.jpg');
    try { await readFile(file); continue; } catch {}
    try {
      const url = it.image + (it.image.includes('?') ? '&' : '?') + 'width=640&format=jpg';
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await writeFile(file, Buffer.from(await res.arrayBuffer()));
      saved++;
    } catch (e) { console.log(`✗ image ${it.id}: ${e.message}`); }
  }
  console.log(`→ ${saved} new images cached`);
}

async function readJSON(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return fallback; }
}

async function main() {
  const srcs = FIXTURE ? { 'represent': { shopify: 'https://fixture.test', rss: 'https://fixture.test/feed' } } : sources;
  const items = [];
  let news = [];
  const report = [];
  for (const brand of brands) {
    const s = srcs[brand.id];
    if (!s) continue;
    if (s.shopify) {
      try {
        const its = await shopify(brand, s.shopify);
        items.push(...its);
        news.push(...newsFromItems(brand, its));
        report.push(`✓ ${brand.id} shopify: ${its.length} items`);
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
  const byId = new Map(prev.map((n) => [n.id, n]));
  for (const n of news) byId.set(n.id, n);
  news = [...byId.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 500);

  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'items.json'), JSON.stringify(items, null, 1));
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
