import { useEffect, useMemo, useState } from 'react';
import { LangContext, dict, useLang } from './i18n.js';
import { brands, items, news, brandById, categories, regions, formatPrice } from './data/catalog.js';
import { countries } from './data/brands.js';
import { parseQuery, matchItem } from './search.js';
import Garment from './components/Garment.jsx';

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
    brands: 'brands', index: 'index', index_nav: 'Index',
    intro: 'A growing index of independent labels: what they make, what it costs, where they ship and how returns work. News on drops and sales is collected for you.', news: 'news', search: 'search',
    quote: 'Ukrainian and European streetwear, collected in one place',
    quote_by: 'Drop Index',
    featured: 'Selected brands', all: (n) => `All ${n} brands`,
    index_quote: 'Every brand in the index, A to Z',
    news_quote: 'Drops, sales and collaborations, collected automatically',
    search_quote: 'Describe what you want in plain words',
    about: 'About', info: 'Information', country: 'Country',
  },
  ru: {
    brands: 'бренды', index: 'индекс', index_nav: 'Индекс',
    intro: 'Растущий индекс независимых брендов: что они делают, сколько это стоит, куда доставляют и как устроен возврат. Новости о дропах и скидках собираются автоматически.', news: 'новости', search: 'поиск',
    quote: 'Украинский и европейский стритвир, собранный в одном месте',
    quote_by: 'Drop Index',
    featured: 'Избранные бренды', all: (n) => `Все ${n} брендов`,
    index_quote: 'Все бренды индекса, от A до Z',
    news_quote: 'Дропы, скидки и коллаборации, собранные автоматически',
    search_quote: 'Опиши обычными словами, что ищешь',
    about: 'О бренде', info: 'Информация', country: 'Страна',
  },
};

const FEATURED = ['nofaith-studios', 'sndct-kyiv', 'ksenia-schnaider', 'corteiz', 'daily-paper', 'represent'];
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
  try { return localStorage.getItem('lang') || 'ru'; } catch { return 'ru'; }
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
        <a href="#/brands" className={active === 'index' ? 'on' : ''}>{W[lang].index_nav}</a>
        <a href="#/news" className={active === 'news' ? 'on' : ''}>{t.nav_news}</a>
        <a href="#/search" className={active === 'search' ? 'on' : ''}>{t.nav_search}</a>
        <span className="lang" role="group" aria-label="Language">
          {['en', 'ru'].map((l) => (
            <button key={l} className={l === lang ? 'on' : ''} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
          ))}
        </span>
      </nav>
    </header>
  );
}

// ── Inner pages: quote top-left, giant word bottom-left, content column.
function Shell({ word, quote, by, wide, active, links, children }) {
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
          <footer className="foot">
            <span>{t.footer}</span>
            {links && <span className="foot-links">{links}</span>}
          </footer>
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
const RATIOS = ['1 / 1', '3 / 4', '4 / 5', '5 / 3', '4 / 3', '1 / 1.15'];

function Home() {
  const { t, w } = useLang();
  const list = FEATURED.map((id) => brandById[id]).filter(Boolean);
  return (
    <>
      <TopBar active="home" />
      <main className="home">
        <div className="title-row">
          <span className="label rise">{w.featured}</span>
          <div className="giant-clip"><h1 className="home-title">Drop Index</h1></div>
        </div>
        <div className="intro rise">
          <p className="intro-left">{w.quote}</p>
          <div className="intro-right">
            <p>{w.intro}</p>
            <a className="btn" href="#/brands">{w.all(brands.length)}</a>
          </div>
        </div>
        <div className="showcases">
          {list.map((b, i) => <Showcase key={b.id} brand={b} n={i} />)}
        </div>
        <div className="home-search rise">
          <span className="label">{t.nav_search}</span>
          <SearchBar />
        </div>
        <footer className="foot"><span>{t.footer}</span></footer>
      </main>
    </>
  );
}

function Showcase({ brand, n }) {
  const { lang } = useLang();
  const its = itemsByBrand[brand.id] || [];
  return (
    <a className="showcase rise" style={{ '--i': n }} href={'#/brand/' + brand.id} onClick={(e) => openBrand(e, brand)}>
      <span className="sc-art" style={{ aspectRatio: RATIOS[n % RATIOS.length] }}>{its[0] && <Garment item={its[n % its.length]} tone={n} />}</span>
      <span className="sc-cap">
        <span className="sc-name">{brand.name}</span>
        <span className="sc-city">{brand.city || countries[brand.country][lang]}</span>
      </span>
    </a>
  );
}

// ── Index: every brand as a typographic row ─────────────────
function IndexPage() {
  const { lang, t, w } = useLang();
  const [origin, setOrigin] = useState('ALL');
  const list = brands
    .filter((b) => origin === 'ALL' || (origin === 'UA' ? b.country === 'UA' : b.country !== 'UA'))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Shell word={w.index} quote={w.index_quote} by={t.brands_count(list.length)} wide active="index">
      <div className="row-head rise">
        <h2>{t.all_brands}</h2>
        <div className="chips">
          {[['ALL', t.any], ['UA', 'UA'], ['EU', 'EU']].map(([k, label]) => (
            <button key={k} className={origin === k ? 'chip on' : 'chip'} onClick={() => setOrigin(k)}>{label}</button>
          ))}
        </div>
      </div>
      <div className="index-list rise">
        {list.map((b) => (
          <a key={b.id} className="index-row" href={'#/brand/' + b.id} onClick={(e) => openBrand(e, b)}>
            <span className="ir-name">{b.name}</span>
            <span className="ir-style">{b.style.join(', ')}</span>
            <span className="ir-city">{b.city || countries[b.country][lang]}</span>
          </a>
        ))}
      </div>
    </Shell>
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
        <time>{new Date(n.date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' })}</time>
      </div>
      <h3>{n.title[lang]}</h3>
      <p>{n.summary[lang]}</p>
      <div className="news-links">
        {b && <a href={'#/brand/' + b.id}>{b.name} →</a>}
        {n.source?.url && <a href={n.source.url} target="_blank" rel="noreferrer">↗</a>}
      </div>
    </article>
  );
}

function NewsPage() {
  const { t, w } = useLang();
  const [type, setType] = useState('all');
  const list = news.filter((n) => type === 'all' || n.type === type);
  return (
    <Shell word={w.news} quote={w.news_quote} active="news">
      <div className="chips rise">
        {['all', 'drop', 'sale', 'collab', 'news'].map((k) => (
          <button key={k} className={type === k ? 'chip on' : 'chip'} onClick={() => setType(k)}>
            {k === 'all' ? t.any : t.news_types[k]}
          </button>
        ))}
      </div>
      <div className="news-list rise">{list.map((n) => <NewsCard key={n.id} n={n} />)}</div>
    </Shell>
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

// ── Brand page ──────────────────────────────────────────────
function BrandPage({ brand }) {
  const { lang, t, w } = useLang();
  const its = itemsByBrand[brand.id] || [];
  const bn = news.filter((n) => n.brandId === brand.id);
  const isDemo = its.some((i) => i.demo);
  const unv = (field) => (brand.verified.includes(field) ? null : <em className="unv">{t.unverified}</em>);
  const links = (
    <>
      {brand.instagram && <a href={'https://instagram.com/' + brand.instagram} target="_blank" rel="noreferrer">Instagram</a>}
      {brand.website && <a href={brand.website} target="_blank" rel="noreferrer">{t.website}</a>}
    </>
  );
  return (
    <Shell word={brand.name.toLowerCase()} quote={brand.style.join(', ')} by={[brand.city, countries[brand.country][lang]].filter(Boolean).join(', ')} links={links}>
      <a href="#/" className="back rise">{t.back}</a>
      <p className="lead rise">{brand.description[lang]}</p>

      <div className="hero-img rise">{its[0] && <Garment item={its[0]} tone={0} />}</div>

      <section className="rise">
        <h2>{w.info}</h2>
        <dl className="facts">
          <div><dt>{w.country}</dt><dd>{countries[brand.country][lang]}{brand.city ? ', ' + brand.city : ''}</dd></div>
          {brand.founded && <div><dt>{t.founded}</dt><dd>{brand.founded}</dd></div>}
          <div><dt>{t.website}</dt><dd>{brand.website ? <a href={brand.website} target="_blank" rel="noreferrer">{brand.website.replace(/^https?:\/\/(www\.)?/, '')}</a> : <span className="muted">{t.no_link}</span>}{brand.website && unv('website')}</dd></div>
          <div><dt>Instagram</dt><dd>{brand.instagram ? <a href={'https://instagram.com/' + brand.instagram} target="_blank" rel="noreferrer">@{brand.instagram}</a> : <span className="muted">{t.no_link}</span>}{brand.instagram && unv('instagram')}</dd></div>
          <div><dt>{t.shipping}</dt><dd>{brand.shipping.map((r) => regions[r][lang]).join(', ')}{unv('shipping')}{brand.shippingNote && <small>{brand.shippingNote[lang]}</small>}</dd></div>
          <div><dt>{t.returns}</dt><dd>{brand.returns?.days ? t.returns_days(brand.returns.days) : t.no_returns}{unv('returns')}{brand.returnsNote && <small>{brand.returnsNote[lang]}</small>}</dd></div>
        </dl>
      </section>

      <section className="rise">
        <h2>{t.items}</h2>
        {isDemo && <p className="demo-note">{t.demo_note}</p>}
        <div className="item-grid">{its.map((i) => <ItemCard key={i.id} item={i} />)}</div>
      </section>

      {bn.length > 0 && (
        <section className="rise">
          <h2>{t.news_from}</h2>
          <div className="news-list">{bn.map((n) => <NewsCard key={n.id} n={n} />)}</div>
        </section>
      )}
    </Shell>
  );
}

// ── Search: text query → parsed filters, editable ───────────
function SearchPage({ q }) {
  const { lang, t, w } = useLang();
  const parsed = useMemo(() => parseQuery(q), [q]);
  const [f, setF] = useState(parsed);
  useEffect(() => setF(parsed), [parsed]);
  const set = (k, v) => setF((o) => ({ ...o, [k]: v === '' || v === false ? undefined : v }));

  const found = items.filter((i) => matchItem(i, brandById[i.brandId], f));

  const chips = [];
  if (f.category) chips.push(categories[f.category][lang]);
  if (f.minUAH != null) chips.push(`${t.from} ${Math.round(f.minUAH)} ₴`);
  if (f.maxUAH != null) chips.push(`${t.to} ${Math.round(f.maxUAH)} ₴`);
  if (f.ship) chips.push(`${t.ship_to}: ${regions[f.ship][lang]}`);
  if (f.country) chips.push(countries[f.country][lang]);
  if (f.returns) chips.push(t.returns_only);
  if (f.onSale) chips.push(t.sale_only);
  if (f.text?.length) chips.push('“' + f.text.join(' ') + '”');

  return (
    <Shell word={w.search} quote={w.search_quote} by={t.items_found(found.length)} wide active="search">
      <div className="rise"><SearchBar initial={q} /></div>
      {chips.length > 0 && (
        <div className="understood rise">{t.understood}: {chips.map((c) => <span key={c} className="tag">{c}</span>)}</div>
      )}
      <div className="filters rise">
        <label>{t.category}
          <select id="f-cat" value={f.category || ''} onChange={(e) => set('category', e.target.value)}>
            <option value="">{t.any}</option>
            {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
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
            {Object.entries(regions).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
          </select>
        </label>
        <label>{t.origin}
          <select id="f-country" value={f.country || ''} onChange={(e) => set('country', e.target.value)}>
            <option value="">{t.any}</option>
            {Object.entries(countries).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
          </select>
        </label>
        <label className="check"><input id="f-ret" type="checkbox" checked={!!f.returns} onChange={(e) => set('returns', e.target.checked)} /> {t.returns_only}</label>
        <label className="check"><input id="f-sale" type="checkbox" checked={!!f.onSale} onChange={(e) => set('onSale', e.target.checked)} /> {t.sale_only}</label>
        <button className="reset" onClick={() => go('/search')}>{t.reset}</button>
      </div>
      {found.length
        ? <div className="item-grid wide-grid rise">{found.map((i) => <ItemCard key={i.id} item={i} showBrand />)}</div>
        : <p className="muted rise">{t.nothing}</p>}
      {items.some((i) => i.demo) && <p className="demo-note">{t.demo_note}</p>}
    </Shell>
  );
}
