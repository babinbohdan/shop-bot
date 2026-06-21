import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export const revalidate = 60;

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    getCategories().catch(() => []),
    getProducts({ per_page: 8, sort: "popular" }).catch(() => []),
  ]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-primary via-[#1a6ab5] to-[#0d4d8a] text-white py-16 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              Іграшки, що<br />
              <span className="text-yellow-300">розвивають</span> і радують
            </h1>
            <p className="text-blue-100 text-lg mb-8">
              Широкий вибір якісних дитячих іграшок. Доставка по всій Україні.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="bg-white text-primary font-bold px-6 py-3 rounded-full
                           hover:bg-yellow-300 hover:text-gray-800 transition-colors"
              >
                Переглянути каталог →
              </Link>
              <Link
                href="/catalog?sort=newest"
                className="border border-white/50 text-white font-semibold px-6 py-3 rounded-full
                           hover:bg-white/10 transition-colors"
              >
                Новинки
              </Link>
            </div>
          </div>
          <div className="text-8xl md:text-9xl select-none">🧸</div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────────────── */}
      <section className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🚚", text: "Нова Пошта / Укрпошта" },
            { icon: "✅", text: "Гарантія якості" },
            { icon: "🔄", text: "Легкий обмін" },
            { icon: "💳", text: "Оплата при отриманні" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-xl">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        {/* ── Categories ───────────────────────────────────────────────────── */}
        {categories.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Категорії</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.slice(0, 12).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/catalog?category_id=${cat.id}`}
                  className="bg-white rounded-2xl p-4 text-center shadow-sm hover:shadow-md
                             hover:border-primary border border-transparent transition-all group"
                >
                  <div className="text-3xl mb-2">🎁</div>
                  <div className="text-sm font-medium text-gray-700 group-hover:text-primary">
                    {cat.name}
                  </div>
                  {cat.product_count > 0 && (
                    <div className="text-xs text-gray-400 mt-1">{cat.product_count} товарів</div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured products ─────────────────────────────────────────────── */}
        {featuredProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Популярні товари</h2>
              <Link href="/catalog" className="text-primary text-sm font-semibold hover:underline">
                Всі товари →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 fade-up">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Promo banner ──────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-3xl p-8 text-center">
          <p className="text-sm font-semibold text-orange-800 mb-1">Перше замовлення</p>
          <h3 className="text-2xl font-extrabold text-white mb-2">Знижка 10%</h3>
          <p className="text-white/90 mb-4">
            Введіть промокод при оформленні замовлення
          </p>
          <div className="inline-block bg-white text-orange-600 font-bold text-xl px-6 py-2 rounded-full tracking-widest">
            WELCOME10
          </div>
        </section>
      </div>
    </>
  );
}
