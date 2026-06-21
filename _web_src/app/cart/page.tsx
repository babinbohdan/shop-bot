"use client";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/cart-store";
import { useState } from "react";
import { validatePromo } from "@/lib/api";

export default function CartPage() {
  const { items, removeItem, updateQty, total, count } = useCartStore();
  const [promo, setPromo] = useState("");
  const [promoResult, setPromoResult] = useState<{ discount: number; message: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  const subtotal = total();
  const discount = promoResult?.discount ?? 0;
  const finalTotal = Math.max(0, subtotal - discount);

  const handlePromo = async () => {
    if (!promo.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await validatePromo(promo.trim(), subtotal);
      if (res.valid && res.discount_value) {
        const disc =
          res.discount_type === "percent"
            ? (subtotal * res.discount_value) / 100
            : res.discount_value;
        setPromoResult({ discount: disc, message: res.message ?? "Промокод застосовано!" });
      } else {
        setPromoError(res.message ?? "Промокод недійсний");
      }
    } catch (e: any) {
      setPromoError(e.message ?? "Помилка");
    } finally {
      setPromoLoading(false);
    }
  };

  if (count() === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center fade-up">
        <p className="text-6xl mb-4">🛒</p>
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Кошик порожній</h2>
        <p className="text-gray-500 mb-8">Додайте товари з нашого каталогу</p>
        <Link
          href="/catalog"
          className="bg-[#2481cc] hover:bg-[#1a6ab5] text-white font-bold px-8 py-3 rounded-2xl transition"
        >
          Перейти до каталогу →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 fade-up">
      <h1 className="text-2xl font-extrabold mb-6 text-gray-800">🛒 Кошик</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Items list */}
        <div className="flex-1 space-y-3">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4"
            >
              {/* Image */}
              <div className="relative w-20 h-20 shrink-0 bg-gray-50 rounded-xl overflow-hidden">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-contain p-1" />
                ) : (
                  <div className="flex items-center justify-center h-full text-2xl">🧸</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/catalog/${product.id}`}>
                  <p className="font-semibold text-gray-800 text-sm line-clamp-2 hover:text-[#2481cc] transition">
                    {product.name}
                  </p>
                </Link>
                <p className="text-[#2481cc] font-bold mt-1">{product.price.toFixed(2)} ₴</p>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => updateQty(product.id, quantity - 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 hover:border-[#2481cc]
                             flex items-center justify-center text-gray-600 hover:text-[#2481cc] transition"
                >
                  −
                </button>
                <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                <button
                  onClick={() => updateQty(product.id, quantity + 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 hover:border-[#2481cc]
                             flex items-center justify-center text-gray-600 hover:text-[#2481cc] transition"
                >
                  +
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right shrink-0 w-20">
                <p className="font-bold text-gray-800 text-sm">
                  {(product.price * quantity).toFixed(2)} ₴
                </p>
                <button
                  onClick={() => removeItem(product.id)}
                  className="text-xs text-gray-400 hover:text-[#e53935] transition mt-1"
                >
                  Видалити
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20 space-y-4">
            <h2 className="font-extrabold text-gray-800 text-lg">Підсумок</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Товари ({count()})</span>
                <span>{subtotal.toFixed(2)} ₴</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#43a047] font-semibold">
                  <span>Знижка</span>
                  <span>-{discount.toFixed(2)} ₴</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3 flex justify-between font-extrabold text-lg">
              <span>Разом</span>
              <span className="text-[#2481cc]">{finalTotal.toFixed(2)} ₴</span>
            </div>

            {/* Promo code */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Промокод</p>
              {promoResult ? (
                <div className="bg-green-50 text-[#43a047] text-sm font-semibold px-3 py-2 rounded-xl flex items-center gap-2">
                  ✅ {promoResult.message}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePromo()}
                    placeholder="WELCOME10"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm
                               focus:outline-none focus:border-[#2481cc] transition"
                  />
                  <button
                    onClick={handlePromo}
                    disabled={promoLoading}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold
                               px-3 py-2 rounded-xl transition disabled:opacity-50"
                  >
                    {promoLoading ? "..." : "OK"}
                  </button>
                </div>
              )}
              {promoError && (
                <p className="text-[#e53935] text-xs mt-1">{promoError}</p>
              )}
            </div>

            <Link
              href="/checkout"
              className="block w-full text-center bg-[#2481cc] hover:bg-[#1a6ab5] text-white
                         font-bold py-4 rounded-2xl transition active:scale-95"
            >
              Оформити замовлення →
            </Link>

            <Link
              href="/catalog"
              className="block text-center text-sm text-gray-400 hover:text-[#2481cc] transition"
            >
              ← Продовжити покупки
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
