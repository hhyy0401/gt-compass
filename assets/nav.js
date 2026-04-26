// 모든 페이지 공통 nav를 주입
(function () {
  const path = location.pathname.split('/').pop() || 'index.html';
  const links = [
    { href: 'index.html',    label: '홈' },
    { href: 'atlanta.html',  label: 'Atlanta' },
    { href: 'events.html',   label: '이벤트' },
    { href: 'housing.html',  label: '거주·마트' },
    { href: 'checklist.html',label: '시작하기' },
    { href: 'life.html',     label: '생활' },
    { href: 'gtksa.html',    label: 'GTKSA' },
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

  // 홈이 아닌 페이지엔 main 위에 breadcrumb 주입
  if (path !== 'index.html' && path !== '') {
    const main = document.querySelector('main');
    if (main) {
      const crumb = document.createElement('div');
      crumb.className = 'breadcrumb-bar';
      const otherLinks = links.filter(l => l.href !== 'index.html' && l.href !== path).slice(0, 4);
      crumb.innerHTML = `
        <a href="index.html" class="crumb-home">← 홈</a>
        <span class="crumb-sep">·</span>
        <span class="crumb-other">
          ${otherLinks.map(l => `<a href="${l.href}">${l.label}</a>`).join('<span class="crumb-mid">·</span>')}
        </span>
      `;
      main.insertBefore(crumb, main.firstChild);
    }
  }

  // Footer 주입
  const footer = document.createElement('footer');
  footer.innerHTML = `
    제 35기 GTKSA · 조지아텍 한인 학생회 ·
    문의: <a href="mailto:webmaster@gtksa.net">webmaster@gtksa.net</a>
  `;
  document.body.appendChild(footer);
})();
