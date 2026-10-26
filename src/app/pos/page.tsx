'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductCard } from '@/features/pos/ProductCard';
import { VariantSelectorModal } from '@/features/pos/VariantSelectorModal';
import { CartPanel } from '@/features/pos/CartPanel';
import { CheckoutModal } from '@/features/pos/CheckoutModal';
import { ReceiptModal } from '@/features/pos/ReceiptModal';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { localDb } from '@/lib/storage/local-db';
import { Product, Addon, Sale, BusinessSettings } from '@/types';
import { Search, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { formatRupiah } from '@/lib/format';

export default function PosPage() {
  const { totalCups, total } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Modals
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedSaleForReceipt, setCompletedSaleForReceipt] = useState<Sale | null>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const fetchData = useCallback(() => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const db = localDb.getDb();
      const prodsWithVariants = localDb.getProductsWithVariants();
      setProducts(prodsWithVariants);
      setAddons(db.addons || []);
      setSettings(db.business_settings || null);
    } catch (err: unknown) {
      console.error('POS fetch error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat katalog produk.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['Semua', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <AppShell>
      <PageHeader
        title="Kasir (POS)"
        subtitle="Pilih menu dessert cup, sesuaikan ukuran dan add-on pesanan"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Catalog & Search (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Search and Category Tabs */}
          <div className="bg-white p-3.5 sm:p-4 rounded-ios-card border border-border shadow-ios space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari produk (Dragon Sago, Mango, Strawberry)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-ios border border-border bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-nyeni-blue/30 focus:border-nyeni-blue"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-nyeni-navy text-white shadow-xs'
                      : 'bg-slate-100 text-muted hover:text-foreground hover:bg-slate-200/70'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
              <LoadingSkeleton count={6} className="h-56" />
            </div>
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={fetchData} />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="Menu Tidak Ditemukan"
              description="Tidak ada produk yang cocok dengan kata kunci pencarian atau kategori ini."
              action={{
                label: 'Reset Filter',
                onClick: () => {
                  setSearchQuery('');
                  setSelectedCategory('Semua');
                },
              }}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onSelect={(product) => setSelectedProductForVariant(product)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Desktop Cart Panel (4 cols on lg) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-6">
          <CartPanel
            onCheckout={() => setIsCheckoutOpen(true)}
            className="h-[calc(100vh-140px)]"
          />
        </div>
      </div>

      {/* Mobile Floating Cart Summary Button */}
      {totalCups > 0 && (
        <div className="lg:hidden fixed bottom-18 left-4 right-4 z-30 animate-in slide-in-from-bottom-4 duration-200">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-nyeni-navy text-white p-4 rounded-ios-card shadow-ios-float flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-nyeni-mango text-nyeni-navy font-black text-xs flex items-center justify-center">
                {totalCups}
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-300 font-medium">Keranjang Belanja</p>
                <p className="text-sm font-bold">{formatRupiah(total)}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold bg-nyeni-blue px-3 py-1.5 rounded-ios">
              <span>Buka Keranjang</span>
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Cart Sheet / Modal */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-t-ios-sheet max-h-[85vh] h-[85vh] flex flex-col overflow-hidden shadow-ios-modal">
            <CartPanel
              onCheckout={() => {
                setIsMobileCartOpen(false);
                setIsCheckoutOpen(true);
              }}
              className="h-full rounded-none border-none shadow-none"
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <VariantSelectorModal
        product={selectedProductForVariant}
        addons={addons}
        onClose={() => setSelectedProductForVariant(null)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(sale) => {
          setCompletedSaleForReceipt(sale);
        }}
      />

      <ReceiptModal
        sale={completedSaleForReceipt}
        settings={settings}
        onClose={() => setCompletedSaleForReceipt(null)}
      />
    </AppShell>
  );
}
