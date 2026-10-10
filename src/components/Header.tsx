import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, User as UserIcon, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { DepartmentSwitcher } from "@/components/DepartmentSwitcher";

import { useDepartment } from "@/lib/department";

export function Header() {
  const { totalItems, abrirCarrito } = useCart();
  const { user, isLoggedIn, isAdmin } = useAuth();
  const { department } = useDepartment();
  const [open, setOpen] = useState(false);

  const homeUrl = department === "maquillaje" ? "/maquillaje" : "/accesorios";
  const links = [
    { to: homeUrl, label: "Inicio" },
    { to: "/tienda", label: "Tienda" },
    { to: "/nosotros", label: "Nosotros" },
    { to: "/contacto", label: "Contacto" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-4">
        <Link
          to={homeUrl}
          className="flex items-center gap-1.5 transition-transform hover:scale-[1.02] active:scale-[0.99] shrink-0"
          aria-label="ValCheck Inicio"
        >
          <img
            src={department === "maquillaje" ? "/logo-prin-maq.png" : "/logo-prin.png"}
            alt="ValCheck — Belleza Verificada"
            className="h-7 sm:h-9 md:h-10 max-w-[115px] sm:max-w-none w-auto object-contain transition-all duration-300"
            loading="eager"
            width={180}
            height={40}
          />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground underline underline-offset-8 decoration-brand-brown decoration-4" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Switch interactivo de Departamentos (Accesorios / Maquillaje) */}
          <DepartmentSwitcher />

          {/* Badge o botón Admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-1 rounded-full bg-brand-yellow px-3 py-1 text-xs font-bold text-brand-brown shadow-xs hover:scale-105 transition-transform"
            >
              <ShieldCheck className="size-3.5" />
              Panel Admin
            </Link>
          )}

          {/* Icono de Usuario / Mi Cuenta / Auth */}
          <Link
            to={isLoggedIn ? (isAdmin ? "/admin" : "/cuenta") : "/auth"}
            className="flex size-9 sm:size-10 items-center justify-center rounded-full transition-colors hover:bg-brand-yellow/60 text-foreground"
            title={isLoggedIn ? `Mi Cuenta (${user?.nombre})` : "Iniciar Sesión o Registrarse"}
            aria-label="Cuenta de usuario"
          >
            <UserIcon className="size-4.5 sm:size-5" />
          </Link>

          {/* Carrito */}
          <button
            type="button"
            onClick={abrirCarrito}
            className="relative flex size-9 sm:size-10 items-center justify-center rounded-full transition-colors hover:bg-brand-yellow/60 cursor-pointer"
            aria-label="Abrir carrito de compras"
          >
            <ShoppingBag className="size-4.5 sm:size-5" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4.5 sm:size-5 items-center justify-center rounded-full bg-primary text-[10px] sm:text-[11px] font-bold text-primary-foreground animate-in zoom-in-50 duration-200">
                {totalItems}
              </span>
            )}
          </button>

          {/* Menú móvil */}
          <button
            className="flex size-9 sm:size-10 items-center justify-center rounded-full hover:bg-brand-yellow/60 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menú"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-4 py-3 md:hidden space-y-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-yellow/50"
            >
              {l.label}
            </Link>
          ))}

          <div className="border-t border-border/60 pt-2 mt-2">
            {isAdmin ? (
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-bold text-brand-brown bg-brand-yellow/60"
              >
                Panel de Administración ({user?.nombre || "Admin"})
              </Link>
            ) : (
              <Link
                to={isLoggedIn ? "/cuenta" : "/auth"}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-bold text-primary hover:bg-brand-yellow/50"
              >
                {isLoggedIn ? `Mi Cuenta (${user?.nombre})` : "Iniciar Sesión / Registro"}
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
