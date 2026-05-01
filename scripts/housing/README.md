# Housing-map auto refresh

Builds `site/housing-map.html` from the GTKSA housing-survey responses.

## Files

- `refresh.py` — entrypoint. Fetches CSV → normalizes → geocodes → writes `housing-map.html`.
- `template.html` — HTML/CSS/JS shell. `__PAYLOAD__`, `__NRESP__`, `__NLOC__` are substituted at build time.
- `geo_cache.json` — committed cache of `{group_key: {lat, lon, address, source}}` so we don't re-call Nominatim every run. Safe to delete; will rebuild on next run (slowly, due to 1 req/s rate limit).

## Local dev

Reads from the local xlsx if `HOUSING_SHEET_CSV_URL` is unset:

```bash
python3 scripts/housing/refresh.py
```

Override the xlsx path with `HOUSING_XLSX=/path/to/file.xlsx`.

## Production (GitHub Action)

Runs daily via `.github/workflows/refresh-housing.yml`. Requires one repo secret:

- `HOUSING_SHEET_CSV_URL` — published-CSV URL of the form's response sheet.

### How to get the CSV URL

1. Open the Google Sheet that the form writes to.
2. **File → Share → Publish to web**.
3. Pick the response tab as the source. Format: **Comma-separated values (.csv)**.
4. Click **Publish**, copy the URL. Make sure it ends in `?output=csv` (NOT `/pubhtml`).
   - Wrong: `…/pubhtml`
   - Right: `…/pub?output=csv`
   - If your URL ends in `/pubhtml`, just replace `/pubhtml` with `/pub?output=csv`.
5. GitHub repo → Settings → Secrets and variables → Actions → New repository secret. Name: `HOUSING_SHEET_CSV_URL`. Paste the URL.

The action also runs on push to `main` whenever this folder changes, and can be triggered manually via "Run workflow".

## Adding a new apartment by hand

If a new response comes in for an apartment Nominatim places badly, edit `refresh.py`:

- Add an entry to `HARDCODE_COORDS` keyed by the canonical (lowercased) apartment name.
- Add to `NEIGHBORHOOD` if it should appear under Midtown / West Midtown / etc. Otherwise it falls to "그 외".

Then commit. The next run picks it up.

## Privacy

The contact column (`문의/Refer 연락`) is dropped before serialization — neither the inline JSON nor the visible card shows it. Do a final scan with:

```bash
python3 -c "import re; html=open('housing-map.html').read(); print(re.findall(r'\b\d{3}[- ]?\d{3}[- ]?\d{4}\b', html), [e for e in re.findall(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.\w+', html) if 'gtksa' not in e])"
```
