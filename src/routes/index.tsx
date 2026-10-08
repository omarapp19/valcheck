import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Heart, Sparkles, Truck } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { productos, categorias } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ValCheck — Belleza Verificada | Accesorios" },
      {
        name: "description",
        content:
          "Pulseras, collares, aretes y anillos seleccionados con criterio. La confianza es tu mejor accesorio. ValCheck — Belleza Verificada.",
      },
      { property: "og:title", content: "ValCheck — Belleza Verificada | Accesorios" },
      {
        property: "og:description",
        content:
          "Pulseras, collares, aretes y anillos seleccionados con criterio. La confianza es tu mejor accesorio.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const destacados = productos.filter((p) => p.destacado);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="stamp inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="size-3.5" /> Belleza Verificada
            </span>
            <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] md:text-6xl">
              La confianza es tu mejor{" "}
              <span className="relative inline-block">
                accesorio
                <span className="absolute inset-x-0 bottom-1 -z-10 h-3 bg-brand-yellow" />
              </span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Pulseras, collares, aretes y anillos seleccionados con criterio para
              celebrar tu autenticidad. Piezas verificadas, belleza real.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/tienda"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-105"
              >
                Ver la tienda <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/nosotros"
                className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-6 py-3 text-sm font-semibold transition-colors hover:bg-brand-yellow/50"
              >
                Conócenos
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-[2.5rem] border-4 border-primary shadow-xl">
              <img
                src={heroImg}
                alt="Colección de accesorios ValCheck: pulseras, collares y anillos dorados"
                width={1600}
                height={1008}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <span className="stamp absolute -bottom-4 -left-4 rotate-[-6deg] px-5 py-2 font-display text-lg font-semibold">
              Val✓Check
            </span>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl font-semibold">Explora por categoría</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {categorias.map((cat) => (
            <Link
              key={cat}
              to="/tienda"
              search={{ categoria: cat }}
              className="group rounded-2xl border-2 border-primary bg-card px-4 py-8 text-center transition-colors hover:bg-brand-yellow"
            >
              <span className="font-display text-xl font-semibold">{cat}</span>
              <ArrowRight className="mx-auto mt-2 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      {/* Destacados */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-semibold">Piezas destacadas</h2>
          <Link to="/tienda" className="text-sm font-semibold underline underline-offset-4 decoration-brand-yellow decoration-4">
            Ver todo
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {destacados.map((p) => (
            <ProductCard key={p.id} producto={p} />
          ))}
        </div>
      </section>

      {/* Valores */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 rounded-[2rem] bg-primary p-8 text-primary-foreground md:grid-cols-3 md:p-12">
          <div className="flex gap-4">
            <BadgeCheck className="size-8 shrink-0 text-brand-yellow" />
            <div>
              <h3 className="font-display text-lg font-semibold">Calidad verificada</h3>
              <p className="mt-1 text-sm opacity-80">
                Cada pieza pasa por nuestra revisión antes de llegar a ti.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Heart className="size-8 shrink-0 text-brand-yellow" />
            <div>
              <h3 className="font-display text-lg font-semibold">Hecho con propósito</h3>
              <p className="mt-1 text-sm opacity-80">
                Selección consciente que celebra tu valor y autenticidad.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Truck className="size-8 shrink-0 text-brand-yellow" />
            <div>
              <h3 className="font-display text-lg font-semibold">Entrega segura</h3>
              <p className="mt-1 text-sm opacity-80">
                Envíos confiables para que recibas tu pedido sin preocupaciones.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
