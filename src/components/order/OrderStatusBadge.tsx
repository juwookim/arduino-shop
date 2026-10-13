import { ORDER_STATUS_LABEL } from "@/lib/format";

const STYLE: Record<string, string> = {
  pending: "bg-background text-muted",
  paid: "bg-brand-soft text-brand-strong",
  preparing: "bg-amber-50 text-amber-700",
  shipped: "bg-blue-50 text-blue-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-danger/10 text-danger",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLE[status] ?? STYLE.pending}`}>
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  );
}
