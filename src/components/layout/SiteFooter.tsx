import Link from "next/link";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page grid gap-6 py-10 text-sm text-muted sm:grid-cols-3">
        <div>
          <p className="mb-2 font-bold text-foreground">메이커파츠</p>
          <p>아두이노 보드, 센서, 모듈, 키트 전문 쇼핑몰</p>
          <p className="mt-2">{formatPrice(FREE_SHIPPING_THRESHOLD)} 이상 무료배송</p>
        </div>
        <div>
          <p className="mb-2 font-bold text-foreground">안내</p>
          <ul className="space-y-1">
            <li>상품 가격·정보는 디바이스마트 판매가(VAT 포함) 기준 샘플 데이터입니다.</li>
            <li>결제는 토스페이먼츠 테스트 모드로, 실제 돈이 빠져나가지 않습니다.</li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-bold text-foreground">바로가기</p>
          <ul className="space-y-1">
            <li>
              <Link href="/products" className="hover:text-brand">전체 상품</Link>
            </li>
            <li>
              <Link href="/mypage/orders" className="hover:text-brand">주문 내역</Link>
            </li>
            <li>
              <Link href="/credits" className="hover:text-brand">이미지 출처</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
