'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import { CartItem, Product, ProductVariant, Addon } from '@/types';
import { calculateCartTotals } from '@/lib/calculations';

interface CartContextType {
  items: CartItem[];
  addItem: (variant: ProductVariant, product: Product, addons: Addon[], hasRecipe: boolean) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, newQty: number) => void;
  clearCart: () => void;
  discountIdr: number;
  setDiscountIdr: (discount: number) => void;
  subtotal: number;
  total: number;
  totalCups: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  discountIdr: 0,
  setDiscountIdr: () => {},
  subtotal: 0,
  total: 0,
  totalCups: 0,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discountIdr, setDiscountIdr] = useState(0);

  const addItem = (
    variant: ProductVariant,
    product: Product,
    addons: Addon[],
    hasRecipe: boolean
  ) => {
    // Generate unique key based on variant id and sorted addon ids
    const sortedAddonIds = addons.map((a) => a.id).sort().join('_');
    const cartItemId = `${variant.id}__${sortedAddonIds}`;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === cartItemId);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + 1,
        };
        return next;
      }

      const newItem: CartItem = {
        id: cartItemId,
        product_id: product.id,
        product_name: product.name,
        variant_id: variant.id,
        variant_name: variant.name,
        unit_price_idr: variant.price_idr,
        quantity: 1,
        addons: addons.map((a) => ({
          addon_id: a.id,
          addon_name: a.name,
          unit_price_idr: a.price_idr,
          quantity: 1,
        })),
        has_recipe: hasRecipe,
      };

      return [...prev, newItem];
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(cartItemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === cartItemId ? { ...item, quantity: newQty } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    setDiscountIdr(0);
  };

  const totals = useMemo(() => {
    return calculateCartTotals(items, discountIdr);
  }, [items, discountIdr]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        discountIdr,
        setDiscountIdr,
        subtotal: totals.subtotal,
        total: totals.total,
        totalCups: totals.totalCups,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
