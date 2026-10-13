"use client";

import Link from "next/link";
import { RequireUser } from "@/components/auth/Guards";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function MyPageLayout({ children }: LayoutProps<"/mypage">) {
  return (
    <>
      <SiteHeader />
      <main className="container-page flex-1 py-8">
        <RequireUser>
          {(user) => (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold">마이페이지</h1>
                <p className="mt-1 text-sm text-muted">{user.name ?? user.email} 님, 반갑습니다.</p>
              </div>
              <div className="grid gap-6 md:grid-cols-[180px_1fr]">
                <nav className="flex gap-2 md:flex-col" aria-label="마이페이지 메뉴">
                  <Link href="/mypage/orders" className="btn-outline justify-start">주문 내역</Link>
                  <Link href="/mypage/profile" className="btn-outline justify-start">회원 정보</Link>
                </nav>
                <div className="min-w-0">{children}</div>
              </div>
            </>
          )}
        </RequireUser>
      </main>
      <SiteFooter />
    </>
  );
}
