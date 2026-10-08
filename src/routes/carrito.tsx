import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatUSD, formatVES } from "@/lib/products";

export const Route = createFileRoute("/carrito")({
  head: () => ({
    meta: [
      { title: "Tu carrito — ValCheck" },
      { name: "description", content: "Revisa y confirma tu pedido de accesorios ValCheck." },
      { property: "og:title", content: "Tu carrito — ValCheck" },
      { property: "og:description", content: "Revisa y confirma tu pedido de accesorios ValCheck." },
    ],
  }),
  component: Carrito,
});

function Carrito() {
  const { items, cambiarCantidad, quitar, totalUSD } = useCart();
  const { isAdmin } = useAuth();

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <span className="stamp flex size-20 items-center justify-center">
          <ShoppingBag className="size-9" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold">Tu carrito está vacío</h1>
        <p className="mt-2 text-muted-foreground">
          Descubre piezas que celebran tu autenticidad.
        </p>
        <Link
          to="/tienda"
          className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
        >
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-semibold">Tu carrito</h1>

      <div className="mt-8 space-y-4">
        {items.map(({ producto, cantidad }) => (
          <div
            key={producto.id}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
          >
            <img
              src={producto.imagen}
              alt={producto.nombre}
              loading="lazy"
              width={912}
              height={912}
              className="size-20 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-semibold leading-tight">
                {producto.nombre}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatUSD(producto.precioUSD)} · {formatVES(producto.precioUSD)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => cambiarCantidad(producto.id, cantidad - 1)}
                className="flex size-8 items-center justify-center rounded-full border border-border hover:bg-brand-yellow/60"
                aria-label="Disminuir cantidad"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-6 text-center font-semibold">{cantidad}</span>
              <button
                onClick={() => cambiarCantidad(producto.id, cantidad + 1)}
                className="flex size-8 items-center justify-center rounded-full border border-border hover:bg-brand-yellow/60"
                aria-label="Aumentar cantidad"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <button
              onClick={() => quitar(producto.id)}
              className="flex size-9 items-center justify-center rounded-full text-destructive hover:bg-destructive/10"
              aria-label={`Quitar ${producto.nombre}`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-[2rem] bg-primary p-6 text-primary-foreground md:p-8">
        <div className="flex items-end justify-between">
          <span className="text-lg font-semibold">Total</span>
          <div className="text-right">
            <p className="text-3xl font-bold">{formatUSD(totalUSD)}</p>
            <p className="text-sm opacity-80">{formatVES(totalUSD)}</p>
          </div>
        </div>
        {isAdmin ? (
          <div className="mt-6 rounded-2xl bg-brand-brown/40 p-4 text-center border border-brand-yellow/30">
            <p className="text-xs font-bold text-brand-yellow">Sesión de Administrador</p>
            <p className="text-xs text-white/90 mt-1">El usuario administrador gestiona la plataforma y no realiza compras de cliente.</p>
            <Link
              to="/admin"
              className="mt-3 inline-flex items-center justify-center rounded-full bg-brand-yellow px-5 py-2 text-xs font-bold text-brand-brown hover:scale-105 transition-transform"
            >
              Ir al Panel de Administración
            </Link>
          </div>
        ) : (
          <Link
            to="/checkout"
            className="mt-6 flex w-full items-center justify-center rounded-full bg-brand-yellow py-4 text-sm font-bold text-brand-brown transition-transform hover:scale-[1.01]"
          >
            Proceder al pago
          </Link>
        )}
        <p className="mt-3 text-center text-xs opacity-70">
          Envíos nacionales por MRW, ZOOM o entrega personal · Verificación de pagos en 24-48h
        </p>
      </div>
    </div>
  );
}
