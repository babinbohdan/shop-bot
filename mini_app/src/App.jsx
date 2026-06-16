// mini_app/src/App.jsx — головний компонент з нижньою навігацією

import { useState, useEffect, useRef } from "react";
import CatalogPage from "./pages/CatalogPage";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import SearchPage from "./pages/SearchPage";
import OrdersPage from "./pages/OrdersPage";
import WishlistPage from "./pages/WishlistPage";
import { CartProvider, useCart } from "./hooks/useCart";

const tg = window.Telegram?.WebApp;

// Типи сторінок де кнопка "назад" Telegram потрібна
const BACK_PAGES = new Set(["category", "product", "cart", "search", "orders", "wishlist"]);

function AppInner() {
  const [page, setPage] = useState("catalog");
  const [animKey, setAnimKey] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { count } = useCart();

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#ffffff");
      tg.setBackgroundColor("#f5f5f5");
    }
  }, []);

  useEffect(() => {
    if (!tg) return;
    if (BACK_PAGES.has(page) && page !== "catalog") {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }
    const handler = () => handleBack();
    tg.BackButton.onClick(handler);
    return () => tg.BackButton.offClick(handler);
  }, [page]);

  const handleBack = () => {
    if (page === "product") setPage("category");
    else if (page === "category") setPage("catalog");
    else setPage("catalog");
  };

  const navigate = (to, data = {}) => {
    if (data.category) setSelectedCategory(data.category);
    if (data.product) setSelectedProduct(data.product);
    setPage(to);
    setAnimKey((k) => k + 1);
  };

  // Нижня навігація — не показуємо на сторінці товару (там фіксована кнопка)
  const showNavbar = page !== "product";

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5", paddingBottom: showNavbar ? 76 : 0 }}>
      <style>{`
        @keyframes pageIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .page-anim { animation: pageIn 0.22s ease; }
      `}</style>
      <div key={animKey} className="page-anim">
      {page === "catalog" && (
        <CatalogPage onSelectCategory={(cat) => navigate("category", { category: cat })} />
      )}
      {page === "category" && (
        <CategoryPage
          category={selectedCategory}
          onSelectProduct={(p) => navigate("product", { product: p })}
          onCart={() => navigate("cart")}
        />
      )}
      {page === "product" && (
        <ProductPage
          product={selectedProduct}
          onCart={() => navigate("cart")}
          onSelectProduct={(p) => navigate("product", { product: p })}
        />
      )}
      {page === "cart" && <CartPage onBack={handleBack} />}
      {page === "search" && (
        <SearchPage
          onSelectProduct={(p) => navigate("product", { product: p })}
          onCart={() => navigate("cart")}
        />
      )}
      {page === "orders" && <OrdersPage />}
      {page === "wishlist" && (
        <WishlistPage onSelectProduct={(p) => navigate("product", { product: p })} />
      )}
      </div>

      {/* Нижня навігаційна панель */}
      {showNavbar && (
        <BottomNav current={page} cartCount={count} onNavigate={(to) => navigate(to)} />
      )}
    </div>
  );
}

function BottomNav({ current, cartCount, onNavigate }) {
  const items = [
    { key: "catalog",  icon: "🏠", label: "Каталог" },
    { key: "search",   icon: "🔍", label: "Пошук" },
    { key: "wishlist", icon: "🤍", label: "Бажання" },
    { key: "orders",   icon: "📋", label: "Замовлення" },
    { key: "cart",     icon: "🛒", label: "Кошик", badge: cartCount > 0 ? cartCount : null },
  ];

  return (
    <nav style={navStyles.bar}>
      <div style={navStyles.inner}>
        {items.map(({ key, icon, label, badge }) => {
          const active = current === key;
          return (
            <button
              key={key}
              style={{ ...navStyles.item, ...(active ? navStyles.itemActive : {}) }}
              onClick={() => onNavigate(key)}
            >
              <span style={navStyles.iconWrap}>
                <span style={navStyles.icon}>{icon}</span>
                {badge != null && (
                  <span style={navStyles.badge}>{badge > 99 ? "99+" : badge}</span>
                )}
              </span>
              <span style={{ ...navStyles.label, ...(active ? navStyles.labelActive : {}) }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const navStyles = {
  bar: {
    position: "fixed",
    bottom: 0, left: 0, right: 0,
    background: "#fff",
    boxShadow: "0 -1px 8px rgba(0,0,0,0.10)",
    zIndex: 200,
    padding: "6px 6px 8px",
  },
  inner: {
    display: "flex",
    background: "#f0f4ff",
    borderRadius: 18,
    padding: 4,
    gap: 3,
  },
  item: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: "7px 4px",
    borderRadius: 14,
    gap: 2,
    transition: "background 0.15s",
  },
  itemActive: {
    background: "#2481cc",
  },
  iconWrap: { position: "relative", display: "inline-flex" },
  icon: { fontSize: 18 },
  badge: {
    position: "absolute",
    top: -6, right: -10,
    background: "#e53935",
    color: "#fff",
    fontSize: 9,
    fontWeight: 800,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 3px",
  },
  label: { fontSize: 10, fontWeight: 500, color: "#888" },
  labelActive: { color: "#fff" },
};

export default function App() {
  return (
    <CartProvider>
      <AppInner />
    </CartProvider>
  );
}
