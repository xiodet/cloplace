// Natural-language query parser (RU / UA / EN), rule based, no external API.
// "худи до 3000 грн с доставкой в Киев"  →  { category: 'hoodie', maxUAH: 3000, ship: 'UA' }
// "ukrainian tee under €60 with returns" →  { category: 'tee', maxUAH: 2700, country: 'UA', returns: true }
import { toUAH } from './data/rates.js';

export const categoryWords = {
  hoodie: ['худи', 'худак', 'толстовк', 'кофт', 'свитшот', 'hoodie', 'hoody', 'sweatshirt', 'zip'],
  tee: ['футболк', 'тишк', 'майк', 't-shirt', 'tshirt', 'tee', 'лонгслив', 'longsleeve'],
  pants: ['штан', 'брюк', 'джинс', 'карго', 'pants', 'trousers', 'jeans', 'denim', 'cargo', 'шорт', 'shorts'],
  jacket: ['куртк', 'пуховик', 'ветровк', 'бомбер', 'пальто', 'jacket', 'puffer', 'coat', 'bomber', 'outerwear', 'верхн'],
  knit: ['свитер', 'трикотаж', 'кардиган', 'knit', 'sweater', 'cardigan', 'jumper'],
  cap: ['кепк', 'шапк', 'бини', 'панам', 'cap', ' hat', 'beanie'],
  shoes: ['кроссовк', 'кросовк', 'кросівк', 'кеды', 'кед', 'обувь', 'ботинк', 'sneaker', 'shoe', 'boots', 'runner'],
  accessories: ['сумк', 'шопер', 'носк', 'аксессуар', 'bag', 'tote', 'socks', 'accessor'],
};

const shipWords = [
  { region: 'UA', words: ['украин', 'україн', 'киев', 'київ', 'kyiv', 'kiev', 'ukrain', 'харьков', 'харків', 'kharkiv', 'одесс', 'одес', 'odesa', 'львов', 'львів', 'lviv', 'днепр', 'дніпр', 'dnipro'] },
  { region: 'EU', words: ['европ', 'європ', 'ес', 'єс', 'eu', 'europe', 'польш', 'польщ', 'poland', 'warsaw', 'варшав', 'герман', 'germany', 'berlin', 'берлин', 'франц', 'france', 'paris', 'париж'] },
  { region: 'WORLD', words: ['мир', 'світ', 'world', 'worldwide', 'international', 'сша', 'usa'] },
];

const countryWords = {
  UA: ['украинск', 'український', 'українськ', 'ukrainian'],
  GB: ['британ', 'английск', 'лондонск', 'british', 'uk brand', 'london brand'],
  DE: ['немецк', 'германск', 'german'],
  ES: ['испанск', 'spanish'],
  IT: ['итальянск', 'italian'],
  PL: ['польск', 'polish'],
  FR: ['французск', 'french'],
  EE: ['эстонск', 'estonian'],
};

const currencyWords = [
  { cur: 'UAH', re: /(грн|гривен|гривн|₴|uah|hryvn)/ },
  { cur: 'EUR', re: /(€|eur|евро|євро)/ },
  { cur: 'GBP', re: /(£|gbp|фунт|pound)/ },
  { cur: 'USD', re: /(\$|usd|доллар|долар|dollar)/ },
];

function detectCurrency(fragment, fallback) {
  for (const c of currencyWords) if (c.re.test(fragment)) return c.cur;
  return fallback;
}

export function parseQuery(raw) {
  const q = ' ' + raw.toLowerCase().replace(/ё/g, 'е') + ' ';
  const out = { text: [] };
  const used = [];

  for (const [cat, words] of Object.entries(categoryWords)) {
    const w = words.find((x) => q.includes(x));
    if (w) { out.category = cat; used.push(w); break; }
  }

  // price: "до 3000", "under 3000", "<3000", "дешевле 3000", "от 1000", "1000-3000"
  const num = '(\\d[\\d\\s.,]*\\d|\\d)\\s*(k|к|тыс|тис)?';
  const parseNum = (s, k) => {
    let n = parseFloat(s.replace(/[\s,]/g, '').replace(/\.(?=\d{3}\b)/g, ''));
    if (k) n *= 1000;
    return n;
  };
  const fallbackCur = /[а-яії]/.test(q) ? 'UAH' : 'EUR';
  const range = q.match(new RegExp(num + '\\s*[-–—]\\s*' + num + '(\\s*(?:грн|гривен\\S*|гривн\\S*|₴|uah|eur\\S*|€|евро|євро|£|gbp|фунт\\S*|\\$|usd|доллар\\S*|долар\\S*|dollar\\S*))?'));
  const max = q.match(new RegExp('(до|не дороже|дешевле|under|below|less than|max|<|≤)\\s*([€£$₴]?)\\s*' + num + '(\\s*(?:грн|гривен\\S*|гривн\\S*|₴|uah|eur\\S*|€|евро|євро|£|gbp|фунт\\S*|\\$|usd|доллар\\S*|долар\\S*|dollar\\S*))?'));
  const min = q.match(new RegExp('(от|від|дороже|over|above|from|min|>|≥)\\s*([€£$₴]?)\\s*' + num + '(\\s*(?:грн|гривен\\S*|гривн\\S*|₴|uah|eur\\S*|€|евро|євро|£|gbp|фунт\\S*|\\$|usd|доллар\\S*|долар\\S*|dollar\\S*))?'));
  if (range) {
    const cur = detectCurrency(range[5] || '', fallbackCur);
    // "2-4к" means 2000-4000
    out.minUAH = parseNum(range[1], range[2] || (range[4] && parseFloat(range[1]) < 100 ? range[4] : '')) * toUAH[cur];
    out.maxUAH = parseNum(range[3], range[4]) * toUAH[cur];
    used.push(range[0]);
  } else {
    if (max) {
      const cur = detectCurrency((max[2] || '') + (max[5] || ''), fallbackCur);
      out.maxUAH = parseNum(max[3], max[4]) * toUAH[cur];
      used.push(max[0]);
    }
    if (min) {
      const cur = detectCurrency((min[2] || '') + (min[5] || ''), fallbackCur);
      out.minUAH = parseNum(min[3], min[4]) * toUAH[cur];
      used.push(min[0]);
    }
  }

  // shipping destination — look only after a shipping keyword if present
  const shipIdx = q.search(/(доставк|достав|ship|deliver|в |to )/);
  const shipPart = shipIdx >= 0 ? q.slice(shipIdx) : q;
  for (const s of shipWords) {
    const w = s.words.find((x) => new RegExp('(^|[^a-zа-яії])' + x).test(shipPart));
    if (w && /(доставк|достав|ship|deliver| в | to | у )/.test(q)) { out.ship = s.region; used.push(w); break; }
  }

  for (const [c, words] of Object.entries(countryWords)) {
    const w = words.find((x) => q.includes(x));
    if (w) { out.country = c; used.push(w); break; }
  }

  if (/(возврат|поверн|return|refund)/.test(q)) out.returns = true;
  if (/(скидк|знижк|распрод|розпрод|sale|discount)/.test(q)) out.onSale = true;

  // leftover words become free-text search (brand names etc.)
  let rest = q;
  for (const u of used) rest = rest.replace(u, ' ');
  rest = rest
    .replace(/(с доставкой|з доставкою|доставка|доставкой|доставкою|with shipping|shipping|ship|delivery|deliver|с возвратом|з поверненням|возврат|return[s]?|скидк\S*|sale|грн|uah|eur|€|£|\$)/g, ' ')
    .replace(/(?<=\s)(в|у|на|и|і|с|со|з|зі|до|для|по|to|in|for|with|and|the|a|of)(?=\s)/g, ' ')
    .replace(/[^\p{L}\d\s+&-]/gu, ' ');
  out.text = rest.split(/\s+/).filter((w) => w.length > 1);
  return out;
}

export function matchItem(item, brand, f) {
  if (f.category && item.category !== f.category) return false;
  if (f.maxUAH != null && item.priceUAH > f.maxUAH) return false;
  if (f.minUAH != null && item.priceUAH < f.minUAH) return false;
  if (f.ship && !brand.shipping.includes(f.ship) && !brand.shipping.includes('WORLD')) return false;
  if (f.country && brand.country !== f.country) return false;
  if (f.returns && !(brand.returns && brand.returns.days > 0)) return false;
  if (f.onSale && !item.compareAt) return false;
  if (f.text && f.text.length) {
    const hay = (item.title + ' ' + brand.name + ' ' + brand.style.join(' ')).toLowerCase();
    if (!f.text.every((w) => hay.includes(w))) return false;
  }
  return true;
}
