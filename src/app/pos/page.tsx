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
        <div className="lg:hidden fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-40 animate-in slide-in-from-bottom-4 duration-200">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="w-full bg-nyeni-navy hover:bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl border border-white/10 flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-nyeni-mango text-nyeni-navy font-black text-sm flex items-center justify-center shadow-xs">
                  {totalCups}
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nyeni-blue opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-nyeni-blue"></span>
                </span>
              </div>
              <div className="text-left">
                <p className="text-[11px] text-slate-300 font-semibold tracking-wide uppercase">
                  Keranjang ({totalCups} Cup)
                </p>
                <p className="text-base font-black text-white">{formatRupiah(total)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold bg-nyeni-blue hover:bg-nyeni-blue-hover text-white px-4 py-2 rounded-xl shadow-xs">
              <span>Buka Keranjang</span>
              <ShoppingBag className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Cart Sheet / Modal */}
      {isMobileCartOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsMobileCartOpen(false);
          }}
          className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-t-3xl max-h-[88vh] h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* iOS Bottom Sheet Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 shrink-0" />
            <CartPanel
              onCheckout={() => {
                setIsMobileCartOpen(false);
                setIsCheckoutOpen(true);
              }}
              onClose={() => setIsMobileCartOpen(false)}
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
        onAdded={() => {
          setSelectedProductForVariant(null);
          setIsMobileCartOpen(true);
        }}
        onOpenCart={() => setIsMobileCartOpen(true)}
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
