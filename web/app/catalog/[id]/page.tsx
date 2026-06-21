"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProduct, getSimilarProducts } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/api";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const numId = Number(id);
    Promise.all([
      getProduct(numId),
      getSimilarProducts(numId).catch(() => [] as Product[]),
    ])
      .then(([p, sim]) => {
        setProduct(p);
        setSimilar(sim.slice(0, 4));
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-48 mb-8" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gray-100 rounded-2xl h-80" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-100 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-10 bg-gray-100 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-400">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-lg">Товар не знайдено</p>
        <Link href="/catalog" className="mt-4 inline-block text-primary hover:underline">
          ← Повернутись до каталогу
        </Link>
      </div>
    );
  }

  const discount = product.old_price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex gap-2">
        <Link href="/" className="hover:text-primary">Головна</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-primary">Каталог</Link>
        {product.category_name && (
          <>
            <span>/</span>
            <Link
              href={`/catalog?category_id=${product.category_id}`}
              className="hover:text-primary"
            >
              {product.category_name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-600 line-clamp-1">{product.name}</span>
      </nav>

      {/* Product */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Image */}
        <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden h-72 md:h-96">
          {discount > 0 && (
            <span className="absolute top-3 left-3 z-10 bg-danger text-white text-sm font-bold px-2.5 py-1 rounded-full">
              -{discount}%
            </span>
          )}
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-8xl">🧸</div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>

          {product.vendor && (
            <p className="text-sm text-gray-400 mb-4">Виробник: {product.vendor}</p>
          )}

          {/* Price */}
          <div className="flex items-end gap-3 mb-4">
            <span className="text-3xl font-extrabold text-primary">{product.price} ₴</span>
            {product.old_price && (
              <span className="text-lg text-gray-400 line-through">{product.old_price} ₴</span>
            )}
          </div>

          {/* Stock */}
          <div className="mb-6">
            {product.in_stock ? (
              <span className="inline-flex items-center gap-1 text-sm text-success font-semibold">
                ✅ В наявності
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                ❌ Немає в наявності
              </span>
            )}
          </div>

          {/* Add button */}
          <div className="space-y-3">
            <button
              onClick={handleAdd}
              disabled={!product.in_stock || added}
              className="w-full md:w-auto px-8 py-3 rounded-2xl font-bold text-white bg-primary
                         hover:bg-primary/90 active:scale-95 transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {added ? "✓ Додано до кошика" : "🛒 В кошик"}
            </button>
            {added && (
              <Link href="/cart" className="text-sm text-primary hover:underline block">
                → Перейти до кошика
              </Link>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-semibold mb-2">Опис</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Meta */}
          {(product.barcode || product.category_name) && (
            <div className="mt-4 text-xs text-gray-400 space-y-1">
              {product.category_name && <p>Категорія: {product.category_name}</p>}
              {product.barcode && <p>Штрихкод: {product.barcode}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Similar products */}
      {similar.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Схожі товари</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
