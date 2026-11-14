import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LangContext, dict, useLang, pick, LANGS, dateLocale, ruPlural } from './i18n.js';
import { brands, items, news, brandById, categories, regions, formatPrice, liveBrandIds, brandMedia } from './data/catalog.js';
import { countries } from './data/brands.js';
import { cities } from './data/cities.js';
import { places, guessCountry, estimate } from './data/places.js';
import { parseQuery, matchItem } from './search.js';
import Garment from './components/Garment.jsx';
import Logo from './components/Logo.jsx';
import BrandMap, { clusterBrands } from './components/BrandMap.jsx';

// ── tiny hash router: #/  #/brands  #/brand/:id  #/news  #/search?q=...
function useRoute() {
  const get = () => {
    const h = window.location.hash.replace(/^#/, '') || '/';
    const [path, qs] = h.split('?');
    return { parts: path.split('/').filter(Boolean), params: new URLSearchParams(qs || '') };
  };
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => { setRoute(get()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
const go = (h) => { window.location.hash = h; };

// Extra copy for this layout (kept next to the layout that uses it).
const W = {
  en: {
    headline: 'Independent streetwear brands. Prices, shipping and returns in one place.',
    lead: 'Ukrainian and European labels. Items and prices are refreshed every day from the brands’ own stores.',
    quote_by: 'Drop Index',
    index_quote: 'Where the brands are based',
    d_title: 'Approximate delivery times', d_to: 'Deliver to', d_days: (a, b) => `${a}–${b} days`, d_you: 'You', d_customs: 'customs duties possible', d_noship: 'This brand does not list your country for shipping',
    d_note: 'A rough estimate from distance and customs borders, not data from the brands or carriers. Add the time the brand needs to pack an order. A crossed-out brand does not list your country for shipping.',
    news_quote: 'Drops, sales and collaborations, collected automatically',
    next: 'Next brand', more_brands: (n) => `Show more brands (${n} left)`, see_store: 'see the store’s policy', more: (n) => `Show more (${n} left)`, about: 'About', info: 'Information', country: 'Country',
    note: 'Drop Index is a showcase, not a store. All brands, names, logos and photos belong to their owners. Prices and availability come from the brands’ own sites, and you buy on the brand’s site.',
    map_hint: 'Select a pin to see the brands from that city', map_reset: 'Show all',
    n_all: 'All brands', n_brand: 'Brand', n_sort: 'Sort', n_new: 'Newest first', n_old: 'Oldest first', n_az: 'By brand, A–Z', n_empty: 'No news for this filter yet', n_reset: 'Reset',
    c_ship: 'ships to', c_world: 'ships worldwide', c_ret: (d) => `returns ${d} days`, c_drop: 'new drop',
  },
  ru: {
    headline: 'Независимые стритвир-бренды. Цены, доставка и возвраты в одном месте.',
    lead: 'Украинские и европейские бренды. Вещи и цены обновляются каждый день с сайтов самих брендов.',
    quote_by: 'Drop Index',
    index_quote: 'Где находятся бренды',
    d_title: 'Примерные сроки доставки', d_to: 'Куда', d_days: (a, b) => `${a}–${b} ${ruPlural(b, 'день', 'дня', 'дней')}`, d_you: 'Вы', d_customs: 'возможны таможенные платежи', d_noship: 'Бренд не указывает вашу страну в списке доставки',
    d_note: 'Это грубая оценка по расстоянию и таможенным границам, а не данные брендов или служб доставки. К сроку добавьте время, за которое бренд собирает заказ. Зачёркнутый бренд не указывает вашу страну в списке доставки.',
    news_quote: 'Дропы, скидки и коллаборации, собранные автоматически',
    next: 'Следующий бренд', more_brands: (n) => `Показать ещё бренды (осталось ${n})`, see_store: 'смотри условия на сайте бренда', more: (n) => `Показать ещё (осталось ${n})`, about: 'О бренде', info: 'Информация', country: 'Страна',
    note: 'Drop Index — витрина, а не магазин. Все бренды, названия, логотипы и фото принадлежат их владельцам. Цены и наличие берутся с сайтов брендов, покупка происходит на сайте бренда.',
    map_hint: 'Нажмите на точку, чтобы увидеть бренды из этого города', map_reset: 'Показать все',
    n_all: 'Все бренды', n_brand: 'Бренд', n_sort: 'Сортировка', n_new: 'Сначала новые', n_old: 'Сначала старые', n_az: 'По бренду, А–Я', n_empty: 'Новостей по этому фильтру пока нет', n_reset: 'Сбросить',
    c_ship: 'доставка', c_world: 'доставка по всему миру', c_ret: (d) => `возврат ${d} дней`, c_drop: 'новый дроп',
  },
  uk: {
    headline: 'Незалежні стрітвір-бренди. Ціни, доставка й повернення в одному місці.',
    lead: 'Українські та європейські бренди. Речі й ціни оновлюються щодня із сайтів самих брендів.',
    quote_by: 'Drop Index',
    index_quote: 'Де розташовані бренди',
    d_title: 'Орієнтовні терміни доставки', d_to: 'Куди', d_days: (a, b) => `${a}–${b} ${ruPlural(b, 'день', 'дні', 'днів')}`, d_you: 'Ви', d_customs: 'можливі митні платежі', d_noship: 'Бренд не вказує вашу країну у списку доставки',
    d_note: 'Це груба оцінка за відстанню та митними кордонами, а не дані брендів чи служб доставки. До терміну додайте час, за який бренд збирає замовлення. Закреслений бренд не вказує вашу країну у списку доставки.',
    news_quote: 'Дропи, знижки та колаборації, зібрані автоматично',
    next: 'Наступний бренд', more_brands: (n) => `Показати ще бренди (залишилось ${n})`, see_store: 'дивись умови на сайті бренду', more: (n) => `Показати ще (залишилось ${n})`, about: 'Про бренд', info: 'Інформація', country: 'Країна',
    note: 'Drop Index — вітрина, а не магазин. Усі бренди, назви, логотипи й фото належать їхнім власникам. Ціни та наявність беруться із сайтів брендів, покупка відбувається на сайті бренду.',
    map_hint: 'Натисніть на точку, щоб побачити бренди з цього міста', map_reset: 'Показати всі',
    n_all: 'Усі бренди', n_brand: 'Бренд', n_sort: 'Сортування', n_new: 'Спочатку нові', n_old: 'Спочатку старі', n_az: 'За брендом, А–Я', n_empty: 'Новин за цим фільтром поки немає', n_reset: 'Скинути',
    c_ship: 'доставка', c_world: 'доставка по всьому світу', c_ret: (d) => `повернення ${d} днів`, c_drop: 'новий дроп',
  },
};

// Six showcases: brands with real collected photos first, then the hand-picked rest.
// Home order is reshuffled on every visit (page load) so no brand owns the top row,
// and stays put while moving around the site. Brands with real items come before demo ones.
const shuffle = (list) => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const HOME_ORDER = [...shuffle(brands.filter((b) => liveBrandIds.includes(b.id))), ...shuffle(brands.filter((b) => !liveBrandIds.includes(b.id)))];
const PAGE = 12;
const BATCH = 6;
let homeCount = BATCH; // remembered so coming back from a brand keeps your place
const itemsByBrand = items.reduce((m, i) => ((m[i.brandId] ||= []).push(i), m), {});
const longestWord = (s) => Math.max(...s.split(/\s+/).map((w) => w.length));

// ── Transition: the clicked showcase grows into the whole screen while its
// name travels to the bottom-left corner, where the brand page's giant name sits.
function openBrand(e, brand) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
  e.preventDefault();
  const target = '/brand/' + brand.id;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || document.querySelector('.fx')) return go(target);

  const r = (e.currentTarget.querySelector('.sc-art') || e.currentTarget).getBoundingClientRect();
  const fx = document.createElement('div');
  fx.className = 'fx';
  fx.style.cssText = `top:${r.top}px;left:${r.left}px;width:${r.width}px;height:${r.height}px`;
  const name = document.createElement('span');
  name.className = 'fx-name';
  for (const word of brand.name.toLowerCase().split(/\s+/)) {
    const line = document.createElement('span');
    line.textContent = word;
    name.appendChild(line);
  }
  name.style.setProperty('--len', longestWord(brand.name));
  fx.appendChild(name);
  document.body.appendChild(fx);
  fx.getBoundingClientRect(); // commit start position before animating
  fx.classList.add('grow');
  setTimeout(() => {
    document.documentElement.classList.add('from-fx');
    go(target);
    requestAnimationFrame(() => requestAnimationFrame(() => fx.classList.add('out')));
    setTimeout(() => { fx.remove(); document.documentElement.classList.remove('from-fx'); }, 600);
  }, 760);
}

function readLang() {
  try { const l = localStorage.getItem('lang'); return dict[l] ? l : 'ru'; } catch { return 'ru'; }
}

export default function App() {
  const [lang, setLangState] = useState(readLang);
  const setLang = (l) => { setLangState(l); try { localStorage.setItem('lang', l); } catch {} };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const route = useRoute();
  const [page, arg] = route.parts;

  let body;
  if (page === 'brand' && brandById[arg]) body = <BrandPage key={arg} brand={brandById[arg]} />;
  else if (page === 'brands') body = <IndexPage />;
  else if (page === 'news') body = <NewsPage />;
  else if (page === 'search') body = <SearchPage q={route.params.get('q') || ''} />;
  else body = <Home />;
  if (page !== 'brand') backTo = window.location.hash.replace(/^#/, '') || '/';

  return <LangContext.Provider value={{ lang, t: dict[lang], w: W[lang], setLang }}>{body}</LangContext.Provider>;
}

// ── Top bar on every page: wordmark left, quiet nav right.
function TopBar({ active }) {
  const { lang, t, setLang } = useLang();
  return (
    <header className="top">
      <a href="#/" className="logo">Drop Index</a>
      <nav className="nav">
        <a href="#/" className={active === 'home' ? 'on' : ''}>{t.nav_brands}</a>
        <a href="#/search" className={active === 'search' ? 'on' : ''}>{t.nav_search}</a>
        <a href="#/brands" className={active === 'index' ? 'on' : ''}>{t.nav_map}</a>
        <a href="#/news" className={active === 'news' ? 'on' : ''}>{t.nav_news}</a>
        <span className="lang" role="group" aria-label="Language">
          {LANGS.map(([l, label]) => (
            <button key={l} className={l === lang ? 'on' : ''} onClick={() => setLang(l)}>{label}</button>
          ))}
        </span>
      </nav>
    </header>
  );
}

// ── Inner pages: quote top-left, giant word bottom-left, content column.
function Shell({ word, quote, by, wide, active, links, foot = true, children }) {
  const { t } = useLang();
  return (
    <>
      <TopBar active={active} />
      <div className={'shell' + (wide ? ' wide' : '')}>
        <aside className="side">
          <blockquote className="quote">
            <p>{quote}</p>
            {by && <cite>{by}</cite>}
          </blockquote>
          <div className="giant-clip"><h1 className="giant" style={{ '--len': longestWord(word) }}>{word.split(/\s+/).map((x, i) => <span key={i}>{x} </span>)}</h1></div>
        </aside>
        <div className="main">
          <main className="content">{children}</main>
          {foot && (
            <footer className="foot">
              <span>{t.footer}</span>
              {links && <span className="foot-links">{links}</span>}
            </footer>
          )}
        </div>
      </div>
    </>
  );
}

function SearchBar({ initial = '' }) {
  const { t } = useLang();
  const [q, setQ] = useState(initial);
  useEffect(() => setQ(initial), [initial]);
  return (
    <form className="searchbar" onSubmit={(e) => { e.preventDefault(); go('/search?q=' + encodeURIComponent(q)); }}>
      <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search_ph} aria-label={t.nav_search} />
      <button type="submit">{t.search_btn} →</button>
    </form>
  );
}

// ── Home: white canvas, one line, six showcases of different heights ──
function Home() {
  const { t, w, lang } = useLang();
  // featured first, then everyone else; more showcases arrive as you scroll (or by button)
  const order = HOME_ORDER;
  const [count, setCount] = useState(homeCount);
  const more = useRef(null);
  useEffect(() => { homeCount = count; }, [count]);
  useEffect(() => {
    const el = more.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting) setCount((c) => Math.min(order.length, c + BATCH)); }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [count, order.length]);
  return (
    <>
      <TopBar active="home" />
      <main className="home">
        <div className="title-row">
          <div className="giant-clip"><h1 className="home-title">{w.headline}</h1></div>
        </div>
        <div className="intro rise">
          <p>{w.lead}</p>
          <span className="intro-count">{t.brands_count(brands.length)}</span>
        </div>
        <div className="showcases">
          {order.slice(0, count).map((b, i) => <Showcase key={b.id} brand={b} n={i % BATCH} />)}
        </div>
        {count < order.length && (
          <button className="more home-more" ref={more} onClick={() => setCount(Math.min(order.length, count + BATCH))}>
            {w.more_brands(order.length - count)}
          </button>
        )}
        <div className="home-note rise">
          <p>{w.note}</p>
        </div>
      </main>
    </>
  );
}

// One line of facts under the photos: price range, shipping, returns, and what is new.
function ShowcaseMeta({ brand, items: its }) {
  const { lang, t, w } = useLang();
  const real = its.filter((i) => !i.demo && i.price > 0);
  const prices = real.map((i) => i.price);
  const sale = real.filter((i) => i.compareAt > i.price);
  const off = sale.length >= 3 ? Math.max(...sale.map((i) => Math.round((1 - i.price / i.compareAt) * 100))) : 0;
  const drop = news.find((n) => n.brandId === brand.id && n.type === 'drop' && Date.now() - new Date(n.date) < 14 * 864e5);
  const facts = [
    prices.length > 0 && `${formatPrice(Math.min(...prices), real[0].currency)} – ${formatPrice(Math.max(...prices), real[0].currency)}`,
    brand.shipping.length > 0 && (brand.shipping.includes('WORLD') ? w.c_world : `${w.c_ship} ${brand.shipping.join(', ')}`),
    brand.returns?.days && w.c_ret(brand.returns.days),
  ].filter(Boolean);
  if (!facts.length && !off && !drop) return null;
  return (
    <span className="sc-meta">
      <span className="sc-facts">{facts.join(' · ')}</span>
      <span className="sc-tags">
        {off > 0 && <span className="sc-tag">sale −{off}%</span>}
        {drop && <span className="sc-tag">{w.c_drop} · {new Date(drop.date).toLocaleDateString(dateLocale[lang], { day: 'numeric', month: 'short' })}</span>}
      </span>
    </span>
  );
}

// Showcase per the sketch: logo and name on top, a collage of the brand's clothes below.
function Showcase({ brand, n }) {
  const { lang } = useLang();
  const base = itemsByBrand[brand.id] || [];
  const its = base.length ? Array.from({ length: 3 }, (_, i) => base[i % base.length]) : [];
  const { logo } = brandMedia(brand.id);
  return (
    <a className="showcase rise" style={{ '--i': n }} href={'#/brand/' + brand.id} onClick={(e) => openBrand(e, brand)}>
      <span className="sc-head">
        <span className="sc-name">{brand.name}</span>
        <span className="sc-city">{brand.city || pick(countries[brand.country], lang)}</span>
      </span>
      <span className="sc-art collage">
        {its.map((it, i) => <span key={i} className="tile"><Garment item={it} tone={i} /></span>)}
      </span>
      <ShowcaseMeta brand={brand} items={base} />
    </a>
  );
}

// ── Index: every brand as a typographic row ─────────────────
// Map page: a large map with one pin per city, and rough delivery times to the visitor's country.
function IndexPage() {
  const { lang, t, w } = useLang();
  const [origin, setOrigin] = useState('ALL');
  const [place, setPlace] = useState(null);
  const [hotPlace, setHotPlace] = useState(null);
  const [me, setMeState] = useState(guessCountry);
  const setMe = (c) => { setMeState(c); try { localStorage.setItem('country', c); } catch {} };
  const inOrigin = brands
    .filter((b) => origin === 'ALL' || (origin === 'UA' ? b.country === 'UA' : b.country !== 'UA'))
    .sort((a, b) => a.name.localeCompare(b.name));
  const clusters = useMemo(() => clusterBrands(inOrigin), [origin]);
  const picked = clusters.find((c) => c.key === place);
  const regionName = useMemo(() => { try { const d = new Intl.DisplayNames([lang], { type: 'region' }); return (c) => d.of(c); } catch { return (c) => c; } }, [lang]);
  const rows = clusters
    .map((c) => ({ c, e: estimate(c.brands[0].country, cities[c.brands[0].city], me) }))
    .sort((a, b) => a.e.days[0] - b.e.days[0] || a.e.days[1] - b.e.days[1] || a.c.key.localeCompare(b.c.key));
  const ships = (b) => !b.shipsTo || b.country === me || b.shipsTo.includes(me);
  const brandLinks = (c) => c.brands.map((b) => (
    <a key={b.id} className={'dl-brand' + (ships(b) ? '' : ' no')} href={'#/brand/' + b.id} title={ships(b) ? undefined : w.d_noship}>{b.name}</a>
  ));
  return (
    <>
      <TopBar active="index" />
      <main className="index-page">
        <div className="np-head rise">
          <p className="np-lead">{w.index_quote}</p>
          <div className="chips">
            {[['ALL', t.any], ['UA', 'UA'], ['EU', 'EU']].map(([k, label]) => (
              <button key={k} className={origin === k ? 'chip on' : 'chip'} onClick={() => { setOrigin(k); setPlace(null); }}>{label}</button>
            ))}
          </div>
        </div>
        <div className="map-wrap rise" style={{ '--i': 1 }}>
          <BrandMap clusters={clusters} selected={place} hot={null} onSelect={setPlace} onHover={setHotPlace} focus={origin} you={places[me].geo} youLabel={w.d_you} />
          {picked
            ? (
              <div className="map-card">
                <button className="map-x" onClick={() => setPlace(null)} aria-label={w.map_reset}>×</button>
                <span className="muted">{picked.names.join(', ')} · {pick(countries[picked.brands[0].country], lang)}</span>
                <span className="map-brands">{brandLinks(picked)}</span>
                <span className="muted">{w.d_days(...estimate(picked.brands[0].country, cities[picked.brands[0].city], me).days)} · {regionName(me)}</span>
              </div>
            )
            : <p className="map-hint muted">{w.map_hint}</p>}
        </div>
        <section className="delivery">
          <div className="row-head">
            <h2>{w.d_title}</h2>
            <label className="np-select dl-to"><span>{w.d_to}</span>
              <select value={me} onChange={(e) => setMe(e.target.value)}>
                {Object.keys(places).map((c) => [c, regionName(c)]).sort((a, b) => a[1].localeCompare(b[1], lang)).map(([c, name]) => <option key={c} value={c}>{name}</option>)}
              </select>
            </label>
          </div>
          <div className="dl-list">
            {rows.map(({ c, e }) => (
              <div key={c.key} className={'dl-row' + (hotPlace === c.key || place === c.key ? ' hot' : '')} onMouseEnter={() => setHotPlace(c.key)} onMouseLeave={() => setHotPlace(null)}>
                <span className="dl-days">{w.d_days(...e.days)}</span>
                <span className="dl-from">{c.names.join(', ')}<small>{pick(countries[c.brands[0].country], lang)}{e.customs ? ' · ' + w.d_customs : ''}</small></span>
                <span className="dl-brands">{brandLinks(c)}</span>
              </div>
            ))}
          </div>
          <p className="dl-note muted">{w.d_note}</p>
        </section>
        <footer className="foot"><span>{t.footer}</span></footer>
      </main>
    </>
  );
}

function NewsCard({ n }) {
  const { lang, t } = useLang();
  const b = brandById[n.brandId];
  return (
    <article className="news-card">
      <div className="news-top">
        <span>{t.news_types[n.type]}</span>
        {n.demo && <span className="demo">{t.demo_badge}</span>}
        <time>{new Date(n.date).toLocaleDateString(dateLocale[lang], { day: 'numeric', month: 'short' })}</time>
      </div>
      <h3>{pick(n.title, lang)}</h3>
      <p>{pick(n.summary, lang)}</p>
      <div className="news-links">
        {b && <a href={'#/brand/' + b.id}>{b.name} →</a>}
        {n.source?.url && <a href={n.source.url} target="_blank" rel="noreferrer">↗</a>}
      </div>
    </article>
  );
}

function NewsRow({ n, i }) {
  const { lang, t } = useLang();
  const b = brandById[n.brandId];
  if (!b) return null;
  const base = itemsByBrand[b.id] || [];
  const chosen = n.type === 'sale' ? base.filter((x) => x.compareAt) : base;
  const thumbs = (chosen.length ? chosen : base).slice(0, 3);
  const date = new Date(n.date).toLocaleDateString(dateLocale[lang], { day: 'numeric', month: 'short' });
  return (
    <article className="news-row rise" style={{ '--i': Math.min(i, 8) }}>
      <a className="nr-main" href={'#/brand/' + b.id}>
        <span className="nr-meta"><time>{date}</time><span>{t.news_types[n.type]}</span></span>
        <span className="nr-brand">
          <span className="nr-name">{b.name}</span>
        </span>
        <span className="nr-text">
          <span className="nr-title">{pick(n.title, lang)}</span>
          <span className="nr-sum">{pick(n.summary, lang)}</span>
        </span>
        <span className="nr-thumbs">
          {thumbs.map((it, k) => <span key={k} className="nr-thumb"><Garment item={it} tone={k} /></span>)}
        </span>
      </a>
      {n.source?.url && <a className="nr-out" href={n.source.url} target="_blank" rel="noreferrer" aria-label={t.website}>↗</a>}
    </article>
  );
}

function NewsPage() {
  const { t, w, lang } = useLang();
  const [type, setType] = useState('all');
  const [brand, setBrand] = useState('all');
  const [sort, setSort] = useState('new');
  const kinds = ['all', 'drop', 'sale', 'collab', 'news'].filter((k) => k === 'all' || news.some((n) => n.type === k));
  const withNews = brands.filter((b) => news.some((n) => n.brandId === b.id)).sort((a, b) => a.name.localeCompare(b.name));
  const list = news
    .filter((n) => brandById[n.brandId] && (type === 'all' || n.type === type) && (brand === 'all' || n.brandId === brand))
    .sort((a, b) => sort === 'az'
      ? brandById[a.brandId].name.localeCompare(brandById[b.brandId].name) || b.date.localeCompare(a.date)
      : sort === 'old' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
  return (
    <>
      <TopBar active="news" />
      <main className="news-page">
        <div className="np-head rise">
          <p className="np-lead">{w.news_quote}</p>
          <div className="np-tools">
            <div className="chips">
              {kinds.map((k) => (
                <button key={k} className={type === k ? 'chip on' : 'chip'} onClick={() => setType(k)}>
                  {k === 'all' ? t.any : t.news_types[k]}
                </button>
              ))}
            </div>
            <label className="np-select"><span>{w.n_brand}</span>
              <select value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option value="all">{w.n_all}</option>
                {withNews.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className="np-select"><span>{w.n_sort}</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="new">{w.n_new}</option>
                <option value="old">{w.n_old}</option>
                <option value="az">{w.n_az}</option>
              </select>
            </label>
          </div>
        </div>
        <div className="np-list" key={type + brand + sort}>{list.map((n, i) => <NewsRow key={n.id} n={n} i={i} />)}</div>
        {!list.length && <p className="np-empty">{w.n_empty}. <button className="chip on" onClick={() => { setType('all'); setBrand('all'); }}>{w.n_reset}</button></p>}
        <footer className="foot"><span>{t.footer}</span></footer>
      </main>
    </>
  );
}

function ItemCard({ item, showBrand }) {
  const { t } = useLang();
  const b = brandById[item.brandId];
  const Tag = item.url ? 'a' : 'div';
  return (
    <Tag className="item-card" {...(item.url ? { href: item.url, target: '_blank', rel: 'noreferrer' } : {})}>
      <div className="item-img"><Garment item={item} />{item.demo && <span className="demo on-img">{t.demo_badge}</span>}</div>
      <div className="item-body">
        {showBrand && <span className="item-brand">{b.name}</span>}
        <span className="item-title">{item.title}</span>
        <span className="item-price">
          {formatPrice(item.price, item.currency)}
          {item.compareAt && <s>{formatPrice(item.compareAt, item.currency)}</s>}
        </span>
      </div>
    </Tag>
  );
}

// ── Brand page. Two states of one layout:
//   closed — giant name on the left, description and the clothes in the reading column;
//   open   — after a little scrolling the name leaves and the clothes spread over the whole
//            screen, like browsing the brand's own store. Scrolling back to the top closes it.
// Tiles travel between the two layouts with a FLIP animation.
let backTo = '/'; // where "back" leads: the list the visitor came from

function BrandPage({ brand }) {
  const { lang, t, w } = useLang();
  const its = itemsByBrand[brand.id] || [];
  const bn = news.filter((n) => n.brandId === brand.id);
  const { logo } = brandMedia(brand.id);
  const isDemo = its.some((i) => i.demo);
  const [shown, setShown] = useState(PAGE);
  const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth <= 860;
  const [open, setOpen] = useState(still);
  const openRef = useRef(open);
  const grid = useRef(null);
  const page = useRef(null);
  const before = useRef(null);
  const unv = (field) => (brand.verified.includes(field) ? null : <em className="unv">{t.unverified}</em>);
  const idx = brands.indexOf(brand);
  const next = brands[(idx + 1) % brands.length];

  // open / close on scroll, with hysteresis so it never flickers
  useEffect(() => {
    const on = () => {
      const want = still() ? true : openRef.current ? window.scrollY > 24 : window.scrollY > 70;
      if (want === openRef.current) return;
      before.current = still() ? null : [...grid.current.children].map((el) => el.getBoundingClientRect());
      openRef.current = want;
      setOpen(want);
    };
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, []);

  // FLIP: start every tile where it was, then let it glide to its new place
  useLayoutEffect(() => {
    const first = before.current;
    before.current = null;
    if (!first) return;
    [...grid.current.children].forEach((el, i) => {
      const a = first[i];
      if (!a) return;
      const b = el.getBoundingClientRect();
      el.style.transition = 'none';
      el.style.transformOrigin = '0 0';
      el.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width})`;
      el.getBoundingClientRect();
      el.style.transition = `transform .85s cubic-bezier(.76, 0, .24, 1) ${Math.min(i, 8) * 18}ms`;
      el.style.transform = '';
    });
  }, [open]);

  // back: Esc, or swipe right on a touch screen (the page follows the finger)
  useEffect(() => {
    const leave = () => go(backTo);
    const key = (e) => { if (e.key === 'Escape') leave(); };
    let sx = 0, sy = 0, dx = 0, drag = false;
    const el = page.current;
    const start = (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; dx = 0; drag = false; };
    const move = (e) => {
      dx = e.touches[0].clientX - sx;
      const dy = e.touches[0].clientY - sy;
      if (!drag && dx > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) drag = true;
      if (drag) {
        el.style.transition = 'none';
        el.style.transform = `translateX(${Math.max(0, dx) * 0.7}px)`;
        el.style.opacity = String(Math.max(0.3, 1 - dx / 500));
      }
    };
    const end = () => {
      if (!drag) return;
      el.style.transition = 'transform .3s ease, opacity .3s ease';
      if (dx > 90) { el.style.transform = 'translateX(100vw)'; el.style.opacity = '0'; setTimeout(leave, 180); }
      else { el.style.transform = ''; el.style.opacity = ''; }
      drag = false;
    };
    window.addEventListener('keydown', key);
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: true });
    el.addEventListener('touchend', end);
    return () => {
      window.removeEventListener('keydown', key);
      el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', move); el.removeEventListener('touchend', end);
    };
  }, []);

  return (
    <>
      <TopBar />
      <div className={'brand' + (open ? ' open' : '')} ref={page}>
        <aside className="side">
          <blockquote className="quote">
            <p>{brand.style.join(', ')}</p>
            <cite>{[brand.city, pick(countries[brand.country], lang)].filter(Boolean).join(', ')}</cite>
          </blockquote>
          <div className="giant-clip"><h1 className="giant" style={{ '--len': longestWord(brand.name) }}>{brand.name.toLowerCase().split(/\s+/).map((x, i) => <span key={i}>{x} </span>)}</h1></div>
        </aside>

        <div className="brand-intro">
          <a href={'#' + backTo} className="back rise">{t.back}</a>
          <Logo className="brand-logo rise" src={logo} />
          <p className="lead rise">{pick(brand.description, lang)}</p>
        </div>

        <section className="store">
          <div className="store-inner">
            <div className="store-head">
              <a href={'#' + backTo} className="store-back" aria-label={t.back}>←</a>
              <h2><span className="sh-closed">{t.items}</span><span className="sh-open">{brand.name}</span></h2>
              <span className="muted">{t.items_found(its.length)}</span>
              {brand.website && <a className="store-link" href={brand.website} target="_blank" rel="noreferrer">{t.shop} ↗</a>}
            </div>
            {isDemo && <p className="demo-note">{t.demo_note}</p>}
            <div className="store-grid" ref={grid}>{its.slice(0, shown).map((i) => <ItemCard key={i.id} item={i} />)}</div>
            {its.length > shown && <button className="more" onClick={() => setShown(shown + PAGE)}>{w.more(its.length - shown)}</button>}
          </div>
        </section>

        <div className="below">
          <section className="below-row">
            <h2>{w.info}</h2>
            <dl className="facts">
              <div><dt>{w.country}</dt><dd>{pick(countries[brand.country], lang)}{brand.city ? ', ' + brand.city : ''}</dd></div>
              {brand.founded && <div><dt>{t.founded}</dt><dd>{brand.founded}</dd></div>}
              <div><dt>{t.website}</dt><dd>{brand.website ? <a href={brand.website} target="_blank" rel="noreferrer">{brand.website.replace(/^https?:\/\/(www\.)?/, '')}</a> : <span className="muted">{t.no_link}</span>}{brand.website && unv('website')}</dd></div>
              <div><dt>Instagram</dt><dd>{brand.instagram ? <a href={'https://instagram.com/' + brand.instagram} target="_blank" rel="noreferrer">@{brand.instagram}</a> : <span className="muted">{t.no_link}</span>}{brand.instagram && unv('instagram')}</dd></div>
              <div><dt>{t.shipping}</dt><dd>{brand.shipping.map((r) => pick(regions[r], lang)).join(', ')}{unv('shipping')}{brand.shippingNote && <small>{pick(brand.shippingNote, lang)}</small>}</dd></div>
              <div><dt>{t.returns}</dt><dd>{brand.returns?.days ? t.returns_days(brand.returns.days) : <span className="muted">{w.see_store}</span>}{brand.returns?.days ? unv('returns') : null}{brand.returnsNote && <small>{pick(brand.returnsNote, lang)}</small>}</dd></div>
            </dl>
          </section>
          {bn.length > 0 && (
            <section className="below-row">
              <h2>{t.news_from}</h2>
              <div className="news-list">{bn.map((n) => <NewsCard key={n.id} n={n} />)}</div>
            </section>
          )}
          <a className="next-brand" href={'#/brand/' + next.id} onClick={(e) => openBrand(e, next)}>
            <span className="muted">{w.next}</span>
            <span className="nb-name">{next.name} →</span>
          </a>
          <footer className="foot"><span>{t.footer}</span></footer>
        </div>
      </div>
    </>
  );
}

// ── Search: text query → parsed filters, editable ───────────
function SearchPage({ q }) {
  const { lang, t, w } = useLang();
  const parsed = useMemo(() => parseQuery(q), [q]);
  const [f, setF] = useState(parsed);
  useEffect(() => setF(parsed), [parsed]);
  const [shown, setShown] = useState(48);
  useEffect(() => setShown(48), [f]);
  const set = (k, v) => setF((o) => ({ ...o, [k]: v === '' || v === false ? undefined : v }));

  const found = items.filter((i) => matchItem(i, brandById[i.brandId], f));

  const chips = [];
  if (f.category) chips.push(pick(categories[f.category], lang));
  if (f.minUAH != null) chips.push(`${t.from} ${Math.round(f.minUAH)} ₴`);
  if (f.maxUAH != null) chips.push(`${t.to} ${Math.round(f.maxUAH)} ₴`);
  if (f.ship) chips.push(`${t.ship_to}: ${pick(regions[f.ship], lang)}`);
  if (f.country) chips.push(pick(countries[f.country], lang));
  if (f.returns) chips.push(t.returns_only);
  if (f.onSale) chips.push(t.sale_only);
  if (f.text?.length) chips.push('“' + f.text.join(' ') + '”');

  return (
    <>
      <TopBar active="search" />
      <main className="search-page">
      <div className="sp-bar rise"><SearchBar initial={q} /></div>
      <div className="sp-meta rise">
        <span className="understood">{chips.length > 0 && <>{t.understood}: {chips.map((c) => <span key={c} className="tag">{c}</span>)}</>}</span>
        <span className="muted">{t.items_found(found.length)}</span>
      </div>
      <div className="filters rise">
        <label>{t.category}
          <select id="f-cat" value={f.category || ''} onChange={(e) => set('category', e.target.value)}>
            <option value="">{t.any}</option>
            {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{pick(v, lang)}</option>)}
          </select>
        </label>
        <label>{t.price}
          <span className="row">
            <input id="f-min" type="number" min="0" placeholder={t.from} value={f.minUAH != null ? Math.round(f.minUAH) : ''} onChange={(e) => set('minUAH', e.target.value === '' ? '' : +e.target.value)} />
            <input id="f-max" type="number" min="0" placeholder={t.to} value={f.maxUAH != null ? Math.round(f.maxUAH) : ''} onChange={(e) => set('maxUAH', e.target.value === '' ? '' : +e.target.value)} />
          </span>
        </label>
        <label>{t.ship_to}
          <select id="f-ship" value={f.ship || ''} onChange={(e) => set('ship', e.target.value)}>
            <option value="">{t.any}</option>
            {Object.entries(regions).map(([k, v]) => <option key={k} value={k}>{pick(v, lang)}</option>)}
          </select>
        </label>
        <label>{t.origin}
          <select id="f-country" value={f.country || ''} onChange={(e) => set('country', e.target.value)}>
            <option value="">{t.any}</option>
            {Object.entries(countries).map(([k, v]) => <option key={k} value={k}>{pick(v, lang)}</option>)}
          </select>
        </label>
        <label className="check"><input id="f-ret" type="checkbox" checked={!!f.returns} onChange={(e) => set('returns', e.target.checked)} /> {t.returns_only}</label>
        <label className="check"><input id="f-sale" type="checkbox" checked={!!f.onSale} onChange={(e) => set('onSale', e.target.checked)} /> {t.sale_only}</label>
        <button className="reset" onClick={() => go('/search')}>{t.reset}</button>
      </div>
      {found.length
        ? <div className="item-grid wide-grid rise">{found.slice(0, shown).map((i) => <ItemCard key={i.id} item={i} showBrand />)}</div>
        : <p className="muted rise sp-none">{t.nothing}</p>}
      {found.length > shown && <button className="more home-more" onClick={() => setShown((n) => n + 48)}>{w.more(found.length - shown)}</button>}
      {items.some((i) => i.demo) && <p className="demo-note">{t.demo_note}</p>}
      <footer className="foot"><span>{t.footer}</span></footer>
      </main>
    </>
  );
}
