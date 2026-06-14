// mini_app/src/pages/CatalogPage.jsx
// Головна сторінка — сітка категорій.

import { useEffect, useState } from "react";
import { api } from "../api";

export default function CatalogPage({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getCategories()
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Завантаження каталогу..." />;
  if (error) return <ErrorMsg text={error} />;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🧸 Каталог товарів</h1>
      <div style={styles.grid}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            style={styles.card}
            onClick={() => onSelectCategory(cat)}
          >
            <span style={styles.cardName}>{cat.name}</span>
            <span style={styles.cardCount}>{cat.product_count} товарів</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Допоміжні компоненти ────────────────────────────────────────────────────

export function Loader({ text = "Завантаження..." }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
      <div style={spinnerStyle} />
      <p style={{ marginTop: 16, fontSize: 14 }}>{text}</p>
    </div>
  );
}

export function ErrorMsg({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#e53935" }}>
      <p>⚠️ {text}</p>
    </div>
  );
}

// ─── Стилі ───────────────────────────────────────────────────────────────────

const styles = {
  page: { padding: "16px" },
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: "0 0 16px",
    color: "#1a1a1a",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    background: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px 12px",
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    textAlign: "left",
    transition: "transform 0.1s",
  },
  cardName: { fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 },
  cardCount: { fontSize: 11, color: "#888" },
};

const spinnerStyle = {
  width: 36,
  height: 36,
  border: "3px solid #eee",
  borderTop: "3px solid #2481cc",
  borderRadius: "50%",
  margin: "0 auto",
  animation: "spin 0.8s linear infinite",
};
