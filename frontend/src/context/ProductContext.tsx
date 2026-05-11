import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Product = 'holy-oly' | 'volta';

interface ProductContextType {
  product: Product;
  setProduct: (p: Product) => void;
}

const ProductContext = createContext<ProductContextType | null>(null);

const STORAGE_KEY = 'product:current';

function readInitial(): Product {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Product | null;
    if (stored === 'volta' || stored === 'holy-oly') return stored;
  } catch { /* ignore */ }
  // Hash override: ?product=volta or #volta-home
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.toLowerCase();
    if (hash.startsWith('#volta')) return 'volta';
  }
  return 'holy-oly';
}

export function ProductProvider({ children }: { children: ReactNode }) {
  const [product, setProductState] = useState<Product>(readInitial);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, product); } catch { /* ignore */ }
  }, [product]);

  const setProduct = useCallback((p: Product) => setProductState(p), []);

  return (
    <ProductContext.Provider value={{ product, setProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error('useProduct must be used within ProductProvider');
  return ctx;
}
