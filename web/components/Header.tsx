"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCartStore } from "@/lib/cart-store";

export default function Header() {
  const router = useRouter();
  const count = useCartStore((s) => s.count());
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🧸</span>
          <span className="font-bold text-xl text-primary hidden sm:block">ToyShop</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex">
          <div className="relative w-full max-w-xl">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук іграшок..."
              className="w-full border border-gray-200 rounded-full px-4 py-2 pr-10 text-sm
                         focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
            >
              🔍
            </button>
          </div>
        </form>

        {/* Nav */}
        <nav className="flex items-center gap-4 shrink-0">
          <Link href="/catalog" className="text-sm text-gray-600 hover:text-primary hidden md:block">
            Каталог
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative">
            <span className="text-2xl">🛒</span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-danger text-white text-xs
                               rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
