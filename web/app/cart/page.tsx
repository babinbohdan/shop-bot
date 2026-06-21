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
      ? (promo.discount_value ?? 0) : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handlePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    try {
      setPromo(await validatePromo(promoCode.trim(), subtotal));
    } catch {
      setPromo({ valid: false, message: "Помилка перевірки" });
    } finally { setPromoLoading(false); }
  };

  if (count() === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-3xl font-black mb-2 text-ink uppercase tracking-tight">Кошик порожній</h1>
        <p className="text-muted font-bold uppercase text-sm mb-8">Додайте товари зі сторінки каталогу</p>
        <Link href="/catalog" className="btn-pill px-8 py-3 text-sm inline-block">
          До каталогу
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-ink mb-6 uppercase tracking-tight">
        Кошик <span className="text-sm font-bold text-muted normal-case ml-1">{count()} товари</span>
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-3">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="bg-surface border-2 border-border p-4 flex gap-4 items-center shadow-[3px_3px_0px_#4a4e8f]">
              <div className="relative w-16 h-16 shrink-0 bg-panel border-2 border-border overflow-hidden">
                {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-contain p-1" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🧸</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/catalog/${product.id}`} className="text-sm font-black text-ink hover:text-muted transition-colors line-clamp-2 uppercase">
                  {product.name}
                </Link>
                <p className="text-ink font-black mt-0.5 text-sm">{product.price} ₴</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => updateQty(product.id, quantity - 1)}
                  className="w-8 h-8 border-2 border-border hover:bg-primary hover:text-surface text-ink font-black transition-colors flex items-center justify-center bg-surface">
                  −
                </button>
                <span className="w-6 text-center text-sm font-black text-ink">{quantity}</span>
                <button onClick={() => updateQty(product.id, quantity + 1)}
                  className="w-8 h-8 border-2 border-border hover:bg-primary hover:text-surface text-ink font-black transition-colors flex items-center justify-center bg-surface">
                  +
                </button>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-ink">{product.price * quantity} ₴</p>
                <button onClick={() => removeItem(product.id)}
                  className="text-xs font-bold text-muted hover:text-danger transition-colors mt-1 uppercase">
                  Видалити
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:w-72 shrink-0">
          <div className="bg-surface border-2 border-border p-5 lg:sticky lg:top-16 shadow-[4px_4px_0px_#4a4e8f]">
            <h2 className="text-sm font-black text-ink uppercase tracking-widest mb-4 border-b-2 border-border pb-2">Підсумок</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted font-bold uppercase text-xs">Сума</span>
                <span className="text-ink font-black">{subtotal} ₴</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between font-black text-success">
                  <span className="uppercase text-xs">Знижка</span>
                  <span>−{discountAmount} ₴</span>
                </div>
              )}
              <div className="flex justify-between font-black pt-3 border-t-2 border-border text-base">
                <span className="text-ink uppercase">Разом</span>
                <span className="text-ink">{finalTotal} ₴</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex gap-0">
                <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="ПРОМОКОД" className="input-natural flex-1 px-3 py-2 text-xs font-black uppercase" />
                <button onClick={handlePromo} disabled={promoLoading || !promoCode.trim()}
                  className="bg-accent text-ink border-2 border-l-0 border-border px-3 text-xs font-black uppercase hover:bg-[#3d408a] transition-colors disabled:opacity-40">
                  {promoLoading ? "..." : "OK"}
                </button>
              </div>
              {promo && (
                <p className={`text-xs mt-2 font-black uppercase ${promo.valid ? "text-success" : "text-danger"}`}>
                  {promo.valid ? `✓ −${discountAmount} ₴` : `✗ ${promo.message ?? "Недійсний"}`}
                </p>
              )}
            </div>

            <Link href={`/checkout${promo?.valid ? `?promo=${promoCode}` : ""}`}
              className="btn-pill block w-full text-center py-3 text-xs">
              Оформити →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
