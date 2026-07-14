/**
 * settings.js — 설정 페이지 로직
 * server/web/assets/js/settings.js
 */

/* ══════════════════════════════════════════════════════
   플랫폼별 인증 필드 정의
══════════════════════════════════════════════════════ */
const PLATFORM_CREDENTIAL_FIELDS = {
  domaemae: [
    { key: 'api_key',   label: 'API Key',   type: 'text',     required: true },
    { key: 'member_id', label: '회원 ID',   type: 'text',     required: true },
  ],
  ownerclan: [
    { key: 'username', label: '오너클랜 아이디', type: 'text',     required: true, placeholder: '오너클랜 로그인 아이디' },
    { key: 'password', label: '비밀번호',        type: 'password', required: true, placeholder: '오너클랜 로그인 비밀번호' },
  ],
  smartstore: [
    { key: 'client_id',     label: 'Client ID',     type: 'text',     required: true },
    { key: 'client_secret', label: 'Client Secret', type: 'password', required: true },
  ],
  coupang: [
    { key: 'access_key', label: 'Access Key', type: 'text',     required: true, placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    { key: 'secret_key', label: 'Secret Key', type: 'password', required: true, placeholder: '영문/숫자 40자' },
    { key: 'vendor_id',  label: '업체코드 (Vendor ID)',  type: 'text', required: true, placeholder: '예: A01684634  ← 쿠팡 파트너스 > 판매자 정보에서 확인' },
  ],
  gmarket: [
    { key: 'login_id', label: '로그인 ID',  type: 'text',     required: true },
    { key: 'password', label: '비밀번호',    type: 'password', required: true },
  ],
  toss: [
    { key: 'api_key',   label: 'API Key',   type: 'text', required: true },
    { key: 'seller_id', label: '판매자 ID', type: 'text', required: true },
  ],
};

const MARKET_PLATFORMS  = ['smartstore', 'coupang', 'gmarket', 'toss'];
const PLATFORM_LABELS   = {
  domaemae: '도매매', ownerclan: '오너클랜',
  smartstore: '스마트스토어', coupang: '쿠팡',
  gmarket: 'G마켓/옥션', toss: '토스쇼핑',
};

/* ══════════════════════════════════════════════════════
   유틸
══════════════════════════════════════════════════════ */
function el(id) { return document.getElementById(id); }

function _toast(msg, type) {
  if (typeof showToast === 'function') showToast(msg, type);
  else console[type === 'error' ? 'error' : 'log']('[Toast]', msg);
}

function formatDT(v) {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleString('ko-KR');
}

/** 한국 전화번호 (하이픈 포함): 지역·휴대폰·대표번호 */
function validateKrPhone(s) {
  if (!s || !String(s).trim()) return true;
  const t = String(s).trim();
  return /^(?:0(?:2|3[1-3]|4[1-4]|5[1-5]|6[1-4])-\d{3,4}-\d{4}|01[016789]-\d{4}-\d{4}|1[5-6]\d{2}-\d{4})$/.test(t);
}

function _escapeAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/* ══════════════════════════════════════════════════════
   Settings 모듈
══════════════════════════════════════════════════════ */
const Settings = {
  _editingPlatformId: null,
  _platformTestPassed: false,
  _userType: null,
  _savingPlatform: false,

  async init() {
    this._detectUserType();
    this._bindTabs();
    this._bindPlatformModal();
    this._bindDbTab();
    this._bindNotifications();
    this._bindUiSettings();
    this._bindSecurity();
    this._bindBackup();
    this._bindGeneral();

    await Promise.allSettled([
      this.loadGeneral(),
      this.loadPlatforms(),
      this.loadNotifications(),
      this.loadUiSettings(),
      this.loadSessions(),
    ]);
  },

  _detectUserType() {
    try {
      const at = sessionStorage.getItem('at');
      if (at) {
        const payload = JSON.parse(atob(at.split('.')[1]));
        this._userType = payload.user_type || payload.type || null;
      }
    } catch (_) {}
  },

  _bindTabs() {
    document.querySelectorAll('.tabs [data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tabs [data-tab]').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => {
          p.classList.remove('active');
          p.style.display = 'none';
        });
        btn.classList.add('active');
        const pane = el('panel-' + btn.dataset.tab);
        if (pane) { pane.classList.add('active'); pane.style.display = ''; }
        const tab = btn.dataset.tab;
        if (tab === 'general')       this.loadGeneral();
        if (tab === 'platforms')     this.loadPlatforms();
        if (tab === 'delivery')      { if (typeof loadDeliveryTab === 'function') loadDeliveryTab(); }
        if (tab === 'notifications') this.loadNotifications();
        if (tab === 'ui')            this.loadUiSettings();
        if (tab === 'security')      this.loadSessions();
        if (tab === 'dbconn')        this.loadDbConfig();
      });
    });
  },

  _bindGeneral() {
    el('saveGeneralBtn') && el('saveGeneralBtn').addEventListener('click', () => this.saveGeneral());
  },

  async loadGeneral() {
    try {
      const data = await request('GET', '/settings/general');
      if (el('siteName'))             el('siteName').value             = data.site_name || 'ChannelP';
      if (el('timezone'))             el('timezone').value             = data.timezone  || 'Asia/Seoul';
      if (el('language'))             el('language').value             = data.language  || 'ko';
      if (el('crawlIntervalMinutes')) el('crawlIntervalMinutes').value = data.crawl_interval_minutes || 60;
    } catch (_) {}
    try {
      const meta = await request('GET', '/automation/status');
      if (el('automationStatusValue')) {
        el('automationStatusValue').innerHTML = meta.automation_paused
          ? '<span class="badge badge-warning">일시정지</span>'
          : '<span class="badge badge-success">실행 중</span>';
      }
      if (el('lastCrawlValue') && meta.recent_logs && meta.recent_logs.length) {
        el('lastCrawlValue').textContent = formatDT(meta.recent_logs[0].executed_at);
      }
    } catch (_) {}
  },

  async saveGeneral() {
    const body = {};
    const v_name = el('siteName') && el('siteName').value.trim();
    const v_tz   = el('timezone') && el('timezone').value;
    const v_lang = el('language') && el('language').value;
    const v_ci   = el('crawlIntervalMinutes') && parseInt(el('crawlIntervalMinutes').value);
    if (v_name)      body.site_name = v_name;
    if (v_tz)        body.timezone  = v_tz;
    if (v_lang)      body.language  = v_lang;
    if (!isNaN(v_ci)) body.crawl_interval_minutes = v_ci;
    try {
      await request('PUT', '/settings/general', body);
      _toast('일반 설정이 저장되었습니다.', 'success');
    } catch (err) { _toast(err.message, 'error'); }
  },

  async loadPlatforms() {
    const wList = el('wholesaleList');
    const mList = el('marketList');
    if (!wList && !mList) return;
    const loadingHtml = '<div class="empty-placeholder">불러오는 중...</div>';
    if (wList) wList.innerHTML = loadingHtml;
    if (mList) mList.innerHTML = loadingHtml;
    try {
      const data = await request('GET', '/platforms');
      const platforms = data.accounts || data.platforms || [];
      const wholesale = platforms.filter(function(p) { return p.role === 'wholesale'; });
      const market    = platforms.filter(function(p) { return p.role === 'market'; });
      if (wList) Settings._renderPlatformList(wList, wholesale, 'wholesale');
      if (mList) Settings._renderPlatformList(mList, market,    'market');
    } catch (err) {
      const errHtml = '<div class="empty-placeholder" style="color:var(--accent-danger)">' + err.message + '</div>';
      if (wList) wList.innerHTML = errHtml;
      if (mList) mList.innerHTML = errHtml;
    }
  },

  _renderPlatformList(container, list, role) {
    if (!list.length) {
      const label = role === 'wholesale' ? '도매처' : '판매 마켓';
      container.innerHTML = '<div class="empty-placeholder">등록된 ' + label + ' 계정이 없습니다.</div>';
      return;
    }
    container.innerHTML = list.map(function(p) {
      const label = PLATFORM_LABELS[p.platform_type] || p.platform_type;
      const statusBadge = p.status === 'ok' ? 'badge-success' : (p.status === 'failed' ? 'badge-danger' : 'badge-default');
      const statusText  = p.status === 'ok' ? '연결됨' : (p.status === 'failed' ? '오류' : '미확인');
      const lockBadge = p.is_locked
        ? '<span class="badge badge-warning" title="' + (p.locked_by_username || '다른 사용자') + ' 사용 중">🔒 사용 중</span>'
        : '';
      return '<div class="account-item' + (p.is_locked ? ' account-item--locked' : '') + '">' +
        '<div class="account-info">' +
          '<span class="account-platform">' + label + '</span>' +
          '<span class="account-name">' + p.account_name + '</span>' +
          '<span class="badge ' + statusBadge + '">' + statusText + '</span>' +
          lockBadge +
        '</div>' +
        '<div class="account-actions">' +
          '<button class="btn btn-xs btn-ghost" onclick="Settings.testPlatform(' + p.id + ')">연결 테스트</button>' +
          '<button class="btn btn-xs btn-ghost" onclick="Settings.openEditPlatform(' + p.id + ',\'' + role + '\')">수정</button>' +
          (p.is_locked ? '<button class="btn btn-xs btn-warning" onclick="Settings.forceUnlockPlatform(' + p.id + ')">잠금 해제</button>' : '') +
          '<button class="btn btn-xs btn-danger" onclick="Settings.deletePlatform(' + p.id + ')">삭제</button>' +
        '</div>' +
      '</div>';
    }).join('');
  },

  _bindPlatformModal() {
    el('addWholesaleBtn') && el('addWholesaleBtn').addEventListener('click', function() { Settings.openAddPlatform('wholesale'); });
    el('addMarketBtn')    && el('addMarketBtn').addEventListener('click',    function() { Settings.openAddPlatform('market'); });
    el('platformModalClose')  && el('platformModalClose').addEventListener('click',  function() { Settings.closePlatformModal(); });
    el('platformModalCancel') && el('platformModalCancel').addEventListener('click', function() { Settings.closePlatformModal(); });

    var typeSelect = el('modalPlatformType');
    typeSelect && typeSelect.addEventListener('change', function() {
      var type = typeSelect.value;
      Settings._renderCredentialsForm(type, [], null);
      // 배송설정은 [설정 > 배송 정보] 탭에서 관리하므로 모달에서는 숨김
      var ds = el('deliverySettingsForm');
      if (ds) ds.style.display = 'none';
      Settings._platformTestPassed = false;
      if (el('savePlatformBtn')) el('savePlatformBtn').disabled = true;
    });

    el('testConnectionBtn') && el('testConnectionBtn').addEventListener('click', function() { Settings._testNewPlatformConnection(); });
    el('savePlatformBtn')   && el('savePlatformBtn').addEventListener('click',   function() { Settings.savePlatform(); });
  },

  openAddPlatform(role) {
    this._editingPlatformId = null;
    this._platformTestPassed = false;
    el('platformModalTitle').textContent = role === 'wholesale' ? '도매처 계정 추가' : '판매 마켓 계정 추가';

    var sel = el('modalPlatformType');
    sel.querySelectorAll('optgroup').forEach(function(og) {
      var isW = og.label === '도매처';
      og.style.display = ((role === 'wholesale') === isW) ? '' : 'none';
    });
    sel.value    = '';
    sel.disabled = false;

    el('credentialsForm').innerHTML = '<p class="text-muted" style="font-size:.85rem">플랫폼을 선택하면 입력 필드가 표시됩니다.</p>';
    if (el('deliverySettingsForm')) el('deliverySettingsForm').style.display = 'none';
    if (el('savePlatformBtn'))      el('savePlatformBtn').disabled = true;
    if (el('modalAccountName'))     el('modalAccountName').value = '';

    el('platformModal').dataset.role = role;
    el('platformModal').style.display = 'flex';
  },

  async openEditPlatform(platformId, role) {
    try {
      var data = await request('GET', '/platforms/' + platformId);
      Settings._editingPlatformId = platformId;
      Settings._platformTestPassed = true;

      el('platformModalTitle').textContent = '플랫폼 계정 수정';
      var sel = el('modalPlatformType');
      sel.value    = data.platform_type;
      sel.disabled = true;

      Settings._renderCredentialsForm(data.platform_type, data.credential_keys || [], data);

      // 배송설정은 [설정 > 배송 정보] 탭에서 관리 — 이 모달에서는 항상 숨김
      var dsForm = el('deliverySettingsForm');
      if (dsForm) dsForm.style.display = 'none';
      if (el('modalAccountName')) el('modalAccountName').value = data.account_name || '';
      el('platformModal').dataset.role = role;
      if (el('savePlatformBtn')) el('savePlatformBtn').disabled = false;
      el('platformModal').style.display = 'flex';
    } catch (err) { _toast(err.message, 'error'); }
  },

  _renderCredentialsForm(platformType, knownKeys, accountData) {
    knownKeys = knownKeys || [];
    accountData = accountData || null;
    var container = el('credentialsForm');
    if (!container) return;
    var fields = PLATFORM_CREDENTIAL_FIELDS[platformType];
    if (!fields) {
      container.innerHTML = '<p class="text-muted" style="font-size:.85rem">플랫폼을 선택하면 입력 필드가 표시됩니다.</p>';
      return;
    }
    // ── 플랫폼별 안내 박스 ────────────────────────────────────────
    var PLATFORM_GUIDES = {
      coupang: {
        icon: '📦', title: '쿠팡 Seller Open API 연동 필수 항목',
        lines: [
          '⚠️ <strong>반드시 쿠팡 Wing(셀러 센터)에서 발급한 API 키를 사용하세요.</strong>',
          '쿠팡 파트너스(제휴 마케팅) 키와 <strong>다릅니다!</strong>',
          '<strong>Access Key / Secret Key 발급 경로</strong>:<br>&nbsp;&nbsp;→ <a href="https://wing.coupang.com" target="_blank" style="color:var(--accent-primary)">wing.coupang.com</a> 로그인 → 판매자서비스 → Open API → API 키 발급',
          '<strong>업체코드 (Vendor ID)</strong>: A로 시작하는 코드 (예: A01684634)<br>&nbsp;&nbsp;→ Wing → 마이페이지 → 판매자 정보에서 확인',
          '<strong>쿠팡 로그인 ID는 입력 불필요</strong> (API에서 사용하지 않습니다)',
        ],
        link: { href: 'https://wing.coupang.com', text: '쿠팡 Wing 셀러 센터 →' },
      },
      smartstore: {
        icon: '🟢', title: '스마트스토어 API 연동 필수 항목',
        lines: [
          '<strong>Client ID / Client Secret</strong>: 네이버 커머스 API → 애플리케이션 등록 후 발급',
          '네이버 커머스 API 센터 (https://api.commerce.naver.com) 에서 발급',
          '애플리케이션 권한: 주문조회, 배송, 상품 관리 권한 모두 체크',
        ],
        link: { href: 'https://api.commerce.naver.com', text: '네이버 커머스 API 센터 →' },
      },
      toss: {
        icon: '💙', title: '토스쇼핑 API 연동 필수 항목',
        lines: [
          '<strong>API Key / 판매자 ID</strong>: 토스쇼핑 파트너 센터에서 발급',
          '토스쇼핑 파트너 센터(https://partner.shopping.toss.im) → 설정 → API 키 관리',
        ],
        link: { href: 'https://partner.shopping.toss.im', text: '토스쇼핑 파트너 센터 →' },
      },
      ownerclan: {
        icon: '🏭', title: '오너클랜 로그인 정보 입력',
        lines: [
          '오너클랜 사이트 로그인 <strong>아이디와 비밀번호</strong>를 그대로 입력하세요.',
          '별도 API Key 발급 없이 로그인 정보로 JWT 토큰을 자동 발급합니다.',
        ],
        link: { href: 'https://ownerclan.com', text: '오너클랜 바로가기 →' },
      },
      domaemae: {
        icon: '🏬', title: '도매매 API 연동 필수 항목',
        lines: [
          '<strong>API Key / 회원 ID</strong>: 도매매(https://www.domaemae.co.kr) → 마이페이지 → Open API',
          '도매매 회원가입 및 사업자 인증 후 API 키 발급 가능',
        ],
        link: { href: 'https://www.domaemae.co.kr', text: '도매매 바로가기 →' },
      },
      gmarket: {
        icon: '🛒', title: 'G마켓/옥션 API 연동 필수 항목',
        lines: [
          '<strong>로그인 ID / 비밀번호</strong>: G마켓 셀러 계정 정보를 그대로 사용',
          '옥션과 G마켓은 하나의 계정으로 통합 운영 가능 (이베이코리아)',
          '주의: G마켓 Open API는 현재 직접 API 연동 방식은 제한적입니다',
        ],
        link: null,
      },
    };

    var guide = PLATFORM_GUIDES[platformType];
    var infoHtml = '';
    if (guide) {
      var linesHtml = guide.lines.map(function(l) { return '• ' + l; }).join('<br>');
      var linkHtml  = guide.link
        ? '<br><a href="' + guide.link.href + '" target="_blank" rel="noopener" style="color:var(--accent-primary)">' + guide.link.text + '</a>'
        : '';
      infoHtml = '<div style="background:rgba(79,142,247,0.08);border:1px solid rgba(79,142,247,0.25);border-radius:6px;padding:10px 12px;margin-bottom:12px;font-size:12px;line-height:1.7">' +
        '<strong>' + guide.icon + ' ' + guide.title + '</strong><br>' +
        linesHtml + linkHtml +
      '</div>';
    }

    var isEditing = (knownKeys && knownKeys.length > 0);
    var revealBtn = isEditing
      ? '<div style="margin-bottom:8px;text-align:right">' +
        '<button type="button" class="btn btn-xs btn-ghost" onclick="Settings.revealCredentials()">' +
        '🔓 현재 저장된 값 확인 (비밀번호 필요)</button></div>'
      : '';

    container.innerHTML = infoHtml + revealBtn + fields.map(function(f) {
      var placeholder = knownKeys.includes(f.key)
        ? '변경 시에만 입력 (빈칸이면 유지, 현재 값은 위 버튼으로 확인)'
        : (f.placeholder || f.label);
      var req = f.required ? ' <span class="required">*</span>' : '';
      return '<div class="form-group">' +
        '<label class="form-label">' + f.label + req + '</label>' +
        '<input type="' + f.type + '" class="form-input cred-field" data-key="' + f.key + '" placeholder="' + placeholder + '" autocomplete="off">' +
      '</div>';
    }).join('');

    if (platformType === 'smartstore') {
      var ds = (accountData && accountData.delivery_settings) ? accountData.delivery_settings : {};
      var phoneVal = _escapeAttr((ds && ds.customer_service_phone) ? ds.customer_service_phone : '');
      container.innerHTML += '<div class="form-group">' +
        '<label class="form-label">A/S·고객센터 전화번호 <span style="font-size:11px;color:var(--text-muted)">(스마트스토어 상품등록 시 사용)</span></label>' +
        '<input type="text" class="form-input" id="ss_customer_service_phone" placeholder="예: 010-8559-2062, 02-1234-5678, 1588-0000" autocomplete="off" value="' + phoneVal + '">' +
        '<small class="form-hint">하이픈 포함 · 이 계정에 한 번만 저장하면 이후 상품 등록에 그대로 쓰입니다.</small>' +
      '</div>';
    }
  },

  _collectCredentials() {
    var creds = {};
    var missing = false;
    document.querySelectorAll('#credentialsForm .cred-field').forEach(function(inp) {
      var key = inp.dataset.key;
      var val = inp.value.trim();
      if (val) creds[key] = val;
      if (!Settings._editingPlatformId && !val && inp.closest('.form-group').querySelector('.required')) {
        inp.style.borderColor = 'var(--accent-danger)';
        missing = true;
      }
    });
    if (missing) { _toast('필수 인증 정보를 입력하세요.', 'error'); return null; }
    return creds;
  },

  async _testNewPlatformConnection() {
    var platformType = el('modalPlatformType') && el('modalPlatformType').value;
    if (!platformType) { _toast('플랫폼을 먼저 선택하세요.', 'error'); return; }

    var creds = this._collectCredentials();
    if (!creds) return; // _collectCredentials가 오류 표시 처리

    var btn = el('testConnectionBtn');
    var saveBtn = el('savePlatformBtn');
    var origText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '테스트 중…'; }
    if (saveBtn) saveBtn.disabled = true;
    this._platformTestPassed = false;

    try {
      var res = await request('POST', '/platforms/test-raw', {
        platform_type: platformType,
        credentials: creds,
      });
      if (res && res.connected) {
        this._platformTestPassed = true;
        if (saveBtn) saveBtn.disabled = false;
        _toast('✓ ' + (res.message || '연결 성공'), 'success');
      } else {
        _toast('✗ ' + (res && res.message ? res.message : '연결 실패'), 'error');
      }
    } catch (e) {
      _toast('테스트 오류: ' + (e.message || ''), 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = origText; }
    }
  },

  closePlatformModal() {
    el('platformModal').style.display = 'none';
    this._editingPlatformId = null;
    this._platformTestPassed = false;
  },

  // ── 저장된 자격증명 현재 값 확인 (비밀번호 입력 후 조회) ──────────────
  async revealCredentials() {
    var id = this._editingPlatformId;
    if (!id) { _toast('수정 모드에서만 사용할 수 있습니다.', 'error'); return; }

    // 간단 패스워드 확인 팝업
    var pw = window.prompt('현재 로그인 비밀번호를 입력하면 자격증명을 표시합니다.\n(보안을 위해 확인 후 즉시 화면에서 제거됩니다)', '');
    if (pw === null) return; // 취소

    try {
      // 비밀번호로 현재 로그인 검증
      var me = await request('GET', '/auth/me');
      if (!me) { _toast('세션이 만료되었습니다.', 'error'); return; }

      // 비밀번호 검증 (로그인 API 재사용)
      var loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: me.username, password: pw }),
      });
      if (!loginRes.ok) { _toast('비밀번호가 틀렸습니다.', 'error'); return; }

      // 자격증명 조회
      var credData = await request('GET', '/platforms/' + id + '/credentials');
      if (!credData || !credData.credentials) { _toast('자격증명을 가져올 수 없습니다.', 'error'); return; }

      var creds = credData.credentials;
      var fields = PLATFORM_CREDENTIAL_FIELDS[el('modalPlatformType').value] || [];
      var html = '<div style="background:rgba(0,0,0,0.3);border:1px solid var(--border-default);border-radius:6px;padding:12px;margin-bottom:12px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
        '<span style="font-size:13px;font-weight:600;color:var(--accent-warning)">🔓 현재 저장된 자격증명 (30초 후 자동 숨김)</span>' +
        '<button type="button" class="btn btn-xs btn-ghost" onclick="this.closest(\'div[id]\') && (document.getElementById(\'cred-reveal-box\').remove())">닫기</button>' +
        '</div>';

      fields.forEach(function(f) {
        var val = creds[f.key] || '(없음)';
        var isSecret = f.type === 'password';
        html += '<div style="margin-bottom:6px;font-size:12px">' +
          '<span style="color:var(--text-muted);min-width:120px;display:inline-block">' + f.label + ':</span> ';
        if (isSecret) {
          html += '<span id="cred-val-' + f.key + '" data-hidden="1" style="font-family:monospace;cursor:pointer;color:var(--text-secondary)" ' +
            'onclick="var s=this;s.dataset.hidden=s.dataset.hidden==\'1\'?\'0\':\'1\';s.textContent=s.dataset.hidden==\'1\'?\'●●●●●●●●●●\':\'' + val.replace(/'/g, "\\'") + '\'">' +
            '●●●●●●●●●●</span> <span style="color:var(--text-muted);font-size:11px">(클릭하면 표시)</span>';
        } else {
          html += '<span style="font-family:monospace;color:var(--text-primary)">' + (typeof escapeHtml === 'function' ? escapeHtml(val) : val) + '</span>';
        }
        html += '</div>';
      });

      html += '</div>';
      var box = document.createElement('div');
      box.id = 'cred-reveal-box';
      box.innerHTML = html;
      var form = el('credentialsForm');
      form.insertBefore(box, form.firstChild);

      // 30초 후 자동 제거
      setTimeout(function() { var b = document.getElementById('cred-reveal-box'); if(b) b.remove(); }, 30000);
      _toast('30초 후 자동으로 숨겨집니다.', 'info');

    } catch (e) {
      _toast('오류: ' + (e.message || ''), 'error');
    }
  },

  async savePlatform() {
    if (this._savingPlatform) return;
    var platformType = el('modalPlatformType') && el('modalPlatformType').value;
    if (!platformType) { _toast('플랫폼을 선택하세요.', 'error'); return; }

    var credentials = this._collectCredentials();
    if (credentials === null) return;

    var accountName = (el('modalAccountName') && el('modalAccountName').value.trim()) || PLATFORM_LABELS[platformType] || platformType;
    var role = el('platformModal').dataset.role || (MARKET_PLATFORMS.includes(platformType) ? 'market' : 'wholesale');

    var delivery_settings = null;
    if (MARKET_PLATFORMS.includes(platformType)) {
      var prevDs = {};
      if (this._editingPlatformId) {
        try {
          var curAcc = await request('GET', '/platforms/' + this._editingPlatformId);
          prevDs = curAcc.delivery_settings || {};
        } catch (_) {}
      }
      delivery_settings = Object.assign({}, prevDs);
      ['dispatch_name','dispatch_address','dispatch_zip',
       'return_name','return_address','return_zip',
       'courier','shipping_fee','free_threshold','island_surcharge'].forEach(function(k) {
        var e = el('ds_' + k);
        if (e) delivery_settings[k] = e.value.trim() || '';
      });
      var cb = el('ds_bundle_shipping');
      if (cb) delivery_settings.bundle_shipping = cb.checked;
      if (platformType === 'smartstore') {
        var phIn = el('ss_customer_service_phone');
        var phv = (phIn && phIn.value.trim()) || '';
        if (phv) {
          if (!validateKrPhone(phv)) {
            _toast('고객센터 전화: 02-1234-5678, 010-1234-5678, 1588-0000 형식(하이픈 포함)', 'error');
            saveBtn.disabled = false;
            this._savingPlatform = false;
            return;
          }
          delivery_settings.customer_service_phone = phv;
        }
      }
    }

    var saveBtn = el('savePlatformBtn');
    saveBtn.disabled = true;
    this._savingPlatform = true;
    try {
      if (this._editingPlatformId) {
        var patchBody = {};
        if (Object.keys(credentials).length) patchBody.credentials = credentials;
        if (delivery_settings) patchBody.delivery_settings = delivery_settings;
        if (el('modalAccountName') && el('modalAccountName').value.trim()) patchBody.account_name = el('modalAccountName').value.trim();
        await request('PATCH', '/platforms/' + this._editingPlatformId, patchBody);
        _toast('플랫폼 계정이 수정되었습니다.', 'success');
      } else {
        var body = { platform_type: platformType, account_name: accountName, role: role, credentials: credentials };
        if (delivery_settings) body.delivery_settings = delivery_settings;
        await request('POST', '/platforms', body);
        _toast('플랫폼 계정이 추가되었습니다.', 'success');
      }
      this.closePlatformModal();
      await this.loadPlatforms();
    } catch (err) {
      _toast(err.message, 'error');
      saveBtn.disabled = false;
    } finally {
      this._savingPlatform = false;
    }
  },

  async testPlatform(platformId) {
    try {
      var res = await request('POST', '/platforms/' + platformId + '/test');
      if (res.connected) {
        _toast('✅ 연결 성공: ' + (res.message || '인증 완료'), 'success');
      } else {
        var msg = res.message || '연결 실패';
        // 에러 메시지를 알림창으로 표시 (자세한 내용 확인 가능)
        var detail = '❌ 연결 실패\n\n' + msg + '\n\n※ 자세한 내용은 [설정 > 플랫폼 계정 > 연결 테스트] 에서 확인';
        _toast('연결 실패 — ' + msg.substring(0, 60) + (msg.length > 60 ? '...' : ''), 'error');
        // 3초 후 상세 오류를 콘솔 및 간단한 팝업으로 표시
        setTimeout(function() {
          if (msg.length > 60) {
            var confirmed = window.confirm('[연결 실패 상세 메시지]\n\n' + msg + '\n\n확인을 누르면 닫힙니다.');
          }
        }, 300);
      }
      await this.loadPlatforms();
    } catch (err) { _toast(err.message || '연결 실패', 'error'); }
  },

  async deletePlatform(platformId) {
    if (!confirm('이 플랫폼 계정을 비활성화하시겠습니까?')) return;
    try {
      await request('DELETE', '/platforms/' + platformId);
      _toast('삭제되었습니다.', 'success');
      await this.loadPlatforms();
    } catch (err) { _toast(err.message, 'error'); }
  },

  async forceUnlockPlatform(platformId) {
    if (!confirm('이 계정의 잠금을 강제 해제하시겠습니까?\n현재 작업 중인 사용자와 충돌이 발생할 수 있습니다.')) return;
    try {
      await request('DELETE', '/platforms/' + platformId + '/lock');
      _toast('잠금이 해제되었습니다.', 'success');
      await this.loadPlatforms();
    } catch (err) { _toast(err.message, 'error'); }
  },

  _bindDbTab() {
    var allowed = ['owner', 'sysadmin'];
    var dbTabBtn = document.querySelector('.tabs [data-tab="dbconn"]');
    if (!allowed.includes(this._userType)) {
      if (dbTabBtn) {
        dbTabBtn.disabled = true;
        dbTabBtn.title = '관리자(Owner/SysAdmin)만 접근 가능합니다';
        dbTabBtn.style.opacity = '0.4';
        dbTabBtn.style.cursor  = 'not-allowed';
      }
      return;
    }
    this.loadDbConfig();
    el('testDbBtn') && el('testDbBtn').addEventListener('click', function() { Settings._testDbConnection(); });
    el('saveDbBtn') && el('saveDbBtn').addEventListener('click', function() { Settings._saveDbConfig(); });
  },

  async loadDbConfig() {
    try {
      var data = await request('GET', '/settings/db');
      if (!data) return;
      if (el('dbHost')) el('dbHost').value = data.db_host || '';
      if (el('dbPort')) el('dbPort').value = data.db_port || 3306;
      if (el('dbName')) el('dbName').value = data.db_name || '';
      if (el('dbUser')) el('dbUser').value = data.db_user || '';
      if (data.db_password_set && el('dbPassword')) el('dbPassword').placeholder = '●●●●●●●● (저장됨 — 변경 시에만 입력)';
      if (el('dbConnStatus'))     el('dbConnStatus').textContent     = data.status  || '—';
      if (el('dbConnActiveName')) el('dbConnActiveName').textContent = data.db_name || '—';
    } catch (_) {}
  },

  async _testDbConnection() {
    var resultEl = el('dbTestResult');
    if (resultEl) { resultEl.textContent = '⏳ 연결 테스트 중...'; resultEl.style.color = 'var(--accent-warning)'; }
    var payload = {
      db_host: el('dbHost') && el('dbHost').value.trim(),
      db_port: parseInt(el('dbPort') && el('dbPort').value) || 3306,
      db_name: el('dbName') && el('dbName').value.trim(),
      db_user: el('dbUser') && el('dbUser').value.trim(),
      db_password: el('dbPassword') && el('dbPassword').value || '',
    };
    try {
      var res = await request('POST', '/settings/db/test', payload);
      if (resultEl) {
        resultEl.textContent = res.ok ? '✅ 연결 성공' : ('❌ ' + (res.message || '연결 실패'));
        resultEl.style.color = res.ok ? 'var(--accent-success)' : 'var(--accent-danger)';
      }
    } catch (err) {
      if (resultEl) { resultEl.textContent = '❌ ' + err.message; resultEl.style.color = 'var(--accent-danger)'; }
    }
  },

  async _saveDbConfig() {
    var pw = el('dbPassword') && el('dbPassword').value;
    var payload = {
      db_host: el('dbHost') && el('dbHost').value.trim(),
      db_port: parseInt(el('dbPort') && el('dbPort').value) || 3306,
      db_name: el('dbName') && el('dbName').value.trim(),
      db_user: el('dbUser') && el('dbUser').value.trim(),
    };
    if (pw) payload.db_password = pw;
    try {
      await request('PUT', '/settings/db', payload);
      _toast('DB 설정이 저장되었습니다. 서버 재시작 후 적용됩니다.', 'success');
    } catch (err) { _toast('저장 실패: ' + err.message, 'error'); }
  },

  _bindNotifications() {
    el('saveNotifBtn')    && el('saveNotifBtn').addEventListener('click',    function() { Settings.saveNotifications(); });
    el('markAllReadBtn2') && el('markAllReadBtn2').addEventListener('click', function() { Settings._markAllRead(); });
  },

  async loadNotifications() {
    try {
      var data = await request('GET', '/settings/notifications');
      var map = { notifOrderAlert: 'order_alert', notifStockAlert: 'stock_alert', notifPriceAlert: 'price_alert', notifApiError: 'error_alert' };
      Object.entries(map).forEach(function(kv) {
        var cb = el(kv[0]);
        if (cb && data[kv[1]] !== undefined) cb.checked = !!data[kv[1]];
      });
      if (el('notifEmailEnabled')) el('notifEmailEnabled').checked = !!data.email_enabled;
      if (el('notifEmailAddress')) el('notifEmailAddress').value   = data.email_address || '';
    } catch (_) {}

    try {
      var hist = await request('GET', '/notifications?limit=20');
      var rows = hist.notifications || hist.items || [];
      var unread = rows.filter(function(r) { return !r.is_read; }).length;
      if (el('unreadCount')) el('unreadCount').textContent = unread;
      var tbody = el('notifHistoryTbody');
      if (tbody) {
        if (!rows.length) {
          tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">알림 없음</td></tr>';
        } else {
          tbody.innerHTML = rows.map(function(r) {
            return '<tr>' +
              '<td>' + (r.notification_type || '—') + '</td>' +
              '<td>' + (r.title || '—') + '</td>' +
              '<td>' + (r.message || '—') + '</td>' +
              '<td>' + formatDT(r.created_at) + '</td>' +
              '<td><span class="badge ' + (r.is_read ? 'badge-default' : 'badge-info') + '">' + (r.is_read ? '읽음' : '안읽음') + '</span></td>' +
            '</tr>';
          }).join('');
        }
      }
    } catch (_) {}
  },

  async saveNotifications() {
    var body = {
      order_alert:   el('notifOrderAlert')  ? el('notifOrderAlert').checked  : true,
      stock_alert:   el('notifStockAlert')  ? el('notifStockAlert').checked  : true,
      price_alert:   el('notifPriceAlert')  ? el('notifPriceAlert').checked  : true,
      error_alert:   el('notifApiError')    ? el('notifApiError').checked    : true,
      email_enabled: el('notifEmailEnabled') ? el('notifEmailEnabled').checked : false,
      email_address: el('notifEmailAddress') ? el('notifEmailAddress').value.trim() : '',
    };
    try {
      await request('PUT', '/settings/notifications', body);
      _toast('알림 설정이 저장되었습니다.', 'success');
    } catch (err) { _toast(err.message, 'error'); }
  },

  async _markAllRead() {
    try {
      await request('POST', '/notifications/read-all');
      await this.loadNotifications();
      _toast('모두 읽음 처리되었습니다.', 'success');
    } catch (_) {}
  },

  async loadUiSettings() {
    try {
      var data = await request('GET', '/settings/ui');
      var s = data.settings || data;
      if (s.font_size) {
        var slider = el('fontSizeSlider');
        if (slider) {
          slider.value = s.font_size;
          if (el('fontSizePreview')) el('fontSizePreview').textContent = s.font_size;
        }
        document.documentElement.style.setProperty('--font-size-base', s.font_size + 'px');
      }
      if (s.accent_color) {
        var picker = el('accentColorPicker');
        if (picker) picker.value = s.accent_color;
        if (el('accentColorHex')) el('accentColorHex').textContent = s.accent_color;
        document.documentElement.style.setProperty('--accent-primary', s.accent_color);
      }
      if (s.sidebar_default  && el('sidebarDefault'))  el('sidebarDefault').value  = s.sidebar_default;
      if (s.table_row_height && el('tableRowHeight'))  el('tableRowHeight').value  = s.table_row_height;
    } catch (_) {}
  },

  _bindUiSettings() {
    var slider = el('fontSizeSlider');
    slider && slider.addEventListener('input', function() {
      if (el('fontSizePreview')) el('fontSizePreview').textContent = slider.value;
      document.documentElement.style.setProperty('--font-size-base', slider.value + 'px');
    });

    var picker = el('accentColorPicker');
    picker && picker.addEventListener('input', function() {
      if (el('accentColorHex')) el('accentColorHex').textContent = picker.value;
      document.documentElement.style.setProperty('--accent-primary', picker.value);
    });

    el('saveUIBtn') && el('saveUIBtn').addEventListener('click', async function() {
      var body = {
        font_size:        parseInt((el('fontSizeSlider')  && el('fontSizeSlider').value)  || 14),
        accent_color:     (el('accentColorPicker') && el('accentColorPicker').value)       || '#4f8ef7',
        sidebar_default:  (el('sidebarDefault')    && el('sidebarDefault').value)          || 'expanded',
        table_row_height: (el('tableRowHeight')    && el('tableRowHeight').value)          || 'normal',
      };
      try {
        await request('PUT', '/settings/ui', body);
        _toast('UI 설정이 저장되었습니다.', 'success');
      } catch (err) { _toast(err.message, 'error'); }
    });

    el('resetUIBtn') && el('resetUIBtn').addEventListener('click', async function() {
      try {
        await request('PUT', '/settings/ui', { font_size: 14, accent_color: '#4f8ef7', sidebar_default: 'expanded', table_row_height: 'normal' });
        document.documentElement.style.setProperty('--font-size-base', '14px');
        document.documentElement.style.setProperty('--accent-primary', '#4f8ef7');
        if (el('fontSizeSlider'))    el('fontSizeSlider').value    = 14;
        if (el('fontSizePreview'))   el('fontSizePreview').textContent = 14;
        if (el('accentColorPicker')) el('accentColorPicker').value = '#4f8ef7';
        if (el('accentColorHex'))    el('accentColorHex').textContent  = '#4f8ef7';
        _toast('기본값으로 초기화되었습니다.', 'success');
      } catch (err) { _toast(err.message, 'error'); }
    });
  },

  _bindSecurity() {
    el('changePasswordBtn') && el('changePasswordBtn').addEventListener('click', async function() {
      var cur  = el('currentPassword') && el('currentPassword').value;
      var nw   = el('newPassword')     && el('newPassword').value;
      var conf = el('confirmPassword') && el('confirmPassword').value;
      if (!cur || !nw)  { _toast('비밀번호를 입력하세요.', 'error'); return; }
      if (nw !== conf)  { _toast('새 비밀번호가 일치하지 않습니다.', 'error'); return; }
      if (nw.length < 8) { _toast('비밀번호는 최소 8자 이상이어야 합니다.', 'error'); return; }
      try {
        await request('POST', '/settings/password', { current_password: cur, new_password: nw });
        _toast('비밀번호가 변경되었습니다.', 'success');
        ['currentPassword','newPassword','confirmPassword'].forEach(function(id) { var e=el(id); if(e) e.value=''; });
      } catch (err) { _toast(err.message, 'error'); }
    });

    el('terminateAllSessionsBtn') && el('terminateAllSessionsBtn').addEventListener('click', async function() {
      if (!confirm('다른 모든 세션을 종료하시겠습니까?')) return;
      try {
        await request('DELETE', '/settings/sessions');
        _toast('모든 세션이 종료되었습니다.', 'success');
        await Settings.loadSessions();
      } catch (err) { _toast(err.message, 'error'); }
    });
  },

  async loadSessions() {
    try {
      var data = await request('GET', '/settings/sessions');
      var sessions = data.sessions || [];
      var tbody = el('sessionsTbody');
      if (!tbody) return;
      if (!sessions.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">세션 정보 없음</td></tr>';
        return;
      }
      tbody.innerHTML = sessions.map(function(s) {
        var action = s.is_current
          ? '<span class="badge badge-success">현재</span>'
          : '<button class="btn btn-xs btn-danger" onclick="Settings.terminateSession(' + s.id + ')">종료</button>';
        return '<tr><td>' + (s.ip_address||'—') + '</td><td>' + (s.user_agent||'—') + '</td><td>' + formatDT(s.created_at) + '</td><td>' + formatDT(s.expires_at) + '</td><td>' + action + '</td></tr>';
      }).join('');
    } catch (_) {}
  },

  async terminateSession(sessionId) {
    if (!confirm('해당 세션을 종료하시겠습니까?')) return;
    try {
      await request('DELETE', '/settings/sessions/' + sessionId);
      _toast('세션이 종료되었습니다.', 'success');
      await this.loadSessions();
    } catch (err) { _toast(err.message, 'error'); }
  },

  _bindBackup() {
    el('backupSettingsBtn') && el('backupSettingsBtn').addEventListener('click', function() {
      var a = document.createElement('a');
      a.href = '/api/v1/settings/backup/download';
      a.download = '';
      a.click();
    });

    el('restoreFile') && el('restoreFile').addEventListener('change', function(e) {
      if (el('restoreBtn')) el('restoreBtn').disabled = !e.target.files.length;
    });

    el('restoreBtn') && el('restoreBtn').addEventListener('click', async function() {
      var file = el('restoreFile') && el('restoreFile').files[0];
      if (!file) return;
      if (!confirm('복원하면 현재 모든 데이터가 백업 파일로 덮어씌워집니다.\n계속하시겠습니까?')) return;
      var btn = el('restoreBtn');
      btn.disabled = true;
      btn.textContent = '복원 중...';
      try {
        var text = await file.text();
        await request('POST', '/settings/backup/restore', JSON.parse(text));
        _toast('복원 완료. 앱을 재시작하면 완전히 반영됩니다.', 'success');
      } catch (err) {
        _toast('복원 실패: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = '복원 실행';
      }
    });
  },
};

document.addEventListener('DOMContentLoaded', async function() {
  if (typeof initCommonLayout === 'function') initCommonLayout();
  await Settings.init();
});
