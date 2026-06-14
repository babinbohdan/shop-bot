// mini_app/src/pages/CategoryPage.jsx
// Сторінка категорії — товари з фільтрами та сортуванням.

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "../api";
import ProductCard from "../components/ProductCard";
import { Loader, ErrorMsg } from "./CatalogPage";

const SORT_OPTIONS = [
  { val: "name",       label: "А-Я" },
  { val: "price_asc",  label: "Ціна ↑" },
  { val: "price_desc", label: "Ціна ↓" },
  { val: "discount",   label: "Знижки" },
];

export default function CategoryPage({ category, onSelectProduct }) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Фільтри
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState("name");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [inStockOnly, setInStockOnly] = useState(true);

  // Активні фільтри (застосовані)
  const [appliedFilters, setAppliedFilters] = useState({ sort: "name", in_stock_only: true });
  const hasActiveFilters =
    appliedFilters.sort !== "name" ||
    appliedFilters.price_min != null ||
    appliedFilters.price_max != null ||
    appliedFilters.in_stock_only === false;

  const observerRef = useRef(null);

  const buildFilters = () => ({
    sort,
    in_stock_only: inStockOnly,
    ...(priceMin !== "" ? { price_min: Number(priceMin) } : {}),
    ...(priceMax !== "" ? { price_max: Number(priceMax) } : {}),
  });

  const loadMore = useCallback(async (pageNum, filters, append) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await api.getProducts(category.id, pageNum, filters);
      setProducts((prev) => append ? [...prev, ...data.items] : data.items);
      setHasMore(pageNum < data.pages);
      setTotal(data.total);
      setPage(pageNum);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [category.id, loading]);

  // Перший завантаж при монтуванні або зміні категорії
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setAppliedFilters({ sort: "name", in_stock_only: true });
    loadMore(1, { sort: "name", in_stock_only: true }, false);
  }, [category.id]); // eslint-disable-line

  // Intersection Observer — нескінченний скрол
  const loadNextPage = useCallback(() => {
    if (loading || !hasMore) return;
    loadMore(page + 1, appliedFilters, true);
  }, [loading, hasMore, page, appliedFilters, loadMore]);

  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadNextPage(); },
      { threshold: 0.1 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loadNextPage]);

  const applyFilters = () => {
    const f = buildFilters();
    setAppliedFilters(f);
    setShowFilters(false);
    setProducts([]);
    setHasMore(true);
    loadMore(1, f, false);
  };

  const resetFilters = () => {
    setSort("name");
    setPriceMin("");
    setPriceMax("");
    setInStockOnly(true);
    const f = { sort: "name", in_stock_only: true };
    setAppliedFilters(f);
    setShowFilters(false);
    setProducts([]);
    loadMore(1, f, false);
  };

  return (
    <div style={styles.page}>
      {/* Заголовок + кнопка фільтрів */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{category.name}</h2>
          <span style={styles.countLabel}>{total || category.product_count} товарів</span>
        </div>
        <button
          style={{ ...styles.filterBtn, ...(hasActiveFilters ? styles.filterBtnActive : {}) }}
          onClick={() => setShowFilters((v) => !v)}
        >
          {hasActiveFilters ? "⚙️ Фільтри ●" : "⚙️ Фільтри"}
        </button>
      </div>

      {/* Панель фільтрів */}
      {showFilters && (
        <div style={styles.filtersPanel}>
          {/* Сортування */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Сортування</span>
            <div style={styles.sortRow}>
              {SORT_OPTIONS.map(({ val, label }) => (
                <button
                  key={val}
                  style={{ ...styles.sortBtn, ...(sort === val ? styles.sortBtnActive : {}) }}
                  onClick={() => setSort(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Ціна */}
          <div style={styles.filterGroup}>
            <span style={styles.filterLabel}>Ціна (₴)</span>
            <div style={styles.priceRow}>
              <input
                style={styles.priceInput}
                type="number"
                placeholder="від"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
              <span style={styles.priceDash}>—</span>
              <input
                style={styles.priceInput}
                type="number"
                placeholder="до"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>
          </div>

          {/* Наявність */}
          <div style={styles.filterGroup}>
            <label style={styles.checkRow}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              <span style={styles.filterLabel}>Тільки в наявності</span>
            </label>
          </div>

          {/* Кнопки дій */}
          <div style={styles.filterActions}>
            <button style={styles.resetBtn} onClick={resetFilters}>Скинути</button>
            <button style={styles.applyBtn} onClick={applyFilters}>Застосувати</button>
          </div>
        </div>
      )}

      {error && <ErrorMsg text={error} />}

      {/* Сітка товарів */}
      <div style={styles.grid}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onClick={() => onSelectProduct(p)} />
        ))}
      </div>

      {/* Sentinel нескінченного скролу */}
      <div ref={observerRef} style={{ height: 40 }} />

      {loading && <Loader text="Завантаження товарів..." />}

      {!hasMore && products.length > 0 && (
        <p style={styles.endText}>Всі {total} товарів завантажені</p>
      )}
    </div>
  );
}

const styles = {
  page: { padding: "16px", paddingBottom: 80 },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: 700, margin: "0 0 2px", color: "#1a1a1a" },
  countLabel: { fontSize: 12, color: "#888" },

  filterBtn: {
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: "6px 12px",
    background: "#fff",
    fontSize: 12,
    cursor: "pointer",
    color: "#555",
    flexShrink: 0,
  },
  filterBtnActive: {
    background: "#e8f0fe",
    borderColor: "#2481cc",
    color: "#2481cc",
  },

  filtersPanel: {
    background: "#fff",
    borderRadius: 14,
    padding: "14px",
    marginBottom: 14,
    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
  },
  filterGroup: { marginBottom: 14 },
  filterLabel: { fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 },

  sortRow: { display: "flex", gap: 6, flexWrap: "wrap" },
  sortBtn: {
    padding: "5px 10px",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#f5f5f5",
    fontSize: 11,
    cursor: "pointer",
    color: "#555",
  },
  sortBtnActive: {
    background: "#2481cc",
    borderColor: "#2481cc",
    color: "#fff",
  },

  priceRow: { display: "flex", alignItems: "center", gap: 8 },
  priceInput: {
    flex: 1,
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "6px 10px",
    fontSize: 13,
    outline: "none",
  },
  priceDash: { color: "#aaa", fontSize: 14 },

  checkRow: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    userSelect: "none",
  },

  filterActions: { display: "flex", gap: 10 },
  resetBtn: {
    flex: 1,
    padding: "9px",
    border: "1px solid #ddd",
    borderRadius: 10,
    background: "#fff",
    fontSize: 13,
    cursor: "pointer",
    color: "#888",
  },
  applyBtn: {
    flex: 2,
    padding: "9px",
    border: "none",
    borderRadius: 10,
    background: "#2481cc",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  endText: { textAlign: "center", color: "#aaa", fontSize: 12, padding: "12px 0" },
};
