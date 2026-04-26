# GTKSA 신입생 가이드 홈페이지

조지아텍 한인 학생회(GTKSA)가 운영하는 신입생 가이드 사이트.
정적 HTML + Vercel Serverless function으로 구성. 빌드 단계 없음.

## 페이지 구성

- `index.html` — 랜딩
- `atlanta.html` — Atlanta Overview (Leaflet 지도 + 태그 필터)
- `events.html` — 이벤트 캘린더 (FullCalendar)
- `checklist.html` — 입학 전 체크리스트
- `banking.html` — 은행 계좌 개설
- `housing.html` — 거주지 + 근처 마트 + 한인타운
- `transport.html` — 교통수단 (Stinger, MARTA, Uber 등)
- `courses.html` — 수강신청 + 수업 관련 링크
- `gtksa.html` — GTKSA 학생회 소개

## 디렉토리 구조

```
site/
├── api/
│   └── events.js          # Vercel serverless function (이벤트 스크레이퍼)
├── assets/
│   ├── style.css
│   ├── nav.js             # 모든 페이지에 nav/footer 주입
│   └── places.js          # Atlanta Overview 장소 데이터
├── *.html                 # 각 페이지
├── events-manual.json     # 스크레이퍼 실패 시 fallback 이벤트
├── package.json
├── vercel.json            # cron 설정
└── README.md
```

## 로컬 미리보기

순수 정적이므로 아무 정적 서버로 열면 됩니다 (events 페이지의 API만 빼고):

```bash
cd site
python3 -m http.server 8000
# http://localhost:8000 접속
```

API 포함 풀 미리보기 (Vercel CLI 필요):

```bash
npm install -g vercel
cd site
vercel dev
```

## Vercel 배포

1. **GitHub 레포 만들고 푸시**
   ```bash
   cd site
   git init
   git add -A
   git commit -m "Initial commit"
   git remote add origin https://github.com/<유저>/<레포>.git
   git push -u origin main
   ```

2. **Vercel에서 import** — vercel.com → Add New → Project → GitHub 레포 선택
   - **Root Directory**: 여기서 `site` 디렉토리 (또는 레포 자체가 site면 비움)
   - **Framework Preset**: Other
   - **Build Command**: 비움 (정적)
   - **Output Directory**: 비움

3. **환경 변수 추가**
   - Vercel 프로젝트 → Settings → Environment Variables
   - `TICKETMASTER_API_KEY` = (아래 발급 절차)

4. **Deploy** 누르면 끝. cron은 자동 설정됨.

## TICKETMASTER_API_KEY 발급

K-pop 콘서트 캘린더에 필요. 무료 (5000 calls/day).

1. https://developer.ticketmaster.com/ 가입
2. "My Apps" → "Add New App" → 기본 정보 입력
3. **Consumer Key**가 API key. 복사 → Vercel 환경변수에 붙여넣기

키가 없어도 다른 3개 소스(Braves, ASO, High Museum)는 정상 동작합니다.

## 자동 업데이트 (Cron)

`vercel.json`에 정의된 cron이 매일 UTC 07:00 (EST 기준 새벽 2시쯤)에
`/api/events`를 호출해서 캐시를 워밍합니다. 캐시는 1시간 edge cache + 24시간 stale-while-revalidate.

## 콘텐츠 수정

- **Atlanta 장소 추가/수정**: `assets/places.js` 수정
- **각 페이지 글 수정**: 해당 `*.html` 직접 편집
- **이벤트 수동 추가** (스크레이퍼 안 잡히는 것): `events-manual.json` 편집
  ```json
  {
    "events": [
      {
        "id": "manual-1",
        "title": "🎉 GTKSA 신입생 환영회",
        "start": "2025-08-30",
        "category": "manual",
        "url": "https://gtksa.net",
        "desc": "장소 미정"
      }
    ]
  }
  ```

## 스크레이퍼가 깨질 때

mlb.com/braves, aso.org, high.org는 사이트 구조가 바뀌면 selector가 안 잡힙니다.
`/api/events` 응답의 `sourceStatus`를 보고 어느 소스가 실패했는지 확인 후
`api/events.js`의 selector 후보 배열을 업데이트하세요.

당장 이벤트가 필요하면 `events-manual.json`에 직접 추가가 가장 빠릅니다.

---

문의: webmaster@gtksa.net
