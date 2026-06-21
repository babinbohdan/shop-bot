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
  const [added,   setAdded]   = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getProduct(Number(id)),
      getSimilarProducts(Number(id)).catch(() => [] as Product[]),
    ])
      .then(([p, sim]) => { setProduct(p); setSimilar(sim.slice(0, 4)); })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-3 bg-panel border-2 border-border w-48 mb-8" />
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-panel border-2 border-border h-80" />
        <div className="space-y-4">
          <div className="h-6 bg-panel border-2 border-border w-3/4" />
          <div className="h-4 bg-panel border-2 border-border w-1/2" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">😕</div>
      <p className="font-black text-ink uppercase mb-2">Товар не знайдено</p>
      <Link href="/catalog" className="text-ink font-black uppercase hover:underline">← До каталогу</Link>
    </div>
  );

  const discount = product.old_price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <nav className="text-xs font-bold text-muted mb-6 flex gap-2 items-center flex-wrap uppercase tracking-wide">
        <Link href="/" className="hover:text-ink transition-colors">Головна</Link>
        <span>›</span>
        <Link href="/catalog" className="hover:text-ink transition-colors">Каталог</Link>
        {product.category_name && (
          <>
            <span>›</span>
            <Link href={`/catalog?category_id=${product.category_id}`} className="hover:text-ink transition-colors">{product.category_name}</Link>
          </>
        )}
        <span>›</span>
        <span className="text-ink line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 mb-14">
        <div className="relative h-72 md:h-96 bg-panel border-2 border-border shadow-[6px_6px_0px_#4a4e8f] overflow-hidden">
          {discount > 0 && (
            <span className="absolute top-0 left-0 z-10 bg-accent text-ink text-xs font-black px-3 py-1 uppercase tracking-wider">
              -{discount}%
            </span>
          )}
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill className="object-contain p-4" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-7xl">🧸</div>
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-ink mb-2 uppercase leading-tight">{product.name}</h1>
          {product.vendor && (
            <p className="text-xs font-black text-muted uppercase tracking-widest mb-4">{product.vendor}</p>
          )}
          <div className="flex items-end gap-3 mb-4">
            <span className="text-4xl font-black text-ink">{product.price} ₴</span>
            {product.old_price && <span className="text-base text-muted line-through">{product.old_price} ₴</span>}
          </div>
          <div className="mb-6">
            {product.in_stock ? (
              <span className="inline-block bg-primary border-2 border-border text-surface text-xs font-black px-3 py-1 uppercase tracking-wider shadow-[2px_2px_0px_#4a4e8f]">
                ✓ В наявності
              </span>
            ) : (
              <span className="inline-block bg-surface border-2 border-border text-muted text-xs font-black px-3 py-1 uppercase tracking-wider">
                Немає в наявності
              </span>
            )}
          </div>
          <div className="space-y-3">
            <button onClick={handleAdd} disabled={!product.in_stock || added}
              className="btn-pill px-8 py-3 text-sm w-full md:w-auto">
              {added ? "✓ ДОДАНО" : "🛒 В КОШИК"}
            </button>
            {added && (
              <Link href="/cart" className="block text-xs font-black text-ink uppercase hover:underline">
                → Перейти до кошика
              </Link>
            )}
          </div>
          {product.description && (
            <div className="mt-6 pt-6 border-t-2 border-border">
              <h3 className="text-xs font-black text-ink uppercase tracking-widest mb-3">Опис</h3>
              <p className="text-sm text-muted font-medium leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="text-2xl font-black text-ink mb-5 uppercase tracking-tight">Схожі товари</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similar.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
