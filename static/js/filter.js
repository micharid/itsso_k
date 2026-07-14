/**
 * filter.js - 필터 영역 공통 아코디언 + 초기화 처리
 */

/**
 * 필터 접기/펼치기 초기화
 */
function initFilterToggle() {
  const toggleBtn = document.querySelector('.filter-toggle-btn');
  const filterBody = document.querySelector('.filter-body');
  if (!toggleBtn || !filterBody) return;

  filterBody.classList.add('expanded');

  toggleBtn.addEventListener('click', () => {
    const isCollapsed = filterBody.classList.contains('collapsed');
    filterBody.classList.toggle('collapsed', !isCollapsed);
    filterBody.classList.toggle('expanded', isCollapsed);
    const icon = toggleBtn.querySelector('.toggle-icon');
    if (icon) icon.textContent = isCollapsed ? '▲' : '▼';
  });
}

/**
 * 필터 초기화 버튼
 * @param {string} formId  - 필터 form 요소 ID
 * @param {Function} onReset - 초기화 후 콜백
 */
function initFilterReset(formId, onReset) {
  const resetBtn = document.querySelector(`#${formId} .btn-filter-reset`);
  if (!resetBtn) return;
  resetBtn.addEventListener('click', () => {
    const form = document.getElementById(formId);
    if (form) {
      form.querySelectorAll('input, select').forEach(el => {
        if (el.type === 'checkbox') el.checked = false;
        else el.value = '';
      });
    }
    if (typeof onReset === 'function') onReset();
  });
}

/**
 * 페이지 크기 선택 초기화
 * @param {string} selectId
 * @param {Function} onChange
 */
function initPageSizeSelect(selectId, onChange) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.addEventListener('change', () => onChange(Number(sel.value)));
}

/**
 * 페이지네이션 렌더링
 * @param {string} containerId
 * @param {number} currentPage
 * @param {number} total
 * @param {number} pageSize
 * @param {Function} onPageChange
 */
function renderPagination(containerId, currentPage, total, pageSize, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalPages = Math.ceil(total / pageSize);
  container.innerHTML = '';
  if (totalPages <= 1) return;

  const makeBtn = (label, page, disabled = false, active = false) => {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (active ? ' active' : '');
    btn.textContent = label;
    btn.disabled = disabled;
    if (!disabled && !active) {
      btn.addEventListener('click', () => onPageChange(page));
    }
    return btn;
  };

  container.appendChild(makeBtn('‹', currentPage - 1, currentPage === 1));

  const range = getPageRange(currentPage, totalPages);
  range.forEach(p => {
    if (p === '...') {
      const span = document.createElement('span');
      span.textContent = '...';
      span.style.color = 'var(--text-disabled)';
      span.style.padding = '0 6px';
      container.appendChild(span);
    } else {
      container.appendChild(makeBtn(p, p, false, p === currentPage));
    }
  });

  container.appendChild(makeBtn('›', currentPage + 1, currentPage === totalPages));
}

function getPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  pages.push(1);
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

document.addEventListener('DOMContentLoaded', initFilterToggle);
