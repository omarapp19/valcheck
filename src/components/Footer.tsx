import { Link } from "@tanstack/react-router";
import { Check, Instagram, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useDepartment } from "@/lib/department";
import { useAdminStore } from "@/lib/admin-store";

export function Footer() {
  const { abrirCarrito } = useCart();
  const { department } = useDepartment();
  const { ajustesPago } = useAdminStore();
  const esMaquillaje = department === "maquillaje";

  const instagramUrl = ajustesPago?.contacto?.instagramUrl || "https://instagram.com/valcheck.ve";
  const instagramHandle = ajustesPago?.contacto?.instagram || "@valcheck.ve";
  const whatsappNum = ajustesPago?.whatsapp?.numero || "584120000000";

  return (
    <footer className="mt-20 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-brand-yellow">
              <Check className="size-4 text-brand-brown" strokeWidth={3.5} />
            </span>
            <span className="font-display text-xl font-semibold">Val✓Check</span>
          </div>
          <p className="mt-3 text-sm opacity-80">
            {esMaquillaje
              ? "Belleza Verificada. Cosméticos y maquillaje que celebran tu autenticidad y tu confianza."
              : "Belleza Verificada. Accesorios que celebran tu autenticidad y tu valor."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-4 py-2 text-sm font-semibold text-brand-brown transition-transform hover:scale-105"
            >
              <Instagram className="size-4" /> {instagramHandle}
            </a>
            <a
              href={`https://wa.me/${whatsappNum}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </div>
        </div>
        <div>
          <h3 className="font-display text-lg not-italic font-semibold">Explora</h3>
          <ul className="mt-3 space-y-2 text-sm opacity-90">
            <li><Link to="/tienda" className="hover:underline">Tienda</Link></li>
            <li><Link to="/nosotros" className="hover:underline">Nosotros</Link></li>
            <li><Link to="/contacto" className="hover:underline">Contacto</Link></li>
            <li>
              <button
                type="button"
                onClick={abrirCarrito}
                className="hover:underline cursor-pointer text-left"
              >
                Carrito
              </button>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg not-italic font-semibold">Nuestra promesa</h3>
          <p className="mt-3 text-sm opacity-80">
            "La confianza es tu mejor accesorio." Cada pieza es seleccionada con
            criterio y respaldada por nuestro compromiso de calidad.
          </p>
        </div>
      </div>
      <div className="border-t border-white/15 py-4 text-center text-xs opacity-70">
        © 2026 ValCheck — Belleza Verificada
      </div>
    </footer>
  );
}
