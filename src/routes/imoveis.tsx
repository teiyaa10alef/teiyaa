import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/imoveis")({
  head: () => ({
    meta: [
      { title: "Imóveis no seu bairro — teiyaa" },
      {
        name: "description",
        content:
          "Casas, kitnets e comércios para alugar ou comprar direto com o dono, na sua comunidade.",
      },
      { property: "og:title", content: "Imóveis no seu bairro — teiyaa" },
      {
        property: "og:description",
        content: "Aluguel e venda direto com vizinhos.",
      },
    ],
  }),
  component: () => (
    <CategoryPage
      eyebrow="Imóveis"
      title="Aluguel e venda direto com vizinhos."
      description="Casas, kitnets, sobrados e pontos comerciais perto de você. Sem corretor, sem fiador, sem complicação."
      ctaLabel="Anunciar meu imóvel"
      bullets={[
        "Casas e sobrados",
        "Kitnets e quartos",
        "Apartamentos",
        "Pontos comerciais",
        "Aluguel mensal",
        "Venda direto com o dono",
      ]}
    />
  ),
});
