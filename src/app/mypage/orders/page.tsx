"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { useAsync } from "@/hooks/use-async";
import { formatDate, formatPrice } from "@/lib/format";
import { getSupabase } from "@/lib/supabase/client";

async function getMyOrders(showAll: boolean) {
  // RLS로 본인 주문만 조회된다. 결제 전에 이탈한 주문은 기본으로 숨긴다.
  let query = getSupabase()
    .from("orders")
    .select("id, order_number, order_name, status, total_amount, created_at")
    .order("created_at", { ascending: false });
  if (!showAll) query = query.neq("status", "pending");
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

function MyOrders() {
  const showAll = useSearchParams().get("all") === "1";
  const { data: orders, loading } = useAsync(() => getMyOrders(showAll), [showAll]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">주문 내역</h2>
        <Link href={showAll ? "/mypage/orders" : "/mypage/orders?all=1"} className="text-sm text-muted hover:text-brand">
          {showAll ? "결제된 주문만 보기" : "결제 대기 주문도 보기"}
        </Link>
      </div>
      {loading ? (
        <div className="card h-40 animate-pulse" />
      ) : !orders || orders.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 p-12 text-center">
          <p className="text-muted">주문 내역이 없습니다.</p>
          <Link href="/products" className="btn-primary">쇼핑하러 가기</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/mypage/order?id=${o.id}`} className="card flex flex-wrap items-center gap-3 p-4 transition hover:border-brand">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted">
                    {formatDate(o.created_at)} · <span className="font-mono">{o.order_number}</span>
                  </p>
                  <p className="mt-1 truncate font-semibold">{o.order_name}</p>
                </div>
                <OrderStatusBadge status={o.status} />
                <p className="w-28 text-right font-bold">{formatPrice(o.total_amount)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MyOrdersPage() {
  return (
    <Suspense>
      <MyOrders />
    </Suspense>
  );
}
