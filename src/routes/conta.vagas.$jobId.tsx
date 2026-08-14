import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Eye, MessageCircle, Users, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/use-auth";
import {
  deleteJob,
  formatSalary,
  jobApplicationsQuery,
  jobQuery,
  JOB_APPLICATION_STATUS_LABELS,
  JOB_STATUS_LABELS,
  setJobApplicationStatus,
  startJobConversation,
  timeAgo,
  updateJob,
  type JobApplicationStatus,
  type JobStatus,
} from "@/lib/jobs-api";

export const Route = createFileRoute("/conta/vagas/$jobId")({
  head: () => ({
    meta: [
      { title: "Gerenciar vaga — teiyaa" },
      { name: "description", content: "Veja e responda às candidaturas da sua vaga de emprego." },
      { property: "og:title", content: "Gerenciar vaga — teiyaa" },
      { property: "og:description", content: "Painel de candidaturas da vaga." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GerenciarVagaPage,
});

const ACTIONS: { status: JobApplicationStatus; label: string }[] = [
  { status: "shortlisted", label: "Pré-selecionar" },
  { status: "accepted", label: "Escolher" },
  { status: "rejected", label: "Recusar" },
];

function GerenciarVagaPage() {
  const { jobId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: job } = useQuery(jobQuery(jobId));
  const isOwner = !!user && !!job && job.owner_id === user.id;
  const { data: apps = [] } = useQuery(jobApplicationsQuery(jobId, isOwner));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const changeStatus = async (id: string, status: JobApplicationStatus) => {
    setBusy(true);
    try {
      await setJobApplicationStatus(id, status);
      qc.invalidateQueries({ queryKey: ["job-applications", jobId] });
      toast.success("Candidatura atualizada");
    } catch {
      toast.error("Não consegui atualizar");
    } finally {
      setBusy(false);
    }
  };

  const changeJobStatus = async (status: JobStatus) => {
    setBusy(true);
    try {
      await updateJob(jobId, { status });
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["my-jobs"] });
      toast.success("Vaga atualizada");
    } catch {
      toast.error("Não consegui atualizar a vaga");
    } finally {
      setBusy(false);
    }
  };

  const removeJob = async () => {
    if (!confirm("Excluir esta vaga? As candidaturas serão removidas.")) return;
    setBusy(true);
    try {
      await deleteJob(jobId);
      toast.success("Vaga excluída");
      navigate({ to: "/conta/vagas" });
    } catch {
      toast.error("Não consegui excluir");
    } finally {
      setBusy(false);
    }
  };

  const openChat = async (applicantId: string, applicationId: string) => {
    if (!user || !job) return;
    setBusy(true);
    try {
      const id = await startJobConversation({
        jobId,
        ownerId: job.owner_id,
        applicantId,
        applicationId,
      });
      navigate({ to: "/mensagens/vaga/$conversationId", params: { conversationId: id } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">
          Carregando…
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-16 text-center">
          <p className="text-lg font-bold">Esta vaga não é sua</p>
          <Link
            to="/vagas/$jobId"
            params={{ jobId }}
            className="inline-flex mt-6 px-5 py-2.5 rounded-full bg-brand text-primary-foreground font-bold text-sm"
          >
            Ver a vaga
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-6 md:py-10">
        <Link
          to="/conta/vagas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" /> Minhas vagas
        </Link>

        <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">{job.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatSalary(job)} · {JOB_STATUS_LABELS[job.status]}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat icon={<Users className="size-4" />} label="Candidaturas" value={apps.length} />
          <Stat icon={<Eye className="size-4" />} label="Visualizações" value={job.view_count} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["open", "paused", "closed"] as JobStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy || job.status === s}
              onClick={() => changeJobStatus(s)}
              className={`px-4 py-2 rounded-full border text-sm font-semibold ${
                job.status === s
                  ? "bg-cat-vaga text-primary-foreground border-cat-vaga"
                  : "bg-card border-border"
              }`}
            >
              {JOB_STATUS_LABELS[s]}
            </button>
          ))}
          <button
            type="button"
            onClick={removeJob}
            disabled={busy}
            className="px-4 py-2 rounded-full border border-border text-sm font-semibold text-destructive inline-flex items-center gap-1.5"
          >
            <Trash2 className="size-4" /> Excluir
          </button>
        </div>

        <h2 className="mt-8 font-bold text-lg">Candidaturas</h2>
        {apps.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Ainda ninguém se candidatou. Compartilhe a vaga com os vizinhos.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {apps.map((a) => (
              <li key={a.id} className="p-4 rounded-2xl border border-border bg-card">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={a.profile?.avatar_url ?? null}
                    name={a.profile?.display_name ?? "Vizinho"}
                    className="size-10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">{a.profile?.display_name ?? "Vizinho"}</p>
                    <p className="text-xs text-muted-foreground">
                      {JOB_APPLICATION_STATUS_LABELS[a.status]} · {timeAgo(a.created_at)}
                    </p>
                  </div>
                </div>
                {a.message && <p className="mt-3 text-sm whitespace-pre-line">{a.message}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {ACTIONS.map((act) => (
                    <button
                      key={act.status}
                      type="button"
                      disabled={busy || a.status === act.status}
                      onClick={() => changeStatus(a.id, act.status)}
                      className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold ${
                        a.status === act.status
                          ? "bg-cat-vaga text-primary-foreground border-cat-vaga"
                          : "bg-surface border-border"
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openChat(a.applicant_id, a.id)}
                    className="px-3.5 py-1.5 rounded-full bg-brand text-primary-foreground text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <MessageCircle className="size-3.5" /> Conversar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="p-4 rounded-2xl border border-border bg-card">
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-semibold">
        {icon} {label}
      </span>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
