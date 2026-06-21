"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { createOrder } from "@/lib/api";

type DeliveryType = "nova_poshta" | "ukrposhta" | "courier" | "pickup";

const DELIVERY_OPTIONS: { value: DeliveryType; label: string }[] = [
  { value: "nova_poshta", label: "Нова Пошта" },
  { value: "ukrposhta",   label: "Укрпошта" },
  { value: "courier",     label: "Кур'єр" },
  { value: "pickup",      label: "Самовивіз" },
];

function CheckoutForm() {
  const searchParams = useSearchParams();
  const { items, total, clearCart } = useCartStore();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    delivery_type: "nova_poshta" as DeliveryType,
    delivery_address: "",
    promo_code: searchParams.get("promo") ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ order_number: string } | null>(null);

  const subtotal = total();
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    setError("");
    try {
      const result = await createOrder({
        ...form,
        items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
      });
      clearCart();
      setSuccess({ order_number: result.order_number });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка оформлення");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center fade-up">
        <div className="w-16 h-16 rounded-full border border-gold flex items-center justify-center mx-auto mb-6">
          <span className="text-gold text-2xl">✓</span>
        </div>
        <h1 className="text-2xl font-semibold mb-2 text-ink">Замовлення оформлено!</h1>
        <p className="text-muted mb-1">
          Номер замовлення: <span className="text-gold font-semibold">#{success.order_number}</span>
        </p>
        <p className="text-muted text-sm mb-8">Ми зв&apos;яжемося з вами для підтвердження</p>
        <Link href="/catalog" className="btn-gold px-8 py-3">
          Продовжити покупки
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-muted mb-4">Кошик порожній</p>
        <Link href="/catalog" className="text-gold hover:text-gold-light transition-colors">← До каталогу</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-xl font-semibold text-ink">Оформлення замовлення</h1>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <form onSubmit={handleSubmit} className="flex-1 space-y-4">

          {/* Contact */}
          <div className="card-bordered bg-surface rounded-lg p-5">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Контактні дані</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted mb-1 block">Ім&apos;я та прізвище *</label>
                <input required value={form.full_name} onChange={(e) => set("full_name", e.target.value)}
                  placeholder="Іван Петренко" className="input-dark w-full px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Телефон *</label>
                <input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  placeholder="+380__" className="input-dark w-full px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">Місто *</label>
                <input required value={form.city} onChange={(e) => set("city", e.target.value)}
                  placeholder="Київ" className="input-dark w-full px-3 py-2.5 text-sm" />
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="card-bordered bg-surface rounded-lg p-5">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Доставка</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {DELIVERY_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => set("delivery_type", opt.value)}
                  className={`py-2.5 px-3 rounded border text-sm font-medium transition-colors text-center
                    ${form.delivery_type === opt.value
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border text-muted hover:border-gold/50 hover:text-ink"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            {form.delivery_type !== "pickup" && (
              <div>
                <label className="text-xs text-muted mb-1 block">Адреса / відділення</label>
                <input value={form.delivery_address} onChange={(e) => set("delivery_address", e.target.value)}
                  placeholder="Відділення №1, вул. Шевченка 1" className="input-dark w-full px-3 py-2.5 text-sm" />
              </div>
            )}
          </div>

          {/* Promo */}
          <div className="card-bordered bg-surface rounded-lg p-5">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Промокод</h2>
            <input value={form.promo_code} onChange={(e) => set("promo_code", e.target.value.toUpperCase())}
              placeholder="WELCOME10" className="input-dark px-3 py-2.5 text-sm max-w-xs w-full" />
          </div>

          {error && (
            <div className="border border-danger/40 bg-danger/10 text-danger text-sm px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="btn-gold w-full py-3.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Оформлення..." : "Підтвердити замовлення →"}
          </button>
        </form>

        {/* Summary */}
        <div className="lg:w-64 shrink-0">
          <div className="card-bordered bg-surface rounded-lg p-5 lg:sticky lg:top-20">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Замовлення</h2>
            <div className="space-y-2 mb-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between text-sm gap-2">
                  <span className="line-clamp-1 flex-1 text-muted">{product.name} ×{quantity}</span>
                  <span className="shrink-0 text-ink font-medium">{product.price * quantity} ₴</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="text-sm text-ink font-semibold">Разом</span>
              <span className="text-gold font-semibold">{subtotal} ₴</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted">Завантаження...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
