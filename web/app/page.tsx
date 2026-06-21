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
      <section className="bg-primary border-b-2 border-accent">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <div className="inline-block bg-accent text-surface text-xs font-black px-3 py-1 uppercase tracking-widest mb-5">
              ★ Доставка по Україні
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-surface uppercase leading-none mb-6 tracking-tighter">
              НАЙКРАЩІ<br />ІГРАШКИ<br />
              <span className="bg-accent text-surface px-2">ДЛЯ ДІТЕЙ</span>
            </h1>
            <p className="text-surface/60 text-base mb-8 max-w-md font-semibold uppercase tracking-wide">
              Якісні дитячі іграшки · Безпечні матеріали · Швидка доставка
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalog" className="btn-pill px-8 py-3 text-sm">
                Переглянути каталог
              </Link>
              <Link href="/catalog?sort=newest" className="btn-outline px-8 py-3 text-sm border-accent text-surface hover:bg-accent">
                Новинки
              </Link>
            </div>
          </div>

          <div className="shrink-0 w-60 h-60 bg-[#1f3520] border-2 border-accent flex items-center justify-center relative overflow-hidden shadow-[8px_8px_0px_#7d8471]">
            <span className="text-9xl">🧸</span>
            <div className="absolute top-2 right-2 bg-accent text-surface text-xs font-black px-2 py-0.5 uppercase">New!</div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b-2 border-border bg-panel">
        <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "🚚", text: "НОВА ПОШТА / УКРПОШТА" },
            { icon: "✅", text: "ГАРАНТІЯ ЯКОСТІ" },
            { icon: "🔄", text: "ЛЕГКИЙ ОБМІН" },
            { icon: "💳", text: "ОПЛАТА ПРИ ОТРИМАННІ" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2 text-xs text-primary font-black tracking-wider">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-14">

        {/* Categories */}
        {categories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-black text-ink uppercase tracking-tight">Категорії</h2>
              <Link href="/catalog" className="text-xs font-black text-ink uppercase tracking-wider border-2 border-border px-3 py-1.5 hover:bg-primary hover:text-surface transition-colors">
                Всі →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.slice(0, 12).map((cat) => (
                <Link key={cat.id} href={`/catalog?category_id=${cat.id}`}
                  className="bg-surface border-2 border-border p-4 text-center group hover:bg-primary transition-colors shadow-[3px_3px_0px_#a4ac86]">
                  <div className="text-2xl mb-1">🎁</div>
                  <div className="text-xs font-black text-ink group-hover:text-surface uppercase line-clamp-2 tracking-tight">{cat.name}</div>
                  {cat.product_count > 0 && (
                    <div className="text-xs text-muted group-hover:text-surface/70 mt-0.5 font-bold">{cat.product_count} шт</div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured */}
        {featuredProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-black text-ink uppercase tracking-tight">Популярні</h2>
              <Link href="/catalog" className="text-xs font-black text-ink uppercase tracking-wider border-2 border-border px-3 py-1.5 hover:bg-primary hover:text-surface transition-colors">
                Всі →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 fade-up">
              {featuredProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Promo */}
        <section className="bg-primary border-2 border-accent p-8 md:p-12 text-center relative overflow-hidden shadow-[6px_6px_0px_#a4ac86]">
          <div className="relative">
            <p className="text-surface/50 text-xs font-black tracking-widest uppercase mb-2">ПЕРШЕ ЗАМОВЛЕННЯ</p>
            <h3 className="text-5xl md:text-6xl font-black text-surface mb-2 tracking-tighter uppercase">ЗНИЖКА 10%</h3>
            <p className="text-surface/50 text-sm font-bold uppercase tracking-wider mb-6">Введіть промокод при оформленні</p>
            <div className="inline-block bg-accent border-2 border-accent text-surface font-black text-2xl px-12 py-3 tracking-widest uppercase shadow-[4px_4px_0px_#1f3520]">
              WELCOME10
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
