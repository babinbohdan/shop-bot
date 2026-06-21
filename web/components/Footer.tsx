import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🧸</span>
            <span className="font-bold text-white text-lg">ToyShop</span>
          </div>
          <p className="text-sm text-gray-400">
            Якісні дитячі іграшки з швидкою доставкою по всій Україні.
          </p>
        </div>

        {/* Shop links */}
        <div>
          <h3 className="font-semibold text-white mb-3">Магазин</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/catalog" className="hover:text-white transition-colors">Каталог</Link></li>
            <li><Link href="/catalog?sort=newest" className="hover:text-white transition-colors">Новинки</Link></li>
            <li><Link href="/catalog?in_stock=true" className="hover:text-white transition-colors">В наявності</Link></li>
            <li><Link href="/cart" className="hover:text-white transition-colors">Кошик</Link></li>
          </ul>
        </div>

        {/* Info */}
        <div>
          <h3 className="font-semibold text-white mb-3">Інформація</h3>
          <ul className="space-y-2 text-sm">
            <li>🚚 Доставка: Нова Пошта, Укрпошта</li>
            <li>💳 Оплата при отриманні / онлайн</li>
            <li>📞 Підтримка через Telegram-бот</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 text-center py-4 text-xs text-gray-500">
        © {year} ToyShop. Всі права захищені.
      </div>
    </footer>
  );
}
