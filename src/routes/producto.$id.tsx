import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Camera, ShoppingBag, Wand2 } from "lucide-react";
import { useState } from "react";
import { formatUSD, formatVES, productos, getDepartamentoProducto } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useAdminStore } from "@/lib/admin-store";
import { ProductCard } from "@/components/ProductCard";
import { VirtualTryOnModal } from "@/components/VirtualTryOnModal";
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
  const { producto } = Route.useLoaderData();
  const { agregar, abrirCarrito } = useCart();
  const { tasaBCV } = useAdminStore();
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const isAccesorio = getDepartamentoProducto(producto) === "accesorios";
  const relacionados = productos
    .filter((p) => p.categoria === producto.categoria && p.id !== producto.id)
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

          {/* Botón flotante para probar puesto directamente desde la foto (solo accesorios) */}
          {isAccesorio && (
            <button
              type="button"
              onClick={() => setTryOnOpen(true)}
              className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-card/90 backdrop-blur-md px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold text-foreground border border-border shadow-lg hover:bg-brand-yellow/80 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Camera className="size-3.5 sm:size-4 text-primary" />
              <span>Probarme con IA</span>
            </button>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {producto.categoria}
          </p>
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
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 sm:py-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer shadow-md"
            >
              <ShoppingBag className="size-4.5 sm:size-5" /> Agregar al carrito
            </button>

            {/* Botón Principal del Probador Virtual (solo accesorios) */}
            {isAccesorio && (
              <button
                type="button"
                onClick={() => setTryOnOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary bg-card/80 hover:bg-brand-yellow/30 px-6 py-3.5 sm:py-4 text-sm font-bold text-foreground transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-sm"
              >
                <Camera className="size-4 text-primary" />
                <span>Probar en mi foto</span>
              </button>
            )}
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <BadgeCheck className="size-4 text-primary shrink-0" />
            Pieza verificada por ValCheck — calidad garantizada.
          </p>
        </div>
      </div>

      {/* Modal Interactivo del Probador Virtual (solo accesorios) */}
      {isAccesorio && (
        <VirtualTryOnModal
          producto={producto}
          isOpen={tryOnOpen}
          onClose={() => setTryOnOpen(false)}
        />
      )}

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
