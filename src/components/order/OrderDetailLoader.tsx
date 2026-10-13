"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useAsync } from "@/hooks/use-async";
import { getOrderWithItems, type OrderWithItems } from "@/lib/queries";
import { OrderDetail } from "./OrderDetail";

/** ?id= 로 주문을 불러와 보여준다. 관리자 화면은 extra로 상태 변경 폼을 끼워 넣는다. */
export function OrderDetailLoader({
  backHref,
  backLabel,
  extra,
}: {
  backHref: string;
  backLabel: string;
  extra?: (data: OrderWithItems, reload: () => void) => ReactNode;
}) {
  const id = useSearchParams().get("id") ?? "";
  const { data, loading, reload } = useAsync(() => (id ? getOrderWithItems(id) : Promise.resolve(null)), [id]);

  return (
    <div className="max-w-3xl">
      <Link href={backHref} className="mb-4 inline-block text-sm text-muted hover:text-brand">
        ← {backLabel}
      </Link>
      {loading ? (
        <div className="card h-64 animate-pulse" />
      ) : !data ? (
        <p className="card p-10 text-center text-muted">주문을 찾을 수 없습니다.</p>
      ) : (
        <>
          {extra?.(data, reload)}
          <OrderDetail order={data.order} items={data.items} />
        </>
      )}
    </div>
  );
}
