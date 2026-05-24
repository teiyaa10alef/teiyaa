import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/anunciar")({
  head: () => ({
    meta: [
      { title: "Anunciar no teiyaa" },
      {
        name: "description",
        content: "Publique seu comércio, serviço, imóvel, freela ou vaga no teiyaa.",
      },
    ],
  }),
  component: AnunciarPage,
});

function AnunciarPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto px-4 md:px-6 py-12 md:py-20 text-center">
        <span className="inline-block px-3 py-1 bg-brand-soft text-brand text-xs font-bold uppercase tracking-widest rounded-full">
          Em construção
        </span>
        <h1 className="mt-5 text-3xl md:text-5xl font-bold leading-tight">
          Anunciar no teiyaa
        </h1>
        <p className="mt-5 text-base md:text-lg text-muted-foreground">
          Logo logo você vai poder cadastrar seu comércio, serviço, imóvel, freela
          ou vaga e aparecer no feed do bairro. Estamos preparando o cadastro com
          login seguro.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
        >
          Voltar ao início
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
