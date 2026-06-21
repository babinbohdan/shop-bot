import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="font-bold text-lg mb-3">
            <span className="text-gold">TOY</span>SHOP
          </div>
          <p className="text-sm text-muted leading-relaxed">
            Якісні дитячі іграшки з доставкою по всій Україні.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3 uppercase tracking-wider">Магазин</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/catalog" className="hover:text-gold transition-colors">Каталог</Link></li>
            <li><Link href="/catalog?sort=newest" className="hover:text-gold transition-colors">Новинки</Link></li>
            <li><Link href="/cart" className="hover:text-gold transition-colors">Кошик</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink mb-3 uppercase tracking-wider">Доставка</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li>Нова Пошта / Укрпошта</li>
            <li>Оплата при отриманні</li>
            <li>Підтримка через Telegram</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border text-center py-4 text-xs text-muted">
        © {year} ToyShop. Всі права захищені.
      </div>
    </footer>
  );
}
