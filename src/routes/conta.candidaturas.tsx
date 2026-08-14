import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Briefcase } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { APPLICATION_STATUS_LABELS, myApplicationsQuery, timeAgo } from "@/lib/gigs-api";
import { JOB_APPLICATION_STATUS_LABELS, myJobApplicationsQuery } from "@/lib/jobs-api";

export const Route = createFileRoute("/conta/candidaturas")({
  head: () => ({
    meta: [
      { title: "Minhas candidaturas — teiyaa" },
      {
        name: "description",
        content:
          "Acompanhe os bicos e as vagas de emprego em que você se candidatou e o status de cada um.",
      },
      { property: "og:title", content: "Minhas candidaturas — teiyaa" },
      { property: "og:description", content: "Status das suas candidaturas a bicos e vagas." },
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
  const { data: jobApps = [], isLoading: loadingJobs } = useQuery(
    myJobApplicationsQuery(user?.id),
  );

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const busy = loading || isLoading || loadingJobs;
  const empty = apps.length === 0 && jobApps.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Minhas candidaturas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bicos e vagas de emprego em que você se candidatou.
        </p>

        {busy ? (
          <p className="py-16 text-center text-muted-foreground">Carregando…</p>
        ) : empty ? (
          <div className="mt-8 text-center py-16 bg-card border border-dashed border-border rounded-3xl">
            <Flame className="size-10 mx-auto text-cat-freelance" />
            <h2 className="font-bold text-lg mt-3 mb-2">Nenhuma candidatura ainda</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Veja os bicos e as vagas do seu bairro.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                to="/freelances"
                className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
              >
                Ver bicos
              </Link>
              <Link
                to="/vagas"
                className="inline-block px-6 py-3 border border-border rounded-full font-bold"
              >
                Ver vagas
              </Link>
            </div>
          </div>
        ) : (
          <>
            {jobApps.length > 0 && (
              <section className="mt-6">
                <h2 className="font-bold text-lg inline-flex items-center gap-2">
                  <Briefcase className="size-4 text-cat-vaga" /> Vagas de emprego
                </h2>
                <ul className="mt-3 space-y-3">
                  {jobApps.map((a) => (
                    <li key={a.id}>
                      <Link
                        to="/vagas/$jobId"
                        params={{ jobId: a.job_id }}
                        className="block p-4 rounded-2xl border border-border bg-card hover:border-brand/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold truncate">{a.job?.title ?? "Vaga removida"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {a.job?.company_name ? `${a.job.company_name} · ` : ""}
                              Enviada {timeAgo(a.created_at)}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap border ${
                              a.status === "accepted"
                                ? "bg-cat-vaga text-primary-foreground border-cat-vaga"
                                : "border-border"
                            }`}
                          >
                            {JOB_APPLICATION_STATUS_LABELS[a.status]}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {apps.length > 0 && (
              <section className="mt-8">
                <h2 className="font-bold text-lg inline-flex items-center gap-2">
                  <Flame className="size-4 text-cat-freelance" /> Bicos
                </h2>
                <ul className="mt-3 space-y-3">
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
              </section>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
