import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, MapPin, Check, MessageCircle, Eye, Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import {
  applyToJob,
  canJobApplicantChat,
  formatSalary,
  jobAreaEmoji,
  jobAreaLabel,
  jobQuery,
  JOB_APPLICATION_STATUS_LABELS,
  JOB_CONTRACT_LABELS,
  JOB_WORK_MODE_LABELS,
  myApplicationForJobQuery,
  startJobConversation,
  timeAgo,
  trackJobView,
  withdrawJobApplication,
} from "@/lib/jobs-api";

export const Route = createFileRoute("/vagas/$jobId")({
  head: () => ({
    meta: [
      { title: "Vaga de emprego no bairro — teiyaa" },
      {
        name: "description",
        content: "Veja os detalhes da vaga e candidate-se direto pelo teiyaa.",
      },
      { property: "og:title", content: "Vaga de emprego no bairro — teiyaa" },
      { property: "og:description", content: "Vagas reais publicadas por negócios da comunidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VagaDetailPage,
});

function VagaDetailPage() {
  const { jobId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: job, isLoading } = useQuery(jobQuery(jobId));
  const { data: myApp } = useQuery(myApplicationForJobQuery(jobId, user?.id));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    trackJobView(jobId);
  }, [jobId]);

  const isOwner = !!user && !!job && job.owner_id === user.id;

  const handleApply = async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setBusy(true);
    try {
      await applyToJob({ jobId, applicantId: user.id, message: message.trim() });
      toast.success("Candidatura enviada!");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["job-application", jobId] });
      qc.invalidateQueries({ queryKey: ["job", jobId] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!myApp) return;
    setBusy(true);
    try {
      await withdrawJobApplication(myApp.id);
      qc.invalidateQueries({ queryKey: ["job-application", jobId] });
      toast.success("Candidatura retirada");
    } catch {
      toast.error("Não consegui retirar a candidatura");
    } finally {
      setBusy(false);
    }
  };

  const handleChat = async () => {
    if (!user || !job || !myApp) return;
    setBusy(true);
    try {
      const id = await startJobConversation({
        jobId,
        ownerId: job.owner_id,
        applicantId: user.id,
        applicationId: myApp.id,
        asApplicantStatus: myApp.status,
      });
      navigate({ to: "/mensagens/vaga/$conversationId", params: { conversationId: id } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
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

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-16 text-center">
          <p className="text-lg font-bold">Vaga não encontrada</p>
          <Link
            to="/vagas"
            className="inline-flex mt-6 px-5 py-2.5 rounded-full bg-brand text-primary-foreground font-bold text-sm"
          >
            Ver outras vagas
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
        <Link to="/vagas" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" /> Vagas
        </Link>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-cat-vaga-soft text-cat-vaga border border-cat-vaga/25 font-semibold">
            {jobAreaEmoji(job.area)} {jobAreaLabel(job.area)}
          </span>
          <span className="px-2 py-0.5 rounded-full border border-border text-muted-foreground font-semibold">
            {JOB_CONTRACT_LABELS[job.contract_type]}
          </span>
          <span className="px-2 py-0.5 rounded-full border border-border text-muted-foreground font-semibold">
            {JOB_WORK_MODE_LABELS[job.work_mode]}
          </span>
          {job.status !== "open" && (
            <span className="px-2 py-0.5 rounded-full border border-border text-muted-foreground font-semibold">
              Vaga encerrada
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">{job.title}</h1>
        {job.company_name && (
          <p className="mt-1 font-semibold text-muted-foreground inline-flex items-center gap-1.5">
            <Briefcase className="size-4" /> {job.company_name}
          </p>
        )}
        <p className="mt-3 text-2xl font-bold text-cat-vaga">{formatSalary(job)}</p>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {job.community?.name && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" /> {job.community.name}
              {job.address_hint ? ` · ${job.address_hint}` : ""}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" /> {job.applications_count} candidatos
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" /> {job.view_count} visualizações
          </span>
          <span>Publicada {timeAgo(job.created_at)}</span>
        </div>

        <section className="mt-6">
          <h2 className="font-bold text-lg">Sobre a vaga</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{job.description}</p>
        </section>

        {job.requirements.length > 0 && (
          <section className="mt-6">
            <h2 className="font-bold text-lg">Requisitos</h2>
            <ul className="mt-2 space-y-1.5">
              {job.requirements.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm">
                  <Check className="size-4 text-cat-vaga mt-0.5 shrink-0" /> {r}
                </li>
              ))}
            </ul>
          </section>
        )}

        {job.benefits.length > 0 && (
          <section className="mt-6">
            <h2 className="font-bold text-lg">Benefícios</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {job.benefits.map((b) => (
                <span
                  key={b}
                  className="px-3 py-1 rounded-full border border-border bg-card text-sm font-semibold"
                >
                  {b}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 p-4 rounded-2xl border border-border bg-card">
          {isOwner ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <p className="text-sm text-muted-foreground">Esta vaga é sua.</p>
              <Link
                to="/conta/vagas/$jobId"
                params={{ jobId: job.id }}
                className="px-5 py-2.5 rounded-full bg-brand text-primary-foreground font-bold text-sm text-center"
              >
                Ver candidaturas
              </Link>
            </div>
          ) : myApp && myApp.status !== "withdrawn" ? (
            <div className="space-y-3">
              <p className="text-sm">
                Sua candidatura está{" "}
                <strong>{JOB_APPLICATION_STATUS_LABELS[myApp.status].toLowerCase()}</strong>.
              </p>
              {canJobApplicantChat(myApp.status) ? (
                <button
                  type="button"
                  onClick={handleChat}
                  disabled={busy}
                  className="px-5 py-2.5 rounded-full bg-brand text-primary-foreground font-bold text-sm inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <MessageCircle className="size-4" /> Conversar com o anunciante
                </button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Você poderá conversar com o anunciante assim que for pré-selecionado ou escolhido.
                </p>
              )}
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={busy}
                className="block text-xs font-semibold text-muted-foreground underline"
              >
                Retirar candidatura
              </button>
            </div>
          ) : job.status !== "open" ? (
            <p className="text-sm text-muted-foreground">
              Esta vaga não está mais recebendo candidaturas.
            </p>
          ) : (
            <div className="space-y-3">
              <h2 className="font-bold">Candidatar-se</h2>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={800}
                placeholder="Conte rapidamente sua experiência e disponibilidade."
                className="input"
              />
              <button
                type="button"
                onClick={handleApply}
                disabled={busy}
                className="px-6 py-2.5 rounded-full bg-brand text-primary-foreground font-bold text-sm disabled:opacity-50"
              >
                {busy ? "Enviando…" : "Enviar candidatura"}
              </button>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
