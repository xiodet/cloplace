import { useEffect, useMemo, useState } from 'react';
import { LangContext, dict, useLang } from './i18n.js';
import { brands, items, news, brandById, categories, regions, formatPrice } from './data/catalog.js';
import { countries } from './data/brands.js';
import { parseQuery, matchItem } from './search.js';
import Garment from './components/Garment.jsx';

// ── tiny hash router: #/  #/brand/:id  #/news  #/search?q=...
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
  if (page === 'brand' && brandById[arg]) body = <BrandPage brand={brandById[arg]} />;
  else if (page === 'news') body = <NewsPage />;
  else if (page === 'search') body = <SearchPage q={route.params.get('q') || ''} />;
  else body = <Home />;

  return (
    <LangContext.Provider value={{ lang, t: dict[lang], setLang }}>
      <Header />
      <main>{body}</main>
      <Footer />
    </LangContext.Provider>
  );
}

function Header() {
  const { lang, t, setLang } = useLang();
  return (
    <header className="header">
      <a href="#/" className="logo">Drop<span>/</span>Index</a>
      <nav>
        <a href="#/">{t.nav_brands}</a>
        <a href="#/news">{t.nav_news}</a>
        <a href="#/search">{t.nav_search}</a>
      </nav>
      <div className="lang" role="group" aria-label="Language">
        {['en', 'ru'].map((l) => (
          <button key={l} className={l === lang ? 'on' : ''} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
        ))}
      </div>
    </header>
  );
}

function Footer() {
  const { t } = useLang();
  return <footer className="footer">{t.footer}</footer>;
}

function SearchBar({ initial = '' }) {
  const { t } = useLang();
  const [q, setQ] = useState(initial);
  useEffect(() => setQ(initial), [initial]);
  return (
    <form className="searchbar" onSubmit={(e) => { e.preventDefault(); go('/search?q=' + encodeURIComponent(q)); }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search_ph} aria-label={t.nav_search} />
      <button type="submit">{t.search_btn}</button>
    </form>
  );
}

const itemsByBrand = items.reduce((m, i) => ((m[i.brandId] ||= []).push(i), m), {});

// ── Home: hero search, news strip, brand grid ──────────────
function Home() {
  const { lang, t } = useLang();
  const [origin, setOrigin] = useState('ALL');
  const list = brands.filter((b) => origin === 'ALL' || (origin === 'UA' ? b.country === 'UA' : b.country !== 'UA'));
  return (
    <>
      <section className="hero">
        <h1>{t.tagline}</h1>
        <SearchBar />
        <div className="examples">
          {(lang === 'ru'
            ? ['худи до 3000 грн с доставкой в Киев', 'украинские футболки со скидкой', 'куртка до 300 евро с возвратом']
            : ['hoodie under 3000 UAH shipping to Kyiv', 'ukrainian tees on sale', 'jacket under €300 with returns']
          ).map((ex) => <a key={ex} href={'#/search?q=' + encodeURIComponent(ex)}>{ex}</a>)}
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>{t.latest_news}</h2>
          <a href="#/news">{t.all_news} →</a>
        </div>
        <div className="news-strip">{news.slice(0, 4).map((n) => <NewsCard key={n.id} n={n} />)}</div>
      </section>

      <section>
        <div className="section-head">
          <h2>{t.all_brands} <small>{t.brands_count(list.length)}</small></h2>
          <div className="chips">
            {[['ALL', ''], ['UA', 'UA'], ['EU', 'EU']].map(([k, label]) => (
              <button key={k} className={origin === k ? 'chip on' : 'chip'} onClick={() => setOrigin(k)}>
                {k === 'ALL' ? t.any : label}
              </button>
            ))}
          </div>
        </div>
        <div className="brand-grid">{list.map((b) => <BrandCard key={b.id} brand={b} />)}</div>
      </section>
    </>
  );
}

// Card per the sketch: name on top, collection collage underneath.
function BrandCard({ brand }) {
  const { lang } = useLang();
  const base = itemsByBrand[brand.id] || [];
  const its = base.length ? Array.from({ length: 6 }, (_, i) => base[i % base.length]) : [];
  return (
    <a className="brand-card" href={'#/brand/' + brand.id}>
      <div className="brand-card-head">
        <h3>{brand.name}</h3>
        <span className="meta">{brand.city || countries[brand.country][lang]}</span>
      </div>
      <div className="collage">
        {its.map((it, i) => <div key={i} className={'tile t' + i}><Garment item={it} tone={i} /></div>)}
      </div>
      <div className="tags">{brand.style.map((s) => <span key={s}>{s}</span>)}</div>
    </a>
  );
}

function NewsCard({ n }) {
  const { lang, t } = useLang();
  const b = brandById[n.brandId];
  return (
    <article className={'news-card type-' + n.type}>
      <div className="news-top">
        <span className="ntype">{t.news_types[n.type]}</span>
        {n.demo && <span className="demo">{t.demo_badge}</span>}
        <time>{new Date(n.date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' })}</time>
      </div>
      <h3>{n.title[lang]}</h3>
      <p>{n.summary[lang]}</p>
      {b && <a className="news-brand" href={'#/brand/' + b.id}>{b.name} →</a>}
      {n.source?.url && <a className="news-src" href={n.source.url} target="_blank" rel="noreferrer">↗</a>}
    </article>
  );
}

function NewsPage() {
  const { t } = useLang();
  const [type, setType] = useState('all');
  const list = news.filter((n) => type === 'all' || n.type === type);
  return (
    <section>
      <div className="section-head">
        <h2>{t.nav_news}</h2>
        <div className="chips">
          {['all', 'drop', 'sale', 'collab', 'news'].map((k) => (
            <button key={k} className={type === k ? 'chip on' : 'chip'} onClick={() => setType(k)}>
              {k === 'all' ? t.any : t.news_types[k]}
            </button>
          ))}
        </div>
      </div>
      <div className="news-grid">{list.map((n) => <NewsCard key={n.id} n={n} />)}</div>
    </section>
  );
}

function ItemCard({ item }) {
  const { t } = useLang();
  const b = brandById[item.brandId];
  const Tag = item.url ? 'a' : 'div';
  return (
    <Tag className="item-card" {...(item.url ? { href: item.url, target: '_blank', rel: 'noreferrer' } : {})}>
      <div className="item-img"><Garment item={item} />{item.demo && <span className="demo on-img">{t.demo_badge}</span>}</div>
      <div className="item-body">
        <span className="item-brand">{b.name}</span>
        <span className="item-title">{item.title}</span>
        <span className="item-price">
          {formatPrice(item.price, item.currency)}
          {item.compareAt && <s>{formatPrice(item.compareAt, item.currency)}</s>}
        </span>
      </div>
    </Tag>
  );
}

function BrandPage({ brand }) {
  const { lang, t } = useLang();
  const its = itemsByBrand[brand.id] || [];
  const bn = news.filter((n) => n.brandId === brand.id);
  const isDemo = its.some((i) => i.demo);
  const check = (field) => brand.verified.includes(field) ? null : <em className="unv">({t.unverified})</em>;
  return (
    <div className="brand-page">
      <a href="#/" className="back">{t.back}</a>
      <div className="brand-hero">
        <div>
          <span className="meta">{countries[brand.country][lang]}{brand.city ? ' · ' + brand.city : ''}{brand.founded ? ` · ${t.founded} ${brand.founded}` : ''}</span>
          <h1>{brand.name}</h1>
          <p>{brand.description[lang]}</p>
          <div className="tags">{brand.style.map((s) => <span key={s}>{s}</span>)}</div>
        </div>
      </div>

      <div className="brand-info">
        <div className="info-box">
          <h4>{t.website}</h4>
          {brand.website ? <a href={brand.website} target="_blank" rel="noreferrer">{brand.website.replace(/^https?:\/\/(www\.)?/, '')}</a> : <span className="muted">{t.no_link}</span>}
          {brand.website && check('website')}
        </div>
        <div className="info-box">
          <h4>{t.instagram}</h4>
          {brand.instagram ? <a href={'https://instagram.com/' + brand.instagram} target="_blank" rel="noreferrer">@{brand.instagram}</a> : <span className="muted">{t.no_link}</span>}
          {brand.instagram && check('instagram')}
        </div>
        <div className="info-box">
          <h4>{t.shipping}</h4>
          <span>{brand.shipping.map((r) => regions[r][lang]).join(', ')}</span> {check('shipping')}
        </div>
        <div className="info-box">
          <h4>{t.returns}</h4>
          <span>{brand.returns?.days ? t.returns_days(brand.returns.days) : t.no_returns}</span> {check('returns')}
        </div>
      </div>

      <h2>{t.items}</h2>
      {isDemo && <p className="demo-note">{t.demo_note}</p>}
      <div className="item-grid">{its.map((i) => <ItemCard key={i.id} item={i} />)}</div>

      {bn.length > 0 && (<><h2>{t.news_from}</h2><div className="news-grid">{bn.map((n) => <NewsCard key={n.id} n={n} />)}</div></>)}
    </div>
  );
}

// ── Search: text query → parsed filters, editable in the sidebar ──
function SearchPage({ q }) {
  const { lang, t } = useLang();
  const parsed = useMemo(() => parseQuery(q), [q]);
  const [f, setF] = useState(parsed);
  useEffect(() => setF(parsed), [parsed]);
  const [mode, setMode] = useState('items');
  const set = (k, v) => setF((o) => ({ ...o, [k]: v === '' || v === false ? undefined : v }));

  const foundItems = items.filter((i) => matchItem(i, brandById[i.brandId], f));
  const foundBrands = brands.filter((b) => {
    const its = itemsByBrand[b.id] || [];
    const brandOnly = { ...f, text: undefined };
    const textOk = !f.text?.length || f.text.every((w) => (b.name + ' ' + b.style.join(' ') + ' ' + b.description[lang]).toLowerCase().includes(w))
      || its.some((i) => matchItem(i, b, f));
    return textOk && its.some((i) => matchItem(i, b, brandOnly));
  });

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
    <div className="search-page">
      <SearchBar initial={q} />
      {chips.length > 0 && (
        <div className="understood">{t.understood}: {chips.map((c) => <span key={c} className="chip on small">{c}</span>)}</div>
      )}
      <div className="search-layout">
        <aside className="filters">
          <h3>{t.filters}</h3>
          <label>{t.category}
            <select value={f.category || ''} onChange={(e) => set('category', e.target.value)}>
              <option value="">{t.any}</option>
              {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
            </select>
          </label>
          <label>{t.price}
            <div className="row">
              <input type="number" min="0" placeholder={t.from} value={f.minUAH != null ? Math.round(f.minUAH) : ''} onChange={(e) => set('minUAH', e.target.value === '' ? '' : +e.target.value)} />
              <input type="number" min="0" placeholder={t.to} value={f.maxUAH != null ? Math.round(f.maxUAH) : ''} onChange={(e) => set('maxUAH', e.target.value === '' ? '' : +e.target.value)} />
            </div>
          </label>
          <label>{t.ship_to}
            <select value={f.ship || ''} onChange={(e) => set('ship', e.target.value)}>
              <option value="">{t.any}</option>
              {Object.entries(regions).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
            </select>
          </label>
          <label>{t.origin}
            <select value={f.country || ''} onChange={(e) => set('country', e.target.value)}>
              <option value="">{t.any}</option>
              {Object.entries(countries).map(([k, v]) => <option key={k} value={k}>{v[lang]}</option>)}
            </select>
          </label>
          <label className="check"><input type="checkbox" checked={!!f.returns} onChange={(e) => set('returns', e.target.checked)} /> {t.returns_only}</label>
          <label className="check"><input type="checkbox" checked={!!f.onSale} onChange={(e) => set('onSale', e.target.checked)} /> {t.sale_only}</label>
          <button className="reset" onClick={() => go('/search')}>{t.reset}</button>
        </aside>
        <div className="results">
          <div className="chips">
            <button className={mode === 'items' ? 'chip on' : 'chip'} onClick={() => setMode('items')}>{t.show_items} · {foundItems.length}</button>
            <button className={mode === 'brands' ? 'chip on' : 'chip'} onClick={() => setMode('brands')}>{t.show_brands} · {foundBrands.length}</button>
          </div>
          {mode === 'items'
            ? (foundItems.length ? <div className="item-grid">{foundItems.map((i) => <ItemCard key={i.id} item={i} />)}</div> : <p className="muted">{t.nothing}</p>)
            : (foundBrands.length ? <div className="brand-grid">{foundBrands.map((b) => <BrandCard key={b.id} brand={b} />)}</div> : <p className="muted">{t.nothing}</p>)}
          {items.some((i) => i.demo) && <p className="demo-note">{t.demo_note}</p>}
        </div>
      </div>
    </div>
  );
}
