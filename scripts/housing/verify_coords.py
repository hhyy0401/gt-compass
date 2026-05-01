"""Verify apartment lat/lon against US Census Geocoder.

For each entry in HARDCODE_COORDS (refresh.py) and geo_cache.json, look up the
embedded street address via the Census `onelineaddress` API and compare with
our stored coords. Prints a diff sorted by distance so you can scan for the
worst drifts first.

Census geocoder is free, US-only, no API key, and uses the TIGER/Line address
range files — usually accurate to the parcel level for normal street numbers.

Usage:
    python3 scripts/housing/verify_coords.py
"""
from __future__ import annotations

import json
import math
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
from refresh import HARDCODE_COORDS  # type: ignore

CACHE_PATH = SCRIPT_DIR / 'geo_cache.json'

CENSUS_URL = 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress'

# Addresses to use when the cache version is missing zip / has wrong street
# suffix (Census is picky about exact normalization).
ADDR_OVERRIDE = {
    '100midtown': '100 10th St NW, Atlanta, GA 30309',
    'ascent midtown': '1400 W Peachtree St NW, Atlanta, GA 30309',
    'brady': '930 Howell Mill Rd NW, Atlanta, GA 30318',
    'buckhead 960': '960 E Paces Ferry Rd NE, Atlanta, GA 30326',
    'gables buckhead': '530 East Paces Ferry Rd NE, Atlanta, GA 30305',
    'local on 14th': '455 14th St NW, Atlanta, GA 30318',
    'nine15 midtown': '915 W Peachtree St NW, Atlanta, GA 30309',
    'osprey': '980 Howell Mill Rd NW, Atlanta, GA 30318',
    'skyline west': '1390 Northside Dr NW, Atlanta, GA 30318',
    'westside union': '400 Bishop St NW, Atlanta, GA 30318',
    'maa centennial park': '305 Centennial Olympic Park Dr NW, Atlanta, GA 30313',
    '903 peachtree': '903 Peachtree St NE, Atlanta, GA 30308',
}


def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


STREET_SUFFIX = re.compile(
    r'\b(St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Pkwy|Parkway|Cir|Circle|Ln|Lane|Pl|Place|Way|Ct|Court|Ter|Terrace|Hwy|Highway|Trail|Trl)\b',
    re.I,
)


# Pull just the postal address out of our label strings, which look like
# "Hanover Midtown, 1230 W Peachtree St NW, Atlanta, GA 30309".
# Some labels redundantly start with the apartment name as a number-prefixed
# segment ("903 Peachtree, 903 Peachtree St NE, ..."), so we prefer parts
# that look like a real street (number + street suffix word) over those
# that are just "<number> <name>".
def extract_address(label: str) -> str | None:
    if not label:
        return None
    parts = [p.strip() for p in label.split(',')]
    best = None
    for i, p in enumerate(parts):
        if re.match(r'^\s*\d+\s+\S', p) and STREET_SUFFIX.search(p):
            best = i
            break
    if best is None:
        for i, p in enumerate(parts):
            if re.match(r'^\s*\d+\s+\S', p):
                best = i
                break
    if best is None:
        return None
    tail = ', '.join(parts[best:])
    if not re.search(r'\b(GA|Georgia)\b', tail, re.I):
        tail += ', Atlanta, GA'
    return tail


def census_geocode(address: str) -> tuple[float, float, str] | None:
    qs = urllib.parse.urlencode({
        'address': address,
        'benchmark': 'Public_AR_Current',
        'format': 'json',
    })
    url = f'{CENSUS_URL}?{qs}'
    req = urllib.request.Request(url, headers={'User-Agent': 'gtksa-verify/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read())
    except Exception as e:
        print(f'  [census error] {e}')
        return None
    matches = data.get('result', {}).get('addressMatches') or []
    if not matches:
        return None
    m = matches[0]
    c = m.get('coordinates') or {}
    if 'x' not in c or 'y' not in c:
        return None
    return float(c['y']), float(c['x']), m.get('matchedAddress', '')


def main() -> int:
    entries: list[tuple[str, float, float, str, str]] = []
    # (key, lat, lon, label_or_address, source)
    for key, (lat, lon, label) in HARDCODE_COORDS.items():
        entries.append((key, lat, lon, label, 'hardcode'))

    if CACHE_PATH.exists():
        cache = json.loads(CACHE_PATH.read_text())
        for key, v in cache.items():
            if key in HARDCODE_COORDS:
                continue
            entries.append((key, v['lat'], v['lon'], v.get('address', ''), 'cache'))

    rows = []
    for key, lat, lon, label, source in entries:
        if key.startswith('__house__:'):
            continue
        if key in ADDR_OVERRIDE:
            addr = ADDR_OVERRIDE[key]
        else:
            addr = extract_address(label) if source == 'hardcode' else label
        if not addr or not re.match(r'^\s*\d+\s+\S', addr):
            print(f'[skip] {key:40s}  no parseable address: {label!r}')
            continue
        print(f'[query] {key}  →  {addr}')
        result = census_geocode(addr)
        time.sleep(0.4)
        if not result:
            print('  no match')
            rows.append((float('inf'), key, lat, lon, None, None, addr, 'no-match', source))
            continue
        clat, clon, matched = result
        d = haversine_m(lat, lon, clat, clon)
        rows.append((d, key, lat, lon, clat, clon, addr, matched, source))

    rows.sort(key=lambda r: -r[0] if r[0] != float('inf') else -1)
    print('\n=== Drift report (largest first) ===')
    print(f'{"key":40s} {"drift":>9s}  {"current":24s}  {"census":24s}  source  matched')
    print('-' * 140)
    for d, key, lat, lon, clat, clon, addr, matched, source in rows:
        if clat is None:
            print(f'{key:40s} {"NO MATCH":>9s}  {lat:>10.5f},{lon:>11.5f}  {"":24s}  {source:8s}  {addr}')
            continue
        cur = f'{lat:>10.5f},{lon:>11.5f}'
        cen = f'{clat:>10.5f},{clon:>11.5f}'
        flag = '!! ' if d > 100 else '   '
        print(f'{flag}{key:37s} {d:>7.1f}m  {cur:24s}  {cen:24s}  {source:8s}  {matched}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
