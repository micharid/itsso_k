# Dropshipping Backoffice Admin - 프로젝트 소개 및 가이드

본 문서는 프레젠테이션(PPT) 제작을 위한 슬라이드별 대본 및 가이드 텍스트입니다. 이 텍스트를 복사하여 PPT의 각 슬라이드에 붙여넣고, [이미지 삽입 가이드]에 맞춰 스크린샷이나 다이어그램을 배치하시면 됩니다.

---

## [Slide 1] 표지
* **제목:** 위탁판매(Dropshipping) 자동화 백오피스 구축 완료 보고
* **부제:** Django 기반 Admin UI 및 RESTful API 서버 구축
* **발표자/작성일:** (이름 및 날짜 입력)
* **[이미지 삽입 가이드]:** 프로젝트를 상징하는 세련된 배경 이미지 또는 로고 삽입

---

## [Slide 2] 프로젝트 개요 및 목표
* **프로젝트 목표:** 여러 마켓(스마트스토어, 쿠팡 등)과 사입처(오너클랜 등)를 통합 관리하는 중앙 집중형 관리자 시스템(Admin) 구축
* **주요 특징:**
  1. **단일 진실 공급원 (Single Source of Truth):** 사입처 원본 상품과 마켓별 등록 상품을 물리적으로 분리하여 재고/가격 변동 시 유연하게 대응
  2. **Raw 데이터 보존:** 마켓별로 상이한 주문/정산 스펙에 대응하기 위해 원본 JSON(JSONB) 데이터를 손실 없이 보존
  3. **No Foreign Key (FK):** 확장성과 분산 처리를 고려하여 물리적 FK 제약조건을 제거한 MSA 친화적 DB 설계
* **[이미지 삽입 가이드]:** 여러 마켓 아이콘(쿠팡, 스마트스토어 등)이 중앙의 데이터베이스(서버)로 모이는 개념도 삽입

---

## [Slide 3] 시스템 기술 스택 (Tech Stack)
* **Backend Framework:** Django, Django REST Framework (DRF)
* **Database:** PostgreSQL (JSONB 활용)
* **Deployment (예정):** Ubuntu (Cafe24), Nginx, Gunicorn
* **보안 환경:** `python-dotenv`를 활용한 `.env` 기반 환경변수 관리 (Git 추적 제외)
* **[이미지 삽입 가이드]:** Django, PostgreSQL, Nginx, Ubuntu 등의 로고 아이콘을 가로로 나열한 이미지

---

## [Slide 4] 1단계: 프로젝트 구조 및 환경 설정
* **내용:** 빠르고 안정적인 개발을 위해 Django 프레임워크를 기반으로 5개의 핵심 도메인 앱(App)으로 분리하여 설계했습니다.
* **주요 앱 구성:**
  * `accounts`: 사용자 정보, 역할(Role), 권한(Permission) 및 접속 로그
  * `platforms`: 마켓/사입처 플랫폼 정보, 계정 연동 및 API Key (암호화) 관리
  * `products`: 사입처 원본 상품 및 마켓 등록(Listing) 상품/마진 관리
  * `orders`: 통합 주문(Order), 발주(Purchase Order) 및 배송(Shipment) 관리
  * `logs`: 동기화 스케줄러 로그 및 대시보드 통계 전용 비정규화 테이블
* **[이미지 삽입 가이드]:** 코드 에디터(VSCode 등)에서 프로젝트 폴더 트리 구조(`accounts/`, `platforms/` 등)가 보이는 스크린샷

---

## [Slide 5] 2단계: 데이터베이스 및 모델 (No FK 설계)
* **내용:** `project_guide.md`의 요구사항에 맞춰 모든 테이블에서 `ForeignKey` 구문을 완전히 제거하고 `BigIntegerField` 등으로 관계를 논리적으로만 연결했습니다.
* **보안 모델링:**
  * `User` 모델을 Django의 인증(Auth) 시스템과 완벽히 연동 (`AbstractBaseUser` 상속)
  * `PlatformCredential` 테이블의 API 키 등은 외부 API 응답 시 블라인드 처리
* **[이미지 삽입 가이드]:** DBeaver나 pgAdmin 등에서 생성된 테이블 목록이나 논리적 ERD 다이어그램 캡처

---

## [Slide 6] 3단계: Django 기본 관리자(Admin) 페이지
* **내용:** 별도의 프론트엔드 개발 없이도 즉시 실무에 투입할 수 있는 완벽한 형태의 백오피스 웹사이트(Admin UI)를 구축했습니다.
* **기능 요약:**
  * 주문 내역 확인, 상품 정보 수정, 권한 설정 등을 마우스 클릭만으로 제어 가능
  * 리스트 필터링 및 검색 기능 내장
* **[이미지 삽입 가이드]:** 브라우저 주소창에 `http://localhost:8000/admin`을 띄워놓고 여러 테이블 목록이 보이는 Django 기본 어드민 로그인 직후 메인 스크린샷

---

## [Slide 7] 4단계: RESTful API 구성 (프론트엔드 연동)
* **내용:** 추후 React, Vue 등 현대적인 프론트엔드 프레임워크와 통신하기 위해 Django REST Framework(DRF)를 적용했습니다.
* **API 특징:**
  * 모든 데이터 모델에 대한 `ModelViewSet` 구성 완비
  * `/api/products/`, `/api/orders/` 등 직관적인 URL 라우팅
  * 민감 데이터(비밀번호, API 키)는 `Serializer`에서 `exclude` 처리하여 완벽한 보안 유지
  * 모든 API는 인증된(로그인한) 사용자만 접근 가능하도록 `IsAuthenticated` 적용
* **[이미지 삽입 가이드]:** Postman이나 웹 브라우저에서 `/api/products/`를 호출하여 JSON 데이터가 예쁘게 출력된 화면 스크린샷

---

## [Slide 8] 5단계: 프로덕션 배포 및 보안 준비
* **내용:** Cafe24 Ubuntu 서버에 배포하기 위한 인프라 설정을 완료했습니다.
* **세팅 내역:**
  * `DATABASES`를 SQLite에서 `postgresql` 엔진으로 교체 완료
  * 소스코드 내 하드코딩된 `SECRET_KEY`, `DB_PASSWORD` 등을 `.env` 파일로 분리
  * GitHub 등 외부에 환경변수가 유출되지 않도록 `.gitignore` 적용 및 `.env.example` 템플릿 제공
* **[이미지 삽입 가이드]:** `.env.example` 파일의 내부 내용 텍스트나 Nginx + Gunicorn 배포 흐름도

---

## [Slide 9] 향후 발전 방향 (Next Steps)
* **1. 외부 연동 로직 구현:** Celery 등을 활용하여 오너클랜 상품 API 크롤링 및 스마트스토어/쿠팡 상품 등록 배치 개발
* **2. 대시보드 통계 고도화:** `dashboard_daily_stats` 비정규화 테이블에 데이터를 밀어 넣는 야간 정산 배치 구현
* **3. 프론트엔드 커스텀 UI 개발:** 기본 Admin UI를 넘어, Vue.js 등을 활용한 사용자 친화적인 커스텀 대시보드 화면 연동
* **[이미지 삽입 가이드]:** 그래프나 차트가 예쁘게 그려진 대시보드 예시 이미지 (구글링된 샘플 이미지 등)

---

### [작성자 참고용 노트]
위의 마크다운 텍스트를 활용하시어 PPT 슬라이드의 뼈대를 잡으시면 됩니다. 각 장의 글머리 기호를 슬라이드의 본문 내용으로 채우고, 설명할 때의 대본으로도 활용해 보세요!