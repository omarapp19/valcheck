import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — ValCheck" },
      {
        name: "description",
        content: "Escríbenos: estamos para acompañarte. Contacta a ValCheck por Instagram, WhatsApp o correo.",
      },
      { property: "og:title", content: "Contacto — ValCheck" },
      { property: "og:description", content: "Escríbenos: estamos para acompañarte." },
    ],
  }),
  component: Contacto,
});

function Contacto() {
  const [enviado, setEnviado] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <h1 className="text-4xl font-semibold md:text-5xl">Hablemos</h1>
      <p className="mt-3 max-w-lg text-muted-foreground">
        ¿Dudas sobre una pieza, tu pedido o un regalo especial? Escríbenos, nos
        encanta acompañarte de cerca.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div className="space-y-4">
          <a
            href="https://instagram.com/valcheck.ve"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-2xl border-2 border-primary bg-card p-5 transition-colors hover:bg-brand-yellow/50"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-brand-yellow">
              <Instagram className="size-5 text-brand-brown" />
            </span>
            <div>
              <p className="font-semibold">Instagram</p>
              <p className="text-sm text-muted-foreground">@valcheck.ve</p>
            </div>
          </a>
          <a
            href="https://wa.me/584120000000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 rounded-2xl border-2 border-primary bg-card p-5 transition-colors hover:bg-brand-yellow/50"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-brand-yellow">
              <MessageCircle className="size-5 text-brand-brown" />
            </span>
            <div>
              <p className="font-semibold">WhatsApp</p>
              <p className="text-sm text-muted-foreground">+58 412 000 0000</p>
            </div>
          </a>
          <div className="flex items-center gap-4 rounded-2xl border-2 border-primary bg-card p-5">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand-yellow">
              <Mail className="size-5 text-brand-brown" />
            </span>
            <div>
              <p className="font-semibold">Correo</p>
              <p className="text-sm text-muted-foreground">hola@valcheck.ve</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border-2 border-primary bg-card p-5">
            <span className="flex size-11 items-center justify-center rounded-full bg-brand-yellow">
              <MapPin className="size-5 text-brand-brown" />
            </span>
            <div>
              <p className="font-semibold">Ubicación</p>
              <p className="text-sm text-muted-foreground">Venezuela · Envíos nacionales</p>
            </div>
          </div>
        </div>

        <form
          className="rounded-[2rem] border-2 border-primary bg-card p-6 md:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            setEnviado(true);
            toast.success("¡Mensaje enviado! Te responderemos muy pronto.");
          }}
        >
          <h2 className="font-display text-2xl font-semibold">Envíanos un mensaje</h2>
          {enviado ? (
            <p className="mt-4 rounded-xl bg-brand-yellow/60 p-4 text-sm font-medium text-brand-brown">
              ¡Gracias por escribirnos! Te contactaremos muy pronto. ✓
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="nombre" className="text-sm font-semibold">Nombre</label>
                <input
                  id="nombre"
                  required
                  className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-semibold">Correo</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="tu@correo.com"
                />
              </div>
              <div>
                <label htmlFor="mensaje" className="text-sm font-semibold">Mensaje</label>
                <textarea
                  id="mensaje"
                  required
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Cuéntanos en qué podemos ayudarte"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.01]"
              >
                Enviar mensaje
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
