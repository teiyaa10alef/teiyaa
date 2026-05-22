import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/freelances")({
  head: () => ({
    meta: [
      { title: "Freelances rápidos no bairro — teiyaa" },
      {
        name: "description",
        content:
          "Solicite ajuda rápida de vizinhos ou se candidate a bicos pertinho de casa.",
      },
      { property: "og:title", content: "Freelances rápidos no bairro — teiyaa" },
      {
        property: "og:description",
        content: "Ajuda rápida entre vizinhos e renda extra perto de casa.",
      },
    ],
  }),
  component: () => (
    <CategoryPage
      eyebrow="Freelances"
      title="Bicos rápidos entre vizinhos."
      description="Precisa de ajuda agora? Publique um pedido. Quer ganhar uma grana extra? Candidate-se aos bicos da rua de trás."
      ctaLabel="Publicar um pedido"
      bullets={[
        "Carregar e descartar móveis",
        "Pequenas reformas e consertos",
        "Limpeza pontual",
        "Entregas e mudanças curtas",
        "Ajuda com eventos e festas",
        "Suporte com tecnologia",
      ]}
    />
  ),
});
