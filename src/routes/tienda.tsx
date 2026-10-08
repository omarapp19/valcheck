import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { categorias, type Categoria } from "@/lib/products";
import { useAdminStore } from "@/lib/admin-store";
import { ProductCard } from "@/components/ProductCard";

type Search = { categoria?: Categoria | undefined };

export const Route = createFileRoute("/tienda")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const cat = search["categoria"];
    return {
      categoria: categorias.includes(cat as Categoria) ? (cat as Categoria) : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Tienda — ValCheck | Pulseras, collares, aretes y anillos" },
      {
        name: "description",
        content:
          "Explora la colección completa de accesorios ValCheck: pulseras, collares, aretes y anillos con precios en dólares y bolívares.",
      },
      { property: "og:title", content: "Tienda — ValCheck" },
      {
        property: "og:description",
        content: "Pulseras, collares, aretes y anillos. Belleza Verificada.",
      },
    ],
  }),
  component: Tienda,
});

function Tienda() {
  const { productos } = useAdminStore();
  const { categoria } = Route.useSearch();
  const [filtro, setFiltro] = useState<Categoria | "Todas">(categoria ?? "Todas");

  const visibles =
    filtro === "Todas" ? productos : productos.filter((p) => p.categoria === filtro);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <span className="stamp inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
        Belleza Verificada
      </span>
      <h1 className="mt-4 text-4xl font-semibold md:text-5xl">La tienda</h1>
      <p className="mt-3 max-w-lg text-muted-foreground">
        Cada pieza es seleccionada con criterio y respaldada por nuestro compromiso
        de calidad. Precios en dólares y bolívares.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {(["Todas", ...categorias] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltro(cat)}
            className={`rounded-full border-2 border-primary px-5 py-2 text-sm font-semibold transition-colors ${
              filtro === cat ? "bg-primary text-primary-foreground" : "hover:bg-brand-yellow/60"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
        {visibles.map((p) => (
          <ProductCard key={p.id} producto={p} />
        ))}
      </div>
    </div>
  );
}
