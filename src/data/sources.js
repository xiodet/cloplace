// Where the ingest script collects data from, per brand.
//   shopify: store root; the script reads <root>/products.json (public on most Shopify stores)
//   rss:     any RSS/Atom feed (brand blog, news page, Telegram-to-RSS bridge, etc.)
// Candidates below are unverified guesses: the script skips any source that fails,
// and logs it so it can be fixed or removed.
export default {
  'nofaith-studios': { shopify: 'https://nofaithstudios.com' }, // verified 2026-11-14
  'represent': { shopify: 'https://representclo.com' },
  'broken-planet': { shopify: 'https://brokenplanet.com' },
  'daily-paper': { shopify: 'https://www.dailypaperclothing.com' },
  'olaf-hussein': { shopify: 'https://olafhussein.com' },
  'arte-antwerp': { shopify: 'https://arte-antwerp.com' },
  'helas': { shopify: 'https://helascaps.com' },
  'drole-de-monsieur': { shopify: 'https://drolemonsieur.com' },
  'places-faces': { shopify: 'https://www.placesplusfaces.com' },
  'ienki-ienki': { shopify: 'https://ienkiienki.com' },
  'ksenia-schnaider': { shopify: 'https://kseniaschnaider.com' },
};
