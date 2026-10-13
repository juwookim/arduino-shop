"use client";

import { RequireUser } from "@/components/auth/Guards";
import { CheckoutForm } from "./CheckoutForm";

export function CheckoutView() {
  return (
    <RequireUser>
      {(user) => <CheckoutForm customer={{ id: user.id, email: user.email, name: user.name, phone: user.phone }} />}
    </RequireUser>
  );
}
