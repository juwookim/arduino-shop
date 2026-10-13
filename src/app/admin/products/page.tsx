"use client";

import Image from "next/image";
import Link from "next/link";
import { useAsync } from "@/hooks/use-async";
import { formatPrice } from "@/lib/format";
import { asset } from "@/lib/paths";
import { getSupabase } from "@/lib/supabase/client";

async function getAllProducts() {
  // 관리자는 RLS상 판매 중지 상품도 볼 수 있다
  const { data, error } = await getSupabase()
    .from("products")
    .select("id, name, slug, sku, price, stock, image_url, is_active, is_featured, categories(name)")
    .order("category_id")
    .order("id");
  if (error) throw error;
  return data;
}

export default function AdminProductsPage() {
  const { data: products } = useAsync(getAllProducts, []);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">상품 관리</h1>
        <Link href="/admin/products/edit" className="btn-primary">+ 상품 등록</Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-background text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">상품</th>
              <th className="px-4 py-3 font-medium">카테고리</th>
              <th className="px-4 py-3 text-right font-medium">가격</th>
              <th className="px-4 py-3 text-right font-medium">재고</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!products && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-muted">불러오는 중…</td>
              </tr>
            )}
            {products?.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-line bg-white">
                      {p.image_url && <Image src={asset(p.image_url)} alt="" fill sizes="40px" className="object-contain" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="text-xs text-muted">{p.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted">{p.categories?.name ?? "-"}</td>
                <td className="px-4 py-2.5 text-right">{formatPrice(p.price)}</td>
                <td className={`px-4 py-2.5 text-right ${p.stock < 10 ? "font-semibold text-accent" : ""}`}>{p.stock}</td>
                <td className="px-4 py-2.5">
                  <span className={p.is_active ? "text-brand" : "text-muted"}>{p.is_active ? "판매중" : "숨김"}</span>
                  {p.is_featured && <span className="ml-1 text-xs text-accent">추천</span>}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link href={`/admin/products/edit?id=${p.id}`} className="font-medium text-brand hover:underline">수정</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
