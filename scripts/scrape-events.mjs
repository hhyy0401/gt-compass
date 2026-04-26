// scripts/scrape-events.mjs
// 매일 GitHub Actions에서 실행되어 events-auto.json을 갱신.
//
// 환경 변수:
//   TICKETMASTER_API_KEY  Ticketmaster 키 (K-pop, ASO용)
//
// 출력: events-auto.json
//   { fetchedAt, sourceStatus, events: [...] }

import { writeFile } from 'node:fs/promises';

const KEY = process.env.TICKETMASTER_API_KEY || '';

// ── 1. Braves: 자동으로는 못 받아옴.
//    giveaway 데이터는 events-manual.json 에 수동으로 입력 (학생회 시즌 시작 시 mlb.com에서 복사).
async function fetchBraves() {
  return [];
}

// ── 2. Atlanta Symphony Hall (Ticketmaster venueId) ─────
async function fetchASO() {
  if (!KEY) throw new Error('TICKETMASTER_API_KEY missing');
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?venueId=KovZpZAJedlA&size=100&sort=date,asc&apikey=${KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`ASO HTTP ${r.status}: ${(await r.text()).slice(0, 100)}`);
  const j = await r.json();
  const items = j?._embedded?.events || [];
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
  const classical = all.filter(e => e._classical);
  const picked = (classical.length ? classical : all);
  // 같은 제목 중복 제거 (가장 빠른 날짜만 남김)
  const byTitle = new Map();
  for (const e of picked) {
    const key = e.title.replace(/^[🎻🎵]\s/, '').trim();
    if (!byTitle.has(key) || e.start < byTitle.get(key).start) {
      byTitle.set(key, e);
    }
  }
  return [...byTitle.values()].map(({ _classical, ...rest }) => rest);
}

// ── 3. High Museum (Second Sundays, 12개월) ─────
function buildHighMuseum(months = 12) {
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

// ── 4b. Fox Theatre Musicals (Ticketmaster venueId)
async function fetchFoxMusical() {
  if (!KEY) throw new Error('TICKETMASTER_API_KEY missing');
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?venueId=KovZpZAdnvEA&size=200&sort=date,asc&apikey=${KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Fox HTTP ${r.status}`);
  const j = await r.json();
  const items = j?._embedded?.events || [];
  const out = [];
  for (const ev of items) {
    const cls = ev.classifications?.[0] || {};
    if (cls.subGenre?.name !== 'Musical') continue;
    const start = ev.dates?.start?.dateTime || ev.dates?.start?.localDate;
    if (!start) continue;
    out.push({
      id: `fox-${ev.id}`,
      title: `🎭 ${ev.name}`,
      start,
      category: 'musical',
      source: 'Ticketmaster',
      url: ev.url,
      desc: 'Fox Theatre Atlanta',
    });
  }
  // 같은 뮤지컬 여러 날짜 → 가장 빠른 날짜 1개만
  const byTitle = new Map();
  for (const e of out) {
    const key = e.title.replace(/^🎭\s/, '').trim();
    if (!byTitle.has(key) || e.start < byTitle.get(key).start) {
      byTitle.set(key, e);
    }
  }
  return [...byTitle.values()];
}

// ── 5. K-pop (Ticketmaster) ─────
async function fetchKpop() {
  if (!KEY) throw new Error('TICKETMASTER_API_KEY missing');
  const queries = [
    'classificationName=K-Pop',
    'keyword=k-pop',
    'keyword=kpop',
  ];
  const seen = new Set();
  const out = [];
  for (const qs of queries) {
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${qs}&stateCode=GA&size=50&sort=date,asc&apikey=${KEY}`;
    const r = await fetch(url);
    if (!r.ok) continue;
    const j = await r.json();
    const items = j?._embedded?.events || [];
    for (const ev of items) {
      if (seen.has(ev.id)) continue;
      seen.add(ev.id);
      const start = ev.dates?.start?.dateTime || ev.dates?.start?.localDate;
      if (!start) continue;
      out.push({
        id: `kpop-${ev.id}`,
        title: `🎤 ${ev.name}`,
        start,
        category: 'kpop',
        source: 'Ticketmaster',
        url: ev.url,
        desc: ev._embedded?.venues?.[0]?.name || '',
      });
    }
  }
  // 같은 제목 dedupe (가장 빠른 날짜만 남김)
  const byTitle = new Map();
  for (const e of out) {
    const key = e.title.replace(/^🎤\s/, '').trim();
    if (!byTitle.has(key) || e.start < byTitle.get(key).start) {
      byTitle.set(key, e);
    }
  }
  return [...byTitle.values()];
}

// ── 메인 ─────
async function main() {
  const sources = {
    braves: fetchBraves,
    aso: fetchASO,
    musical: fetchFoxMusical,
    high: () => Promise.resolve(buildHighMuseum(12)),
    kpop: fetchKpop,
  };
  const results = {};
  const all = [];
  for (const [name, fn] of Object.entries(sources)) {
    try {
      const events = await fn();
      all.push(...events);
      results[name] = `ok (${events.length})`;
      console.log(`[${name}] ok ${events.length}`);
    } catch (e) {
      results[name] = `failed: ${e.message}`;
      console.warn(`[${name}] failed:`, e.message);
    }
  }
  // 중복 제거
  const seen = new Set();
  const events = all.filter(e => {
    if (!e?.id || seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
  events.sort((a, b) => (a.start || '').localeCompare(b.start || ''));

  const output = {
    fetchedAt: new Date().toISOString(),
    sourceStatus: results,
    count: events.length,
    events,
  };
  await writeFile('events-auto.json', JSON.stringify(output, null, 2) + '\n');
  console.log(`\nTotal: ${events.length} events written to events-auto.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
