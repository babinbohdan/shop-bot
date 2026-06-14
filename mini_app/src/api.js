// mini_app/src/api.js
// Централізовані запити до FastAPI бекенду.
// BASE_URL — в продакшені замініть на ваш домен.

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Список категорій
  getCategories: () => apiFetch("/categories"),

  // Товари категорії з пагінацією
  getProducts: (categoryId, page = 1) =>
    apiFetch(`/products?category_id=${categoryId}&page=${page}&per_page=20`),

  // Деталі одного товару
  getProduct: (productId) => apiFetch(`/products/${productId}`),

  // Оформлення замовлення — передаємо initData у заголовку для валідації
  createOrder: (payload, initData) =>
    apiFetch("/orders", {
      method: "POST",
      headers: { "x-telegram-init-data": initData },
      body: JSON.stringify(payload),
    }),
};
