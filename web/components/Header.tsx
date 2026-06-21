"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/cart-store";

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const count = useCartStore((s) => s.count());

  useEffect(() => setMounted(true), []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <span className="text-gold font-bold text-xl tracking-tight group-hover:text-gold-light transition-colors">
            TOY<span className="text-ink">SHOP</span>
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-lg">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук іграшок..."
              className="input-dark w-full px-4 py-2 pr-10 text-sm"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gold transition-colors"
              aria-label="Пошук"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
        </form>

        {/* Nav */}
        <nav className="flex items-center gap-5 shrink-0">
          <Link href="/catalog" className="text-sm text-muted hover:text-ink transition-colors hidden md:block">
            Каталог
          </Link>
          <Link href="/cart" className="relative flex items-center gap-1.5 text-sm text-muted hover:text-gold transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {mounted && count > 0 && (
              <span className="absolute -top-2 -right-2 bg-gold text-bg text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
