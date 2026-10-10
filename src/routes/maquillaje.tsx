import { createFileRoute } from "@tanstack/react-router";
import { DepartmentHome } from "@/components/DepartmentHome";

export const Route = createFileRoute("/maquillaje")({
  head: () => ({
    meta: [
      { title: "ValCheck — Belleza Verificada | Maquillaje & Cosmética" },
      {
        name: "description",
        content:
          "Bases, labiales, sombras y cosméticos seleccionados con criterio. Tu belleza real, verificada. ValCheck — Belleza Verificada.",
      },
      { property: "og:title", content: "ValCheck — Maquillaje & Cosmética" },
      {
        property: "og:description",
        content: "Bases, labiales, sombras y cosméticos seleccionados para resaltar tu belleza única.",
      },
    ],
  }),
  component: MaquillajePage,
});

function MaquillajePage() {
  return <DepartmentHome departamento="maquillaje" />;
}
