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
  createProperty,
  KIND_LABELS,
  PROPERTY_KINDS,
  PURPOSE_LABELS,
  type PropertyKind,
  type PropertyPurpose,
} from "@/lib/properties-api";

export const Route = createFileRoute("/imoveis/novo")({
  head: () => ({
    meta: [
      { title: "Anunciar imóvel — teiyaa" },
      {
        name: "description",
        content: "Anuncie sua casa, apartamento, kitnet ou quarto para alugar ou vender no bairro.",
      },
      { property: "og:title", content: "Anunciar imóvel — teiyaa" },
      {
        property: "og:description",
        content: "Publique seu imóvel e fale direto com vizinhos interessados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NovoImovelPage,
});

const STEPS = ["O imóvel", "Detalhes", "Valores", "Fotos e contato"];

const money = (v: string) => {
  if (!v.trim()) return null;
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

function NovoImovelPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: communities = [] } = useQuery(communitiesQuery);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [purpose, setPurpose] = useState<PropertyPurpose>("aluguel");
  const [kind, setKind] = useState<PropertyKind>("casa");
  const [description, setDescription] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [addressHint, setAddressHint] = useState("");
  const [address, setAddress] = useState("");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [parking, setParking] = useState("0");
  const [area, setArea] = useState("");
  const [furnished, setFurnished] = useState(false);
  const [pets, setPets] = useState(false);
  const [price, setPrice] = useState("");
  const [condo, setCondo] = useState("");
  const [iptu, setIptu] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
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

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 8)) {
        urls.push(await uploadMedia(file, user.id, "properties"));
      }
      setImages((prev) => [...prev, ...urls].slice(0, 8));
    } catch {
      toast.error("Não consegui enviar as fotos");
    } finally {
      setUploading(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return title.trim().length > 3;
    return true;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const property = await createProperty(user.id, {
        title: title.trim(),
        description: description.trim(),
        purpose,
        kind,
        price_cents: money(price),
        condo_cents: money(condo),
        iptu_cents: money(iptu),
        bedrooms: Number(bedrooms) || 0,
        bathrooms: Number(bathrooms) || 0,
        parking_spots: Number(parking) || 0,
        area_m2: area ? Number(area) : null,
        is_furnished: furnished,
        accepts_pets: pets,
        address_hint: addressHint.trim() || null,
        address: address.trim() || null,
        images,
        whatsapp: whatsapp.trim() || null,
        phone: phone.trim() || null,
        community_id: communityId || null,
      });
      toast.success("Imóvel publicado!");
      navigate({ to: "/imoveis/$propertyId", params: { propertyId: property.id } });
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
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 md:px-6 py-6">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Anunciar imóvel</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Etapa {step + 1} de {STEPS.length} — {STEPS[step]}
        </p>
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-cat-imovel transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="mt-6 space-y-4">
          {step === 0 && (
            <>
              <Field label="Título do anúncio">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={90}
                  placeholder="Ex.: Casa de 2 quartos com quintal"
                  className={inputCls}
                />
              </Field>
              <Field label="Finalidade">
                <div className="flex gap-2">
                  {(Object.keys(PURPOSE_LABELS) as PropertyPurpose[]).map((p) => (
                    <Toggle key={p} active={purpose === p} onClick={() => setPurpose(p)}>
                      {PURPOSE_LABELS[p]}
                    </Toggle>
                  ))}
                </div>
              </Field>
              <Field label="Tipo de imóvel">
                <div className="flex gap-2 flex-wrap">
                  {PROPERTY_KINDS.map((k) => (
                    <Toggle key={k} active={kind === k} onClick={() => setKind(k)}>
                      {KIND_LABELS[k]}
                    </Toggle>
                  ))}
                </div>
              </Field>
              <Field label="Descrição">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={1500}
                  placeholder="Conte sobre o imóvel, o que está incluso, regras…"
                  className={inputCls}
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Quartos">
                  <input
                    type="number"
                    min={0}
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Banheiros">
                  <input
                    type="number"
                    min={0}
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Vagas de garagem">
                  <input
                    type="number"
                    min={0}
                    value={parking}
                    onChange={(e) => setParking(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Área (m²)">
                  <input
                    type="number"
                    min={0}
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="flex gap-2">
                <Toggle active={furnished} onClick={() => setFurnished((v) => !v)}>
                  Mobiliado
                </Toggle>
                <Toggle active={pets} onClick={() => setPets((v) => !v)}>
                  Aceita pet
                </Toggle>
              </div>
              <Field label="Bairro / comunidade">
                <select
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value)}
                  className={inputCls}
                >
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ponto de referência (público)">
                <input
                  value={addressHint}
                  onChange={(e) => setAddressHint(e.target.value)}
                  maxLength={120}
                  placeholder="Ex.: Perto da praça central"
                  className={inputCls}
                />
              </Field>
              <Field label="Endereço completo (opcional)">
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  maxLength={160}
                  className={inputCls}
                />
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label={purpose === "aluguel" ? "Aluguel mensal (R$)" : "Valor de venda (R$)"}>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  inputMode="decimal"
                  placeholder="Ex.: 1200"
                  className={inputCls}
                />
              </Field>
              <Field label="Condomínio (R$, opcional)">
                <input
                  value={condo}
                  onChange={(e) => setCondo(e.target.value)}
                  inputMode="decimal"
                  className={inputCls}
                />
              </Field>
              <Field label="IPTU (R$, opcional)">
                <input
                  value={iptu}
                  onChange={(e) => setIptu(e.target.value)}
                  inputMode="decimal"
                  className={inputCls}
                />
              </Field>
              <p className="text-xs text-muted-foreground">
                Deixe o valor em branco para anunciar como "sob consulta".
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="Fotos do imóvel (até 8)">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  className="text-sm"
                />
                {uploading && <p className="text-xs text-muted-foreground mt-1">Enviando…</p>}
                {images.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {images.map((img) => (
                      <div key={img} className="relative size-20 rounded-xl overflow-hidden border border-border">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          aria-label="Remover foto"
                          onClick={() => setImages((prev) => prev.filter((i) => i !== img))}
                          className="absolute top-1 right-1 size-5 rounded-full bg-background/90 flex items-center justify-center"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
              <Field label="WhatsApp">
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  inputMode="tel"
                  placeholder="11999999999"
                  className={inputCls}
                />
              </Field>
              <Field label="Telefone (opcional)">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  className={inputCls}
                />
              </Field>
            </>
          )}
        </div>

        <div className="mt-8 flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-3 rounded-full border border-border font-bold inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="size-4" /> Voltar
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canAdvance()}
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 px-4 py-3 rounded-full bg-brand text-primary-foreground font-bold shadow-brand inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              Continuar <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 rounded-full bg-brand text-primary-foreground font-bold shadow-brand inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="size-4" /> {saving ? "Publicando…" : "Publicar imóvel"}
            </button>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-full border text-sm font-semibold ${
        active ? "bg-cat-imovel text-primary-foreground border-cat-imovel" : "bg-card border-border"
      }`}
    >
      {children}
    </button>
  );
}
