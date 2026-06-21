"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { createOrder } from "@/lib/api";

type DeliveryType = "nova_poshta" | "ukrposhta" | "courier" | "pickup";

const DELIVERY_OPTIONS: { value: DeliveryType; label: string; icon: string }[] = [
  { value: "nova_poshta", label: "Нова Пошта", icon: "📦" },
  { value: "ukrposhta", label: "Укрпошта", icon: "📮" },
  { value: "courier", label: "Кур'єр", icon: "🚴" },
  { value: "pickup", label: "Самовивіз", icon: "🏪" },
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

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

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
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-2">Замовлення оформлено!</h1>
        <p className="text-gray-500 mb-2">
          Номер замовлення:{" "}
          <span className="font-bold text-primary">#{success.order_number}</span>
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Ми зв&apos;яжемося з вами для підтвердження
        </p>
        <Link
          href="/catalog"
          className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-full hover:bg-primary/90 transition-colors"
        >
          Продовжити покупки
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-gray-400 mb-4">Кошик порожній</p>
        <Link href="/catalog" className="text-primary hover:underline">← До каталогу</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Оформлення замовлення</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-4">
          {/* Contact */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-semibold mb-4">Контактні дані</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Ім&apos;я та прізвище *</label>
                <input
                  required
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  placeholder="Іван Петренко"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                             focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Телефон *</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="+38 (0__) ___-__-__"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                             focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">Місто *</label>
                <input
                  required
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Київ"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                             focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-semibold mb-4">Доставка</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {DELIVERY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("delivery_type", opt.value)}
                  className={`py-3 px-2 rounded-xl border text-sm font-medium transition-colors text-center ${
                    form.delivery_type === opt.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-xl mb-1">{opt.icon}</div>
                  {opt.label}
                </button>
              ))}
            </div>
            {form.delivery_type !== "pickup" && (
              <div>
                <label className="text-sm text-gray-500 mb-1 block">
                  Адреса / відділення
                </label>
                <input
                  value={form.delivery_address}
                  onChange={(e) => set("delivery_address", e.target.value)}
                  placeholder="Відділення №1, вул. Шевченка 1"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                             focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Promo */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-semibold mb-3">Промокод</h2>
            <input
              value={form.promo_code}
              onChange={(e) => set("promo_code", e.target.value.toUpperCase())}
              placeholder="WELCOME10"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:border-primary max-w-xs"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-danger text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl
                       hover:bg-primary/90 active:scale-95 transition-all
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Оформлення..." : "Підтвердити замовлення →"}
          </button>
        </form>

        {/* Summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-2xl shadow-sm p-5 lg:sticky lg:top-20">
            <h2 className="font-bold text-lg mb-4">Замовлення</h2>
            <div className="space-y-2 mb-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between text-sm">
                  <span className="line-clamp-1 flex-1 text-gray-600">{product.name} ×{quantity}</span>
                  <span className="shrink-0 ml-2 font-medium">{product.price * quantity} ₴</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold">
              <span>Разом</span>
              <span className="text-primary">{subtotal} ₴</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-gray-400">Завантаження...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
