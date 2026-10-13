"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAsync } from "@/hooks/use-async";
import { FREE_SHIPPING_THRESHOLD, formatPrice, SHIPPING_FEE } from "@/lib/format";
import { asset } from "@/lib/paths";
import { getProductBySlug, getProducts } from "@/lib/queries";
import { AddToCart } from "./AddToCart";
import { ProductGrid } from "./ProductCard";
import { SpecTable } from "./SpecTable";

export function ProductDetail() {
  const slug = useSearchParams().get("slug") ?? "";
  const { data: product, loading } = useAsync(() => (slug ? getProductBySlug(slug) : Promise.resolve(null)), [slug]);
  const categoryId = product?.category_id ?? undefined;
  const { data: sameCategory } = useAsync(
    () => (categoryId ? getProducts({ categoryId, limit: 5 }) : Promise.resolve([])),
    [categoryId],
  );
  const related = sameCategory?.filter((p) => p.id !== product?.id).slice(0, 4) ?? [];

  useEffect(() => {
    if (product) document.title = `${product.name} | 메이커파츠`;
  }, [product]);

  if (loading) {
    return (
      <div className="container-page grid gap-8 py-8 lg:grid-cols-2">
        <div className="card aspect-square animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 animate-pulse rounded bg-line" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-line" />
        </div>
      </div>
    );
  }

  if (!product || !product.is_active) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="text-xl font-bold">상품을 찾을 수 없습니다</h1>
        <p className="mt-2 text-sm text-muted">판매가 끝났거나 주소가 잘못되었을 수 있어요.</p>
        <Link href="/products" className="btn-primary mt-6">전체 상품 보기</Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <nav className="mb-5 text-sm text-muted" aria-label="경로">
        <Link href="/" className="hover:text-brand">홈</Link>
        {product.categories && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/products?category=${product.categories.slug}`} className="hover:text-brand">
              {product.categories.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card relative aspect-square overflow-hidden bg-white">
          {product.image_url && (
            <Image
              src={asset(product.image_url)}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain p-6"
            />
          )}
        </div>

        <div>
          {product.brand && <p className="text-sm font-semibold text-brand">{product.brand}</p>}
          <h1 className="mt-1 text-2xl font-bold leading-snug sm:text-3xl">{product.name}</h1>
          {product.summary && <p className="mt-2 text-muted">{product.summary}</p>}
          <p className="mt-5 text-3xl font-bold">{formatPrice(product.price)}</p>

          <dl className="mt-5 space-y-2 border-y border-line py-4 text-sm">
            <div className="flex gap-4">
              <dt className="w-20 text-muted">모델명</dt>
              <dd>{product.sku ?? "-"}</dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-20 text-muted">배송비</dt>
              <dd>
                {formatPrice(SHIPPING_FEE)} ({formatPrice(FREE_SHIPPING_THRESHOLD)} 이상 무료)
              </dd>
            </div>
            <div className="flex gap-4">
              <dt className="w-20 text-muted">재고</dt>
              <dd className={product.stock > 0 && product.stock < 10 ? "font-semibold text-accent" : ""}>
                {product.stock > 0 ? `${product.stock}개` : "품절"}
              </dd>
            </div>
          </dl>

          <div className="mt-5">
            <AddToCart
              key={product.id}
              product={{
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                imageUrl: product.image_url,
                stock: product.stock,
              }}
            />
          </div>
        </div>
      </div>

      <section className="mt-12 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-bold">상품 설명</h2>
          <p className="leading-relaxed text-muted">{product.description ?? product.summary}</p>
          {product.source_url && (
            <p className="mt-4 text-xs text-muted">
              가격·사양 기준:{" "}
              <a href={product.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">
                디바이스마트 상품 페이지
              </a>
            </p>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-lg font-bold">주요 사양</h2>
          <SpecTable specs={product.specs} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-lg font-bold">같은 카테고리 상품</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
