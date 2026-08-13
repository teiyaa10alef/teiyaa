import { DetailSkeleton } from "@/components/PageSkeletons";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { UserAvatar } from "@/components/UserAvatar";

import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  getBusinessBySlug,
  listBusinessHours,
  listBusinessServices,
  listBusinessMedia,
  WEEKDAYS,
} from "@/lib/account-api";
import {
  businessCategoryLabel,
  isOpenNow,
  listBusinessPromotions,
  listBusinessReviews,
  upsertBusinessReview,
  removeBusinessReview,
  listFavoriteIds,
  addFavorite,
  removeFavorite,
  trackBusinessView,
  trackWhatsappClick,
} from "@/lib/business-api";
import {
  MessageCircle,
  Phone,
  Instagram,
  MapPin,
  Clock,
  Star,
  Tag,
  Heart,
  Store,
  Eye,
} from "lucide-react";

export const Route = createFileRoute("/negocios/$slug")({
  head: () => ({
    meta: [
      { title: "Comércio do bairro — teiyaa" },
      {
        name: "description",
        content:
          "Veja horários, cardápio, promoções, avaliações e contato deste comércio da sua comunidade no teiyaa.",
      },
      { property: "og:title", content: "Comércio do bairro — teiyaa" },
      {
        property: "og:description",
        content: "Horários, promoções, avaliações e contato direto pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  pendingComponent: DetailSkeleton,
  component: PublicBusiness,
});

function PublicBusiness() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: biz, isLoading } = useQuery({
    queryKey: ["public-biz", slug],
    queryFn: () => getBusinessBySlug(slug),
  });
  const bizId = biz?.id;

  useEffect(() => {
    if (bizId) void trackBusinessView(bizId);
  }, [bizId]);

  const { data: hours = [] } = useQuery({
    queryKey: ["public-biz-hours", bizId],
    queryFn: () => listBusinessHours(bizId!),
    enabled: !!bizId,
  });
  const { data: services = [] } = useQuery({
    queryKey: ["public-biz-svc", bizId],
    queryFn: () => listBusinessServices(bizId!),
    enabled: !!bizId,
  });
  const { data: media = [] } = useQuery({
    queryKey: ["public-biz-media", bizId],
    queryFn: () => listBusinessMedia(bizId!),
    enabled: !!bizId,
  });
  const { data: promos = [] } = useQuery({
    queryKey: ["public-biz-promos", bizId],
    queryFn: () => listBusinessPromotions(bizId!, true),
    enabled: !!bizId,
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["public-biz-reviews", bizId],
    queryFn: () => listBusinessReviews(bizId!),
    enabled: !!bizId,
  });
  const { data: favorites = [] } = useQuery({
    queryKey: ["business-favorites", user?.id],
    queryFn: () => listFavoriteIds(user!.id),
    enabled: !!user,
  });

  if (isLoading)
    return (
      <Layout>
        <p className="text-muted-foreground">Carregando…</p>
      </Layout>
    );
  if (!biz)
    return (
      <Layout>
        <div className="text-center py-16">
          <Store className="size-10 mx-auto text-muted-foreground" />
          <h1 className="mt-3 text-2xl font-bold">Comércio não encontrado</h1>
          <p className="text-muted-foreground mt-1">
            Ele pode ter sido removido ou ainda não está publicado.
          </p>
          <Link to="/" className="mt-5 inline-block px-5 py-2.5 rounded-full bg-brand text-primary-foreground font-bold">
            Voltar ao início
          </Link>
        </div>
      </Layout>
    );

  const waNumber = biz.whatsapp?.replace(/\D/g, "");
  const open = isOpenNow(hours);
  const ratingCount = reviews.length;
  const ratingAvg = ratingCount ? reviews.reduce((a, r) => a + r.rating, 0) / ratingCount : null;
  const isFavorited = favorites.includes(biz.id);
  const isOwner = user?.id === biz.owner_id;
  const myReview = reviews.find((r) => r.user_id === user?.id);

  const toggleFavorite = async () => {
    if (!user) return;
    if (isFavorited) await removeFavorite(user.id, biz.id);
    else await addFavorite(user.id, biz.id);
    qc.invalidateQueries({ queryKey: ["business-favorites", user.id] });
  };

  return (
    <Layout>
      <div className="relative h-40 sm:h-56 md:h-72 rounded-2xl overflow-hidden bg-muted">
        {biz.cover_url ? (
          <img src={biz.cover_url} alt={`Foto de ${biz.name}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Store className="size-10" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 -mt-8 sm:-mt-10 flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
        <div className="size-20 md:size-28 rounded-2xl border-4 border-background bg-card shadow-md overflow-hidden flex-shrink-0">
          {biz.logo_url ? (
            <img src={biz.logo_url} alt="" className="w-full h-full object-cover bg-card" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Store className="size-7" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 sm:pb-2">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight break-words">{biz.name}</h1>
          <p className="text-sm text-muted-foreground">{businessCategoryLabel(biz.category)}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
            {open !== null && (
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  open ? "text-cat-imovel" : "text-muted-foreground"
                }`}
              >
                <Clock className="size-3" /> {open ? "Aberto agora" : "Fechado agora"}
              </span>
            )}
            {ratingAvg !== null && (
              <span className="inline-flex items-center gap-1 font-semibold">
                <Star className="size-3.5 fill-current text-cat-comercio" />
                {ratingAvg.toFixed(1)}{" "}
                <span className="font-normal text-muted-foreground">({ratingCount})</span>
              </span>
            )}
          </div>
        </div>

        {user && !isOwner && (
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={isFavorited ? "Remover dos salvos" : "Salvar comércio"}
            className="absolute right-0 top-0 sm:static sm:mb-2 size-10 rounded-full border border-border bg-card shadow-sm flex items-center justify-center"
          >
            <Heart
              className={`size-5 ${isFavorited ? "fill-cat-mercado text-cat-mercado" : "text-muted-foreground"}`}
            />
          </button>
        )}
      </div>


      <div className="mt-6 flex flex-wrap gap-3">
        {waNumber && (
          <a
            href={`https://wa.me/55${waNumber}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => void trackWhatsappClick(biz.id)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-brand text-primary-foreground rounded-full font-bold"
          >
            <MessageCircle className="size-4" /> WhatsApp
          </a>
        )}
        {biz.phone && (
          <a
            href={`tel:${biz.phone}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border font-semibold"
          >
            <Phone className="size-4" /> Ligar
          </a>
        )}
        {biz.instagram && (
          <a
            href={`https://instagram.com/${biz.instagram.replace("@", "")}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-border font-semibold"
          >
            <Instagram className="size-4" /> Instagram
          </a>
        )}
      </div>

      {promos.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
            <Tag className="size-5 text-cat-freelance" /> Promoções
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {promos.map((p) => (
              <li key={p.id} className="p-4 rounded-xl border border-cat-freelance/30 bg-cat-freelance-soft">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold">{p.title}</p>
                  {p.discount_label && (
                    <span className="px-2 py-0.5 rounded-full bg-cat-freelance text-primary-foreground text-xs font-bold whitespace-nowrap">
                      {p.discount_label}
                    </span>
                  )}
                </div>
                {p.description && <p className="text-sm mt-1 text-foreground/70">{p.description}</p>}
                {p.ends_at && (
                  <p className="text-xs mt-2 text-foreground/60">
                    Válido até {new Date(p.ends_at).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {biz.description && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-2">Sobre</h2>
          <p className="text-muted-foreground whitespace-pre-line">{biz.description}</p>
        </section>
      )}

      {biz.address && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <MapPin className="size-5" /> Endereço
          </h2>
          <p className="text-muted-foreground">{biz.address}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address)}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-brand"
          >
            Ver no mapa
          </a>
        </section>
      )}

      {hours.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">Horários</h2>
          <ul className="space-y-1">
            {WEEKDAYS.map((label, w) => {
              const h = hours.find((x) => x.weekday === w);
              const isToday = new Date().getDay() === w;
              return (
                <li
                  key={w}
                  className={`flex justify-between text-sm border-b border-border py-2 ${isToday ? "font-bold" : ""}`}
                >
                  <span>{label}</span>
                  <span className={isToday ? "" : "text-muted-foreground"}>
                    {!h || h.is_closed
                      ? "Fechado"
                      : `${h.opens_at?.slice(0, 5) ?? ""} – ${h.closes_at?.slice(0, 5) ?? ""}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {services.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">Cardápio / Serviços</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.id} className="p-4 rounded-xl border border-border bg-surface">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{s.title}</span>
                  {s.price_cents != null && (
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      R$ {(s.price_cents / 100).toFixed(2)}
                    </span>
                  )}
                </div>
                {s.description && (
                  <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {media.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-3">Galeria</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {media.map((m) => (
              <div key={m.id} className="aspect-square rounded-xl overflow-hidden bg-muted">
                <img src={m.media_url} alt={m.caption ?? ""} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </section>
      )}

      <ReviewsSection
        businessId={biz.id}
        reviews={reviews}
        canReview={!!user && !isOwner}
        isLoggedIn={!!user}
        userId={user?.id}
        myReviewId={myReview?.id}
        myRating={myReview?.rating}
        myComment={myReview?.comment ?? ""}
        onChanged={() => qc.invalidateQueries({ queryKey: ["public-biz-reviews", biz.id] })}
      />

      {isOwner && (
        <p className="mt-10 text-xs text-muted-foreground flex items-center gap-1">
          <Eye className="size-3.5" /> {biz.view_count ?? 0} visualizações ·{" "}
          {biz.whatsapp_click_count ?? 0} cliques no WhatsApp
        </p>
      )}
    </Layout>
  );
}

function ReviewsSection({
  businessId,
  reviews,
  canReview,
  isLoggedIn,
  userId,
  myReviewId,
  myRating,
  myComment,
  onChanged,
}: {
  businessId: string;
  reviews: Awaited<ReturnType<typeof listBusinessReviews>>;
  canReview: boolean;
  isLoggedIn: boolean;
  userId?: string;
  myReviewId?: string;
  myRating?: number;
  myComment?: string;
  onChanged: () => void;
}) {
  const [rating, setRating] = useState(myRating ?? 0);
  const [comment, setComment] = useState(myComment ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRating(myRating ?? 0);
    setComment(myComment ?? "");
  }, [myRating, myComment]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || rating < 1) {
      toast.error("Escolha uma nota de 1 a 5.");
      return;
    }
    setSaving(true);
    try {
      await upsertBusinessReview({
        business_id: businessId,
        user_id: userId,
        rating,
        comment: comment.trim().slice(0, 600) || null,
      });
      toast.success("Avaliação enviada!");
      onChanged();
    } catch (err) {
      toast.error("Erro: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!myReviewId) return;
    await removeBusinessReview(myReviewId);
    toast.success("Avaliação removida.");
    onChanged();
  };

  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold mb-3">Avaliações</h2>

      {canReview ? (
        <form onSubmit={submit} className="p-4 rounded-2xl border border-border bg-surface">
          <p className="text-sm font-semibold mb-2">Sua nota</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                onClick={() => setRating(n)}
                className="p-1"
              >
                <Star
                  className={`size-6 ${n <= rating ? "fill-current text-cat-comercio" : "text-muted-foreground"}`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={600}
            rows={3}
            placeholder="Conte como foi sua experiência (opcional)"
            className="mt-3 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
          <div className="mt-3 flex gap-2">
            <button
              disabled={saving}
              className="px-5 py-2.5 rounded-full bg-brand text-primary-foreground font-bold text-sm disabled:opacity-60"
            >
              {saving ? "Enviando…" : myReviewId ? "Atualizar avaliação" : "Enviar avaliação"}
            </button>
            {myReviewId && (
              <button
                type="button"
                onClick={del}
                className="px-4 py-2.5 rounded-full border border-border font-semibold text-sm"
              >
                Remover
              </button>
            )}
          </div>
        </form>
      ) : !isLoggedIn ? (
        <div className="p-4 rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
          <Link to="/login" className="font-semibold text-brand">
            Entre na sua conta
          </Link>{" "}
          para avaliar este comércio.
        </div>
      ) : null}

      <ul className="mt-5 space-y-4">
        {reviews.length === 0 && (
          <li className="text-sm text-muted-foreground">Ainda não há avaliações.</li>
        )}
        {reviews.map((r) => (
          <li key={r.id} className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <UserAvatar
                src={r.author?.avatar_url}
                name={r.author?.display_name}
                className="size-9"
                textClassName="text-xs"
              />

              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{r.author?.display_name ?? "Vizinho"}</p>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`size-3.5 ${n <= r.rating ? "fill-current text-cat-comercio" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            {r.comment && <p className="mt-2 text-sm text-foreground/80">{r.comment}</p>}
          </li>
        ))}
      </ul>
    </section>
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
