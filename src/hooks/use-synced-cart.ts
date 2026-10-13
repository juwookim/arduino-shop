"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useCart } from "@/stores/cart";

/**
 * 장바구니를 열 때 DB의 최신 가격·재고를 반영한다.
 * 실제 결제 금액은 어차피 서버(create_order)가 다시 계산한다.
 */
export function useSyncedCart() {
  const items = useCart((s) => s.items);
  const sync = useCart((s) => s.sync);
  const [fetchedOnce, setFetchedOnce] = useState(false);
  const idsKey = items.map((i) => i.productId).sort((a, b) => a - b).join(",");

  useEffect(() => {
    if (!idsKey) return;
    const ids = idsKey.split(",").map(Number);
    let cancelled = false;
    getSupabase()
      .from("products")
      .select("id, slug, name, price, image_url, stock")
      .in("id", ids)
      .eq("is_active", true)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          sync(
            data.map((p) => ({
              productId: p.id,
              slug: p.slug,
              name: p.name,
              price: p.price,
              imageUrl: p.image_url,
              stock: p.stock,
            })),
          );
        }
        setFetchedOnce(true);
      });
    return () => {
      cancelled = true;
    };
  }, [idsKey, sync]);

  return { items, synced: !idsKey || fetchedOnce };
}
