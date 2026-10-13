import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductListing } from "@/components/product/ProductListing";

export const metadata: Metadata = { title: "상품" };

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductListing />
    </Suspense>
  );
}
