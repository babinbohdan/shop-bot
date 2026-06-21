"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getProduct, getSimilarProducts } from "@/lib/api";
import type { Product } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { useCartStore } from "@/lib/cart-store";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const pid = Number(id);
    setLoading(true);
    Promise.all([getProduct(pid), getSimilarProducts(pid)])
      .then(([prod, sim]) => {
        setProduct(prod);
        setSimilar(sim);
      })
      .catch(() => {})
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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="bg-gray-100 rounded-3xl aspect-square" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-100 rounded w-1/3" />
            <div className="h-8 bg-gray-100 rounded" />
            <div className="h-8 bg-gray-100 rounded w-2/3" />
            <div className="h-24 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-gray-500">Товар не знайдено</p>
        <Link href="/catalog" className="text-[#2481cc] hover:underline mt-3 inline-block">
          ← Повернутись до каталогу
        </Link>
      </div>
    );
  }

  const discount =
    product.old_price && product.old_price > product.price
      ? Math.round((1 - product.price / product.old_price) * 100)
      : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 fade-up">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex items-center gap-1">
        <Link href="/" className="hover:text-[#2481cc]">Головна</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-[#2481cc]">Каталог</Link>
        {product.category_name && (
          <>
            <span>/</span>
            <Link
              href={`/catalog?category=${product.category_id}`}
              className="hover:text-[#2481cc]"
            >
              {product.category_name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-600 truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative bg-white rounded-3xl border border-gray-100 overflow-hidden aspect-square">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-8"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-8xl">🧸</div>
          )}
          {discount > 0 && (
            <div className="absolute top-4 left-4 bg-[#e53935] text-white font-bold
                            text-sm px-3 py-1 rounded-full">
              -{discount}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {product.vendor && (
            <p className="text-sm text-gray-400 mb-1">{product.vendor}</p>
          )}
          <h1 className="text-2xl font-extrabold text-gray-800 mb-4 leading-tight">
            {product.name}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-extrabold text-[#2481cc]">
              {product.price.toFixed(2)} ₴
            </span>
            {product.old_price && (
              <span className="text-lg text-gray-400 line-through">
                {product.old_price.toFixed(2)} ₴
              </span>
            )}
            {discount > 0 && (
              <span className="bg-red-50 text-[#e53935] text-sm font-bold px-2 py-0.5 rounded-lg">
                Економія {(product.old_price! - product.price).toFixed(0)} ₴
              </span>
            )}
          </div>

          {/* Stock */}
          <div className="mb-5">
            {product.in_stock ? (
              <span className="inline-flex items-center gap-1 text-[#43a047] font-semibold text-sm
                               bg-green-50 px-3 py-1 rounded-full">
                ✅ Є в наявності
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#e53935] font-semibold text-sm
                               bg-red-50 px-3 py-1 rounded-full">
                ❌ Немає в наявності
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-5">
              <p className="text-sm font-semibold text-gray-500 mb-1">Опис</p>
              <p className="text-gray-700 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-gray-400 space-y-1 mb-6">
            {product.category_name && <p>Категорія: {product.category_name}</p>}
            {product.barcode && <p>Штрихкод: {product.barcode}</p>}
          </div>

          {/* CTA */}
          {product.in_stock && (
            <button
              onClick={handleAdd}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition active:scale-95
                ${added
                  ? "bg-[#43a047] text-white"
                  : "bg-[#2481cc] hover:bg-[#1a6ab5] text-white"}`}
            >
              {added ? "✅ Додано в кошик!" : "🛒 Додати в кошик"}
            </button>
          )}
          {added && (
            <Link
              href="/cart"
              className="mt-3 text-center text-[#2481cc] text-sm font-semibold hover:underline"
            >
              Перейти до кошика →
            </Link>
          )}
        </div>
      </div>

      {/* Similar products */}
      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-extrabold mb-5 text-gray-800">Схожі товари</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {similar.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
