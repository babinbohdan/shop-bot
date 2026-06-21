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
    <header className="sticky top-0 z-50 bg-primary border-b-2 border-accent">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-1.5 shrink-0 group">
          <span className="font-black text-xl tracking-tighter text-surface uppercase leading-none">
            TOY<span className="bg-accent text-surface px-1">SHOP</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="flex">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ЗНАЙТИ ІГРАШКУ..."
              className="input-natural flex-1 px-3 py-1.5 text-sm uppercase font-bold tracking-wide"
            />
            <button type="submit"
              className="bg-accent text-surface border-2 border-l-0 border-accent px-3 font-bold text-sm uppercase hover:bg-[#1f3520] transition-colors">
              →
            </button>
          </div>
        </form>

        <nav className="flex items-center gap-3 shrink-0">
          <Link href="/catalog"
            className="hidden md:block text-xs font-black text-surface uppercase tracking-wider hover:bg-accent transition-colors px-3 py-1.5 border-2 border-accent">
            Каталог
          </Link>
          <Link href="/cart" className="relative border-2 border-accent bg-[#1f3520] p-1.5 hover:bg-accent transition-colors group text-surface">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            {mounted && count > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-surface text-xs w-4 h-4 flex items-center justify-center font-black text-[9px]">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
