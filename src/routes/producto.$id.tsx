import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, ShoppingBag } from "lucide-react";
import { formatUSD, formatVES, productos } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/ProductCard";
import { toast } from "sonner";

export const Route = createFileRoute("/producto/$id")({
  loader: ({ params }) => {
    let catalogo = productos;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("valcheck_catalog_products");
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
  const { agregar } = useCart();
  const relacionados = productos
    .filter((p) => p.categoria === producto.categoria && p.id !== producto.id)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        to="/tienda"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver a la tienda
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-[2rem] border-2 border-primary bg-card">
          <img
            src={producto.imagen}
            alt={producto.nombre}
            width={912}
            height={912}
            className="aspect-square w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {producto.categoria}
          </p>
          <h1 className="mt-2 text-4xl font-semibold md:text-5xl">{producto.nombre}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{producto.descripcion}</p>

          <div className="mt-6 rounded-2xl bg-brand-yellow/60 p-5">
            <p className="text-3xl font-bold">{formatUSD(producto.precioUSD)}</p>
            <p className="mt-1 text-sm font-medium text-foreground/70">
              {formatVES(producto.precioUSD)} (Tasa BCV oficial)
            </p>
          </div>

          <button
            onClick={() => {
              agregar(producto.id);
              toast.success(`${producto.nombre} agregado al carrito`);
            }}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            <ShoppingBag className="size-5" /> Agregar al carrito
          </button>

          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <BadgeCheck className="size-4 text-brand-brown" />
            Pieza verificada por ValCheck — calidad garantizada.
          </p>
        </div>
      </div>

      {relacionados.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold">También te puede gustar</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {relacionados.map((p) => (
              <ProductCard key={p.id} producto={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
