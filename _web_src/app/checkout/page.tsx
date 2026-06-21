"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { createOrder } from "@/lib/api";

type DeliveryType = "nova_poshta" | "ukrposhta" | "courier" | "pickup";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, count, clearCart } = useCartStore();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    city: "",
    delivery_type: "nova_poshta" as DeliveryType,
    delivery_address: "",
    promo_code: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.city) {
      setError("Заповніть усі обов'язкові поля");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await createOrder({
        ...form,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
      });
      clearCart();
      setSuccess(result.order_number ?? String(result.order_id));
    } catch (e: any) {
      setError(e.message ?? "Помилка оформлення");
    } finally {
      setLoading(false);
    }
  };

  if (count() === 0 && !success) {
    return (
      <div className="text-center py-24 px-4 fade-up">
        <p className="text-5xl mb-4">🛒</p>
        <h2 className="text-xl font-bold text-gray-700 mb-4">Кошик порожній</h2>
        <Link href="/catalog" className="text-[#2481cc] hover:underline">
          Перейти до каталогу →
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center fade-up">
        <p className="text-6xl mb-4">🎉</p>
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Замовлення прийнято!</h2>
        <p className="text-gray-500 mb-2">
          Номер замовлення: <strong className="text-[#2481cc]">{success}</strong>
        </p>
        <p className="text-gray-500 mb-8 max-w-sm">
          Ми зв'яжемось з вами для підтвердження. Дякуємо за покупку! 🧸
        </p>
        <Link
          href="/catalog"
          className="bg-[#2481cc] hover:bg-[#1a6ab5] text-white font-bold px-8 py-3 rounded-2xl transition"
        >
          Продовжити покупки
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 fade-up">
      <h1 className="text-2xl font-extrabold mb-6 text-gray-800">Оформлення замовлення</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-5">
          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-extrabold text-gray-700">👤 Контактні дані</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="ПІБ *" value={form.full_name} onChange={(v) => set("full_name", v)}
                     placeholder="Іваненко Іван Іванович" />
              <Field label="Телефон *" value={form.phone} onChange={(v) => set("phone", v)}
                     placeholder="+380501234567" type="tel" />
            </div>
          </div>

          {/* Delivery */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h2 className="font-extrabold text-gray-700">🚚 Доставка</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: "nova_poshta", label: "Нова Пошта" },
                { value: "ukrposhta",  label: "Укрпошта" },
                { value: "courier",    label: "Кур'єр" },
                { value: "pickup",     label: "Самовивіз" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("delivery_type", opt.value)}
                  className={`py-2 px-3 rounded-xl text-sm font-semibold border transition
                    ${form.delivery_type === opt.value
                      ? "bg-[#2481cc] text-white border-[#2481cc]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#2481cc]"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Field label="Місто *" value={form.city} onChange={(v) => set("city", v)}
                   placeholder="Київ" />
            {form.delivery_type !== "pickup" && (
              <Field
                label="Відділення або адреса"
                value={form.delivery_address}
                onChange={(v) => set("delivery_address", v)}
                placeholder={form.delivery_type === "nova_poshta"
                  ? "Відділення №5 або вулиця..."
                  : "Вулиця, будинок, квартира"}
              />
            )}
          </div>

          {/* Promo */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="font-extrabold text-gray-700 mb-3">🎟 Промокод</h2>
            <Field label="" value={form.promo_code} onChange={(v) => set("promo_code", v)}
                   placeholder="WELCOME10 (необов'язково)" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-[#e53935] text-sm font-semibold
                            px-4 py-3 rounded-2xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2481cc] hover:bg-[#1a6ab5] disabled:bg-gray-300
                       text-white font-bold py-4 rounded-2xl text-lg transition active:scale-95"
          >
            {loading ? "Оформлення..." : "✅ Підтвердити замовлення"}
          </button>
        </form>

        {/* Summary */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
            <h2 className="font-extrabold text-gray-800 mb-4">Ваше замовлення</h2>
            <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate mr-2">
                    {product.name} × {quantity}
                  </span>
                  <span className="shrink-0 font-semibold">
                    {(product.price * quantity).toFixed(0)} ₴
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-extrabold">
              <span>Разом</span>
              <span className="text-[#2481cc]">{total().toFixed(2)} ₴</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      {label && <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm
                   focus:outline-none focus:border-[#2481cc] transition bg-gray-50 focus:bg-white"
      />
    </div>
  );
}
