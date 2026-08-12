import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { APPLICATION_STATUS_LABELS, myApplicationsQuery, timeAgo } from "@/lib/gigs-api";

export const Route = createFileRoute("/conta/candidaturas")({
  head: () => ({
    meta: [
      { title: "Minhas candidaturas — teiyaa" },
      {
        name: "description",
        content: "Acompanhe os bicos em que você se candidatou e o status de cada um.",
      },
      { property: "og:title", content: "Minhas candidaturas — teiyaa" },
      { property: "og:description", content: "Status das suas candidaturas a freelances." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MinhasCandidaturasPage,
});

function MinhasCandidaturasPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: apps = [], isLoading } = useQuery(myApplicationsQuery(user?.id));

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Minhas candidaturas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Os bicos em que você se ofereceu para ajudar.
        </p>

        {isLoading || loading ? (
          <p className="py-16 text-center text-muted-foreground">Carregando…</p>
        ) : apps.length === 0 ? (
          <div className="mt-8 text-center py-16 bg-card border border-dashed border-border rounded-3xl">
            <Flame className="size-10 mx-auto text-cat-freelance" />
            <h2 className="font-bold text-lg mt-3 mb-2">Nenhuma candidatura ainda</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Veja os bicos do seu bairro e ganhe uma grana extra.
            </p>
            <Link
              to="/freelances"
              className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
            >
              Ver bicos
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {apps.map((a) => (
              <li key={a.id}>
                <Link
                  to="/freelances/$gigId"
                  params={{ gigId: a.gig_id }}
                  className="block p-4 rounded-2xl border border-border bg-card hover:border-brand/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{a.gig?.title ?? "Bico removido"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Enviada {timeAgo(a.created_at)}
                        {a.proposed_cents != null &&
                          ` · sua proposta ${(a.proposed_cents / 100).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}`}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap border ${
                        a.status === "accepted"
                          ? "bg-cat-freelance text-primary-foreground border-cat-freelance"
                          : "border-border"
                      }`}
                    >
                      {APPLICATION_STATUS_LABELS[a.status]}
                    </span>
                  </div>
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
