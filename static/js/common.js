/**
 * common.js - 공통 유틸리티
 * 모든 페이지에서 로드된다.
 */

// ─────────────────────────────────────────
// 날짜/시간 포맷
// ─────────────────────────────────────────

/**
 * ISO 날짜 문자열을 한국형 포맷으로 변환
 * @param {string|null} isoStr
 * @returns {string}
 */
function formatDateTime(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function formatDate(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  return d.toLocaleDateString('ko-KR');
}

// ─────────────────────────────────────────
// 숫자 포맷
// ─────────────────────────────────────────

function formatNumber(n) {
  if (n == null) return '-';
  return Number(n).toLocaleString('ko-KR');
}

function formatPrice(n) {
  if (n == null) return '-';
  return Number(n).toLocaleString('ko-KR') + '원';
}

function formatPercent(n) {
  if (n == null) return '-';
  return Number(n).toFixed(1) + '%';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─────────────────────────────────────────
// 상태 배지 생성
// ─────────────────────────────────────────

const ORDER_STATUS_LABELS = {
  new: { label: '신규', cls: 'badge-info' },
  dispatch_pending: { label: '발주대기', cls: 'badge-warning' },
  dispatched: { label: '발주완료', cls: 'badge-default' },
  tracking_registered: { label: '송장등록', cls: 'badge-success' },
  delivered: { label: '배송완료', cls: 'badge-success' },
  cancelled: { label: '취소', cls: 'badge-default' },
  return_requested: { label: '반품요청', cls: 'badge-warning' },
  returned: { label: '반품완료', cls: 'badge-default' },
  error: { label: '오류', cls: 'badge-danger' },
};

const DISPATCH_STATUS_LABELS = {
  pending: { label: '대기', cls: 'badge-warning' },
  processing: { label: '처리중', cls: 'badge-info' },
  completed: { label: '완료', cls: 'badge-success' },
  failed: { label: '실패', cls: 'badge-danger' },
  cancelled: { label: '취소', cls: 'badge-default' },
};

function statusBadge(status, map) {
  const info = map[status] || { label: status, cls: 'badge-default' };
  return `<span class="badge ${info.cls}">${info.label}</span>`;
}

// ─────────────────────────────────────────
// 토스트 알림
// ─────────────────────────────────────────

function showToast(message, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position:fixed; bottom:20px; right:20px;
      z-index:9999; display:flex; flex-direction:column; gap:8px;
    `;
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const colorMap = {
    success: 'var(--accent-success)',
    warning: 'var(--accent-warning)',
    error: 'var(--accent-danger)',
    info: 'var(--accent-info)',
  };
  toast.style.cssText = `
    padding:10px 16px; border-radius:6px;
    background:var(--bg-elevated); color:var(--text-primary);
    border-left:4px solid ${colorMap[type] || colorMap.info};
    font-size:13px; min-width:240px; max-width:360px;
    box-shadow:0 4px 12px rgba(0,0,0,.4);
    animation:slide-in 0.2s ease;
  `;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, duration);
}

// ─────────────────────────────────────────
// 확인 다이얼로그
// ─────────────────────────────────────────

function confirmDialog(message) {
  return new Promise((resolve) => {
    if (window.confirm(message)) resolve(true);
    else resolve(false);
  });
}

// ─────────────────────────────────────────
// 클립보드
// ─────────────────────────────────────────

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('복사되었습니다.', 'success', 1500);
  } catch {
    showToast('복사 실패', 'error');
  }
}

// ─────────────────────────────────────────
// 사이드바 토글
// ─────────────────────────────────────────

function initSidebarToggle() {
  const wrapper = document.querySelector('.app-wrapper');
  const toggler = document.getElementById('sidebar-toggle');
  if (!toggler || !wrapper) return;

  const saved = document.cookie.match(/sidebar_state=([^;]+)/);
  if (saved && saved[1] === 'collapsed') {
    wrapper.classList.add('sidebar-collapsed');
  }

  toggler.addEventListener('click', () => {
    wrapper.classList.toggle('sidebar-collapsed');
    const state = wrapper.classList.contains('sidebar-collapsed') ? 'collapsed' : 'expanded';
    document.cookie = `sidebar_state=${state}; path=/; max-age=31536000`;
  });
}

// ─────────────────────────────────────────
// 활성 메뉴 표시
// ─────────────────────────────────────────

function markActiveMenu() {
  const path = location.pathname;
  document.querySelectorAll('.sidebar-menu-item[data-href]').forEach(item => {
    const href = item.getAttribute('data-href');
    if (path.includes(href)) item.classList.add('active');
    else item.classList.remove('active');
  });
}

// ─────────────────────────────────────────
// 비활성 자동 로그아웃
// ─────────────────────────────────────────

let _inactivityTimer = null;

function initInactivityLogout(timeoutMinutes = 30) {
  const reset = () => {
    clearTimeout(_inactivityTimer);
    _inactivityTimer = setTimeout(async () => {
      try {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        });
      } finally {
        clearTokens();
        location.href = '/login.html';
      }
    }, timeoutMinutes * 60 * 1000);
  };
  ['mousemove', 'keydown', 'click', 'scroll'].forEach(ev => document.addEventListener(ev, reset, { passive: true }));
  reset();
}

// ─────────────────────────────────────────
// 토큰 관리 (메모리 + httpOnly 쿠키 아닌 세션 스토리지)
// ─────────────────────────────────────────

function getAccessToken() {
  return sessionStorage.getItem('at') || '';
}
function getRefreshToken() {
  return sessionStorage.getItem('rt') || '';
}
function setTokens(access, refresh) {
  sessionStorage.setItem('at', access);
  sessionStorage.setItem('rt', refresh);
}
function clearTokens() {
  sessionStorage.removeItem('at');
  sessionStorage.removeItem('rt');
}

/**
 * 브라우저를 다시 열었을 때: sessionStorage 비어 있어도
 * HttpOnly 리프레시 쿠키(로그인 유지 선택 시)로 세션 복구 시도
 */
async function trySilentAuthFromServer() {
  if (getAccessToken()) return true;
  if (typeof refreshTokens === 'function' && getRefreshToken()) {
    if (await refreshTokens()) return true;
  }
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: '{}',
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

function _decodeJwtPayload(token) {
  try {
    if (!token || token.split('.').length < 2) return null;
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

async function requireAuth(allowedUserTypes = []) {
  if (location.pathname.includes('login')) return true;

  let token = getAccessToken();
  if (!token) {
    await trySilentAuthFromServer();
    token = getAccessToken();
  }
  if (!token) {
    location.href = '/login.html';
    return false;
  }

  const payload = _decodeJwtPayload(token) || {};
  let userType = payload.user_type || payload.type || '';

  // 토큰 payload에 user_type이 없을 수 있어 1회 보강 조회
  if (!userType && window.API && API.auth && typeof API.auth.me === 'function') {
    try {
      const me = await API.auth.me();
      userType = me?.user_type || me?.type || '';
      if (me?.username) {
        document.cookie = `username=${encodeURIComponent(me.username)}; path=/; max-age=3600`;
      }
      if (userType) {
        document.cookie = `user_type=${encodeURIComponent(userType)}; path=/; max-age=3600`;
      }
    } catch {
      clearTokens();
      location.href = '/login.html';
      return false;
    }
  }

  if (Array.isArray(allowedUserTypes) && allowedUserTypes.length > 0) {
    if (!allowedUserTypes.includes(userType)) {
      if (typeof showToast === 'function') {
        showToast('접근 권한이 없습니다.', 'warning');
      }
      location.href = '/pages/dashboard.html';
      return false;
    }
  }

  return true;
}

function ensureDefaultTabs() {
  if (location.pathname.includes('dashboard')) {
    return;
  }

  const main = document.querySelector('.app-main');
  const pageHeader = main?.querySelector('.page-header');
  if (!main || !pageHeader || main.querySelector('.tabs')) {
    return;
  }

  const pageTitle = pageHeader.querySelector('.page-title')?.textContent?.trim() || '기본';
  const tabs = document.createElement('div');
  tabs.className = 'tabs page-default-tabs';
  tabs.innerHTML = `<button type="button" class="tab active" aria-current="page">${escapeHtml(pageTitle)}</button>`;
  pageHeader.insertAdjacentElement('afterend', tabs);
}

// ─────────────────────────────────────────
// 공통 레이아웃 초기화 (각 페이지 DOMContentLoaded에서 호출)
// ─────────────────────────────────────────

async function initCommonLayout() {
  if (!location.pathname.includes('login')) {
    if (!getAccessToken()) await trySilentAuthFromServer();
    if (!getAccessToken()) {
      location.href = '/login.html';
      return;
    }
  }
  ensureDefaultTabs();
  initSidebarToggle();
  markActiveMenu();
  initInactivityLogout();
}

// ─────────────────────────────────────────
// 페이지 초기화
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// UI 설정 적용 (theme.js의 함수 래핑)
// ─────────────────────────────────────────

/**
 * API.settings.getUI() 응답을 받아 UI에 적용
 * @param {Object} data - getUI() 응답 (data.settings 또는 flat 객체)
 */
function applyUISettings(data) {
  const s = (data && data.settings) ? data.settings : (data || {});
  if (s.font_size && typeof applyFontSize === 'function') applyFontSize(s.font_size);
  if (s.accent_color && typeof applyAccentColor === 'function') applyAccentColor(s.accent_color);
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!location.pathname.includes('login')) {
    if (!getAccessToken()) await trySilentAuthFromServer();
    if (!getAccessToken()) {
      location.href = '/login.html';
      return;
    }
  }
  ensureDefaultTabs();
  initSidebarToggle();
  markActiveMenu();
});
