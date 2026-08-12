import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { conversationsQuery, formatBRL } from "@/lib/market-api";

export const Route = createFileRoute("/mensagens/")({
  head: () => ({
    meta: [
      { title: "Mensagens — teiyaa" },
      { name: "description", content: "Suas conversas com compradores e vendedores do bairro." },
      { property: "og:title", content: "Mensagens — teiyaa" },
      { property: "og:description", content: "Converse com vizinhos sobre os itens do mercado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MensagensPage,
});

function MensagensPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: conversations = [], isLoading } = useQuery(conversationsQuery(user?.id));

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-8 md:py-14">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Mensagens</h1>
        <p className="mt-2 text-muted-foreground">Conversas sobre itens do mercado.</p>

        {isLoading || loading ? (
          <p className="py-16 text-center text-muted-foreground">Carregando…</p>
        ) : conversations.length === 0 ? (
          <div className="mt-8 text-center py-16 bg-card border border-dashed border-border rounded-3xl">
            <div className="text-4xl mb-3">💬</div>
            <h2 className="font-bold text-lg mb-2">Sem conversas ainda</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Encontre um item no mercado e fale com o vendedor.
            </p>
            <Link
              to="/mercado"
              className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
            >
              Ir ao mercado
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  to="/mensagens/$conversationId"
                  params={{ conversationId: c.id }}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-brand/50 transition-colors"
                >
                  <div className="size-14 rounded-xl overflow-hidden bg-brand-soft flex items-center justify-center shrink-0">
                    {c.item?.images?.[0] ? (
                      <img src={c.item.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">{c.item?.title ?? "Item removido"}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      com {c.other?.display_name ?? "Vizinho"}
                    </p>
                  </div>
                  <span className="text-sm font-bold shrink-0">
                    {formatBRL(c.item?.price_cents ?? null)}
                  </span>
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
