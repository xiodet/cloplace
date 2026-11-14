import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LangContext, dict, useLang, pick, LANGS, dateLocale, ruPlural } from './i18n.js';
import { brands, items, news, brandById, categories, regions, formatPrice, setShownCurrency, toUAH, liveBrandIds, brandMedia } from './data/catalog.js';
import { countries } from './data/brands.js';
import { cities } from './data/cities.js';
import { places, guessCountry, estimate } from './data/places.js';
import { parseQuery, matchItem } from './search.js';
import Garment from './components/Garment.jsx';
import Logo from './components/Logo.jsx';
import BrandMap, { clusterBrands, ZOOM } from './components/BrandMap.jsx';
import { MAP, project, km } from './data/mapProjection.js';

// ── tiny hash router: #/  #/brands  #/brand/:id  #/news  #/search?q=...
function useRoute() {
  const get = () => {
    const h = window.location.hash.replace(/^#/, '') || '/';
    const [path, qs] = h.split('?');
    return { parts: path.split('/').filter(Boolean), params: new URLSearchParams(qs || '') };
  };
  const [route, setRoute] = useState(get);
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    let prev = window.location.hash || '#/';
    // Lists (brands, items, news, map) reopen where you left them; a brand page always starts at the top.
    const on = () => {
      scrollMemory[prev] = window.scrollY;
      const now = window.location.hash || '#/';
      prev = now;
      const y = now.startsWith('#/brand/') ? 0 : scrollMemory[now] || 0;
      setRoute(get());
      window.scrollTo(0, 0);
      if (y) {
        // wait for the list to render (and grow to the remembered length) before jumping back
        let tries = 0;
        const jump = () => {
          window.scrollTo(0, y);
          if (Math.abs(window.scrollY - y) > 2 && tries++ < 20) requestAnimationFrame(jump);
        };
        requestAnimationFrame(() => requestAnimationFrame(jump));
      }
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
const scrollMemory = {};
const go = (h) => { window.location.hash = h; };

// Extra copy for this layout (kept next to the layout that uses it).
const W = {
  en: {
    m_europe: 'All of Europe', m_cities: 'All cities', m_in: 'Zoom in', m_out: 'Zoom out', m_title: (b, c) => `${b} ${b === 1 ? 'brand' : 'brands'} in ${c} ${c === 1 ? 'city' : 'cities'}`, m_sub: 'Nearest to you first. Select a city on the map or below. Pinch or scroll with two fingers to move around the map.', m_away: (d) => `${d} km from you`, m_here: 'your city', m_ship: (d) => `Delivery about ${d}`, m_noship: 'does not ship to you', m_latest: (c) => `Latest from ${c}`, m_nearby: 'Nearby',
    headline: 'Independent streetwear brands. Prices, shipping and returns in one place.',
    lead: 'Ukrainian and European labels. Items and prices are refreshed every day from the brands’ own stores.',
    quote_by: 'ShoWindow',
    index_quote: 'Where the brands are based',
    d_title: 'Approximate delivery times', d_to: 'Deliver to', d_days: (a, b) => `${a}–${b} days`, d_you: 'You', d_customs: 'customs duties possible', d_noship: 'This brand does not list your country for shipping',
    cl_title: 'The shop is closed', cl_until: 'Opens in', cl_wait: 'Closed until the new collection', cl_check: 'We check the shop every day: the items appear here as soon as it opens.', cl_tile: 'closed', cl_d: 'd', d_note: 'A rough estimate from distance and customs borders, not data from the brands or carriers. Add the time the brand needs to pack an order. A crossed-out brand does not list your country for shipping.',
    news_quote: 'Drops, sales and collaborations, collected automatically',
    next: 'Next brand', more_brands: (n) => `Show more brands (${n} left)`, see_store: 'see the store’s policy', more: (n) => `Show more (${n} left)`, about: 'About', info: 'Information', country: 'Country',
    note: 'ShoWindow is a showcase, not a store. All brands, names, logos and photos belong to their owners. Prices and availability come from the brands’ own sites, and you buy on the brand’s site.',
    map_hint: 'Select a pin to see the brands from that city', map_reset: 'Show all',
    g_clothes: 'Clothing', g_acc: 'Accessories', g_shoes: 'Shoes', x_all: 'All', x_m: 'Men', x_w: 'Women', s_az: 'A–Z', s_def: 'Mixed', s_lo: 'Cheapest first', s_hi: 'Priciest first', s_sale: 'Biggest discount', n_all: 'All brands', n_brand: 'Brand', n_sort: 'Sort', n_new: 'Newest first', n_old: 'Oldest first', n_az: 'By brand, A–Z', n_empty: 'No news for this filter yet', n_reset: 'Reset',
    c_ship: 'ships to', c_world: 'ships worldwide', c_ret: (d) => `returns ${d} days`, c_drop: 'new drop',
  },
  ru: {
    m_europe: 'Вся Европа', m_cities: 'Все города', m_in: 'Приблизить', m_out: 'Отдалить', m_title: (b, c) => `${b} ${ruPlural(b, 'бренд', 'бренда', 'брендов')} в ${c} ${ruPlural(c, 'городе', 'городах', 'городах')}`, m_sub: 'Сначала ближайшие к вам. Выберите город на карте или в списке. Карту можно приближать щипком и двигать двумя пальцами.', m_away: (d) => `${d} км от вас`, m_here: 'ваш город', m_ship: (d) => `Доставка примерно ${d}`, m_noship: 'не доставляет к вам', m_latest: (c) => `Новое из города ${c}`, m_nearby: 'Рядом',
    headline: 'Независимые стритвир-бренды. Цены, доставка и возвраты в одном месте.',
    lead: 'Украинские и европейские бренды. Вещи и цены обновляются каждый день с сайтов самих брендов.',
    quote_by: 'ShoWindow',
    index_quote: 'Где находятся бренды',
    d_title: 'Примерные сроки доставки', d_to: 'Куда', d_days: (a, b) => `${a}–${b} ${ruPlural(b, 'день', 'дня', 'дней')}`, d_you: 'Вы', d_customs: 'возможны таможенные платежи', d_noship: 'Бренд не указывает вашу страну в списке доставки',
    cl_title: 'Магазин закрыт', cl_until: 'Откроется через', cl_wait: 'Закрыт до новой коллекции', cl_check: 'Мы проверяем магазин каждый день: вещи появятся здесь, как только он откроется.', cl_tile: 'закрыт', cl_d: 'д', d_note: 'Это грубая оценка по расстоянию и таможенным границам, а не данные брендов или служб доставки. К сроку добавьте время, за которое бренд собирает заказ. Зачёркнутый бренд не указывает вашу страну в списке доставки.',
    news_quote: 'Дропы, скидки и коллаборации, собранные автоматически',
    next: 'Следующий бренд', more_brands: (n) => `Показать ещё бренды (осталось ${n})`, see_store: 'смотри условия на сайте бренда', more: (n) => `Показать ещё (осталось ${n})`, about: 'О бренде', info: 'Информация', country: 'Страна',
    note: 'ShoWindow — витрина, а не магазин. Все бренды, названия, логотипы и фото принадлежат их владельцам. Цены и наличие берутся с сайтов брендов, покупка происходит на сайте бренда.',
    map_hint: 'Нажмите на точку, чтобы увидеть бренды из этого города', map_reset: 'Показать все',
    g_clothes: 'Одежда', g_acc: 'Аксессуары', g_shoes: 'Обувь', x_all: 'Все', x_m: 'Мужское', x_w: 'Женское', s_az: 'По алфавиту', s_def: 'Вперемешку', s_lo: 'Сначала дешевле', s_hi: 'Сначала дороже', s_sale: 'Самая большая скидка', n_all: 'Все бренды', n_brand: 'Бренд', n_sort: 'Сортировка', n_new: 'Сначала новые', n_old: 'Сначала старые', n_az: 'По бренду, А–Я', n_empty: 'Новостей по этому фильтру пока нет', n_reset: 'Сбросить',
    c_ship: 'доставка', c_world: 'доставка по всему миру', c_ret: (d) => `возврат ${d} дней`, c_drop: 'новый дроп',
  },
  uk: {
    m_europe: 'Уся Європа', m_cities: 'Усі міста', m_in: 'Наблизити', m_out: 'Віддалити', m_title: (b, c) => `${b} ${ruPlural(b, 'бренд', 'бренди', 'брендів')} у ${c} ${ruPlural(c, 'місті', 'містах', 'містах')}`, m_sub: 'Спочатку найближчі до вас. Оберіть місто на карті або у списку. Карту можна наближати щипком і рухати двома пальцями.', m_away: (d) => `${d} км від вас`, m_here: 'ваше місто', m_ship: (d) => `Доставка приблизно ${d}`, m_noship: 'не доставляє до вас', m_latest: (c) => `Нове з міста ${c}`, m_nearby: 'Поруч',
    headline: 'Незалежні стрітвір-бренди. Ціни, доставка й повернення в одному місці.',
    lead: 'Українські та європейські бренди. Речі й ціни оновлюються щодня із сайтів самих брендів.',
    quote_by: 'ShoWindow',
    index_quote: 'Де розташовані бренди',
    d_title: 'Орієнтовні терміни доставки', d_to: 'Куди', d_days: (a, b) => `${a}–${b} ${ruPlural(b, 'день', 'дні', 'днів')}`, d_you: 'Ви', d_customs: 'можливі митні платежі', d_noship: 'Бренд не вказує вашу країну у списку доставки',
    cl_title: 'Магазин закритий', cl_until: 'Відкриється через', cl_wait: 'Закритий до нової колекції', cl_check: 'Ми перевіряємо магазин щодня: речі з’являться тут, щойно він відкриється.', cl_tile: 'закритий', cl_d: 'д', d_note: 'Це груба оцінка за відстанню та митними кордонами, а не дані брендів чи служб доставки. До терміну додайте час, за який бренд збирає замовлення. Закреслений бренд не вказує вашу країну у списку доставки.',
    news_quote: 'Дропи, знижки та колаборації, зібрані автоматично',
    next: 'Наступний бренд', more_brands: (n) => `Показати ще бренди (залишилось ${n})`, see_store: 'дивись умови на сайті бренду', more: (n) => `Показати ще (залишилось ${n})`, about: 'Про бренд', info: 'Інформація', country: 'Країна',
    note: 'ShoWindow — вітрина, а не магазин. Усі бренди, назви, логотипи й фото належать їхнім власникам. Ціни та наявність беруться із сайтів брендів, покупка відбувається на сайті бренду.',
    map_hint: 'Натисніть на точку, щоб побачити бренди з цього міста', map_reset: 'Показати всі',
    g_clothes: 'Одяг', g_acc: 'Аксесуари', g_shoes: 'Взуття', x_all: 'Усі', x_m: 'Чоловіче', x_w: 'Жіноче', s_az: 'За алфавітом', s_def: 'Упереміш', s_lo: 'Спочатку дешевші', s_hi: 'Спочатку дорожчі', s_sale: 'Найбільша знижка', n_all: 'Усі бренди', n_brand: 'Бренд', n_sort: 'Сортування', n_new: 'Спочатку нові', n_old: 'Спочатку старі', n_az: 'За брендом, А–Я', n_empty: 'Новин за цим фільтром поки немає', n_reset: 'Скинути',
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

const CURS = [['EUR', '€'], ['USD', '$'], ['UAH', '₴']];
function readCur() {
  try { const c = localStorage.getItem('cur'); return CURS.some((x) => x[0] === c) ? c : 'EUR'; } catch { return 'EUR'; }
}
function readLang() {
  try { const l = localStorage.getItem('lang'); return dict[l] ? l : 'en'; } catch { return 'en'; }
}

export default function App() {
  const [lang, setLangState] = useState(readLang);
  const setLang = (l) => { setLangState(l); try { localStorage.setItem('lang', l); } catch {} };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const [cur, setCurState] = useState(readCur);
  const setCur = (c) => { setCurState(c); try { localStorage.setItem('cur', c); } catch {} };
  setShownCurrency(cur);
  const route = useRoute();
  const [page, arg] = route.parts;

  let body;
  if (page === 'brand' && brandById[arg]) body = <BrandPage key={arg} brand={brandById[arg]} />;
  else if (page === 'brands') body = <IndexPage />;
  else if (page === 'news') body = <NewsPage />;
  else if (page === 'search') body = <SearchPage q={route.params.get('q') || ''} />;
  else body = <Home />;
  if (page !== 'brand') backTo = window.location.hash.replace(/^#/, '') || '/';

  return <LangContext.Provider value={{ lang, t: dict[lang], w: W[lang], setLang, cur, setCur }}>{body}</LangContext.Provider>;
}

// Language and currency as one quiet "UA / EUR" button; a small panel with both lists opens on click.
const PREF_COPY = { en: ['Language', 'Currency'], ru: ['Язык', 'Валюта'], uk: ['Мова', 'Валюта'] };
function Settings() {
  const { lang, setLang, cur, setCur } = useLang();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (e.key === 'Escape' || (e.type === 'pointerdown' && !box.current?.contains(e.target))) setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, [open]);
  const [lt, ct] = PREF_COPY[lang];
  return (
    <span className="prefs" ref={box}>
      <button className="pref-btn" aria-expanded={open} aria-label={lt + ' / ' + ct} onClick={() => setOpen(!open)}>
        {LANGS.find((l) => l[0] === lang)[1]}<span className="pref-sep">/</span>{cur}
      </button>
      {open && (
        <span className="pref-menu">
          <span className="pm-col"><span className="pm-h">{lt}</span>
            {LANGS.map(([k, l]) => <button key={k} className={k === lang ? 'on' : ''} onClick={() => setLang(k)}>{l}</button>)}
          </span>
          <span className="pm-col"><span className="pm-h">{ct}</span>
            {CURS.map(([k, sign]) => <button key={k} className={k === cur ? 'on' : ''} onClick={() => setCur(k)}>{k} <span className="muted">{sign}</span></button>)}
          </span>
        </span>
      )}
    </span>
  );
}

// Name: "ShoW" at rest; on hover (and once after load) "indow" slides out of the W.
let wordmarkShown = false;
function Wordmark() {
  // On the first visit the name starts as "ShoW", then "indow" slides out, holds, and slides back.
  const [intro, setIntro] = useState(false);
  useEffect(() => {
    if (wordmarkShown) return;
    wordmarkShown = true;
    const open = setTimeout(() => setIntro(true), 450);
    const close = setTimeout(() => setIntro(false), 2900);
    return () => { clearTimeout(open); clearTimeout(close); };
  }, []);
  return (
    <a href="#/" className={'logo' + (intro ? ' wide' : '')} aria-label="ShoWindow">
      <span aria-hidden="true">Sho</span>
      <span aria-hidden="true" className="lw">W</span>
      <span aria-hidden="true" className="lx"><span className="lx-in">
        {'indow'.split('').map((c, i) => <span key={i} style={{ '--k': i }}>{c}</span>)}
      </span></span>
    </a>
  );
}

// Header layout: 'left' (menu next to the name), 'right' (menu next to the settings), 'spread' (menu across the middle).
const NAV_STYLE = 'right';

// ── Top bar on every page: wordmark left, quiet nav right.
function TopBar({ active }) {
  const { t } = useLang();
  return (
    <header className="top" data-nav={NAV_STYLE}>
      <Wordmark />
      <nav className="nav">
        <a href="#/" className={active === 'home' ? 'on' : ''}>{t.nav_brands}</a>
        <a href="#/search" className={active === 'search' ? 'on' : ''}>{t.nav_search}</a>
        <a href="#/brands" className={active === 'index' ? 'on' : ''}>{t.nav_map}</a>
        <a href="#/news" className={active === 'news' ? 'on' : ''}>{t.nav_news}</a>
      </nav>
      <Settings />
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
let homeGroup = 'clothes';
let homeSort = 'def';
// Items of one group for a brand: clothing shows clothing only, and so on.
const groupItems = (id, group) => (itemsByBrand[id] || []).filter((i) => GROUPS[group].includes(i.category));
function Home() {
  const { t, w, lang } = useLang();
  // featured first, then everyone else; more showcases arrive as you scroll (or by button)
  const [group, setGroupState] = useState(homeGroup);
  const [sort, setSortState] = useState(homeSort);
  const order = useMemo(() => {
    const list = HOME_ORDER.filter((b) => groupItems(b.id, group).length > 0 || (b.closed && group === 'clothes'));
    const mid = (b) => { const p = groupItems(b.id, group).filter((i) => !i.demo && i.price > 0).map(priceUAH).sort((x, y) => x - y); return p.length ? p[p.length >> 1] : Infinity; };
    if (sort === 'az') return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'lo') return [...list].sort((a, b) => mid(a) - mid(b));
    if (sort === 'hi') return [...list].sort((a, b) => (mid(b) === Infinity ? -1 : mid(b)) - (mid(a) === Infinity ? -1 : mid(a)));
    return list;
  }, [group, sort]);
  const [count, setCount] = useState(homeCount);
  const setGroup = (g) => { homeGroup = g; setGroupState(g); setCount(BATCH); };
  const setSort = (v) => { homeSort = v; setSortState(v); setCount(BATCH); };
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
        <div className="sp-groups home-groups rise">
          <div className="chips">
            {[['clothes', w.g_clothes], ['acc', w.g_acc], ['shoes', w.g_shoes]].map(([k, l]) => <button key={k} className={'chip' + (group === k ? ' on' : '')} onClick={() => setGroup(k)}>{l}</button>)}
          </div>
          <label className="np-select"><span>{w.n_sort}</span>
            <select id="h-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="def">{w.s_def}</option>
              <option value="az">{w.s_az}</option>
              <option value="lo">{w.s_lo}</option>
              <option value="hi">{w.s_hi}</option>
            </select>
          </label>
        </div>
        <div className="showcases" key={group + sort}>
          {order.slice(0, count).map((b, i) => <Showcase key={b.id} brand={b} group={group} n={i % BATCH} />)}
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
    prices.length > 0 && [...new Set([formatPrice(Math.min(...prices), real[0].currency), formatPrice(Math.max(...prices), real[0].currency)])].join(' – '),
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
// Countdown to a closed shop's opening, ticking every second; without a known date, "closed until the new collection".
function ClosedTime({ closed, big }) {
  const { w } = useLang();
  const to = closed.opensAt ? new Date(closed.opensAt).getTime() : null;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!to) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [to]);
  if (!to || to <= now) return <span className={'ct ct-wait' + (big ? ' big' : '')}>{w.cl_wait}</span>;
  const s = Math.floor((to - now) / 1000);
  const p = (n) => String(n).padStart(2, '0');
  const d = Math.floor(s / 86400);
  return (
    <span className={'ct' + (big ? ' big' : '')}>
      {big && <span className="ct-label">{w.cl_until}</span>}
      <span className="ct-num">{d > 0 ? `${d}${w.cl_d} ` : ''}{p(Math.floor(s / 3600) % 24)}:{p(Math.floor(s / 60) % 60)}:{p(s % 60)}</span>
    </span>
  );
}

function Showcase({ brand, group = 'clothes', n }) {
  const { lang, w } = useLang();
  const base = groupItems(brand.id, group);
  const its = base.length ? Array.from({ length: 3 }, (_, i) => base[i % base.length]) : [];
  const { logo } = brandMedia(brand.id);
  return (
    <a className="showcase rise" style={{ '--i': n }} href={'#/brand/' + brand.id} onClick={(e) => openBrand(e, brand)}>
      <span className="sc-head">
        <span className="sc-name">{brand.name}</span>
        <span className="sc-city">{brand.city || pick(countries[brand.country], lang)}</span>
      </span>
      {brand.closed
        ? <span className="sc-art sc-closed"><span className="scc-tag">{w.cl_tile}</span><ClosedTime closed={brand.closed} /></span>
        : <span className="sc-art collage">
          {its.map((it, i) => <span key={i} className="tile"><Garment item={it} tone={i} /></span>)}
        </span>}
      <ShowcaseMeta brand={brand} items={base} />
    </a>
  );
}

// ── Index: every brand as a typographic row ─────────────────
// Map page: a large map with one pin per city, and rough delivery times to the visitor's country.
const ALL_CLUSTERS = clusterBrands(brands);
const HOME_VIEW = { zoom: 1, cx: MAP.w / 2, cy: MAP.h / 2 };
const stamp = (i) => i.publishedAt || '';

// ── Map: Europe drawn with dots, a pin per city, and a panel that lists the cities by
// distance from the visitor or shows the brands of the chosen city.
function IndexPage() {
  const { lang, t, w } = useLang();
  const [place, setPlace] = useState(null);
  const [view, setView] = useState(HOME_VIEW);
  const [me, setMeState] = useState(guessCountry);
  const setMe = (c) => { setMeState(c); try { localStorage.setItem('country', c); } catch {} };
  const num = useMemo(() => { try { const f = new Intl.NumberFormat(dateLocale[lang]); return (n) => f.format(n); } catch { return String; } }, [lang]);
  const regionName = useMemo(() => { try { const d = new Intl.DisplayNames([lang], { type: 'region' }); return (c) => d.of(c); } catch { return (c) => c; } }, [lang]);

  const home = places[me].geo;
  const [hx, hy] = project(home);
  const mine = ALL_CLUSTERS.find((c) => Math.hypot(c.x - hx, c.y - hy) < 16);
  const rows = ALL_CLUSTERS
    .map((c) => { const list = c.brands; return { ...c, list, n: list.length, ok: true, you: c === mine, d: Math.round(km(home, c.geo)) }; })
    .sort((a, b) => a.d - b.d);
  const shown = rows.filter((c) => c.ok);
  const far = Math.max(1, ...shown.map((c) => c.d));
  const picked = rows.find((c) => c.key === place);

  const select = (key) => {
    const c = rows.find((x) => x.key === key);
    setPlace(key); setView({ zoom: ZOOM, cx: c.x, cy: c.y });
    // on a phone the city opens in a bottom sheet: bring the map right under the header so the pin stays in view
    if (window.matchMedia('(max-width: 768px)').matches) {
      const map = document.querySelector('.dmap'), head = document.querySelector('.top');
      if (map && head) window.scrollTo({ top: map.getBoundingClientRect().top + window.scrollY - head.getBoundingClientRect().bottom - 8, behavior: 'smooth' });
    }
  };
  const reset = () => { setPlace(null); setView((v) => ({ ...v, zoom: 1 })); };
  const ships = (b) => !b.shipsTo || b.country === me || b.shipsTo.includes(me);

  const latest = picked ? picked.list.flatMap((b) => itemsByBrand[b.id] || []).filter((i) => i.image && !i.demo).sort((a, b) => stamp(b).localeCompare(stamp(a))).slice(0, 3) : [];
  const nearby = picked ? rows.filter((c) => c.key !== picked.key && c.ok && Math.hypot(c.x - picked.x, c.y - picked.y) < 75).sort((a, b) => Math.hypot(a.x - picked.x, a.y - picked.y) - Math.hypot(b.x - picked.x, b.y - picked.y)).slice(0, 6) : [];
  const days = picked ? estimate(picked.country, picked.geo, me) : null;

  return (
    <>
      <TopBar active="index" />
      <main className="index-page">
        <div className="mapx">
          <div className="mapx-stage">
            <div className="mapx-bar">
              {view.zoom > 1 && (
                <button type="button" className="mchip mback" onClick={reset}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>{w.m_europe}
                </button>
              )}
            </div>
            <BrandMap
              pins={rows} selected={place} view={view} onSelect={select} onView={setView} focus={picked}
              you={{ x: hx, y: hy }}
              copy={{ you: w.d_you, brands: t.brands_count, leg1: t.brands_count(1), zoomIn: w.m_in, zoomOut: w.m_out }}
            />
          </div>
          <aside className={'mapx-panel' + (picked ? ' open' : '')} aria-live="polite">
            {picked ? (
              <div className="mp-city" key={picked.key}>
                <button type="button" className="mp-back" onClick={reset}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>{w.m_cities}
                </button>
                <p className="mp-kicker">{pick(countries[picked.country], lang) || regionName(picked.country)}</p>
                <h2 className="mp-name">{picked.name}</h2>
                <p className="mp-sub">{t.brands_count(picked.list.length)} · {picked.d < 5 ? w.m_here : w.m_away(num(picked.d))}</p>
                <p className="mp-sub">{w.m_ship(w.d_days(...days.days))}{days.customs ? ' · ' + w.d_customs : ''}</p>
                <div className="mp-brands">
                  {picked.list.map((b) => {
                    const n = (itemsByBrand[b.id] || []).filter((i) => !i.demo).length;
                    const bits = [b.style?.[0], b.closed ? w.cl_tile : n ? t.items_found(n) : null, picked.names.length > 1 ? b.city : null, ships(b) ? null : w.m_noship].filter(Boolean);
                    return (
                      <a key={b.id} className="mp-brand" href={'#/brand/' + b.id}>
                        <span className="mp-bname">{b.name}<small>{bits.join(' · ')}</small></span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M6 3l5 5-5 5" /></svg>
                      </a>
                    );
                  })}
                </div>
                {latest.length > 0 && (
                  <>
                    <p className="mp-kicker gap">{w.m_latest(picked.name)}</p>
                    <div className="mp-latest">
                      {latest.map((i) => (
                        <a key={i.id} href={i.url || '#/brand/' + i.brandId} {...(i.url ? { target: '_blank', rel: 'noreferrer' } : {})} title={`${brandById[i.brandId].name} · ${i.title}`}>
                          <span className="mp-tile"><Garment item={i} /></span>
                          <small>{brandById[i.brandId].name}</small>
                        </a>
                      ))}
                    </div>
                  </>
                )}
                {nearby.length > 0 && (
                  <>
                    <p className="mp-kicker gap">{w.m_nearby}</p>
                    <div className="mp-near">
                      {nearby.map((c) => <button key={c.key} type="button" className="mchip" onClick={() => select(c.key)}>{c.name} · {c.list.length}</button>)}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="mp-over">
                <p className="mp-kicker">{w.index_quote}</p>
                <h2 className="mp-title">{w.m_title(shown.reduce((s, c) => s + c.list.length, 0), shown.length)}</h2>
                <p className="mp-sub">{w.m_sub}</p>
                <div className="mp-rows">
                  {shown.map((c, i) => (
                    <button key={c.key} type="button" className="mp-row" onClick={() => select(c.key)} aria-label={`${c.name}, ${t.brands_count(c.list.length)}, ${num(c.d)} km`}>
                      <span className="mp-i">{i + 1}</span>
                      <span className="mp-rname">{c.name}{c.you && <small> · {w.d_you}</small>}</span>
                      <span className="mp-n">{c.list.length}</span>
                      <span className="mp-bar"><i style={{ width: Math.max(2, (c.d / far) * 100) + '%' }} /></span>
                      <span className="mp-km">{num(c.d)} km</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
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
            {shown.map((c) => ({ c, e: estimate(c.country, c.geo, me) })).sort((a, b) => a.e.days[0] - b.e.days[0] || a.e.days[1] - b.e.days[1] || a.c.d - b.c.d).map(({ c, e }) => (
              <div key={c.key} className={'dl-row' + (place === c.key ? ' hot' : '')}>
                <span className="dl-days">{w.d_days(...e.days)}</span>
                <span className="dl-from">{c.names.join(', ')}<small>{pick(countries[c.country], lang)}{e.customs ? ' · ' + w.d_customs : ''}</small></span>
                <span className="dl-brands">{c.list.map((b) => <a key={b.id} className={'dl-brand' + (ships(b) ? '' : ' no')} href={'#/brand/' + b.id} title={ships(b) ? undefined : w.d_noship}>{b.name}</a>)}</span>
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
        {n.source?.url && <a href={n.source.url} target="_blank" rel="noreferrer">{t.shop} ↗</a>}
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
  // The catalogue opens on the section picked on the home page; other sections the brand has are one tap away.
  const groups = Object.keys(GROUPS).filter((g) => groupItems(brand.id, g).length > 0);
  const [group, setGroupState] = useState(groups.includes(homeGroup) ? homeGroup : groups[0] || 'clothes');
  const its = groupItems(brand.id, group);
  const bn = news.filter((n) => n.brandId === brand.id);
  const { logo } = brandMedia(brand.id);
  const isDemo = its.some((i) => i.demo);
  const [shown, setShown] = useState(PAGE);
  const setGroup = (g) => { homeGroup = g; setGroupState(g); setShown(PAGE); };
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

  // Arrived through the growing showcase: the name is already in place, so it must not rise
  // again when that transition ends (it used to replay its entrance a moment later).
  const [arrived] = useState(() => document.documentElement.classList.contains('from-fx'));

  return (
    <>
      <TopBar />
      <div className={'brand' + (open ? ' open' : '')} ref={page}>
        <aside className="side">
          <blockquote className="quote">
            <p>{brand.style.join(', ')}</p>
            <cite>{[brand.city, pick(countries[brand.country], lang)].filter(Boolean).join(', ')}</cite>
          </blockquote>
          <div className="giant-clip"><h1 className={'giant' + (arrived ? ' still' : '')} style={{ '--len': longestWord(brand.name) }}>{brand.name.toLowerCase().split(/\s+/).map((x, i) => <span key={i}>{x} </span>)}</h1></div>
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
              {groups.length > 1 && <span className="chips store-groups">
                {groups.map((g) => <button key={g} className={'chip' + (group === g ? ' on' : '')} onClick={() => setGroup(g)}>{w['g_' + g]}</button>)}
              </span>}
              {!brand.closed && <span className="muted">{t.items_found(its.length)}</span>}
              {brand.website && <a className="store-link" href={brand.website} target="_blank" rel="noreferrer">{t.shop} ↗</a>}
            </div>
            {isDemo && <p className="demo-note">{t.demo_note}</p>}
            <div className="store-grid" ref={grid}>{brand.closed
              ? <div className="closed-panel">
                  <h3>{w.cl_title}</h3>
                  <ClosedTime closed={brand.closed} big />
                  {brand.closed.note && <p className="cp-note">“{brand.closed.note}”</p>}
                  <p className="muted">{w.cl_check}</p>
                </div>
              : its.slice(0, shown).map((i) => <ItemCard key={i.id} item={i} />)}</div>
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
              {brand.instagram && <div><dt>Instagram</dt><dd>{brand.instagram ? <a href={'https://instagram.com/' + brand.instagram} target="_blank" rel="noreferrer">@{brand.instagram}</a> : <span className="muted">{t.no_link}</span>}{brand.instagram && unv('instagram')}</dd></div>}
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
const GROUPS = { clothes: ['tee', 'shirt', 'hoodie', 'knit', 'jacket', 'jeans', 'pants', 'shorts', 'skirt', 'other'], acc: ['accessories', 'cap'], shoes: ['shoes'] };
const groupOf = (cat) => Object.keys(GROUPS).find((g) => GROUPS[g].includes(cat)) || 'clothes';
const priceUAH = (i) => i.price * (toUAH[i.currency] || 1);
const discount = (i) => (i.compareAt > i.price ? 1 - i.price / i.compareAt : 0);
// Default order: one item from each brand in turn, so no brand fills the first screens.
function interleave(list) {
  const seen = {};
  return list.map((i) => [i, (seen[i.brandId] = (seen[i.brandId] || 0) + 1)]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
}
function SearchPage({ q }) {
  const { lang, t, w, cur } = useLang();
  const rate = toUAH[cur];
  const sign = CURS.find((c) => c[0] === cur)[1];
  const parsed = useMemo(() => parseQuery(q), [q]);
  const [f, setF] = useState(parsed);
  useEffect(() => setF(parsed), [parsed]);
  const [group, setGroup] = useState(groupOf(parsed.category));
  useEffect(() => setGroup(groupOf(parsed.category)), [parsed]);
  const [sort, setSort] = useState('def');
  const [shown, setShown] = useState(48);
  useEffect(() => setShown(48), [f, group, sort]);
  const pickGroup = (g) => { setGroup(g); setF((o) => ({ ...o, category: undefined })); };
  const set = (k, v) => setF((o) => ({ ...o, [k]: v === '' || v === false ? undefined : v }));

  let found = items.filter((i) => GROUPS[group].includes(i.category) && matchItem(i, brandById[i.brandId], f));
  if (sort === 'def') found = interleave(found);
  if (sort === 'lo') found.sort((a, b) => priceUAH(a) - priceUAH(b));
  if (sort === 'hi') found.sort((a, b) => priceUAH(b) - priceUAH(a));
  if (sort === 'sale') found.sort((a, b) => discount(b) - discount(a));

  const chips = [];
  if (f.category) chips.push(pick(categories[f.category], lang));
  if (f.gender) chips.push(w['x_' + f.gender]);
  if (f.minUAH != null) chips.push(`${t.from} ${sign}${Math.round(f.minUAH / rate)}`);
  if (f.maxUAH != null) chips.push(`${t.to} ${sign}${Math.round(f.maxUAH / rate)}`);
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
      <div className="sp-groups rise">
        <div className="chips">
          {[['clothes', w.g_clothes], ['acc', w.g_acc], ['shoes', w.g_shoes]].map(([k, l]) => <button key={k} className={'chip' + (group === k ? ' on' : '')} onClick={() => pickGroup(k)}>{l}</button>)}
        </div>
        <div className="chips sp-gender">
          {[['', w.x_all], ['m', w.x_m], ['w', w.x_w]].map(([k, l]) => <button key={k || 'all'} className={'chip' + ((f.gender || '') === k ? ' on' : '')} onClick={() => set('gender', k)}>{l}</button>)}
        </div>
        <label className="np-select"><span>{w.n_sort}</span>
          <select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="def">{w.s_def}</option>
            <option value="lo">{w.s_lo}</option>
            <option value="hi">{w.s_hi}</option>
            <option value="sale">{w.s_sale}</option>
          </select>
        </label>
      </div>
      <div className="filters rise">
        <label>{t.category}
          <select id="f-cat" value={f.category || ''} onChange={(e) => set('category', e.target.value)}>
            <option value="">{t.any}</option>
            {GROUPS[group].map((k) => <option key={k} value={k}>{pick(categories[k], lang)}</option>)}
          </select>
        </label>
        <label>{t.price.replace('₴', sign)}
          <span className="row">
            <input id="f-min" type="number" min="0" placeholder={t.from} value={f.minUAH != null ? Math.round(f.minUAH / rate) : ''} onChange={(e) => set('minUAH', e.target.value === '' ? '' : +e.target.value * rate)} />
            <input id="f-max" type="number" min="0" placeholder={t.to} value={f.maxUAH != null ? Math.round(f.maxUAH / rate) : ''} onChange={(e) => set('maxUAH', e.target.value === '' ? '' : +e.target.value * rate)} />
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
