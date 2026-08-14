import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  FileText,
  MessageCircle,
  Users,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/hooks/use-auth";
import { availabilityLabel, candidateProfilesQuery } from "@/lib/candidate-api";
import { getResumeUrl } from "@/lib/resume.functions";
import {
  closeJob,
  deleteJob,
  formatSalary,
  jobApplicationsQuery,
  jobQuery,
  JOB_APPLICATION_STATUS_LABELS,
  JOB_STATUS_LABELS,
  markJobApplicationSeen,
  saveJobApplicationNotes,
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

const FILTERS: { value: JobApplicationStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "sent", label: "Novas" },
  { value: "shortlisted", label: "Pré-selecionadas" },
  { value: "accepted", label: "Escolhidas" },
  { value: "rejected", label: "Recusadas" },
];

function GerenciarVagaPage() {
  const { jobId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: job } = useQuery(jobQuery(jobId));
  const isOwner = !!user && !!job && job.owner_id === user.id;
  const { data: apps = [] } = useQuery(jobApplicationsQuery(jobId, isOwner));
  const { data: candidates = {} } = useQuery(
    candidateProfilesQuery(
      apps.map((a) => a.applicant_id),
      isOwner,
    ),
  );
  const fetchResumeUrl = useServerFn(getResumeUrl);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<JobApplicationStatus | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const filtered = useMemo(
    () => (filter === "all" ? apps : apps.filter((a) => a.status === filter)),
    [apps, filter],
  );

  const toggleOpen = async (id: string, status: JobApplicationStatus) => {
    const next = open === id ? null : id;
    setOpen(next);
    if (next && status === "sent") {
      await markJobApplicationSeen(id);
      qc.invalidateQueries({ queryKey: ["job-applications", jobId] });
    }
  };

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

  const saveNotes = async (id: string) => {
    try {
      await saveJobApplicationNotes(id, (notes[id] ?? "").trim());
      qc.invalidateQueries({ queryKey: ["job-applications", jobId] });
      toast.success("Anotação salva");
    } catch {
      toast.error("Não consegui salvar a anotação");
    }
  };

  const openResume = async (applicationId: string) => {
    try {
      const { url } = await fetchResumeUrl({ data: { applicationId } });
      window.open(url, "_blank", "noopener");
    } catch (err) {
      toast.error((err as Error).message);
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

  const finish = async (reason: "preenchida" | "cancelada") => {
    setBusy(true);
    try {
      await closeJob(jobId, reason);
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["my-jobs"] });
      toast.success(reason === "preenchida" ? "Vaga marcada como preenchida" : "Vaga cancelada");
    } catch {
      toast.error("Não consegui encerrar a vaga");
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
          {job.closed_reason ? ` (${job.closed_reason})` : ""}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat icon={<Users className="size-4" />} label="Candidaturas" value={apps.length} />
          <Stat
            icon={<Users className="size-4" />}
            label="Pré-selecionados"
            value={apps.filter((a) => a.status === "shortlisted").length}
          />
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
            onClick={() => finish("preenchida")}
            disabled={busy}
            className="px-4 py-2 rounded-full border border-border text-sm font-semibold"
          >
            Vaga preenchida
          </button>
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
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-full border text-sm font-semibold whitespace-nowrap ${
                filter === f.value
                  ? "bg-cat-vaga text-primary-foreground border-cat-vaga"
                  : "bg-card border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhuma candidatura por aqui. Compartilhe a vaga com os vizinhos.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {filtered.map((a) => {
              const cand = candidates[a.applicant_id];
              const expanded = open === a.id;
              return (
                <li key={a.id} className="p-4 rounded-2xl border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => toggleOpen(a.id, a.status)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <UserAvatar
                      src={a.profile?.avatar_url ?? null}
                      name={a.profile?.display_name ?? "Vizinho"}
                      className="size-10"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">
                        {a.profile?.display_name ?? "Vizinho"}
                        {a.status === "sent" && (
                          <span className="ml-2 text-[10px] uppercase font-bold text-cat-vaga">
                            novo
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {cand?.headline ? `${cand.headline} · ` : ""}
                        {JOB_APPLICATION_STATUS_LABELS[a.status]} · {timeAgo(a.created_at)}
                      </p>
                    </div>
                    <ChevronDown
                      className={`size-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  {expanded && (
                    <div className="mt-3 space-y-3 text-sm">
                      {a.message && <p className="whitespace-pre-line">{a.message}</p>}

                      {a.cover_letter && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground">
                            Carta de apresentação
                          </p>
                          <p className="mt-1 whitespace-pre-line">{a.cover_letter}</p>
                        </div>
                      )}

                      {a.answers.length > 0 && (
                        <div className="space-y-2">
                          {a.answers.map((ans) => (
                            <div key={ans.id}>
                              <p className="text-xs font-bold text-muted-foreground">
                                {ans.question}
                              </p>
                              <p>{ans.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {cand && (
                        <div className="p-3 rounded-xl bg-surface border border-border space-y-2">
                          <p className="text-xs font-bold text-muted-foreground">Perfil</p>
                          {cand.bio && <p className="whitespace-pre-line">{cand.bio}</p>}
                          <p className="text-xs text-muted-foreground">
                            {availabilityLabel(cand.availability)}
                            {cand.shifts?.length ? ` · ${cand.shifts.join(", ")}` : ""}
                            {cand.has_cnh ? " · CNH" : ""}
                            {cand.has_vehicle ? " · veículo próprio" : ""}
                          </p>
                          {cand.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {cand.skills.map((s) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 rounded-full border border-border text-xs font-semibold"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                          {cand.experiences?.length > 0 && (
                            <div className="space-y-1">
                              {cand.experiences.map((e, i) => (
                                <p key={i} className="text-xs">
                                  <strong>{e.role}</strong>
                                  {e.company ? ` — ${e.company}` : ""}
                                  {e.period ? ` (${e.period})` : ""}
                                </p>
                              ))}
                            </div>
                          )}
                          {cand.education?.length > 0 && (
                            <div className="space-y-1">
                              {cand.education.map((e, i) => (
                                <p key={i} className="text-xs">
                                  {e.course}
                                  {e.school ? ` — ${e.school}` : ""}
                                  {e.year ? ` (${e.year})` : ""}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <label className="block">
                        <span className="block text-xs font-bold text-muted-foreground mb-1">
                          Anotações (só você vê)
                        </span>
                        <textarea
                          value={notes[a.id] ?? a.owner_notes ?? ""}
                          onChange={(e) =>
                            setNotes((p) => ({ ...p, [a.id]: e.target.value }))
                          }
                          onBlur={() => saveNotes(a.id)}
                          rows={2}
                          maxLength={600}
                          className="input"
                        />
                      </label>
                    </div>
                  )}

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
                    {a.cv_path && (
                      <button
                        type="button"
                        onClick={() => openResume(a.id)}
                        className="px-3.5 py-1.5 rounded-full border border-border text-xs font-semibold inline-flex items-center gap-1.5"
                      >
                        <FileText className="size-3.5" /> Currículo
                      </button>
                    )}
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
              );
            })}
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
