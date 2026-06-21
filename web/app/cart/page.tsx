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
        <div className="text-6xl mb-4 text-muted">◻</div>
        <h1 className="text-2xl font-semibold mb-2 text-ink">Кошик порожній</h1>
        <p className="text-muted mb-8">Додайте товари зі сторінки каталогу</p>
        <Link href="/catalog" className="btn-gold px-8 py-3">
          Перейти до каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-xl font-semibold text-ink">Кошик</h1>
        <span className="text-sm text-muted">{count()} товари</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Items */}
        <div className="flex-1 space-y-3">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="card-bordered bg-surface rounded-lg p-4 flex gap-4 items-center">
              <div className="relative w-16 h-16 shrink-0 bg-panel rounded overflow-hidden">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-contain p-1" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xl text-muted">✦</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <Link href={`/catalog/${product.id}`} className="text-sm text-ink hover:text-gold transition-colors line-clamp-2">
                  {product.name}
                </Link>
                <p className="text-gold font-semibold mt-0.5 text-sm">{product.price} ₴</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => updateQty(product.id, quantity - 1)}
                  className="w-7 h-7 rounded border border-border hover:border-gold text-muted hover:text-gold transition-colors flex items-center justify-center text-base">
                  −
                </button>
                <span className="w-6 text-center text-sm font-medium text-ink">{quantity}</span>
                <button onClick={() => updateQty(product.id, quantity + 1)}
                  className="w-7 h-7 rounded border border-border hover:border-gold text-muted hover:text-gold transition-colors flex items-center justify-center text-base">
                  +
                </button>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-ink">{product.price * quantity} ₴</p>
                <button onClick={() => removeItem(product.id)}
                  className="text-xs text-muted hover:text-danger transition-colors mt-1">
                  Видалити
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:w-72 shrink-0">
          <div className="card-bordered bg-surface rounded-lg p-5 lg:sticky lg:top-20">
            <h2 className="text-sm font-semibold text-ink uppercase tracking-wider mb-4">Підсумок</h2>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted">Товарів на суму</span>
                <span className="text-ink">{subtotal} ₴</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Знижка ({promo?.discount_value}{promo?.discount_type === "percent" ? "%" : " ₴"})</span>
                  <span>−{discountAmount} ₴</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-3 border-t border-border">
                <span className="text-ink">До сплати</span>
                <span className="text-gold text-base">{finalTotal} ₴</span>
              </div>
            </div>

            {/* Promo */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Промокод"
                  className="input-dark flex-1 px-3 py-2 text-sm"
                />
                <button
                  onClick={handlePromo}
                  disabled={promoLoading || !promoCode.trim()}
                  className="px-3 py-2 border border-border rounded text-sm text-muted hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
                >
                  {promoLoading ? "..." : "ОК"}
                </button>
              </div>
              {promo && (
                <p className={`text-xs mt-2 ${promo.valid ? "text-success" : "text-danger"}`}>
                  {promo.valid
                    ? `✓ Промокод застосовано: −${discountAmount} ₴`
                    : `✗ ${promo.message ?? "Промокод недійсний"}`}
                </p>
              )}
            </div>

            <Link
              href={`/checkout${promo?.valid ? `?promo=${promoCode}` : ""}`}
              className="btn-gold block w-full text-center py-3 text-sm"
            >
              Оформити замовлення →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
