import { FunctionsHttpError } from "@supabase/supabase-js";
import { ORDER_STATUSES } from "@/lib/format";
import { absoluteUrl } from "@/lib/paths";
import { getSupabase } from "@/lib/supabase/client";
import type { Json, TablesInsert } from "@/types/database";

// 브라우저에서 바로 실행하는 데이터 변경 함수들.
// 권한은 DB의 RLS 정책과 함수 권한이 최종적으로 막는다.

type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
const ok = <T>(data: T): Result<T> => ({ ok: true, data });
const err = (error: string): Result<never> => ({ ok: false, error });

// ───────── 인증 ─────────
export async function login(email: string, password: string): Promise<Result> {
  if (!email || !password) return err("이메일과 비밀번호를 입력해 주세요.");
  const { error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (!error) return ok(undefined);
  if (error.code === "email_not_confirmed") {
    return err("이메일 인증이 아직 완료되지 않았습니다. 받은 메일의 링크를 눌러 주세요.");
  }
  return err("이메일 또는 비밀번호가 올바르지 않습니다.");
}

export async function signup(input: {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}): Promise<Result<{ needsConfirm: boolean }>> {
  const { name, email, password, passwordConfirm } = input;
  if (!name || !email || !password) return err("모든 항목을 입력해 주세요.");
  if (password.length < 8) return err("비밀번호는 8자 이상이어야 합니다.");
  if (password !== passwordConfirm) return err("비밀번호 확인이 일치하지 않습니다.");

  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: { data: { name }, emailRedirectTo: absoluteUrl("/") },
  });
  if (error) {
    if (error.code === "user_already_exists") return err("이미 가입된 이메일입니다.");
    if (error.code === "over_email_send_rate_limit") return err("인증 메일 발송 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.");
    return err(`가입에 실패했습니다: ${error.message}`);
  }
  return ok({ needsConfirm: !data.session });
}

export async function logout() {
  await getSupabase().auth.signOut();
}

export async function updateProfile(userId: string, name: string, phone: string): Promise<Result> {
  if (!name) return err("이름을 입력해 주세요.");
  const { error } = await getSupabase().from("profiles").update({ name, phone: phone || null }).eq("id", userId);
  return error ? err("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.") : ok(undefined);
}

// ───────── 주문 / 결제 ─────────
export type CheckoutInput = {
  items: { productId: number; quantity: number }[];
  recipient: string;
  phone: string;
  zipcode: string;
  address1: string;
  address2: string;
  memo: string;
};

/** 주문서를 만든다. 금액은 DB 함수 create_order가 상품 가격으로 다시 계산한다. */
export async function createOrder(input: CheckoutInput) {
  const { data, error } = await getSupabase().rpc("create_order", {
    p_items: input.items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    p_recipient: input.recipient,
    p_phone: input.phone,
    p_zipcode: input.zipcode,
    p_address1: input.address1,
    p_address2: input.address2,
    p_memo: input.memo,
  });
  if (error || !data?.[0]) return err(error?.message ?? "주문을 만들지 못했습니다.");
  const o = data[0];
  return ok({ orderNumber: o.order_number, orderName: o.order_name, totalAmount: o.total_amount });
}

/** 토스 결제 승인은 시크릿 키가 필요해서 Supabase Edge Function이 처리한다 */
export async function confirmPayment(body: { paymentKey: string; orderId: string; amount: number }): Promise<Result<{ orderId: string }>> {
  const { data, error } = await getSupabase().functions.invoke<{ ok: boolean; orderId: string; message?: string }>(
    "confirm-payment",
    { body },
  );
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      return err(payload?.message ?? "결제 승인에 실패했습니다.");
    }
    return err("네트워크 오류로 결제를 확인하지 못했습니다.");
  }
  return data?.ok ? ok({ orderId: data.orderId }) : err(data?.message ?? "결제 승인에 실패했습니다.");
}

// ───────── 관리자 ─────────
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** "키: 값" 한 줄씩 → { 키: 값 } */
function parseSpecs(text: string): Json {
  const specs: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key && value) specs[key] = value;
  }
  return specs;
}

export async function saveProduct(formData: FormData): Promise<Result> {
  const supabase = getSupabase();
  const id = Number(formData.get("id")) || null;
  const text = (key: string) => String(formData.get(key) ?? "").trim();

  const name = text("name");
  const slug = text("slug").toLowerCase();
  const price = Number(text("price"));
  const stock = Number(text("stock"));

  if (!name) return err("상품명을 입력해 주세요.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return err("URL 이름은 영문 소문자, 숫자, 하이픈(-)만 쓸 수 있습니다.");
  if (!Number.isInteger(price) || price < 0) return err("가격은 0 이상의 정수로 입력해 주세요.");
  if (!Number.isInteger(stock) || stock < 0) return err("재고는 0 이상의 정수로 입력해 주세요.");

  let imageUrl = text("image_url") || null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) return err("이미지 파일만 올릴 수 있습니다.");
    if (file.size > MAX_IMAGE_BYTES) return err("이미지는 5MB 이하만 올릴 수 있습니다.");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${slug}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) return err(`이미지 업로드 실패: ${uploadError.message}`);
    imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }

  const values: TablesInsert<"products"> = {
    name,
    slug,
    price,
    stock,
    category_id: Number(text("category_id")) || null,
    sku: text("sku") || null,
    brand: text("brand") || null,
    summary: text("summary") || null,
    description: text("description") || null,
    specs: parseSpecs(text("specs")),
    image_url: imageUrl,
    is_active: formData.get("is_active") === "on",
    is_featured: formData.get("is_featured") === "on",
  };

  const { error } = id
    ? await supabase.from("products").update(values).eq("id", id)
    : await supabase.from("products").insert(values);

  if (error) {
    if (error.code === "23505") return err("같은 URL 이름의 상품이 이미 있습니다.");
    return err(`저장 실패: ${error.message}`);
  }
  return ok(undefined);
}

export async function deleteProduct(id: number): Promise<Result> {
  // 주문 기록에 상품명·가격이 복사되어 있으므로 삭제해도 주문 내역은 유지된다
  const { error } = await getSupabase().from("products").delete().eq("id", id);
  return error ? err(error.message) : ok(undefined);
}

export async function updateOrderStatus(id: string, status: string): Promise<Result> {
  if (!ORDER_STATUSES.includes(status)) return err("올바르지 않은 상태입니다.");
  const { error } = await getSupabase().from("orders").update({ status }).eq("id", id);
  return error ? err(error.message) : ok(undefined);
}
