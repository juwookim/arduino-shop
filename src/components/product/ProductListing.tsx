"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAsync } from "@/hooks/use-async";
import { getCategories, getProducts, parseSort, SORT_OPTIONS } from "@/lib/queries";
import { ProductGrid } from "./ProductCard";
import { SortSelect } from "./SortSelect";

/** 전체 상품 / 카테고리(?category=) / 검색(?q=) 을 한 화면에서 처리한다 */
export function ProductListing() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category") ?? undefined;
  const query = searchParams.get("q")?.trim() || undefined;
  const sort = parseSort(searchParams.get("sort"));

  const { data: categories } = useAsync(getCategories, []);
  const { data: products, loading, error } = useAsync(
    () => getProducts({ categorySlug, query, sort }),
    [categorySlug, query, sort],
  );

  const category = categories?.find((c) => c.slug === categorySlug);
  const title = query ? `'${query}' 검색 결과` : (category?.name ?? "전체 상품");
  const description = query ? null : (category?.description ?? "아두이노 보드, 센서, 모듈, 모터, 부품, 키트");

  return (
    <div className="container-page py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>

      {!query && (
        <div className="mb-5 flex flex-wrap gap-2">
          <CategoryChip href="/products" active={!categorySlug} label="전체" />
          {categories?.map((c) => (
            <CategoryChip key={c.id} href={`/products?category=${c.slug}`} active={c.slug === categorySlug} label={c.name} />
          ))}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          상품 <strong className="text-foreground">{products?.length ?? "-"}</strong>개
        </p>
        <SortSelect options={SORT_OPTIONS} value={sort} />
      </div>

      {error ? (
        <p className="card p-10 text-center text-danger">상품을 불러오지 못했습니다. ({error})</p>
      ) : (
        <ProductGrid products={products} loading={loading} />
      )}
    </div>
  );
}

function CategoryChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-1.5 text-sm transition ${
        active ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-brand hover:text-brand"
      }`}
    >
      {label}
    </Link>
  );
}
