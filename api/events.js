// /api/events
// events-auto.json (GitHub Actions가 매일 갱신) 을 읽어서 반환.
// 파일이 없거나 오래되면 live fetch fallback.

import { readFile } from 'node:fs/promises';
import path from 'node:path';

async function readAutoEvents() {
  try {
    const p = path.join(process.cwd(), 'events-auto.json');
    const json = JSON.parse(await readFile(p, 'utf-8'));
    return json;
  } catch {
    return null;
  }
}

async function loadManualEvents() {
  try {
    const p = path.join(process.cwd(), 'events-manual.json');
    const json = JSON.parse(await readFile(p, 'utf-8'));
    return json.events || [];
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  const auto = await readAutoEvents();
  const manual = await loadManualEvents();

  const events = [...(auto?.events || []), ...manual];
  const seen = new Set();
  const deduped = events.filter(e => {
    if (!e?.id || seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
  deduped.sort((a, b) => (a.start || '').localeCompare(b.start || ''));

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({
    _version: 'v5-static',
    fetchedAt: auto?.fetchedAt || new Date().toISOString(),
    sourceStatus: auto?.sourceStatus || { auto: 'no events-auto.json' },
    count: deduped.length,
    events: deduped,
  });
}
