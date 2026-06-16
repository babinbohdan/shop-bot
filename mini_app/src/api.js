// mini_app/src/api.js
// Централізовані запити до FastAPI бекенду.

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function apiFetch(path, options = {}) {
  const { headers: extraHeaders, ...restOptions } = options;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...extraHeaders },
    ...restOptions,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = Array.isArray(err.detail)
      ? err.detail.map((e) => e.msg || JSON.stringify(e)).join(", ")
      : err.detail || `HTTP ${res.status}`;
    throw new Error(String(detail));
  }

  return res.json();
}

export const api = {
  // Каталог
  getCategories: () => apiFetch("/categories"),

  // Товари категорії з фільтрами/сортуванням
  getProducts: (categoryId, page = 1, filters = {}) => {
    const params = new URLSearchParams({ category_id: categoryId, page, per_page: 20 });
    if (filters.price_min != null) params.set("price_min", filters.price_min);
    if (filters.price_max != null) params.set("price_max", filters.price_max);
    if (filters.in_stock_only === false) params.set("in_stock_only", "false");
    if (filters.sort) params.set("sort", filters.sort);
    return apiFetch(`/products?${params}`);
  },

  // Пошук
  searchProducts: (q, page = 1, sort = "name") =>
    apiFetch(`/products/search?q=${encodeURIComponent(q)}&page=${page}&per_page=20&sort=${sort}`),

  // Деталі товару
  getProduct: (productId) => apiFetch(`/products/${productId}`),

  // Схожі товари
  getSimilarProducts: (productId) => apiFetch(`/products/${productId}/similar`),

  // Оформлення замовлення
  createOrder: (payload, initData) =>
    apiFetch("/orders", {
      method: "POST",
      headers: { "x-telegram-init-data": initData },
      body: JSON.stringify(payload),
    }),

  // Історія замовлень
  getOrderHistory: (initData) =>
    apiFetch("/orders/history", {
      headers: { "x-telegram-init-data": initData },
    }),

  // Промокоди
  validatePromo: (code, orderTotal, initData) =>
    apiFetch("/promo/validate", {
      method: "POST",
      headers: { "x-telegram-init-data": initData },
      body: JSON.stringify({ code, order_total: orderTotal }),
    }),

  // Вішліст
  getWishlist: (initData) =>
    apiFetch("/wishlist", { headers: { "x-telegram-init-data": initData } }),
  getWishlistIds: (initData) =>
    apiFetch("/wishlist/ids", { headers: { "x-telegram-init-data": initData } }),
  addToWishlist: (productId, initData) =>
    apiFetch(`/wishlist/${productId}`, {
      method: "POST",
      headers: { "x-telegram-init-data": initData },
    }),
  removeFromWishlist: (productId, initData) =>
    apiFetch(`/wishlist/${productId}`, {
      method: "DELETE",
      headers: { "x-telegram-init-data": initData },
    }),
};
