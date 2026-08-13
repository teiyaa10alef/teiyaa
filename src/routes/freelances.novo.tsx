import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { uploadMedia } from "@/lib/upload";
import { communitiesQuery } from "@/lib/listings-api";
import { getStoredCommunitySlug } from "@/lib/community";
import {
  createGig,
  GIG_CATEGORIES,
  GIG_REQUIREMENTS,
  type GigBudgetType,
} from "@/lib/gigs-api";

export const Route = createFileRoute("/freelances/novo")({
  head: () => ({
    meta: [
      { title: "Publicar um bico — teiyaa" },
      {
        name: "description",
        content:
          "Precisa de ajuda rápida no bairro? Publique o bico, diga quanto paga e receba candidatos vizinhos.",
      },
      { property: "og:title", content: "Publicar um bico — teiyaa" },
      {
        property: "og:description",
        content: "Publique um freelance e escolha quem vai te ajudar no seu bairro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NovoBicoPage,
});

const STEPS = ["O que precisa", "Quando", "Onde", "Quanto paga", "Requisitos"];

function NovoBicoPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: communities = [] } = useQuery(communitiesQuery);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("outros");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [communityId, setCommunityId] = useState("");
  const [addressHint, setAddressHint] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetType, setBudgetType] = useState<GigBudgetType>("fixed");
  const [negotiable, setNegotiable] = useState(true);
  const [requirements, setRequirements] = useState<string[]>([]);
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

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 4)) {
        urls.push(await uploadMedia(file, user.id, "gigs"));
      }
      setImages((prev) => [...prev, ...urls].slice(0, 4));
    } catch {
      toast.error("Não consegui enviar as fotos");
    } finally {
      setUploading(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return title.trim().length > 2 && description.trim().length > 5;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const cents =
        budgetType === "negotiable" || !budget
          ? null
          : Math.round(Number(budget.replace(",", ".")) * 100);
      const gig = await createGig(user.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        images,
        budget_cents: Number.isFinite(cents as number) ? cents : null,
        budget_type: budgetType,
        is_negotiable: negotiable,
        scheduled_date: date || null,
        scheduled_time: time || null,
        duration_hours: duration ? Number(duration.replace(",", ".")) : null,
        address_hint: addressHint.trim() || null,
        is_urgent: urgent,
        requirements,
        community_id: communityId || null,
      });
      toast.success("Bico publicado! Agora é só esperar as candidaturas.");
      navigate({ to: "/conta/freelances/$gigId", params: { gigId: gig.id } });
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

  const inputClass =
    "w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-brand outline-none";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Publicar um bico</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Passo {step + 1} de {STEPS.length} — {STEPS[step]}
        </p>

        <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-cat-freelance transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="mt-6 space-y-5">
          {step === 0 && (
            <>
              <Field label="Título do bico">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={90}
                  placeholder="Ex.: Levar geladeira velha até o ecoponto"
                  className={inputClass}
                />
              </Field>
              <Field label="Categoria">
                <div className="flex flex-wrap gap-2">
                  {GIG_CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`px-3.5 py-2 rounded-full border text-sm font-semibold ${
                        category === c.value
                          ? "bg-cat-freelance text-primary-foreground border-cat-freelance"
                          : "bg-card border-border"
                      }`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Descrição">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  maxLength={1200}
                  placeholder="Explique o que precisa ser feito, o tamanho do serviço e o que você já tem em casa."
                  className="w-full p-4 rounded-xl bg-card border border-border focus:border-brand outline-none"
                />
              </Field>
              <Field label="Fotos (opcional)">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  className="text-sm"
                />
                {uploading && <p className="text-xs text-muted-foreground mt-1">Enviando…</p>}
                {images.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {images.map((url) => (
                      <div key={url} className="relative aspect-square rounded-xl overflow-hidden">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          aria-label="Remover foto"
                          onClick={() => setImages((p) => p.filter((u) => u !== url))}
                          className="absolute top-1 right-1 size-6 rounded-full bg-background/90 flex items-center justify-center"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Data">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Horário">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Duração estimada (horas)">
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  inputMode="decimal"
                  placeholder="Ex.: 2"
                  className={inputClass}
                />
              </Field>
              <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="size-4"
                />
                <span className="text-sm font-semibold">
                  🔥 É urgente — preciso o quanto antes
                </span>
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Comunidade / bairro">
                <select
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value)}
                  className={inputClass}
                >
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ponto de referência (sem endereço exato)">
                <input
                  value={addressHint}
                  onChange={(e) => setAddressHint(e.target.value)}
                  maxLength={120}
                  placeholder="Ex.: perto da praça do Grotão"
                  className={inputClass}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O endereço completo você combina no chat, só com quem escolher.
                </p>
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="Tipo de pagamento">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["fixed", "Valor fechado"],
                      ["hourly", "Por hora"],
                      ["negotiable", "A combinar"],
                    ] as [GigBudgetType, string][]
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setBudgetType(value)}
                      className={`px-4 py-2 rounded-full border text-sm font-semibold ${
                        budgetType === value
                          ? "bg-cat-freelance text-primary-foreground border-cat-freelance"
                          : "bg-card border-border"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
              {budgetType !== "negotiable" && (
                <Field label={budgetType === "hourly" ? "Valor por hora (R$)" : "Valor total (R$)"}>
                  <input
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    inputMode="decimal"
                    placeholder="Ex.: 80"
                    className={inputClass}
                  />
                </Field>
              )}
              <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
                <input
                  type="checkbox"
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                  className="size-4"
                />
                <span className="text-sm font-semibold">
                  Aceito receber propostas de outro valor
                </span>
              </label>
              <p className="text-xs text-muted-foreground">
                O pagamento é combinado direto entre vocês — o teiyaa não cobra nada.
              </p>
            </>
          )}

          {step === 4 && (
            <>
              <Field label="Requisitos (opcional)">
                <div className="flex flex-wrap gap-2">
                  {GIG_REQUIREMENTS.map((r) => {
                    const active = requirements.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() =>
                          setRequirements((prev) =>
                            active ? prev.filter((x) => x !== r) : [...prev, r],
                          )
                        }
                        className={`px-3.5 py-2 rounded-full border text-sm font-semibold ${
                          active
                            ? "bg-cat-freelance text-primary-foreground border-cat-freelance"
                            : "bg-card border-border"
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </Field>
              <div className="p-4 rounded-2xl border border-border bg-surface text-sm space-y-1">
                <p className="font-bold">{title || "Sem título"}</p>
                <p className="text-muted-foreground">{description || "Sem descrição"}</p>
                <p className="text-cat-freelance font-bold">
                  {budgetType === "negotiable" || !budget
                    ? "A combinar"
                    : `R$ ${budget}${budgetType === "hourly" ? "/hora" : ""}`}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-5 py-3 rounded-full border border-border font-semibold text-sm disabled:opacity-40 inline-flex items-center gap-2"
          >
            <ArrowLeft className="size-4" /> Voltar
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => canAdvance() ? setStep((s) => s + 1) : toast.error("Preencha o título e a descrição")}
              className="px-6 py-3 rounded-full bg-brand text-primary-foreground font-bold shadow-brand inline-flex items-center gap-2"
            >
              Continuar <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-3 rounded-full bg-brand text-primary-foreground font-bold shadow-brand inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Check className="size-4" /> {saving ? "Publicando…" : "Publicar bico"}
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
    <div>
      <label className="block text-sm font-semibold mb-2">{label}</label>
      {children}
    </div>
  );
}
