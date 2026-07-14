/**
 * sidebar.js — 공통 사이드바 렌더러 (서버 www 전용)
 * 모든 페이지에서 로드하면 #appSidebar 에 메뉴를 자동으로 삽입한다.
 * admin-only 메뉴는 쿠키의 user_type 값으로 제어한다.
 */
(function () {
  'use strict';

  // ─────────────────────────────────────────
  // SVG 아이콘 모음 (인라인 SVG, 18×18)
  // ─────────────────────────────────────────
  const ICONS = {
    dashboard:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    products:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    discontinued: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
    my_products: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><circle cx="12" cy="10" r="3"/></svg>',
    orders:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    automation: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>',
    statistics: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    keywords:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    sourcing:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 5h18"/><path d="M7 12h10"/><path d="M10 19h4"/><path d="M4 5l3 14h10l3-14"/></svg>',
    market:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    editor:     '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    settings:   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    monitoring: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><polyline points="7 10 10 7 13 10 17 6"/></svg>',
    users:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    audit:      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    billing:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  };

  const PAGE_VERSION = '20260406d';
  const withVersion = function (href) {
    return href.indexOf('?') >= 0 ? href + '&v=' + PAGE_VERSION : href + '?v=' + PAGE_VERSION;
  };

  // ─────────────────────────────────────────
  // 메뉴 정의 (공통 + 관리자 전용)
  // ─────────────────────────────────────────
  const MENU = [
    { key: 'dashboard',  href: '/pages/dashboard.html',  label: '대시보드',   icon: 'dashboard' },
    { key: 'products',     href: withVersion('/pages/products.html'),    label: '상품 분석',  icon: 'products' },
    { key: 'my_products',  href: withVersion('/pages/my_products.html'), label: '내 상품 관리', icon: 'my_products' },
    { key: 'discontinued', href: withVersion('/pages/discontinued.html'), label: '품절/단종 상품', icon: 'discontinued' },
    { key: 'orders',     href: withVersion('/pages/orders.html'),     label: '주문 관리',  icon: 'orders' },
    { key: 'automation', href: withVersion('/pages/automation.html'), label: '자동화',     icon: 'automation' },
    { key: 'statistics', href: withVersion('/pages/statistics.html'), label: '통계',       icon: 'statistics' },
    { key: 'keywords',   href: withVersion('/pages/keywords.html'),   label: '키워드 분석',icon: 'keywords' },
    { key: 'sourcing',   href: withVersion('/pages/keyword_sourcing.html'), label: '키워드 도매 소싱', icon: 'sourcing' },
    { key: 'market',     href: withVersion('/pages/market.html'),     label: '시장 분석',  icon: 'market' },
    { key: 'editor',     href: withVersion('/pages/editor_v2.html'),  label: '상품 에디터',icon: 'editor' },
    { divider: true },
    { key: 'settings',   href: withVersion('/pages/settings.html'),   label: '설정',       icon: 'settings' },
    { divider: true, adminOnly: true, label: '관리자' },
    { key: 'monitoring', href: withVersion('/pages/system_monitoring.html'), label: '시스템 모니터링', icon: 'monitoring', adminOnly: true },
    { key: 'users',      href: withVersion('/pages/users.html'),      label: '사용자 관리',icon: 'users', adminOnly: true },
    { key: 'audit_logs', href: withVersion('/pages/audit_logs.html'), label: '감사 로그',  icon: 'audit', adminOnly: true },
    { key: 'subscriptions', href: withVersion('/pages/subscriptions.html'), label: '구독 관리', icon: 'billing', adminOnly: true },
  ];

  // ─────────────────────────────────────────
  // 현재 페이지 키 추출 (URL 경로 기준)
  // ─────────────────────────────────────────
  function _currentKey() {
    const path = window.location.pathname;
    const file = path.split('/').pop().replace('.html', '');
    // URL 파일명과 메뉴 key 직접 매핑
    const map = {
      'dashboard':          'dashboard',
      'products':           'products',      'my_products':         'my_products',      'discontinued':       'discontinued',
      'orders':             'orders',
      'automation':         'automation',
      'statistics':         'statistics',
      'keywords':           'keywords',
      'keyword_sourcing':   'sourcing',
      'market':             'market',
      'editor':             'editor',
      'editor_v2':          'editor',
      'settings':           'settings',
      'system_monitoring':  'monitoring',
      'users':              'users',
      'audit_logs':         'audit_logs',
      'subscriptions':      'subscriptions',
    };
    return map[file] || '';
  }

  // ─────────────────────────────────────────
  // 관리자 여부 판단 (쿠키 user_type)
  // ─────────────────────────────────────────
  function _isAdmin() {
    const match = document.cookie.match(/(?:^|;\s*)user_type=([^;]+)/);
    const type = match ? match[1] : '';
    return type === 'owner' || type === 'sysadmin';
  }

  // ─────────────────────────────────────────
  // 사이드바 렌더링
  // ─────────────────────────────────────────
  function renderSidebar() {
    const nav = document.getElementById('appSidebar');
    if (!nav) return;

    const activeKey = _currentKey();
    const isAdmin = _isAdmin();
    let html = '<ul class="sidebar-menu">';

    MENU.forEach(function (item) {
      if (item.divider) {
        if (item.adminOnly && !isAdmin) return;
        const labelHtml = item.label
          ? `<span class="sidebar-section-label">${item.label}</span>`
          : '<div class="sidebar-divider"></div>';
        html += '</ul>' + labelHtml + '<ul class="sidebar-menu">';
        return;
      }
      if (item.adminOnly && !isAdmin) return;

      const isActive = item.key === activeKey;
      const activeCls = isActive ? ' active' : '';
      html += `<li>
        <a href="${item.href}" class="sidebar-menu-item${activeCls}" data-key="${item.key}">
          <span class="menu-icon">${ICONS[item.icon] || ''}</span>
          <span class="menu-label">${item.label}</span>
        </a>
      </li>`;
    });

    html += '</ul>';
    nav.innerHTML = html;
  }

  // ─────────────────────────────────────────
  // 사이드바 토글 (동적 너비 처리)
  // ─────────────────────────────────────────
  function initToggle() {
    const btn = document.getElementById('sidebarToggle');
    const wrapper = document.querySelector('.app-wrapper');
    if (!btn || !wrapper) return;
    btn.addEventListener('click', function () {
      if (window.innerWidth <= 900) {
        wrapper.classList.toggle('sidebar-open');
        return;
      }
      wrapper.classList.toggle('sidebar-collapsed');
    });

    document.addEventListener('click', function (event) {
      if (window.innerWidth > 900) return;
      if (!wrapper.classList.contains('sidebar-open')) return;
      const sidebar = document.getElementById('appSidebar');
      if (!sidebar) return;
      if (sidebar.contains(event.target) || btn.contains(event.target)) return;
      wrapper.classList.remove('sidebar-open');
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) {
        wrapper.classList.remove('sidebar-open');
      }
    });
  }

  // ─────────────────────────────────────────
  // 헤더 사용자명 표시
  // ─────────────────────────────────────────
  function initHeader() {
    const usernameEl = document.getElementById('headerUsername');
    if (usernameEl) {
      const match = document.cookie.match(/(?:^|;\s*)username=([^;]+)/);
      usernameEl.textContent = match ? decodeURIComponent(match[1]) : '—';
    }
    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        if (typeof logout === 'function') logout();
      });
    }
  }

  // ─────────────────────────────────────────
  // 실행
  // ─────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      renderSidebar();
      initToggle();
      initHeader();
    });
  } else {
    renderSidebar();
    initToggle();
    initHeader();
  }
})();
