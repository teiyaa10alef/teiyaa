import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { Store, HardHat, ShoppingBag, Check, Clock, Star, Tag, Eye } from "lucide-react";

export const Route = createFileRoute("/anunciar")({
  head: () => ({
    meta: [
      { title: "Anuncie seu comércio no teiyaa" },
      {
        name: "description",
        content:
          "Cadastre grátis seu comércio, serviço profissional ou anúncio no teiyaa e apareça para os vizinhos do seu bairro.",
      },
      { property: "og:title", content: "Anuncie seu comércio no teiyaa" },
      {
        property: "og:description",
        content: "Horários, cardápio, promoções e avaliações: seu negócio na palma da mão do bairro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnunciarPage,
});

const BENEFITS = [
  { icon: Clock, title: "Horários sempre atualizados", text: "Os vizinhos veem na hora se você está aberto." },
  { icon: Tag, title: "Promoções em destaque", text: "Crie ofertas que aparecem no feed do bairro." },
  { icon: Star, title: "Avaliações reais", text: "Clientes avaliam e sua reputação atrai mais gente." },
  { icon: Eye, title: "Métricas simples", text: "Veja visualizações e cliques no WhatsApp." },
];

const STEPS = [
  "Crie sua conta gratuita",
  "Preencha nome, categoria e bairro",
  "Adicione contato, fotos e horários",
  "Publique — na hora aparece no feed",
];

function AnunciarPage() {
  const { user } = useAuth();
  const businessLink = user ? "/conta/negocios/novo" : "/login";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
          <span className="inline-block px-3 py-1 bg-brand-soft text-brand text-xs font-bold uppercase tracking-widest rounded-full">
            Grátis para o bairro
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">
            Coloque seu negócio no mapa da comunidade
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            Em poucos minutos seu comércio aparece para quem mora do lado — com horários,
            cardápio, promoções e contato direto no WhatsApp.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={businessLink}
              className="px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
            >
              Cadastrar meu comércio
            </Link>
            <Link to="/conta/profissional" className="px-6 py-3 rounded-full border border-border font-semibold">
              Sou profissional autônomo
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 md:px-6 pb-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="p-5 rounded-2xl border border-border bg-card">
                <span className="size-10 rounded-xl bg-cat-comercio-soft text-cat-comercio border border-cat-comercio/25 flex items-center justify-center">
                  <b.icon className="size-5" />
                </span>
                <h2 className="mt-3 font-bold">{b.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 md:px-6 py-12">
          <h2 className="text-2xl font-bold">Como funciona</h2>
          <ol className="mt-5 space-y-3">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface">
                <span className="size-7 rounded-full bg-brand text-primary-foreground font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="font-medium">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="max-w-5xl mx-auto px-4 md:px-6 pb-16">
          <h2 className="text-2xl font-bold mb-5">O que você quer anunciar?</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <OptionCard
              to={businessLink}
              icon={<Store className="size-6" />}
              title="Um comércio"
              text="Padaria, mercado, salão, loja, açougue, bar…"
            />
            <OptionCard
              to="/conta/profissional"
              icon={<HardHat className="size-6" />}
              title="Serviço profissional"
              text="Pedreiro, eletricista, pintor, montador, diarista…"
            />
            <OptionCard
              to="/mercado/novo"
              icon={<ShoppingBag className="size-6" />}
              title="Item no marketplace"
              text="Venda algo novo ou usado para os vizinhos."
            />
          </div>
          <ul className="mt-8 grid gap-2 sm:grid-cols-3 text-sm text-muted-foreground">
            {["Sem mensalidade", "Você edita quando quiser", "Contato direto, sem intermediário"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="size-4 text-cat-imovel" /> {t}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function OptionCard({
  to,
  icon,
  title,
  text,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      to={to}
      className="p-6 rounded-2xl border border-border bg-card hover:border-brand transition-colors flex flex-col gap-3"
    >
      <span className="size-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center">{icon}</span>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground">{text}</p>
    </Link>
  );
}
