import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  categoriasAccesorios,
  categoriasMaquillaje,
  getDepartamentoProducto,
  type Categoria,
} from "@/lib/products";
import { useAdminStore } from "@/lib/admin-store";
import { useDepartment } from "@/lib/department";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/ProductCard";
import { Palette, Sparkles, Gem, PlusCircle, ArrowLeft } from "lucide-react";

type Search = { categoria?: Categoria | undefined };

export const Route = createFileRoute("/tienda")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const cat = search["categoria"];
    return {
      categoria: typeof cat === "string" ? cat : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Tienda — ValCheck | Accesorios & Maquillaje" },
      {
        name: "description",
        content:
          "Explora las colecciones de ValCheck: Joyería, Accesorios y Cosméticos con precios oficiales en bolívares y dólares.",
      },
      { property: "og:title", content: "Tienda — ValCheck" },
      {
        property: "og:description",
        content: "Accesorios y Maquillaje con criterio. Belleza Verificada.",
      },
    ],
  }),
  component: Tienda,
});

function Tienda() {
  const { productos } = useAdminStore();
  const { department, setDepartment, isMaquillaje } = useDepartment();
  const { isAdmin } = useAuth();
  const { categoria } = Route.useSearch();
  const [filtro, setFiltro] = useState<string>(categoria ?? "Todas");

  // Categorías según el departamento activo
  const categoriasActivas = useMemo(() => {
    return isMaquillaje ? categoriasMaquillaje : categoriasAccesorios;
  }, [isMaquillaje]);

  // Productos filtrados por departamento activo
  const productosDepartamento = useMemo(() => {
    return productos.filter((p) => getDepartamentoProducto(p) === department);
  }, [productos, department]);

  // Productos visibles según filtro de categoría seleccionado
  const visibles = useMemo(() => {
    if (filtro === "Todas") return productosDepartamento;
    return productosDepartamento.filter((p) => p.categoria === filtro);
  }, [productosDepartamento, filtro]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14 transition-colors duration-300">
      {/* Header editorial */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="stamp inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
            {isMaquillaje ? <Palette className="size-3.5" /> : <Gem className="size-3.5" />}
            {isMaquillaje ? "Línea de Maquillaje" : "Línea de Accesorios"}
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-semibold font-display">
            {isMaquillaje ? "Maquillaje & Cosmética" : "Joyería & Accesorios"}
          </h1>
          <p className="mt-2 max-w-xl text-sm md:text-base text-muted-foreground">
            {isMaquillaje
              ? "Cosméticos seleccionados para resaltar tu belleza única. Fórmulas verificadas con criterio."
              : "Cada pieza de joyería es seleccionada con criterio y respaldada por nuestro compromiso de calidad."}
          </p>
        </div>

        {/* Acceso rápido para conmutar departamento */}
        <button
          type="button"
          onClick={() => {
            setFiltro("Todas");
            setDepartment(isMaquillaje ? "accesorios" : "maquillaje");
          }}
          className="self-start md:self-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 sm:px-4 py-2 text-xs font-bold transition-all hover:scale-105 shadow-xs"
        >
          {isMaquillaje ? (
            <>
              <Sparkles className="size-3.5 text-brand-yellow" />
              Ver colección de Accesorios
            </>
          ) : (
            <>
              <Palette className="size-3.5 text-brand-yellow" />
              Ver colección de Maquillaje
            </>
          )}
        </button>
      </div>

      {/* Pestañas de categorías (Deslizables horizontalmente en móvil, envueltas en escritorio) */}
      <div className="mt-6 sm:mt-8 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap scrollbar-none">
        {["Todas", ...categoriasActivas].map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltro(cat)}
            className={`shrink-0 rounded-full border-2 border-primary px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              filtro === cat
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card/70 hover:bg-brand-yellow/50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Listado de Productos o Estado Vacío */}
      {visibles.length > 0 ? (
        <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {visibles.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      ) : (
        /* Empty State para Maquillaje o Categoría sin productos */
        <div className="mt-12 rounded-[2.5rem] border-2 border-border/70 bg-card p-10 md:p-16 text-center shadow-xs">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-brand-yellow/30 text-brand-brown">
            {isMaquillaje ? <Palette className="size-10" /> : <Sparkles className="size-10" />}
          </div>

          <h2 className="mt-6 font-display text-2xl sm:text-3xl font-semibold">
            {isMaquillaje
              ? "Colección de Maquillaje en Preparación"
              : "No hay productos en esta categoría"}
          </h2>

          <p className="mt-3 max-w-md mx-auto text-sm md:text-base text-muted-foreground">
            {isMaquillaje
              ? "Estamos preparando las fórmulas y tonos más exclusivos para ti. Muy pronto podrás adquirirlos aquí."
              : "Explora otras categorías o regresa a ver todo el catálogo disponible."}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {isMaquillaje && (
              <button
                type="button"
                onClick={() => setDepartment("accesorios")}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition-transform hover:scale-105"
              >
                <Sparkles className="size-4" />
                Explorar Accesorios mientras tanto
              </button>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-card px-6 py-3 text-sm font-bold text-foreground transition-transform hover:scale-105"
              >
                <PlusCircle className="size-4" />
                Cargar productos desde el Panel Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
