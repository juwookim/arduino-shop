# 메이커파츠 — 아두이노 부품 쇼핑몰

아두이노 보드, 센서, 모듈, 모터, 키트를 파는 쇼핑몰입니다.
GitHub Pages에서 동작하는 **정적 사이트**이고, 데이터·로그인·결제 승인은 Supabase가 처리합니다.

**사이트:** https://juwookim.github.io/arduino-shop/

| 기능 | 내용 |
|---|---|
| 쇼핑 | 카테고리·정렬·검색, 상품 상세(스펙 표), 장바구니, 무료배송 기준(5만 원) |
| 회원 | 이메일 회원가입·로그인, 주문 내역, 회원 정보 수정 |
| 결제 | 토스페이먼츠 결제위젯 (테스트 모드, 실제 돈이 빠져나가지 않음) |
| 관리자 | 대시보드, 상품 등록·수정·삭제(이미지 업로드), 주문 상태 변경 |

## 기술 스택

- **Next.js 16** (App Router, `output: "export"` 정적 내보내기) + TypeScript + Tailwind CSS 4
- **Supabase**: Postgres(RLS), Auth, Storage, Edge Function
- **토스페이먼츠** 결제위젯 SDK v2
- **Zustand**: 장바구니 (브라우저 localStorage)
- **GitHub Actions → GitHub Pages** 자동 배포

## 구조

```
.github/workflows/deploy.yml   main에 push하면 빌드 후 GitHub Pages로 배포
src/
├─ app/
│  ├─ (shop)/       메인, 상품 목록(/products?category=&q=&sort=), 상품 상세(/product?slug=),
│  │                장바구니, 주문/결제, 결제 결과, 이미지 출처
│  ├─ (auth)/       로그인, 회원가입
│  ├─ mypage/       주문 내역, 주문 상세(/mypage/order?id=), 회원 정보
│  └─ admin/        대시보드, 상품 관리(/admin/products/edit?id=), 주문 관리
├─ components/      layout, product, cart, checkout, order, admin, auth
├─ lib/
│  ├─ supabase/     브라우저용 Supabase 클라이언트
│  ├─ queries.ts    조회
│  ├─ actions.ts    로그인·주문·관리자 저장 등 데이터 변경
│  └─ paths.ts      GitHub Pages 하위 경로(basePath) 처리
├─ stores/cart.ts   장바구니
└─ data/image-credits.json   이미지 출처·라이선스
supabase/
├─ migrations/      테이블, RLS 정책, 주문/결제 DB 함수
├─ functions/confirm-payment/   토스 결제 승인 Edge Function
└─ seed.sql         카테고리 6개, 상품 26개
public/images/      상품·배너 사진
```

상세 페이지를 `/product?slug=...` 처럼 쿼리 문자열로 여는 이유: 정적 사이트는 빌드할 때 페이지를 미리 만들어 두는데,
이렇게 하면 관리자가 새로 등록한 상품도 다시 빌드하지 않고 바로 보입니다.

## 서버 없이 어떻게 안전한가

정적 사이트라 화면 코드는 전부 브라우저에서 돌아갑니다. 보안은 화면이 아니라 데이터 쪽에서 지킵니다.

- **RLS**: 모든 테이블에 행 단위 보안 정책을 걸었습니다. 상품 쓰기는 관리자만, 주문은 본인 것만 볼 수 있습니다.
  관리자 화면 주소를 직접 열어도 데이터는 내려오지 않습니다.
- **컬럼 권한**: 사용자는 자기 `role`이나 주문 `status`를 바꿀 수 없습니다.
- **주문 금액**: 브라우저가 보낸 값이 아니라 DB 함수 `create_order`가 상품 가격으로 계산합니다.
- **결제 승인**: 토스 시크릿 키가 필요한 승인은 Edge Function `confirm-payment`가 합니다.
  주문 금액과 결제 금액이 다르면 승인하지 않고, 재고 부족 등으로 주문을 확정하지 못하면 결제를 자동 취소합니다.
  재고 차감 함수(`confirm_order_payment`)는 Edge Function(service_role)만 실행할 수 있습니다.

## 로컬에서 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev                  # http://localhost:3000
```

GitHub Pages와 같은 경로로 빌드해 보려면:

```bash
NEXT_PUBLIC_BASE_PATH=/arduino-shop npm run build   # out/ 폴더 생성
```

> Windows Git Bash에서는 경로가 바뀌지 않도록 앞에 `MSYS_NO_PATHCONV=1` 을 붙이세요.

## 배포 설정

- 저장소 **Settings → Variables → Actions** 에 아래 3개가 있어야 빌드됩니다 (모두 공개해도 되는 값).
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_TOSS_CLIENT_KEY`
- **Settings → Pages → Source** 는 *GitHub Actions*.
- 회원가입 인증 메일이 사이트로 돌아오게 하려면 Supabase 대시보드 → Authentication → URL Configuration 에서
  *Site URL* 을 `https://juwookim.github.io/arduino-shop/` 으로 설정하세요.
- 실제 결제를 받으려면 토스페이먼츠 가맹점 계약 후 클라이언트 키를 바꾸고,
  시크릿 키는 Supabase Edge Function 시크릿 `TOSS_SECRET_KEY` 로 넣으세요 (코드에 넣지 마세요).

## 관리자 계정 만들기

회원가입 후 Supabase SQL 편집기에서:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = '내이메일@example.com');
```

## 데이터 출처

- **가격·상품 정보**: 디바이스마트 판매가(VAT 포함), 2026-10-13 조회. 상품 상세 페이지 하단에 원본 링크가 있습니다.
  스펙 일부는 일반적인 데이터시트 값으로 보완했습니다.
- **이미지**: Wikimedia Commons, Flickr의 자유 라이선스(CC BY / CC BY-SA / CC0) 사진입니다.
  사이트의 [이미지 출처](https://juwookim.github.io/arduino-shop/credits/) 페이지에 저작자와 라이선스를 모두 적었습니다.
- 학습·포트폴리오용 프로젝트이며, 실제 판매를 하지 않습니다.
