import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Search, Store, Briefcase, Home, Truck, ShoppingBag } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { communitiesQuery } from "@/lib/listings-api";
import { getStoredCommunitySlug } from "@/lib/community";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(communitiesQuery),
  head: () => ({
    meta: [
      { title: "teiyaa — Descubra o que sua comunidade oferece" },
      { name: "description", content: "Encontre comércios, serviços, imóveis, vagas, freelances e itens à venda diretamente no seu bairro." },
      { property: "og:title", content: "teiyaa — Descubra o que sua comunidade oferece" },
      { property: "og:description", content: "Encontre comércios, serviços, imóveis, vagas, freelances e itens à venda diretamente no seu bairro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnboardingHome,
});

const categoryHighlights = [
  { icon: Store, label: "Comércios", desc: "Mercados, lanchonetes, barbearias..." },
  { icon: Search, label: "Profissionais", desc: "Pedreiros, pintores, eletricistas..." },
  { icon: Home, label: "Imóveis", desc: "Aluguel e venda perto de você" },
  { icon: Truck, label: "Freelances", desc: "Bicos rápidos na comunidade" },
  { icon: Briefcase, label: "Vagas", desc: "Empregos reais no bairro" },
  { icon: ShoppingBag, label: "Marketplace", desc: "Itens usados e novos entre moradores" },
];

function OnboardingHome() {
  const { data: communities } = useSuspenseQuery(communitiesQuery);
  const navigate = useNavigate();

  useEffect(() => {
    const slug = getStoredCommunitySlug();
    if (slug) {
      navigate({ to: "/c/$communitySlug", params: { communitySlug: slug }, replace: true });
    }
  }, [navigate]);

  const active = communities.filter((c) => c.is_active);
  const soon = communities.filter((c) => !c.is_active);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      <section className="bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-16 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-soft text-brand text-xs font-bold uppercase tracking-widest rounded-full">
            <MapPin className="size-3.5" /> tudo perto de você
          </span>
          <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
            Descubra o que sua comunidade oferece
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            No teiyaa você encontra comércios, serviços, imóveis, vagas e vendas
            diretamente no seu bairro. Selecione onde você mora para começar.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto w-full px-4 md:px-6 py-8 md:py-12 flex-1">
        <div className="mb-6 flex items-center gap-2">
          <div className="size-8 rounded-full bg-brand text-primary-foreground flex items-center justify-center text-sm font-bold">
            1
          </div>
          <h2 className="text-base md:text-lg font-bold">Selecione sua comunidade</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {active.map((c) => (
            <Link
              key={c.id}
              to="/c/$communitySlug"
              params={{ communitySlug: c.slug }}
              className="group relative bg-card p-4 md:p-5 rounded-2xl border border-border hover:border-brand transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-brand mb-1">
                    São Paulo • SP
                  </div>
                  <div className="text-lg md:text-xl font-bold truncate">{c.name}</div>
                  {c.description && (
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-1">
                      {c.description}
                    </p>
                  )}
                </div>
                <div className="size-9 rounded-full bg-brand-soft text-brand flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-primary-foreground transition-colors">
                  <MapPin className="size-4.5" />
                </div>
              </div>
              <div className="mt-3 text-xs font-bold text-brand inline-flex items-center gap-1">
                Ver anúncios desta comunidade <span aria-hidden="true">→</span>
              </div>
            </Link>
          ))}
        </div>

        {active.length === 1 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Ainda estamos apenas em {active[0].name}. Em breve mais comunidades.
          </p>
        )}

        {soon.length > 0 && (
          <>
            <h3 className="mt-8 mb-3 text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Em breve
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {soon.map((c) => (
                <div
                  key={c.id}
                  className="bg-muted p-3 rounded-xl border border-dashed border-border text-center opacity-70"
                >
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    Em breve
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-10 md:mt-12">
          <div className="mb-4 flex items-center gap-2">
            <div className="size-8 rounded-full bg-brand text-primary-foreground flex items-center justify-center text-sm font-bold">
              2
            </div>
            <h2 className="text-base md:text-lg font-bold">Explore por categoria</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categoryHighlights.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="bg-card p-3 md:p-4 rounded-xl border border-border flex items-start gap-3"
              >
                <div className="size-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold">{label}</div>
                  <div className="text-xs text-muted-foreground leading-snug">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 md:mt-12 bg-brand-soft/50 rounded-2xl p-4 md:p-6 border border-brand/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-8 rounded-full bg-brand text-primary-foreground flex items-center justify-center text-sm font-bold">
              3
            </div>
            <h2 className="text-base md:text-lg font-bold">Anuncie você também</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Crie sua conta gratuitamente para publicar comércios, serviços, imóveis,
            vagas, freelances e itens no mercado.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-brand text-primary-foreground rounded-full text-sm font-bold shadow-brand hover:bg-brand-dark transition-all"
          >
            Criar conta ou entrar
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
