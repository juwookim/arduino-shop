import Link from "next/link";
import { productHref } from "@/components/product/ProductCard";
import { formatDate, formatPrice } from "@/lib/format";
import type { OrderWithItems } from "@/lib/queries";
import { OrderStatusBadge } from "./OrderStatusBadge";

/** 마이페이지와 관리자 화면이 함께 쓰는 주문 상세 */
export function OrderDetail({ order, items }: OrderWithItems) {
  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted">주문번호</p>
          <p className="font-mono font-semibold">{order.order_number}</p>
        </div>
        <div className="text-right">
          <OrderStatusBadge status={order.status} />
          <p className="mt-1 text-xs text-muted">{formatDate(order.created_at)}</p>
        </div>
      </div>

      <section className="card">
        <h2 className="border-b border-line px-5 py-3 font-bold">주문 상품</h2>
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              {item.products ? (
                <Link href={productHref(item.products.slug)} className="hover:text-brand">
                  {item.product_name}
                </Link>
              ) : (
                <span>{item.product_name}</span>
              )}
              <span className="shrink-0 text-muted">
                {formatPrice(item.unit_price)} × {item.quantity} ={" "}
                <strong className="text-foreground">{formatPrice(item.unit_price * item.quantity)}</strong>
              </span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1.5 border-t border-line px-5 py-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">상품 금액</dt>
            <dd>{formatPrice(order.items_amount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">배송비</dt>
            <dd>{order.shipping_fee === 0 ? "무료" : formatPrice(order.shipping_fee)}</dd>
          </div>
          <div className="flex justify-between pt-1 text-base font-bold">
            <dt>결제 금액</dt>
            <dd className="text-brand">{formatPrice(order.total_amount)}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        <section className="card p-5 text-sm">
          <h2 className="mb-3 font-bold">배송지</h2>
          <p>{order.recipient} · {order.phone}</p>
          <p className="mt-1 text-muted">
            {order.zipcode && `(${order.zipcode}) `}
            {order.address1} {order.address2}
          </p>
          {order.memo && <p className="mt-2 text-muted">메모: {order.memo}</p>}
        </section>
        <section className="card p-5 text-sm">
          <h2 className="mb-3 font-bold">결제 정보</h2>
          {order.paid_at ? (
            <>
              <p>{order.payment_method ?? "-"}</p>
              <p className="mt-1 text-muted">{formatDate(order.paid_at)} 결제</p>
            </>
          ) : (
            <p className="text-muted">결제가 완료되지 않은 주문입니다.</p>
          )}
        </section>
      </div>
    </div>
  );
}
