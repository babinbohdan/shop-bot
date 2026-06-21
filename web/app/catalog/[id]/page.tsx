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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-3 bg-panel rounded w-48 mb-8" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-panel rounded-lg h-80" />
          <div className="space-y-4">
            <div className="h-6 bg-panel rounded w-3/4" />
            <div className="h-4 bg-panel rounded w-1/2" />
            <div className="h-10 bg-panel rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl text-muted mb-4">✦</div>
        <p className="text-ink mb-2">Товар не знайдено</p>
        <Link href="/catalog" className="text-gold hover:text-gold-light transition-colors">
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
      <nav className="text-xs text-muted mb-6 flex gap-2 items-center">
        <Link href="/" className="hover:text-gold transition-colors">Головна</Link>
        <span className="text-border">›</span>
        <Link href="/catalog" className="hover:text-gold transition-colors">Каталог</Link>
        {product.category_name && (
          <>
            <span className="text-border">›</span>
            <Link href={`/catalog?category_id=${product.category_id}`} className="hover:text-gold transition-colors">
              {product.category_name}
            </Link>
          </>
        )}
        <span className="text-border">›</span>
        <span className="text-ink line-clamp-1">{product.name}</span>
      </nav>

      {/* Product */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Image */}
        <div className="card-bordered bg-surface rounded-lg overflow-hidden relative h-72 md:h-96">
          {discount > 0 && (
            <span className="absolute top-3 left-3 z-10 bg-gold text-bg text-xs font-bold px-2.5 py-1 rounded">
              -{discount}%
            </span>
          )}
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill
              className="object-contain p-4" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl text-muted">✦</div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold text-ink mb-2">{product.name}</h1>

          {product.vendor && (
            <p className="text-xs text-muted mb-4 uppercase tracking-wide">{product.vendor}</p>
          )}

          <div className="flex items-end gap-3 mb-4">
            <span className="text-3xl font-bold text-gold">{product.price} ₴</span>
            {product.old_price && (
              <span className="text-base text-muted line-through">{product.old_price} ₴</span>
            )}
          </div>

          <div className="mb-6">
            {product.in_stock ? (
              <span className="text-sm text-success">● В наявності</span>
            ) : (
              <span className="text-sm text-muted">○ Немає в наявності</span>
            )}
          </div>

          <div className="space-y-3">
            <button onClick={handleAdd} disabled={!product.in_stock || added}
              className="btn-gold px-8 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed w-full md:w-auto">
              {added ? "✓ Додано до кошика" : "+ В кошик"}
            </button>
            {added && (
              <Link href="/cart" className="block text-sm text-gold hover:text-gold-light transition-colors">
                → Перейти до кошика
              </Link>
            )}
          </div>

          {product.description && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Опис</h3>
              <p className="text-sm text-muted leading-relaxed">{product.description}</p>
            </div>
          )}

          {(product.barcode || product.category_name) && (
            <div className="mt-4 text-xs text-muted/60 space-y-1">
              {product.category_name && <p>Категорія: {product.category_name}</p>}
              {product.barcode && <p>Штрихкод: {product.barcode}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-lg font-semibold text-ink">Схожі товари</h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {similar.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
