// 모든 페이지 공통 nav를 주입
(function () {
  const path = location.pathname.split('/').pop() || 'index.html';
  const links = [
    { href: 'index.html',    label: '홈' },
    { href: 'checklist.html',label: '신입생 길잡이' },
    { href: 'atlanta.html',  label: 'Atlanta Map' },
    { href: 'life.html',     label: '생활' },
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
  `;
  document.body.appendChild(footer);
})();
