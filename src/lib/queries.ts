import { getSupabase } from "@/lib/supabase/client";
import type { Category, Order, OrderItem, Product, ProductWithCategory } from "@/types";

const PRODUCT_SELECT = "*, categories(name, slug)";

export type ProductSort = "recommended" | "newest" | "price-asc" | "price-desc" | "name";

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "recommended", label: "추천순" },
  { value: "newest", label: "최신순" },
  { value: "price-asc", label: "낮은 가격순" },
  { value: "price-desc", label: "높은 가격순" },
  { value: "name", label: "이름순" },
];

export function parseSort(value: string | null): ProductSort {
  return SORT_OPTIONS.some((o) => o.value === value) ? (value as ProductSort) : "recommended";
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await getSupabase().from("categories").select("*").order("sort_order");
  if (error) throw error;
  return data;
}

export async function getProducts(options: {
  categorySlug?: string;
  categoryId?: number;
  query?: string;
  sort?: ProductSort;
  limit?: number;
} = {}): Promise<ProductWithCategory[]> {
  // 카테고리 slug로 거르려면 조인 대상을 inner로 바꾼다
  const select = options.categorySlug ? "*, categories!inner(name, slug)" : PRODUCT_SELECT;
  let q = getSupabase().from("products").select(select).eq("is_active", true);

  if (options.categorySlug) q = q.eq("categories.slug", options.categorySlug);
  if (options.categoryId) q = q.eq("category_id", options.categoryId);
  if (options.query) {
    // PostgREST or() 문법을 깨뜨리는 문자는 공백으로 바꾼다
    const term = options.query.replace(/[,()*%\\]/g, " ").trim();
    if (term) q = q.or(`name.ilike.%${term}%,summary.ilike.%${term}%,sku.ilike.%${term}%,brand.ilike.%${term}%`);
  }

  switch (options.sort ?? "recommended") {
    case "newest":
      q = q.order("created_at", { ascending: false }).order("id", { ascending: false });
      break;
    case "price-asc":
      q = q.order("price", { ascending: true });
      break;
    case "price-desc":
      q = q.order("price", { ascending: false });
      break;
    case "name":
      q = q.order("name", { ascending: true });
      break;
    default:
      q = q.order("is_featured", { ascending: false }).order("category_id").order("id");
  }
  if (options.limit) q = q.limit(options.limit);

  const { data, error } = await q;
  if (error) throw error;
  return data as unknown as ProductWithCategory[];
}

export async function getProductBySlug(slug: string): Promise<ProductWithCategory | null> {
  const { data, error } = await getSupabase().from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as ProductWithCategory | null;
}

/** 관리자용: 판매 중지 상품까지 (RLS가 관리자에게만 허용) */
export async function getProductById(id: number): Promise<Product | null> {
  const { data, error } = await getSupabase().from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export type OrderWithItems = {
  order: Order;
  items: (OrderItem & { products: { slug: string } | null })[];
};

/** RLS로 본인 주문(관리자는 전체)만 조회된다 */
export async function getOrderWithItems(id: string): Promise<OrderWithItems | null> {
  const supabase = getSupabase();
  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase.from("order_items").select("*, products(slug)").eq("order_id", id).order("id"),
  ]);
  if (!order) return null;
  return { order, items: items ?? [] };
}
