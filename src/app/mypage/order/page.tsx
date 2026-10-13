import { Suspense } from "react";
import { OrderDetailLoader } from "@/components/order/OrderDetailLoader";

export default function MyOrderDetailPage() {
  return (
    <Suspense>
      <OrderDetailLoader backHref="/mypage/orders" backLabel="주문 내역" />
    </Suspense>
  );
}
