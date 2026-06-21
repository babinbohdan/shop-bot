"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/lib/api";
import { useState } from "react";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
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
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden relative">
        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-danger text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}

        {/* Out of stock overlay */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
            <span className="text-sm text-gray-500 font-medium">Немає в наявності</span>
          </div>
        )}

        {/* Image */}
        <div className="relative h-44 bg-gray-50">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl">🧸</div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-sm font-medium line-clamp-2 mb-2 min-h-[2.5rem]">{product.name}</p>

          <div className="flex items-end gap-2 mb-3">
            <span className="text-lg font-bold text-primary">{product.price} ₴</span>
            {product.old_price && (
              <span className="text-xs text-gray-400 line-through">{product.old_price} ₴</span>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={!product.in_stock || added}
            className="w-full py-2 rounded-xl text-sm font-semibold transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed
                       bg-primary text-white hover:bg-primary/90 active:scale-95"
          >
            {added ? "✓ Додано" : "+ В кошик"}
          </button>
        </div>
      </div>
    </Link>
  );
}
