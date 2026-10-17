import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, ShoppingBag, AlertTriangle, EyeOff } from "lucide-react";
import { formatUSD, formatVES, isProductoDisponible, productos } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useAdminStore } from "@/lib/admin-store";
import { ProductCard } from "@/components/ProductCard";
import { toast } from "sonner";

export const Route = createFileRoute("/producto/$id")({
  loader: ({ params }) => {
    let catalogo = productos;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("valcheck_catalog_products_v4") || localStorage.getItem("valcheck_catalog_products");
        if (raw) catalogo = JSON.parse(raw);
      } catch {
        /* ignore */
      }
    }
    const producto = catalogo.find((p) => p.id === params.id) ?? productos.find((p) => p.id === params.id);
    if (!producto) throw notFound();
    return { producto };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.producto.nombre} — ValCheck` },
          { name: "description", content: loaderData.producto.descripcion },
          { property: "og:title", content: `${loaderData.producto.nombre} — ValCheck` },
          { property: "og:description", content: loaderData.producto.descripcion },
        ]
      : [{ title: "Producto no encontrado — ValCheck" }],
  }),
  component: ProductoPage,
});

function ProductoPage() {
  const { producto: initialProducto } = Route.useLoaderData();
  const { agregar, abrirCarrito } = useCart();
  const { productos: adminProductos, tasaBCV } = useAdminStore();

  const producto = adminProductos.find((p) => p.id === initialProducto.id) ?? initialProducto;
  const disponible = isProductoDisponible(producto);
  const stock = producto.stock ?? 10;
  const activo = producto.activo !== false;

  const relacionados = adminProductos
    .filter((p) => p.categoria === producto.categoria && p.id !== producto.id && isProductoDisponible(p))
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <Link
        to="/tienda"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5 sm:size-4" /> Volver a la tienda
      </Link>

      <div className="mt-4 sm:mt-6 grid gap-6 sm:gap-10 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] border-2 border-primary bg-card group">
          <img
            src={producto.imagen}
            alt={producto.nombre}
            width={912}
            height={912}
            className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {!disponible && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center p-4">
              <span className="rounded-full bg-destructive text-destructive-foreground px-4 py-2 text-sm font-bold shadow-lg flex items-center gap-1.5">
                <AlertTriangle className="size-4" />
                {stock <= 0 ? "Agotado temporalmente" : "No disponible"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {producto.categoria}
            </p>
            {stock <= 0 ? (
              <span className="rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 text-[10px] font-bold">
                Sin Stock (0)
              </span>
            ) : stock <= 3 ? (
              <span className="rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                ¡Solo quedan {stock} unidades!
              </span>
            ) : null}
            {!activo && (
              <span className="rounded-full bg-muted text-muted-foreground border border-border px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                <EyeOff className="size-3" /> Pausado
              </span>
            )}
          </div>

          <h1 className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight">{producto.nombre}</h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">{producto.descripcion}</p>

          <div className="mt-4 sm:mt-6 rounded-2xl bg-brand-yellow/60 p-4 sm:p-5 text-brand-brown">
            <p className="text-2xl sm:text-3xl font-bold text-brand-brown" suppressHydrationWarning>{formatUSD(producto.precioUSD)}</p>
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-brand-brown/80" suppressHydrationWarning>
              {formatVES(producto.precioUSD, tasaBCV)} (Tasa BCV oficial)
            </p>
          </div>

          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-3">
            <button
              disabled={!disponible}
              onClick={() => {
                if (!disponible) return;
                agregar(producto.id);
                toast.success(`${producto.nombre}`, {
                  description: "Agregado exitosamente a tu bolsa",
                  action: {
                    label: "Ver bolsa",
                    onClick: () => abrirCarrito(),
                  },
                });
              }}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-7 py-3.5 sm:py-4 text-sm font-semibold transition-transform shadow-md ${
                disponible
                  ? "bg-primary text-primary-foreground hover:scale-[1.02] active:scale-95 cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-70"
              }`}
            >
              <ShoppingBag className="size-4.5 sm:size-5" />
              {stock <= 0 ? "Producto Agotado (Sin Stock)" : !activo ? "Producto No Disponible" : "Agregar al carrito"}
            </button>
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <BadgeCheck className="size-4 text-primary shrink-0" />
            Pieza verificada por ValCheck — calidad garantizada.
          </p>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-12 sm:mt-16">
          <h2 className="text-xl sm:text-2xl font-semibold">También te puede gustar</h2>
          <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
            {relacionados.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
