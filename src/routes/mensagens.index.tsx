import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { conversationsQuery, formatBRL } from "@/lib/market-api";
import { formatBudget, gigConversationsQuery } from "@/lib/gigs-api";

export const Route = createFileRoute("/mensagens/")({
  head: () => ({
    meta: [
      { title: "Mensagens — teiyaa" },
      {
        name: "description",
        content: "Suas conversas sobre itens do mercado e bicos do bairro.",
      },
      { property: "og:title", content: "Mensagens — teiyaa" },
      { property: "og:description", content: "Converse com vizinhos sobre itens e freelances." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MensagensPage,
});

type Row = {
  key: string;
  to: "/mensagens/$conversationId" | "/mensagens/bico/$conversationId";
  id: string;
  title: string;
  subtitle: string;
  value: string;
  image: string | null;
  emoji: string;
  tag: string;
  sortAt: string;
};

function MensagensPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: marketConvos = [], isLoading: loadingMarket } = useQuery(
    conversationsQuery(user?.id),
  );
  const { data: gigConvos = [], isLoading: loadingGigs } = useQuery(
    gigConversationsQuery(user?.id),
  );

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const rows = useMemo<Row[]>(() => {
    const market: Row[] = marketConvos.map((c) => ({
      key: `m-${c.id}`,
      to: "/mensagens/$conversationId",
      id: c.id,
      title: c.item?.title ?? "Item removido",
      subtitle: `com ${c.other?.display_name ?? "Vizinho"}`,
      value: formatBRL(c.item?.price_cents ?? null),
      image: c.item?.images?.[0] ?? null,
      emoji: "📦",
      tag: "Mercado",
      sortAt: c.last_message_at,
    }));
    const gigs: Row[] = gigConvos.map((c) => ({
      key: `g-${c.id}`,
      to: "/mensagens/bico/$conversationId",
      id: c.id,
      title: c.gig?.title ?? "Bico removido",
      subtitle: `com ${c.other?.display_name ?? "Vizinho"}`,
      value: c.gig
        ? formatBudget({ budget_cents: c.gig.budget_cents, budget_type: c.gig.budget_type })
        : "",
      image: c.gig?.images?.[0] ?? null,
      emoji: "🔥",
      tag: "Bico",
      sortAt: c.last_message_at,
    }));
    return [...market, ...gigs].sort((a, b) => (a.sortAt < b.sortAt ? 1 : -1));
  }, [marketConvos, gigConvos]);

  const isLoading = loading || loadingMarket || loadingGigs;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-8 md:py-14">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Mensagens</h1>
        <p className="mt-2 text-muted-foreground">Conversas sobre itens do mercado e bicos.</p>

        {isLoading ? (
          <p className="py-16 text-center text-muted-foreground">Carregando…</p>
        ) : rows.length === 0 ? (
          <div className="mt-8 text-center py-16 bg-card border border-dashed border-border rounded-3xl">
            <div className="text-4xl mb-3">💬</div>
            <h2 className="font-bold text-lg mb-2">Sem conversas ainda</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Fale com um vendedor no mercado ou candidate-se a um bico do bairro.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                to="/mercado"
                className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
              >
                Ir ao mercado
              </Link>
              <Link
                to="/freelances"
                className="inline-block px-6 py-3 border border-border rounded-full font-bold"
              >
                Ver bicos
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {rows.map((r) => (
              <li key={r.key}>
                <Link
                  to={r.to}
                  params={{ conversationId: r.id }}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-brand/50 transition-colors"
                >
                  <div className="size-14 rounded-xl overflow-hidden bg-brand-soft flex items-center justify-center shrink-0">
                    {r.image ? (
                      <img src={r.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{r.emoji}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                        {r.tag}
                      </span>
                      <p className="font-bold truncate">{r.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{r.subtitle}</p>
                  </div>
                  <span className="text-sm font-bold shrink-0">{r.value}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

