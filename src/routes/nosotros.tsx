import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Heart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/nosotros")({
  head: () => ({
    meta: [
      { title: "Nosotros — ValCheck | Belleza Verificada" },
      {
        name: "description",
        content:
          "Conoce ValCheck: un espacio dedicado a la selección consciente de accesorios que celebran la autenticidad y el bienestar.",
      },
      { property: "og:title", content: "Nosotros — ValCheck" },
      {
        property: "og:description",
        content: "Selección consciente de accesorios que celebran tu autenticidad.",
      },
    ],
  }),
  component: Nosotros,
});

function Nosotros() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <span className="stamp inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
        Nuestra historia
      </span>
      <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
        Val<span className="not-italic">✓</span>Check
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
        ValCheck nace de la unión de dos principios innegociables: <strong className="text-foreground">Val</strong>,
        que honra el valor innato, la actitud valiente y la belleza de cada mujer —
        inspirado en el significado de Valentina: <em>valiente y bella</em> — y{" "}
        <strong className="text-foreground">Check</strong>, la garantía absoluta de una
        experiencia rápida, segura y confiable.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border-2 border-primary bg-card p-6">
          <Sparkles className="size-7 text-brand-brown" />
          <h2 className="mt-3 font-display text-xl font-semibold">Misión</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompañar a las personas con cercanía, honestidad y criterio real,
            ofreciendo selecciones de productos que sirvan como recordatorio
            tangible de su propio valor.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-primary bg-card p-6">
          <BadgeCheck className="size-7 text-brand-brown" />
          <h2 className="mt-3 font-display text-xl font-semibold">Visión</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Consolidarse como un referente integral y confiable que inspira a su
            comunidad a proyectar su mejor versión en cada faceta de su vida.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-primary bg-brand-yellow p-6">
          <Heart className="size-7 text-brand-brown" />
          <h2 className="mt-3 font-display text-xl font-semibold">Promesa</h2>
          <p className="mt-2 text-sm text-foreground/80">
            Productos originales, verificados y respaldados por un compromiso
            real. La confianza es tu mejor accesorio.
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-[2rem] bg-primary p-8 text-center text-primary-foreground md:p-12">
        <p className="font-display text-2xl font-semibold md:text-3xl">
          "La verdadera belleza comienza con un corazón alegre"
        </p>
        <p className="mt-2 text-sm opacity-70">Prov 15:13</p>
        <Link
          to="/tienda"
          className="mt-6 inline-block rounded-full bg-brand-yellow px-6 py-3 text-sm font-bold text-brand-brown transition-transform hover:scale-105"
        >
          Descubre la colección
        </Link>
      </div>
    </div>
  );
}
