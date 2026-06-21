import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-ink text-primary mt-auto border-t-2 border-ink">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <p className="font-black text-xl tracking-tighter uppercase mb-3">
            TOY<span className="bg-primary text-ink px-1">SHOP</span>
          </p>
          <p className="text-sm text-yellow-200 leading-relaxed">
            Якісні дитячі іграшки з доставкою по всій Україні.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-black text-primary mb-3 uppercase tracking-widest">Магазин</h3>
          <ul className="space-y-2 text-sm text-yellow-200">
            <li><Link href="/catalog" className="hover:text-primary transition-colors">Каталог</Link></li>
            <li><Link href="/catalog?sort=newest" className="hover:text-primary transition-colors">Новинки</Link></li>
            <li><Link href="/cart" className="hover:text-primary transition-colors">Кошик</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-black text-primary mb-3 uppercase tracking-widest">Доставка</h3>
          <ul className="space-y-2 text-sm text-yellow-200">
            <li>Нова Пошта / Укрпошта</li>
            <li>Оплата при отриманні</li>
            <li>Підтримка через Telegram</li>
          </ul>
        </div>
      </div>
      <div className="border-t-2 border-zinc-700 text-center py-4 text-xs text-yellow-300">
        © {year} ToyShop
      </div>
    </footer>
  );
}
