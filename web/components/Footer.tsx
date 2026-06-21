import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-primary mt-auto border-t-2 border-accent">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="font-black text-xl tracking-tighter uppercase mb-3 text-surface">
            TOY<span className="bg-accent text-surface px-1">SHOP</span>
          </p>
          <p className="text-sm text-surface/60 leading-relaxed">
            Якісні дитячі іграшки з доставкою по всій Україні.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-black text-accent mb-3 uppercase tracking-widest">Магазин</h3>
          <ul className="space-y-2 text-sm text-surface/60">
            <li><Link href="/catalog" className="hover:text-surface transition-colors">Каталог</Link></li>
            <li><Link href="/catalog?sort=newest" className="hover:text-surface transition-colors">Новинки</Link></li>
            <li><Link href="/cart" className="hover:text-surface transition-colors">Кошик</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-black text-accent mb-3 uppercase tracking-widest">Доставка</h3>
          <ul className="space-y-2 text-sm text-surface/60">
            <li>Нова Пошта / Укрпошта</li>
            <li>Оплата при отриманні</li>
            <li>Підтримка через Telegram</li>
          </ul>
        </div>
      </div>
      <div className="border-t-2 border-accent text-center py-4 text-xs text-surface/40">
        © {year} ToyShop
      </div>
    </footer>
  );
}
