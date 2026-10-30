import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  categoriasAccesorios,
  categoriasMaquillaje,
  getDepartamentoProducto,
  isProductoDisponible,
  type Categoria,
} from "@/lib/products";
import { useAdminStore } from "@/lib/admin-store";
import { useDepartment } from "@/lib/department";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/ProductCard";
import { Palette, Gem, PlusCircle, Search, X, SlidersHorizontal, RotateCcw } from "lucide-react";

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
  const [busqueda, setBusqueda] = useState<string>("");
  const [orden, setOrden] = useState<"destacados" | "precio-menor" | "precio-mayor" | "nombre">("destacados");

  // Categorías según el departamento activo
  const categoriasActivas = useMemo(() => {
    return isMaquillaje ? categoriasMaquillaje : categoriasAccesorios;
  }, [isMaquillaje]);

  // Si la categoría seleccionada no existe en el nuevo departamento, volver a "Todas"
  useEffect(() => {
    if (filtro !== "Todas" && !categoriasActivas.includes(filtro as any)) {
      setFiltro("Todas");
    }
  }, [department, categoriasActivas, filtro]);

  // Productos filtrados por departamento activo y disponibles (con stock y activos)
  const productosDepartamento = useMemo(() => {
    return productos.filter((p) => getDepartamentoProducto(p) === department && isProductoDisponible(p));
  }, [productos, department]);

  // Contadores para cada departamento
  const countAccesorios = useMemo(
    () => productos.filter((p) => getDepartamentoProducto(p) === "accesorios" && isProductoDisponible(p)).length,
    [productos]
  );
  const countMaquillaje = useMemo(
    () => productos.filter((p) => getDepartamentoProducto(p) === "maquillaje" && isProductoDisponible(p)).length,
    [productos]
  );

  // Productos visibles según filtro, búsqueda y orden
  const visibles = useMemo(() => {
    let lista = productosDepartamento;

    // Filtro por categoría
    if (filtro !== "Todas") {
      lista = lista.filter((p) => p.categoria === filtro);
    }

    // Búsqueda por texto (nombre, categoría, descripción)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      lista = lista.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q) ||
          p.descripcion.toLowerCase().includes(q)
      );
    }

    // Ordenamiento
    return [...lista].sort((a, b) => {
      if (orden === "destacados") {
        return (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0);
      }
      if (orden === "precio-menor") {
        return a.precioUSD - b.precioUSD;
      }
      if (orden === "precio-mayor") {
        return b.precioUSD - a.precioUSD;
      }
      if (orden === "nombre") {
        return a.nombre.localeCompare(b.nombre);
      }
      return 0;
    });
  }, [productosDepartamento, filtro, busqueda, orden]);

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-6 py-5 sm:py-8 md:py-12 w-full min-w-0 overflow-x-hidden transition-colors duration-300">
      {/* 1. Selector Superior de Departamento (Control segmentado adaptativo) */}
      <div className="flex justify-center sm:justify-start">
        <div className="grid grid-cols-2 p-1 bg-muted/60 dark:bg-muted/30 rounded-2xl border border-border w-full sm:w-auto sm:inline-flex">
          <button
            type="button"
            onClick={() => {
              setFiltro("Todas");
              setDepartment("accesorios");
            }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
              !isMaquillaje
                ? "bg-primary text-primary-foreground shadow-xs scale-[1.01]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gem className="size-3.5 sm:size-4 shrink-0" />
            <span className="truncate">Joyería & Accesorios</span>
            <span className="text-[10px] sm:text-xs opacity-80 shrink-0">({countAccesorios})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFiltro("Todas");
              setDepartment("maquillaje");
            }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer text-center ${
              isMaquillaje
                ? "bg-brand-yellow text-brand-brown font-bold shadow-xs scale-[1.01]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Palette className="size-3.5 sm:size-4 shrink-0" />
            <span className="truncate">Maquillaje</span>
            <span className="text-[10px] sm:text-xs opacity-80 shrink-0">({countMaquillaje})</span>
          </button>
        </div>
      </div>

      {/* 2. Header editorial */}
      <div className="mt-4 sm:mt-6 border-b border-border pb-5 sm:pb-6">
        <span className="stamp inline-flex items-center gap-1.5 px-3.5 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-widest">
          {isMaquillaje ? <Palette className="size-3.5 text-brand-brown" /> : <Gem className="size-3.5 text-brand-brown" />}
          {isMaquillaje ? "Línea Cosmética Verificada" : "Línea de Accesorios en Acero"}
        </span>
        <h1 className="mt-2.5 sm:mt-3 text-2xl sm:text-4xl md:text-5xl font-semibold font-display tracking-tight">
          {isMaquillaje ? "Maquillaje & Cosmética" : "Joyería & Accesorios"}
        </h1>
        <p className="mt-1.5 sm:mt-2 max-w-xl text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
          {isMaquillaje
            ? "Cosméticos seleccionados para resaltar tu belleza única. Fórmulas verificadas con criterio y precios oficiales."
            : "Cada pieza de joyería es seleccionada con criterio en acero inoxidable y respaldada por nuestro sello de calidad."}
        </p>
      </div>

      {/* 3. Barra de Búsqueda y Ordenamiento */}
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={`Buscar en ${isMaquillaje ? "maquillaje" : "accesorios"}...`}
            className="w-full rounded-2xl border border-input bg-card pl-10 pr-9 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 justify-between sm:justify-end shrink-0">
          <span className="text-[11px] sm:text-xs text-muted-foreground font-semibold">
            {visibles.length} {visibles.length === 1 ? "pieza encontrada" : "piezas"}
          </span>

          <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-1.5 sm:py-2 text-xs font-semibold shadow-2xs">
            <SlidersHorizontal className="size-3.5 text-muted-foreground shrink-0" />
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as any)}
              className="bg-transparent outline-none cursor-pointer text-foreground font-semibold text-xs"
              aria-label="Ordenar productos"
            >
              <option value="destacados">Destacados</option>
              <option value="precio-menor">Menor precio</option>
              <option value="precio-mayor">Mayor precio</option>
              <option value="nombre">Nombre A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Pestañas de categorías (Deslizables suavemente en móvil sin deformar el ancho) */}
      <div className="mt-3 sm:mt-4 flex gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-1 w-full min-w-0">
        {["Todas", ...categoriasActivas].map((cat) => {
          const count =
            cat === "Todas"
              ? productosDepartamento.length
              : productosDepartamento.filter((p) => p.categoria === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setFiltro(cat)}
              className={`shrink-0 rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                filtro === cat
                  ? "bg-primary text-primary-foreground shadow-xs font-bold scale-[1.02]"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {cat} <span className="opacity-75 text-[10px] sm:text-xs font-normal">({count})</span>
            </button>
          );
        })}
      </div>

      {/* 5. Listado de Productos o Estado Vacío */}
      {visibles.length > 0 ? (
        <div className="mt-5 sm:mt-8 grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6 w-full min-w-0">
          {visibles.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="mt-8 sm:mt-12 rounded-3xl border-2 border-border/70 bg-card p-6 sm:p-12 text-center shadow-xs">
          <div className="mx-auto flex size-16 sm:size-20 items-center justify-center rounded-full bg-brand-yellow/30 text-brand-brown">
            {busqueda ? <Search className="size-8 sm:size-10" /> : isMaquillaje ? <Palette className="size-8 sm:size-10" /> : <Gem className="size-8 sm:size-10" />}
          </div>

          <h2 className="mt-4 sm:mt-6 font-display text-xl sm:text-2xl md:text-3xl font-semibold">
            {busqueda
              ? `Sin resultados para "${busqueda}"`
              : isMaquillaje
                ? "Colección de Maquillaje en Preparación"
                : "No hay productos en esta categoría"}
          </h2>

          <p className="mt-2 sm:mt-3 max-w-md mx-auto text-xs sm:text-sm md:text-base text-muted-foreground">
            {busqueda
              ? "Prueba buscando con otro término o limpia los filtros para explorar todo el catálogo disponible."
              : isMaquillaje
                ? "Estamos preparando las fórmulas y tonos más exclusivos para ti. Muy pronto podrás adquirirlos aquí."
                : "Explora otras categorías o regresa a ver todo el catálogo disponible."}
          </p>

          <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-2.5 sm:gap-3">
            {(busqueda || filtro !== "Todas") && (
              <button
                type="button"
                onClick={() => {
                  setFiltro("Todas");
                  setBusqueda("");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-md transition-transform hover:scale-105 cursor-pointer"
              >
                <RotateCcw className="size-3.5 sm:size-4" />
                Ver todo el catálogo
              </button>
            )}

            {isMaquillaje && !busqueda && (
              <button
                type="button"
                onClick={() => setDepartment("accesorios")}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-md transition-transform hover:scale-105 cursor-pointer"
              >
                <Gem className="size-3.5 sm:size-4" />
                Explorar Accesorios mientras tanto
              </button>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary bg-card px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-foreground transition-transform hover:scale-105"
              >
                <PlusCircle className="size-3.5 sm:size-4" />
                Cargar productos desde el Panel Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
