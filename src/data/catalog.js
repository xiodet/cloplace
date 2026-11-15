import { brands as listed } from './brands.js';
import demoNews from './news.demo.js';

// Data written by scripts/ingest.mjs. Missing files are fine: we fall back to demo data.
const generated = import.meta.glob('./generated/*.json', { eager: true, import: 'default' });
const known = new Set(listed.map((b) => b.id)); // data of brands removed from the list is ignored
const genNews = (generated['./generated/news.json'] || []).filter((n) => known.has(n.brandId));
const stores = generated['./generated/stores.json'] || {};
// Photos cached by the ingest script (optional). A cached copy wins over the remote URL.
const cached = import.meta.glob('./generated/img/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });
const cachedImage = (id) => cached[`./generated/img/${id}.jpg`] || null;
// The offline preview cannot load remote photos, so it lists only items with a cached one.
const PREVIEW = import.meta.env.MODE === 'preview' || import.meta.env.MODE === 'single';
const genItems = (generated['./generated/items.json'] || []).filter((i) => known.has(i.brandId) && i.image && i.price > 0 && !/gift ?card|gutschein|e-?gift/i.test(i.title))
  .filter((i) => !PREVIEW || cachedImage(i.id));

// Brands that sell only through Instagram: their latest posts stand in for items (no price,
// the link opens the post). Collected by scripts/instagram.mjs through the official API.
const igData = generated['./generated/instagram.json'] || {};
const igPhotos = import.meta.glob('./generated/ig/*.jpg', { eager: true, import: 'default' });
const igItems = Object.entries(igData).filter(([id]) => known.has(id)).flatMap(([brandId, a]) => (a.posts || []).map((p) => ({
  id: `${brandId}-ig-${p.id}`, brandId, title: p.title || '', category: 'other', gender: 'u', price: 0, compareAt: null, currency: 'EUR',
  url: p.permalink, image: igPhotos[`./generated/ig/${brandId}-${p.id}.jpg`] || null, inStock: true, publishedAt: p.timestamp, ig: true,
}))).filter((i) => i.image);

// Brand = hand-written entry + facts the store publishes about itself (those win).
const EU = ['DE', 'FR', 'PL', 'IT', 'ES', 'NL'];
function withStore(b) {
  const st = stores[b.id];
  if (!st) return b;
  // shop behind its password page: no items, the brand page shows a countdown or a closed note
  if (st.closed) return { ...b, closed: { opensAt: st.opensAt || null, note: st.closedNote || null } };
  const ships = st.shipsTo || [];
  const shipping = [ships.includes('UA') && 'UA', EU.some((c) => ships.includes(c)) && 'EU', ships.includes('US') && ships.length > 60 && 'WORLD'].filter(Boolean);
  const out = { ...b, currency: st.currency || b.currency, shipsTo: ships.length ? ships : null };
  if (shipping.length) { out.shipping = shipping; out.verified = [...new Set([...b.verified, 'shipping'])]; }
  if (!b.returns && st.returnDays) out.returns = { days: st.returnDays };
  return out;
}
export const brands = listed.map(withStore);

export const categories = {
  tee: { en: 'T-shirts', ru: 'Футболки', uk: 'Футболки' },
  shirt: { en: 'Shirts', ru: 'Рубашки', uk: 'Сорочки' },
  hoodie: { en: 'Hoodies', ru: 'Худи', uk: 'Худі' },
  knit: { en: 'Knitwear', ru: 'Трикотаж', uk: 'Трикотаж' },
  jacket: { en: 'Jackets', ru: 'Куртки', uk: 'Куртки' },
  jeans: { en: 'Jeans', ru: 'Джинсы', uk: 'Джинси' },
  pants: { en: 'Pants', ru: 'Штаны', uk: 'Штани' },
  shorts: { en: 'Shorts', ru: 'Шорты', uk: 'Шорти' },
  skirt: { en: 'Skirts and dresses', ru: 'Юбки и платья', uk: 'Спідниці та сукні' },
  other: { en: 'Other clothing', ru: 'Другая одежда', uk: 'Інший одяг' },
  cap: { en: 'Caps', ru: 'Кепки', uk: 'Кепки' },
  shoes: { en: 'Shoes', ru: 'Обувь', uk: 'Взуття' },
  accessories: { en: 'Accessories', ru: 'Аксессуары', uk: 'Аксесуари' },
};

export const regions = {
  UA: { en: 'Ukraine', ru: 'Украина', uk: 'Україна' },
  EU: { en: 'EU', ru: 'ЕС', uk: 'ЄС' },
  WORLD: { en: 'Worldwide', ru: 'Весь мир', uk: 'Увесь світ' },
};

import { toUAH, currencySign } from './rates.js';
export { toUAH, currencySign };

// Prices are shown in the currency the visitor picked (rough rates from rates.js), rounded to whole units.
let shown = 'EUR';
export const setShownCurrency = (c) => { shown = c; };
export function formatPrice(amount, currency) {
  const v = currency === shown || !toUAH[currency] ? amount : Math.round((amount * toUAH[currency]) / toUAH[shown]);
  const c = toUAH[currency] ? shown : currency;
  const s = currencySign[c] || c + ' ';
  return c === 'UAH' ? `${Math.round(v).toLocaleString('uk-UA')} ${s}` : `${s}${v}`;
}

// ── Demo items ───────────────────────────────────────────────
// Deterministic placeholders so every brand page has something to show
// before real store data is ingested. Flagged with demo: true.
const demoNames = {
  hoodie: ['Heavyweight Hoodie', 'Logo Hoodie', 'Zip Hoodie'],
  tee: ['Box Logo Tee', 'Graphic Tee', 'Oversized Tee'],
  pants: ['Cargo Pants', 'Track Pants', 'Wide Denim'],
  jacket: ['Puffer Jacket', 'Coach Jacket', 'Work Jacket'],
  knit: ['Mohair Knit', 'Crewneck Knit'],
  cap: ['6-Panel Cap', 'Beanie'],
  shoes: ['Low Sneaker', 'Runner'],
  accessories: ['Tote Bag', 'Socks 3-Pack'],
};
// base price per category in EUR
const basePrice = { hoodie: 120, tee: 50, pants: 130, jacket: 260, knit: 180, cap: 45, shoes: 190, accessories: 30 };

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function demoItemsFor(brand) {
  const cats = Object.keys(demoNames);
  const h = hash(brand.id);
  const n = 4 + (h % 3);
  const out = [];
  const priceFactor = brand.country === 'UA' ? 0.55 : 1;
  for (let i = 0; i < n; i++) {
    const cat = cats[(h + i * 3) % cats.length];
    const names = demoNames[cat];
    const name = names[(h >>> (i + 2)) % names.length];
    const eur = Math.round(basePrice[cat] * priceFactor * (0.8 + ((h >>> i) % 40) / 100));
    const rate = toUAH[brand.currency] / toUAH.EUR;
    let price = Math.round(eur / rate);
    if (brand.currency === 'UAH') price = Math.round(price / 50) * 50;
    const onSale = (h >>> (i + 5)) % 5 === 0;
    out.push({
      id: `${brand.id}-demo-${i}`,
      brandId: brand.id,
      title: name,
      category: cat,
      price,
      compareAt: onSale ? Math.round(price * 1.3) : null,
      currency: brand.currency,
      url: brand.website,
      image: null,
      demo: true,
    });
  }
  return out;
}

const realByBrand = new Set([...genItems, ...igItems].map((i) => i.brandId));
export const items = [
  ...genItems,
  ...igItems,
  ...(genItems.length ? [] : brands).filter((b) => !realByBrand.has(b.id) && !b.closed).flatMap(demoItemsFor),
].map((i) => ({ ...i, image: cachedImage(i.id) || i.image, priceUAH: Math.round(i.price * (toUAH[i.currency] || 1)) }));

export const news = [...genNews, ...demoNews].sort((a, b) => b.date.localeCompare(a.date));

export const brandById = Object.fromEntries(brands.map((b) => [b.id, b]));
// Brands that already have collected store data (real items and photos).
// Logo mark and campaign photo collected from the brand's own site, when available.
export function brandMedia(id) {
  const find = (kind) => ['png', 'jpg', 'webp'].map((e) => cached[`./generated/img/_${kind}-${id}.${e}`]).find(Boolean) || null;
  return { logo: find('logo'), hero: find('hero') };
}
export const liveBrandIds = [...realByBrand];
