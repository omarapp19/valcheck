import { Gem, Palette, ArrowLeftRight } from "lucide-react";
import { useDepartment } from "@/lib/department";
import { useNavigate, useRouterState } from "@tanstack/react-router";

export function DepartmentSwitcher() {
  const { setDepartment, isMaquillaje } = useDepartment();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleToggle = () => {
    const nextDept = isMaquillaje ? "accesorios" : "maquillaje";
    setDepartment(nextDept);
    if (pathname === "/accesorios" && nextDept === "maquillaje") {
      navigate({ to: "/maquillaje" });
    } else if (pathname === "/maquillaje" && nextDept === "accesorios") {
      navigate({ to: "/accesorios" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
        isMaquillaje
          ? "border-border/50 bg-background/50 hover:bg-card/90 text-foreground/80 hover:text-foreground hover:border-border"
          : "border-border/50 bg-background/50 hover:bg-card/90 text-foreground/80 hover:text-foreground hover:border-border"
      }`}
      aria-label={isMaquillaje ? "Cambiar a Accesorios" : "Cambiar a Maquillaje"}
      title={isMaquillaje ? "Cambiar a Joyería & Accesorios" : "Cambiar a Maquillaje"}
    >
      <ArrowLeftRight className="size-3 text-muted-foreground/70 transition-transform duration-300 group-hover:rotate-180 shrink-0" />

      <span className="flex items-center gap-1 whitespace-nowrap">
        {isMaquillaje ? (
          <>
            <Gem className="size-3 text-primary shrink-0" />
            <span>Accesorios</span>
          </>
        ) : (
          <>
            <Palette className="size-3 text-brand-yellow shrink-0" />
            <span>Maquillaje</span>
          </>
        )}
      </span>
    </button>
  );
}

