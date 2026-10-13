"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { useAsync } from "@/hooks/use-async";
import { formatDate, formatPrice, ORDER_STATUS_LABEL, ORDER_STATUSES } from "@/lib/format";
import { getSupabase } from "@/lib/supabase/client";

async function getOrders(filter: string | null) {
  let query = getSupabase()
    .from("orders")
    .select("id, order_number, order_name, recipient, status, total_amount, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  query = filter ? query.eq("status", filter) : query.neq("status", "pending");
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

function AdminOrders() {
  const status = useSearchParams().get("status");
  const filter = status && ORDER_STATUSES.includes(status) ? status : null;
  const { data: orders, loading, reload } = useAsync(() => getOrders(filter), [filter]);

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">주문 관리</h1>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <FilterLink href="/admin/orders" active={!filter} label="결제된 주문 전체" />
        {ORDER_STATUSES.map((s) => (
          <FilterLink key={s} href={`/admin/orders?status=${s}`} active={filter === s} label={ORDER_STATUS_LABEL[s]} />
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-background text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">주문</th>
              <th className="px-4 py-3 font-medium">주문자</th>
              <th className="px-4 py-3 text-right font-medium">금액</th>
              <th className="px-4 py-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-muted">불러오는 중…</td>
              </tr>
            ) : orders && orders.length > 0 ? (
              orders.map((o) => (
                <tr key={o.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <Link href={`/admin/order?id=${o.id}`} className="font-medium hover:text-brand">{o.order_name}</Link>
                    <p className="text-xs text-muted">
                      <span className="font-mono">{o.order_number}</span> · {formatDate(o.created_at)}
                    </p>
                  </td>
                  <td className="px-4 py-3">{o.recipient}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(o.total_amount)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusForm id={o.id} status={o.status} onSaved={filter ? reload : undefined} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-10 text-center text-muted">주문이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 ${active ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-brand"}`}
    >
      {label}
    </Link>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense>
      <AdminOrders />
    </Suspense>
  );
}
