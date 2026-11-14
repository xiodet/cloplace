# Drop Index

Aggregator of Ukrainian and European streetwear brands: brand catalog, brand pages,
news feed, filters and plain-language search (RU / UA / EN). Interface in EN and RU.

## Run

```bash
npm install
npm run dev            # local dev server
npm run build          # static site in dist/ (any static host: Vercel, Netlify, GitHub Pages)
npm run build:single   # one self-contained HTML file in dist-single/
npm test               # search parser examples + offline ingest self-test
npm run ingest         # collect real items and news from src/data/sources.js
```

## How data works

| File | What it is |
|---|---|
| `src/data/brands.js` | Brand list, filled by hand. `verified` lists fields checked against a public source; everything else is a placeholder. |
| `src/data/sources.js` | Where to collect from per brand: Shopify store root and/or RSS feed. |
| `src/data/generated/*.json` | Written by `npm run ingest`. Real items (with photos and prices) and news. |
| `src/data/news.demo.js` | Demo news, marked DEMO on the site. Delete once real news flows. |

Brands without collected items show generated DEMO items so the layout can be judged.
Every demo item, price and news entry carries a yellow DEMO badge.

`.github/workflows/ingest.yml` runs the collector daily and commits new data.

### Collector
- **Shopify** stores expose `/products.json`: titles, prices, sale prices, photos, publish dates.
  New products in the last 14 days become a "drop" news item; 3+ discounted products become a "sale" item.
- **RSS/Atom** feeds become news; type (drop / sale / collab) is guessed from keywords.
- Next: Instagram (needs the official API or a bridge), Telegram channels via RSS bridge, non-Shopify stores via per-site parsers.

## Search
`src/search.js` turns a query into filters without any external API:
`худи до 3000 грн с доставкой в Киев` → category hoodie, max 3000 ₴, ships to Ukraine.
Understands categories, price ranges in ₴ / € / £ / $ ("до", "от", "2-4к", "under €60"),
shipping destination (cities and regions), brand country, returns and sales.
Currency rates for filtering are in `src/data/rates.js` (rough, to be replaced by a daily NBU feed).
