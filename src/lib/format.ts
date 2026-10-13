export function formatPrice(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const FREE_SHIPPING_THRESHOLD = 50000;
export const SHIPPING_FEE = 3000;

/** DB 함수 create_order 와 같은 규칙 */
export function shippingFeeFor(itemsAmount: number) {
  return itemsAmount >= FREE_SHIPPING_THRESHOLD || itemsAmount === 0 ? 0 : SHIPPING_FEE;
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  preparing: "배송 준비",
  shipped: "배송 중",
  delivered: "배송 완료",
  cancelled: "주문 취소",
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABEL);
