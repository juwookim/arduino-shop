# 아두이노 쇼핑몰 — 프로젝트 계획

## 1. 목표

아두이노 보드, 센서, 모듈, 부품, 키트를 판매하는 온라인 쇼핑몰.
일반 쇼핑몰 기능에 더해, 메이커가 부품을 고를 때 필요한 **스펙 정보 / 호환성 / 관련 부품 추천**을 잘 보여주는 것이 차별점.

## 2. 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js (App Router) + TypeScript | SSR로 상품 페이지 SEO, 프론트/API를 한 프로젝트에서 처리 |
| 스타일 | Tailwind CSS (+ shadcn/ui) | 빠른 UI 개발, 일관된 컴포넌트 |
| DB / 인증 / 스토리지 | Supabase (Postgres, Auth, Storage) | 이미 MCP 연결 설정됨, RLS로 권한 관리 |
| 장바구니 상태 | Zustand (+ localStorage) | 비로그인 장바구니, 로그인 시 DB와 병합 |
| 결제 | 토스페이먼츠 (테스트 모드부터) | 국내 결제수단 지원, 문서가 좋음 |
| 배포 | GitHub Pages (정적 내보내기) + Supabase Edge Function | 무료, 결제 승인처럼 시크릿이 필요한 부분만 Edge Function |

## 3. 상품 카테고리 (초안)

- **보드**: Arduino Uno, Nano, Mega, ESP32, ESP8266, Raspberry Pi Pico
- **센서**: 온습도, 초음파, 적외선, 가스, 조도, 가속도/자이로
- **모듈**: 통신(Bluetooth, Wi-Fi, RF), 디스플레이(LCD, OLED), 릴레이, RTC
- **모터 / 액추에이터**: 서보, DC, 스테퍼, 모터 드라이버
- **기초 부품**: 저항, LED, 버튼, 점퍼선, 브레드보드
- **전원 / 공구**: 어댑터, 배터리 홀더, 납땜 도구, 멀티미터
- **키트**: 입문 키트, 프로젝트 키트

## 4. 기능 범위

### MVP (1차)
- 메인 페이지 (배너, 카테고리, 추천/신상품)
- 상품 목록 (카테고리 필터, 정렬, 페이지네이션)
- 상품 상세 (이미지, 가격, 재고, **스펙 표**, 수량 선택)
- 검색
- 장바구니 (비회원 가능)
- 회원가입 / 로그인 (이메일, 추후 카카오)
- 주문 / 결제 (토스페이먼츠 테스트)
- 마이페이지 — 주문 내역
- 관리자 — 상품 등록·수정, 재고 관리, 주문 상태 변경

### 2차
- 리뷰 / 별점, 상품 Q&A
- 위시리스트
- "호환 보드" 표시, "함께 구매하면 좋은 부품" 추천
- 데이터시트 PDF / 예제 코드 링크
- 쿠폰, 적립금
- 배송 추적

## 5. DB 스키마 (초안)

```
profiles      (id → auth.users, name, phone, role: 'user' | 'admin')
categories    (id, name, slug, parent_id, sort_order)
products      (id, category_id, name, slug, sku, price, sale_price, stock,
               description, specs jsonb, is_active, created_at)
product_images(id, product_id, url, sort_order)
addresses     (id, user_id, recipient, phone, zipcode, address1, address2, is_default)
cart_items    (id, user_id, product_id, quantity)
orders        (id, user_id, order_number, status, total_amount, shipping_fee,
               recipient, phone, address, payment_key, paid_at, created_at)
order_items   (id, order_id, product_id, product_name, unit_price, quantity)
```

- `specs jsonb` 예: `{"동작전압": "5V", "디지털 핀": 14, "MCU": "ATmega328P"}` — 카테고리마다 스펙 항목이 달라서 JSON으로 유연하게
- `order_items`에 상품명/가격을 복사 저장 → 나중에 상품 가격이 바뀌어도 주문 기록 유지
- 주문 상태: `pending → paid → preparing → shipped → delivered` (+ `cancelled`)
- 모든 테이블 RLS 적용: 본인 데이터만 조회, 상품 쓰기는 admin만

## 6. 폴더 구조

```
electronic/
├─ docs/                      # 기획 문서
├─ public/images/             # 정적 이미지 (배너 등)
├─ supabase/
│  ├─ migrations/             # DB 스키마 SQL
│  └─ seed.sql                # 샘플 상품 데이터
└─ src/
   ├─ app/
   │  ├─ (shop)/              # 쇼핑 화면 (공통 헤더/푸터 레이아웃)
   │  │  ├─ page.tsx          #   메인
   │  │  ├─ products/         #   상품 목록, [slug] 상세
   │  │  ├─ categories/[slug] #   카테고리별 목록
   │  │  ├─ search/           #   검색 결과
   │  │  ├─ cart/             #   장바구니
   │  │  └─ checkout/         #   주문서, success / fail
   │  ├─ (auth)/              # 로그인, 회원가입
   │  ├─ mypage/              # 주문 내역, 회원 정보
   │  ├─ admin/               # 관리자: 상품, 주문
   │  └─ api/payments/confirm # 결제 승인 (서버에서 토스 API 호출)
   ├─ components/
   │  ├─ ui/                  # 버튼, 인풋 등 기본 컴포넌트
   │  ├─ layout/              # Header, Footer, Nav
   │  ├─ product/             # ProductCard, ProductGrid, SpecTable
   │  ├─ cart/                # CartItem, CartSummary
   │  ├─ checkout/            # 주소 입력, 결제 위젯
   │  └─ admin/               # 관리자 폼, 테이블
   ├─ lib/
   │  ├─ supabase/            # 브라우저/서버용 클라이언트
   │  └─ payments/            # 토스페이먼츠 연동
   ├─ hooks/                  # 커스텀 훅
   ├─ stores/                 # Zustand (장바구니)
   └─ types/                  # 공용 타입 (Supabase 생성 타입 포함)
```

`(shop)`, `(auth)`처럼 괄호 폴더는 URL에 포함되지 않고 레이아웃만 묶는 용도.

## 7. 진행 단계

| 단계 | 내용 | 완료 기준 |
|---|---|---|
| 1. 기반 세팅 | Next.js·Tailwind 설치, Supabase 연결, 공통 레이아웃 | 헤더/푸터가 있는 빈 메인 페이지가 뜸 |
| 2. DB & 상품 | 스키마 마이그레이션, 시드 데이터, 목록/상세/카테고리/검색 | 샘플 상품을 둘러볼 수 있음 |
| 3. 장바구니 & 인증 | Zustand 장바구니, Supabase Auth, 로그인 시 장바구니 병합 | 담기→로그인→장바구니 유지 |
| 4. 주문 & 결제 | 주문서, 토스 결제 위젯, 서버 결제 승인, 재고 차감 | 테스트 결제로 주문 생성 |
| 5. 마이페이지 & 관리자 | 주문 내역, 관리자 상품 CRUD, 주문 상태 변경 | 관리자가 상품 등록 가능 |
| 6. 배포 | Vercel 배포, 환경변수, 도메인 | 공개 URL에서 동작 |

## 8. 진행 상황 (2026-10-13)

1~6단계 완료. GitHub Pages 배포를 위해 서버 코드(Server Actions, API 라우트, proxy)를 없애고
브라우저 + Supabase(RLS) + Edge Function 구조로 바꿨다.
남은 것: 2차 기능(리뷰, 위시리스트, 쿠폰 등).

## 9. 미정 사항

- 실제 판매용인지(사업자, PG 계약 필요) / 포트폴리오용인지
- 소셜 로그인 범위 (카카오, 네이버)
- 상품 데이터 출처 (직접 입력 vs 기존 데이터)
- 디자인 레퍼런스 (참고할 사이트)
