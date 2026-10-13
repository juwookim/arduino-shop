"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { confirmPayment } from "@/lib/actions";
import { useCart } from "@/stores/cart";

type State =
  | { status: "loading" }
  | { status: "success"; orderId: string; orderNumber: string }
  | { status: "error"; message: string };

/** 토스 결제창에서 돌아온 뒤 Edge Function에 결제 승인을 요청한다 */
export function PaymentResult() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const clear = useCart((s) => s.clear);
  const requested = useRef(false);
  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const hasParams = Boolean(paymentKey && orderId && amount);
  const [state, setState] = useState<State>(() =>
    hasParams ? { status: "loading" } : { status: "error", message: "결제 정보가 없습니다." },
  );

  useEffect(() => {
    // 세션 복원이 끝나야 로그인 토큰을 함께 보낼 수 있다.
    // 개발 모드에서 effect가 두 번 실행돼도 승인 요청은 한 번만 보낸다.
    if (requested.current || !hasParams || authLoading) return;
    requested.current = true;

    confirmPayment({ paymentKey: paymentKey!, orderId: orderId!, amount: Number(amount) }).then((result) => {
      if (result.ok) {
        clear();
        setState({ status: "success", orderId: result.data.orderId, orderNumber: orderId! });
      } else {
        setState({ status: "error", message: user ? result.error : "로그인이 풀렸습니다. 다시 로그인한 뒤 주문 내역을 확인해 주세요." });
      }
    });
  }, [hasParams, authLoading, user, paymentKey, orderId, amount, clear]);

  if (state.status === "loading") {
    return (
      <div className="card p-14 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-soft border-t-brand" />
        <p className="font-semibold">결제를 확인하고 있습니다…</p>
        <p className="mt-1 text-sm text-muted">창을 닫지 말고 잠시만 기다려 주세요.</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="card p-10 text-center">
        <p className="text-4xl">⚠️</p>
        <h1 className="mt-3 text-xl font-bold">결제를 완료하지 못했습니다</h1>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/cart" className="btn-outline">장바구니로</Link>
          <Link href="/checkout" className="btn-primary">다시 결제하기</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-10 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand text-2xl text-white">✓</div>
      <h1 className="mt-4 text-2xl font-bold">주문이 완료되었습니다</h1>
      <p className="mt-2 text-sm text-muted">
        주문번호 <span className="font-mono font-semibold text-foreground">{state.orderNumber}</span>
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/products" className="btn-outline">쇼핑 계속하기</Link>
        <Link href={`/mypage/order?id=${state.orderId}`} className="btn-primary">주문 상세 보기</Link>
      </div>
    </div>
  );
}
