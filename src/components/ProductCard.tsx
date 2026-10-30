import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Check } from "lucide-react";
import { formatUSD, formatVES, type Producto } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useAdminStore } from "@/lib/admin-store";

export function ProductCard({ producto }: { producto: Producto }) {
  const { agregar } = useCart();
  const { tasaBCV } = useAdminStore();
  const [agregadoReciente, setAgregadoReciente] = useState(false);
  const agotado = (producto.stock ?? 10) <= 0;

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 hover:shadow-md hover:border-primary/40 flex flex-col justify-between">
      <div>
        <div className="relative aspect-square overflow-hidden bg-brand-beige">
          <Link
            to="/producto/$id"
            params={{ id: producto.id }}
            className="block size-full"
            aria-label={`Ver detalles de ${producto.nombre}`}
          >
            <img
              src={producto.imagen}
              alt={producto.nombre}
              loading="lazy"
              width={912}
              height={912}
              className={`size-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                agotado ? "opacity-60 grayscale-[30%]" : ""
              }`}
            />
          </Link>

          {/* Badges superiores */}
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1 items-start pointer-events-none">
            {producto.destacado && (
              <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-[8px] sm:text-[10px] font-bold text-brand-brown shadow-xs">
                ★ Destacado
              </span>
            )}
          </div>

          {agotado && (
            <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 pointer-events-none">
              <span className="rounded-full bg-destructive/90 text-destructive-foreground backdrop-blur-xs px-2 py-0.5 text-[8px] sm:text-[9px] font-bold shadow-xs">
                Agotado
              </span>
            </div>
          )}
        </div>

        <div className="p-2.5 sm:p-4">
          <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            {producto.categoria}
          </p>
          <Link to="/producto/$id" params={{ id: producto.id }}>
            <h3 className="mt-0.5 sm:mt-1 font-display text-xs sm:text-sm md:text-base font-semibold leading-snug line-clamp-2 hover:text-primary transition-colors">
              {producto.nombre}
            </h3>
          </Link>
        </div>
      </div>

      <div className="px-2.5 pb-2.5 sm:px-4 sm:pb-4 pt-0">
        <div className="flex items-end justify-between gap-1 sm:gap-2 border-t border-border/50 pt-2 sm:pt-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-base md:text-lg font-bold text-foreground leading-tight truncate" suppressHydrationWarning>
              {formatUSD(producto.precioUSD)}
            </p>
            <p
              className="text-[9px] sm:text-xs text-muted-foreground truncate mt-0.5"
              title={formatVES(producto.precioUSD, tasaBCV)}
              suppressHydrationWarning
            >
              {formatVES(producto.precioUSD, tasaBCV)}
            </p>
          </div>
          <button
            type="button"
            disabled={agotado}
            onClick={() => {
              if (agotado) return;
              agregar(producto.id);
              setAgregadoReciente(true);
              setTimeout(() => setAgregadoReciente(false), 1200);
            }}
            className={`flex size-8 sm:size-9 md:size-10 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer ${
              agotado
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                : agregadoReciente
                ? "bg-emerald-600 text-white scale-105 shadow-md"
                : "bg-primary text-primary-foreground hover:scale-105 active:scale-95 shadow-xs"
            }`}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            title={agotado ? "Producto agotado" : "Agregar a la bolsa"}
          >
            {agregadoReciente ? (
              <Check className="size-3.5 sm:size-4 md:size-5 text-white animate-in zoom-in-75" />
            ) : (
              <Plus className="size-3.5 sm:size-4 md:size-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
