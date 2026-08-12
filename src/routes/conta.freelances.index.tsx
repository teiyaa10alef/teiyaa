import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users, Flame } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import {
  formatBudget,
  formatGigDate,
  GIG_STATUS_LABELS,
  myGigsQuery,
  timeAgo,
} from "@/lib/gigs-api";

export const Route = createFileRoute("/conta/freelances/")({
  head: () => ({
    meta: [
      { title: "Meus bicos — teiyaa" },
      {
        name: "description",
        content: "Gerencie os freelances que você publicou e escolha entre os candidatos.",
      },
      { property: "og:title", content: "Meus bicos — teiyaa" },
      { property: "og:description", content: "Painel dos seus freelances no teiyaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeusBicosPage,
});

function MeusBicosPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: gigs = [], isLoading } = useQuery(myGigsQuery(user?.id));

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Meus bicos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe as candidaturas e escolha quem vai te ajudar.
            </p>
          </div>
          <Link
            to="/freelances/novo"
            className="px-4 py-2.5 rounded-full bg-brand text-primary-foreground font-bold text-sm shadow-brand inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="size-4" /> Novo
          </Link>
        </div>

        {isLoading || loading ? (
          <p className="py-16 text-center text-muted-foreground">Carregando…</p>
        ) : gigs.length === 0 ? (
          <div className="mt-8 text-center py-16 bg-card border border-dashed border-border rounded-3xl">
            <Flame className="size-10 mx-auto text-cat-freelance" />
            <h2 className="font-bold text-lg mt-3 mb-2">Você ainda não publicou bicos</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Precisa de uma mãozinha? Publique e vizinhos do bairro se candidatam.
            </p>
            <Link
              to="/freelances/novo"
              className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
            >
              Publicar um bico
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {gigs.map((g) => (
              <li key={g.id}>
                <Link
                  to="/conta/freelances/$gigId"
                  params={{ gigId: g.id }}
                  className="block p-4 rounded-2xl border border-border bg-card hover:border-brand/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{g.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatGigDate(g)} · {formatBudget(g)} · {timeAgo(g.created_at)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border whitespace-nowrap">
                      {GIG_STATUS_LABELS[g.status]}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-cat-freelance inline-flex items-center gap-1.5">
                    <Users className="size-4" />
                    {g.applications_count}{" "}
                    {g.applications_count === 1 ? "candidatura" : "candidaturas"}
                  </p>
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
