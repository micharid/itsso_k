/**
 * theme.js - 테마 및 폰트 크기 동적 업데이트
 * 설정값은 서버 DB에서 로드. localStorage 사용 금지.
 */

/**
 * 서버 DB에서 UI 설정을 불러와 CSS 변수에 적용
 */
async function loadAndApplyUISettings() {
  try {
    const data = await API.settings.getUI();
    if (!data || !data.settings) return;
    const s = data.settings;

    if (s.font_size) applyFontSize(s.font_size);
    if (s.accent_color) applyAccentColor(s.accent_color);
  } catch {
    // 설정 로드 실패 시 기본값 유지
  }
}

/**
 * 폰트 크기 적용 (12~20px)
 * @param {number} size
 */
function applyFontSize(size) {
  const clamped = Math.max(12, Math.min(20, Number(size)));
  document.documentElement.style.setProperty('--font-size-base', `${clamped}px`);
  document.documentElement.style.setProperty('--font-size-sm', `${clamped - 2}px`);
  document.documentElement.style.setProperty('--font-size-lg', `${clamped + 2}px`);
  document.documentElement.style.setProperty('--font-size-xl', `${clamped + 6}px`);
}

/**
 * 강조 색상 적용
 * @param {string} hexColor
 */
function applyAccentColor(hexColor) {
  document.documentElement.style.setProperty('--accent-primary', hexColor);
  // hover는 약간 어둡게
  const darker = shadeColor(hexColor, -15);
  document.documentElement.style.setProperty('--accent-primary-hover', darker);
}

/**
 * HEX 색상 밝기 조절
 * @param {string} hex
 * @param {number} percent
 * @returns {string}
 */
function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

document.addEventListener('DOMContentLoaded', () => {
  // 로그인 페이지가 아닌 경우에만 설정 로드
  if (!location.pathname.includes('login')) {
    loadAndApplyUISettings();
  }
});
