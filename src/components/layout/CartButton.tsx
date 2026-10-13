"use client";

import Link from "next/link";
import { useHydrated } from "@/hooks/use-hydrated";
import { cartCount, useCart } from "@/stores/cart";

export function CartButton() {
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(items) : 0;

  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-soft hover:text-brand"
      aria-label={`장바구니, ${count}개`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
      </svg>
      <span className="hidden sm:inline">장바구니</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-accent px-1.5 text-center text-xs font-bold leading-5 text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
