"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { getProducts, searchProducts, getCategories } from "@/lib/api";
import type { Product, Category } from "@/lib/api";

const SORT_OPTIONS = [
  { value: "popular",    label: "ПОПУЛЯРНІ" },
  { value: "newest",     label: "НОВИНКИ" },
  { value: "price_asc",  label: "ЦІНА ↑" },
  { value: "price_desc", label: "ЦІНА ↓" },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q           = searchParams.get("q") ?? "";
  const categoryId  = searchParams.get("category_id") ? Number(searchParams.get("category_id")) : undefined;
  const sortParam   = (searchParams.get("sort") ?? "popular") as SortValue;
  const inStockParam = searchParams.get("in_stock") === "true";

  const [products,    setProducts]    = useState<Product[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [sort,        setSort]        = useState<SortValue>(sortParam);
  const [inStock,     setInStock]     = useState(inStockParam);
  const [selectedCat, setSelectedCat] = useState<number | undefined>(categoryId);

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
          const cats = categories.length ? categories : await getCategories().catch(() => []);
          data = cats[0]?.id ? await getProducts({ sort, category_id: cats[0].id, per_page: 48 }) : [];
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
        <div className="bg-white border-2 border-ink p-3 sticky top-16 shadow-[4px_4px_0px_#111]">
          <h3 className="text-xs font-black text-ink uppercase tracking-widest mb-3 border-b-2 border-ink pb-2">Категорії</h3>
          <ul className="space-y-0.5">
            <li>
              <button onClick={() => { setSelectedCat(undefined); updateUrl({ category_id: undefined }); }}
                className={`w-full text-left px-2 py-1.5 text-xs font-black uppercase tracking-wide transition-colors ${
                  !selectedCat ? "bg-ink text-primary" : "text-ink hover:bg-primary"
                }`}>
                Всі товари
              </button>
            </li>
            {categories.map((cat) => (
              <li key={cat.id}>
                <button onClick={() => { setSelectedCat(cat.id); updateUrl({ category_id: cat.id }); }}
                  className={`w-full text-left px-2 py-1.5 text-xs font-black uppercase tracking-wide transition-colors ${
                    selectedCat === cat.id ? "bg-ink text-primary" : "text-ink hover:bg-primary"
                  }`}>
                  {cat.name}
                  {cat.product_count > 0 && <span className="ml-1 opacity-50">({cat.product_count})</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t-2 border-ink mt-3 pt-3">
            <label className="flex items-center gap-2 text-xs font-black text-ink uppercase cursor-pointer select-none">
              <input type="checkbox" checked={inStock} onChange={() => { const n = !inStock; setInStock(n); updateUrl({ in_stock: n }); }}
                className="accent-ink w-4 h-4" />
              В наявності
            </label>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h1 className="text-2xl font-black text-ink uppercase tracking-tight">
            {q ? `«${q}»` : "Каталог"}
            {!loading && <span className="ml-2 text-sm font-bold text-muted normal-case">{products.length} товарів</span>}
          </h1>
          <div className="flex gap-2 flex-wrap">
            {SORT_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => { setSort(opt.value); updateUrl({ sort: opt.value }); }}
                className={`px-3 py-1.5 text-xs font-black border-2 border-ink transition-colors uppercase tracking-wide ${
                  sort === opt.value ? "bg-ink text-primary" : "bg-white text-ink hover:bg-primary"
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border-2 border-ink h-64 animate-pulse shadow-[4px_4px_0px_#111]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-xl font-black text-ink uppercase">Нічого не знайдено</p>
            <p className="text-sm font-bold text-muted mt-1 uppercase">Оберіть іншу категорію</p>
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
          <div key={i} className="bg-white border-2 border-ink h-64 animate-pulse shadow-[4px_4px_0px_#111]" />
        ))}
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
