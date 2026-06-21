"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCategories, getProducts, searchProducts } from "@/lib/api";
import type { Category, Product, ProductsParams } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

const SORT_OPTIONS = [
  { value: "popular", label: "Популярні" },
  { value: "newest", label: "Новинки" },
  { value: "price_asc", label: "Ціна ↑" },
  { value: "price_desc", label: "Ціна ↓" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export default function CatalogPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const catId = params.get("category") ? Number(params.get("category")) : undefined;
  const sort = (params.get("sort") ?? "popular") as SortValue;
  const query = params.get("q") ?? "";
  const inStock = params.get("in_stock") === "true";

  const updateParam = (key: string, value: string | null) => {
    const sp = new URLSearchParams(params.toString());
    if (value === null || value === "") sp.delete(key);
    else sp.set(key, value);
    router.push(`/catalog?${sp}`);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let data: Product[];
      if (query) {
        data = await searchProducts(query);
      } else {
        const p: ProductsParams = { sort, per_page: 40 };
        if (catId) p.category_id = catId;
        if (inStock) p.in_stock = true;
        data = await getProducts(p);
      }
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [catId, sort, query, inStock]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 fade-up">
      <h1 className="text-2xl font-extrabold mb-6 text-gray-800">
        {query ? `Результати пошуку: "${query}"` : "Каталог товарів"}
      </h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* ─── Sidebar filters ─────────────────────────────────────── */}
        <aside className="w-full md:w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-5 sticky top-20">
            {/* Categories */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Категорія
              </p>
              <button
                onClick={() => updateParam("category", null)}
                className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg mb-1 transition
                  ${!catId ? "bg-blue-50 text-[#2481cc] font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
              >
                Всі категорії
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => updateParam("category", String(cat.id))}
                  className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg mb-0.5 transition
                    ${catId === cat.id ? "bg-blue-50 text-[#2481cc] font-semibold" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {cat.name}
                  <span className="ml-1 text-xs text-gray-400">({cat.product_count})</span>
                </button>
              ))}
            </div>

            {/* In stock toggle */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => updateParam("in_stock", e.target.checked ? "true" : null)}
                  className="w-4 h-4 accent-[#2481cc]"
                />
                <span className="text-sm text-gray-700">Тільки в наявності</span>
              </label>
            </div>
          </div>
        </aside>

        {/* ─── Products grid ───────────────────────────────────────── */}
        <div className="flex-1">
          {/* Sort bar */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParam("sort", opt.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition
                  ${sort === opt.value
                    ? "bg-[#2481cc] text-white border-[#2481cc]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#2481cc]"}`}
              >
                {opt.label}
              </button>
            ))}
            <span className="ml-auto text-sm text-gray-400">
              {loading ? "..." : `${products.length} товарів`}
            </span>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-72 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-gray-500 text-lg">Нічого не знайдено</p>
              <p className="text-gray-400 text-sm mt-1">Спробуйте змінити фільтри або пошуковий запит</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
