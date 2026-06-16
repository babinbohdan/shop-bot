// mini_app/src/pages/WishlistPage.jsx
// Список бажань — товари, які користувач зберіг.

import { useEffect, useState } from "react";
import { api } from "../api";
import { useCart } from "../hooks/useCart";

const tg = window.Telegram?.WebApp;

export default function WishlistPage({ onSelectProduct }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { dispatch } = useCart();

  const initData = tg?.initData || "";

  const load = () => {
    if (!initData) { setLoading(false); return; }
    setLoading(true);
    api.getWishlist(initData)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleRemove = async (productId) => {
    await api.removeFromWishlist(productId, initData).catch(() => {});
    setItems((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleAddToCart = (product) => {
    dispatch({ type: "ADD", product });
    tg?.HapticFeedback?.notificationOccurred("success");
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <p style={styles.hint}>Завантаження...</p>
      </div>
    );
  }

  if (!initData) {
    return (
      <div style={styles.center}>
        <p style={styles.emptyIcon}>🤍</p>
        <p style={styles.hint}>Відкрийте магазин через Telegram-бота</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={styles.center}>
        <p style={styles.emptyIcon}>🤍</p>
        <p style={styles.emptyTitle}>Список бажань порожній</p>
        <p style={styles.hint}>Натискайте ❤️ на товарах, щоб зберігати їх тут</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>🤍 Список бажань</h2>
      <p style={styles.count}>{items.length} {pluralItems(items.length)}</p>

      <div style={styles.list}>
        {items.map((product) => {
          const hasDiscount = product.old_price && product.old_price > product.price;
          const discount = hasDiscount
            ? Math.round((1 - product.price / product.old_price) * 100)
            : 0;

          return (
            <div key={product.id} style={styles.card}>
              {/* Фото */}
              <div
                style={styles.imgWrap}
                onClick={() => onSelectProduct && onSelectProduct(product)}
              >
                {product.image_url ? (
                  <img src={product.image_url} alt="" style={styles.img} />
                ) : (
                  <span style={styles.imgPlaceholder}>🧸</span>
                )}
                {hasDiscount && <span style={styles.badge}>−{discount}%</span>}
              </div>

              {/* Інфо */}
              <div style={styles.info}>
                <p
                  style={styles.name}
                  onClick={() => onSelectProduct && onSelectProduct(product)}
                >
                  {product.name}
                </p>

                <div style={styles.priceRow}>
                  <span style={styles.price}>{product.price.toFixed(2)} ₴</span>
                  {hasDiscount && (
                    <span style={styles.oldPrice}>{product.old_price.toFixed(2)} ₴</span>
                  )}
                </div>

                <p style={product.in_stock ? styles.inStock : styles.outOfStock}>
                  {product.in_stock ? "✅ Є в наявності" : "❌ Немає в наявності"}
                </p>

                <div style={styles.actions}>
                  {product.in_stock && (
                    <button
                      style={styles.cartBtn}
                      onClick={() => handleAddToCart(product)}
                    >
                      🛒 В кошик
                    </button>
                  )}
                  <button
                    style={styles.removeBtn}
                    onClick={() => handleRemove(product.id)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function pluralItems(n) {
  if (n === 1) return "товар";
  if (n >= 2 && n <= 4) return "товари";
  return "товарів";
}

const styles = {
  page: { padding: "16px", paddingBottom: 80 },
  title: { fontSize: 18, fontWeight: 700, margin: "0 0 4px", color: "#1a1a1a" },
  count: { fontSize: 13, color: "#888", margin: "0 0 16px" },

  center: { textAlign: "center", padding: "80px 24px" },
  emptyIcon: { fontSize: 64, margin: "0 0 12px" },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: "#1a1a1a", margin: "0 0 8px" },
  hint: { fontSize: 13, color: "#888", lineHeight: 1.5 },

  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: {
    display: "flex", gap: 12,
    background: "#fff", borderRadius: 14,
    padding: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  },

  imgWrap: {
    width: 80, height: 80, flexShrink: 0,
    position: "relative", cursor: "pointer",
    borderRadius: 10, overflow: "hidden",
    background: "#f5f5f5",
  },
  img: { width: "100%", height: "100%", objectFit: "contain" },
  imgPlaceholder: { fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" },
  badge: {
    position: "absolute", top: 4, right: 4,
    background: "#e53935", color: "#fff",
    fontSize: 9, fontWeight: 700,
    padding: "1px 5px", borderRadius: 4,
  },

  info: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 },
  name: {
    fontSize: 13, fontWeight: 600, color: "#1a1a1a",
    overflow: "hidden", textOverflow: "ellipsis",
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
    cursor: "pointer", margin: 0,
  },

  priceRow: { display: "flex", alignItems: "center", gap: 6 },
  price: { fontSize: 15, fontWeight: 800, color: "#2481cc" },
  oldPrice: { fontSize: 11, color: "#bbb", textDecoration: "line-through" },

  inStock: { fontSize: 11, color: "#43a047", margin: 0 },
  outOfStock: { fontSize: 11, color: "#e53935", margin: 0 },

  actions: { display: "flex", gap: 8, marginTop: 4 },
  cartBtn: {
    flex: 1, padding: "7px 10px",
    background: "#2481cc", color: "#fff",
    border: "none", borderRadius: 8,
    fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
  removeBtn: {
    padding: "7px 10px",
    background: "transparent", border: "1px solid #eee",
    borderRadius: 8, fontSize: 14, cursor: "pointer",
  },
};
