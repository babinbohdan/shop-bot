"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { validatePromo } from "@/lib/api";
import type { PromoResult } from "@/lib/api";

export default function CartPage() {
  const { items, removeItem, updateQty, total, count } = useCartStore();
  const [promoCode, setPromoCode] = useState("");
  const [promo, setPromo] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const subtotal = total();
  const discountAmount =
    promo?.valid && promo.discount_type === "percent"
      ? Math.round((subtotal * (promo.discount_value ?? 0)) / 100)
      : promo?.valid && promo.discount_type === "fixed"
      ? (promo.discount_value ?? 0)
      : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handlePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      const result = await validatePromo(promoCode.trim(), subtotal);
      setPromo(result);
    } catch {
      setPromo({ valid: false, message: "Помилка перевірки промокоду" });
    } finally {
      setPromoLoading(false);
    }
  };

  if (count() === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold mb-2">Кошик порожній</h1>
        <p className="text-gray-400 mb-6">Додайте товари зі сторінки каталогу</p>
        <Link
          href="/catalog"
          className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors"
        >
          Перейти до каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Кошик ({count()} товари)</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Items list */}
        <div className="flex-1 space-y-3">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-sm p-4 flex gap-4 items-center"
            >
              {/* Image */}
              <div className="relative w-20 h-20 shrink-0 bg-gray-50 rounded-xl overflow-hidden">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-contain p-1"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">🧸</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/catalog/${product.id}`} className="font-medium text-sm line-clamp-2 hover:text-primary">
                  {product.name}
                </Link>
                <p className="text-primary font-bold mt-1">{product.price} ₴</p>
              </div>

              {/* Qty controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => updateQty(product.id, quantity - 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-100
                             flex items-center justify-center text-lg font-bold"
                >
                  −
                </button>
                <span className="w-6 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => updateQty(product.id, quantity + 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-100
                             flex items-center justify-center text-lg font-bold"
                >
                  +
                </button>
              </div>

              {/* Subtotal + remove */}
              <div className="text-right shrink-0">
                <p className="font-bold text-sm">{product.price * quantity} ₴</p>
                <button
                  onClick={() => removeItem(product.id)}
                  className="text-xs text-gray-400 hover:text-danger mt-1"
                >
                  Видалити
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-5 lg:sticky lg:top-20">
            <h2 className="font-bold text-lg mb-4">Підсумок</h2>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Товарів на суму</span>
                <span>{subtotal} ₴</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Знижка ({promo?.discount_value}{promo?.discount_type === "percent" ? "%" : " ₴"})</span>
                  <span>−{discountAmount} ₴</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
                <span>До сплати</span>
                <span className="text-primary">{finalTotal} ₴</span>
              </div>
            </div>

            {/* Promo code */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Промокод"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm
                             focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handlePromo}
                  disabled={promoLoading || !promoCode.trim()}
                  className="px-3 py-2 bg-gray-100 rounded-xl text-sm font-semibold
                             hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  {promoLoading ? "..." : "OK"}
                </button>
              </div>
              {promo && (
                <p
                  className={`text-xs mt-1.5 ${
                    promo.valid ? "text-success" : "text-danger"
                  }`}
                >
                  {promo.valid
                    ? `✓ Промокод застосовано: −${discountAmount} ₴`
                    : `✗ ${promo.message ?? "Промокод недійсний"}`}
                </p>
              )}
            </div>

            <Link
              href={`/checkout${promo?.valid ? `?promo=${promoCode}` : ""}`}
              className="block w-full text-center bg-primary text-white font-bold py-3 rounded-xl
                         hover:bg-primary/90 active:scale-95 transition-all"
            >
              Оформити замовлення →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
