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

// ── 1. Atlanta Braves (MLB Stats API) ─────────────────
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
        const isHome = home === 'Atlanta Braves';
        if (!isHome) continue;  // 홈경기만 (Truist Park)
        const dateStr = (g.gameDate || '').slice(0, 10);
        if (!dateStr) continue;
        const localTime = g.gameDate
          ? new Date(g.gameDate).toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York'
            })
          : '';
        events.push({
          id: `braves-${g.gamePk}`,
          title: `⚾ Braves vs ${away}`,
          start: dateStr,
          category: 'braves',
          source: 'MLB',
          url: 'https://www.mlb.com/braves/schedule',
          desc: `Truist Park${localTime ? ' · ' + localTime : ''}`,
        });
      }
    }
    return events;
  } catch (e) {
    console.warn('Braves fetch failed:', e.message);
    return [];
  }
}

// ── 2. Atlanta Symphony Orchestra (Ticketmaster) ──────
async function fetchASO() {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) {
    console.warn('TICKETMASTER_API_KEY 없음, ASO 스킵');
    return [];
  }
  try {
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?keyword=Atlanta+Symphony&dmaId=302&size=50&sort=date,asc&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ASO TM HTTP ${res.status}`);
    const data = await res.json();
    const items = data?._embedded?.events || [];
    return items.map(ev => {
      const start = ev.dates?.start?.dateTime || ev.dates?.start?.localDate;
      const venue = ev._embedded?.venues?.[0]?.name || '';
      return {
        id: `aso-${ev.id}`,
        title: `🎻 ${ev.name}`,
        start,
        category: 'aso',
        source: 'Ticketmaster',
        url: ev.url,
        desc: venue,
      };
    }).filter(e => e.start);
  } catch (e) {
    console.warn('ASO fetch failed:', e.message);
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

// ── 4. K-pop (Ticketmaster) ───────────────────────────
async function fetchKpop() {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) return [];
  try {
    // K-Pop classification 우선, 결과 없으면 keyword 검색 fallback
    const tryFetch = async (qs) => {
      const url = `https://app.ticketmaster.com/discovery/v2/events.json?${qs}&dmaId=302&size=50&sort=date,asc&apikey=${key}`;
      const r = await fetch(url);
      if (!r.ok) return [];
      const j = await r.json();
      return j?._embedded?.events || [];
    };
    let items = await tryFetch('classificationName=K-Pop');
    if (!items.length) items = await tryFetch('keyword=k-pop');
    return items.map(ev => {
      const start = ev.dates?.start?.dateTime || ev.dates?.start?.localDate;
      const venue = ev._embedded?.venues?.[0]?.name || '';
      return {
        id: `kpop-${ev.id}`,
        title: `🎤 ${ev.name}`,
        start,
        category: 'kpop',
        source: 'Ticketmaster',
        url: ev.url,
        desc: venue,
      };
    }).filter(e => e.start);
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
    fetchedAt: new Date().toISOString(),
    sourceStatus: {
      braves: bravesR.status === 'fulfilled' ? `ok (${bravesR.value.length})` : 'failed',
      aso: asoR.status === 'fulfilled' ? `ok (${asoR.value.length})` : 'failed',
      high: highR.status === 'fulfilled' ? `ok (${highR.value.length})` : 'failed',
      kpop: kpopR.status === 'fulfilled' ? `ok (${kpopR.value.length})` : 'failed',
    },
    count: events.length,
    events,
  });
}
