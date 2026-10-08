import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { formatUSD, formatVES, type Producto } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export function ProductCard({ producto }: { producto: Producto }) {
  const { agregar } = useCart();

  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link to="/producto/$id" params={{ id: producto.id }} className="block">
        <div className="aspect-square overflow-hidden bg-brand-beige">
          <img
            src={producto.imagen}
            alt={producto.nombre}
            loading="lazy"
            width={912}
            height={912}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {producto.categoria}
        </p>
        <Link to="/producto/$id" params={{ id: producto.id }}>
          <h3 className="mt-1 font-display text-lg font-semibold leading-tight">
            {producto.nombre}
          </h3>
        </Link>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-bold">{formatUSD(producto.precioUSD)}</p>
            <p className="text-xs text-muted-foreground">{formatVES(producto.precioUSD)}</p>
          </div>
          <button
            onClick={() => {
              agregar(producto.id);
              toast.success(`${producto.nombre} agregado al carrito`);
            }}
            className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110"
            aria-label={`Agregar ${producto.nombre} al carrito`}
          >
            <Plus className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
