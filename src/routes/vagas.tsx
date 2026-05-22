import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/vagas")({
  head: () => ({
    meta: [
      { title: "Vagas de emprego no bairro — teiyaa" },
      {
        name: "description",
        content:
          "Vagas reais em comércios e empresas da sua comunidade. Candidate-se direto pelo app.",
      },
      { property: "og:title", content: "Vagas de emprego no bairro — teiyaa" },
      {
        property: "og:description",
        content: "Empregos perto de casa, sem atravessar a cidade.",
      },
    ],
  }),
  component: () => (
    <CategoryPage
      eyebrow="Vagas"
      title="Empregos reais perto de casa."
      description="Trabalhe no bairro. Donos de comércio publicam vagas verdadeiras e você se candidata em um clique, sem currículo complicado."
      ctaLabel="Publicar uma vaga"
      bullets={[
        "Atendente e caixa",
        "Vendedor(a) de loja",
        "Ajudante geral",
        "Cozinheiro(a) e auxiliar",
        "Motoboy e entregador",
        "Vagas de meio período",
      ]}
    />
  ),
});
