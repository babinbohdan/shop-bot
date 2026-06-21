"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { createOrder } from "@/lib/api";

type DeliveryType = "nova_poshta" | "ukrposhta" | "courier" | "pickup";
const DELIVERY_OPTIONS: { value: DeliveryType; label: string; icon: string }[] = [
  { value: "nova_poshta", label: "НОВА ПОШТА", icon: "📦" },
  { value: "ukrposhta",   label: "УКРПОШТА",   icon: "📮" },
  { value: "courier",     label: "КУР'ЄР",     icon: "🚴" },
  { value: "pickup",      label: "САМОВИВІЗ",  icon: "🏪" },
];

function CheckoutForm() {
  const searchParams = useSearchParams();
  const { items, total, clearCart } = useCartStore();
  const [form, setForm] = useState({
    full_name: "", phone: "", city: "",
    delivery_type: "nova_poshta" as DeliveryType,
    delivery_address: "", promo_code: searchParams.get("promo") ?? "",
  });
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState("");
  const [success, setSuccess]   = useState<{ order_number: string } | null>(null);
  const subtotal = total();
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;
    setLoading(true); setError("");
    try {
      const result = await createOrder({ ...form, items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })) });
      clearCart();
      setSuccess({ order_number: result.order_number });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка оформлення");
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center fade-up">
      <div className="w-20 h-20 bg-primary border-2 border-ink flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_#111]">
        <span className="text-4xl">🎉</span>
      </div>
      <h1 className="text-3xl font-black mb-2 text-ink uppercase">Замовлення оформлено!</h1>
      <p className="text-muted font-bold mb-1 text-sm">Номер: <span className="text-ink font-black">#{success.order_number}</span></p>
      <p className="text-muted text-sm font-bold uppercase mb-8">Зв&apos;яжемося для підтвердження</p>
      <Link href="/catalog" className="btn-pill px-8 py-3 text-sm inline-block">Продовжити покупки</Link>
    </div>
  );

  if (!items.length) return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <p className="text-muted font-bold mb-4 uppercase">Кошик порожній</p>
      <Link href="/catalog" className="text-ink font-black hover:underline uppercase">← До каталогу</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-ink mb-6 uppercase tracking-tight">Оформлення</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <form onSubmit={handleSubmit} className="flex-1 space-y-4">

          <div className="bg-white border-2 border-ink p-5 shadow-[4px_4px_0px_#111]">
            <h2 className="text-xs font-black text-ink uppercase tracking-widest mb-4 border-b-2 border-ink pb-2">Контактні дані</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-muted uppercase tracking-wider mb-1.5 block">Ім&apos;я та прізвище *</label>
                <input required value={form.full_name} onChange={(e) => set("full_name", e.target.value)}
                  placeholder="Іван Петренко" className="input-natural w-full px-3 py-2 text-sm font-bold" />
              </div>
              <div>
                <label className="text-xs font-black text-muted uppercase tracking-wider mb-1.5 block">Телефон *</label>
                <input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  placeholder="+380__" className="input-natural w-full px-3 py-2 text-sm font-bold" />
              </div>
              <div>
                <label className="text-xs font-black text-muted uppercase tracking-wider mb-1.5 block">Місто *</label>
                <input required value={form.city} onChange={(e) => set("city", e.target.value)}
                  placeholder="Київ" className="input-natural w-full px-3 py-2 text-sm font-bold" />
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-ink p-5 shadow-[4px_4px_0px_#111]">
            <h2 className="text-xs font-black text-ink uppercase tracking-widest mb-4 border-b-2 border-ink pb-2">Доставка</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {DELIVERY_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" onClick={() => set("delivery_type", opt.value)}
                  className={`py-3 px-2 border-2 text-xs font-black uppercase tracking-wide transition-colors text-center ${
                    form.delivery_type === opt.value
                      ? "border-ink bg-ink text-primary shadow-[2px_2px_0px_#E6B800]"
                      : "border-ink bg-white text-ink hover:bg-primary"
                  }`}>
                  <div className="text-xl mb-1">{opt.icon}</div>
                  {opt.label}
                </button>
              ))}
            </div>
            {form.delivery_type !== "pickup" && (
              <div>
                <label className="text-xs font-black text-muted uppercase tracking-wider mb-1.5 block">Адреса / відділення</label>
                <input value={form.delivery_address} onChange={(e) => set("delivery_address", e.target.value)}
                  placeholder="Відділення №1" className="input-natural w-full px-3 py-2 text-sm font-bold" />
              </div>
            )}
          </div>

          <div className="bg-white border-2 border-ink p-5 shadow-[4px_4px_0px_#111]">
            <h2 className="text-xs font-black text-ink uppercase tracking-widest mb-3 border-b-2 border-ink pb-2">Промокод</h2>
            <input value={form.promo_code} onChange={(e) => set("promo_code", e.target.value.toUpperCase())}
              placeholder="WELCOME10" className="input-natural px-3 py-2 text-sm font-black uppercase max-w-xs w-full" />
          </div>

          {error && (
            <div className="border-2 border-danger bg-red-50 text-danger text-sm font-bold px-4 py-3 uppercase">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="btn-pill w-full py-3.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "ОФОРМЛЕННЯ..." : "ПІДТВЕРДИТИ ЗАМОВЛЕННЯ →"}
          </button>
        </form>

        <div className="lg:w-64 shrink-0">
          <div className="bg-white border-2 border-ink p-5 lg:sticky lg:top-16 shadow-[4px_4px_0px_#111]">
            <h2 className="text-xs font-black text-ink uppercase tracking-widest mb-4 border-b-2 border-ink pb-2">Замовлення</h2>
            <div className="space-y-2 mb-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between text-sm gap-2">
                  <span className="line-clamp-1 flex-1 text-muted font-bold uppercase text-xs">{product.name} ×{quantity}</span>
                  <span className="shrink-0 text-ink font-black text-xs">{product.price * quantity} ₴</span>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-ink pt-3 flex justify-between">
              <span className="text-sm text-ink font-black uppercase">Разом</span>
              <span className="text-ink font-black">{subtotal} ₴</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted font-bold uppercase">Завантаження...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
