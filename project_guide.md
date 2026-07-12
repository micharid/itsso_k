# 위탁판매 자동화 시스템 설계서 (Admin Tool)

> python(django) + SQLAlchemy + PostgreSQL + celery / Nginx + Ubuntu(Cafe24)
> 내부 관리자용 어드민 툴 · RBAC 기반 · 다중 마켓/사입처 연동

---

## 1. 전체 아키텍처 요약

이 시스템의 핵심 설계 원칙은 **"사입처 원본 상품(source_product)"과 "마켓별 등록 상품(listing)"을 물리적으로 분리**하는 것이다. 하나의 원본 상품이 쿠팡·스마트스토어·11번가에 각각 다른 판매가·옵션·노출상태로 등록되기 때문에, 원본은 재고/원가의 단일 진실 공급원(Single Source of Truth)으로 두고, 각 마켓 등록건은 원본을 참조하는 1:N 구조로 뽑아낸다. 이렇게 하면 사입처 재고가 0이 될 때 연결된 모든 마켓 listing을 한 번에 품절 처리하는 배치가 단순해진다.

주문 쪽은 **공통 주문 테이블(orders)로 통합하되, 마켓이 내려준 원본 JSON을 `raw_payload`(JSONB)에 그대로 보존**한다. 마켓마다 주문 포맷·정산 구조가 달라서, 정규화된 공통 컬럼으로는 정보 손실이 나기 때문이다. 조회·집계는 정규화 컬럼으로 하고, 분쟁·디버깅·마켓 스펙 변경 대응은 raw_payload로 한다. APScheduler가 주기적으로 (1) 마켓sㅇㅁ 주문 수집 (2) 사입처 재고 동기화 (3) 가격 동기화 배치를 돌리고, 모든 동기화 결과는 `sync_logs`에 남겨 실패 추적이 가능하게 한다. 대시보드·주문 리스트처럼 조회가 빈번한 화면은 실시간 집계 대신 `dashboard_daily_stats` 같은 비정규화 캐시 테이블을 배치로 갱신해 부하를 낮춘다.

---

## 2. 관리자 페이지 메뉴/화면 구조

> 권한 표기: 🔴 관리자 전용 / 🟢 직원 접근 가능

```
📊 대시보드                                              🟢
│
├─ 📦 상품 관리
│   ├─ 사입처 상품 수집 (소싱)                            🟢
│   ├─ 원본 상품 목록 (재고/원가 마스터)                   🟢
│   ├─ 마켓 등록 상품 (listing 관리)                      🟢
│   └─ 마진 계산 / 가격 정책                              🔴
│
├─ 🔗 마켓플레이스 연동
│   ├─ 플랫폼 계정 연결 상태 (API 연결현황)                🔴
│   ├─ 상품 매핑 관리 (원본 ↔ 마켓상품 매핑)              🟢
│   └─ 등록/수정 이력                                    🟢
│
├─ 🛒 주문 관리
│   ├─ 통합 주문 조회 (마켓 전체)                         🟢
│   ├─ 발주 관리 (사입처 발주 상태)                       🟢
│   ├─ 배송/송장 관리                                    🟢
│   └─ 취소/반품/CS                                      🟢
│
├─ 🔄 동기화 관리
│   ├─ 재고 동기화 로그                                  🟢
│   ├─ 가격 동기화 로그                                  🟢
│   └─ 수동 동기화 실행                                  🔴
│
├─ 💰 정산/매출
│   ├─ 매출 리포트 (기간/마켓별)                          🔴
│   ├─ 플랫폼 수수료 관리                                🔴
│   └─ 마진 리포트 (원가 대비 순익)                       🔴
│
├─ 👤 사용자/권한                                        🔴
│   ├─ 계정 관리
│   ├─ 역할/권한 설정 (RBAC)
│   └─ 접근 로그
│
└─ ⚙️ 시스템 설정                                        🔴
    ├─ API 키 관리 (플랫폼 인증정보)
    ├─ 스케줄러 작업 상태
    └─ 배치 실행 로그
```

### 화면별 상세

| 메뉴 | 화면 목적 | 핵심 기능 | 권한 |
|---|---|---|---|
| **대시보드** | 오늘/기간 매출·주문·품절 위험 재고 요약 | 카드형 지표, 마켓별 매출 차트, 발주 대기 건수, 품절임박 알림 | 🟢 |
| **사입처 상품 수집** | 오너클랜 등에서 상품 크롤링/API 수집 | 카테고리 필터 수집, 수집 상품 미리보기, 원본 등록 | 🟢 |
| **원본 상품 목록** | 재고·원가 마스터 관리 | 리스트/필터/상세, 재고 수동 조정, 마켓 등록 여부 뱃지 | 🟢 |
| **마켓 등록 상품** | 마켓별 listing 관리 | 마켓별 판매가/노출상태 일괄수정, 품절 일괄처리, 재등록 | 🟢 |
| **마진 계산/가격정책** | 원가 기반 자동 판매가 산정 | 마진율 룰 설정, 수수료 반영 최소판매가 계산 | 🔴 |
| **플랫폼 계정 연결** | API 연결 상태 모니터링 | 계정별 토큰 유효성, 연결 테스트, 만료 알림 | 🔴 |
| **상품 매핑** | 원본↔마켓상품 매핑 확인 | 매핑 안 된 상품 필터, 수동 매핑 | 🟢 |
| **통합 주문 조회** | 전 마켓 주문 한 화면 | 마켓/상태/기간 필터, 상세(raw 포함), 엑셀 다운로드 | 🟢 |
| **발주 관리** | 사입처 발주 진행 | 미발주 건 일괄 발주, 발주상태 추적 | 🟢 |
| **배송/송장** | 송장 등록·마켓 전송 | 송장 입력, 마켓 API로 배송정보 전송 | 🟢 |
| **재고/가격 동기화 로그** | 배치 성공/실패 추적 | 상태·마켓 필터, 실패 상세 에러, 재시도 | 🟢 |
| **수동 동기화 실행** | 배치 즉시 실행 | 대상 선택 후 강제 실행 | 🔴 |
| **매출/마진 리포트** | 수익성 분석 | 기간·마켓별 집계, 순마진, CSV 내보내기 | 🔴 |
| **수수료 관리** | 마켓 수수료율 등록 | 카테고리별 수수료율 CRUD | 🔴 |
| **사용자/권한** | 계정·RBAC 관리 | 계정 생성/비활성, 역할 부여, 접근 로그 | 🔴 |
| **시스템 설정** | API 키·스케줄러 | 인증정보 암호화 저장, 배치 주기 설정, 로그 조회 | 🔴 |

---

## 3. ERD (텍스트)

```
[users] ──< [user_roles] >── [roles] ──< [role_permissions] >── [permissions]
   │
   └──< [access_logs]

[platforms] ──< [platform_accounts] ──< [platform_credentials]
     │                   │
     │                   ├──< [listings]
     │                   ├──< [orders]
     │                   └──< [settlements]
     │
     └──< [platform_fees]

[source_products] ──< [source_product_options]
        │
        └──< [listings] ──< [listing_options]
                 │
                 └──< [order_items]

[orders] ──< [order_items] ──< [purchase_orders] ──< [shipments]
   │
   └── raw_payload (JSONB)

[sync_logs]  (독립 로그 테이블, platform_account_id 참조)
[dashboard_daily_stats]  (비정규화 캐시)

관계 요약:
  source_product 1 ── N listing        (원본 1개 → 여러 마켓 등록)
  platform_account 1 ── N listing/order
  order 1 ── N order_item
  order_item 1 ── 1 purchase_order     (발주)
  purchase_order 1 ── N shipment
  user N ── N role N ── N permission    (RBAC)
```

---

## 4. 테이블별 상세 스키마

### 4.1 인증 / RBAC

#### `users`
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 로그인 ID |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt/argon2 해시 |
| name | VARCHAR(100) | NOT NULL | |
| is_active | BOOLEAN | DEFAULT true | 퇴사/정지 시 false |
| last_login_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

#### `roles`
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | SERIAL | PK | |
| code | VARCHAR(50) | UNIQUE, NOT NULL | `admin`, `staff` 등 |
| name | VARCHAR(100) | NOT NULL | 표시명 |
| description | TEXT | NULL | |

#### `permissions`
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | SERIAL | PK | |
| code | VARCHAR(100) | UNIQUE, NOT NULL | `order.read`, `settlement.write` 등 리소스.액션 형태 |
| description | TEXT | NULL | |

#### `user_roles` (N:N)
| 컬럼 | 타입 | 제약 |
|---|---|---|
| user_id | BIGINT | PK |
| role_id | INT | PK |

#### `role_permissions` (N:N)
| 컬럼 | 타입 | 제약 |
|---|---|---|
| role_id | INT | PK |
| permission_id | INT | PK |

#### `access_logs`
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| user_id | BIGINT | NULL | 로그인 실패 시 NULL 가능 |
| action | VARCHAR(100) | NOT NULL | `login`, `order.update` 등 |
| ip_address | INET | NULL | |
| user_agent | TEXT | NULL | |
| created_at | TIMESTAMPTZ | DEFAULT now(), **INDEX** | 로그 조회용 인덱스 |

> RBAC 확장성: 지금은 role 2개(admin/staff)면 충분하지만, permission을 `리소스.액션` 코드로 잘게 쪼개두면 나중에 "정산은 못 보지만 주문은 보는 파트타임" 같은 역할을 코드 수정 없이 DB에서 조합 가능하다.

---

### 4.2 플랫폼 / 인증정보

#### `platforms` (마스터)
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | SERIAL | PK | |
| code | VARCHAR(30) | UNIQUE, NOT NULL | `coupang`, `smartstore`, `gmarket`, `ownerclan` |
| name | VARCHAR(50) | NOT NULL | |
| type | VARCHAR(20) | NOT NULL | `market`(판매처) / `supplier`(사입처) |
| is_active | BOOLEAN | DEFAULT true | |

#### `platform_accounts`
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| platform_id | INT | NOT NULL | |
| account_name | VARCHAR(100) | NOT NULL | 스토어명/식별용 |
| status | VARCHAR(20) | DEFAULT 'active' | `active`/`expired`/`error` |
| last_synced_at | TIMESTAMPTZ | NULL | 마지막 동기화 시각 |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| | | UNIQUE(platform_id, account_name) | |

#### `platform_credentials` (⚠️ 보안 핵심)
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| platform_account_id | BIGINT | NOT NULL | |
| key_type | VARCHAR(30) | NOT NULL | `api_key`, `secret`, `access_token`, `refresh_token` |
| value_encrypted | BYTEA | NOT NULL | **평문 저장 금지** |
| expires_at | TIMESTAMPTZ | NULL | 토큰 만료 시각 |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

> **보안 코멘트:**
> 1. API 키/시크릿은 절대 평문 저장 금지. 앱 레벨에서 대칭키 암호화(예: `cryptography.Fernet`) 후 `value_encrypted`(BYTEA)에 저장.
> 2. 암호화 마스터키는 DB가 아니라 **서버 환경변수(.env, 파일권한 600)** 또는 별도 시크릿 매니저에 보관. DB가 통째로 유출돼도 키가 없으면 복호화 불가.
> 3. 로그/에러 출력에 복호화된 값이 찍히지 않게 주의. FastAPI 응답 모델에서 credential 필드는 아예 제외.

---

### 4.3 상품 (원본 ↔ 마켓 등록)

#### `source_products` (사입처 원본 = 재고/원가 마스터)
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| supplier_platform_id | INT | NOT NULL | 사입처 (오너클랜 등) |
| supplier_product_code | VARCHAR(100) | NOT NULL | 사입처 상품코드 |
| name | VARCHAR(500) | NOT NULL | |
| category | VARCHAR(100) | NULL, **INDEX** | |
| cost_price | INTEGER | NOT NULL | 원가(원 단위, 정수) |
| stock_qty | INTEGER | DEFAULT 0 | 사입처 재고 |
| status | VARCHAR(20) | DEFAULT 'active' | `active`/`soldout`/`discontinued` |
| raw_data | JSONB | NULL | 사입처 원본 응답 보존 |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |
| | | UNIQUE(supplier_platform_id, supplier_product_code) | 중복 수집 방지 |

> 💡 `cost_price`를 정수(원)로 두는 이유: 금액에 FLOAT 쓰면 반올림 오차 난다. 원 단위 정수 또는 `NUMERIC` 사용.

#### `source_product_options`
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| source_product_id | BIGINT | NOT NULL, **INDEX** | |
| option_name | VARCHAR(200) | NOT NULL | "색상:블랙 / 사이즈:L" |
| cost_price | INTEGER | NULL | 옵션별 추가원가 |
| stock_qty | INTEGER | DEFAULT 0 | |
| supplier_option_code | VARCHAR(100) | NULL | |

#### `listings` (마켓별 등록 상품 — 원본 1 : N)
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| source_product_id | BIGINT | NOT NULL, **INDEX** | 원본 참조 |
| platform_account_id | BIGINT | NOT NULL | 어느 마켓 계정에 등록 |
| market_product_id | VARCHAR(100) | NULL, **INDEX** | 마켓이 부여한 상품ID |
| sale_price | INTEGER | NOT NULL | 판매가 (마켓별 상이) |
| status | VARCHAR(20) | DEFAULT 'draft' | `draft`/`listed`/`soldout`/`suspended` |
| margin_rate | NUMERIC(5,2) | NULL | 마진율(%) 스냅샷 |
| listed_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |
| | | UNIQUE(platform_account_id, market_product_id) | |

#### `listing_options`
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| listing_id | BIGINT | NOT NULL, **INDEX** | |
| source_option_id | BIGINT | NULL | 원본 옵션 매핑 |
| market_option_id | VARCHAR(100) | NULL | 마켓 옵션ID |
| sale_price | INTEGER | NOT NULL | 옵션별 판매가 |

---

### 4.4 주문 / 발주 / 배송

#### `orders` (통합 주문)
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| platform_account_id | BIGINT | NOT NULL, **INDEX** | |
| market_order_no | VARCHAR(100) | NOT NULL, **INDEX** | 마켓 주문번호 |
| order_status | VARCHAR(30) | NOT NULL, **INDEX** | `new`/`paid`/`preparing`/`shipped`/`delivered`/`cancelled`/`returned` |
| buyer_name | VARCHAR(100) | NULL | |
| receiver_name | VARCHAR(100) | NULL | |
| receiver_phone | VARCHAR(30) | NULL | 🔒 개인정보 — 접근제어/마스킹 대상 |
| receiver_address | TEXT | NULL | 🔒 개인정보 |
| total_amount | INTEGER | NOT NULL | 주문 총액 |
| raw_payload | JSONB | NOT NULL | **마켓 원본 주문 데이터 전체 보존** |
| ordered_at | TIMESTAMPTZ | NOT NULL, **INDEX** | 주문 발생시각 |
| synced_at | TIMESTAMPTZ | DEFAULT now() | 수집 시각 |
| | | UNIQUE(platform_account_id, market_order_no) | 중복 수집 방지 |

> 💡 개인정보(수령인/연락처/주소)는 GDPR/개인정보보호법 대상. 배송 완료 후 일정 기간 지나면 마스킹/파기하는 배치도 나중에 고려. 지금은 컬럼에 🔒 표시만 해두고 접근 권한을 admin/staff로 제한.

#### `order_items`
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| order_id | BIGINT | NOT NULL, **INDEX** | |
| listing_id | BIGINT | NULL | 어느 등록상품 주문인지 |
| source_product_id | BIGINT | NULL | 발주 편의용 (비정규화 참조) |
| product_name | VARCHAR(500) | NOT NULL | 주문 시점 상품명 스냅샷 |
| option_name | VARCHAR(200) | NULL | |
| quantity | INTEGER | NOT NULL | |
| unit_sale_price | INTEGER | NOT NULL | 판매 단가(주문시점) |
| unit_cost_price | INTEGER | NULL | 원가 단가(주문시점 스냅샷) |

> 💡 `product_name`, `unit_cost_price`를 **주문 시점 스냅샷**으로 박아두는 이유: 나중에 원본 상품의 원가/이름이 바뀌어도 과거 주문의 마진 계산은 그때 값으로 정확히 유지돼야 하기 때문.

#### `purchase_orders` (사입처 발주)
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| order_item_id | BIGINT | NOT NULL, **INDEX** | |
| supplier_platform_id | INT | NOT NULL | |
| supplier_order_no | VARCHAR(100) | NULL | 사입처 발주번호 |
| status | VARCHAR(30) | DEFAULT 'pending', **INDEX** | `pending`/`ordered`/`shipped`/`failed` |
| ordered_at | TIMESTAMPTZ | NULL | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

#### `shipments` (배송/송장)
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| purchase_order_id | BIGINT | NOT NULL, **INDEX** | |
| courier_code | VARCHAR(30) | NULL | 택배사 코드 |
| tracking_no | VARCHAR(100) | NULL, **INDEX** | 송장번호 |
| status | VARCHAR(30) | DEFAULT 'ready' | `ready`/`shipped`/`delivered` |
| shipped_at | TIMESTAMPTZ | NULL | |
| sent_to_market | BOOLEAN | DEFAULT false | 마켓에 송장 전송 완료 여부 |

---

### 4.5 동기화 로그

#### `sync_logs`
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| job_type | VARCHAR(30) | NOT NULL, **INDEX** | `stock_sync`/`price_sync`/`order_collect` |
| platform_account_id | BIGINT | NULL | |
| status | VARCHAR(20) | NOT NULL | `success`/`partial`/`failed` |
| affected_count | INTEGER | DEFAULT 0 | 처리 건수 |
| error_message | TEXT | NULL | 실패 상세 |
| started_at | TIMESTAMPTZ | NOT NULL, **INDEX** | |
| finished_at | TIMESTAMPTZ | NULL | |

> 💡 로그 테이블은 계속 쌓이니 `started_at` 기준 파티셔닝 또는 오래된 로그 주기적 아카이빙을 나중에 고려.

---

### 4.6 정산 / 수수료 / 마진

#### `platform_fees` (수수료율 마스터)
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | SERIAL | PK | |
| platform_id | INT | NOT NULL | |
| category | VARCHAR(100) | NULL | 카테고리별 수수료 (NULL=기본) |
| fee_rate | NUMERIC(5,2) | NOT NULL | 수수료율(%) |
| effective_from | DATE | NOT NULL | 적용 시작일 |

#### `settlements` (마켓 정산 내역)
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| platform_account_id | BIGINT | NOT NULL | |
| period_start | DATE | NOT NULL | 정산 기간 |
| period_end | DATE | NOT NULL | |
| gross_sales | INTEGER | NOT NULL | 총 매출 |
| total_fees | INTEGER | NOT NULL | 총 수수료 |
| net_amount | INTEGER | NOT NULL | 정산 실수령액 |
| raw_payload | JSONB | NULL | 마켓 정산 원본 |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

---

### 4.7 비정규화 캐시 (조회 성능용)

#### `dashboard_daily_stats`
| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| stat_date | DATE | PK(복합) | 집계 일자 |
| platform_id | INT | PK(복합),  | |
| order_count | INTEGER | DEFAULT 0 | 주문 건수 |
| gross_sales | BIGINT | DEFAULT 0 | 매출액 |
| total_cost | BIGINT | DEFAULT 0 | 원가 합 |
| est_margin | BIGINT | DEFAULT 0 | 추정 마진 |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

> 💡 대시보드는 매번 orders 테이블을 GROUP BY 하면 데이터 쌓일수록 느려진다. APScheduler로 밤마다(또는 시간마다) 이 테이블을 갱신하고, 대시보드는 이 캐시만 읽는다. 주문 리스트는 캐시 대신 위 인덱스(platform_account_id, order_status, ordered_at) 조합으로 커버.

---

## 5. 설계 트레이드오프 / 대안

**① 원본-listing 분리 vs 단일 상품 테이블**
단일 테이블에 마켓별 컬럼을 다 넣으면 초기 개발은 빠르지만, 마켓이 추가될 때마다 컬럼이 늘고 NULL이 폭증한다. 분리 구조는 조인이 늘어나는 대신 마켓 추가가 데이터(row) 추가로 끝나 확장성이 압도적으로 좋다. → **분리 채택.**

**② 주문 raw_payload를 JSONB로 보존 vs 정규화만**
정규화만 하면 마켓이 안 주는 필드는 버려지고, 마켓이 스펙 바꾸면 대응이 늦다. JSONB 병행 저장은 용량을 조금 쓰지만 분쟁·디버깅·마이그레이션에서 생명줄이 된다. PostgreSQL JSONB는 인덱싱도 가능. → **병행 채택.**

**③ 금액을 INTEGER(원) vs NUMERIC vs FLOAT**
FLOAT는 절대 금지(부동소수점 오차). 원 단위 정수 INTEGER면 충분하고 연산도 빠르다. 소수점 정산이 생기면 그 컬럼만 NUMERIC으로. → **기본 INTEGER, 정산 세부는 NUMERIC.**

**④ 대시보드 실시간 집계 vs 캐시 테이블**
초기엔 데이터가 적어 실시간 GROUP BY로도 충분하다. 캐시 테이블은 "지금 당장" 필요하진 않으니, **일단 인덱스만 잘 걸어두고 데이터가 커지면 그때 캐시 배치 도입**하는 게 오버엔지니어링을 피하는 길이다. 스키마는 미리 잡아뒀으니 나중에 배치만 붙이면 됨.

**⑤ credential 암호화 방식**
DB 레벨 암호화(pgcrypto)도 있지만, 키가 DB 안에 있으면 DB 유출 시 무의미. **앱 레벨 암호화 + 키는 서버 환경변수**가 소규모에선 가장 현실적이고 안전하다.

---

## 6. 다음 단계 제안 (개발 순서)

1. **인증/RBAC + 플랫폼/credential** 먼저 (로그인 되고 API 키 저장돼야 나머지가 돌아감)
2. **source_products 수집** (오너클랜 API 하나부터)
3. **listings 등록** (마켓 1개, 예: 스마트스토어부터)
4. **orders 수집 배치** (APScheduler)
5. **발주/배송** → **정산/리포트** 순으로 확장

> 마켓 1개(스마트스토어) + 사입처 1개(오너클랜)로 **세로 슬라이스 완성** 후, 나머지 마켓을 가로로 붙이는 방식을 추천. 처음부터 4개 마켓 동시 연동은 디버깅 지옥.
