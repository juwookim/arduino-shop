"use client";

import Image from "next/image";
import Link from "next/link";
import { useAsync } from "@/hooks/use-async";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/format";
import { asset } from "@/lib/paths";
import { getCategories, getProducts } from "@/lib/queries";
import { ProductGrid, productHref } from "./ProductCard";

export function HomeView() {
  const { data: categories } = useAsync(getCategories, []);
  const { data: products, loading } = useAsync(() => getProducts(), []);
  const featured = products?.filter((p) => p.is_featured).slice(0, 8);
  const starters = products?.filter((p) => p.price < 10000).slice(0, 4) ?? [];

  // 카테고리 타일에 쓸 대표 이미지: 각 카테고리의 첫 상품
  const coverFor = (categoryId: number) =>
    products?.find((p) => p.category_id === categoryId && p.image_url)?.image_url ?? null;

  return (
    <>
      <section className="relative overflow-hidden bg-foreground text-white">
        <Image
          src={asset("/images/banners/hero-uno.jpg")}
          alt="책상 위의 아두이노 우노 보드"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div className="container-page relative py-20 sm:py-28">
          <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-sm backdrop-blur">
            {formatPrice(FREE_SHIPPING_THRESHOLD)} 이상 무료배송
          </p>
          <h1 className="max-w-xl text-3xl font-bold leading-tight sm:text-5xl">
            만들고 싶은 것이 있다면,
            <br />
            부품은 여기서.
          </h1>
          <p className="mt-4 max-w-lg text-white/85">
            아두이노 정품 보드부터 센서, 모터, 입문 키트까지. 스펙을 한눈에 비교하고 바로 주문하세요.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className="btn-primary px-6 py-3">
              전체 상품 보기
            </Link>
            <Link href="/products?category=kits" className="btn border border-white/40 px-6 py-3 text-white hover:bg-white/10">
              입문 키트
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <h2 className="mb-5 text-xl font-bold">카테고리</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(categories ?? []).map((c) => {
            const cover = coverFor(c.id);
            return (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="card group flex flex-col items-center gap-2 p-4 text-center transition hover:border-brand"
              >
                <div className="relative h-20 w-full">
                  {cover && (
                    <Image src={asset(cover)} alt="" fill sizes="160px" className="object-contain transition group-hover:scale-105" />
                  )}
                </div>
                <span className="font-semibold group-hover:text-brand">{c.name}</span>
              </Link>
            );
          })}
          {!categories && Array.from({ length: 6 }, (_, i) => <div key={i} className="card h-36 animate-pulse" />)}
        </div>
      </section>

      <section className="container-page pb-12">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-xl font-bold">추천 상품</h2>
          <Link href="/products" className="text-sm text-muted hover:text-brand">
            전체 보기 →
          </Link>
        </div>
        <ProductGrid products={featured} loading={loading} />
      </section>

      <section className="container-page pb-4">
        <div className="card grid items-center gap-6 overflow-hidden sm:grid-cols-2">
          <div className="relative aspect-[16/10] sm:aspect-auto sm:h-full sm:min-h-64">
            <Image
              src={asset("/images/banners/hero-breadboard.jpg")}
              alt="브레드보드에 LED와 배터리를 연결한 회로"
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="p-6 sm:pr-10">
            <p className="text-sm font-semibold text-accent">처음이라면</p>
            <h2 className="mt-1 text-2xl font-bold">1만 원 이하로 시작하는 첫 회로</h2>
            <p className="mt-2 text-sm text-muted">브레드보드와 점퍼선, 센서 하나면 첫 프로젝트를 시작할 수 있어요.</p>
            <ul className="mt-4 space-y-2 text-sm">
              {starters.map((p) => (
                <li key={p.id} className="flex justify-between gap-4 border-b border-line pb-2">
                  <Link href={productHref(p.slug)} className="hover:text-brand">
                    {p.name}
                  </Link>
                  <span className="shrink-0 font-semibold">{formatPrice(p.price)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
