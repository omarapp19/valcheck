import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Palette, Gem } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { useDepartment } from "@/lib/department";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ValCheck — Belleza Verificada | Accesorios & Maquillaje" },
      {
        name: "description",
        content:
          "Elige tu universo en ValCheck: Joyería y Accesorios de brillo auténtico, y Maquillaje de alta fidelidad. Belleza Verificada.",
      },
      { property: "og:title", content: "ValCheck — Belleza Verificada | Accesorios & Maquillaje" },
      {
        property: "og:description",
        content:
          "Pantalla dividida ValCheck: Entra a Accesorios o Maquillaje. Belleza Verificada.",
      },
    ],
  }),
  component: Index,
});

export function Index() {
  const { setDepartment } = useDepartment();
  const navigate = useNavigate();
  const [hoveredSide, setHoveredSide] = useState<"accesorios" | "maquillaje" | null>(null);

  const irADepartamento = (dept: "accesorios" | "maquillaje") => {
    setDepartment(dept);
    navigate({ to: "/tienda" });
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] overflow-hidden flex flex-col md:flex-row select-none">
      {/* ========================================================================= */}
      {/* MITAD 1: ACCESORIOS (Izquierda en desktop, Superior en mobile) */}
      {/* ========================================================================= */}
      <section
        onMouseEnter={() => setHoveredSide("accesorios")}
        onMouseLeave={() => setHoveredSide(null)}
        onClick={() => irADepartamento("accesorios")}
        aria-label="Entrar a colección de Accesorios"
        className={`group relative overflow-hidden cursor-pointer transition-all duration-700 ease-out flex flex-col justify-end md:justify-center p-6 sm:p-10 lg:p-14 ${
          hoveredSide === "accesorios"
            ? "h-[56%] md:h-full md:w-[58%] z-10 shadow-2xl"
            : hoveredSide === "maquillaje"
            ? "h-[44%] md:h-full md:w-[42%] opacity-90"
            : "h-1/2 md:h-full md:w-1/2"
        } bg-[#faf6ed] text-[#3f170d]`}
      >
        {/* Fotografía de fondo de joyería */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="Colección de Accesorios y Joyería ValCheck"
            className="size-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105 group-hover:brightness-105"
            loading="eager"
          />
          {/* Degradado cálido beige para legibilidad de textos y logotipo */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#faf6ed]/95 via-[#faf6ed]/85 to-[#faf6ed]/35 transition-opacity duration-700 group-hover:opacity-90" />
        </div>

        {/* Contenido Editorial Flotante */}
        <div className="relative z-10 max-w-lg space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0a0] px-4 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#3f170d] shadow-xs">
            <Gem className="size-3.5 text-[#3f170d]" />
            Joyería & Accesorios
          </div>

          {/* Logotipo Oficial de Accesorios */}
          <div className="py-1">
            <img
              src="/logo-prin.png"
              alt="ValCheck Accesorios"
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-[#3f170d] leading-tight">
            Accesorios
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-[#3f170d]/85 font-medium leading-relaxed max-w-md line-clamp-2 sm:line-clamp-none">
            Pulseras, collares, aretes y anillos seleccionados en acero inoxidable. Diseñados para perdurar y resaltar tu brillo auténtico.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-[#3f170d]/70">
            <span className="rounded-full bg-white/70 px-2.5 py-1">Pulseras</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">Collares</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">Aretes</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">Anillos</span>
            <span className="rounded-full bg-white/70 px-2.5 py-1">Sets</span>
          </div>

          <div className="pt-2 sm:pt-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                irADepartamento("accesorios");
              }}
              className="inline-flex items-center gap-2.5 rounded-full bg-[#3f170d] px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-[#fff0a0] shadow-xl hover:bg-[#2b0e07] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <span>Entrar a Accesorios</span>
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MITAD 2: MAQUILLAJE (Derecha en desktop, Inferior en mobile) */}
      {/* ========================================================================= */}
      <section
        onMouseEnter={() => setHoveredSide("maquillaje")}
        onMouseLeave={() => setHoveredSide(null)}
        onClick={() => irADepartamento("maquillaje")}
        aria-label="Entrar a colección de Maquillaje"
        className={`group relative overflow-hidden cursor-pointer transition-all duration-700 ease-out flex flex-col justify-end md:justify-center p-6 sm:p-10 lg:p-14 ${
          hoveredSide === "maquillaje"
            ? "h-[56%] md:h-full md:w-[58%] z-10 shadow-2xl"
            : hoveredSide === "accesorios"
            ? "h-[44%] md:h-full md:w-[42%] opacity-90"
            : "h-1/2 md:h-full md:w-1/2"
        } bg-[#250e07] text-[#fffdf5]`}
      >
        {/* Fotografía de fondo editorial de cosméticos y belleza */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1600"
            alt="Colección de Cosméticos y Maquillaje ValCheck"
            className="size-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105 group-hover:brightness-110"
            loading="eager"
          />
          {/* Degradado marrón chocolate oscuro (Invertido) para contraste premium */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-[#250e07]/95 via-[#250e07]/85 to-[#250e07]/40 transition-opacity duration-700 group-hover:opacity-90" />
        </div>

        {/* Contenido Editorial Flotante */}
        <div className="relative z-10 max-w-lg space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff0a0]/20 border border-[#fff0a0]/40 px-4 py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#fff0a0] shadow-xs backdrop-blur-xs">
            <Palette className="size-3.5 text-[#fff0a0]" />
            Cosmética & Belleza
          </div>

          {/* Logotipo Oficial de Maquillaje */}
          <div className="py-1">
            <img
              src="/logo-prin-maq.png"
              alt="ValCheck Maquillaje"
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-[#fffdf5] leading-tight">
            Maquillaje
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-[#fffdf5]/85 font-medium leading-relaxed max-w-md line-clamp-2 sm:line-clamp-none">
            Labiales, bases de alta fidelidad, sombras y cuidado cosmético para realzar tu belleza auténtica con tonos y fórmulas en tendencia.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold text-[#fffdf5]/70">
            <span className="rounded-full bg-black/40 border border-white/10 px-2.5 py-1">Labiales</span>
            <span className="rounded-full bg-black/40 border border-white/10 px-2.5 py-1">Bases & Rostro</span>
            <span className="rounded-full bg-black/40 border border-white/10 px-2.5 py-1">Sombras</span>
            <span className="rounded-full bg-black/40 border border-white/10 px-2.5 py-1">Skincare</span>
            <span className="rounded-full bg-black/40 border border-white/10 px-2.5 py-1">Brochas</span>
          </div>

          <div className="pt-2 sm:pt-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                irADepartamento("maquillaje");
              }}
              className="inline-flex items-center gap-2.5 rounded-full bg-[#fff0a0] px-7 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-[#3f170d] shadow-xl hover:bg-[#fff6b8] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <span>Entrar a Maquillaje</span>
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
