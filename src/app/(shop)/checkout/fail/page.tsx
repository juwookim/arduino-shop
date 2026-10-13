"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailMessage() {
  const searchParams = useSearchParams();
  const text = searchParams.get("message") ?? "결제가 취소되었거나 실패했습니다.";
  const code = searchParams.get("code");

  return (
    <div className="card p-10 text-center">
      <h1 className="text-xl font-bold">결제를 완료하지 못했습니다</h1>
      <p className="mt-3 text-sm text-muted">{text}</p>
      {code && <p className="mt-1 font-mono text-xs text-muted">{code}</p>}
      <p className="mt-3 text-sm text-muted">장바구니는 그대로 남아 있어요.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/cart" className="btn-outline">장바구니로</Link>
        <Link href="/checkout" className="btn-primary">다시 결제하기</Link>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <div className="container-page max-w-xl py-16">
      <Suspense>
        <FailMessage />
      </Suspense>
    </div>
  );
}
