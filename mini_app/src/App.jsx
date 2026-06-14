// mini_app/src/App.jsx — головний компонент Telegram Mini App
// Маршрутизація: каталог → категорія → товар → кошик

import { useState, useEffect } from "react";
import CatalogPage from "./pages/CatalogPage";
import CategoryPage from "./pages/CategoryPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import { CartProvider } from "./hooks/useCart";

// Ініціалізуємо Telegram WebApp SDK
const tg = window.Telegram?.WebApp;

export default function App() {
  const [page, setPage] = useState("catalog");   // "catalog" | "category" | "product" | "cart"
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (tg) {
      tg.ready();                          // повідомляємо Telegram що додаток готовий
      tg.expand();                         // розгортаємо на весь екран
      tg.setHeaderColor("#ffffff");
      tg.setBackgroundColor("#f5f5f5");
    }
  }, []);

  // Навігація назад через кнопку Telegram
  useEffect(() => {
    if (!tg) return;

    if (page === "catalog") {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
      tg.BackButton.onClick(() => handleBack());
    }

    return () => tg.BackButton.offClick(() => handleBack());
  }, [page]);

  const handleBack = () => {
    if (page === "product") setPage("category");
    else if (page === "category") setPage("catalog");
    else if (page === "cart") setPage(selectedCategory ? "category" : "catalog");
  };

  const navigate = (to, data = {}) => {
    if (data.category) setSelectedCategory(data.category);
    if (data.product) setSelectedProduct(data.product);
    setPage(to);
  };

  return (
    <CartProvider>
      <div className="app" style={{ minHeight: "100vh", background: "#f5f5f5" }}>
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
          />
        )}
        {page === "cart" && (
          <CartPage onBack={handleBack} />
        )}
      </div>
    </CartProvider>
  );
}
