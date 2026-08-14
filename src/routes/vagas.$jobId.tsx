import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Check,
  Clock,
  CalendarDays,
  FileText,
  GraduationCap,
  MessageCircle,
  Eye,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { myCandidateProfileQuery, uploadResume, upsertCandidateProfile } from "@/lib/candidate-api";
import {
  applyToJob,
  canJobApplicantChat,
  formatJobDate,
  formatSalary,
  formatShift,
  isJobExpired,
  jobAreaEmoji,
  jobAreaLabel,
  jobQuery,
  JOB_APPLICATION_STATUS_LABELS,
  JOB_CONTRACT_LABELS,
  JOB_EDUCATION_LABELS,
  JOB_EXPERIENCE_LABELS,
  JOB_WORK_MODE_LABELS,
  myApplicationForJobQuery,
  startJobConversation,
  timeAgo,
  trackJobView,
  withdrawJobApplication,
  type ScreeningAnswer,
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
  const { data: candidate } = useQuery(myCandidateProfileQuery(user?.id));
  const [message, setMessage] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [uploadingCv, setUploadingCv] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    trackJobView(jobId);
  }, [jobId]);

  const isOwner = !!user && !!job && job.owner_id === user.id;
  const expired = !!job && isJobExpired(job);
  const questions = useMemo(() => job?.screening_questions ?? [], [job]);

  const uploadCv = async (file: File) => {
    if (!user) return;
    setUploadingCv(true);
    try {
      const { path, name } = await uploadResume(file, user.id);
      await upsertCandidateProfile(user.id, {
        cv_path: path,
        cv_name: name,
        cv_updated_at: new Date().toISOString(),
      });
      qc.invalidateQueries({ queryKey: ["candidate-profile"] });
      toast.success("Currículo enviado");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploadingCv(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!job) return;
    if (job.requires_cv && !candidate?.cv_path) {
      toast.error("Esta vaga exige currículo em PDF. Envie o seu antes de se candidatar.");
      return;
    }
    if (job.requires_cover_letter && coverLetter.trim().length < 20) {
      toast.error("Escreva uma carta de apresentação (mínimo 20 caracteres).");
      return;
    }
    const missing = questions.find((q) => !(answers[q.id] ?? "").trim());
    if (missing) {
      toast.error("Responda todas as perguntas da empresa.");
      return;
    }
    setBusy(true);
    try {
      const payloadAnswers: ScreeningAnswer[] = questions.map((q) => ({
        id: q.id,
        question: q.question,
        answer: (answers[q.id] ?? "").trim(),
      }));
      await applyToJob({
        jobId,
        applicantId: user.id,
        message: message.trim(),
        coverLetter: coverLetter.trim() || null,
        cvPath: candidate?.cv_path ?? null,
        answers: payloadAnswers,
      });
      toast.success("Candidatura enviada!");
      setMessage("");
      setCoverLetter("");
      setAnswers({});
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
          {job.is_pcd && (
            <span className="px-2 py-0.5 rounded-full border border-cat-vaga/25 bg-cat-vaga-soft text-cat-vaga font-semibold">
              Vaga para PcD
            </span>
          )}
          {(job.status !== "open" || expired) && (
            <span className="px-2 py-0.5 rounded-full border border-border text-muted-foreground font-semibold">
              Vaga encerrada
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">{job.title}</h1>
        {job.company_name && (
          <div className="mt-2 flex items-center gap-2">
            {job.company_logo_url && (
              <img
                src={job.company_logo_url}
                alt={`Logo de ${job.company_name}`}
                className="size-10 rounded-xl object-cover border border-border"
                loading="lazy"
              />
            )}
            <p className="font-semibold text-muted-foreground inline-flex items-center gap-1.5">
              <Briefcase className="size-4" /> {job.company_name}
            </p>
          </div>
        )}
        <p className="mt-3 text-2xl font-bold text-cat-vaga">{formatSalary(job)}</p>
        {job.has_commission && (
          <p className="text-xs font-semibold text-muted-foreground">+ comissão</p>
        )}


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

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Info
            icon={<Clock className="size-4" />}
            label="Jornada"
            value={
              [job.schedule, job.weekly_hours ? `${job.weekly_hours}h/semana` : null]
                .filter(Boolean)
                .join(" · ") || "A combinar"
            }
          />
          <Info
            icon={<Clock className="size-4" />}
            label="Horário"
            value={formatShift(job) ?? "A combinar"}
          />
          <Info
            icon={<Briefcase className="size-4" />}
            label="Experiência"
            value={JOB_EXPERIENCE_LABELS[job.experience_level]}
          />
          <Info
            icon={<GraduationCap className="size-4" />}
            label="Escolaridade"
            value={JOB_EDUCATION_LABELS[job.education_level]}
          />
          <Info
            icon={<Users className="size-4" />}
            label="Vagas"
            value={String(job.openings ?? 1)}
          />
          <Info
            icon={<CalendarDays className="size-4" />}
            label="Início"
            value={formatJobDate(job.starts_on) ?? "A combinar"}
          />
        </div>
        {job.expires_on && (
          <p className="mt-2 text-xs text-muted-foreground">
            Candidaturas até {formatJobDate(job.expires_on)}
          </p>
        )}

        <section className="mt-6">
          <h2 className="font-bold text-lg">Sobre a vaga</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{job.description}</p>
        </section>

        {job.company_about && (
          <section className="mt-6">
            <h2 className="font-bold text-lg">Sobre a empresa</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{job.company_about}</p>
            {job.company_site && (
              <p className="mt-1 text-sm font-semibold text-cat-vaga break-all">
                {job.company_site}
              </p>
            )}
          </section>
        )}


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
          ) : job.status !== "open" || expired ? (
            <p className="text-sm text-muted-foreground">
              Esta vaga não está mais recebendo candidaturas.
            </p>
          ) : (
            <div className="space-y-3">
              <h2 className="font-bold">Candidatar-se</h2>

              <div className="p-3 rounded-xl border border-border bg-surface">
                <p className="text-sm font-semibold inline-flex items-center gap-2">
                  <FileText className="size-4 text-cat-vaga" /> Currículo em PDF
                  {job.requires_cv && <span className="text-destructive">obrigatório</span>}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {candidate?.cv_path
                    ? `Vamos enviar: ${candidate.cv_name ?? "seu currículo"}`
                    : "Você ainda não tem currículo salvo."}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border text-xs font-semibold cursor-pointer">
                    {uploadingCv ? "Enviando…" : candidate?.cv_path ? "Trocar PDF" : "Enviar PDF"}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) uploadCv(f);
                      }}
                    />
                  </label>
                  <Link
                    to="/conta/candidato"
                    className="text-xs font-bold text-cat-vaga underline"
                  >
                    Completar meu currículo
                  </Link>
                </div>
              </div>

              <label className="block">
                <span className="block text-sm font-semibold mb-1.5">
                  Mensagem para o anunciante
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={800}
                  placeholder="Conte rapidamente sua experiência e disponibilidade."
                  className="input"
                />
              </label>

              {job.requires_cover_letter && (
                <label className="block">
                  <span className="block text-sm font-semibold mb-1.5">
                    Carta de apresentação <span className="text-destructive">*</span>
                  </span>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={5}
                    maxLength={1500}
                    placeholder="Por que você é a pessoa certa para esta vaga?"
                    className="input"
                  />
                </label>
              )}

              {questions.map((q) => (
                <label key={q.id} className="block">
                  <span className="block text-sm font-semibold mb-1.5">{q.question}</span>
                  <input
                    value={answers[q.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    maxLength={300}
                    className="input"
                  />
                </label>
              ))}

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
