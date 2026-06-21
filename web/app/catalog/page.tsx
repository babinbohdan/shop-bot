"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { getProducts, searchProducts, getCategories } from "@/lib/api";
import type { Product, Category } from "@/lib/api";

const SORT_OPTIONS = [
  { value: "popular",    label: "Популярні" },
  { value: "newest",     label: "Новинки" },
  { value: "price_asc",  label: "Ціна ↑" },
  { value: "price_desc", label: "Ціна ↓" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q          = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("category_id") ? Number(searchParams.get("category_id")) : undefined;
  const sortParam  = (searchParams.get("sort") ?? "popular") as SortValue;
  const inStockParam = searchParams.get("in_stock") === "true";

  const [products,     setProducts]     = useState<Product[]>([]);
  const [categories,   setCategories]   = useState<Category[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [sort,         setSort]         = useState<SortValue>(sortParam);
  const [inStock,      setInStock]      = useState(inStockParam);
  const [selectedCat,  setSelectedCat]  = useState<number | undefined>(categoryId);

  useEffect(() => { getCategories().then(setCategories).catch(() => {}); }, []);

  const updateUrl = useCallback((params: Partial<{ sort: SortValue; in_stock: boolean; category_id: number | undefined }>) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (params.sort !== undefined) sp.set("sort", params.sort);
    if (params.in_stock !== undefined) { params.in_stock ? sp.set("in_stock", "true") : sp.delete("in_stock"); }
    if ("category_id" in params) { params.category_id ? sp.set("category_id", String(params.category_id)) : sp.delete("category_id"); }
    router.push(`/catalog?${sp.toString()}`);
  }, [searchParams, router]);

  useEffect(() => {
    setLoading(true);
    const doLoad = async () => {
      try {
        let data: Product[];
        if (q) {
          data = await searchProducts(q);
        } else if (selectedCat) {
          data = await getProducts({ sort, in_stock: inStock || undefined, category_id: selectedCat, per_page: 48 });
        } else {
          // No category — load first available
          const cats = categories.length ? categories : await getCategories().catch(() => []);
          const firstId = cats[0]?.id;
          data = firstId ? await getProducts({ sort, category_id: firstId, per_page: 48 }) : [];
        }
        setProducts(data);
      } catch { setProducts([]); }
      finally  { setLoading(false); }
    };
    doLoad();
  }, [q, sort, inStock, selectedCat, categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
      {/* Sidebar */}
      <aside className="hidden md:block w-52 shrink-0">
        <div className="card-bordered bg-surface rounded-lg p-4 sticky top-20">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Категорії</h3>
          <ul className="space-y-0.5">
            <li>
              <button onClick={() => { setSelectedCat(undefined); updateUrl({ category_id: undefined }); }}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${!selectedCat ? "bg-gold text-bg font-medium" : "text-muted hover:text-ink"}`}>
                Всі
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button onClick={() => { setSelectedCat(cat.id); updateUrl({ category_id: cat.id }); }}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${selectedCat === cat.id ? "bg-gold text-bg font-medium" : "text-muted hover:text-ink"}`}>
                  {cat.name}
                  {cat.product_count > 0 && <span className="ml-1 opacity-50">({cat.product_count})</span>}
                </button>
              </li>
            ))}
          </ul>
          <hr className="my-4 border-border" />
          <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
            <input type="checkbox" checked={inStock} onChange={() => { const n = !inStock; setInStock(n); updateUrl({ in_stock: n }); }}
              className="accent-gold w-4 h-4" />
            <span>В наявності</span>
          </label>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-xl font-semibold text-ink">
            {q ? `Результати: «${q}»` : "Каталог"}
            {!loading && <span className="ml-2 text-sm font-normal text-muted">{products.length} товарів</span>}
          </h1>
          <div className="flex gap-2 flex-wrap">
            {SORT_OPTIONS.map((opt) => (
              <button key={opt.value}
                onClick={() => { setSort(opt.value); updateUrl({ sort: opt.value }); }}
                className={`px-3 py-1.5 rounded text-sm transition-colors border ${
                  sort === opt.value
                    ? "bg-gold text-bg border-gold font-medium"
                    : "border-border text-muted hover:border-gold hover:text-ink"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border border-border rounded-lg h-64 animate-pulse bg-surface" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 text-muted">
            <div className="text-5xl mb-4">✦</div>
            <p className="text-lg text-ink">Нічого не знайдено</p>
            <p className="text-sm mt-1">Оберіть іншу категорію або змініть фільтри</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 fade-up">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
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
          <div key={i} className="border border-border rounded-lg h-64 animate-pulse bg-surface" />
        ))}
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
