"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const count = useCartStore((s) => s.count());
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🧸</span>
          <span className="font-bold text-[#2481cc] text-lg hidden sm:block">
            ToyShop
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук іграшок..."
              className="w-full h-10 pl-4 pr-10 rounded-full border border-gray-200 bg-gray-50
                         text-sm focus:outline-none focus:border-[#2481cc] focus:bg-white transition"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2481cc] transition"
            >
              🔍
            </button>
          </div>
        </form>

        {/* Nav icons */}
        <nav className="flex items-center gap-1 shrink-0">
          <Link
            href="/catalog"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition
              ${pathname === "/catalog" ? "bg-blue-50 text-[#2481cc]" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Каталог
          </Link>

          <Link href="/cart" className="relative p-2 rounded-lg hover:bg-gray-50 transition">
            <span className="text-xl">🛒</span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#e53935] text-white text-[10px]
                               font-bold min-w-[18px] h-[18px] rounded-full flex items-center
                               justify-center px-1">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
