import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RatingStars } from "@/components/RatingStars";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Trash2,
  Upload,
  ArrowLeft,
  Eye,
  MessageCircle,
  Star,
  Inbox,
  CheckCircle2,
  Circle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  getMyProfessionalProfile,
  upsertProfessionalProfile,
  listProfessionalServices,
  addProfessionalService,
  removeProfessionalService,
  addPortfolioItem,
  removePortfolioItem,
} from "@/lib/account-api";
import {
  PROFESSIONS,
  listPortfolio,
  updatePortfolioItem,
  movePortfolioItem,
  listProfessionalLeads,
  listProfessionalReviews,
  updateLeadStatus,
  formatPrice,
  type ProfessionalLead,
} from "@/lib/professional-api";
import { communitiesQuery } from "@/lib/listings-api";
import { uploadMedia, detectMediaType } from "@/lib/upload";

export const Route = createFileRoute("/conta/profissional")({
  head: () => ({
    meta: [
      { title: "Meu perfil profissional — teiyaa" },
      {
        name: "description",
        content:
          "Monte seu portfólio, cadastre serviços e acompanhe pedidos de orçamento e avaliações dos moradores.",
      },
      { property: "og:title", content: "Meu perfil profissional — teiyaa" },
      {
        property: "og:description",
        content: "Painel do profissional: portfólio, serviços, pedidos e avaliações.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfissionalAdmin,
});

type Tab = "visao" | "perfil" | "servicos" | "portfolio" | "pedidos" | "avaliacoes";

const TABS: { key: Tab; label: string }[] = [
  { key: "visao", label: "Visão geral" },
  { key: "perfil", label: "Perfil" },
  { key: "servicos", label: "Serviços" },
  { key: "portfolio", label: "Portfólio" },
  { key: "pedidos", label: "Pedidos" },
  { key: "avaliacoes", label: "Avaliações" },
];

function ProfissionalAdmin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("visao");

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
    queryFn: () => listPortfolio(profile!.id),
    enabled: !!profile?.id,
  });
  const { data: leads = [] } = useQuery({
    queryKey: ["pro-leads", profile?.id],
    queryFn: () => listProfessionalLeads(profile!.id),
    enabled: !!profile?.id,
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["pro-reviews", profile?.id],
    queryFn: () => listProfessionalReviews(profile!.id),
    enabled: !!profile?.id,
  });

  const [form, setForm] = useState({
    profession: "",
    category: "",
    specialties: [] as string[],
    headline: "",
    about: "",
    years_experience: "",
    service_area_km: "",
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
      const p = profile as typeof profile & {
        category?: string | null;
        specialties?: string[] | null;
      };
      setForm({
        profession: p.profession ?? "",
        category: p.category ?? "",
        specialties: p.specialties ?? [],
        headline: p.headline ?? "",
        about: p.about ?? "",
        years_experience: p.years_experience?.toString() ?? "",
        service_area_km: p.service_area_km?.toString() ?? "",
        whatsapp: p.whatsapp ?? "",
        phone: p.phone ?? "",
        instagram: p.instagram ?? "",
        community_id: p.community_id ?? "",
        avatar_url: p.avatar_url ?? "",
        cover_url: p.cover_url ?? "",
        is_published: p.is_published,
      });
    }
  }, [profile]);

  const stats = profile as unknown as
    | { view_count?: number; whatsapp_click_count?: number }
    | undefined;
  const ratingAvg = reviews.length
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : null;
  const newLeads = leads.filter((l) => l.status === "novo").length;

  const checklist = useMemo(
    () => [
      { label: "Profissão e categoria", done: !!form.profession && !!form.category },
      { label: "Foto de perfil", done: !!form.avatar_url },
      { label: "Descrição sobre você", done: (form.about ?? "").length > 40 },
      { label: "WhatsApp para contato", done: !!form.whatsapp },
      { label: "Pelo menos 1 serviço", done: services.length > 0 },
      { label: "3 fotos no portfólio", done: portfolio.length >= 3 },
      { label: "Perfil publicado", done: !!profile?.is_published },
    ],
    [form, services.length, portfolio.length, profile?.is_published],
  );
  const completion = Math.round(
    (checklist.filter((c) => c.done).length / checklist.length) * 100,
  );

  const saveProfile = async (overrides?: Partial<typeof form>) => {
    if (!user) return;
    const f = { ...form, ...overrides };
    if (!f.profession.trim()) {
      toast.error("Informe sua profissão");
      return;
    }
    setSaving(true);
    try {
      await upsertProfessionalProfile(user.id, {
        profession: f.profession.trim(),
        headline: f.headline || null,
        about: f.about || null,
        years_experience: f.years_experience ? Number(f.years_experience) : null,
        service_area_km: f.service_area_km ? Number(f.service_area_km) : null,
        whatsapp: f.whatsapp || null,
        phone: f.phone || null,
        instagram: f.instagram || null,
        community_id: f.community_id || null,
        avatar_url: f.avatar_url || null,
        cover_url: f.cover_url || null,
        is_published: f.is_published,
        category: f.category || null,
        specialties: f.specialties,
      } as never);
      setForm(f);
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

  const [newService, setNewService] = useState({ title: "", description: "", price: "", unit: "serviço" });
  const handleAddService = async () => {
    if (!profile || !newService.title.trim()) return;
    await addProfessionalService({
      professional_id: profile.id,
      title: newService.title.trim(),
      description: newService.description.trim() || null,
      price_from_cents: newService.price ? Math.round(Number(newService.price) * 100) : null,
      price_unit: newService.unit,
      sort_order: services.length,
    });
    setNewService({ title: "", description: "", price: "", unit: "serviço" });
    qc.invalidateQueries({ queryKey: ["pro-services"] });
  };

  const handlePortfolioUpload = async (files: FileList | null) => {
    if (!files || !profile || !user) return;
    let i = portfolio.length;
    for (const file of Array.from(files)) {
      try {
        const url = await uploadMedia(file, user.id, "portfolio");
        await addPortfolioItem({
          professional_id: profile.id,
          media_url: url,
          media_type: detectMediaType(file),
          caption: null,
          sort_order: i++,
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

  const hasProfile = !!profile;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <Link to="/conta" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Minha conta
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Meu perfil profissional</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Portfólio, serviços e pedidos de orçamento em um só lugar.
            </p>
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

        {!hasProfile ? (
          <section className="mt-8 p-6 rounded-2xl border border-border bg-surface">
            <h2 className="font-bold text-lg">Comece seu perfil</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Só precisamos da sua profissão para começar. Depois você completa portfólio e serviços.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Profissão *">
                <input
                  className={inputCls}
                  value={form.profession}
                  onChange={(e) => setForm({ ...form, profession: e.target.value })}
                  placeholder="Ex: Eletricista"
                />
              </Field>
              <Field label="Categoria">
                <select
                  className={inputCls}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {PROFESSIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.emoji} {p.label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <button
              disabled={saving}
              onClick={() => saveProfile()}
              className="mt-5 px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold disabled:opacity-60"
            >
              {saving ? "Criando…" : "Criar meu perfil"}
            </button>
          </section>
        ) : (
          <>
            <div className="mt-6 flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap ${
                    tab === t.key
                      ? "bg-cat-profissional text-primary-foreground border-cat-profissional"
                      : "bg-card border-border text-foreground/80"
                  }`}
                >
                  {t.label}
                  {t.key === "pedidos" && newLeads > 0 && (
                    <span className="ml-1.5 px-1.5 rounded-full bg-brand text-primary-foreground text-xs">
                      {newLeads}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {tab === "visao" && (
              <section className="mt-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat icon={Eye} label="Visualizações" value={stats?.view_count ?? 0} />
                  <Stat icon={MessageCircle} label="Cliques WhatsApp" value={stats?.whatsapp_click_count ?? 0} />
                  <Stat icon={Inbox} label="Pedidos" value={leads.length} />
                  <Stat icon={Star} label="Nota média" value={ratingAvg ? ratingAvg.toFixed(1) : "—"} />
                </div>

                <div className="p-5 rounded-2xl border border-border bg-surface">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold">Perfil completo</h2>
                    <span className="text-sm font-bold text-cat-profissional">{completion}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-cat-profissional" style={{ width: `${completion}%` }} />
                  </div>
                  <ul className="mt-4 space-y-2">
                    {checklist.map((c) => (
                      <li key={c.label} className="flex items-center gap-2 text-sm">
                        {c.done ? (
                          <CheckCircle2 className="size-4 text-cat-imovel" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground" />
                        )}
                        <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-2xl border border-border bg-surface flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{form.is_published ? "Perfil publicado" : "Perfil oculto"}</p>
                    <p className="text-sm text-muted-foreground">
                      {form.is_published
                        ? "Moradores da sua região já podem te encontrar."
                        : "Publique para aparecer nas buscas do bairro."}
                    </p>
                  </div>
                  <button
                    disabled={saving}
                    onClick={() => saveProfile({ is_published: !form.is_published })}
                    className={`px-5 py-2.5 rounded-full font-bold text-sm disabled:opacity-60 ${
                      form.is_published
                        ? "border border-border"
                        : "bg-brand text-primary-foreground"
                    }`}
                  >
                    {form.is_published ? "Despublicar" : "Publicar"}
                  </button>
                </div>
              </section>
            )}

            {tab === "perfil" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveProfile();
                }}
                className="mt-6 space-y-5 p-6 rounded-2xl border border-border bg-surface"
              >
                <h2 className="font-bold text-lg">Sobre você</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Profissão *">
                    <input className={inputCls} value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} />
                  </Field>
                  <Field label="Categoria">
                    <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      <option value="">Selecione</option>
                      {PROFESSIONS.map((p) => (
                        <option key={p.value} value={p.value}>{p.emoji} {p.label}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Título curto">
                  <input className={inputCls} value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Ex: Instalações elétricas residenciais" />
                </Field>

                <Field label="Sobre">
                  <textarea className={inputCls + " min-h-32"} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} placeholder="Experiência, diferenciais, forma de trabalho..." />
                </Field>

                <SpecialtiesInput
                  values={form.specialties}
                  onChange={(specialties) => setForm({ ...form, specialties })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Anos de experiência">
                    <input type="number" min={0} className={inputCls} value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} />
                  </Field>
                  <Field label="Raio de atendimento (km)">
                    <input type="number" min={0} className={inputCls} value={form.service_area_km} onChange={(e) => setForm({ ...form, service_area_km: e.target.value })} />
                  </Field>
                </div>

                <Field label="Bairro / comunidade">
                  <select className={inputCls} value={form.community_id} onChange={(e) => setForm({ ...form, community_id: e.target.value })}>
                    <option value="">Selecione</option>
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>

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

                <button disabled={saving} type="submit" className="w-full py-3 bg-brand text-primary-foreground rounded-full font-bold disabled:opacity-60">
                  {saving ? "Salvando…" : "Salvar perfil"}
                </button>
              </form>
            )}

            {tab === "servicos" && (
              <section className="mt-6 p-6 rounded-2xl border border-border bg-surface">
                <h2 className="font-bold text-lg">Serviços oferecidos</h2>
                <p className="text-sm text-muted-foreground">
                  Descreva o que você faz e a partir de quanto. Isso ajuda o morador a decidir.
                </p>
                <ul className="mt-4 space-y-2">
                  {services.map((s) => (
                    <li key={s.id} className="flex items-start justify-between gap-2 p-3 rounded-lg bg-muted">
                      <div>
                        <p className="font-semibold">{s.title}</p>
                        {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                        {s.price_from_cents != null && (
                          <p className="text-xs text-muted-foreground">
                            a partir de {formatPrice(s.price_from_cents)} / {s.price_unit ?? "serviço"}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          await removeProfessionalService(s.id);
                          qc.invalidateQueries({ queryKey: ["pro-services"] });
                        }}
                        className="text-destructive p-2"
                        aria-label="Remover serviço"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-2">
                  <input className={inputCls} placeholder="Título do serviço" value={newService.title} onChange={(e) => setNewService({ ...newService, title: e.target.value })} />
                  <input className={inputCls} placeholder="Descrição (opcional)" value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input type="number" className={inputCls} placeholder="Preço R$" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} />
                    <select className={inputCls} value={newService.unit} onChange={(e) => setNewService({ ...newService, unit: e.target.value })}>
                      <option value="serviço">por serviço</option>
                      <option value="hora">por hora</option>
                      <option value="diária">por diária</option>
                      <option value="m²">por m²</option>
                    </select>
                    <button onClick={handleAddService} type="button" className="px-4 bg-brand text-primary-foreground rounded-lg font-semibold">
                      Adicionar
                    </button>
                  </div>
                </div>
              </section>
            )}

            {tab === "portfolio" && (
              <section className="mt-6 p-6 rounded-2xl border border-border bg-surface">
                <h2 className="font-bold text-lg">Portfólio de trabalhos</h2>
                <p className="text-sm text-muted-foreground">
                  Fotos e vídeos dos seus serviços. Dê um título para cada trabalho e organize a ordem.
                </p>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {portfolio.map((p) => (
                    <div key={p.id} className="rounded-xl border border-border overflow-hidden bg-card">
                      <div className="aspect-video bg-muted">
                        {p.media_type === "video" ? (
                          <video src={p.media_url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={p.media_url} alt={p.title ?? ""} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <input
                          className={inputCls}
                          placeholder="Título do trabalho"
                          defaultValue={p.title ?? ""}
                          onBlur={async (e) => {
                            if (e.target.value !== (p.title ?? "")) {
                              await updatePortfolioItem(p.id, { title: e.target.value || null });
                              qc.invalidateQueries({ queryKey: ["pro-portfolio"] });
                            }
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label="Mover para cima"
                            onClick={async () => {
                              await movePortfolioItem(portfolio, p.id, -1);
                              qc.invalidateQueries({ queryKey: ["pro-portfolio"] });
                            }}
                            className="p-2 rounded-lg border border-border"
                          >
                            <ArrowUp className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label="Mover para baixo"
                            onClick={async () => {
                              await movePortfolioItem(portfolio, p.id, 1);
                              qc.invalidateQueries({ queryKey: ["pro-portfolio"] });
                            }}
                            className="p-2 rounded-lg border border-border"
                          >
                            <ArrowDown className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await removePortfolioItem(p.id);
                              qc.invalidateQueries({ queryKey: ["pro-portfolio"] });
                            }}
                            className="ml-auto p-2 rounded-lg border border-border text-destructive"
                            aria-label="Remover mídia"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <label className="min-h-40 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted">
                    <Upload className="size-6" />
                    <span className="text-xs mt-2">Adicionar fotos/vídeos</span>
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => handlePortfolioUpload(e.target.files)} />
                  </label>
                </div>
              </section>
            )}

            {tab === "pedidos" && (
              <section className="mt-6 space-y-3">
                {leads.length === 0 && (
                  <p className="text-sm text-muted-foreground p-6 rounded-2xl border border-dashed border-border text-center">
                    Nenhum pedido de orçamento ainda. Complete seu portfólio para receber mais contatos.
                  </p>
                )}
                {leads.map((l) => (
                  <LeadRow
                    key={l.id}
                    lead={l}
                    onStatus={async (status) => {
                      await updateLeadStatus(l.id, status);
                      qc.invalidateQueries({ queryKey: ["pro-leads"] });
                    }}
                  />
                ))}
              </section>
            )}

            {tab === "avaliacoes" && (
              <section className="mt-6 space-y-3">
                {reviews.length === 0 && (
                  <p className="text-sm text-muted-foreground p-6 rounded-2xl border border-dashed border-border text-center">
                    Você ainda não recebeu avaliações. Peça para seus clientes avaliarem pelo teiyaa.
                  </p>
                )}
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl border border-border bg-surface">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{r.author?.display_name ?? "Morador"}</p>
                      <RatingStars value={r.rating} size={12} />
                    </div>
                    {r.comment && <p className="text-sm mt-1 text-muted-foreground">{r.comment}</p>}
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function LeadRow({
  lead,
  onStatus,
}: {
  lead: ProfessionalLead;
  onStatus: (s: ProfessionalLead["status"]) => void;
}) {
  const wa = lead.contact_whatsapp?.replace(/\D/g, "");
  return (
    <div className="p-4 rounded-2xl border border-border bg-surface">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{lead.requester?.display_name ?? "Morador"}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(lead.created_at).toLocaleDateString("pt-BR")}
            {lead.budget_cents != null && ` · orçamento sugerido ${formatPrice(lead.budget_cents)}`}
          </p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            lead.status === "novo"
              ? "bg-brand text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {lead.status === "novo" ? "Novo" : lead.status === "respondido" ? "Respondido" : "Fechado"}
        </span>
      </div>
      <p className="text-sm mt-2 whitespace-pre-line">{lead.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {wa && (
          <a
            href={`https://wa.me/55${wa}`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-full bg-brand text-primary-foreground text-sm font-bold"
          >
            Responder no WhatsApp
          </a>
        )}
        {lead.status !== "respondido" && (
          <button onClick={() => onStatus("respondido")} className="px-4 py-2 rounded-full border border-border text-sm font-semibold">
            Marcar como respondido
          </button>
        )}
        {lead.status !== "fechado" && (
          <button onClick={() => onStatus("fechado")} className="px-4 py-2 rounded-full border border-border text-sm font-semibold">
            Fechar
          </button>
        )}
      </div>
    </div>
  );
}

function SpecialtiesInput({
  values,
  onChange,
}: {
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setDraft("");
  };
  return (
    <div>
      <p className="text-sm font-semibold text-foreground/80">Especialidades</p>
      <div className="mt-1 flex gap-2">
        <input
          className={inputCls}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Ex: instalação de chuveiro"
        />
        <button type="button" onClick={add} className="px-4 rounded-lg border border-border font-semibold text-sm">
          Add
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="px-3 py-1 rounded-full bg-cat-profissional-soft text-cat-profissional border border-cat-profissional/25 text-xs font-semibold"
            >
              {v} ✕
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: string | number;
}) {
  return (
    <div className="p-4 rounded-2xl border border-border bg-surface">
      <Icon className="size-4 text-muted-foreground" />
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
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
