// DEMO news so the feed has a shape before automated collection runs.
// These are NOT real announcements. scripts/ingest.mjs writes real entries to
// src/data/generated/news.json, and every entry keeps the same shape:
// { id, brandId, type: 'drop'|'sale'|'collab'|'news', date, title{en,ru}, summary{en,ru}, source{kind,url}, demo }
const d = (daysAgo) => new Date(Date.now() - daysAgo * 864e5).toISOString().slice(0, 10);

export default [
  {
    id: 'demo-1', brandId: 'nofaith-studios', type: 'drop', date: d(1),
    title: { en: 'New winter capsule', ru: 'Новая зимняя капсула' },
    summary: { en: 'Example: a drop of heavyweight hoodies and knit beanies.', ru: 'Пример: дроп плотных худи и вязаных шапок.' },
    source: { kind: 'demo', url: null }, demo: true,
  },
  {
    id: 'demo-2', brandId: 'daily-paper', type: 'sale', date: d(2),
    title: { en: 'Season sale up to −30%', ru: 'Сезонная распродажа до −30%' },
    summary: { en: 'Example: discounts on outerwear and knitwear.', ru: 'Пример: скидки на верхнюю одежду и трикотаж.' },
    source: { kind: 'demo', url: null }, demo: true,
  },
  {
    id: 'demo-3', brandId: 'sndct-kyiv', type: 'collab', date: d(3),
    title: { en: 'Artist collaboration', ru: 'Коллаборация с художником' },
    summary: { en: 'Example: limited tees with prints by a Ukrainian artist.', ru: 'Пример: лимитированные футболки с принтами украинского художника.' },
    source: { kind: 'demo', url: null }, demo: true,
  },
  {
    id: 'demo-4', brandId: 'corteiz', type: 'drop', date: d(4),
    title: { en: 'Cargo restock', ru: 'Рестокк карго' },
    summary: { en: 'Example: restock of the signature cargo pants.', ru: 'Пример: рестокк фирменных карго.' },
    source: { kind: 'demo', url: null }, demo: true,
  },
  {
    id: 'demo-5', brandId: 'ienki-ienki', type: 'news', date: d(6),
    title: { en: 'New puffer colourways', ru: 'Новые цвета пуховиков' },
    summary: { en: 'Example: three new colours of the signature puffer.', ru: 'Пример: три новых цвета фирменного пуховика.' },
    source: { kind: 'demo', url: null }, demo: true,
  },
  {
    id: 'demo-6', brandId: 'carhartt-wip', type: 'sale', date: d(8),
    title: { en: 'Black Friday preview', ru: 'Превью Black Friday' },
    summary: { en: 'Example: early access to discounts on workwear.', ru: 'Пример: ранний доступ к скидкам на рабочую одежду.' },
    source: { kind: 'demo', url: null }, demo: true,
  },
];
