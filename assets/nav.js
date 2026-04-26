// 모든 페이지 공통 nav를 주입
(function () {
  const path = location.pathname.split('/').pop() || 'index.html';
  const links = [
    { href: 'index.html',    label: '홈' },
    { href: 'checklist.html',label: '신입생 길잡이' },
    { href: 'life.html',     label: '생활' },
    { href: 'atlanta.html',  label: 'Atlanta Map' },
    { href: 'events.html',   label: "What's on Atlanta" },
  ];
  const html = `
    <div class="nav-inner">
      <a href="index.html" class="nav-brand"><span class="bee">🧭</span> GT Compass</a>
      <div class="nav-links">
        ${links.map(l => `<a href="${l.href}" class="${l.href === path ? 'active' : ''}">${l.label}</a>`).join('')}
      </div>
    </div>
  `;
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.innerHTML = html;
  document.body.insertBefore(nav, document.body.firstChild);

  // Footer 주입
  const footer = document.createElement('footer');
  footer.innerHTML = `
    제 35기 GTKSA · 조지아텍 한인 학생회 ·
    문의: <a href="mailto:webmaster@gtksa.net">webmaster@gtksa.net</a>
    <div class="visit-count" id="visit-count"></div>
  `;
  document.body.appendChild(footer);

  // 누적 방문자 카운터 (abacus.jasoncameron.dev)
  fetch('https://abacus.jasoncameron.dev/hit/gt-compass/visits')
    .then(r => r.json())
    .then(d => {
      const el = document.getElementById('visit-count');
      if (el && d.value != null) el.innerHTML = `누적 방문 <b>${d.value.toLocaleString()}</b>회`;
    })
    .catch(() => {});

  // Vercel Analytics (대시보드에서 활성화 필요)
  const va = document.createElement('script');
  va.defer = true;
  va.src = '/_vercel/insights/script.js';
  document.head.appendChild(va);
})();
