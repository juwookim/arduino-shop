import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { asset } from "@/lib/paths";
import type { ProductWithCategory } from "@/types";

export function productHref(slug: string) {
  return `/product?slug=${encodeURIComponent(slug)}`;
}

export function ProductCard({ product }: { product: ProductWithCategory }) {
  const soldOut = product.stock <= 0;

  return (
    <Link
      href={productHref(product.slug)}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-white">
        {product.image_url ? (
          <Image
            src={asset(product.image_url)}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain p-3 transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted">이미지 없음</div>
        )}
        {product.is_featured && (
          <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
            추천
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-bold text-muted">
            품절
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-line p-3">
        {product.categories && <span className="text-xs text-brand">{product.categories.name}</span>}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
        {product.summary && <p className="line-clamp-1 text-xs text-muted">{product.summary}</p>}
        <p className="mt-auto pt-2 text-base font-bold">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, loading }: { products?: ProductWithCategory[]; loading?: boolean }) {
  if (loading || !products) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="card aspect-[3/4] animate-pulse" />
        ))}
      </div>
    );
  }
  if (products.length === 0) {
    return <p className="card p-10 text-center text-muted">조건에 맞는 상품이 없습니다.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
