import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { communitiesQuery } from "@/lib/listings-api";
import { getStoredCommunitySlug } from "@/lib/community";
import {
  createJob,
  JOB_AREAS,
  JOB_BENEFITS,
  JOB_CONTRACT_LABELS,
  JOB_WORK_MODE_LABELS,
  type JobContractType,
  type JobWorkMode,
} from "@/lib/jobs-api";

export const Route = createFileRoute("/vagas/novo")({
  head: () => ({
    meta: [
      { title: "Publicar uma vaga de emprego — teiyaa" },
      {
        name: "description",
        content:
          "Contrate gente do seu bairro: publique uma vaga de emprego real e receba candidaturas pelo teiyaa.",
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

const STEPS = ["A vaga", "Contrato", "Salário", "Requisitos", "Contato"];

function NovaVagaPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: communities = [] } = useQuery(communitiesQuery);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [area, setArea] = useState("outros");
  const [description, setDescription] = useState("");
  const [contract, setContract] = useState<JobContractType>("clt");
  const [workMode, setWorkMode] = useState<JobWorkMode>("presencial");
  const [communityId, setCommunityId] = useState("");
  const [addressHint, setAddressHint] = useState("");
  const [salary, setSalary] = useState("");
  const [salaryPeriod, setSalaryPeriod] = useState("month");
  const [negotiable, setNegotiable] = useState(false);
  const [requirementText, setRequirementText] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);
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

  const canAdvance = () => {
    if (step === 0) return title.trim().length > 2 && description.trim().length > 10;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const cents =
        negotiable || !salary ? null : Math.round(Number(salary.replace(",", ".")) * 100);
      const job = await createJob(user.id, {
        title: title.trim(),
        description: description.trim(),
        area,
        company_name: company.trim() || null,
        contract_type: contract,
        work_mode: workMode,
        salary_cents: Number.isFinite(cents as number) ? cents : null,
        salary_period: salaryPeriod,
        is_salary_negotiable: negotiable,
        requirements: requirementText
          .split("\n")
          .map((r) => r.trim())
          .filter(Boolean),
        benefits,
        address_hint: addressHint.trim() || null,
        contact_whatsapp: whatsapp.trim() || null,
        contact_phone: phone.trim() || null,
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
              <Field label="Título da vaga">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={80}
                  placeholder="Ex.: Atendente de padaria"
                  className="input"
                />
              </Field>
              <Field label="Empresa / comércio (opcional)">
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  maxLength={60}
                  placeholder="Ex.: Padaria Bom Dia"
                  className="input"
                />
              </Field>
              <Field label="Área">
                <div className="flex flex-wrap gap-2">
                  {JOB_AREAS.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setArea(a.value)}
                      className={`px-3 py-1.5 rounded-full border text-sm font-semibold ${
                        area === a.value
                          ? "bg-cat-vaga text-primary-foreground border-cat-vaga"
                          : "bg-card border-border"
                      }`}
                    >
                      {a.emoji} {a.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Descrição da vaga">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="Conte o que a pessoa vai fazer, horário de trabalho e o que é importante."
                  className="input"
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="Tipo de contrato">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(JOB_CONTRACT_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setContract(value as JobContractType)}
                      className={`px-3 py-1.5 rounded-full border text-sm font-semibold ${
                        contract === value
                          ? "bg-cat-vaga text-primary-foreground border-cat-vaga"
                          : "bg-card border-border"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Modelo de trabalho">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(JOB_WORK_MODE_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setWorkMode(value as JobWorkMode)}
                      className={`px-3 py-1.5 rounded-full border text-sm font-semibold ${
                        workMode === value
                          ? "bg-cat-vaga text-primary-foreground border-cat-vaga"
                          : "bg-card border-border"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
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

          {step === 2 && (
            <>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                />
                Salário a combinar
              </label>
              {!negotiable && (
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
                    <select
                      value={salaryPeriod}
                      onChange={(e) => setSalaryPeriod(e.target.value)}
                      className="input"
                    >
                      <option value="month">Mês</option>
                      <option value="day">Dia</option>
                      <option value="hour">Hora</option>
                    </select>
                  </Field>
                </div>
              )}
              <Field label="Benefícios">
                <div className="flex flex-wrap gap-2">
                  {JOB_BENEFITS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBenefit(b)}
                      className={`px-3 py-1.5 rounded-full border text-sm font-semibold ${
                        benefits.includes(b)
                          ? "bg-cat-vaga text-primary-foreground border-cat-vaga"
                          : "bg-card border-border"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {step === 3 && (
            <Field label="Requisitos (um por linha)">
              <textarea
                value={requirementText}
                onChange={(e) => setRequirementText(e.target.value)}
                rows={6}
                maxLength={1000}
                placeholder={"Ensino médio completo\nExperiência com atendimento\nMorar na região"}
                className="input"
              />
            </Field>
          )}

          {step === 4 && (
            <>
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
              <p className="text-xs text-muted-foreground">
                Mesmo sem contato, os candidatos podem se candidatar pelo site e você conversa com
                quem pré-selecionar.
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1.5">{label}</span>
      {children}
    </label>
  );
}
