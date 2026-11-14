import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LangContext, dict, useLang } from './i18n.js';
import { brands, items, news, brandById, categories, regions, formatPrice, liveBrandIds, brandMedia } from './data/catalog.js';
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
    next: 'Next brand', more_brands: (n) => `Show more brands (${n} left)`, see_store: 'see the store’s policy', more: (n) => `Show more (${n} left)`, about: 'About', info: 'Information', country: 'Country',
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
    next: 'Следующий бренд', more_brands: (n) => `Показать ещё бренды (осталось ${n})`, see_store: 'смотри условия на сайте бренда', more: (n) => `Показать ещё (осталось ${n})`, about: 'О бренде', info: 'Информация', country: 'Страна',
  },
};

// Six showcases: brands with real collected photos first, then the hand-picked rest.
const PICKS = ['nofaith-studios', 'antisocial-laboratory', 'scuffers', 'racer-worldwide', 'society-de-nobodies', 'jaded-london', 'lomalab', 'lkc2000', 'fwwproject'];
const FEATURED = [...PICKS.filter((id) => liveBrandIds.includes(id)), ...PICKS.filter((id) => !liveBrandIds.includes(id))].slice(0, 6);
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
  const { t, w } = useLang();
  // featured first, then everyone else; more showcases arrive as you scroll (or by button)
  const order = useMemo(() => [...FEATURED.map((id) => brandById[id]).filter(Boolean), ...brands.filter((b) => !FEATURED.includes(b.id))], []);
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
          <span className="label rise">{t.nav_brands} · {brands.length}</span>
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
          {order.slice(0, count).map((b, i) => <Showcase key={b.id} brand={b} n={i % BATCH} />)}
        </div>
        {count < order.length && (
          <button className="more home-more" ref={more} onClick={() => setCount(Math.min(order.length, count + BATCH))}>
            {w.more_brands(order.length - count)}
          </button>
        )}
        <div className="home-search rise">
          <span className="label">{t.nav_search}</span>
          <SearchBar />
        </div>
        <footer className="foot"><span>{t.footer}</span></footer>
      </main>
    </>
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
        {logo && <img className="sc-logo" src={logo} alt="" />}
        <span className="sc-name">{brand.name}</span>
        <span className="sc-city">{brand.city || countries[brand.country][lang]}</span>
      </span>
      <span className="sc-art collage">
        {its.map((it, i) => <span key={i} className="tile"><Garment item={it} tone={i} /></span>)}
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

function NewsRow({ n, i }) {
  const { lang, t } = useLang();
  const b = brandById[n.brandId];
  if (!b) return null;
  const { logo } = brandMedia(b.id);
  const base = itemsByBrand[b.id] || [];
  const pick = n.type === 'sale' ? base.filter((x) => x.compareAt) : base;
  const thumbs = (pick.length ? pick : base).slice(0, 3);
  const date = new Date(n.date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short' });
  return (
    <article className="news-row rise" style={{ '--i': Math.min(i, 8) }}>
      <a className="nr-main" href={'#/brand/' + b.id}>
        <span className="nr-meta"><time>{date}</time><span>{t.news_types[n.type]}</span></span>
        <span className="nr-brand">
          {logo && <img className="nr-logo" src={logo} alt="" />}
          <span className="nr-name">{b.name}</span>
        </span>
        <span className="nr-text">
          <span className="nr-title">{n.title[lang]}</span>
          <span className="nr-sum">{n.summary[lang]}</span>
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
  const { t, w } = useLang();
  const [type, setType] = useState('all');
  const kinds = ['all', 'drop', 'sale', 'collab', 'news'].filter((k) => k === 'all' || news.some((n) => n.type === k));
  const list = news.filter((n) => type === 'all' || n.type === type);
  return (
    <>
      <TopBar active="news" />
      <main className="news-page">
        <div className="np-head rise">
          <p className="np-lead">{w.news_quote}</p>
          <div className="chips">
            {kinds.map((k) => (
              <button key={k} className={type === k ? 'chip on' : 'chip'} onClick={() => setType(k)}>
                {k === 'all' ? t.any : t.news_types[k]}
              </button>
            ))}
          </div>
        </div>
        <div className="np-list">{list.map((n, i) => <NewsRow key={n.id} n={n} i={i} />)}</div>
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
            <cite>{[brand.city, countries[brand.country][lang]].filter(Boolean).join(', ')}</cite>
          </blockquote>
          <div className="giant-clip"><h1 className="giant" style={{ '--len': longestWord(brand.name) }}>{brand.name.toLowerCase().split(/\s+/).map((x, i) => <span key={i}>{x} </span>)}</h1></div>
        </aside>

        <div className="brand-intro">
          <a href={'#' + backTo} className="back rise">{t.back}</a>
          {logo && <img className="brand-logo rise" src={logo} alt="" />}
          <p className="lead rise">{brand.description[lang]}</p>
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
              <div><dt>{w.country}</dt><dd>{countries[brand.country][lang]}{brand.city ? ', ' + brand.city : ''}</dd></div>
              {brand.founded && <div><dt>{t.founded}</dt><dd>{brand.founded}</dd></div>}
              <div><dt>{t.website}</dt><dd>{brand.website ? <a href={brand.website} target="_blank" rel="noreferrer">{brand.website.replace(/^https?:\/\/(www\.)?/, '')}</a> : <span className="muted">{t.no_link}</span>}{brand.website && unv('website')}</dd></div>
              <div><dt>Instagram</dt><dd>{brand.instagram ? <a href={'https://instagram.com/' + brand.instagram} target="_blank" rel="noreferrer">@{brand.instagram}</a> : <span className="muted">{t.no_link}</span>}{brand.instagram && unv('instagram')}</dd></div>
              <div><dt>{t.shipping}</dt><dd>{brand.shipping.map((r) => regions[r][lang]).join(', ')}{unv('shipping')}{brand.shippingNote && <small>{brand.shippingNote[lang]}</small>}</dd></div>
              <div><dt>{t.returns}</dt><dd>{brand.returns?.days ? t.returns_days(brand.returns.days) : <span className="muted">{w.see_store}</span>}{brand.returns?.days ? unv('returns') : null}{brand.returnsNote && <small>{brand.returnsNote[lang]}</small>}</dd></div>
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
        ? <div className="item-grid wide-grid rise">{found.slice(0, 48).map((i) => <ItemCard key={i.id} item={i} showBrand />)}</div>
        : <p className="muted rise">{t.nothing}</p>}
      {items.some((i) => i.demo) && <p className="demo-note">{t.demo_note}</p>}
    </Shell>
  );
}
