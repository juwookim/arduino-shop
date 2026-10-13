import { Suspense } from "react";
import { ProductDetail } from "@/components/product/ProductDetail";

// 정적 사이트에서도 관리자가 새로 등록한 상품이 바로 보이도록 /product?slug=... 형태로 연다
export default function ProductPage() {
  return (
    <Suspense>
      <ProductDetail />
    </Suspense>
  );
}
