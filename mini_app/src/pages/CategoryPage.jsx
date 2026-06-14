// mini_app/src/pages/CategoryPage.jsx
// Сторінка категорії — список товарів з нескінченним скролом.

import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "../api";
import { useCart } from "../hooks/useCart";
import ProductCard from "../components/ProductCard";
import CartButton from "../components/CartButton";
import { Loader, ErrorMsg } from "./CatalogPage";

export default function CategoryPage({ category, onSelectProduct, onCart }) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const observerRef = useRef(null); // sentinel-елемент для Intersection Observer
  const { count } = useCart();

  // Завантажуємо наступну сторінку
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const data = await api.getProducts(category.id, page);
      setProducts((prev) => [...prev, ...data.items]);
      setHasMore(page < data.pages);
      setPage((p) => p + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [category.id, page, loading, hasMore]);

  // Перший завантаж при монтуванні або зміні категорії
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
  }, [category.id]);

  useEffect(() => {
    if (page === 1) loadMore();
  }, [page]); // eslint-disable-line

  // Intersection Observer — нескінченний скрол
  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div style={styles.page}>
      {/* Заголовок */}
      <div style={styles.header}>
        <h2 style={styles.title}>{category.name}</h2>
        <span style={styles.count}>{category.product_count} товарів</span>
      </div>

      {error && <ErrorMsg text={error} />}

      {/* Сітка товарів */}
      <div style={styles.grid}>
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={() => onSelectProduct(p)}
          />
        ))}
      </div>

      {/* Sentinel для нескінченного скролу */}
      <div ref={observerRef} style={{ height: 40 }} />

      {loading && <Loader text="Завантаження товарів..." />}

      {!hasMore && products.length > 0 && (
        <p style={styles.endText}>Всі товари завантажені</p>
      )}

      {/* Плаваюча кнопка кошика */}
      {count > 0 && <CartButton count={count} onClick={onCart} />}
    </div>
  );
}

const styles = {
  page: { padding: "16px", paddingBottom: 80 },
  header: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 700, margin: 0, color: "#1a1a1a" },
  count: { fontSize: 12, color: "#888" },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  endText: { textAlign: "center", color: "#aaa", fontSize: 13, padding: "12px 0" },
};
