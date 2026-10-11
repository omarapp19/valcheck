import { Link } from "@tanstack/react-router";
import { Plus, Camera } from "lucide-react";
import { useState } from "react";
import { formatUSD, formatVES, type Producto, getDepartamentoProducto } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useAdminStore } from "@/lib/admin-store";
import { VirtualTryOnModal } from "@/components/VirtualTryOnModal";
import { toast } from "sonner";

export function ProductCard({ producto }: { producto: Producto }) {
  const { agregar, abrirCarrito } = useCart();
  const { tasaBCV } = useAdminStore();
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const isAccesorio = getDepartamentoProducto(producto) === "accesorios";

  return (
    <>
      <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-brand-beige">
          <Link to="/producto/$id" params={{ id: producto.id }} className="block size-full">
            <img
              src={producto.imagen}
              alt={producto.nombre}
              loading="lazy"
              width={912}
              height={912}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>

          {/* Botón flotante para probar accesorio rápido */}
          {isAccesorio && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTryOnOpen(true);
              }}
              className="absolute top-2 right-2 flex size-7 sm:size-8 items-center justify-center rounded-full bg-card/90 backdrop-blur-md text-foreground shadow-sm hover:scale-110 hover:bg-brand-yellow hover:text-brand-brown transition-all cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
              title="Probar en mi foto (Probador Virtual)"
              aria-label={`Probar ${producto.nombre} en mi foto`}
            >
              <Camera className="size-3.5 sm:size-4" />
            </button>
          )}
        </div>
      <div className="p-3 sm:p-4">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {producto.categoria}
        </p>
        <Link to="/producto/$id" params={{ id: producto.id }}>
          <h3 className="mt-1 font-display text-sm sm:text-base md:text-lg font-semibold leading-tight line-clamp-2 hover:text-primary transition-colors">
            {producto.nombre}
          </h3>
        </Link>
        <div className="mt-2 flex items-end justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-lg font-bold" suppressHydrationWarning>{formatUSD(producto.precioUSD)}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate" title={formatVES(producto.precioUSD, tasaBCV)} suppressHydrationWarning>
              {formatVES(producto.precioUSD, tasaBCV)}
            </p>
          </div>
          <button
            onClick={() => {
              agregar(producto.id);
              toast.success(`${producto.nombre}`, {
                description: "Agregado exitosamente a tu bolsa",
                action: {
                  label: "Ver bolsa",
                  onClick: () => abrirCarrito(),
                },
              });
            }}
            className="flex size-8.5 sm:size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            aria-label={`Agregar ${producto.nombre} al carrito`}
          >
            <Plus className="size-4 sm:size-5" />
          </button>
        </div>
      </div>
    </div>

    {/* Modal de Probador Virtual */}
    {isAccesorio && tryOnOpen && (
      <VirtualTryOnModal
        producto={producto}
        isOpen={tryOnOpen}
        onClose={() => setTryOnOpen(false)}
      />
    )}
  </>
  );
}
