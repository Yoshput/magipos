import React from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { formatRupiah } from '@/lib/format';
import { Plus, AlertCircle, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const activeVariants = (product.variants || []).filter((v) => v.is_active);
  const minPrice = activeVariants.length > 0
    ? Math.min(...activeVariants.map((v) => v.price_idr))
    : 13000;

  // Check if any active variant has recipe configured
  const hasAnyRecipe = activeVariants.some(
    (v) => v.recipe_items && v.recipe_items.length > 0
  );

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-ios-card border border-border p-3.5 sm:p-4 shadow-ios hover:shadow-ios-float hover:border-nyeni-blue/40 transition-all cursor-pointer flex flex-col justify-between select-none relative overflow-hidden"
    >
      <div>
        {/* Image Container */}
        <div className="w-full aspect-square rounded-ios bg-slate-50 relative overflow-hidden mb-3 border border-slate-100 flex items-center justify-center p-2 group-hover:scale-[1.02] transition-transform">
          <Image
            src={product.image_path || '/assets/logo-mango-nyeni.png'}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {!hasAnyRecipe && (
            <div className="absolute top-2 right-2 bg-amber-500/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 backdrop-blur-xs">
              <AlertCircle className="w-3 h-3" />
              <span>Resep Belum Diisi</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <span className="text-[11px] font-bold text-nyeni-blue uppercase tracking-wider block mb-0.5">
          {product.category}
        </span>
        <h3 className="text-sm sm:text-base font-extrabold text-nyeni-navy group-hover:text-nyeni-blue transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="text-xs text-muted line-clamp-2 mt-1">
          {product.description || 'Pilihan dessert segar khas Mango Nyeni.'}
        </p>
      </div>

      {/* Pricing & Add Button */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-muted block font-medium">Mulai dari</span>
          <span className="text-sm sm:text-base font-black text-nyeni-navy tabular-nums">
            {formatRupiah(minPrice)}
          </span>
        </div>

        <button
          type="button"
          className="w-9 h-9 rounded-full bg-nyeni-blue-soft text-nyeni-blue group-hover:bg-nyeni-blue group-hover:text-white transition-all flex items-center justify-center shadow-xs"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
