import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Trash2, Upload, ArrowLeft } from "lucide-react";
import {
  getMyProfessionalProfile,
  upsertProfessionalProfile,
  listProfessionalServices,
  addProfessionalService,
  removeProfessionalService,
  listPortfolioItems,
  addPortfolioItem,
  removePortfolioItem,
} from "@/lib/account-api";
import { communitiesQuery } from "@/lib/listings-api";
import { uploadMedia, detectMediaType } from "@/lib/upload";

export const Route = createFileRoute("/conta/profissional")({
  head: () => ({ meta: [{ title: "Perfil profissional — teiyaa" }] }),
  component: ProfissionalAdmin,
});

function ProfissionalAdmin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-pro-profile", user?.id],
    queryFn: () => getMyProfessionalProfile(user!.id),
    enabled: !!user,
  });

  const { data: communities = [] } = useQuery(communitiesQuery);
  const { data: services = [] } = useQuery({
    queryKey: ["pro-services", profile?.id],
    queryFn: () => listProfessionalServices(profile!.id),
    enabled: !!profile?.id,
  });
  const { data: portfolio = [] } = useQuery({
    queryKey: ["pro-portfolio", profile?.id],
    queryFn: () => listPortfolioItems(profile!.id),
    enabled: !!profile?.id,
  });

  const [form, setForm] = useState({
    profession: "",
    headline: "",
    about: "",
    years_experience: "",
    whatsapp: "",
    phone: "",
    instagram: "",
    community_id: "",
    avatar_url: "",
    cover_url: "",
    is_published: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        profession: profile.profession ?? "",
        headline: profile.headline ?? "",
        about: profile.about ?? "",
        years_experience: profile.years_experience?.toString() ?? "",
        whatsapp: profile.whatsapp ?? "",
        phone: profile.phone ?? "",
        instagram: profile.instagram ?? "",
        community_id: profile.community_id ?? "",
        avatar_url: profile.avatar_url ?? "",
        cover_url: profile.cover_url ?? "",
        is_published: profile.is_published,
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.profession.trim()) return toast.error("Informe sua profissão");
    setSaving(true);
    try {
      await upsertProfessionalProfile(user.id, {
        profession: form.profession.trim(),
        headline: form.headline || null,
        about: form.about || null,
        years_experience: form.years_experience ? Number(form.years_experience) : null,
        whatsapp: form.whatsapp || null,
        phone: form.phone || null,
        instagram: form.instagram || null,
        community_id: form.community_id || null,
        avatar_url: form.avatar_url || null,
        cover_url: form.cover_url || null,
        is_published: form.is_published,
      });
      toast.success("Perfil salvo!");
      qc.invalidateQueries({ queryKey: ["my-pro-profile"] });
    } catch (err) {
      toast.error("Erro ao salvar: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (field: "avatar_url" | "cover_url", file: File) => {
    if (!user) return;
    try {
      const url = await uploadMedia(file, user.id, field === "avatar_url" ? "avatar" : "cover");
      setForm((f) => ({ ...f, [field]: url }));
      toast.success("Imagem enviada — clique em Salvar");
    } catch (err) {
      toast.error("Erro no upload: " + (err as Error).message);
    }
  };

  // service form
  const [newService, setNewService] = useState({ title: "", price: "", unit: "serviço" });
  const handleAddService = async () => {
    if (!profile || !newService.title.trim()) return;
    await addProfessionalService({
      professional_id: profile.id,
      title: newService.title.trim(),
      description: null,
      price_from_cents: newService.price ? Math.round(Number(newService.price) * 100) : null,
      price_unit: newService.unit,
      sort_order: services.length,
    });
    setNewService({ title: "", price: "", unit: "serviço" });
    qc.invalidateQueries({ queryKey: ["pro-services"] });
  };

  // portfolio upload
  const handlePortfolioUpload = async (files: FileList | null) => {
    if (!files || !profile || !user) return;
    for (const file of Array.from(files)) {
      try {
        const url = await uploadMedia(file, user.id, "portfolio");
        await addPortfolioItem({
          professional_id: profile.id,
          media_url: url,
          media_type: detectMediaType(file),
          caption: null,
          sort_order: portfolio.length,
        });
      } catch (err) {
        toast.error("Erro: " + (err as Error).message);
      }
    }
    qc.invalidateQueries({ queryKey: ["pro-portfolio"] });
    toast.success("Mídias adicionadas");
  };

  if (loading || isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">Carregando…</main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <Link to="/conta" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Minha conta
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Perfil profissional</h1>
            <p className="text-muted-foreground mt-1">Suas informações públicas para quem busca um profissional.</p>
          </div>
          {profile?.is_published && (
            <Link
              to="/profissionais/perfil/$userId"
              params={{ userId: user.id }}
              className="text-sm text-brand font-semibold whitespace-nowrap"
            >
              Ver perfil público →
            </Link>
          )}
        </div>

        {/* main info */}
        <form onSubmit={handleSave} className="mt-8 space-y-5 p-6 rounded-2xl border border-border bg-surface">
          <h2 className="font-bold text-lg">Sobre você</h2>

          <Field label="Profissão *">
            <input className={inputCls} value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} placeholder="Ex: Eletricista, Cabeleireira, Designer" />
          </Field>

          <Field label="Título curto">
            <input className={inputCls} value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Ex: Instalações elétricas residenciais e prediais" />
          </Field>

          <Field label="Sobre">
            <textarea className={inputCls + " min-h-32"} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} placeholder="Conte sobre sua experiência, especialidades, diferenciais..." />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Anos de experiência">
              <input type="number" min={0} className={inputCls} value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} />
            </Field>
            <Field label="Bairro / comunidade">
              <select className={inputCls} value={form.community_id} onChange={(e) => setForm({ ...form, community_id: e.target.value })}>
                <option value="">Selecione</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <h2 className="font-bold text-lg pt-4">Contato</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="WhatsApp">
              <input className={inputCls} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="11 99999-9999" />
            </Field>
            <Field label="Telefone">
              <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <Field label="Instagram">
            <input className={inputCls} value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@seuperfil" />
          </Field>

          <h2 className="font-bold text-lg pt-4">Foto e capa</h2>
          <div className="grid grid-cols-2 gap-4">
            <ImageUpload label="Foto de perfil" url={form.avatar_url} onPick={(f) => handleImageUpload("avatar_url", f)} />
            <ImageUpload label="Capa" url={form.cover_url} onPick={(f) => handleImageUpload("cover_url", f)} />
          </div>

          <label className="flex items-center gap-2 pt-4">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
            <span className="text-sm">Publicar meu perfil (visível para todos)</span>
          </label>

          <button disabled={saving} type="submit" className="w-full py-3 bg-brand text-primary-foreground rounded-full font-bold disabled:opacity-60">
            {saving ? "Salvando…" : "Salvar perfil"}
          </button>
        </form>

        {/* services */}
        {profile && (
          <section className="mt-8 p-6 rounded-2xl border border-border bg-surface">
            <h2 className="font-bold text-lg">Serviços oferecidos</h2>
            <p className="text-sm text-muted-foreground">Liste o que você faz para que as pessoas saibam contratar.</p>
            <ul className="mt-4 space-y-2">
              {services.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted">
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    {s.price_from_cents != null && (
                      <p className="text-xs text-muted-foreground">a partir de R$ {(s.price_from_cents / 100).toFixed(2)} / {s.price_unit ?? "serviço"}</p>
                    )}
                  </div>
                  <button onClick={async () => { await removeProfessionalService(s.id); qc.invalidateQueries({ queryKey: ["pro-services"] }); }} className="text-destructive p-2"><Trash2 className="size-4" /></button>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-[1fr_120px_120px_auto] gap-2">
              <input className={inputCls} placeholder="Título do serviço" value={newService.title} onChange={(e) => setNewService({ ...newService, title: e.target.value })} />
              <input type="number" className={inputCls} placeholder="Preço R$" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} />
              <select className={inputCls} value={newService.unit} onChange={(e) => setNewService({ ...newService, unit: e.target.value })}>
                <option value="serviço">por serviço</option>
                <option value="hora">por hora</option>
                <option value="diária">por diária</option>
              </select>
              <button onClick={handleAddService} type="button" className="px-4 bg-brand text-primary-foreground rounded-lg font-semibold">Adicionar</button>
            </div>
          </section>
        )}

        {/* portfolio */}
        {profile && (
          <section className="mt-8 p-6 rounded-2xl border border-border bg-surface">
            <h2 className="font-bold text-lg">Portfólio (fotos e vídeos)</h2>
            <p className="text-sm text-muted-foreground">Mostre seu trabalho. Você pode subir várias mídias.</p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {portfolio.map((p) => (
                <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden bg-muted">
                  {p.media_type === "video" ? (
                    <video src={p.media_url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={p.media_url} alt={p.caption ?? ""} className="w-full h-full object-cover" />
                  )}
                  <button onClick={async () => { await removePortfolioItem(p.id); qc.invalidateQueries({ queryKey: ["pro-portfolio"] }); }} className="absolute top-2 right-2 size-8 rounded-full bg-background/80 text-destructive flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted">
                <Upload className="size-6" />
                <span className="text-xs mt-2">Adicionar</span>
                <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => handlePortfolioUpload(e.target.files)} />
              </label>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground/80">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function ImageUpload({ label, url, onPick }: { label: string; url: string; onPick: (f: File) => void }) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground/80 mb-1">{label}</p>
      <label className="block aspect-video rounded-xl border-2 border-dashed border-border bg-muted overflow-hidden cursor-pointer">
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <Upload className="size-6" />
            <span className="text-xs mt-1">Enviar</span>
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
      </label>
    </div>
  );
}
