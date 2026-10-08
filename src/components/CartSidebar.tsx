import { Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatUSD, formatVES } from "@/lib/products";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function CartSidebar() {
  const {
    items,
    totalItems,
    totalUSD,
    cambiarCantidad,
    quitar,
    vaciar,
    isOpen,
    setIsOpen,
    cerrarCarrito,
  } = useCart();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    cerrarCarrito();
    navigate({ to: "/checkout" });
  };

  const handleIrATienda = () => {
    cerrarCarrito();
    navigate({ to: "/tienda" });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md bg-background border-l border-border shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="border-b border-border/80 px-6 py-5 text-left bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-yellow text-brand-brown">
                <ShoppingBag className="size-5" />
              </span>
              <div>
                <SheetTitle className="font-display text-2xl font-bold tracking-tight">
                  Tu Carrito
                </SheetTitle>
                <p className="text-xs font-medium text-muted-foreground">
                  {totalItems === 0
                    ? "Sin productos seleccionados"
                    : `${totalItems} ${totalItems === 1 ? "pieza seleccionada" : "piezas seleccionadas"}`}
                </p>
              </div>
            </div>
            {items.length > 0 && (
              <button
                onClick={vaciar}
                className="text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
                title="Vaciar todo el carrito"
              >
                Vaciar
              </button>
            )}
          </div>

          {/* Micro banner de confianza */}
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-brand-yellow/50 px-3 py-1.5 text-xs font-medium text-brand-brown">
            <ShieldCheck className="size-4 shrink-0 text-brand-brown" />
            <span className="truncate">Piezas verificadas por ValCheck · Calidad garantizada</span>
          </div>
        </SheetHeader>

        {/* Content */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="stamp flex size-20 items-center justify-center">
              <ShoppingBag className="size-9 text-brand-brown" />
            </div>
            <h3 className="mt-6 font-display text-2xl font-semibold">Tu carrito está vacío</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Descubre accesorios elegantes que celebran tu autenticidad y tu valor.
            </p>
            <button
              onClick={handleIrATienda}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="size-4" />
              Explorar la tienda
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border/60">
            {items.map(({ producto, cantidad }) => (
              <div key={producto.id} className="py-4 first:pt-2 last:pb-2 flex gap-3.5 items-center">
                <Link
                  to="/producto/$id"
                  params={{ id: producto.id }}
                  onClick={cerrarCarrito}
                  className="relative shrink-0 overflow-hidden rounded-xl border border-border bg-brand-beige group"
                >
                  <img
                    src={producto.imagen}
                    alt={producto.nombre}
                    loading="lazy"
                    className="size-20 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <Link
                      to="/producto/$id"
                      params={{ id: producto.id }}
                      onClick={cerrarCarrito}
                      className="font-display font-semibold text-base leading-snug line-clamp-1 hover:text-brand-brown/80 transition-colors"
                    >
                      {producto.nombre}
                    </Link>
                    <button
                      onClick={() => quitar(producto.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                      aria-label={`Eliminar ${producto.nombre}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <p className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5">
                    {producto.categoria}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm text-foreground">
                        {formatUSD(producto.precioUSD * cantidad)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatVES(producto.precioUSD * cantidad)}
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 rounded-full border border-border bg-card p-0.5 shadow-xs">
                      <button
                        onClick={() => cambiarCantidad(producto.id, cantidad - 1)}
                        className="flex size-6 items-center justify-center rounded-full hover:bg-brand-yellow/60 transition-colors"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-semibold">{cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(producto.id, cantidad + 1)}
                        className="flex size-6 items-center justify-center rounded-full hover:bg-brand-yellow/60 transition-colors"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border bg-card/60 p-6 backdrop-blur">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatUSD(totalUSD)}</span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <span className="font-display text-lg font-bold">Total estimado</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-foreground">
                    {formatUSD(totalUSD)}
                  </span>
                  <p className="text-xs font-medium text-muted-foreground">
                    {formatVES(totalUSD)}
                  </p>
                </div>
              </div>
            </div>

            {isAdmin ? (
              <div className="mt-4 rounded-2xl border border-brand-yellow/80 bg-brand-yellow/30 p-3.5 text-center">
                <p className="text-xs font-bold text-brand-brown">
                  Sesión de Administrador
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  Como administrador solo gestionas la tienda y no realizas compras como cliente.
                </p>
                <Link
                  to="/admin"
                  onClick={cerrarCarrito}
                  className="mt-2.5 inline-flex w-full items-center justify-center rounded-full bg-primary py-2 text-xs font-bold text-primary-foreground shadow-sm hover:scale-[1.02] transition-transform"
                >
                  Ir al Panel de Administración
                </Link>
              </div>
            ) : (
              <button
                onClick={handleCheckout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-95 hover:shadow-lg active:scale-[0.99]"
              >
                Proceder al pago
                <ArrowRight className="size-4" />
              </button>
            )}

            <div className="mt-3 flex items-center justify-between text-xs">
              <Link
                to="/carrito"
                onClick={cerrarCarrito}
                className="font-medium text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Ver pantalla completa
              </Link>
              <button
                onClick={cerrarCarrito}
                className="font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Seguir comprando
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
