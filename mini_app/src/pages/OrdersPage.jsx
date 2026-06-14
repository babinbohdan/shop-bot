// mini_app/src/pages/OrdersPage.jsx
// Історія замовлень користувача зі статусами.

import { useState, useEffect } from "react";
import { api } from "../api";
import { Loader } from "./CatalogPage";

const tg = window.Telegram?.WebApp;

const STATUS_COLOR = {
  new:        { bg: "#e3f2fd", text: "#1565c0" },
  processing: { bg: "#fff3e0", text: "#e65100" },
  shipped:    { bg: "#e8f5e9", text: "#2e7d32" },
  completed:  { bg: "#f3e5f5", text: "#6a1b9a" },
  cancelled:  { bg: "#ffebee", text: "#c62828" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});

  const initData = tg?.initData || "";

  useEffect(() => {
    if (!initData) {
      setError("Відкрийте магазин через бота Telegram");
      setLoading(false);
      return;
    }
    api.getOrderHistory(initData)
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  if (loading) return <Loader text="Завантаження замовлень..." />;

  if (error) {
    return (
      <div style={styles.center}>
        <p style={styles.errIcon}>⚠️</p>
        <p style={styles.errText}>{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={styles.center}>
        <p style={styles.emptyIcon}>📋</p>
        <p style={styles.emptyTitle}>Замовлень поки немає</p>
        <p style={styles.emptyHint}>Ваші замовлення з'являться тут після оформлення</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>📋 Мої замовлення</h2>

      {orders.map((order) => {
        const colors = STATUS_COLOR[order.status] || STATUS_COLOR.new;
        const isOpen = expanded[order.order_id];

        return (
          <div key={order.order_id} style={styles.card}>
            {/* Заголовок картки */}
            <button style={styles.cardHeader} onClick={() => toggleExpand(order.order_id)}>
              <div style={styles.headerLeft}>
                <span style={styles.orderId}>Замовлення #{order.order_id}</span>
                <span style={styles.orderDate}>{order.created_at}</span>
              </div>
              <div style={styles.headerRight}>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: colors.bg,
                    color: colors.text,
                  }}
                >
                  {order.status_label}
                </span>
                <span style={styles.chevron}>{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>

            {/* Сума */}
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Сума:</span>
              <span style={styles.totalValue}>{order.total_price.toFixed(2)} ₴</span>
            </div>

            {/* Деталі (розгортаються) */}
            {isOpen && (
              <div style={styles.details}>
                <div style={styles.divider} />
                {order.items.map((item, idx) => (
                  <div key={idx} style={styles.item}>
                    <span style={styles.itemName}>{item.product_name}</span>
                    <span style={styles.itemQty}>× {item.quantity}</span>
                    <span style={styles.itemPrice}>
                      {(item.price * item.quantity).toFixed(2)} ₴
                    </span>
                  </div>
                ))}
                {order.comment ? (
                  <p style={styles.comment}>💬 {order.comment}</p>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  page: { padding: "16px", paddingBottom: 80 },
  title: { fontSize: 18, fontWeight: 700, margin: "0 0 16px", color: "#1a1a1a" },

  card: {
    background: "#fff",
    borderRadius: 14,
    marginBottom: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  cardHeader: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: 2 },
  orderId: { fontSize: 13, fontWeight: 700, color: "#1a1a1a" },
  orderDate: { fontSize: 11, color: "#888" },
  headerRight: { display: "flex", alignItems: "center", gap: 8 },
  statusBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 8,
  },
  chevron: { fontSize: 10, color: "#aaa" },

  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0 14px 12px",
  },
  totalLabel: { fontSize: 12, color: "#888" },
  totalValue: { fontSize: 14, fontWeight: 800, color: "#2481cc" },

  divider: { height: 1, background: "#f0f0f0", margin: "0 0 10px" },
  details: { padding: "0 14px 12px" },

  item: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  itemName: {
    flex: 1, fontSize: 12, color: "#333",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  itemQty: { fontSize: 11, color: "#888", flexShrink: 0 },
  itemPrice: { fontSize: 12, fontWeight: 700, color: "#1a1a1a", flexShrink: 0 },

  comment: { fontSize: 12, color: "#666", marginTop: 8, fontStyle: "italic" },

  center: { textAlign: "center", padding: "80px 24px" },
  emptyIcon: { fontSize: 56, margin: "0 0 12px" },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: "#1a1a1a", margin: "0 0 6px" },
  emptyHint: { fontSize: 13, color: "#888" },
  errIcon: { fontSize: 40, margin: "0 0 8px" },
  errText: { fontSize: 14, color: "#c62828" },
};
