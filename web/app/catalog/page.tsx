"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { getProducts, searchProducts, getCategories } from "@/lib/api";
import type { Product, Category } from "@/lib/api";

const SORT_OPTIONS = [
  { value: "popular", label: "Популярні" },
  { value: "newest", label: "Новинки" },
  { value: "price_asc", label: "Ціна ↑" },
  { value: "price_desc", label: "Ціна ↓" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("category_id")
    ? Number(searchParams.get("category_id"))
    : undefined;
  const sortParam = (searchParams.get("sort") ?? "popular") as SortValue;
  const inStockParam = searchParams.get("in_stock") === "true";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortValue>(sortParam);
  const [inStock, setInStock] = useState(inStockParam);
  const [selectedCat, setSelectedCat] = useState<number | undefined>(categoryId);

  // Load categories once
  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const updateUrl = useCallback(
    (params: { sort?: SortValue; in_stock?: boolean; category_id?: number; q?: string }) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (params.sort) sp.set("sort", params.sort);
      if (params.in_stock !== undefined) {
        if (params.in_stock) sp.set("in_stock", "true");
        else sp.delete("in_stock");
      }
      if (params.category_id !== undefined) {
        if (params.category_id) sp.set("category_id", String(params.category_id));
        else sp.delete("category_id");
      }
      router.push(`/catalog?${sp.toString()}`);
    },
    [searchParams, router]
  );

  // Load products
  useEffect(() => {
    setLoading(true);
    const doLoad = async () => {
      try {
        let data: Product[];
        if (q) {
          data = await searchProducts(q);
        } else {
          data = await getProducts({
            sort,
            in_stock: inStock || undefined,
            category_id: selectedCat,
            per_page: 48,
          });
        }
        setProducts(data);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    doLoad();
  }, [q, sort, inStock, selectedCat]);

  const handleSort = (v: SortValue) => {
    setSort(v);
    updateUrl({ sort: v });
  };

  const handleInStock = () => {
    const next = !inStock;
    setInStock(next);
    updateUrl({ in_stock: next });
  };

  const handleCat = (id: number | undefined) => {
    setSelectedCat(id);
    const sp = new URLSearchParams(searchParams.toString());
    if (id) sp.set("category_id", String(id));
    else sp.delete("category_id");
    router.push(`/catalog?${sp.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
      {/* Sidebar */}
      <aside className="hidden md:block w-56 shrink-0">
        <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-20">
          <h3 className="font-semibold text-gray-700 mb-3">Категорії</h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => handleCat(undefined)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                  !selectedCat ? "bg-primary text-white font-semibold" : "hover:bg-gray-100"
                }`}
              >
                Всі категорії
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => handleCat(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                    selectedCat === cat.id
                      ? "bg-primary text-white font-semibold"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {cat.name}
                  {cat.product_count > 0 && (
                    <span className="ml-1 text-xs opacity-70">({cat.product_count})</span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <hr className="my-4 border-gray-100" />

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={inStock}
              onChange={handleInStock}
              className="accent-primary w-4 h-4"
            />
            <span>Тільки в наявності</span>
          </label>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-xl font-bold">
            {q ? `Результати: «${q}»` : "Каталог"}
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-400">{products.length} товарів</span>
            )}
          </h1>

          {/* Sort pills */}
          <div className="flex gap-2 flex-wrap">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSort(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  sort === opt.value
                    ? "bg-primary text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skeleton / grid / empty */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg">Нічого не знайдено</p>
            <p className="text-sm mt-1">Спробуйте змінити фільтри</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 fade-up">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
        ))}
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
