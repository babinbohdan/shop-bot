"use client";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/lib/api";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);

  const discount =
    product.old_price && product.old_price > product.price
      ? Math.round((1 - product.price / product.old_price) * 100)
      : 0;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Image */}
      <Link href={`/catalog/${product.id}`} className="block relative pt-[100%] bg-gray-50 overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">🧸</div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-[#e53935] text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-500">Немає в наявності</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        {product.vendor && (
          <p className="text-xs text-gray-400 truncate">{product.vendor}</p>
        )}
        <Link href={`/catalog/${product.id}`}>
          <h3 className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 hover:text-[#2481cc] transition">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-base font-bold text-[#2481cc]">
              {product.price.toFixed(2)} ₴
            </p>
            {product.old_price && (
              <p className="text-xs text-gray-400 line-through">
                {product.old_price.toFixed(2)} ₴
              </p>
            )}
          </div>

          {product.in_stock && (
            <button
              onClick={() => addItem(product)}
              className="shrink-0 bg-[#2481cc] hover:bg-[#1a6ab5] text-white text-xs font-semibold
                         px-3 py-1.5 rounded-xl transition active:scale-95"
            >
              + В кошик
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
