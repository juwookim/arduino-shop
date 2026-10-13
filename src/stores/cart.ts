"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
  /** 서버의 최신 가격·재고로 덮어쓰고, 판매 중지된 상품은 뺀다 */
  sync: (latest: Omit<CartItem, "quantity">[]) => void;
};

const clampQty = (qty: number, stock: number) => Math.max(1, Math.min(qty, stock, 999));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, ...item, quantity: clampQty(i.quantity + quantity, item.stock) }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: clampQty(quantity, item.stock) }] };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: clampQty(quantity, i.stock) } : i,
          ),
        })),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
      sync: (latest) =>
        set((state) => ({
          items: state.items.flatMap((i) => {
            const fresh = latest.find((l) => l.productId === i.productId);
            if (!fresh || fresh.stock <= 0) return [];
            return [{ ...i, ...fresh, quantity: clampQty(i.quantity, fresh.stock) }];
          }),
        })),
    }),
    { name: "arduino-shop-cart" },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((sum, i) => sum + i.quantity, 0);
export const cartTotal = (items: CartItem[]) => items.reduce((sum, i) => sum + i.price * i.quantity, 0);
