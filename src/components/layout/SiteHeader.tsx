"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAsync } from "@/hooks/use-async";
import { logout } from "@/lib/actions";
import { getCategories } from "@/lib/queries";
import { CartButton } from "./CartButton";
import { SearchBar } from "./SearchBar";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data: categories } = useAsync(getCategories, []);

  async function onLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm text-white">MP</span>
          <span className="text-lg">메이커파츠</span>
        </Link>
        <Suspense fallback={<div className="hidden flex-1 md:block" />}>
          <SearchBar className="hidden flex-1 md:block" />
        </Suspense>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          {loading ? (
            <span className="h-5 w-24 animate-pulse rounded bg-background" />
          ) : user ? (
            <>
              {user.isAdmin && (
                <Link href="/admin" className="rounded-lg px-3 py-2 font-medium text-accent hover:bg-brand-soft">
                  관리자
                </Link>
              )}
              <Link
                href="/mypage/orders"
                className="rounded-lg px-3 py-2 font-medium hover:bg-brand-soft hover:text-brand"
              >
                마이페이지
              </Link>
              <button onClick={onLogout} className="rounded-lg px-3 py-2 text-muted hover:bg-brand-soft hover:text-brand">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 font-medium hover:bg-brand-soft hover:text-brand">
                로그인
              </Link>
              <Link
                href="/signup"
                className="hidden rounded-lg px-3 py-2 text-muted hover:bg-brand-soft hover:text-brand sm:block"
              >
                회원가입
              </Link>
            </>
          )}
          <CartButton />
        </nav>
      </div>
      <div className="container-page pb-3 md:hidden">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>
      <nav className="border-t border-line" aria-label="카테고리">
        <div className="container-page flex gap-1 overflow-x-auto py-2 text-sm">
          <Link
            href="/products"
            className="shrink-0 rounded-full px-3 py-1.5 font-medium hover:bg-brand-soft hover:text-brand"
          >
            전체 상품
          </Link>
          {categories?.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="shrink-0 rounded-full px-3 py-1.5 text-muted hover:bg-brand-soft hover:text-brand"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
