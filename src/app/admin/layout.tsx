"use client";

import Link from "next/link";
import { RequireAdmin } from "@/components/auth/Guards";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/products", label: "상품 관리" },
  { href: "/admin/orders", label: "주문 관리" },
];

// 화면 접근은 브라우저에서 막고, 실제 데이터 읽기·쓰기는 DB의 RLS가 관리자만 허용한다
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RequireAdmin>
      {(user) => (
        <div className="flex flex-1 flex-col md:flex-row">
          <aside className="border-b border-line bg-foreground text-white md:w-56 md:border-b-0 md:border-r">
            <div className="flex items-center justify-between p-4 md:block">
              <Link href="/admin" className="font-bold">
                메이커파츠 <span className="text-accent">관리자</span>
              </Link>
              <p className="text-xs text-white/60 md:mt-1">{user.email}</p>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3" aria-label="관리자 메뉴">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="shrink-0 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white">
                  {n.label}
                </Link>
              ))}
              <Link href="/" className="shrink-0 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white md:mt-6">
                ← 쇼핑몰로
              </Link>
            </nav>
          </aside>
          <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
        </div>
      )}
    </RequireAdmin>
  );
}
