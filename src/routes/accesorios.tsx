import { createFileRoute } from "@tanstack/react-router";
import { DepartmentHome } from "@/components/DepartmentHome";

export const Route = createFileRoute("/accesorios")({
  head: () => ({
    meta: [
      { title: "ValCheck — Belleza Verificada | Joyería & Accesorios" },
      {
        name: "description",
        content:
          "Pulseras, collares, aretes y anillos seleccionados con criterio. La confianza es tu mejor accesorio. ValCheck — Belleza Verificada.",
      },
      { property: "og:title", content: "ValCheck — Joyería & Accesorios" },
      {
        property: "og:description",
        content: "Pulseras, collares, aretes y anillos en acero inoxidable seleccionados con criterio.",
      },
    ],
  }),
  component: AccesoriosPage,
});

function AccesoriosPage() {
  return <DepartmentHome departamento="accesorios" />;
}
