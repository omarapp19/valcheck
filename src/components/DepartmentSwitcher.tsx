import { Sparkles, Palette } from "lucide-react";
import { useDepartment } from "@/lib/department";
import { useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export function DepartmentSwitcher() {
  const { department, setDepartment, isMaquillaje } = useDepartment();
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const switchDept = (newDept: "accesorios" | "maquillaje") => {
    setDepartment(newDept);
    if (pathname === "/accesorios" && newDept === "maquillaje") {
      navigate({ to: "/maquillaje" });
    } else if (pathname === "/maquillaje" && newDept === "accesorios") {
      navigate({ to: "/accesorios" });
    }
  };

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Contenedor del switch con efecto expansivo al pasar el mouse */}
      <div
        className={`flex items-center rounded-full border border-border p-0.5 sm:p-1 shadow-xs transition-all duration-300 ease-out ${
          isMaquillaje
            ? "bg-card border-brand-yellow/30 text-foreground"
            : "bg-card/90 border-border text-foreground"
        }`}
      >
        {/* Opción 1: Accesorios */}
        <button
          type="button"
          onClick={() => switchDept("accesorios")}
          className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold transition-all duration-300 cursor-pointer ${
            !isMaquillaje
              ? "bg-primary text-primary-foreground shadow-xs scale-[1.02]"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Ir a sección de Accesorios"
          title="Ver colección de Joyería y Accesorios"
        >
          <Sparkles className="size-3 sm:size-3.5 shrink-0" />
          <span
            className={`transition-all duration-300 whitespace-nowrap text-[11px] sm:text-xs ${
              !isMaquillaje || isHovered ? "inline-block" : "hidden sm:inline-block"
            }`}
          >
            Accesorios
          </span>
        </button>

        {/* Separador sutil si no está expandido */}
        <span className="h-3 w-px bg-border/60 mx-0.5" />

        {/* Opción 2: Maquillaje */}
        <button
          type="button"
          onClick={() => switchDept("maquillaje")}
          className={`flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold transition-all duration-300 cursor-pointer ${
            isMaquillaje
              ? "bg-brand-yellow text-brand-brown font-bold shadow-xs scale-[1.02]"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Ir a sección de Maquillaje"
          title="Ver colección de Maquillaje y Cosméticos"
        >
          <Palette className="size-3 sm:size-3.5 shrink-0" />
          <span
            className={`transition-all duration-300 whitespace-nowrap text-[11px] sm:text-xs ${
              isMaquillaje || isHovered ? "inline-block" : "hidden sm:inline-block"
            }`}
          >
            Maquillaje
          </span>
        </button>
      </div>
    </div>
  );
}
