// mini_app/src/pages/CartPage.jsx
// Сторінка кошика — список, редагування кількості, коментар, підтвердження.

import { useState } from "react";
import { useCart } from "../hooks/useCart";
import { api } from "../api";

const tg = window.Telegram?.WebApp;

export default function CartPage({ onBack }) {
  const { items, dispatch, total, count } = useCart();
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // ── Порожній кошик ─────────────────────────────────────────────────────────
  if (count === 0 && !success) {
    return (
      <div style={styles.emptyWrap}>
        <p style={styles.emptyIcon}>🛒</p>
        <p style={styles.emptyText}>Кошик порожній</p>
        <button style={styles.backBtn} onClick={onBack}>
          ← До каталогу
        </button>
      </div>
    );
  }

  // ── Успішне замовлення ────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={styles.successWrap}>
        <p style={styles.successIcon}>✅</p>
        <h2 style={styles.successTitle}>Замовлення прийнято!</h2>
        <p style={styles.successText}>
          Менеджер зателефонує вам найближчим часом для підтвердження.
        </p>
        <button style={styles.closeBtn} onClick={() => tg?.close()}>
          Закрити
        </button>
      </div>
    );
  }

  // ── Відправка замовлення ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitting || items.length === 0) return;
    setSubmitting(true);
    setError(null);

    const initData = tg?.initData || "";

    try {
      await api.createOrder(
        {
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
          })),
          comment: comment.trim(),
        },
        initData
      );

      dispatch({ type: "CLEAR" });
      setSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>🛒 Ваш кошик</h2>

      {/* Список товарів */}
      <div style={styles.list}>
        {items.map(({ product, quantity }) => (
          <div key={product.id} style={styles.item}>
            {/* Фото мініатюра */}
            <div style={styles.thumb}>
              {product.image_url ? (
                <img src={product.image_url} alt="" style={styles.thumbImg} />
              ) : (
                <span style={styles.thumbPlaceholder}>🧸</span>
              )}
            </div>

            {/* Назва + ціна */}
            <div style={styles.itemInfo}>
              <p style={styles.itemName}>{product.name}</p>
              <p style={styles.itemPrice}>{product.price.toFixed(2)} ₴</p>
            </div>

            {/* Кількість */}
            <div style={styles.qtyControls}>
              <button
                style={styles.qtyBtn}
                onClick={() =>
                  quantity === 1
                    ? dispatch({ type: "REMOVE", productId: product.id })
                    : dispatch({ type: "SET_QTY", productId: product.id, quantity: quantity - 1 })
                }
              >
                {quantity === 1 ? "🗑" : "−"}
              </button>
              <span style={styles.qtyNum}>{quantity}</span>
              <button
                style={styles.qtyBtn}
                onClick={() =>
                  dispatch({ type: "SET_QTY", productId: product.id, quantity: quantity + 1 })
                }
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Сума */}
      <div style={styles.totalRow}>
        <span style={styles.totalLabel}>Разом:</span>
        <span style={styles.totalValue}>{total.toFixed(2)} ₴</span>
      </div>

      {/* Коментар */}
      <div style={styles.commentBlock}>
        <label style={styles.commentLabel}>Коментар до замовлення (необов'язково)</label>
        <textarea
          style={styles.textarea}
          rows={3}
          placeholder="Наприклад: зателефонуйте після 18:00..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
        />
      </div>

      {/* Помилка */}
      {error && (
        <div style={styles.errorBox}>⚠️ {error}</div>
      )}

      {/* Очистити кошик */}
      <button
        style={styles.clearBtn}
        onClick={() => dispatch({ type: "CLEAR" })}
      >
        🗑 Очистити кошик
      </button>

      {/* Підтвердити замовлення */}
      <div style={styles.footer}>
        <button
          style={{ ...styles.submitBtn, ...(submitting ? styles.submitBtnDisabled : {}) }}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Відправляємо..." : `Підтвердити замовлення · ${total.toFixed(2)} ₴`}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "16px", paddingBottom: 160 },
  title: { fontSize: 18, fontWeight: 700, margin: "0 0 16px", color: "#1a1a1a" },

  list: { display: "flex", flexDirection: "column", gap: 12 },
  item: {
    display: "flex",
    alignItems: "center",
    background: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    gap: 10,
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  },
  thumb: { width: 52, height: 52, flexShrink: 0 },
  thumbImg: { width: "100%", height: "100%", objectFit: "contain", borderRadius: 8 },
  thumbPlaceholder: { fontSize: 36, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" },

  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 12, fontWeight: 600, color: "#1a1a1a", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  itemPrice: { fontSize: 13, color: "#2481cc", fontWeight: 700, margin: 0 },

  qtyControls: { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, border: "1px solid #ddd", background: "#f5f5f5", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  qtyNum: { fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: "center" },

  totalRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    margin: "16px 0", padding: "12px 16px",
    background: "#fff", borderRadius: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  },
  totalLabel: { fontSize: 15, color: "#555" },
  totalValue: { fontSize: 20, fontWeight: 800, color: "#2481cc" },

  commentBlock: { marginBottom: 16 },
  commentLabel: { fontSize: 13, color: "#666", display: "block", marginBottom: 6 },
  textarea: {
    width: "100%", boxSizing: "border-box",
    border: "1px solid #e0e0e0", borderRadius: 10,
    padding: "10px 12px", fontSize: 13, resize: "none",
    fontFamily: "inherit", outline: "none",
  },

  errorBox: {
    background: "#ffebee", color: "#c62828",
    borderRadius: 10, padding: "10px 14px",
    fontSize: 13, marginBottom: 12,
  },

  clearBtn: {
    width: "100%", padding: "10px",
    background: "transparent", border: "1px solid #ddd",
    borderRadius: 10, fontSize: 13, color: "#888",
    cursor: "pointer", marginBottom: 12,
  },

  footer: {
    position: "fixed", bottom: 60, left: 0, right: 0,
    padding: "12px 16px", background: "#fff",
    boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
  },
  submitBtn: {
    width: "100%", padding: "14px",
    background: "#2481cc", color: "#fff",
    border: "none", borderRadius: 12,
    fontSize: 15, fontWeight: 700, cursor: "pointer",
  },
  submitBtnDisabled: { background: "#90bce4", cursor: "not-allowed" },

  emptyWrap: { textAlign: "center", padding: "80px 20px" },
  emptyIcon: { fontSize: 64, margin: "0 0 12px" },
  emptyText: { fontSize: 16, color: "#888", marginBottom: 24 },
  backBtn: {
    padding: "12px 28px", background: "#2481cc",
    color: "#fff", border: "none", borderRadius: 12,
    fontSize: 14, cursor: "pointer",
  },

  successWrap: { textAlign: "center", padding: "80px 24px" },
  successIcon: { fontSize: 72, margin: "0 0 16px" },
  successTitle: { fontSize: 20, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 },
  successText: { fontSize: 14, color: "#555", lineHeight: 1.6, marginBottom: 28 },
  closeBtn: {
    padding: "14px 40px", background: "#43a047",
    color: "#fff", border: "none", borderRadius: 12,
    fontSize: 16, fontWeight: 600, cursor: "pointer",
  },
};
