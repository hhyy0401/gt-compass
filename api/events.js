// /api/events — 4개 소스에서 애틀랜타 이벤트를 모아 합쳐서 반환
// 1. Atlanta Braves giveaways (mlb.com/braves)
// 2. Atlanta Symphony Orchestra (aso.org)
// 3. High Museum 무료일 (Second Sundays + 페이지)
// 4. Ticketmaster K-pop in Atlanta (API)
//
// 응답 형식: { events: [{ id, title, start, end?, url?, category, source, desc? }] }
// category: braves | aso | high | kpop

import * as cheerio from 'cheerio';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// ── 1. Atlanta Braves giveaways ─────────────────────
async function fetchBraves() {
  try {
    const url = 'https://www.mlb.com/braves/tickets/promotions';
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' } });
    if (!res.ok) throw new Error(`Braves HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const events = [];

    // mlb.com는 보통 promotion 카드를 li/article로 렌더. 여러 selector로 시도.
    const candidates = [
      '.promotion-card', '[data-testid*="promotion"]',
      'article.promotion', '.p-promotion-tile',
      'li.promotion', '.tickets-promo-item'
    ];
    for (const sel of candidates) {
      $(sel).each((_, el) => {
        const $el = $(el);
        const title = $el.find('[class*="title"], h2, h3').first().text().trim();
        const dateText = $el.find('[class*="date"], time').first().text().trim()
                       || $el.find('time').attr('datetime') || '';
        const desc = $el.find('[class*="desc"], p').first().text().trim();
        if (title && dateText) {
          const start = parseDateLoose(dateText);
          if (start) events.push({
            id: `braves-${start}-${title.slice(0,20)}`,
            title: `⚾ ${title}`,
            start,
            category: 'braves',
            source: 'mlb.com/braves',
            url,
            desc,
          });
        }
      });
      if (events.length) break;
    }
    return events;
  } catch (e) {
    console.warn('Braves scrape failed:', e.message);
    return [];
  }
}

// ── 2. Atlanta Symphony Orchestra ─────────────────────
async function fetchASO() {
  try {
    const url = 'https://www.aso.org/concerts-tickets/calendar';
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`ASO HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const events = [];

    const candidates = [
      '.event-list-item', '.calendar-event', 'article.event',
      '.concert-card', '[class*="event-card"]'
    ];
    for (const sel of candidates) {
      $(sel).each((_, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
        const dateAttr = $el.find('time').attr('datetime');
        const dateText = dateAttr || $el.find('[class*="date"]').first().text().trim();
        const linkRel = $el.find('a').first().attr('href');
        if (title && dateText) {
          const start = parseDateLoose(dateText);
          if (start) events.push({
            id: `aso-${start}-${title.slice(0,20)}`,
            title: `🎻 ${title}`,
            start,
            category: 'aso',
            source: 'aso.org',
            url: linkRel ? new URL(linkRel, url).href : url,
          });
        }
      });
      if (events.length) break;
    }
    return events;
  } catch (e) {
    console.warn('ASO scrape failed:', e.message);
    return [];
  }
}

// ── 3. High Museum (Second Sundays + 캘린더) ─────────────────────
function highMuseumSecondSundays(months = 12) {
  const events = [];
  const now = new Date();
  for (let m = 0; m < months; m++) {
    const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
    // 그 달의 첫 번째 일요일 → 두 번째 일요일
    const firstSunday = (7 - d.getDay()) % 7 + 1;
    const secondSunday = firstSunday + 7;
    const dt = new Date(d.getFullYear(), d.getMonth(), secondSunday);
    if (dt < now) continue;
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

async function fetchHighMuseum() {
  const events = highMuseumSecondSundays(12);
  // 추가로 high.org 캘린더 페이지에서 특별 이벤트 시도
  try {
    const url = 'https://high.org/calendar/';
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      $('.event, article.event-card, [class*="calendar-event"]').each((_, el) => {
        const $el = $(el);
        const title = $el.find('h2, h3, [class*="title"]').first().text().trim();
        const dateText = $el.find('time').attr('datetime') || $el.find('[class*="date"]').first().text().trim();
        if (title && dateText) {
          const start = parseDateLoose(dateText);
          if (start) events.push({
            id: `high-${start}-${title.slice(0,20)}`,
            title: `🎨 ${title}`,
            start,
            category: 'high',
            source: 'high.org',
            url,
          });
        }
      });
    }
  } catch (e) {
    console.warn('High Museum events fetch failed:', e.message);
  }
  return events;
}

// ── 4. Ticketmaster K-pop in Atlanta ─────────────────────
async function fetchKpop() {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) {
    console.warn('TICKETMASTER_API_KEY 환경 변수 미설정 — K-pop 이벤트 스킵');
    return [];
  }
  try {
    // dmaId=302 = Atlanta. classificationName=K-Pop or keyword=k-pop
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?dmaId=302&classificationName=K-Pop&size=50&sort=date,asc&apikey=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ticketmaster HTTP ${res.status}`);
    const data = await res.json();
    const items = data?._embedded?.events || [];
    return items.map(ev => {
      const startISO = ev.dates?.start?.dateTime || ev.dates?.start?.localDate;
      const venue = ev._embedded?.venues?.[0]?.name || '';
      return {
        id: `kpop-${ev.id}`,
        title: `🎤 ${ev.name}`,
        start: startISO,
        category: 'kpop',
        source: 'Ticketmaster',
        url: ev.url,
        desc: venue,
      };
    }).filter(e => e.start);
  } catch (e) {
    console.warn('Ticketmaster fetch failed:', e.message);
    return [];
  }
}

// ── 유틸: 다양한 날짜 표기 → ISO 8601 ─────────────────────
function parseDateLoose(text) {
  if (!text) return null;
  // ISO?
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  // "April 15, 2026"  / "4/15/2026" / "Apr 15"
  const d = new Date(text);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return null;
}

// ── 수동 fallback events ─────────────────────
async function loadManualEvents() {
  try {
    const p = path.join(process.cwd(), 'events-manual.json');
    const json = JSON.parse(await readFile(p, 'utf-8'));
    return json.events || [];
  } catch {
    return [];
  }
}

// ── 핸들러 ─────────────────────
export default async function handler(req, res) {
  const [bravesR, asoR, highR, kpopR, manualR] = await Promise.allSettled([
    fetchBraves(),
    fetchASO(),
    fetchHighMuseum(),
    fetchKpop(),
    loadManualEvents(),
  ]);
  const all = []
    .concat(bravesR.status === 'fulfilled' ? bravesR.value : [])
    .concat(asoR.status === 'fulfilled' ? asoR.value : [])
    .concat(highR.status === 'fulfilled' ? highR.value : [])
    .concat(kpopR.status === 'fulfilled' ? kpopR.value : [])
    .concat(manualR.status === 'fulfilled' ? manualR.value : []);

  // 중복 제거 (id 기준)
  const seen = new Set();
  const events = all.filter(e => {
    if (!e || !e.id || seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  // 캐싱 헤더 — Vercel edge cache 1시간, stale-while-revalidate 24시간
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({
    fetchedAt: new Date().toISOString(),
    sourceStatus: {
      braves: bravesR.status,
      aso: asoR.status,
      high: highR.status,
      kpop: kpopR.status,
    },
    count: events.length,
    events,
  });
}
