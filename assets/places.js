// Atlanta Overview, 장소 데이터
// transport: walk | marta | car | stinger
// category: food | shop | nature | art | sport | photo | korea | active

const PLACES = [
  {
    name: "Georgia Tech",
    lat: 33.7756, lng: -84.3963,
    transport: ["walk"],
    category: [],
    meta: "🐝 우리 학교",
    desc: "모든 거리/시간의 기준점입니다.",
    pinColor: "#B3A369", icon: "GT", isCenter: true,
  },

  // ── 도보권 ─────────────────────────
  {
    name: "Piedmont Park",
    lat: 33.7851, lng: -84.3738,
    transport: ["walk", "marta"],
    category: ["nature", "active"],
    meta: "도보 20분 · 🚇 Midtown 역",
    desc: "러닝하기 좋은 애틀랜타 대표 공원. 잔디밭 피크닉, 주말엔 파머스마켓.",
  },
  {
    name: "Atlantic Station",
    lat: 33.7919, lng: -84.3989,
    transport: ["walk"],
    category: ["shop", "food"],
    meta: "도보 15분",
    desc: "Miniso, 영화관, 식당가가 모인 야외 쇼핑몰. 겨울엔 야외 아이스 스케이트장.",
  },

  // ── 미드타운 예술 ─────────────────────────
  {
    name: "High Museum of Art",
    lat: 33.7900, lng: -84.3852,
    transport: ["walk", "marta"],
    category: ["art"],
    meta: "도보 15분 · 🚇 Arts Center 역",
    desc: "애틀랜타 대표 미술관. 건축 자체도 볼거리(리처드 마이어 디자인). 현대미술 컬렉션.",
  },
  {
    name: "Atlanta Symphony Hall",
    lat: 33.7896, lng: -84.3858,
    transport: ["walk", "marta"],
    category: ["art"],
    meta: "도보 15분 · 🚇 Arts Center 역",
    desc: "High Museum과 같은 Woodruff Arts Center 안. ASO 공연, 학생 할인 티켓 종종 풀려요.",
  },
  {
    name: "Fox Theatre",
    lat: 33.7724, lng: -84.3858,
    transport: ["walk", "marta"],
    category: ["art", "photo"],
    meta: "도보 20분 · 🚇 North Avenue 역",
    desc: "1929년 무어/이집트 스타일 역사 극장. 브로드웨이 투어, 콘서트 자주 열림. 인테리어 자체가 명물.",
  },

  // ── 다운타운 ─────────────────────────
  {
    name: "State Farm Arena",
    lat: 33.7573, lng: -84.3963,
    transport: ["walk", "marta"],
    category: ["sport", "art"],
    meta: "도보 25분 · 🚇 GWCC/CNN 역",
    desc: "애틀랜타 호크스 농구 경기장. 콘서트 자주 열려요.",
  },
  {
    name: "Mercedes-Benz Stadium",
    lat: 33.7553, lng: -84.4006,
    transport: ["walk", "marta"],
    category: ["sport"],
    meta: "도보 25분 · 🚇 Vine City 역",
    desc: "팰컨스(NFL), 애틀랜타 유나이티드(MLS) 홈구장. 개폐식 지붕이 트레이드마크.",
  },
  {
    name: "Centennial Olympic Park",
    lat: 33.7603, lng: -84.3933,
    transport: ["walk", "marta"],
    category: ["nature", "active", "photo"],
    meta: "도보 25분 · 🚇 GWCC 역",
    desc: "1996 애틀랜타 올림픽 기념 공원. 분수 쇼, 겨울엔 스케이트장. 아쿠아리움/코카콜라 바로 옆.",
  },
  {
    name: "World of Coca-Cola",
    lat: 33.7626, lng: -84.3927,
    transport: ["walk", "marta"],
    category: ["art"],
    meta: "도보 25분 · 🚇 GWCC 역",
    desc: "코카콜라 박물관. 전세계 콜라 시음 코너가 메인 볼거리.",
  },
  {
    name: "Georgia Aquarium",
    lat: 33.7634, lng: -84.3951,
    transport: ["walk", "marta"],
    category: ["art"],
    meta: "도보 25분 · 🚇 GWCC 역",
    desc: "미국 최대급 아쿠아리움. 고래상어 볼 수 있어요.",
  },

  // ── East Beltline ─────────────────────────
  {
    name: "Ponce City Market",
    lat: 33.7726, lng: -84.3657,
    transport: ["car", "walk"],
    category: ["food", "shop", "photo"],
    meta: "차로 10분 · East Beltline 시작",
    desc: "옛 Sears 건물을 리노베이션한 푸드홀 + 쇼핑몰. 루프탑 Skyline Park 야경 추천.",
    beltline: "east",
  },
  {
    name: "Eastside Trail",
    lat: 33.7639, lng: -84.3645,
    transport: ["walk", "car"],
    category: ["active", "photo"],
    meta: "East Beltline 산책로",
    desc: "PCM에서 Krog까지 약 5km. 벽화, 카페, 비어가든 즐비. 자전거 대여 가능.",
    beltline: "east",
  },
  {
    name: "Krog Street Market",
    lat: 33.7553, lng: -84.3636,
    transport: ["car", "walk"],
    category: ["food", "photo"],
    meta: "차로 12분 · East Beltline 종착",
    desc: "분위기 좋은 푸드홀. 바로 옆 Krog Street Tunnel(그래피티 터널) 사진 명소.",
    beltline: "east",
  },

  // ── West Beltline ─────────────────────────
  {
    name: "Lee + White",
    lat: 33.7404, lng: -84.4143,
    transport: ["car"],
    category: ["food"],
    meta: "차로 10분 · West Beltline",
    desc: "Westside Trail 옆 옛 창고를 개조한 브루어리/식당 단지. Monday Night Brewing, Wild Heaven 등.",
    beltline: "west",
  },
  {
    name: "Westside Trail",
    lat: 33.7480, lng: -84.4200,
    transport: ["car"],
    category: ["active"],
    meta: "West Beltline 산책로",
    desc: "2017 완공된 약 5km 트레일. East에 비해 한적하고 동네 분위기. Lee + White가 하이라이트.",
    beltline: "west",
  },

  // ── North Beltline (Northeast Trail, 부분 개통) ─────
  {
    name: "Tanyard Creek Park",
    lat: 33.8085, lng: -84.3947,
    transport: ["car"],
    category: ["nature", "active"],
    meta: "North Beltline · Northeast Trail",
    desc: "Atlanta Memorial Park 옆 자연 산책로. Buckhead 가는 길의 첫 트레일 구간.",
    beltline: "north",
  },
  {
    name: "Northeast Trail",
    lat: 33.7980, lng: -84.3850,
    transport: ["car"],
    category: ["active"],
    meta: "North Beltline · 산책로",
    desc: "Piedmont Park 북쪽에서 Buckhead 방향으로 이어지는 Beltline. 부분 개통 상태로 구간별 산책 가능.",
    beltline: "north",
  },

  // ── South / Southeast Beltline ─────────────────────────
  {
    name: "Southeast Trail",
    lat: 33.7350, lng: -84.3640,
    transport: ["car", "walk"],
    category: ["active", "photo"],
    meta: "Southeast Beltline · 신규 개통 (2026.04)",
    desc: "Boulevard에서 Glenwood까지 1.2마일. 2026년 4월 17일 개통. Beltline 본선이 이제 14.8마일.",
    beltline: "south",
  },
  {
    name: "Southside Trail (공사 중)",
    lat: 33.7300, lng: -84.3850,
    transport: ["car"],
    category: ["active"],
    meta: "South Beltline · 2026 6월 완공 목표",
    desc: "Segments 2-3은 공사 중. 6월 완공 시 East ↔ West 연결 완료, 총 16.7마일 연속 트레일이 됩니다.",
    beltline: "south",
  },

  // ── Inman Park ─────────────────────────
  {
    name: "Inman Park",
    lat: 33.7619, lng: -84.3537,
    transport: ["car", "marta"],
    category: ["food", "shop", "photo"],
    meta: "차로 12분 · 🚇 Inman Park 역",
    desc: "예쁜 빅토리안 주택과 트렌디 식당이 모인 동네. Beltline 옆이고 Krog Street Market 인접. Little Five Points와도 가까워요.",
  },

  // ── 차로 가까운 ─────────────────────────
  {
    name: "Virginia Highland",
    lat: 33.7796, lng: -84.3537,
    transport: ["car"],
    category: ["food", "shop"],
    meta: "차로 15분",
    desc: "예쁜 카페와 부티크가 모인 동네. 브런치하기 좋아요.",
  },
  {
    name: "Lenox Square / Phipps Plaza",
    lat: 33.8483, lng: -84.3627,
    transport: ["car", "marta"],
    category: ["shop", "food"],
    meta: "차로 15-20분 · 🚇 Lenox 역",
    desc: "벅헤드 핵심 쇼핑. Lenox는 메이시스 등 메인스트림, Phipps는 더 럭셔리 (구찌, 루이비통). 같은 블록.<br/><br/>🚇 <b>MARTA Red Line</b> Lenox 역에서 도보 1분, 차 없어도 OK.",
  },
  {
    name: "Truist Park",
    lat: 33.8908, lng: -84.4678,
    transport: ["car"],
    category: ["sport", "food"],
    meta: "차로 20분",
    desc: "애틀랜타 브레이브스 야구장. The Battery 상권이 같이 있어 야구 안 봐도 chill하게 놀러갈 만해요.",
  },
  {
    name: "Marietta Square",
    lat: 33.9526, lng: -84.5499,
    transport: ["car"],
    category: ["food", "photo"],
    meta: "차로 30분",
    desc: "광장 중심의 작은 가게들. 유럽 같은 분위기. 주말 산책 코스로 굿.",
  },

  // ── Fox Bros @ The Works (Chattahoochee Row) ─────
  {
    name: "Fox Bros Bar-B-Q (The Works)",
    lat: 33.8002, lng: -84.4322,
    transport: ["car"],
    category: ["food"],
    meta: "차로 10분",
    desc: "Atlanta 대표 BBQ. The Works 푸드홀 안 (204 Chattahoochee Row NW). 양 많고 분위기 좋음.",
  },

  // ── 자연/외곽 ─────────────────────────
  {
    name: "Stone Mountain Park",
    lat: 33.8053, lng: -84.1452,
    transport: ["car"],
    category: ["nature", "active", "photo"],
    meta: "차로 30-40분",
    desc: "거대 화강암 산. 등산(약 1시간) 또는 케이블카. 여름엔 밤에 레이저쇼. 애틀랜타 상징적 명소.",
  },
  {
    name: "Chattahoochee River",
    lat: 33.9056, lng: -84.4474,
    transport: ["car"],
    category: ["nature", "active"],
    meta: "차로 20분",
    desc: "강변 트레일(Cochran Shoals)에서 산책/러닝. 여름엔 튜빙(tubing)으로 강 떠내려가는 게 명물.",
  },

  // ── Day trip (멀지만 가볼만) ─────────────────────────
  {
    name: "Athens (UGA)",
    lat: 33.9519, lng: -83.3576,
    transport: ["car"],
    category: ["food", "photo"],
    meta: "차로 1시간 15분",
    desc: "UGA 캠퍼스가 있는 대학 도시. 다운타운 Athens에 카페·바·라이브 음악. 가을 풋볼 시즌이 절정.",
  },
  {
    name: "Helen, GA",
    lat: 34.7012, lng: -83.7224,
    transport: ["car"],
    category: ["nature", "photo"],
    meta: "차로 1시간 30분",
    desc: "독일 바이에른풍 산골 마을. 가을엔 옥토버페스트, 겨울엔 크리스마스 분위기. 근처 폭포(Anna Ruby Falls)도 추천.",
  },

  // ── 한인/푸드 코리더 ─────────────────────────
  {
    name: "Buford Highway",
    lat: 33.8585, lng: -84.2989,
    transport: ["car"],
    category: ["food", "korea"],
    meta: "차로 15분",
    desc: "한·중·베·멕시칸 다 모인 인터내셔널 푸드 코리더. 도라빌 가는 길에 위치. 가격 대비 맛집 많음.",
  },
  {
    name: "Doraville (도라빌)",
    lat: 33.8973, lng: -84.2705,
    transport: ["car", "marta"],
    category: ["food", "korea", "shop"],
    meta: "차로 20분 · 🚇 Doraville 역",
    desc: "H Mart, Super H Mart, 한식당 밀집. 가까운 한인타운.<br/><br/>🚇 <b>MARTA Gold Line 종점</b> Doraville 역, 차 없는 신입생도 장보러 갈 수 있어요.",
  },
  {
    name: "Duluth (둘루쓰)",
    lat: 34.0029, lng: -84.1446,
    transport: ["car"],
    category: ["food", "korea", "shop"],
    meta: "차로 30분",
    desc: "애틀랜타 한인 커뮤니티의 중심. H Mart 대형, 한식·중식·분식 다 있음.",
  },
  {
    name: "Suwanee (스와니)",
    lat: 34.0515, lng: -84.0713,
    transport: ["car"],
    category: ["food", "korea"],
    meta: "차로 40분",
    desc: "좀 더 외곽이지만 한인 카페·디저트·BBQ 맛집이 늘어나는 동네.",
  },
];

const TAG_LABELS = {
  transport: {
    walk:    { emoji: "🚶", label: "도보",    cls: "tx-walk" },
    marta:   { emoji: "🚇", label: "MARTA",   cls: "tx-marta" },
    car:     { emoji: "🚗", label: "차",      cls: "tx-car" },
    stinger: { emoji: "🚌", label: "Stinger", cls: "tx-stinger" },
  },
  category: {
    food:    { emoji: "🍽", label: "음식",       cls: "cat-food" },
    shop:    { emoji: "🛍", label: "쇼핑",       cls: "cat-shop" },
    nature:  { emoji: "🏔", label: "자연",       cls: "cat-nature" },
    art:     { emoji: "🎭", label: "문화·예술",   cls: "cat-art" },
    sport:   { emoji: "⚽", label: "스포츠",     cls: "cat-sport" },
    photo:   { emoji: "📸", label: "포토",       cls: "cat-photo" },
    korea:   { emoji: "🥢", label: "한인",       cls: "cat-korea" },
    active:  { emoji: "🏃", label: "야외활동",   cls: "cat-active" },
  },
};

// 카테고리 색깔 → 핀 색
const PIN_COLOR_BY_CATEGORY = {
  food: "#9f1239",
  shop: "#831843",
  nature: "#065f46",
  art: "#991b1b",
  sport: "#155e75",
  photo: "#713f12",
  korea: "#be185d",
  active: "#047857",
};

function pinColorFor(place) {
  if (place.pinColor) return place.pinColor;
  if (place.category && place.category.length) {
    return PIN_COLOR_BY_CATEGORY[place.category[0]] || "#1d4ed8";
  }
  return "#1d4ed8";
}
