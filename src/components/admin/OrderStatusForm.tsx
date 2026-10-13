"use client";

import { useState, type FormEvent } from "react";
import { updateOrderStatus } from "@/lib/actions";
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from "@/lib/format";

export function OrderStatusForm({ id, status, onSaved }: { id: string; status: string; onSaved?: () => void }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const next = String(new FormData(e.currentTarget).get("status"));
    const result = await updateOrderStatus(id, next);
    setPending(false);
    setMessage(result.ok ? "변경됨" : result.error);
    if (result.ok) onSaved?.();
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <select name="status" defaultValue={status} className="input w-auto py-1.5" aria-label="주문 상태">
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
        ))}
      </select>
      <button type="submit" disabled={pending} className="btn-outline py-1.5">변경</button>
      {message && <span className="text-xs text-muted">{message}</span>}
    </form>
  );
}
