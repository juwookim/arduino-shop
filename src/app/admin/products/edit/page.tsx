"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { productHref } from "@/components/product/ProductCard";
import { useAsync } from "@/hooks/use-async";
import { deleteProduct } from "@/lib/actions";
import { getCategories, getProductById } from "@/lib/queries";

/** ?id= 가 있으면 수정, 없으면 새 상품 등록 */
function EditProduct() {
  const router = useRouter();
  const id = Number(useSearchParams().get("id")) || null;
  const { data: categories } = useAsync(getCategories, []);
  const { data: product, loading } = useAsync(() => (id ? getProductById(id) : Promise.resolve(null)), [id]);

  async function onDelete() {
    if (!product || !window.confirm(`'${product.name}' 상품을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    const result = await deleteProduct(product.id);
    if (result.ok) router.push("/admin/products");
    else window.alert(`삭제 실패: ${result.error}`);
  }

  if (loading || !categories) return <div className="card h-96 animate-pulse" />;
  if (id && !product) return <p className="card p-10 text-center text-muted">상품을 찾을 수 없습니다.</p>;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{product ? "상품 수정" : "상품 등록"}</h1>
        {product && (
          <div className="flex gap-2">
            <Link href={productHref(product.slug)} className="btn-outline" target="_blank">
              쇼핑몰에서 보기
            </Link>
            <button type="button" onClick={onDelete} className="btn-danger">삭제</button>
          </div>
        )}
      </div>
      <ProductForm key={product?.id ?? "new"} product={product ?? undefined} categories={categories} />
    </div>
  );
}

export default function EditProductPage() {
  return (
    <Suspense>
      <EditProduct />
    </Suspense>
  );
}
