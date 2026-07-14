/**
 * api.js - 모든 API 호출은 이 모듈을 통해서만
 * 자동 토큰 갱신, 에러 처리 포함
 */

const API_BASE = '/api';

/**
 * 공통 HTTP 요청 함수.
 * 401 수신 시 토큰 갱신 후 1회 재시도.
 * @param {string} method
 * @param {string} endpoint  (예: '/dashboard')
 * @param {object} [body]
 * @param {boolean} [retried]
 * @returns {Promise<any>}
 */
async function request(method, endpoint, body = null, retried = false) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAccessToken()}`,
  };

  const opts = { method, headers, credentials: 'same-origin' };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + endpoint, opts);

  if (res.status === 401 && !retried) {
    const refreshed = await refreshTokens();
    if (refreshed) return request(method, endpoint, body, true);
    clearTokens();
    location.href = '/login.html';
    return null;
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (Array.isArray(err.detail)) {
        detail = err.detail.map(item => item.msg || item.message || JSON.stringify(item)).join(', ');
      } else if (typeof err.detail === 'object' && err.detail) {
        detail = err.detail.msg || err.detail.message || JSON.stringify(err.detail);
      } else {
        detail = err.detail || detail;
      }
    } catch {}
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

/**
 * 마켓 API 디버깅용: HTTP 성공/실패와 관계없이 본문 전체를 돌려준다 (에디터 스마트스토어 등).
 * @returns {Promise<{ ok: boolean, status: number, json: any, text: string }>}
 */
async function requestFull(method, endpoint, body = null, retried = false) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAccessToken()}`,
  };
  const opts = { method, headers, credentials: 'same-origin' };
  if (body != null) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + endpoint, opts);

  if (res.status === 401 && !retried) {
    const refreshed = await refreshTokens();
    if (refreshed) return requestFull(method, endpoint, body, true);
    clearTokens();
    location.href = '/login.html';
    return { ok: false, status: 401, json: null, text: '' };
  }

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (_) {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text };
}

/**
 * Refresh Token으로 새 Access Token 발급
 * @returns {Promise<boolean>}
 */
async function refreshTokens() {
  try {
    const rt = getRefreshToken() || '';
    const headers = { 'Content-Type': 'application/json' };
    if (rt) headers['Authorization'] = `Bearer ${rt}`;
    const res = await fetch(API_BASE + '/auth/refresh', {
      method: 'POST',
      headers,
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

// ─────────────────────────────────────────
// 인증
// ─────────────────────────────────────────
const API = {

  auth: {
    login: (username, password, rememberMe = false) =>
      request('POST', '/auth/login', {
        username,
        password,
        remember_me: !!rememberMe,
      }),
    logout: () => request('POST', '/auth/logout'),
    me: () => request('GET', '/auth/me'),
    refresh: () => request('POST', '/auth/refresh'),
    sessions: () => request('GET', '/auth/sessions'),
    terminateSession: (id) => request('DELETE', `/auth/sessions/${id}`),
  },

  // ─── 대시보드 ────────────────────────────
  dashboard: {
    get: () => request('GET', '/dashboard'),
  },

  // ─── 주문 ────────────────────────────────
  orders: {
    list: (params = {}) => request('GET', '/orders' + buildQuery(params)),
    get: (id) => request('GET', `/orders/${id}`),
    detail: (id) => request('GET', `/orders/${id}`),
    dispatches: (params = {}) => request('GET', '/orders/dispatches' + buildQuery(params)),
    trackingList: (params = {}) => request('GET', '/orders/tracking' + buildQuery(params)),
    tracking: (params = {}) => request('GET', '/orders/tracking' + buildQuery(params)),
    registerTracking: (orderId, data) => request('POST', '/orders/register-tracking', { order_id: orderId, ...data }),
    retryDispatch: (dispatchId) => request('POST', `/orders/retry-dispatch/${dispatchId}`),
    manualDispatch: (orderId) => request('POST', '/orders/manual-dispatch', { order_id: orderId }),
    manualTracking: (data) => request('POST', '/orders/manual-tracking', data),
  },

  // ─── 상품 ────────────────────────────────
  products: {
    list: (params = {}) => request('GET', '/products' + buildQuery(params)),
    ownerclanPopular: (params = {}) => request('GET', '/products/ownerclan/popular' + buildQuery(params)),
    keywordWholesaleKeywords: (params = {}) => request('GET', '/products/keyword-wholesale/keywords' + buildQuery(params)),
    keywordWholesaleCollect: (params = {}) => request('POST', '/products/keyword-wholesale/collect' + buildQuery(params)),
    keywordWholesaleCollectLatest: (params = {}) => request('POST', '/products/keyword-wholesale/collect/latest' + buildQuery(params)),
    keywordWholesaleProducts: (params = {}) => request('GET', '/products/keyword-wholesale/products' + buildQuery(params)),
    /** 에디터 임시저장 (DB product_editor_drafts, 추후 업로드 플로우로 확장) */
    editorV2CreateDraft: (data) => request('POST', '/products/editor-v2/drafts', data),
    /** 대량등록 엑셀용 카테고리 추천·네이버 쇼핑 경로·양식 안내 */
    editorBulkHints: (productId) => request('GET', `/products/editor-bulk-hints/${productId}`),
    /** 에디터 화면 기준 등록 스냅샷 + 스마트스토어 API payload 초안 */
    editorListingSnapshot: (data) => request('POST', '/products/editor-listing-snapshot', data),
    /** 마켓 등록 API 미호출 — 체크리스트 + 이미지 URL 접속 테스트 */
    editorUploadReadiness: (data) => request('POST', '/products/editor-upload-readiness', data),
    /** 에디터 → 스마트스토어 신규 등록만 (성공/실패 본문 — requestFull). 수정·삭제 API는 업로드 안정화 후 추가 예정 */
    editorV2SmartstoreRegister: (data) => requestFull('POST', '/products/editor-v2/smartstore/register', data),
    /** @param {number|null} [atSellPrice] 입력 판매가 — 있으면 등록 검증과 동일한 기준으로 순마진 표시 */
    calcPrice: (supplyPrice, platformType = 'smartstore', atSellPrice = null) => {
      let q = `/products/calc-price?supply_price=${supplyPrice}&platform_type=${encodeURIComponent(platformType)}`;
      if (atSellPrice != null && atSellPrice > 0) q += `&at_sell_price=${atSellPrice}`;
      return request('GET', q);
    },
    /** 에디터 V2: 오너클랜 GraphQL 실시간 상세. extra.selfcode = 웹 view.php?selfcode= 과 동일 상품코드 */
    getEditorOcLive: (id, extra = {}) => {
      const q = new URLSearchParams();
      const sc = (extra.selfcode || extra.oc_key || extra.ocKey || '').trim();
      if (sc) q.set('selfcode', sc);
      const qs = q.toString();
      return request('GET', `/products/${id}/editor-oc-live${qs ? '?' + qs : ''}`);
    },
    get: (id) => request('GET', `/products/${id}`),
    update: (id, data) => request('PATCH', `/products/${id}`, data),
    detail: (id) => request('GET', `/products/${id}`),
    getMappings: (productId) => request('GET', `/products/${productId}/mappings`),
    createMapping: (data) => request('POST', '/products/mappings', data),
    updateMapping: (id, data) => request('PATCH', `/products/mappings/${id}`, data),
    raw: (params = {}) => request('GET', '/products/raw' + buildQuery(params)),
    rawDetail: (id) => request('GET', `/products/raw/${id}`),
    mappings: () => request('GET', '/products/mappings'),
    deleteMapping: (id) => request('DELETE', `/products/mappings/${id}`),
    options: (mappingId) => request('GET', `/products/mappings/${mappingId}/options`),
    createOption: (mappingId, data) => request('POST', `/products/mappings/${mappingId}/options`, data),
    trending: (params = {}) => request('GET', '/products/trending' + buildQuery(params)),
    trendingKeywords: (params = {}) => request('GET', '/products/trending/keywords' + buildQuery(params)),
  },

  // ─── 오너클랜 상품 등록 ────────────────────
  oc: {
    registerProduct: (productNo, data) => request('POST', `/oc/products/${productNo}/register`, data),
    syncStatus: () => request('GET', '/oc/sync/status'),
    startFullSync: () => request('POST', '/oc/sync/full'),
    search: (keyword, limit = 10) => request('GET', `/oc/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`),
    importProduct: (productNo) => request('POST', `/oc/products/${encodeURIComponent(productNo)}/import`),
    realtimeDetail: (productNo) => request('GET', `/oc/search/detail/${encodeURIComponent(productNo)}`),
    products: (params = {}) => request('GET', '/oc/products' + buildQuery(params)),
    product: (productNo, params = {}) => request('GET', `/oc/products/${encodeURIComponent(productNo)}` + buildQuery(params)),
  },

  // ─── 내 상품 ──────────────────────────────
  myProducts: {
    list: (params = {}) => request('GET', '/my-products' + buildQuery(params)),
    get: (id) => request('GET', `/my-products/${id}`),
    update: (id, data) => request('PATCH', `/my-products/${id}`, data),
    summary: () => request('GET', '/my-products/summary'),
    syncStatus: () => request('GET', '/my-products/sync-status'),
  },

  // ─── 자동화 ──────────────────────────────
  automation: {
    status: () => request('GET', '/automation/status'),
    pause: () => request('POST', '/automation/pause'),
    resume: () => request('POST', '/automation/resume'),
    logs: (params = {}) => request('GET', '/automation/logs' + buildQuery(params)),
    stockHistory: (params = {}) => request('GET', '/automation/stock-history' + buildQuery(params)),
    priceHistory: (params = {}) => request('GET', '/automation/price-history' + buildQuery(params)),
    manualCrawl: () => request('POST', '/automation/crawl/manual'),
  },

  // ─── 플랫폼 ──────────────────────────────
  platforms: {
    list: (params = {}) => request('GET', '/platforms' + buildQuery(params)),
    add: (data) => request('POST', '/platforms', data),
    test: (id) => request('POST', `/platforms/${id}/test`),
    update: (id, data) => request('PATCH', `/platforms/${id}`, data),
    delete: (id) => request('DELETE', `/platforms/${id}`),
    get: (id) => request('GET', `/platforms/${id}`),
  },

  // ─── 사용자 ──────────────────────────────
  users: {
    list: () => request('GET', '/users'),
    create: (data) => request('POST', '/users', data),
    update: (id, data) => request('PATCH', `/users/${id}`, data),
  },

  // ─── 권한 ────────────────────────────────
  permissions: {
    list: () => request('GET', '/permissions/list'),
    userPerms: (userId) => request('GET', `/permissions/user/${userId}`),
    grant: (data) => request('POST', '/permissions/grant', data),
    revoke: (data) => request('POST', '/permissions/revoke', data),
  },

  // ─── 알림 ────────────────────────────────
  notifications: {
    list: (params = {}) => request('GET', '/notifications' + buildQuery(params)),
    markRead: (id) => request('POST', `/notifications/${id}/read`),
    markAllRead: () => request('POST', '/notifications/read-all'),
  },

  // ─── 통계 ────────────────────────────────
  statistics: {
    daily: (params = {}) => request('GET', '/statistics/daily' + buildQuery(params)),
    keywords: (params = {}) => request('GET', '/statistics/keywords' + buildQuery(params)),
    keywordTrends: (params = {}) => request('GET', '/statistics/keyword-trends' + buildQuery(params)),
    market: () => request('GET', '/statistics/market'),
  },

  // ─── 감사 로그 ───────────────────────────
  auditLogs: {
    list: (params = {}) => request('GET', '/audit-logs' + buildQuery(params)),
  },

  // ─── 구독 ────────────────────────────────
  subscriptions: {
    my: () => request('GET', '/subscriptions/my'),
    list: (params = {}) => request('GET', '/subscriptions' + buildQuery(params)),
  },

  // ─── 설정 ────────────────────────────────
  settings: {
    getUI: () => request('GET', '/settings/ui'),
    updateUI: (data) => request('PUT', '/settings/ui', data),
    sessions: () => request('GET', '/settings/sessions'),
    terminateSession: (id) => request('DELETE', `/settings/sessions/${id}`),
    terminateAllSessions: () => request('DELETE', '/settings/sessions'),
    changePassword: (data) => request('POST', '/settings/password', data),
  },
};

/**
 * 쿼리 파라미터 생성 헬퍼
 * @param {object} params
 * @returns {string}
 */
function buildQuery(params) {
  const q = Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return q ? `?${q}` : '';
}
