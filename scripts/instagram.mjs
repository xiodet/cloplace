#!/usr/bin/env node
// Latest posts of brands that have no store of their own, read through Instagram's official
// Business Discovery API (no scraping). Needs a token of your own professional Instagram
// account, see docs/instagram.md:
//   IG_TOKEN=... node scripts/instagram.mjs
// Brands are the entries of src/data/sources.js with an `instagram: 'handle'` field.
// Writes src/data/generated/instagram.json and the photos to src/data/generated/ig/
// (Instagram's own photo links expire within days, so the photos are copied).
// Without a token or without such brands the script does nothing and exits cleanly.
import { mkdir, readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sources from '../src/data/sources.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = process.argv.includes('--fixture');
const outDir = FIXTURE ? join(root, 'scripts/fixtures/out') : join(root, 'src/data/generated');
const API = `https://graph.facebook.com/${process.env.IG_API || 'v27.0'}`;
const TOKEN = process.env.IG_TOKEN || '';
const POSTS = 6; // photos kept per brand
const FIELDS = `username,name,biography,website,followers_count,media_count,media.limit(${POSTS * 2}){id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}}`;

// First line of the caption without hashtags and mentions, as a short title for the photo.
export function titleOf(caption) {
  const line = String(caption || '').split('\n').map((l) => l.replace(/[#@][\p{L}\p{N}_.]+/gu, '').replace(/\s+/g, ' ').trim()).find((l) => l.length > 1) || '';
  return line.length > 70 ? line.slice(0, 67).replace(/\s+\S*$/, '') + '…' : line;
}

// One account as the API returns it -> what the site stores.
export function parseAccount(d) {
  const posts = (d.media?.data || []).map((m) => {
    const kid = (m.children?.data || []).find((c) => c.media_url || c.thumbnail_url);
    // a video has no still of its own in media_url; albums fall back to their first photo
    const image = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url || m.thumbnail_url || kid?.thumbnail_url || kid?.media_url;
    return image && m.permalink ? { id: m.id, title: titleOf(m.caption), type: m.media_type, permalink: m.permalink, timestamp: m.timestamp, image } : null;
  }).filter(Boolean).slice(0, POSTS);
  return { username: d.username, name: d.name || null, bio: d.biography || null, website: d.website || null, followers: d.followers_count ?? null, posts };
}

async function graph(path, params) {
  const res = await fetch(`${API}/${path}?${new URLSearchParams({ ...params, access_token: TOKEN })}`, { signal: AbortSignal.timeout(30000) });
  const body = await res.json().catch(() => ({}));
  if (body.error) { const e = new Error(body.error.message || `HTTP ${res.status}`); e.code = body.error.code; throw e; }
  return body;
}

// The Instagram account the token belongs to. A Page token answers on /me, a user token on /me/accounts.
async function ownId() {
  if (process.env.IG_USER_ID) return process.env.IG_USER_ID;
  const me = await graph('me', { fields: 'instagram_business_account' }).catch(() => ({}));
  if (me.instagram_business_account) return me.instagram_business_account.id;
  const pages = await graph('me/accounts', { fields: 'name,instagram_business_account' });
  const page = (pages.data || []).find((p) => p.instagram_business_account);
  if (!page) throw new Error('no Facebook Page with a linked professional Instagram account is visible to this token');
  return page.instagram_business_account.id;
}

async function main() {
  const list = Object.entries(sources).filter(([, s]) => s.instagram).map(([id, s]) => [id, String(s.instagram).replace(/^@/, '')]);
  if (!list.length) return console.log('instagram: no brands with an instagram source, nothing to do');
  if (!TOKEN) return console.log(`instagram: IG_TOKEN is not set, skipped ${list.length} brand(s). See docs/instagram.md`);
  const file = join(outDir, 'instagram.json'), dir = join(outDir, 'ig');
  await mkdir(dir, { recursive: true });
  const prev = JSON.parse(await readFile(file, 'utf8').catch(() => '{}'));
  const out = {};
  let me;
  try { me = await ownId(); } catch (e) { return console.log(`✗ instagram: token was not accepted (${e.message}). Previous data kept.`); }
  for (const [id, handle] of list) {
    try {
      const r = await graph(me, { fields: `business_discovery.username(${handle}){${FIELDS}}` });
      const acc = parseAccount(r.business_discovery);
      const posts = [];
      for (const p of acc.posts) {
        const name = `${id}-${p.id}.jpg`;
        try {
          await readFile(join(dir, name)).catch(async () => {
            const res = await fetch(p.image, { signal: AbortSignal.timeout(30000) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await writeFile(join(dir, name), Buffer.from(await res.arrayBuffer()));
          });
          const { image, ...rest } = p;
          posts.push(rest);
        } catch (e) { console.log(`✗ ${id} photo ${p.id}: ${e.message}`); }
      }
      out[id] = { ...acc, posts, fetchedAt: new Date().toISOString() };
      console.log(`✓ ${id} instagram @${handle}: ${posts.length} posts`);
    } catch (e) {
      if (prev[id]) out[id] = prev[id]; // keep what we had, the account may be back tomorrow
      console.log(`✗ ${id} instagram @${handle}: ${e.message}`);
      if (e.code === 190) { for (const [o] of list) if (prev[o] && !out[o]) out[o] = prev[o]; console.log('✗ instagram: the token has expired or was revoked, make a new one (docs/instagram.md)'); break; }
    }
  }
  await writeFile(file, JSON.stringify(out, null, 1));
  const keep = new Set(Object.entries(out).flatMap(([id, a]) => a.posts.map((p) => `${id}-${p.id}.jpg`)));
  for (const f of await readdir(dir)) if (!keep.has(f)) await unlink(join(dir, f));
}

if (FIXTURE) {
  const assert = (c, m) => { if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
  const acc = parseAccount(JSON.parse(await readFile(join(root, 'scripts/fixtures/instagram.json'), 'utf8')).business_discovery);
  assert(acc.username === 'somebrand' && acc.followers === 1200, 'account fields');
  assert(acc.posts.length === 3, 'three usable posts, the one without a picture is dropped');
  assert(acc.posts[0].title === 'New drop: heavy zip hoodie', 'title is the first caption line without tags');
  assert(acc.posts[1].image === 'https://cdn.test/video-thumb.jpg', 'video uses its thumbnail');
  assert(acc.posts[2].image === 'https://cdn.test/album-1.jpg', 'album falls back to its first photo');
  assert(titleOf('#drop @someone') === '', 'tags only gives an empty title');
  console.log('instagram fixture ok');
} else {
  await main();
}
