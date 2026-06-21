"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/lib/api";
import { useState } from "react";

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const discount = product.old_price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  return (
    <Link href={`/catalog/${product.id}`} className="block group">
      <div className="card-shadow overflow-hidden h-full flex flex-col">
        {discount > 0 && (
          <span className="absolute top-0 left-0 z-10 bg-danger text-surface text-[10px] font-black px-2 py-0.5 uppercase tracking-wider">
            -{discount}%
          </span>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-surface/80 z-10 flex items-center justify-center border-2 border-border">
            <span className="text-xs font-black text-ink uppercase tracking-wider border-2 border-border bg-surface px-3 py-1">Немає</span>
          </div>
        )}

        <div className="relative h-44 bg-panel overflow-hidden">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, 25vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl bg-panel">🧸</div>
          )}
        </div>

        <div className="p-3 flex flex-col flex-1 border-t-2 border-border">
          <p className="text-sm text-ink line-clamp-2 mb-2 flex-1 font-bold uppercase leading-tight">{product.name}</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-base font-black text-ink">{product.price} ₴</span>
            {product.old_price && (
              <span className="text-xs text-muted line-through">{product.old_price} ₴</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={!product.in_stock || added}
            className="btn-pill w-full py-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {added ? "✓ ДОДАНО" : "В КОШИК"}
          </button>
        </div>
      </div>
    </Link>
  );
}
