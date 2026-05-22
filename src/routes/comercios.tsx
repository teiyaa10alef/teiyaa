import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/CategoryPage";

export const Route = createFileRoute("/comercios")({
  head: () => ({
    meta: [
      { title: "Comércios no seu bairro — teiyaa" },
      {
        name: "description",
        content:
          "Descubra mercados, açougues, padarias, barbearias e restaurantes da sua comunidade.",
      },
      { property: "og:title", content: "Comércios no seu bairro — teiyaa" },
      {
        property: "og:description",
        content: "Todo o comércio do bairro em um só lugar.",
      },
    ],
  }),
  component: () => (
    <CategoryPage
      eyebrow="Comércios"
      title="Todo o comércio do bairro, na palma da mão."
      description="Do mercadinho da esquina ao restaurante novo da quadra: encontre tudo o que abre, fecha e vende perto de você."
      ctaLabel="Cadastrar meu comércio"
      bullets={[
        "Mercados e mercearias",
        "Padarias e cafeterias",
        "Açougues e hortifrúti",
        "Restaurantes e lanchonetes",
        "Barbearias e salões",
        "Lojas de roupa e variedades",
      ]}
    />
  ),
});
