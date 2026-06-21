import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export const revalidate = 60;

export default async function HomePage() {
  const categories = await getCategories().catch(() => []);
  const firstCat = categories[0]?.id;
  const featuredProducts = firstCat
    ? await getProducts({ category_id: firstCat, per_page: 8 }).catch(() => [])
    : [];

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <p className="text-gold text-sm font-medium tracking-widest uppercase mb-4">Офіційний магазин</p>
            <h1 className="text-4xl md:text-6xl font-bold text-ink leading-tight mb-6">
              Іграшки, що<br />
              <span className="text-gold">надихають</span>
            </h1>
            <p className="text-muted text-lg mb-8 max-w-md">
              Якісні дитячі іграшки для розвитку та радості. Доставка по всій Україні.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalog" className="btn-gold px-6 py-3 text-sm">
                Переглянути каталог
              </Link>
              <Link href="/catalog?sort=newest" className="btn-outline px-6 py-3 text-sm">
                Новинки
              </Link>
            </div>
          </div>

          {/* Декоративний блок */}
          <div className="shrink-0 w-64 h-64 border border-border rounded-lg bg-surface flex items-center justify-center relative">
            <div className="absolute inset-4 border border-gold/20 rounded" />
            <span className="text-7xl">🧸</span>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "→", text: "Нова Пошта / Укрпошта" },
            { icon: "✓", text: "Гарантія якості" },
            { icon: "↺", text: "Легкий обмін" },
            { icon: "◈", text: "Оплата при отриманні" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-sm text-muted">
              <span className="text-gold">{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-14">
        {/* Categories */}
        {categories.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold text-ink">Категорії</h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.slice(0, 12).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/catalog?category_id=${cat.id}`}
                  className="card-bordered bg-surface rounded-lg p-4 text-center group"
                >
                  <div className="text-2xl mb-2 text-gold group-hover:scale-110 transition-transform">✦</div>
                  <div className="text-xs font-medium text-ink group-hover:text-gold transition-colors line-clamp-2">
                    {cat.name}
                  </div>
                  {cat.product_count > 0 && (
                    <div className="text-xs text-muted mt-1">{cat.product_count}</div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured products */}
        {featuredProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-ink">Популярні товари</h2>
                <div className="h-px bg-border w-24 hidden md:block" />
              </div>
              <Link href="/catalog" className="text-gold text-sm hover:text-gold-light transition-colors">
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

        {/* Promo */}
        <section className="border border-gold/30 rounded-lg p-8 text-center bg-surface">
          <p className="text-gold text-xs font-medium tracking-widest uppercase mb-2">Перше замовлення</p>
          <h3 className="text-3xl font-bold text-ink mb-2">Знижка 10%</h3>
          <p className="text-muted mb-5 text-sm">Введіть промокод при оформленні замовлення</p>
          <div className="inline-block border border-gold text-gold font-bold text-lg px-8 py-2 rounded tracking-widest">
            WELCOME10
          </div>
        </section>
      </div>
    </>
  );
}
