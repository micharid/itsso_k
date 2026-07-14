/**
 * auth.js - 로그인/로그아웃 처리
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  // 이미 로그인된 경우 리다이렉트
  if (getAccessToken()) {
    location.href = '/pages/dashboard.html';
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    errorEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> 로그인 중...';

    try {
      const data = await API.auth.login(username, password);
      if (!data) throw new Error('응답 없음');
      setTokens(data.access_token, data.refresh_token);

      // 사용자 타입 쿠키에 저장 (UI 메뉴 제어용)
      document.cookie = `user_type=${data.user_type}; path=/; max-age=3600`;
      document.cookie = `username=${data.username}; path=/; max-age=3600`;

      location.href = '/pages/dashboard.html';
    } catch (err) {
      errorEl.textContent = err.message || '로그인 실패';
      submitBtn.disabled = false;
      submitBtn.textContent = '로그인';
    }
  });
});

/**
 * 로그아웃 처리
 */
async function logout() {
  try {
    await API.auth.logout();
  } finally {
    clearTokens();
    document.cookie = 'user_type=; max-age=0';
    document.cookie = 'username=; max-age=0';
    location.href = '/login.html';
  }
}

/**
 * 쿠키에서 사용자 타입 읽기
 */
function getUserType() {
  const m = document.cookie.match(/user_type=([^;]+)/);
  return m ? m[1] : '';
}

function getUsername() {
  const m = document.cookie.match(/username=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

/**
 * 권한에 따른 메뉴 표시 제어
 * owner/sysadmin: 사용자 관리, 감사 로그 표시
 */
function applyMenuPermissions() {
  const userType = getUserType();
  const adminOnlyItems = document.querySelectorAll('[data-admin-only]');
  adminOnlyItems.forEach(el => {
    if (!['owner', 'sysadmin'].includes(userType)) {
      el.style.display = 'none';
    }
  });

  // 사용자名 표시
  const usernameEl = document.getElementById('header-username');
  if (usernameEl) usernameEl.textContent = getUsername();
}

document.addEventListener('DOMContentLoaded', applyMenuPermissions);
