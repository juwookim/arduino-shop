"use client";

import Image from "next/image";
import Link from "next/link";
import { loadTossPayments, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSyncedCart } from "@/hooks/use-synced-cart";
import { createOrder } from "@/lib/actions";
import { formatPrice, shippingFeeFor } from "@/lib/format";
import { absoluteUrl, asset } from "@/lib/paths";
import { cartTotal } from "@/stores/cart";

type Props = {
  customer: { id: string; email: string; name: string | null; phone: string | null };
};

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

export function CheckoutForm({ customer }: Props) {
  const hydrated = useHydrated();
  const { items, synced } = useSyncedCart();
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const itemsAmount = cartTotal(items);
  const shipping = shippingFeeFor(itemsAmount);
  const total = itemsAmount + shipping;
  // 결제위젯을 그릴 #payment-method 영역은 장바구니 동기화가 끝나야 화면에 나타난다
  const hasItems = hydrated && synced && items.length > 0;

  // 결제위젯은 한 번만 그린다. (개발 모드 StrictMode의 이중 마운트는 cleanup에서 정리)
  useEffect(() => {
    if (!hasItems) return;
    let cancelled = false;
    const rendered: { destroy: () => Promise<void> }[] = [];

    (async () => {
      try {
        const toss = await loadTossPayments(CLIENT_KEY);
        const widgets = toss.widgets({ customerKey: customer.id });
        await widgets.setAmount({ currency: "KRW", value: total });
        if (cancelled) return;
        const [methods, agreement] = await Promise.all([
          widgets.renderPaymentMethods({ selector: "#payment-method" }),
          widgets.renderAgreement({ selector: "#agreement" }),
        ]);
        rendered.push(methods, agreement);
        if (cancelled) {
          await Promise.all(rendered.map((w) => w.destroy()));
          return;
        }
        widgetsRef.current = widgets;
        setWidgetReady(true);
      } catch (e) {
        if (!cancelled) setWidgetError(e instanceof Error ? e.message : "결제위젯을 불러오지 못했습니다.");
      }
    })();

    return () => {
      cancelled = true;
      widgetsRef.current = null;
      setWidgetReady(false);
      rendered.forEach((w) => void w.destroy().catch(() => {}));
    };
    // 금액 변경은 아래 effect에서 setAmount로 반영한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasItems, customer.id]);

  useEffect(() => {
    if (widgetReady && widgetsRef.current) {
      void widgetsRef.current.setAmount({ currency: "KRW", value: total });
    }
  }, [total, widgetReady]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const widgets = widgetsRef.current;
    if (!widgets) return;
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const get = (key: string) => String(form.get(key) ?? "").trim();

    const result = await createOrder({
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      recipient: get("recipient"),
      phone: get("phone"),
      zipcode: get("zipcode"),
      address1: get("address1"),
      address2: get("address2"),
      memo: get("memo"),
    });

    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    try {
      // DB가 계산한 금액으로 결제한다
      const order = result.data;
      await widgets.setAmount({ currency: "KRW", value: order.totalAmount });
      await widgets.requestPayment({
        orderId: order.orderNumber,
        orderName: order.orderName,
        successUrl: absoluteUrl("/checkout/success/"),
        failUrl: absoluteUrl("/checkout/fail/"),
        customerEmail: customer.email || undefined,
        customerName: get("recipient"),
        customerMobilePhone: get("phone").replace(/\D/g, "") || undefined,
      });
    } catch (e) {
      // 사용자가 결제창을 닫은 경우 등
      setError(e instanceof Error ? e.message : "결제를 진행하지 못했습니다.");
      setSubmitting(false);
    }
  }

  if (!hydrated || !synced) return <div className="card h-64 animate-pulse" />;

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 p-14 text-center">
        <p className="text-muted">주문할 상품이 없습니다.</p>
        <Link href="/products" className="btn-primary">
          상품 둘러보기
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="card p-5">
          <h2 className="mb-4 font-bold">배송 정보</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="recipient" className="label">받는 분</label>
              <input id="recipient" name="recipient" required defaultValue={customer.name ?? ""} className="input" autoComplete="name" />
            </div>
            <div>
              <label htmlFor="phone" className="label">연락처</label>
              <input
                id="phone"
                name="phone"
                required
                defaultValue={customer.phone ?? ""}
                placeholder="010-0000-0000"
                className="input"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <div>
              <label htmlFor="zipcode" className="label">우편번호</label>
              <input id="zipcode" name="zipcode" className="input" inputMode="numeric" autoComplete="postal-code" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address1" className="label">주소</label>
              <input id="address1" name="address1" required placeholder="도로명 주소" className="input" autoComplete="address-line1" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address2" className="label">상세 주소</label>
              <input id="address2" name="address2" placeholder="동, 호수 등" className="input" autoComplete="address-line2" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="memo" className="label">배송 메모</label>
              <input id="memo" name="memo" placeholder="예: 문 앞에 놓아 주세요" className="input" />
            </div>
          </div>
        </section>

        <section className="card overflow-hidden">
          <h2 className="px-5 pt-5 font-bold">결제 수단</h2>
          <p className="px-5 pt-1 text-xs text-muted">테스트 결제입니다. 실제로 돈이 빠져나가지 않습니다.</p>
          {widgetError && <p className="mx-5 mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{widgetError}</p>}
          <div id="payment-method" />
          <div id="agreement" />
        </section>
      </div>

      <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-36">
        <h2 className="font-bold">주문 상품 {items.length}개</h2>
        <ul className="max-h-64 space-y-3 overflow-y-auto">
          {items.map((i) => (
            <li key={i.productId} className="flex items-center gap-3 text-sm">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-line bg-white">
                {i.imageUrl && <Image src={asset(i.imageUrl)} alt="" fill sizes="48px" className="object-contain p-0.5" />}
              </div>
              <span className="line-clamp-2 flex-1">{i.name} × {i.quantity}</span>
              <span className="shrink-0 font-medium">{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-2 border-t border-line pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">상품 금액</span>
            <span>{formatPrice(itemsAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">배송비</span>
            <span>{shipping === 0 ? "무료" : formatPrice(shipping)}</span>
          </div>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-lg font-bold">
          <span>결제 금액</span>
          <span className="text-brand">{formatPrice(total)}</span>
        </div>
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
        <button type="submit" disabled={!widgetReady || submitting} className="btn-primary w-full py-3">
          {submitting ? "결제 진행 중…" : `${formatPrice(total)} 결제하기`}
        </button>
      </aside>
    </form>
  );
}
