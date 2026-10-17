import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Heart, Truck, Palette, Gem } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import {
  categoriasAccesorios,
  categoriasMaquillaje,
  getDepartamentoProducto,
  isProductoDisponible,
  type Departamento,
} from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { useDepartment } from "@/lib/department";
import { useAdminStore } from "@/lib/admin-store";
import { useEffect, useMemo } from "react";

const MAKEUP_HERO_IMG =
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1600";

interface DepartmentHomeProps {
  departamento: Departamento;
}

export function DepartmentHome({ departamento }: DepartmentHomeProps) {
  const { department, setDepartment } = useDepartment();
  const { productos } = useAdminStore();
  const isMaquillaje = departamento === "maquillaje";

  useEffect(() => {
    if (department !== departamento) {
      setDepartment(departamento);
    }
  }, [departamento, department, setDepartment]);

  const categoriasActivas = isMaquillaje ? categoriasMaquillaje : categoriasAccesorios;

  const productosDepto = useMemo(() => {
    return productos.filter((p) => getDepartamentoProducto(p) === departamento && isProductoDisponible(p));
  }, [productos, departamento]);

  const destacados = useMemo(() => {
    const list = productosDepto.filter((p) => p.destacado);
    if (list.length >= 4) return list.slice(0, 8);
    // Si no hay suficientes destacados marcados, tomar los primeros 8
    return productosDepto.slice(0, 8);
  }, [productosDepto]);

  return (
    <div className="space-y-12 md:space-y-16 pb-16">
      {/* ========================================================================= */}
      {/* 1. SECCIÓN HERO EDITORIAL */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-8 md:grid-cols-2 md:py-16">
          <div>
            <span className="stamp inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
              {isMaquillaje ? <Palette className="size-3.5 text-brand-yellow" /> : <Gem className="size-3.5 text-brand-yellow" />}
              {isMaquillaje ? "Línea Cosmética Verificada" : "Belleza Verificada"}
            </span>

            <h1 className="mt-4 sm:mt-6 text-balance text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] md:leading-[1.05] font-display">
              La confianza es tu mejor{" "}
              <span className="relative inline-block">
                {isMaquillaje ? "maquillaje" : "accesorio"}
                <span className="absolute inset-x-0 bottom-1 -z-10 h-2.5 sm:h-3 bg-brand-yellow/80 rounded-sm" />
              </span>
            </h1>

            <p className="mt-3.5 sm:mt-5 max-w-md text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
              {isMaquillaje
                ? "Bases, labiales, sombras y cuidado cosmético seleccionados para resaltar tu belleza auténtica. Fórmulas de alta fidelidad, tonos en tendencia."
                : "Pulseras, collares, aretes y anillos seleccionados con criterio para celebrar tu autenticidad. Piezas verificadas en acero inoxidable, belleza real."}
            </p>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <Link
                to="/tienda"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <span>Ver la tienda</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/nosotros"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary bg-background px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-foreground transition-colors hover:bg-brand-yellow/40"
              >
                Conócenos
              </Link>
            </div>
          </div>

          <div className="relative mt-2 sm:mt-0">
            <div className="overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] border-3 sm:border-4 border-primary shadow-2xl">
              <img
                src={isMaquillaje ? MAKEUP_HERO_IMG : heroImg}
                alt={isMaquillaje ? "Colección de maquillaje ValCheck" : "Colección de accesorios ValCheck"}
                width={1600}
                height={1008}
                loading="eager"
                className="aspect-[4/3] w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <span className="stamp absolute -bottom-3 left-2 sm:-bottom-4 sm:-left-4 rotate-[-6deg] px-3.5 sm:px-5 py-1.5 sm:py-2 font-display text-xs sm:text-lg font-semibold shadow-lg">
              Val✓Check {isMaquillaje ? "Beauty" : ""}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. EXPLORA POR CATEGORÍA */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="flex items-baseline justify-between border-b border-border pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Catálogo organizado
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display mt-0.5">Explora por categoría</h2>
          </div>
          <Link
            to="/tienda"
            className="text-xs sm:text-sm font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Ver todo</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 md:grid-cols-5">
          {categoriasActivas.map((cat) => (
            <Link
              key={cat}
              to="/tienda"
              className="group rounded-2xl border-2 border-primary bg-card p-3.5 sm:p-5 text-center transition-all hover:bg-brand-yellow/30 hover:scale-[1.02] shadow-xs flex flex-col justify-between"
            >
              <div className="py-1 sm:py-2">
                <span className="font-display text-sm sm:text-base md:text-lg font-bold block text-foreground leading-snug">
                  {cat}
                </span>
                <span className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 block">
                  {productosDepto.filter((p) => p.categoria === cat).length} productos
                </span>
              </div>
              <span className="mx-auto mt-2 flex size-6 sm:size-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:translate-x-1 group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowRight className="size-3 sm:size-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PRODUCTOS DESTACADOS */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-border pb-4 gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Selección especial
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display mt-0.5">
              {isMaquillaje ? "Cosméticos destacados" : "Piezas destacadas"}
            </h2>
          </div>
          <Link
            to="/tienda"
            className="text-xs sm:text-sm font-semibold underline underline-offset-4 decoration-brand-yellow decoration-4"
          >
            Ver catálogo completo ({productosDepto.length})
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
          {destacados.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BANNER DE CAMBIO DE SECCIÓN */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-6xl px-4">
        <div
          className={`relative overflow-hidden rounded-[2rem] border-2 p-5 sm:p-8 md:p-10 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 ${
            isMaquillaje
              ? "border-primary/40 bg-gradient-to-r from-card via-card to-brand-yellow/10"
              : "border-primary/30 bg-gradient-to-r from-brand-yellow/20 via-background to-card"
          }`}
        >
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              {isMaquillaje ? "💎 Línea de Joyería" : "💄 Línea Cosmética"}
            </span>
            <h3 className="font-display text-lg sm:text-xl md:text-2xl font-bold">
              {isMaquillaje
                ? "¿Deseas complementar tu estilo con Joyería?"
                : "¿Deseas complementar tu look con Maquillaje?"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              {isMaquillaje
                ? "Explora nuestra colección de pulseras, collares, aretes y anillos en acero inoxidable y baño de oro."
                : "Descubre nuestra línea de bases, labiales, sombras y cosméticos profesionales."}
            </p>
          </div>

          <Link
            to={isMaquillaje ? "/accesorios" : "/maquillaje"}
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <span>{isMaquillaje ? "Ir a Accesorios" : "Ir a Maquillaje"}</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. NUESTRA PROMESA / VALORES DE LA MARCA */}
      {/* ========================================================================= */}
      <section className="mx-auto max-w-6xl px-4">
        <div className="grid gap-4 rounded-[2rem] bg-primary p-6 sm:p-8 md:p-12 text-primary-foreground md:grid-cols-3 shadow-md">
          <div className="flex gap-4">
            <BadgeCheck className="size-8 shrink-0 text-brand-yellow" />
            <div>
              <h3 className="font-display text-lg font-semibold">Calidad verificada</h3>
              <p className="mt-1 text-xs sm:text-sm opacity-80 leading-relaxed">
                {isMaquillaje
                  ? "Cada producto cosmético pasa por rigurosa selección de textura y fórmula."
                  : "Cada pieza pasa por nuestra revisión minuciosa antes de llegar a ti."}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Heart className="size-8 shrink-0 text-brand-yellow" />
            <div>
              <h3 className="font-display text-lg font-semibold">Hecho con propósito</h3>
              <p className="mt-1 text-xs sm:text-sm opacity-80 leading-relaxed">
                Selección consciente que celebra tu valor, autenticidad y seguridad.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Truck className="size-8 shrink-0 text-brand-yellow" />
            <div>
              <h3 className="font-display text-lg font-semibold">Entrega segura</h3>
              <p className="mt-1 text-xs sm:text-sm opacity-80 leading-relaxed">
                Envíos garantizados con número de guía en toda Venezuela vía MRW, Zoom o Tealca.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
