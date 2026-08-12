import { DetailSkeleton } from "@/components/PageSkeletons";
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MessageCircle,
  Phone,
  Instagram,
  MapPin,
  BadgeCheck,
  Award,
  Star,
  Send,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RatingStars } from "@/components/RatingStars";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { useAuth } from "@/hooks/use-auth";
import {
  getPublicProfessionalFull,
  professionLabel,
  formatPrice,
  trackProfessionalView,
  trackProfessionalWhatsapp,
  upsertProfessionalReview,
  createProfessionalLead,
} from "@/lib/professional-api";

export const Route = createFileRoute("/profissionais/perfil/$userId")({
  head: () => ({
    meta: [
      { title: "Perfil profissional — teiyaa" },
      {
        name: "description",
        content:
          "Veja portfólio, serviços, preços e avaliações deste profissional do seu bairro e peça um orçamento pelo teiyaa.",
      },
      { property: "og:title", content: "Perfil profissional — teiyaa" },
      {
        property: "og:description",
        content: "Portfólio, serviços e avaliações de profissionais da sua comunidade.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  pendingComponent: DetailSkeleton,
  component: PublicProfessional,
});

function PublicProfessional() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["public-pro-full", userId],
    queryFn: () => getPublicProfessionalFull(userId),
  });

  const proId = data?.profile.id;
  useEffect(() => {
    if (proId) void trackProfessionalView(proId);
  }, [proId]);

  if (isLoading) return <Layout><p className="text-muted-foreground">Carregando…</p></Layout>;
  if (!data)
    return (
      <Layout>
        <h1 className="text-2xl font-bold">Perfil não encontrado</h1>
        <p className="text-muted-foreground mt-2">
          Este profissional não existe ou ainda não publicou o perfil.
        </p>
        <Link to="/servicos" className="mt-6 inline-block text-brand font-semibold">
          Ver profissionais do bairro →
        </Link>
      </Layout>
    );

  const { profile, services, portfolio, reviews, rating_avg, rating_count, ownerName } = data;
  const waNumber = profile.whatsapp?.replace(/\D/g, "");
  const isOwner = user?.id === profile.user_id;
  const myReview = reviews.find((r) => r.user_id === user?.id) ?? null;

  return (
    <Layout>
      {/* Header */}
      <div className="relative h-40 md:h-56 rounded-2xl overflow-hidden bg-muted">
        {profile.cover_url && (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="size-20 md:size-24 rounded-2xl border border-border bg-card overflow-hidden flex-shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
              {(ownerName ?? profile.profession).charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">
            {ownerName ?? profile.profession}
          </h1>
          <p className="text-cat-profissional font-semibold">
            {professionLabel(profile.category) !== "Profissional"
              ? professionLabel(profile.category)
              : profile.profession}
          </p>
          {profile.headline && <p className="text-muted-foreground mt-1">{profile.headline}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {rating_count > 0 ? (
              <span className="inline-flex items-center gap-1">
                <RatingStars value={rating_avg ?? 0} />
                <strong className="text-foreground">{(rating_avg ?? 0).toFixed(1)}</strong>
                <span>({rating_count} avaliações)</span>
              </span>
            ) : (
              <span>Ainda sem avaliações</span>
            )}
            {profile.years_experience != null && profile.years_experience > 0 && (
              <span className="inline-flex items-center gap-1">
                <Award className="size-4" /> {profile.years_experience} anos de experiência
              </span>
            )}
            {profile.service_area_km != null && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" /> atende até {profile.service_area_km} km
              </span>
            )}
          </div>
        </div>
      </div>

      {(profile.specialties ?? []).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.specialties.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cat-profissional-soft text-cat-profissional border border-cat-profissional/25 text-xs font-semibold"
            >
              <BadgeCheck className="size-3.5" /> {s}
            </span>
          ))}
        </div>
      )}

      {/* Contact */}
      <div className="mt-6 flex flex-wrap gap-3">
        {waNumber && (
          <a
            href={`https://wa.me/55${waNumber}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => void trackProfessionalWhatsapp(profile.id)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-brand text-primary-foreground rounded-full font-bold"
          >
            <MessageCircle className="size-4" /> Chamar no WhatsApp
          </a>
        )}
        {profile.phone && (
          <a
            href={`tel:${profile.phone}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border font-semibold"
          >
            <Phone className="size-4" /> Ligar
          </a>
        )}
        {profile.instagram && (
          <a
            href={`https://instagram.com/${profile.instagram.replace("@", "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border font-semibold"
          >
            <Instagram className="size-4" /> Instagram
          </a>
        )}
      </div>

      {profile.about && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-2">Sobre</h2>
          <p className="text-muted-foreground whitespace-pre-line">{profile.about}</p>
        </section>
      )}

      {services.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">Serviços e preços</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.id} className="p-4 rounded-xl border border-border bg-surface">
                <p className="font-semibold">{s.title}</p>
                {s.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
                )}
                {s.price_from_cents != null && (
                  <p className="text-sm font-semibold text-cat-profissional mt-1">
                    a partir de {formatPrice(s.price_from_cents)} / {s.price_unit ?? "serviço"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {portfolio.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">Portfólio de trabalhos</h2>
          <PortfolioGallery items={portfolio} />
        </section>
      )}

      {/* Lead form */}
      {!isOwner && (
        <section className="mt-8 p-5 rounded-2xl border border-border bg-surface">
          <h2 className="text-xl font-bold">Pedir orçamento</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Descreva o que precisa e o profissional entra em contato com você.
          </p>
          {user ? (
            <LeadForm professionalId={profile.id} userId={user.id} />
          ) : (
            <Link
              to="/login"
              className="mt-4 inline-block px-5 py-3 bg-brand text-primary-foreground rounded-full font-bold"
            >
              Entrar para pedir orçamento
            </Link>
          )}
        </section>
      )}

      {/* Reviews */}
      <section className="mt-8">
        <h2 className="text-xl font-bold mb-3">Avaliações</h2>
        {!isOwner && user && (
          <ReviewForm
            professionalId={profile.id}
            userId={user.id}
            initialRating={myReview?.rating ?? 0}
            initialComment={myReview?.comment ?? ""}
            onSaved={() => qc.invalidateQueries({ queryKey: ["public-pro-full", userId] })}
          />
        )}
        {!user && (
          <Link to="/login" className="text-sm text-brand font-semibold">
            Entre para avaliar este profissional →
          </Link>
        )}
        <ul className="mt-4 space-y-3">
          {reviews.length === 0 && (
            <li className="text-sm text-muted-foreground">
              Nenhuma avaliação ainda. Seja o primeiro a contar como foi o serviço.
            </li>
          )}
          {reviews.map((r) => (
            <li key={r.id} className="p-4 rounded-xl border border-border bg-surface">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {r.author?.avatar_url && (
                    <img src={r.author.avatar_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {r.author?.display_name ?? "Morador"}
                  </p>
                  <RatingStars value={r.rating} size={12} />
                </div>
              </div>
              {r.comment && <p className="text-sm mt-2 text-muted-foreground">{r.comment}</p>}
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}

function LeadForm({ professionalId, userId }: { professionalId: string; userId: string }) {
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent)
    return (
      <p className="mt-4 text-sm font-semibold text-cat-imovel">
        Pedido enviado! O profissional vai te responder em breve.
      </p>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      toast.error("Descreva melhor o serviço (mínimo 10 caracteres).");
      return;
    }
    setSending(true);
    try {
      await createProfessionalLead({
        professional_id: professionalId,
        requester_id: userId,
        description: description.trim(),
        budget_cents: budget ? Math.round(Number(budget) * 100) : null,
        contact_whatsapp: whatsapp.trim() || null,
      });
      setSent(true);
      toast.success("Pedido de orçamento enviado!");
    } catch (err) {
      toast.error("Erro ao enviar: " + (err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Ex: preciso trocar a fiação de dois cômodos, tenho o material."
        className="w-full min-h-24 px-3 py-2 rounded-lg border border-border bg-background text-sm"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          min={0}
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Orçamento (R$) — opcional"
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
        <input
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="Seu WhatsApp"
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
        />
      </div>
      <button
        disabled={sending}
        className="inline-flex items-center gap-2 px-5 py-3 bg-brand text-primary-foreground rounded-full font-bold disabled:opacity-60"
      >
        <Send className="size-4" /> {sending ? "Enviando…" : "Enviar pedido"}
      </button>
    </form>
  );
}

function ReviewForm({
  professionalId,
  userId,
  initialRating,
  initialComment,
  onSaved,
}: {
  professionalId: string;
  userId: string;
  initialRating: number;
  initialComment: string;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Escolha de 1 a 5 estrelas.");
      return;
    }
    setSaving(true);
    try {
      await upsertProfessionalReview({
        professional_id: professionalId,
        user_id: userId,
        rating,
        comment: comment.trim() || null,
      });
      toast.success("Avaliação salva!");
      onSaved();
    } catch (err) {
      toast.error("Erro: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-4 rounded-xl border border-border bg-surface">
      <p className="text-sm font-semibold flex items-center gap-2">
        <Star className="size-4 text-cat-profissional" /> Como foi o serviço?
      </p>
      <div className="mt-2">
        <RatingStars value={rating} size={24} onChange={setRating} />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Conte como foi (opcional)"
        className="mt-3 w-full min-h-20 px-3 py-2 rounded-lg border border-border bg-background text-sm"
      />
      <button
        disabled={saving}
        className="mt-3 px-5 py-2.5 bg-brand text-primary-foreground rounded-full font-bold text-sm disabled:opacity-60"
      >
        {saving ? "Salvando…" : initialRating > 0 ? "Atualizar avaliação" : "Enviar avaliação"}
      </button>
    </form>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">{children}</main>
      <SiteFooter />
    </div>
  );
}
