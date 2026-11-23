// 연한 파스텔 지도 (OpenFreeMap Positron에 색만 입힌 assets/map-style.json, API 키 불필요)
// WebGL이 안 되는 환경에서는 OSM 기본 타일로 대체.
function addBasemap(map) {
  const attribution = '&copy; <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; OpenStreetMap';
  let webgl = false;
  try { const c = document.createElement('canvas'); webgl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) {}
  if (L.maplibreGL && window.maplibregl && webgl) {
    return L.maplibreGL({ style: new URL('assets/map-style.json', location.href).href, attribution }).addTo(map);
  }
  return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap', maxZoom: 19
  }).addTo(map);
}
