import { apiFetch } from "./fetcher";

export type Category = {
  id: string;
  name: string;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  image: string | null;
  barcode: string | null;
  sku: string | null;
  costPrice?: number;
  sellPrice: number;
  categoryId: string | null;
  categoryName?: string | null;
  stockQty: number;
  minStock: number | null;
  createdAt: string;
  updatedAt: string;
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type ProductInput = {
  name: string;
  image?: string | null;
  barcode?: string | null;
  sku?: string | null;
  costPrice: number;
  sellPrice: number;
  categoryId?: string | null;
  stockQty: number;
  minStock?: number | null;
};

export function listCategories() {
  return apiFetch<{ items: Category[] }>("/api/categories");
}

export function createCategory(body: { name: string }) {
  return apiFetch<Category>("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function updateCategory(id: string, body: { name: string }) {
  return apiFetch<Category>(`/api/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function deleteCategory(id: string) {
  return apiFetch<void>(`/api/categories/${id}`, { method: "DELETE" });
}

export function listProducts(params: {
  limit?: number;
  cursor?: string | null;
  q?: string;
  categoryId?: string;
  lowStock?: boolean;
}) {
  const sp = new URLSearchParams();
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.cursor) sp.set("cursor", params.cursor);
  if (params.q) sp.set("q", params.q);
  if (params.categoryId) sp.set("categoryId", params.categoryId);
  if (params.lowStock) sp.set("lowStock", "1");
  const qs = sp.toString();
  return apiFetch<CursorPage<Product>>(
    `/api/products${qs ? `?${qs}` : ""}`,
  );
}

export function createProduct(body: ProductInput) {
  return apiFetch<Product>("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function updateProduct(id: string, body: Partial<ProductInput>) {
  return apiFetch<Product>(`/api/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function deleteProduct(id: string) {
  return apiFetch<void>(`/api/products/${id}`, { method: "DELETE" });
}

export async function uploadProductImage(file: File): Promise<string | null> {
  const key = `uploads/products/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  try {
    const presign = await apiFetch<{ uploadUrl: string; key: string }>(
      "/api/upload/presign",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          contentType: file.type || "image/jpeg",
        }),
      },
    );
    const put = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "image/jpeg" },
      body: file,
    });
    if (!put.ok) return null;
    return presign.key;
  } catch {
    return null;
  }
}
