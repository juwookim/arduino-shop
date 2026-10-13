"use client";

import { Suspense } from "react";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { OrderDetailLoader } from "@/components/order/OrderDetailLoader";

export default function AdminOrderDetailPage() {
  return (
    <Suspense>
      <OrderDetailLoader
        backHref="/admin/orders"
        backLabel="주문 관리"
        extra={({ order }, reload) => (
          <div className="card mb-5 flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="font-bold">주문 상태 변경</p>
            <OrderStatusForm id={order.id} status={order.status} onSaved={reload} />
          </div>
        )}
      />
    </Suspense>
  );
}
