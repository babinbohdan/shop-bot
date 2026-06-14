// mini_app/src/pages/SearchPage.jsx
// Пошук товарів за назвою або брендом.

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../api";
import { useCart } from "../hooks/useCart";
import ProductCard from "../components/ProductCard";
import { Loader } from "./CatalogPage";

export default function SearchPage({ onSelectProduct, onCart }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const debounceRef = useRef(null);
  const observerRef = useRef(null);
  const { count } = useCart();

  // Скидаємо і шукаємо заново при зміні query або sort
  const doSearch = useCallback(async (q, s, p = 1, append = false) => {
    if (q.length < 2) {
      if (!append) { setProducts([]); setTotal(0); setHasMore(false); }
      return;
    }
    setLoading(true);
    try {
      const data = await api.searchProducts(q, p, s);
      setProducts((prev) => append ? [...prev, ...data.items] : data.items);
      setHasMore(p < data.pages);
      setTotal(data.total);
    } catch {
      // ігноруємо помилки пошуку
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce на поле вводу
  const handleQueryChange = (val) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setProducts([]);
      doSearch(val, sort, 1, false);
    }, 400);
  };

  const handleSortChange = (s) => {
    setSort(s);
    setPage(1);
    setProducts([]);
    doSearch(query, s, 1, false);
  };

  // Нескінченний скрол для результатів пошуку
  const loadNextPage = useCallback(() => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    doSearch(query, sort, nextPage, true);
  }, [loading, hasMore, page, query, sort, doSearch]);

  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadNextPage(); },
      { threshold: 0.1 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loadNextPage]);

  return (
    <div style={styles.page}>
      {/* Поле пошуку */}
      <div style={styles.searchBar}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          style={styles.input}
          placeholder="Назва товару або бренд..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          autoFocus
        />
        {query && (
          <button style={styles.clearBtn} onClick={() => handleQueryChange("")}>✕</button>
        )}
      </div>

      {/* Сортування (показуємо тільки якщо є результати) */}
      {products.length > 0 && (
        <div style={styles.sortRow}>
          <span style={styles.totalLabel}>Знайдено: {total}</span>
          <div style={styles.sortBtns}>
            {[
              { val: "name", label: "А-Я" },
              { val: "price_asc", label: "Ціна ↑" },
              { val: "price_desc", label: "Ціна ↓" },
            ].map(({ val, label }) => (
              <button
                key={val}
                style={{ ...styles.sortBtn, ...(sort === val ? styles.sortBtnActive : {}) }}
                onClick={() => handleSortChange(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Порожній стан */}
      {query.length < 2 && (
        <div style={styles.hint}>
          <p style={styles.hintIcon}>🔍</p>
          <p style={styles.hintText}>Введіть мінімум 2 символи для пошуку</p>
        </div>
      )}

      {query.length >= 2 && !loading && products.length === 0 && (
        <div style={styles.hint}>
          <p style={styles.hintIcon}>😕</p>
          <p style={styles.hintText}>Нічого не знайдено за запитом «{query}»</p>
        </div>
      )}

      {/* Сітка результатів */}
      <div style={styles.grid}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onClick={() => onSelectProduct(p)} />
        ))}
      </div>

      {/* Sentinel нескінченного скролу */}
      <div ref={observerRef} style={{ height: 40 }} />

      {loading && <Loader text="Пошук..." />}
    </div>
  );
}

const styles = {
  page: { padding: "16px", paddingBottom: 80 },

  searchBar: {
    display: "flex",
    alignItems: "center",
    background: "#fff",
    borderRadius: 14,
    padding: "10px 14px",
    marginBottom: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    gap: 8,
  },
  searchIcon: { fontSize: 16, flexShrink: 0 },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 15,
    background: "transparent",
    color: "#1a1a1a",
  },
  clearBtn: {
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: 14,
    color: "#aaa",
    padding: "0 2px",
  },

  sortRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  totalLabel: { fontSize: 12, color: "#888", whiteSpace: "nowrap" },
  sortBtns: { display: "flex", gap: 6 },
  sortBtn: {
    padding: "4px 10px",
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fff",
    fontSize: 11,
    cursor: "pointer",
    color: "#555",
  },
  sortBtnActive: {
    background: "#2481cc",
    color: "#fff",
    borderColor: "#2481cc",
  },

  hint: { textAlign: "center", padding: "60px 20px" },
  hintIcon: { fontSize: 48, margin: "0 0 8px" },
  hintText: { fontSize: 14, color: "#888" },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
};
