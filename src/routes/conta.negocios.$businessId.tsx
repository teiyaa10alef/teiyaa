import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Upload, Eye, MessageCircle, Star, Tag } from "lucide-react";
import {
  getBusiness, updateBusiness, deleteBusiness,
  listBusinessHours, upsertBusinessHour,
  listBusinessServices, addBusinessService, removeBusinessService,
  listBusinessMedia, addBusinessMedia, removeBusinessMedia,
  WEEKDAYS,
} from "@/lib/account-api";
import { communitiesQuery } from "@/lib/listings-api";
import {
  BUSINESS_CATEGORIES,
  listBusinessPromotions,
  addBusinessPromotion,
  removeBusinessPromotion,
  togglePromotionActive,
  listBusinessReviews,
} from "@/lib/business-api";
import { uploadMedia } from "@/lib/upload";

export const Route = createFileRoute("/conta/negocios/$businessId")({
  head: () => ({ meta: [{ title: "Editar negócio — teiyaa" }] }),
  component: EditBusiness,
});

function EditBusiness() {
  const { businessId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const { data: biz, isLoading } = useQuery({
    queryKey: ["biz", businessId],
    queryFn: () => getBusiness(businessId),
  });
  const { data: communities = [] } = useQuery(communitiesQuery);
  const { data: hours = [] } = useQuery({
    queryKey: ["biz-hours", businessId],
    queryFn: () => listBusinessHours(businessId),
    enabled: !!biz,
  });
  const { data: services = [] } = useQuery({
    queryKey: ["biz-services", businessId],
    queryFn: () => listBusinessServices(businessId),
    enabled: !!biz,
  });
  const { data: media = [] } = useQuery({
    queryKey: ["biz-media", businessId],
    queryFn: () => listBusinessMedia(businessId),
    enabled: !!biz,
  });
  const { data: promos = [] } = useQuery({
    queryKey: ["biz-promos", businessId],
    queryFn: () => listBusinessPromotions(businessId),
    enabled: !!biz,
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["biz-reviews", businessId],
    queryFn: () => listBusinessReviews(businessId),
    enabled: !!biz,
  });
  const [newPromo, setNewPromo] = useState({ title: "", description: "", discount_label: "", ends_at: "" });

  const handleAddPromo = async () => {
    if (!newPromo.title.trim()) return;
    try {
      await addBusinessPromotion({
        business_id: businessId,
        title: newPromo.title.trim().slice(0, 80),
        description: newPromo.description.trim().slice(0, 300) || null,
        discount_label: newPromo.discount_label.trim().slice(0, 20) || null,
        ends_at: newPromo.ends_at ? new Date(newPromo.ends_at).toISOString() : null,
        is_active: true,
      });
      setNewPromo({ title: "", description: "", discount_label: "", ends_at: "" });
      qc.invalidateQueries({ queryKey: ["biz-promos", businessId] });
      toast.success("Promoção criada!");
    } catch (err) {
      toast.error("Erro: " + (err as Error).message);
    }
  };

  const [form, setForm] = useState({
    name: "", category: "", description: "", address: "",
    whatsapp: "", phone: "", instagram: "",
    community_id: "", logo_url: "", cover_url: "", is_published: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (biz) {
      setForm({
        name: biz.name, category: biz.category ?? "", description: biz.description ?? "",
        address: biz.address ?? "", whatsapp: biz.whatsapp ?? "", phone: biz.phone ?? "",
        instagram: biz.instagram ?? "", community_id: biz.community_id ?? "",
        logo_url: biz.logo_url ?? "", cover_url: biz.cover_url ?? "", is_published: biz.is_published,
      });
    }
  }, [biz]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateBusiness(businessId, {
        name: form.name, category: form.category || null, description: form.description || null,
        address: form.address || null, whatsapp: form.whatsapp || null, phone: form.phone || null,
        instagram: form.instagram || null, community_id: form.community_id || null,
        logo_url: form.logo_url || null, cover_url: form.cover_url || null, is_published: form.is_published,
      });
      toast.success("Salvo!");
      qc.invalidateQueries({ queryKey: ["biz", businessId] });
    } catch (err) {
      toast.error("Erro: " + (err as Error).message);
    } finally { setSaving(false); }
  };

  const handleImg = async (field: "logo_url" | "cover_url", file: File) => {
    if (!user) return;
    const url = await uploadMedia(file, user.id, `business/${businessId}/${field}`);
    setForm((f) => ({ ...f, [field]: url }));
    toast.success("Imagem enviada — clique em Salvar");
  };

  const handleHour = async (weekday: number, patch: { opens_at?: string | null; closes_at?: string | null; is_closed?: boolean }) => {
    const existing = hours.find((h) => h.weekday === weekday);
    await upsertBusinessHour({
      business_id: businessId,
      weekday,
      opens_at: patch.opens_at !== undefined ? patch.opens_at : existing?.opens_at ?? null,
      closes_at: patch.closes_at !== undefined ? patch.closes_at : existing?.closes_at ?? null,
      is_closed: patch.is_closed !== undefined ? patch.is_closed : existing?.is_closed ?? false,
    });
    qc.invalidateQueries({ queryKey: ["biz-hours", businessId] });
  };

  const [newSvc, setNewSvc] = useState({ title: "", price: "" });
  const handleAddSvc = async () => {
    if (!newSvc.title.trim()) return;
    await addBusinessService({
      business_id: businessId, title: newSvc.title.trim(), description: null,
      price_cents: newSvc.price ? Math.round(Number(newSvc.price) * 100) : null,
      sort_order: services.length,
    });
    setNewSvc({ title: "", price: "" });
    qc.invalidateQueries({ queryKey: ["biz-services", businessId] });
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    for (const f of Array.from(files)) {
      const url = await uploadMedia(f, user.id, `business/${businessId}/gallery`);
      await addBusinessMedia({ business_id: businessId, media_url: url, media_type: "image", caption: null, sort_order: media.length });
    }
    qc.invalidateQueries({ queryKey: ["biz-media", businessId] });
    toast.success("Fotos adicionadas");
  };

  const handleDelete = async () => {
    if (!confirm("Excluir este negócio? Esta ação não pode ser desfeita.")) return;
    await deleteBusiness(businessId);
    toast.success("Negócio excluído");
    navigate({ to: "/conta/negocios" });
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">Carregando…</main>
        <SiteFooter />
      </div>
    );
  }
  if (!biz) {
    return <div className="min-h-screen flex items-center justify-center">Negócio não encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <Link to="/conta/negocios" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Meus negócios
        </Link>
        <div className="mt-3 flex items-start justify-between">
          <h1 className="text-3xl font-bold">{biz.name}</h1>
          {biz.is_published && (
            <Link to="/negocios/$slug" params={{ slug: biz.slug }} className="text-sm text-brand font-semibold">Ver público →</Link>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat icon={<Eye className="size-4" />} label="Visualizações" value={biz.view_count ?? 0} />
          <Stat icon={<MessageCircle className="size-4" />} label="Cliques WhatsApp" value={biz.whatsapp_click_count ?? 0} />
          <Stat
            icon={<Star className="size-4" />}
            label={`${reviews.length} avaliações`}
            value={reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : "—"}
          />
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-5 p-6 rounded-2xl border border-border bg-surface">
          <h2 className="font-bold text-lg">Identidade</h2>
          <Field label="Nome *"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoria">
              <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">—</option>
                {BUSINESS_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Bairro / comunidade">
              <select className={inputCls} value={form.community_id} onChange={(e) => setForm({ ...form, community_id: e.target.value })}>
                <option value="">—</option>
                {communities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Descrição"><textarea className={inputCls + " min-h-24"} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>

          <div className="grid grid-cols-2 gap-4">
            <ImageUpload label="Logo" url={form.logo_url} onPick={(f) => handleImg("logo_url", f)} />
            <ImageUpload label="Capa" url={form.cover_url} onPick={(f) => handleImg("cover_url", f)} />
          </div>

          <h2 className="font-bold text-lg pt-4">Localização e contato</h2>
          <Field label="Endereço"><input className={inputCls} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="WhatsApp"><input className={inputCls} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
            <Field label="Telefone"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          </div>
          <Field label="Instagram"><input className={inputCls} value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@negocio" /></Field>

          <label className="flex items-center gap-2 pt-4">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            <span className="text-sm">Publicar (visível para todos)</span>
          </label>

          <div className="flex gap-3">
            <button disabled={saving} className="flex-1 py-3 bg-brand text-primary-foreground rounded-full font-bold disabled:opacity-60">
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button type="button" onClick={handleDelete} className="px-4 py-3 rounded-full border border-destructive text-destructive font-semibold">
              Excluir
            </button>
          </div>
        </form>

        {/* Hours */}
        <section className="mt-8 p-6 rounded-2xl border border-border bg-surface">
          <h2 className="font-bold text-lg">Horários de funcionamento</h2>
          <ul className="mt-4 space-y-2">
            {WEEKDAYS.map((label, weekday) => {
              const h = hours.find((x) => x.weekday === weekday);
              return (
                <li key={weekday} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium">{label}</span>
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={h?.is_closed ?? false} onChange={(e) => handleHour(weekday, { is_closed: e.target.checked })} />
                    Fechado
                  </label>
                  {!h?.is_closed && (
                    <>
                      <input type="time" className={inputCls + " w-28"} value={h?.opens_at?.slice(0, 5) ?? ""} onChange={(e) => handleHour(weekday, { opens_at: e.target.value || null })} />
                      <span>—</span>
                      <input type="time" className={inputCls + " w-28"} value={h?.closes_at?.slice(0, 5) ?? ""} onChange={(e) => handleHour(weekday, { closes_at: e.target.value || null })} />
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Services */}
        <section className="mt-8 p-6 rounded-2xl border border-border bg-surface">
          <h2 className="font-bold text-lg">Serviços / produtos</h2>
          <ul className="mt-4 space-y-2">
            {services.map((s) => (
              <li key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <div>
                  <p className="font-semibold">{s.title}</p>
                  {s.price_cents != null && <p className="text-xs text-muted-foreground">R$ {(s.price_cents / 100).toFixed(2)}</p>}
                </div>
                <button onClick={async () => { await removeBusinessService(s.id); qc.invalidateQueries({ queryKey: ["biz-services", businessId] }); }} className="text-destructive p-2"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-[1fr_120px_auto] gap-2">
            <input className={inputCls} placeholder="Nome do item" value={newSvc.title} onChange={(e) => setNewSvc({ ...newSvc, title: e.target.value })} />
            <input type="number" className={inputCls} placeholder="Preço R$" value={newSvc.price} onChange={(e) => setNewSvc({ ...newSvc, price: e.target.value })} />
            <button onClick={handleAddSvc} type="button" className="px-4 bg-brand text-primary-foreground rounded-lg font-semibold">Adicionar</button>
          </div>
        </section>

        {/* Promotions */}
        <section className="mt-8 p-6 rounded-2xl border border-border bg-surface">
          <h2 className="font-bold text-lg flex items-center gap-2"><Tag className="size-5 text-cat-freelance" /> Promoções</h2>
          <p className="text-sm text-muted-foreground mt-1">Ofertas aparecem em destaque na sua página e no card do feed.</p>
          <ul className="mt-4 space-y-2">
            {promos.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.title} {p.discount_label ? `· ${p.discount_label}` : ""}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.is_active ? "Ativa" : "Pausada"}
                    {p.ends_at ? ` · até ${new Date(p.ends_at).toLocaleDateString("pt-BR")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={async () => { await togglePromotionActive(p.id, !p.is_active); qc.invalidateQueries({ queryKey: ["biz-promos", businessId] }); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border"
                  >
                    {p.is_active ? "Pausar" : "Ativar"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => { await removeBusinessPromotion(p.id); qc.invalidateQueries({ queryKey: ["biz-promos", businessId] }); }}
                    className="text-destructive p-2"
                    aria-label="Excluir promoção"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input className={inputCls} placeholder="Título (ex.: Combo do almoço)" maxLength={80} value={newPromo.title} onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })} />
            <input className={inputCls} placeholder="Selo (ex.: -20%)" maxLength={20} value={newPromo.discount_label} onChange={(e) => setNewPromo({ ...newPromo, discount_label: e.target.value })} />
            <input className={inputCls} placeholder="Descrição" maxLength={300} value={newPromo.description} onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })} />
            <input type="date" className={inputCls} aria-label="Válido até" value={newPromo.ends_at} onChange={(e) => setNewPromo({ ...newPromo, ends_at: e.target.value })} />
          </div>
          <button type="button" onClick={handleAddPromo} className="mt-3 px-5 py-2.5 bg-brand text-primary-foreground rounded-full font-bold text-sm">
            Criar promoção
          </button>
        </section>

        {/* Gallery */}
        <section className="mt-8 p-6 rounded-2xl border border-border bg-surface">
          <h2 className="font-bold text-lg">Galeria</h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {media.map((m) => (
              <div key={m.id} className="relative group aspect-square rounded-xl overflow-hidden bg-muted">
                <img src={m.media_url} alt="" className="w-full h-full object-cover" />
                <button onClick={async () => { await removeBusinessMedia(m.id); qc.invalidateQueries({ queryKey: ["biz-media", businessId] }); }} className="absolute top-2 right-2 size-8 rounded-full bg-background/80 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted">
              <Upload className="size-6" />
              <span className="text-xs mt-2">Adicionar</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleGalleryUpload(e.target.files)} />
            </label>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-semibold text-foreground/80">{label}</span><div className="mt-1">{children}</div></label>;
}
function ImageUpload({ label, url, onPick }: { label: string; url: string; onPick: (f: File) => void }) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground/80 mb-1">{label}</p>
      <label className="block aspect-video rounded-xl border-2 border-dashed border-border bg-muted overflow-hidden cursor-pointer">
        {url ? <img src={url} alt={label} className="w-full h-full object-cover" /> : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <Upload className="size-6" /><span className="text-xs mt-1">Enviar</span>
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
      </label>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="p-3 rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">{icon}<span className="truncate">{label}</span></div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
