// mini_app/src/pages/ProductPage.jsx
// Картка товару — фото, опис, ціна, кнопка "Додати в кошик".

import { useEffect, useState } from "react";
import { api } from "../api";
import { useCart } from "../hooks/useCart";
import CartButton from "../components/CartButton";
import { Loader, ErrorMsg } from "./CatalogPage";

export default function ProductPage({ product: initialProduct, onCart }) {
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(!initialProduct?.description);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);
  const { dispatch, count } = useCart();

  // Підвантажуємо повні деталі (список не містить description)
  useEffect(() => {
    if (!initialProduct?.id) return;
    api.getProduct(initialProduct.id)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [initialProduct?.id]);

  const handleAddToCart = () => {
    dispatch({ type: "ADD", product });
    setAdded(true);
    // Скидаємо анімацію через 2 сек
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <Loader text="Завантаження товару..." />;
  if (error) return <ErrorMsg text={error} />;
  if (!product) return null;

  const hasDiscount = product.old_price && product.old_price > product.price;
  const discount = hasDiscount
    ? Math.round((1 - product.price / product.old_price) * 100)
    : 0;

  return (
    <div style={styles.page}>
      {/* Фото */}
      <div style={styles.imageWrap}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={styles.image} />
        ) : (
          <div style={styles.noImage}>🧸</div>
        )}
        {hasDiscount && (
          <span style={styles.badge}>−{discount}%</span>
        )}
      </div>

      {/* Інфо */}
      <div style={styles.info}>
        {product.vendor && (
          <p style={styles.vendor}>{product.vendor}</p>
        )}
        <h1 style={styles.name}>{product.name}</h1>

        {/* Ціна */}
        <div style={styles.priceRow}>
          <span style={styles.price}>{product.price.toFixed(2)} ₴</span>
          {hasDiscount && (
            <span style={styles.oldPrice}>{product.old_price.toFixed(2)} ₴</span>
          )}
        </div>

        {/* Наявність */}
        <div style={styles.stockRow}>
          {product.in_stock ? (
            <span style={styles.inStock}>✅ Є в наявності</span>
          ) : (
            <span style={styles.outOfStock}>❌ Немає в наявності</span>
          )}
        </div>

        {/* Опис */}
        {product.description && (
          <div style={styles.descBlock}>
            <p style={styles.descTitle}>Опис</p>
            <p style={styles.desc}>{product.description}</p>
          </div>
        )}

        {/* Категорія */}
        <p style={styles.meta}>Категорія: {product.category_name}</p>
      </div>

      {/* Кнопка додати в кошик */}
      {product.in_stock && (
        <div style={styles.footer}>
          <button
            style={{ ...styles.addBtn, ...(added ? styles.addBtnAdded : {}) }}
            onClick={handleAddToCart}
          >
            {added ? "✅ Додано!" : "🛒 Додати в кошик"}
          </button>
        </div>
      )}

      {/* Плаваюча кнопка кошика */}
      {count > 0 && <CartButton count={count} onClick={onCart} />}
    </div>
  );
}

const styles = {
  page: { paddingBottom: 90 },
  imageWrap: { position: "relative", background: "#fff", textAlign: "center" },
  image: { width: "100%", maxHeight: 320, objectFit: "contain", padding: 16 },
  noImage: {
    fontSize: 80,
    padding: "40px 0",
    background: "#f0f0f0",
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    background: "#e53935",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
  },
  info: { padding: "16px 16px 0" },
  vendor: { fontSize: 12, color: "#888", margin: "0 0 4px" },
  name: { fontSize: 16, fontWeight: 700, margin: "0 0 12px", color: "#1a1a1a", lineHeight: 1.4 },
  priceRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  price: { fontSize: 22, fontWeight: 800, color: "#2481cc" },
  oldPrice: { fontSize: 14, color: "#aaa", textDecoration: "line-through" },
  stockRow: { marginBottom: 16 },
  inStock: { fontSize: 13, color: "#43a047" },
  outOfStock: { fontSize: 13, color: "#e53935" },
  descBlock: { background: "#f9f9f9", borderRadius: 10, padding: "12px", marginBottom: 12 },
  descTitle: { fontSize: 13, fontWeight: 600, margin: "0 0 6px", color: "#555" },
  desc: { fontSize: 13, color: "#444", margin: 0, lineHeight: 1.6 },
  meta: { fontSize: 11, color: "#aaa", marginTop: 8 },
  footer: {
    position: "fixed",
    bottom: 0, left: 0, right: 0,
    padding: "12px 16px",
    background: "#fff",
    boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
  },
  addBtn: {
    width: "100%",
    padding: "14px",
    background: "#2481cc",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
  },
  addBtnAdded: { background: "#43a047" },
};
