// mini_app/src/pages/ProductPage.jsx
// Картка товару — фото, опис, ціна, ♡ вішліст, схожі товари.

import { useEffect, useState } from "react";
import { api } from "../api";
import { useCart } from "../hooks/useCart";
import { Loader, ErrorMsg } from "./CatalogPage";
import ProductCard from "../components/ProductCard";

const tg = window.Telegram?.WebApp;

export default function ProductPage({ product: initialProduct, onCart, onSelectProduct }) {
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [wished, setWished] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const { dispatch } = useCart();

  useEffect(() => {
    if (!initialProduct?.id) return;
    setLoading(true);
    setAdded(false);

    const initData = tg?.initData || "";

    Promise.all([
      api.getProduct(initialProduct.id),
      api.getSimilarProducts(initialProduct.id),
      initData ? api.getWishlistIds(initData).catch(() => []) : Promise.resolve([]),
    ])
      .then(([prod, sim, wishIds]) => {
        setProduct(prod);
        setSimilar(sim);
        setWished(wishIds.includes(prod.id));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [initialProduct?.id]);

  const handleAddToCart = () => {
    dispatch({ type: "ADD", product });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = async () => {
    const initData = tg?.initData || "";
    if (!initData) return;
    setWishLoading(true);
    try {
      if (wished) {
        await api.removeFromWishlist(product.id, initData);
        setWished(false);
      } else {
        await api.addToWishlist(product.id, initData);
        setWished(true);
      }
    } catch (_) {
      // мовчки ігноруємо
    } finally {
      setWishLoading(false);
    }
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
        {hasDiscount && <span style={styles.badge}>−{discount}%</span>}

        {/* Кнопка вішліст */}
        <button
          style={{ ...styles.wishBtn, ...(wished ? styles.wishBtnActive : {}) }}
          onClick={handleWishlist}
          disabled={wishLoading}
          aria-label={wished ? "Видалити з бажань" : "Додати до бажань"}
        >
          {wished ? "❤️" : "🤍"}
        </button>
      </div>

      {/* Інфо */}
      <div style={styles.info}>
        {product.vendor && <p style={styles.vendor}>{product.vendor}</p>}
        <h1 style={styles.name}>{product.name}</h1>

        {/* Ціна */}
        <div style={styles.priceRow}>
          <span style={styles.price}>{product.price.toFixed(2)} ₴</span>
          {hasDiscount && (
            <>
              <span style={styles.oldPrice}>{product.old_price.toFixed(2)} ₴</span>
              <span style={styles.saveBadge}>Економія {(product.old_price - product.price).toFixed(0)} ₴</span>
            </>
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

        <p style={styles.meta}>Категорія: {product.category_name}</p>
        {product.barcode && <p style={styles.meta}>Штрихкод: {product.barcode}</p>}
      </div>

      {/* Схожі товари */}
      {similar.length > 0 && (
        <div style={styles.similarSection}>
          <h3 style={styles.similarTitle}>Схожі товари</h3>
          <div style={styles.similarScroll}>
            {similar.map((p) => (
              <div key={p.id} style={styles.similarCard}>
                <ProductCard product={p} onClick={() => onSelectProduct && onSelectProduct(p)} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 80 }} />

      {/* Кнопка "Додати в кошик" */}
      {product.in_stock && (
        <div style={styles.footer}>
          <button
            style={{ ...styles.addBtn, ...(added ? styles.addBtnAdded : {}) }}
            onClick={handleAddToCart}
          >
            {added ? "✅ Додано в кошик!" : "🛒 Додати в кошик"}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { paddingBottom: 0 },

  imageWrap: { position: "relative", background: "#fff", textAlign: "center" },
  image: { width: "100%", maxHeight: 300, objectFit: "contain", padding: 16 },
  noImage: { fontSize: 80, padding: "40px 0", background: "#f0f0f0", textAlign: "center" },
  badge: {
    position: "absolute", top: 12, right: 12,
    background: "#e53935", color: "#fff",
    padding: "3px 10px", borderRadius: 8,
    fontSize: 13, fontWeight: 700,
  },
  wishBtn: {
    position: "absolute", top: 12, left: 12,
    width: 36, height: 36,
    background: "rgba(255,255,255,0.9)",
    border: "none", borderRadius: "50%",
    fontSize: 18, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
  },
  wishBtnActive: { background: "#ffebee" },

  info: { padding: "16px 16px 0" },
  vendor: { fontSize: 12, color: "#888", margin: "0 0 4px" },
  name: { fontSize: 16, fontWeight: 700, margin: "0 0 10px", color: "#1a1a1a", lineHeight: 1.4 },

  priceRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" },
  price: { fontSize: 24, fontWeight: 800, color: "#2481cc" },
  oldPrice: { fontSize: 14, color: "#bbb", textDecoration: "line-through" },
  saveBadge: {
    background: "#ffebee", color: "#e53935",
    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
  },

  stockRow: { marginBottom: 14 },
  inStock: { fontSize: 13, color: "#43a047" },
  outOfStock: { fontSize: 13, color: "#e53935" },

  descBlock: { background: "#f9f9f9", borderRadius: 10, padding: 12, marginBottom: 12 },
  descTitle: { fontSize: 13, fontWeight: 600, margin: "0 0 6px", color: "#555" },
  desc: { fontSize: 13, color: "#444", margin: 0, lineHeight: 1.6 },

  meta: { fontSize: 11, color: "#bbb", marginTop: 4 },

  similarSection: { padding: "16px 16px 0" },
  similarTitle: { fontSize: 15, fontWeight: 700, margin: "0 0 10px", color: "#1a1a1a" },
  similarScroll: {
    display: "flex", gap: 10, overflowX: "auto",
    paddingBottom: 8, scrollbarWidth: "none",
  },
  similarCard: { minWidth: 140, maxWidth: 140, flexShrink: 0 },

  footer: {
    position: "fixed", bottom: 60, left: 0, right: 0,
    padding: "10px 16px", background: "#fff",
    boxShadow: "0 -2px 8px rgba(0,0,0,0.10)", zIndex: 100,
  },
  addBtn: {
    width: "100%", padding: "14px",
    background: "#2481cc", color: "#fff",
    border: "none", borderRadius: 12,
    fontSize: 15, fontWeight: 600, cursor: "pointer",
    transition: "background 0.2s",
  },
  addBtnAdded: { background: "#43a047" },
};
