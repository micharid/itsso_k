/**
 * context_menu.js - 우클릭 커스텀 컨텍스트 메뉴
 * 모든 커스텀 우클릭 메뉴는 이 파일에서만 구현한다.
 */

let _contextMenu = null;
let _ctxTarget = null;

/**
 * 커스텀 컨텍스트 메뉴 초기화
 * 텍스트 선택 후 우클릭 시 브라우저 기본 메뉴 작동.
 * 테이블 행 우클릭 시 커스텀 메뉴 표시.
 */
function initContextMenu() {
  // 전역 우클릭 이벤트
  document.addEventListener('contextmenu', (e) => {
    // 텍스트 선택 상태면 브라우저 기본 메뉴 허용
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      hideContextMenu();
      return;
    }

    // 테이블 행(tr) 우클릭 확인
    const row = e.target.closest('tr[data-row-type]');
    if (!row) {
      hideContextMenu();
      return;
    }

    e.preventDefault();
    _ctxTarget = row;
    showContextMenu(e.clientX, e.clientY, row.getAttribute('data-row-type'), row);
  });

  // 클릭 시 메뉴 닫기
  document.addEventListener('click', hideContextMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideContextMenu();
  });
}

/**
 * 커스텀 메뉴 표시
 * @param {number} x
 * @param {number} y
 * @param {string} rowType  'product' | 'order' | 'dispatch'
 * @param {HTMLElement} row
 */
function showContextMenu(x, y, rowType, row) {
  hideContextMenu();

  const menu = buildMenu(rowType, row);
  if (!menu) return;

  menu.style.left = `${Math.min(x, window.innerWidth - 200)}px`;
  menu.style.top  = `${Math.min(y, window.innerHeight - menu.offsetHeight - 10)}px`;
  document.body.appendChild(menu);
  _contextMenu = menu;

  // 위치 보정 (appendChild 후 실제 크기 반영)
  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth)  menu.style.left = `${window.innerWidth - rect.width - 8}px`;
    if (rect.bottom > window.innerHeight) menu.style.top = `${window.innerHeight - rect.height - 8}px`;
  });
}

function hideContextMenu() {
  if (_contextMenu) {
    _contextMenu.remove();
    _contextMenu = null;
  }
}

/**
 * 행 타입에 따른 메뉴 항목 생성
 */
function buildMenu(rowType, row) {
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  menu.style.cssText = `
    position:fixed; z-index:5000;
    background:var(--bg-elevated); border:1px solid var(--border-default);
    border-radius:6px; min-width:170px; padding:4px 0;
    box-shadow:0 8px 24px rgba(0,0,0,.5); font-size:13px;
  `;

  const cellVal = row.querySelector('td')?.textContent?.trim() || '';

  const items = getMenuItems(rowType, row, cellVal);
  if (!items.length) return null;

  items.forEach(item => {
    if (item === '---') {
      const divider = document.createElement('div');
      divider.style.cssText = 'border-top:1px solid var(--border-default); margin:4px 0;';
      menu.appendChild(divider);
    } else {
      const el = document.createElement('div');
      el.style.cssText = `
        padding:8px 14px; cursor:pointer; color:var(--text-primary);
        transition:background 0.1s;
      `;
      el.textContent = item.label;
      if (item.danger) el.style.color = 'var(--accent-danger)';
      el.addEventListener('mouseenter', () => el.style.background = 'var(--bg-hover)');
      el.addEventListener('mouseleave', () => el.style.background = '');
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        hideContextMenu();
        item.action(row);
      });
      menu.appendChild(el);
    }
  });

  return menu;
}

/**
 * 행 타입별 메뉴 항목 정의
 */
function getMenuItems(rowType, row, cellVal) {
  const commonItems = [
    {
      label: '셀 값 복사',
      action: (r) => {
        const td = document.elementFromPoint(
          parseInt(_contextMenu?.style.left || 0),
          parseInt(_contextMenu?.style.top || 0)
        )?.closest('td');
        copyToClipboard(td?.textContent?.trim() || '');
      },
    },
  ];

  if (rowType === 'product') {
    return [
      ...commonItems,
      { label: '상세보기', action: (r) => openProductDetail(r.dataset.id) },
      { label: '분석결과보기', action: (r) => openAnalysisDetail(r.dataset.id) },
      '---',
      { label: '상품 URL 열기', action: (r) => window.open(r.dataset.productUrl, '_blank') },
      { label: '도매처 URL 열기', action: (r) => window.open(r.dataset.wholesaleUrl, '_blank') },
      '---',
      { label: '자동화 설정', action: (r) => openAutomationSetting(r.dataset.id) },
      { label: '매핑 추가', action: (r) => openMappingModal(r.dataset.id) },
    ];
  }

  if (rowType === 'order') {
    return [
      ...commonItems,
      { label: '주문 상세보기', action: (r) => openOrderDetail(r.dataset.id) },
      '---',
      { label: '수동 발주 처리', action: (r) => manualDispatch(r.dataset.id) },
      { label: '송장 직접 입력', action: (r) => openTrackingModal(r.dataset.id) },
    ];
  }

  return commonItems;
}

// ─────────────────────────────────────────
// 컨텍스트 메뉴 액션 함수들
// ─────────────────────────────────────────

function openProductDetail(id) {
  document.dispatchEvent(new CustomEvent('ctx:open-product', { detail: { id } }));
}
function openAnalysisDetail(id) {
  document.dispatchEvent(new CustomEvent('ctx:open-analysis', { detail: { id } }));
}
function openMappingModal(id) {
  document.dispatchEvent(new CustomEvent('ctx:open-mapping', { detail: { id } }));
}
function openAutomationSetting(id) {
  document.dispatchEvent(new CustomEvent('ctx:open-automation', { detail: { id } }));
}
function openOrderDetail(id) {
  document.dispatchEvent(new CustomEvent('ctx:open-order', { detail: { id } }));
}
async function manualDispatch(id) {
  const ok = await confirmDialog('선택한 주문을 수동 발주 처리하시겠습니까?');
  if (!ok) return;
  try {
    await API.orders.manualDispatch(Number(id));
    showToast('수동 발주 요청이 완료되었습니다.', 'success');
    document.dispatchEvent(new CustomEvent('ctx:refresh'));
  } catch (e) {
    showToast(e.message, 'error');
  }
}
function openTrackingModal(id) {
  document.dispatchEvent(new CustomEvent('ctx:open-tracking', { detail: { id } }));
}

document.addEventListener('DOMContentLoaded', initContextMenu);
