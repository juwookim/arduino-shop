"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { useCart, type CartItem } from "@/stores/cart";

type Props = { product: Omit<CartItem, "quantity"> };

export function AddToCart({ product }: Props) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;
  const maxQty = Math.min(product.stock, 999);

  function change(next: number) {
    setQuantity(Math.max(1, Math.min(next, maxQty)));
  }

  function addToCart() {
    add(product, quantity);
    setAdded(true);
  }

  function buyNow() {
    add(product, quantity);
    router.push("/cart");
  }

  if (soldOut) {
    return <p className="rounded-lg bg-background px-4 py-3 text-center font-semibold text-muted">품절된 상품입니다</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">수량</span>
        <div className="flex items-center rounded-lg border border-line bg-surface">
          <button type="button" onClick={() => change(quantity - 1)} className="px-3 py-2 text-lg" aria-label="수량 줄이기">
            −
          </button>
          <input
            type="number"
            min={1}
            max={maxQty}
            value={quantity}
            onChange={(e) => change(Number(e.target.value) || 1)}
            className="w-14 border-x border-line py-2 text-center text-sm outline-none"
            aria-label="수량"
          />
          <button type="button" onClick={() => change(quantity + 1)} className="px-3 py-2 text-lg" aria-label="수량 늘리기">
            +
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm text-muted">총 상품금액</span>
        <span className="text-xl font-bold text-brand">{formatPrice(product.price * quantity)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={addToCart} className="btn-outline py-3">
          장바구니 담기
        </button>
        <button type="button" onClick={buyNow} className="btn-primary py-3">
          바로 구매
        </button>
      </div>
      {added && (
        <p className="flex items-center justify-between rounded-lg bg-brand-soft px-4 py-2.5 text-sm text-brand-strong" role="status">
          장바구니에 담았습니다.
          <button type="button" onClick={() => router.push("/cart")} className="font-semibold underline">
            장바구니 보기
          </button>
        </p>
      )}
    </div>
  );
}
