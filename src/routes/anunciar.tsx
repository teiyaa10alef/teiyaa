import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import {
  Store,
  HardHat,
  ShoppingBag,
  Home,
  Flame,
  Briefcase,
  Check,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/anunciar")({
  head: () => ({
    meta: [
      { title: "Anunciar no teiyaa — escolha o que publicar" },
      {
        name: "description",
        content:
          "Publique grátis no teiyaa: comércio, serviço profissional, imóvel, item usado, bico ou vaga de emprego do seu bairro.",
      },
      { property: "og:title", content: "Anunciar no teiyaa — escolha o que publicar" },
      {
        property: "og:description",
        content: "Comércio, profissional, imóvel, marketplace, bico ou vaga: escolha e publique.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnunciarPage,
});

function AnunciarPage() {
  const { user } = useAuth();
  const gate = (to: string) => (user ? to : "/login");

  const OPTIONS = [
    {
      to: gate("/conta/negocios/novo"),
      icon: Store,
      title: "Meu comércio",
      text: "Padaria, mercado, salão, loja, açougue, bar…",
      tone: "bg-cat-comercio-soft text-cat-comercio border-cat-comercio/25",
    },
    {
      to: gate("/conta/profissional"),
      icon: HardHat,
      title: "Serviço profissional",
      text: "Pedreiro, eletricista, pintor, montador, diarista…",
      tone: "bg-cat-profissional-soft text-cat-profissional border-cat-profissional/25",
    },
    {
      to: gate("/imoveis/novo"),
      icon: Home,
      title: "Imóvel",
      text: "Casa, quarto ou apartamento para alugar ou vender.",
      tone: "bg-cat-imovel-soft text-cat-imovel border-cat-imovel/25",
    },
    {
      to: gate("/mercado/novo"),
      icon: ShoppingBag,
      title: "Item no marketplace",
      text: "Venda algo novo ou usado para os vizinhos.",
      tone: "bg-cat-mercado-soft text-cat-mercado border-cat-mercado/25",
    },
    {
      to: gate("/freelances/novo"),
      icon: Flame,
      title: "Bico / freelance",
      text: "Precisa de ajuda rápida? Peça e receba candidatos.",
      tone: "bg-cat-freelance-soft text-cat-freelance border-cat-freelance/25",
    },
    {
      to: gate("/vagas/novo"),
      icon: Briefcase,
      title: "Vaga de emprego",
      text: "Contrate gente do bairro com carteira, PJ ou meio período.",
      tone: "bg-cat-vaga-soft text-cat-vaga border-cat-vaga/25",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-4 md:px-6 pt-10 pb-4 text-center">
          <span className="inline-block px-3 py-1 bg-brand-soft text-brand text-xs font-bold uppercase tracking-widest rounded-full">
            Grátis para o bairro
          </span>
          <h1 className="mt-4 text-2xl md:text-4xl font-bold leading-tight">
            O que você quer anunciar?
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Escolha o tipo de anúncio e a gente te leva direto para o formulário certo.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {OPTIONS.map((o) => (
              <Link
                key={o.title}
                to={o.to}
                className="p-4 rounded-2xl border border-border bg-card hover:border-brand transition-colors flex items-center gap-3"
              >
                <span
                  className={`size-11 shrink-0 rounded-xl border flex items-center justify-center ${o.tone}`}
                >
                  <o.icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{o.title}</span>
                  <span className="block text-sm text-muted-foreground">{o.text}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>

          {!user && (
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Você vai entrar na sua conta antes de publicar — é rapidinho.
            </p>
          )}

          <ul className="mt-8 grid gap-2 sm:grid-cols-3 text-sm text-muted-foreground">
            {["Sem mensalidade", "Você edita quando quiser", "Contato direto, sem intermediário"].map(
              (t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="size-4 text-cat-imovel" /> {t}
                </li>
              ),
            )}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
