"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveProduct } from "@/lib/actions";
import { asset } from "@/lib/paths";
import type { Category, Product } from "@/types";

type Props = { product?: Product; categories: Category[] };

function specsToText(specs: Product["specs"] | undefined) {
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return "";
  return Object.entries(specs)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export function ProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<string | null>(product?.image_url ? asset(product.image_url) : null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await saveProduct(new FormData(e.currentTarget));
    if (result.ok) {
      router.push("/admin/products");
    } else {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="image_url" value={product?.image_url ?? ""} />

      <div className="card space-y-4 p-5">
        <div>
          <label htmlFor="name" className="label">상품명</label>
          <input id="name" name="name" required defaultValue={product?.name} className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="slug" className="label">URL 이름</label>
            <input
              id="slug"
              name="slug"
              required
              defaultValue={product?.slug}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="arduino-uno-r3"
              className="input font-mono"
            />
            <p className="mt-1 text-xs text-muted">/products/URL이름 으로 접속됩니다.</p>
          </div>
          <div>
            <label htmlFor="category_id" className="label">카테고리</label>
            <select id="category_id" name="category_id" defaultValue={product?.category_id ?? ""} className="input">
              <option value="">선택 안 함</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="price" className="label">판매가 (원)</label>
            <input id="price" name="price" type="number" min={0} required defaultValue={product?.price} className="input" />
          </div>
          <div>
            <label htmlFor="stock" className="label">재고</label>
            <input id="stock" name="stock" type="number" min={0} required defaultValue={product?.stock ?? 0} className="input" />
          </div>
          <div>
            <label htmlFor="sku" className="label">모델명</label>
            <input id="sku" name="sku" defaultValue={product?.sku ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="brand" className="label">브랜드</label>
            <input id="brand" name="brand" defaultValue={product?.brand ?? ""} className="input" />
          </div>
        </div>
        <div>
          <label htmlFor="summary" className="label">한 줄 소개</label>
          <input id="summary" name="summary" defaultValue={product?.summary ?? ""} className="input" />
        </div>
        <div>
          <label htmlFor="description" className="label">상세 설명</label>
          <textarea id="description" name="description" rows={4} defaultValue={product?.description ?? ""} className="input" />
        </div>
        <div>
          <label htmlFor="specs" className="label">사양 (한 줄에 &quot;항목: 값&quot;)</label>
          <textarea
            id="specs"
            name="specs"
            rows={6}
            defaultValue={specsToText(product?.specs)}
            placeholder={"MCU: ATmega328P\n동작 전압: 5V"}
            className="input font-mono"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="card space-y-3 p-5">
          <p className="label">상품 이미지</p>
          <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-white">
            {preview ? (
              <Image src={preview} alt="미리보기" fill sizes="300px" className="object-contain p-2" unoptimized={preview.startsWith("blob:")} />
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted">이미지 없음</div>
            )}
          </div>
          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPreview(URL.createObjectURL(file));
            }}
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-2 file:text-brand"
          />
          <p className="text-xs text-muted">5MB 이하. 새로 올리면 기존 이미지를 대체합니다.</p>
        </div>

        <div className="card space-y-3 p-5 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="h-4 w-4 accent-brand" />
            판매중 (끄면 쇼핑몰에서 숨김)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} className="h-4 w-4 accent-brand" />
            메인 추천 상품
          </label>
        </div>

        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</p>}
        <div className="flex gap-2">
          <Link href="/admin/products" className="btn-outline flex-1">취소</Link>
          <button type="submit" disabled={pending} className="btn-primary flex-1">
            {pending ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </form>
  );
}
