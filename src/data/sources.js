// Where the ingest script collects data from, per brand.
//   shopify: store root; the script reads /products.json, /meta.json and the refund policy
//   rss:     any RSS/Atom feed (brand blog, news page, Telegram-to-RSS bridge, etc.)
// All stores below answered on 2026-11-14 (found with scripts/discover.mjs).
export default {
  'antisocial-laboratory': { shopify: 'https://antisocialaboratory.online' },
  'fwwproject': { shopify: 'https://fwwpjct.com' },
  'nofaith-studios': { shopify: 'https://nofaithstudios.com' },
  'society-de-nobodies': { shopify: 'https://societydenobodies.com' },
  'club-de-presage': { shopify: 'https://clubpresage.com' },
  'divention': { shopify: 'https://divention.de' },
  'obvune': { shopify: 'https://obvune.com' },
  '2819-jewelry': { shopify: 'https://2819jewelry.de' },
  'scuffers': { shopify: 'https://scuffers.com' },
  'racer-worldwide': { shopify: 'https://racerworldwide.net' },
  'lomalab': { shopify: 'https://lomalab.store' },
  'lkc2000': { shopify: 'https://lostkidsclub2000.com' },
  'jaded-london': { shopify: 'https://jadedman.com' },
  'undersoul': { shopify: 'https://undersoulwear.com' },
  'monateo': { shopify: 'https://monateo.com' },
};
