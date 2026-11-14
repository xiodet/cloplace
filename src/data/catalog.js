import { brands } from './brands.js';
import demoNews from './news.demo.js';

// Data written by scripts/ingest.mjs. Missing files are fine: we fall back to demo data.
const generated = import.meta.glob('./generated/*.json', { eager: true, import: 'default' });
const genItems = (generated['./generated/items.json'] || []).filter((i) => i.price > 0);
const genNews = generated['./generated/news.json'] || [];
// Photos cached by the ingest script (optional). A cached copy wins over the remote URL.
const cached = import.meta.glob('./generated/img/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });
const cachedImage = (id) => cached[`./generated/img/${id}.jpg`] || null;

export const categories = {
  hoodie: { en: 'Hoodies', ru: 'Худи' },
  tee: { en: 'T-shirts', ru: 'Футболки' },
  pants: { en: 'Pants', ru: 'Штаны' },
  jacket: { en: 'Jackets', ru: 'Куртки' },
  knit: { en: 'Knitwear', ru: 'Трикотаж' },
  cap: { en: 'Caps', ru: 'Кепки' },
  shoes: { en: 'Shoes', ru: 'Обувь' },
  accessories: { en: 'Accessories', ru: 'Аксессуары' },
};

export const regions = {
  UA: { en: 'Ukraine', ru: 'Украина' },
  EU: { en: 'EU', ru: 'ЕС' },
  WORLD: { en: 'Worldwide', ru: 'Весь мир' },
};

import { toUAH, currencySign } from './rates.js';
export { toUAH, currencySign };

export function formatPrice(amount, currency) {
  const s = currencySign[currency] || currency + ' ';
  return currency === 'UAH' ? `${amount.toLocaleString('uk-UA')} ${s}` : `${s}${amount}`;
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

const realByBrand = new Set(genItems.map((i) => i.brandId));
export const items = [
  ...genItems,
  ...brands.filter((b) => !realByBrand.has(b.id)).flatMap(demoItemsFor),
].map((i) => ({ ...i, image: cachedImage(i.id) || i.image, priceUAH: Math.round(i.price * (toUAH[i.currency] || 1)) }));

export const news = [...genNews, ...demoNews].sort((a, b) => b.date.localeCompare(a.date));

export const brandById = Object.fromEntries(brands.map((b) => [b.id, b]));
// Brands that already have collected store data (real items and photos).
export const liveBrandIds = [...realByBrand];
export { brands };
