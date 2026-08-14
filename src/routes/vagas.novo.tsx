import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Upload } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { communitiesQuery } from "@/lib/listings-api";
import { getStoredCommunitySlug } from "@/lib/community";
import { uploadMedia } from "@/lib/upload";
import {
  createJob,
  JOB_AREAS,
  JOB_BENEFITS,
  JOB_COMPANY_SIZES,
  JOB_CONTRACT_LABELS,
  JOB_EDUCATION_LABELS,
  JOB_EXPERIENCE_LABELS,
  JOB_SCHEDULES,
  JOB_WORK_MODE_LABELS,
  type JobContractType,
  type JobEducationLevel,
  type JobExperienceLevel,
  type JobWorkMode,
  type ScreeningQuestion,
} from "@/lib/jobs-api";

export const Route = createFileRoute("/vagas/novo")({
  head: () => ({
    meta: [
      { title: "Publicar uma vaga de emprego — teiyaa" },
      {
        name: "description",
        content:
          "Contrate gente do seu bairro: publique uma vaga completa com jornada, salário, benefícios e receba currículos pelo teiyaa.",
      },
      { property: "og:title", content: "Publicar uma vaga de emprego — teiyaa" },
      {
        property: "og:description",
        content: "Divulgue sua vaga para moradores da comunidade e receba candidatos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NovaVagaPage,
});

const STEPS = ["Empresa", "A função", "Jornada", "Remuneração", "Candidatura"];

const toCents = (v: string) => {
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
};

function NovaVagaPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: communities = [] } = useQuery(communitiesQuery);

  const [step, setStep] = useState(0);
  // Empresa
  const [company, setCompany] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companySize, setCompanySize] = useState("pequena");
  const [companySite, setCompanySite] = useState("");
  const [companyAbout, setCompanyAbout] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [addressHint, setAddressHint] = useState("");
  const [uploading, setUploading] = useState(false);
  // Função
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("outros");
  const [description, setDescription] = useState("");
  const [experience, setExperience] = useState<JobExperienceLevel>("sem_experiencia");
  const [education, setEducation] = useState<JobEducationLevel>("indiferente");
  const [openings, setOpenings] = useState("1");
  const [isPcd, setIsPcd] = useState(false);
  const [requirementText, setRequirementText] = useState("");
  // Jornada
  const [contract, setContract] = useState<JobContractType>("clt");
  const [workMode, setWorkMode] = useState<JobWorkMode>("presencial");
  const [weeklyHours, setWeeklyHours] = useState("44");
  const [schedule, setSchedule] = useState(JOB_SCHEDULES[0]!);
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [startsOn, setStartsOn] = useState("");
  // Remuneração
  const [salaryMode, setSalaryMode] = useState<"fixo" | "faixa" | "combinar">("fixo");
  const [salary, setSalary] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryPeriod, setSalaryPeriod] = useState("month");
  const [commission, setCommission] = useState(false);
  const [benefits, setBenefits] = useState<string[]>([]);
  // Candidatura
  const [requiresCv, setRequiresCv] = useState(false);
  const [requiresCover, setRequiresCover] = useState(false);
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [expiresOn, setExpiresOn] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (communityId || communities.length === 0) return;
    const stored = getStoredCommunitySlug();
    const match = communities.find((c) => c.slug === stored) ?? communities[0]!;
    setCommunityId(match.id);
  }, [communities, communityId]);

  const toggleBenefit = (b: string) =>
    setBenefits((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  const handleLogo = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const url = await uploadMedia(file, user.id, "job-logo");
      setCompanyLogo(url);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return company.trim().length > 1;
    if (step === 1) return title.trim().length > 2 && description.trim().length > 10;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const job = await createJob(user.id, {
        title: title.trim(),
        description: description.trim(),
        area,
        company_name: company.trim() || null,
        company_logo_url: companyLogo,
        company_size: companySize,
        company_site: companySite.trim() || null,
        company_about: companyAbout.trim() || null,
        contract_type: contract,
        work_mode: workMode,
        experience_level: experience,
        education_level: education,
        openings: Math.max(1, Math.min(50, Number(openings) || 1)),
        is_pcd: isPcd,
        weekly_hours: weeklyHours ? Math.min(80, Number(weeklyHours) || 0) || null : null,
        schedule,
        shift_start: shiftStart || null,
        shift_end: shiftEnd || null,
        starts_on: startsOn || null,
        salary_cents: salaryMode === "fixo" ? toCents(salary) : null,
        salary_min_cents: salaryMode === "faixa" ? toCents(salaryMin) : null,
        salary_max_cents: salaryMode === "faixa" ? toCents(salaryMax) : null,
        salary_period: salaryPeriod,
        is_salary_negotiable: salaryMode === "combinar",
        has_commission: commission,
        requirements: requirementText
          .split("\n")
          .map((r) => r.trim())
          .filter(Boolean),
        benefits,
        address_hint: addressHint.trim() || null,
        contact_whatsapp: whatsapp.trim() || null,
        contact_phone: phone.trim() || null,
        expires_on: expiresOn || null,
        requires_cv: requiresCv,
        requires_cover_letter: requiresCover,
        screening_questions: questions.filter((q) => q.question.trim()),
        community_id: communityId || null,
      });
      toast.success("Vaga publicada! Agora é só esperar as candidaturas.");
      navigate({ to: "/conta/vagas/$jobId", params: { jobId: job.id } });
    } catch (err) {
      toast.error("Erro ao publicar: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-6 py-6 md:py-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Publicar uma vaga</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Etapa {step + 1} de {STEPS.length} — {STEPS[step]}
        </p>
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-cat-vaga transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="mt-6 space-y-4">
          {step === 0 && (
            <>
              <Field label="Nome da empresa / comércio">
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  maxLength={60}
                  placeholder="Ex.: Padaria Bom Dia"
                  className="input"
                />
              </Field>
              <Field label="Logo da empresa (opcional)">
                <div className="flex items-center gap-3">
                  {companyLogo && (
                    <img
                      src={companyLogo}
                      alt="Logo da empresa"
                      className="size-14 rounded-xl object-cover border border-border"
                    />
                  )}
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-semibold cursor-pointer">
                    <Upload className="size-4" /> {uploading ? "Enviando…" : "Enviar imagem"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) handleLogo(f);
                      }}
                    />
                  </label>
                </div>
              </Field>
              <Field label="Porte">
                <div className="flex flex-wrap gap-2">
                  {JOB_COMPANY_SIZES.map((s) => (
                    <Pill
                      key={s.value}
                      active={companySize === s.value}
                      onClick={() => setCompanySize(s.value)}
                      label={s.label}
                    />
                  ))}
                </div>
              </Field>
              <Field label="Site ou Instagram (opcional)">
                <input
                  value={companySite}
                  onChange={(e) => setCompanySite(e.target.value)}
                  maxLength={120}
                  placeholder="@padariabomdia"
                  className="input"
                />
              </Field>
              <Field label="Sobre a empresa (opcional)">
                <textarea
                  value={companyAbout}
                  onChange={(e) => setCompanyAbout(e.target.value)}
                  rows={3}
                  maxLength={600}
                  placeholder="Conte em poucas linhas o que a empresa faz."
                  className="input"
                />
              </Field>
              <Field label="Bairro / comunidade">
                <select
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value)}
                  className="input"
                >
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Referência de local (opcional)">
                <input
                  value={addressHint}
                  onChange={(e) => setAddressHint(e.target.value)}
                  maxLength={120}
                  placeholder="Ex.: perto da praça central"
                  className="input"
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Título da vaga">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                  placeholder="Ex.: Atendente de padaria"
                  className="input"
                />
              </Field>
              <Field label="Área">
                <div className="flex flex-wrap gap-2">
                  {JOB_AREAS.map((a) => (
                    <Pill
                      key={a.value}
                      active={area === a.value}
                      onClick={() => setArea(a.value)}
                      label={`${a.emoji} ${a.label}`}
                    />
                  ))}
                </div>
              </Field>
              <Field label="Atividades da função">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="Conte o que a pessoa vai fazer no dia a dia."
                  className="input"
                />
              </Field>
              <Field label="Nível de experiência">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(JOB_EXPERIENCE_LABELS).map(([value, label]) => (
                    <Pill
                      key={value}
                      active={experience === value}
                      onClick={() => setExperience(value as JobExperienceLevel)}
                      label={label}
                    />
                  ))}
                </div>
              </Field>
              <Field label="Escolaridade mínima">
                <select
                  value={education}
                  onChange={(e) => setEducation(e.target.value as JobEducationLevel)}
                  className="input"
                >
                  {Object.entries(JOB_EDUCATION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3 items-end">
                <Field label="Número de vagas">
                  <input
                    value={openings}
                    onChange={(e) => setOpenings(e.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                    className="input"
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm font-semibold pb-3">
                  <input
                    type="checkbox"
                    checked={isPcd}
                    onChange={(e) => setIsPcd(e.target.checked)}
                  />
                  Vaga para PcD
                </label>
              </div>
              <Field label="Requisitos (um por linha)">
                <textarea
                  value={requirementText}
                  onChange={(e) => setRequirementText(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder={"Ensino médio completo\nExperiência com atendimento\nMorar na região"}
                  className="input"
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Tipo de contrato">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(JOB_CONTRACT_LABELS).map(([value, label]) => (
                    <Pill
                      key={value}
                      active={contract === value}
                      onClick={() => setContract(value as JobContractType)}
                      label={label}
                    />
                  ))}
                </div>
              </Field>
              <Field label="Modelo de trabalho">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(JOB_WORK_MODE_LABELS).map(([value, label]) => (
                    <Pill
                      key={value}
                      active={workMode === value}
                      onClick={() => setWorkMode(value as JobWorkMode)}
                      label={label}
                    />
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Carga horária semanal">
                  <input
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(e.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                    placeholder="44"
                    className="input"
                  />
                </Field>
                <Field label="Escala">
                  <select
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="input"
                  >
                    {JOB_SCHEDULES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Entrada">
                  <input
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Saída">
                  <input
                    type="time"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className="input"
                  />
                </Field>
              </div>
              <Field label="Início previsto (opcional)">
                <input
                  type="date"
                  value={startsOn}
                  onChange={(e) => setStartsOn(e.target.value)}
                  className="input"
                />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="Como é o salário?">
                <div className="flex flex-wrap gap-2">
                  <Pill
                    active={salaryMode === "fixo"}
                    onClick={() => setSalaryMode("fixo")}
                    label="Valor definido"
                  />
                  <Pill
                    active={salaryMode === "faixa"}
                    onClick={() => setSalaryMode("faixa")}
                    label="Faixa salarial"
                  />
                  <Pill
                    active={salaryMode === "combinar"}
                    onClick={() => setSalaryMode("combinar")}
                    label="A combinar"
                  />
                </div>
              </Field>
              {salaryMode === "fixo" && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Valor (R$)">
                    <input
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      inputMode="decimal"
                      placeholder="1800"
                      className="input"
                    />
                  </Field>
                  <Field label="Por">
                    <PeriodSelect value={salaryPeriod} onChange={setSalaryPeriod} />
                  </Field>
                </div>
              )}
              {salaryMode === "faixa" && (
                <div className="grid grid-cols-3 gap-3">
                  <Field label="De (R$)">
                    <input
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      inputMode="decimal"
                      placeholder="1600"
                      className="input"
                    />
                  </Field>
                  <Field label="Até (R$)">
                    <input
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      inputMode="decimal"
                      placeholder="2200"
                      className="input"
                    />
                  </Field>
                  <Field label="Por">
                    <PeriodSelect value={salaryPeriod} onChange={setSalaryPeriod} />
                  </Field>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={commission}
                  onChange={(e) => setCommission(e.target.checked)}
                />
                Tem comissão além do salário
              </label>
              <Field label="Benefícios">
                <div className="flex flex-wrap gap-2">
                  {JOB_BENEFITS.map((b) => (
                    <Pill
                      key={b}
                      active={benefits.includes(b)}
                      onClick={() => toggleBenefit(b)}
                      label={b}
                    />
                  ))}
                </div>
              </Field>
            </>
          )}

          {step === 4 && (
            <>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={requiresCv}
                    onChange={(e) => setRequiresCv(e.target.checked)}
                  />
                  Exigir currículo em PDF
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={requiresCover}
                    onChange={(e) => setRequiresCover(e.target.checked)}
                  />
                  Exigir carta de apresentação
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Perguntas de triagem (até 3)</span>
                  {questions.length < 3 && (
                    <button
                      type="button"
                      onClick={() =>
                        setQuestions((p) => [
                          ...p,
                          { id: Math.random().toString(36).slice(2, 8), question: "" },
                        ])
                      }
                      className="text-sm font-bold text-cat-vaga inline-flex items-center gap-1"
                    >
                      <Plus className="size-4" /> Adicionar
                    </button>
                  )}
                </div>
                <div className="mt-2 space-y-2">
                  {questions.map((q, i) => (
                    <div key={q.id} className="flex gap-2">
                      <input
                        value={q.question}
                        onChange={(e) =>
                          setQuestions((p) =>
                            p.map((x, idx) =>
                              idx === i ? { ...x, question: e.target.value } : x,
                            ),
                          )
                        }
                        maxLength={140}
                        placeholder="Ex.: Você tem experiência com caixa?"
                        className="input flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setQuestions((p) => p.filter((_, idx) => idx !== i))}
                        className="px-3 rounded-xl border border-border text-destructive"
                        aria-label="Remover pergunta"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Field label="Prazo final da vaga (opcional)">
                <input
                  type="date"
                  value={expiresOn}
                  onChange={(e) => setExpiresOn(e.target.value)}
                  className="input"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="WhatsApp (opcional)">
                  <input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    maxLength={20}
                    placeholder="11999999999"
                    className="input"
                  />
                </Field>
                <Field label="Telefone (opcional)">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={20}
                    placeholder="1133334444"
                    className="input"
                  />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                Você recebe as candidaturas no site, com currículo e respostas, e conversa por chat
                com quem pré-selecionar.
              </p>
            </>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2.5 rounded-full border border-border font-semibold text-sm inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            <ArrowLeft className="size-4" /> Voltar
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="px-6 py-2.5 rounded-full bg-brand text-primary-foreground font-bold text-sm inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              Continuar <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-brand text-primary-foreground font-bold text-sm inline-flex items-center gap-1.5 disabled:opacity-40"
            >
              <Check className="size-4" /> {saving ? "Publicando…" : "Publicar vaga"}
            </button>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function PeriodSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
      <option value="month">Mês</option>
      <option value="day">Dia</option>
      <option value="hour">Hora</option>
    </select>
  );
}

function Pill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full border text-sm font-semibold ${
        active ? "bg-cat-vaga text-primary-foreground border-cat-vaga" : "bg-card border-border"
      }`}
    >
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1.5">{label}</span>
      {children}
    </label>
  );
}
