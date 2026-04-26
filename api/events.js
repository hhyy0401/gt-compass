// /api/events, 4개 소스에서 애틀랜타 이벤트를 모아 반환
// 1. Atlanta Braves   → MLB Stats API (공식, 키 불필요)
// 2. Atlanta Symphony → Ticketmaster keyword 검색
// 3. High Museum      → Second Sundays 하드코딩
// 4. K-pop            → Ticketmaster K-Pop classification
//
// 응답: { events: [{ id, title, start, end?, url?, category, source, desc? }] }
// category: braves | aso | high | kpop

import { readFile } from 'node:fs/promises';
import path from 'node:path';

// ── 1. Atlanta Braves (MLB Stats API)
//    홈 게임 중 토요일만 — 보통 토요일 야간이 giveaway 있음.
//    실제 giveaway 정보는 mlb.com/braves/tickets/promotions 에서 확인.
async function fetchBraves() {
  try {
    const today = new Date();
    const start = today.toISOString().slice(0, 10);
    const end = new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=144&startDate=${start}&endDate=${end}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Braves HTTP ${res.status}`);
    const data = await res.json();
    const events = [];
    for (const d of data.dates || []) {
      for (const g of d.games || []) {
        const home = g.teams?.home?.team?.name;
        const away = g.teams?.away?.team?.name;
        if (home !== 'Atlanta Braves') continue;
        const gd = g.gameDate ? new Date(g.gameDate) : null;
        if (!gd) continue;
        // 토요일 (Saturday)만 — Atlanta time
        const dayET = gd.toLocaleDateString('en-US', { weekday:'short', timeZone:'America/New_York' });
        if (dayET !== 'Sat') continue;
        const dateStr = gd.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD
        const localTime = gd.toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York'
        });
        events.push({
          id: `braves-${g.gamePk}`,
          title: `⚾ Braves vs ${away} (Sat 🎁)`,
          start: dateStr,
          category: 'braves',
          source: 'MLB',
          url: 'https://www.mlb.com/braves/tickets/promotions',
          desc: `Truist Park · ${localTime} · 토요일은 giveaway 가능성 높음`,
        });
      }
    }
    return events;
  } catch (e) {
    console.warn('Braves fetch failed:', e.message);
    return [];
  }
}

// ── 2. Atlanta Symphony Hall (ASO + 클래식 공연)
//    venueId(KovZpZAJedlA)로 모든 공연 가져오고, Classical 우선, 없으면 전체 표시
async function fetchASO() {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) {
    console.warn('[ASO] no key');
    return [];
  }
  try {
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?venueId=KovZpZAJedlA&size=100&sort=date,asc&apikey=${key}`;
    const r = await fetch(url);
    console.log('[ASO] HTTP', r.status);
    if (!r.ok) {
      const txt = await r.text();
      console.warn('[ASO] not ok body:', txt.slice(0, 200));
      return [];
    }
    const j = await r.json();
    const items = j?._embedded?.events || [];
    console.log('[ASO] received', items.length, 'events');
    const all = items.map(ev => {
      const start = ev.dates?.start?.dateTime || ev.dates?.start?.localDate;
      const cls = ev.classifications?.[0] || {};
      const genre = cls.genre?.name || '';
      const isClassical = genre === 'Classical';
      return {
        id: `aso-${ev.id}`,
        title: isClassical ? `🎻 ${ev.name}` : `🎵 ${ev.name}`,
        start,
        category: 'aso',
        source: 'Ticketmaster',
        url: ev.url,
        desc: `Atlanta Symphony Hall · ${genre || 'Music'}`,
        _classical: isClassical,
      };
    }).filter(e => e.start);
    // Classical이 있으면 Classical만, 아니면 전부
    const classical = all.filter(e => e._classical);
    return (classical.length ? classical : all).map(({_classical, ...rest}) => rest);
  } catch (e) {
    console.warn('[ASO] fetch failed:', e.message);
    return [];
  }
}

// ── 3. High Museum (Second Sundays) ───────────────────
function fetchHighMuseum(months = 12) {
  const events = [];
  const now = new Date();
  for (let m = 0; m < months; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const firstSundayOffset = (7 - d.getDay()) % 7;
    const secondSundayDate = 1 + firstSundayOffset + 7;
    const dt = new Date(d.getFullYear(), d.getMonth(), secondSundayDate);
    if (dt < new Date(now.toDateString())) continue;
    const iso = dt.toISOString().slice(0, 10);
    events.push({
      id: `high-secondsun-${iso}`,
      title: '🎨 High Museum 무료 입장 (Second Sundays)',
      start: iso,
      category: 'high',
      source: 'high.org',
      url: 'https://high.org/visit',
      desc: '매월 둘째 일요일 무료 입장 (사전 예약 권장).',
    });
  }
  return events;
}

// ── 4. K-pop (Ticketmaster, 광범위 검색)
async function fetchKpop() {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) return [];
  try {
    // GA 전체 + 여러 키워드/분류로 시도
    const queries = [
      'classificationName=K-Pop',
      'keyword=k-pop',
      'keyword=kpop',
    ];
    const seen = new Set();
    const out = [];
    for (const qs of queries) {
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?${qs}&stateCode=GA&size=50&sort=date,asc&apikey=${key}`;
      const r = await fetch(url);
      if (!r.ok) continue;
      const j = await r.json();
      const items = j?._embedded?.events || [];
      for (const ev of items) {
        if (seen.has(ev.id)) continue;
        seen.add(ev.id);
        const start = ev.dates?.start?.dateTime || ev.dates?.start?.localDate;
        if (!start) continue;
        const venue = ev._embedded?.venues?.[0]?.name || '';
        out.push({
          id: `kpop-${ev.id}`,
          title: `🎤 ${ev.name}`,
          start,
          category: 'kpop',
          source: 'Ticketmaster',
          url: ev.url,
          desc: venue,
        });
      }
    }
    return out;
  } catch (e) {
    console.warn('K-pop fetch failed:', e.message);
    return [];
  }
}

// ── 수동 events fallback ──────────────────────────────
async function loadManualEvents() {
  try {
    const p = path.join(process.cwd(), 'events-manual.json');
    const json = JSON.parse(await readFile(p, 'utf-8'));
    return json.events || [];
  } catch {
    return [];
  }
}

// ── 핸들러 ─────────────────────────────────────────────
export default async function handler(req, res) {
  const [bravesR, asoR, highR, kpopR, manualR] = await Promise.allSettled([
    fetchBraves(),
    fetchASO(),
    Promise.resolve(fetchHighMuseum(12)),
    fetchKpop(),
    loadManualEvents(),
  ]);

  const all = []
    .concat(bravesR.status === 'fulfilled' ? bravesR.value : [])
    .concat(asoR.status === 'fulfilled' ? asoR.value : [])
    .concat(highR.status === 'fulfilled' ? highR.value : [])
    .concat(kpopR.status === 'fulfilled' ? kpopR.value : [])
    .concat(manualR.status === 'fulfilled' ? manualR.value : []);

  const seen = new Set();
  const events = all.filter(e => {
    if (!e || !e.id || seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({
    _version: 'v3-aso-fallback',
    fetchedAt: new Date().toISOString(),
    sourceStatus: {
      braves: bravesR.status === 'fulfilled' ? `ok (${bravesR.value.length})` : `failed: ${bravesR.reason?.message || ''}`,
      aso: asoR.status === 'fulfilled' ? `ok (${asoR.value.length})` : `failed: ${asoR.reason?.message || ''}`,
      high: highR.status === 'fulfilled' ? `ok (${highR.value.length})` : 'failed',
      kpop: kpopR.status === 'fulfilled' ? `ok (${kpopR.value.length})` : `failed: ${kpopR.reason?.message || ''}`,
    },
    count: events.length,
    events,
  });
}
