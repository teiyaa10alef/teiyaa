import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Users, Eye } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { formatSalary, JOB_STATUS_LABELS, myJobsQuery, timeAgo } from "@/lib/jobs-api";

export const Route = createFileRoute("/conta/vagas/")({
  head: () => ({
    meta: [
      { title: "Minhas vagas — teiyaa" },
      {
        name: "description",
        content: "Gerencie as vagas de emprego que você publicou e veja as candidaturas.",
      },
      { property: "og:title", content: "Minhas vagas — teiyaa" },
      { property: "og:description", content: "Painel das vagas publicadas no teiyaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MinhasVagasPage,
});

function MinhasVagasPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: jobs = [], isLoading } = useQuery(myJobsQuery(user?.id));

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Minhas vagas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Vagas de emprego que você publicou.
            </p>
          </div>
          <Link
            to="/vagas/novo"
            className="px-4 py-2.5 rounded-full bg-brand text-primary-foreground font-bold text-sm whitespace-nowrap"
          >
            + Nova vaga
          </Link>
        </div>

        {isLoading || loading ? (
          <p className="py-16 text-center text-muted-foreground">Carregando…</p>
        ) : jobs.length === 0 ? (
          <div className="mt-8 text-center py-16 bg-card border border-dashed border-border rounded-3xl">
            <Briefcase className="size-10 mx-auto text-cat-vaga" />
            <h2 className="font-bold text-lg mt-3 mb-2">Nenhuma vaga publicada</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Publique uma vaga e contrate gente do próprio bairro.
            </p>
            <Link
              to="/vagas/novo"
              className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
            >
              Publicar vaga
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link
                  to="/conta/vagas/$jobId"
                  params={{ jobId: j.id }}
                  className="block p-4 rounded-2xl border border-border bg-card hover:border-brand/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{j.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatSalary(j)} · publicada {timeAgo(j.created_at)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border whitespace-nowrap">
                      {JOB_STATUS_LABELS[j.status]}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" /> {j.applications_count} candidatos
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" /> {j.view_count} visualizações
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
