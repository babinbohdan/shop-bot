// mini_app/src/hooks/useCart.jsx
// Глобальний стан кошика через React Context.
// Зберігається в localStorage — не зникає при перезавантаженні Mini App.

import { createContext, useContext, useReducer, useEffect } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "tg_shop_cart";

function cartReducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const existing = state.find((i) => i.product.id === action.product.id);
      if (existing) {
        return state.map((i) =>
          i.product.id === action.product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...state, { product: action.product, quantity: 1 }];
    }
    case "REMOVE":
      return state.filter((i) => i.product.id !== action.productId);
    case "SET_QTY":
      return state.map((i) =>
        i.product.id === action.productId
          ? { ...i, quantity: Math.max(1, action.quantity) }
          : i
      );
    case "CLEAR":
      return [];
    case "LOAD":
      return action.items;
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, []);

  // Завантажуємо кошик із localStorage при першому рендері
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) dispatch({ type: "LOAD", items: JSON.parse(saved) });
    } catch {
      // якщо localStorage недоступний — ігноруємо
    }
  }, []);

  // Зберігаємо кожну зміну
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, dispatch, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
