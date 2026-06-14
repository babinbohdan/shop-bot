// mini_app/src/components/ProductCard.jsx
// Картка товару в сітці категорії.

import { useCart } from "../hooks/useCart";

export default function ProductCard({ product, onClick }) {
  const { dispatch, items } = useCart();
  const inCart = items.some((i) => i.product.id === product.id);
  const hasDiscount = product.old_price && product.old_price > product.price;

  const handleAdd = (e) => {
    e.stopPropagation(); // не відкривати картку
    dispatch({ type: "ADD", product });
  };

  return (
    <div style={styles.card} onClick={onClick}>
      {/* Значок знижки */}
      {hasDiscount && (
        <span style={styles.discountBadge}>
          −{Math.round((1 - product.price / product.old_price) * 100)}%
        </span>
      )}

      {/* Фото */}
      <div style={styles.imageWrap}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={styles.image} loading="lazy" />
        ) : (
          <span style={styles.placeholder}>🧸</span>
        )}
      </div>

      {/* Назва */}
      <p style={styles.name}>{product.name}</p>

      {/* Ціна */}
      <div style={styles.priceRow}>
        <span style={styles.price}>{product.price.toFixed(0)} ₴</span>
        {hasDiscount && (
          <span style={styles.oldPrice}>{product.old_price.toFixed(0)} ₴</span>
        )}
      </div>

      {/* Кнопка "в кошик" */}
      <button
        style={{ ...styles.addBtn, ...(inCart ? styles.addBtnActive : {}) }}
        onClick={handleAdd}
      >
        {inCart ? "✓ В кошику" : "+ Кошик"}
      </button>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  discountBadge: {
    position: "absolute", top: 6, right: 6,
    background: "#e53935", color: "#fff",
    fontSize: 10, fontWeight: 700,
    padding: "2px 6px", borderRadius: 6, zIndex: 1,
  },
  imageWrap: {
    height: 120, background: "#f9f9f9",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  image: { width: "100%", height: "100%", objectFit: "contain", padding: 8 },
  placeholder: { fontSize: 48 },
  name: {
    fontSize: 11, color: "#1a1a1a", fontWeight: 500,
    padding: "6px 8px 0", margin: 0,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: 1.4,
    flex: 1,
  },
  priceRow: {
    display: "flex", alignItems: "baseline", gap: 4,
    padding: "4px 8px 6px",
  },
  price: { fontSize: 14, fontWeight: 800, color: "#2481cc" },
  oldPrice: { fontSize: 10, color: "#bbb", textDecoration: "line-through" },
  addBtn: {
    margin: "0 8px 8px",
    padding: "6px 0",
    background: "#e8f0fe",
    color: "#2481cc",
    border: "none",
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
  },
  addBtnActive: {
    background: "#e8f5e9",
    color: "#43a047",
  },
};
