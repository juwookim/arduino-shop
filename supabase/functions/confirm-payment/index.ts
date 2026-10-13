// 토스페이먼츠 결제 승인 → 주문 확정 (재고 차감)
// 정적 사이트(GitHub Pages)에는 서버가 없으므로 시크릿 키가 필요한 승인 단계를 여기서 처리한다.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// 운영 키는 Edge Function 시크릿 TOSS_SECRET_KEY 로 설정한다.
// 설정이 없으면 토스페이먼츠가 문서에 공개한 '문서용 테스트 키'를 쓴다 (실제 결제 안 됨).
const TOSS_SECRET_KEY = Deno.env.get("TOSS_SECRET_KEY") ?? "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";
const TOSS_API = "https://api.tosspayments.com/v1/payments";

const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  secretKeys.default ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
const fail = (message: string, status = 400) => json({ ok: false, message }, status);

async function toss(path: string, body: unknown) {
  const res = await fetch(`${TOSS_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${TOSS_SECRET_KEY}:`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, data: await res.json() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("POST만 지원합니다.", 405);

  // verify_jwt=true 이므로 플랫폼이 서명을 이미 검증했다. 여기서는 사용자를 확인한다.
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: auth } = await admin.auth.getUser(token);
  if (!auth?.user) return fail("로그인이 필요합니다.", 401);

  const body = await req.json().catch(() => ({}));
  const paymentKey = typeof body.paymentKey === "string" ? body.paymentKey : "";
  const orderNumber = typeof body.orderId === "string" ? body.orderId : "";
  const amount = Number(body.amount);
  if (!paymentKey || !orderNumber || !Number.isInteger(amount)) return fail("결제 정보가 올바르지 않습니다.");

  const { data: order } = await admin
    .from("orders")
    .select("id, status, total_amount, payment_key")
    .eq("order_number", orderNumber)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (!order) return fail("주문을 찾을 수 없습니다.", 404);

  // 새로고침 등으로 다시 들어온 경우
  if (order.status !== "pending") {
    return order.payment_key === paymentKey ? json({ ok: true, orderId: order.id }) : fail("이미 처리된 주문입니다.", 409);
  }

  // 결제창에서 넘어온 금액이 주문 금액과 다르면 승인하지 않는다 (금액 위변조 방지)
  if (order.total_amount !== amount) return fail("결제 금액이 주문 금액과 일치하지 않습니다.");

  const confirmed = await toss("/confirm", { paymentKey, orderId: orderNumber, amount });
  if (!confirmed.ok) return fail(confirmed.data?.message ?? "결제 승인에 실패했습니다.", 402);

  const { error } = await admin.rpc("confirm_order_payment", {
    p_order_number: orderNumber,
    p_payment_key: paymentKey,
    p_amount: amount,
    p_method: confirmed.data.method ?? "",
  });

  if (error) {
    // 재고 부족 등으로 주문을 확정하지 못하면 결제를 취소한다
    await toss(`/${encodeURIComponent(paymentKey)}/cancel`, { cancelReason: "주문 처리 실패로 자동 취소" });
    return fail(`주문을 완료하지 못해 결제를 취소했습니다. (${error.message})`, 409);
  }

  return json({ ok: true, orderId: order.id });
});
