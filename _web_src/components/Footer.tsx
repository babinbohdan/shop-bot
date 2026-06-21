import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🧸</span>
            <span className="text-white font-bold text-lg">ToyShop</span>
          </div>
          <p className="text-sm leading-relaxed">
            Якісні іграшки для щасливого дитинства. Оригінальні товари від
            перевірених виробників.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-white font-semibold mb-3">Магазин</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/catalog" className="hover:text-white transition">Каталог</Link></li>
            <li><Link href="/cart" className="hover:text-white transition">Кошик</Link></li>
            <li><Link href="/checkout" className="hover:text-white transition">Оформити замовлення</Link></li>
          </ul>
        </div>

        {/* Info */}
        <div>
          <h3 className="text-white font-semibold mb-3">Інформація</h3>
          <ul className="space-y-2 text-sm">
            <li>📦 Доставка: Нова Пошта, Укрпошта</li>
            <li>💳 Оплата: Картка, Готівка при отриманні</li>
            <li>📞 Підтримка через Telegram-бот</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 py-4 text-center text-xs">
        © {new Date().getFullYear()} ToyShop. Всі права захищено.
      </div>
    </footer>
  );
}
