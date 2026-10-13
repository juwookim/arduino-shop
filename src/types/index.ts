import type { Tables } from "./database";

export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;

export type ProductWithCategory = Product & {
  categories: Pick<Category, "name" | "slug"> | null;
};

export type ProductSpecs = Record<string, string | number>;
