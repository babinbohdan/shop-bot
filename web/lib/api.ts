// lib/api.ts — TypeScript клієнт для FastAPI бекенду

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  product_count: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  old_price: number | null;
  image_url: string | null;
  in_stock: boolean;
  vendor: string | null;
  description?: string;
  category_id?: number;
  category_name?: string;
  barcode?: string | null;
}

export interface PromoResult {
  valid: boolean;
  discount_type?: "percent" | "fixed";
  discount_value?: number;
  message?: string;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const getCategories = (): Promise<Category[]> =>
  apiFetch("/api/categories");

// ─── Products ─────────────────────────────────────────────────────────────────

export interface ProductsParams {
  category_id?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "popular";
  in_stock?: boolean;
  page?: number;
  per_page?: number;
}

interface ProductsResponse {
  items: Product[];
  total: number;
  page: number;
  pages: number;
  per_page: number;
}

const SORT_MAP: Record<string, string> = {
  popular: "name",
  newest: "newest",
  price_asc: "price_asc",
  price_desc: "price_desc",
};

export const getProducts = async (params: ProductsParams = {}): Promise<Product[]> => {
  if (!params.category_id) return [];
  const qs = new URLSearchParams();
  qs.set("category_id", String(params.category_id));
  if (params.sort) qs.set("sort", SORT_MAP[params.sort] ?? "name");
  if (params.in_stock) qs.set("in_stock_only", "true");
  if (params.page) qs.set("page", String(params.page));
  if (params.per_page) qs.set("per_page", String(params.per_page));
  const res = await apiFetch<ProductsResponse>(`/api/products?${qs}`);
  return Array.isArray(res) ? res : (res.items ?? []);
};

export const searchProducts = async (q: string): Promise<Product[]> => {
  const res = await apiFetch<ProductsResponse | Product[]>(
    `/api/products/search?q=${encodeURIComponent(q)}`
  );
  return Array.isArray(res) ? res : (res as ProductsResponse).items ?? [];
};

export const getProduct = (id: number): Promise<Product> =>
  apiFetch(`/api/products/${id}`);

export const getSimilarProducts = (id: number): Promise<Product[]> =>
  apiFetch(`/api/products/${id}/similar`);

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface OrderIn {
  full_name: string;
  phone: string;
  city: string;
  delivery_type: "nova_poshta" | "ukrposhta" | "courier" | "pickup";
  delivery_address?: string;
  promo_code?: string;
  items: { product_id: number; quantity: number }[];
}

export const createOrder = (
  order: OrderIn
): Promise<{ order_id: string; order_number: string }> =>
  apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(order),
  });

// ─── Promo codes ──────────────────────────────────────────────────────────────

export const validatePromo = (code: string, total: number): Promise<PromoResult> =>
  apiFetch("/api/promo/validate", {
    method: "POST",
    body: JSON.stringify({ code, order_total: total }),
  });
