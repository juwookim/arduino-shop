"use client";

import Image from "next/image";
import Link from "next/link";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSyncedCart } from "@/hooks/use-synced-cart";
import { productHref } from "@/components/product/ProductCard";
import { FREE_SHIPPING_THRESHOLD, formatPrice, shippingFeeFor } from "@/lib/format";
import { asset } from "@/lib/paths";
import { cartTotal, useCart } from "@/stores/cart";

export function CartView() {
  const hydrated = useHydrated();
  const { items } = useSyncedCart();
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);

  if (!hydrated) {
    return <div className="card h-48 animate-pulse" />;
  }

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 p-14 text-center">
        <p className="text-muted">장바구니가 비어 있습니다.</p>
        <Link href="/products" className="btn-primary">
          상품 둘러보기
        </Link>
      </div>
    );
  }

  const itemsAmount = cartTotal(items);
  const shipping = shippingFeeFor(itemsAmount);
  const remaining = FREE_SHIPPING_THRESHOLD - itemsAmount;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card divide-y divide-line">
        {items.map((item) => (
          <div key={item.productId} className="flex gap-4 p-4">
            <Link href={productHref(item.slug)} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-white">
              {item.imageUrl && <Image src={asset(item.imageUrl)} alt="" fill sizes="80px" className="object-contain p-1" />}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <Link href={productHref(item.slug)} className="line-clamp-2 font-medium hover:text-brand">
                  {item.name}
                </Link>
                <p className="text-sm text-muted">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-line">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.productId, item.quantity - 1)}
                    className="px-2.5 py-1"
                    aria-label={`${item.name} 수량 줄이기`}
                  >
                    −
                  </button>
                  <span className="w-9 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    className="px-2.5 py-1 disabled:opacity-30"
                    aria-label={`${item.name} 수량 늘리기`}
                  >
                    +
                  </button>
                </div>
                <p className="w-24 text-right font-semibold">{formatPrice(item.price * item.quantity)}</p>
                <button
                  type="button"
                  onClick={() => remove(item.productId)}
                  className="text-muted hover:text-danger"
                  aria-label={`${item.name} 삭제`}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end p-3">
          <button type="button" onClick={clear} className="text-sm text-muted hover:text-danger">
            전체 비우기
          </button>
        </div>
      </div>

      <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-36">
        <h2 className="font-bold">결제 예정 금액</h2>
        <div className="flex justify-between text-sm">
          <span className="text-muted">상품 금액</span>
          <span>{formatPrice(itemsAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">배송비</span>
          <span>{shipping === 0 ? "무료" : formatPrice(shipping)}</span>
        </div>
        {remaining > 0 && (
          <p className="rounded-lg bg-brand-soft px-3 py-2 text-xs text-brand-strong">
            {formatPrice(remaining)} 더 담으면 무료배송
          </p>
        )}
        <div className="flex justify-between border-t border-line pt-3 text-lg font-bold">
          <span>합계</span>
          <span className="text-brand">{formatPrice(itemsAmount + shipping)}</span>
        </div>
        <Link href="/checkout" className="btn-primary w-full py-3">
          주문하기
        </Link>
      </aside>
    </div>
  );
}
