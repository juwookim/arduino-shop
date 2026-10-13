"use client";

import Link from "next/link";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { useAsync } from "@/hooks/use-async";
import { formatDate, formatPrice } from "@/lib/format";
import { getSupabase } from "@/lib/supabase/client";

const LOW_STOCK = 10;

async function getDashboard() {
  const supabase = getSupabase();
  const [{ data: paidOrders }, { data: recent }, { data: lowStock }, { count: productCount }] = await Promise.all([
    supabase.from("orders").select("total_amount, status").not("status", "in", "(pending,cancelled)"),
    supabase
      .from("orders")
      .select("id, order_number, order_name, recipient, status, total_amount, created_at")
      .neq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("products").select("id, name, stock").lt("stock", LOW_STOCK).order("stock").limit(8),
    supabase.from("products").select("id", { count: "exact", head: true }),
  ]);
  return { paidOrders: paidOrders ?? [], recent: recent ?? [], lowStock: lowStock ?? [], productCount: productCount ?? 0 };
}

export default function AdminDashboardPage() {
  const { data } = useAsync(getDashboard, []);
  if (!data) return <div className="card h-64 animate-pulse" />;

  const sales = data.paidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const toShip = data.paidOrders.filter((o) => o.status === "paid" || o.status === "preparing").length;
  const stats = [
    { label: "누적 매출", value: formatPrice(sales) },
    { label: "결제 완료 주문", value: `${data.paidOrders.length}건` },
    { label: "발송 대기", value: `${toShip}건` },
    { label: "등록 상품", value: `${data.productCount}개` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="font-bold">최근 주문</h2>
            <Link href="/admin/orders" className="text-sm text-muted hover:text-brand">전체 보기</Link>
          </div>
          {data.recent.length > 0 ? (
            <ul className="divide-y divide-line">
              {data.recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/order?id=${o.id}`} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm hover:bg-background">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{o.order_name}</p>
                      <p className="text-xs text-muted">{o.recipient} · {formatDate(o.created_at)}</p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                    <span className="w-24 text-right font-semibold">{formatPrice(o.total_amount)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-8 text-center text-sm text-muted">아직 결제된 주문이 없습니다.</p>
          )}
        </section>

        <section className="card h-fit">
          <h2 className="border-b border-line px-5 py-3 font-bold">재고 부족 ({LOW_STOCK}개 미만)</h2>
          {data.lowStock.length > 0 ? (
            <ul className="divide-y divide-line text-sm">
              {data.lowStock.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/edit?id=${p.id}`} className="flex justify-between gap-3 px-5 py-2.5 hover:bg-background">
                    <span className="truncate">{p.name}</span>
                    <span className={p.stock === 0 ? "font-bold text-danger" : "font-semibold text-accent"}>{p.stock}개</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-center text-sm text-muted">재고가 넉넉합니다.</p>
          )}
        </section>
      </div>
    </div>
  );
}
