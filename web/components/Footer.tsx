import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-surface text-ink mt-auto border-t-2 border-border">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="font-black text-xl tracking-tighter uppercase mb-3">
            TOY<span className="bg-primary text-surface px-1">SHOP</span>
          </p>
          <p className="text-sm text-muted leading-relaxed">
            Якісні дитячі іграшки з доставкою по всій Україні.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-black text-primary mb-3 uppercase tracking-widest">Магазин</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/catalog" className="hover:text-ink transition-colors">Каталог</Link></li>
            <li><Link href="/catalog?sort=newest" className="hover:text-ink transition-colors">Новинки</Link></li>
            <li><Link href="/cart" className="hover:text-ink transition-colors">Кошик</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-black text-primary mb-3 uppercase tracking-widest">Доставка</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li>Нова Пошта / Укрпошта</li>
            <li>Оплата при отриманні</li>
            <li>Підтримка через Telegram</li>
          </ul>
        </div>
      </div>
      <div className="border-t-2 border-border text-center py-4 text-xs text-muted">
        © {year} ToyShop
      </div>
    </footer>
  );
}
