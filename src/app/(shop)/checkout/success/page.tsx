import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentResult } from "@/components/checkout/PaymentResult";

export const metadata: Metadata = { title: "결제 확인" };

export default function CheckoutSuccessPage() {
  return (
    <div className="container-page max-w-xl py-16">
      <Suspense>
        <PaymentResult />
      </Suspense>
    </div>
  );
}
