import Link from "next/link";
import Image from "next/image";
import { getCategories, getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export const revalidate = 60; // ISR кожну хвилину

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategories().catch(() => []),
    getProducts({ per_page: 8, sort: "popular" }).catch(() => []),
  ]);

  return (
    <div className="fade-up">
      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#2481cc] to-[#1a6ab5] text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-3">
              🧸 Інтернет-магазин іграшок
            </p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Подарунки, що<br />
              <span className="text-yellow-300">приносять радість</span>
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-md">
              Якісні іграшки для дітей від 0 до 14 років. Оригінальні бренди,
              швидка доставка по Україні.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold
                           px-6 py-3 rounded-2xl transition active:scale-95"
              >
                Переглянути каталог →
              </Link>
              <Link
                href="/catalog?sort=newest"
                className="border border-white/40 hover:bg-white/10 text-white font-semibold
                           px-6 py-3 rounded-2xl transition"
              >
                Новинки
              </Link>
            </div>
          </div>
          <div className="text-[120px] md:text-[160px] leading-none select-none">
            🎁
          </div>
        </div>
      </section>

      {/* ─── Trust bar ─────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "✅", text: "Оригінальні товари" },
            { icon: "🚚", text: "Доставка 1–2 дні" },
            { icon: "🔄", text: "Легке повернення" },
            { icon: "🔒", text: "Безпечна оплата" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-xl">{icon}</span>
              <span className="font-medium">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Categories ────────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-gray-800">Категорії</h2>
            <Link href="/catalog" className="text-[#2481cc] text-sm font-semibold hover:underline">
              Всі категорії →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.slice(0, 12).map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog?category=${cat.id}`}
                className="group flex flex-col items-center gap-2 p-4 bg-white rounded-2xl
                           border border-gray-100 hover:border-[#2481cc] hover:shadow-md
                           transition text-center"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">🎮</span>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-[#2481cc]
                                 transition leading-snug">
                  {cat.name}
                </span>
                <span className="text-[10px] text-gray-400">{cat.product_count} товарів</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Featured products ─────────────────────────────────────────────── */}
      {products.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-gray-800">🔥 Хіти продажів</h2>
            <Link href="/catalog" className="text-[#2481cc] text-sm font-semibold hover:underline">
              Всі товари →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Promo banner ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-3xl p-8 flex
                        flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-gray-900">
            <p className="text-sm font-semibold uppercase tracking-wide mb-1">🎉 Для нових клієнтів</p>
            <h3 className="text-3xl font-extrabold mb-2">Знижка 10%</h3>
            <p className="text-gray-800">
              Використайте промокод <strong>WELCOME10</strong> при першому замовленні
            </p>
          </div>
          <Link
            href="/catalog"
            className="shrink-0 bg-gray-900 hover:bg-gray-700 text-white font-bold
                       px-8 py-4 rounded-2xl transition active:scale-95"
          >
            Обрати іграшку →
          </Link>
        </div>
      </section>
    </div>
  );
}
