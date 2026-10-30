import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { productos, isProductoDisponible, type Producto } from "./products";
import { toast } from "sonner";

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

interface CartContextValue {
  items: CartItem[];
  agregar: (id: string, options?: { openCart?: boolean; notify?: boolean }) => void;
  quitar: (id: string) => void;
  cambiarCantidad: (id: string, cantidad: number) => void;
  vaciar: () => void;
  totalUSD: number;
  totalItems: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  abrirCarrito: () => void;
  cerrarCarrito: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "valcheck-cart";

function obtenerCatalogoCompleto(): Producto[] {
  if (typeof window !== "undefined") {
    try {
      const rawDel = localStorage.getItem("valcheck_deleted_product_ids_v2");
      const deletedIds = rawDel ? new Set<string>(JSON.parse(rawDel)) : new Set<string>();
      const raw =
        localStorage.getItem("valcheck_catalog_products_v4") ||
        localStorage.getItem("valcheck_catalog_products");
      if (raw) {
        const parsed: Producto[] = JSON.parse(raw);
        return parsed.filter((p) => !deletedIds.has(p.id));
      }
      return productos.filter((p) => !deletedIds.has(p.id));
    } catch {
      /* ignore */
    }
  }
  return productos;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: { id: string; cantidad: number }[] = JSON.parse(raw);
        const catalogo = obtenerCatalogoCompleto();
        setItems(
          parsed
            .map((p) => {
              const producto = catalogo.find((pr) => pr.id === p.id);
              return producto ? { producto, cantidad: p.cantidad } : null;
            })
            .filter((i): i is CartItem => i !== null),
        );
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.map((i) => ({ id: i.producto.id, cantidad: i.cantidad }))),
    );
  }, [items, hydrated]);

  const abrirCarrito = () => setIsOpen(true);
  const cerrarCarrito = () => setIsOpen(false);

  const agregar = (id: string, options?: { openCart?: boolean; notify?: boolean }) => {
    const catalogo = obtenerCatalogoCompleto();
    const producto = catalogo.find((p) => p.id === id) ?? productos.find((p) => p.id === id);
    if (!producto) return;

    if (!isProductoDisponible(producto)) {
      toast.error("Este producto está agotado o no está disponible actualmente.");
      return;
    }

    const maxStock = producto.stock ?? 10;
    const currentItem = items.find((i) => i.producto.id === id);
    if (currentItem && currentItem.cantidad >= maxStock) {
      toast.warning(`Solo hay ${maxStock} unidades disponibles en stock.`);
      return;
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.producto.id === id);
      if (existing) {
        if (existing.cantidad >= maxStock) {
          toast.warning(`Solo hay ${maxStock} unidades disponibles en stock.`);
          return prev;
        }
        return prev.map((i) =>
          i.producto.id === id ? { ...i, cantidad: i.cantidad + 1 } : i,
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
    // Por defecto NO se abre el panel desplegable
    if (options?.openCart === true) {
      setIsOpen(true);
    }

    if (options?.notify ?? true) {
      toast.success(producto.nombre, {
        description: "Agregado al carrito",
        duration: 2500,
        action: {
          label: "Ver bolsa",
          onClick: () => setIsOpen(true),
        },
      });
    }
  };

  const quitar = (id: string) =>
    setItems((prev) => prev.filter((i) => i.producto.id !== id));

  const cambiarCantidad = (id: string, cantidad: number) => {
    if (cantidad <= 0) return quitar(id);
    const catalogo = obtenerCatalogoCompleto();
    const producto = catalogo.find((p) => p.id === id) ?? productos.find((p) => p.id === id);
    const maxStock = producto?.stock ?? 10;
    const finalCantidad = Math.min(cantidad, maxStock);
    if (cantidad > maxStock) {
      toast.warning(`Solo hay ${maxStock} unidades disponibles en stock.`);
    }
    setItems((prev) =>
      prev.map((i) => (i.producto.id === id ? { ...i, cantidad: finalCantidad } : i)),
    );
  };

  const vaciar = () => setItems([]);

  const totalUSD = items.reduce((s, i) => s + i.producto.precioUSD * i.cantidad, 0);
  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        agregar,
        quitar,
        cambiarCantidad,
        vaciar,
        totalUSD,
        totalItems,
        isOpen,
        setIsOpen,
        abrirCarrito,
        cerrarCarrito,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
