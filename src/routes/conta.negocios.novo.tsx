import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Upload, Store } from "lucide-react";
import {
  createBusiness,
  slugify,
  upsertBusinessHour,
  updateBusiness,
  WEEKDAYS,
  type BusinessHour,
} from "@/lib/account-api";
import { BUSINESS_CATEGORIES } from "@/lib/business-api";
import { communitiesQuery } from "@/lib/listings-api";
import { uploadMedia } from "@/lib/upload";

export const Route = createFileRoute("/conta/negocios/novo")({
  head: () => ({
    meta: [
      { title: "Cadastrar meu comércio — teiyaa" },
      {
        name: "description",
        content: "Cadastre seu comércio no teiyaa em poucos passos e apareça no feed do seu bairro.",
      },
      { property: "og:title", content: "Cadastrar meu comércio — teiyaa" },
      {
        property: "og:description",
        content: "Nome, horários, contato e fotos: seu negócio visível para toda a comunidade.",
      },
    ],
  }),
  component: NovoNegocio,
});

type HourDraft = Pick<BusinessHour, "weekday" | "opens_at" | "closes_at" | "is_closed">;

const DEFAULT_HOURS: HourDraft[] = Array.from({ length: 7 }, (_, w) => ({
  weekday: w,
  opens_at: w === 0 ? null : "09:00",
  closes_at: w === 0 ? null : "18:00",
  is_closed: w === 0,
}));

const STEPS = ["Identidade", "Contato", "Visual", "Horários", "Publicar"];

function NovoNegocio() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: communities = [] } = useQuery(communitiesQuery);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    community_id: "",
    description: "",
    whatsapp: "",
    phone: "",
    instagram: "",
    address: "",
    logo_url: "",
    cover_url: "",
  });
  const [hours, setHours] = useState<HourDraft[]>(DEFAULT_HOURS);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const canAdvance = () => {
    if (step === 0) return form.name.trim().length >= 2 && !!form.category && !!form.community_id;
    if (step === 1) return form.whatsapp.replace(/\D/g, "").length >= 10;
    return true;
  };

  const handleUpload = async (file: File, kind: "logo" | "cover") => {
    setUploading(kind);
    try {
      const url = await uploadMedia(file, user.id, `business-${kind}`);
      set(kind === "logo" ? { logo_url: url } : { cover_url: url });
    } catch (err) {
      toast.error("Erro no upload: " + (err as Error).message);
    } finally {
      setUploading(null);
    }
  };

  const publish = async () => {
    setSaving(true);
    try {
      const slug = `${slugify(form.name)}-${Math.random().toString(36).slice(2, 6)}`;
      const biz = await createBusiness(user.id, {
        name: form.name.trim(),
        slug,
        category: form.category,
        community_id: form.community_id,
        description: form.description.trim() || null,
        whatsapp: form.whatsapp.replace(/\D/g, "") || null,
        phone: form.phone.trim() || null,
        instagram: form.instagram.trim().replace("@", "") || null,
        address: form.address.trim() || null,
        logo_url: form.logo_url || null,
        cover_url: form.cover_url || null,
      });
      await Promise.all(
        hours.map((h) =>
          upsertBusinessHour({
            business_id: biz.id,
            weekday: h.weekday,
            opens_at: h.is_closed ? null : h.opens_at,
            closes_at: h.is_closed ? null : h.closes_at,
            is_closed: h.is_closed,
          }),
        ),
      );
      await updateBusiness(biz.id, { is_published: true });
      toast.success("Comércio publicado! Já está no feed do bairro.");
      navigate({ to: "/conta/negocios/$businessId", params: { businessId: biz.id } });
    } catch (err) {
      toast.error("Erro: " + (err as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <Link
          to="/conta/negocios"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Meus negócios
        </Link>
        <h1 className="mt-3 text-2xl md:text-3xl font-bold">Cadastrar comércio</h1>

        <div className="mt-5 flex items-center gap-1.5">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${i <= step ? "bg-brand" : "bg-muted"}`}
                aria-hidden
              />
              <p className={`mt-1.5 text-[10px] ${i === step ? "font-bold" : "text-muted-foreground"}`}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-5 md:p-6 rounded-2xl border border-border bg-surface space-y-5">
          {step === 0 && (
            <>
              <Field label="Nome do comércio *">
                <input
                  className={inputCls}
                  value={form.name}
                  maxLength={80}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="Ex.: Padaria da Dona Ana"
                />
              </Field>
              <Field label="Categoria *">
                <div className="grid grid-cols-2 gap-2">
                  {BUSINESS_CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set({ category: c.value })}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-semibold text-left ${
                        form.category === c.value
                          ? "bg-cat-comercio text-primary-foreground border-cat-comercio"
                          : "bg-background border-border"
                      }`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Bairro / comunidade *">
                <select
                  className={inputCls}
                  value={form.community_id}
                  onChange={(e) => set({ community_id: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Descrição">
                <textarea
                  className={inputCls}
                  rows={4}
                  maxLength={600}
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="O que você vende, diferenciais, formas de pagamento…"
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Field label="WhatsApp *">
                <input
                  className={inputCls}
                  value={form.whatsapp}
                  maxLength={20}
                  inputMode="tel"
                  onChange={(e) => set({ whatsapp: e.target.value })}
                  placeholder="11 91234-5678"
                />
              </Field>
              <Field label="Telefone fixo">
                <input
                  className={inputCls}
                  value={form.phone}
                  maxLength={20}
                  inputMode="tel"
                  onChange={(e) => set({ phone: e.target.value })}
                />
              </Field>
              <Field label="Instagram">
                <input
                  className={inputCls}
                  value={form.instagram}
                  maxLength={40}
                  onChange={(e) => set({ instagram: e.target.value })}
                  placeholder="@seunegocio"
                />
              </Field>
              <Field label="Endereço">
                <input
                  className={inputCls}
                  value={form.address}
                  maxLength={160}
                  onChange={(e) => set({ address: e.target.value })}
                  placeholder="Rua, número, referência"
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Logo">
                <UploadBox
                  url={form.logo_url}
                  busy={uploading === "logo"}
                  onFile={(f) => handleUpload(f, "logo")}
                  hint="Imagem quadrada fica melhor"
                />
              </Field>
              <Field label="Foto de capa">
                <UploadBox
                  url={form.cover_url}
                  busy={uploading === "cover"}
                  onFile={(f) => handleUpload(f, "cover")}
                  hint="Uma foto da fachada ou dos produtos"
                />
              </Field>
            </>
          )}

          {step === 3 && (
            <div className="space-y-2">
              {hours.map((h, i) => (
                <div key={h.weekday} className="flex items-center gap-2">
                  <span className="w-20 text-sm font-medium">{WEEKDAYS[h.weekday]}</span>
                  {h.is_closed ? (
                    <span className="flex-1 text-sm text-muted-foreground">Fechado</span>
                  ) : (
                    <>
                      <input
                        type="time"
                        aria-label={`Abre ${WEEKDAYS[h.weekday]}`}
                        value={h.opens_at ?? ""}
                        onChange={(e) =>
                          setHours((hs) =>
                            hs.map((x, j) => (j === i ? { ...x, opens_at: e.target.value } : x)),
                          )
                        }
                        className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm"
                      />
                      <span className="text-muted-foreground text-sm">–</span>
                      <input
                        type="time"
                        aria-label={`Fecha ${WEEKDAYS[h.weekday]}`}
                        value={h.closes_at ?? ""}
                        onChange={(e) =>
                          setHours((hs) =>
                            hs.map((x, j) => (j === i ? { ...x, closes_at: e.target.value } : x)),
                          )
                        }
                        className="px-2 py-1.5 rounded-lg border border-border bg-background text-sm"
                      />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setHours((hs) =>
                        hs.map((x, j) => (j === i ? { ...x, is_closed: !x.is_closed } : x)),
                      )
                    }
                    className="ml-auto text-xs font-semibold text-brand"
                  >
                    {h.is_closed ? "Abrir" : "Fechar"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-4">
              <div className="size-16 mx-auto rounded-2xl bg-brand-soft text-brand flex items-center justify-center">
                <Store className="size-8" />
              </div>
              <h2 className="mt-3 text-xl font-bold">{form.name || "Seu comércio"}</h2>
              <p className="text-sm text-muted-foreground">
                {BUSINESS_CATEGORIES.find((c) => c.value === form.category)?.label ?? "—"}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Ao publicar, seu comércio aparece na hora no feed do bairro. Depois você pode
                adicionar cardápio, galeria e promoções.
              </p>
              <button
                onClick={publish}
                disabled={saving}
                className="mt-5 w-full py-3 bg-brand text-primary-foreground rounded-full font-bold disabled:opacity-60"
              >
                {saving ? "Publicando…" : "Publicar comércio"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-5 py-2.5 rounded-full border border-border font-semibold text-sm disabled:opacity-40"
          >
            Voltar
          </button>
          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => canAdvance() ? setStep((s) => s + 1) : toast.error("Preencha os campos obrigatórios.")}
              className="inline-flex items-center gap-1 px-6 py-2.5 rounded-full bg-brand text-primary-foreground font-bold text-sm"
            >
              Continuar <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground/80">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function UploadBox({
  url,
  busy,
  onFile,
  hint,
}: {
  url: string;
  busy: boolean;
  onFile: (f: File) => void;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="size-20 rounded-xl bg-muted overflow-hidden flex-shrink-0">
        {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Upload className="size-5" />
          </div>
        )}
      </div>
      <div>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-semibold cursor-pointer">
          {busy ? "Enviando…" : url ? <><Check className="size-4" /> Trocar</> : "Escolher imagem"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </div>
    </div>
  );
}
