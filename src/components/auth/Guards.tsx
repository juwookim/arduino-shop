"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { useAuth, type CurrentUser } from "./AuthProvider";

function Loading() {
  return (
    <div className="grid min-h-64 place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-soft border-t-brand" />
    </div>
  );
}

function Guard({ admin, children }: { admin?: boolean; children: (user: CurrentUser) => ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const allowed = Boolean(user && (!admin || user.isAdmin));

  useEffect(() => {
    if (loading || allowed) return;
    if (!user) {
      const next = qs ? `${pathname}?${qs}` : pathname;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    } else {
      router.replace("/");
    }
  }, [loading, allowed, user, pathname, qs, router]);

  if (loading || !allowed || !user) return <Loading />;
  return <>{children(user)}</>;
}

/** 로그인한 사용자만 볼 수 있는 화면 (정적 사이트라 브라우저에서 확인한다. 데이터는 RLS가 보호) */
export function RequireUser({ children }: { children: (user: CurrentUser) => ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}

export function RequireAdmin({ children }: { children: (user: CurrentUser) => ReactNode }) {
  return (
    <Suspense fallback={<Loading />}>
      <Guard admin>{children}</Guard>
    </Suspense>
  );
}
