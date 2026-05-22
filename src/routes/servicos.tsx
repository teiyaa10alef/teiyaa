import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Prestadores de serviço — teiyaa" },
      {
        name: "description",
        content:
          "Encontre pedreiros, pintores, eletricistas, encanadores e montadores próximos a você.",
      },
      { property: "og:title", content: "Prestadores de serviço — teiyaa" },
      {
        property: "og:description",
        content: "Profissionais do seu bairro, prontos para te atender.",
      },
    ],
  }),
  component: () => (
    <CategoryPage
      eyebrow="Serviços"
      title="Profissionais de confiança do seu bairro."
      description="Conserte, monte, instale ou reforme com prestadores que moram pertinho. Atendimento rápido, sem intermediários."
      ctaLabel="Oferecer meu serviço"
      bullets={[
        "Pedreiros e pintores",
        "Eletricistas e encanadores",
        "Montadores de móveis",
        "Marceneiros e serralheiros",
        "Diaristas e cuidadores",
        "Técnicos de informática",
      ]}
    />
  ),
});
