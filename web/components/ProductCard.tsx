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
      <div className="card-bordered bg-surface rounded-lg overflow-hidden relative h-full flex flex-col">
        {discount > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-gold text-bg text-xs font-bold px-2 py-0.5 rounded">
            -{discount}%
          </span>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-bg/60 z-10 flex items-center justify-center">
            <span className="text-xs text-muted border border-border px-3 py-1 rounded">Немає в наявності</span>
          </div>
        )}

        {/* Image */}
        <div className="relative h-44 bg-panel">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted">✦</div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col flex-1">
          <p className="text-sm text-ink line-clamp-2 mb-2 flex-1">{product.name}</p>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-base font-semibold text-gold">{product.price} ₴</span>
            {product.old_price && (
              <span className="text-xs text-muted line-through">{product.old_price} ₴</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={!product.in_stock || added}
            className="w-full py-2 text-sm font-medium rounded transition-all
                       border border-gold text-gold hover:bg-gold hover:text-bg
                       disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            {added ? "✓ Додано" : "+ В кошик"}
          </button>
        </div>
      </div>
    </Link>
  );
}
