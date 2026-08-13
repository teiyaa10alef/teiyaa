import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  MessageCircle,
  Star,
  X,
  Eye,
  Users,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RatingStars } from "@/components/RatingStars";
import { UserAvatar } from "@/components/UserAvatar";

import { useAuth } from "@/hooks/use-auth";
import {
  acceptApplication,
  APPLICATION_STATUS_LABELS,
  completeGig,
  formatBudget,
  formatGigDate,
  gigApplicationsQuery,
  gigQuery,
  gigReviewsQuery,
  GIG_STATUS_LABELS,
  setApplicationStatus,
  startGigConversation,
  submitGigReview,
  timeAgo,
  updateGig,
  type GigApplicationWithProfile,
} from "@/lib/gigs-api";

export const Route = createFileRoute("/conta/freelances/$gigId")({
  head: () => ({
    meta: [
      { title: "Candidaturas do bico — teiyaa" },
      {
        name: "description",
        content: "Compare os candidatos do seu freelance, converse e escolha quem vai fazer.",
      },
      { property: "og:title", content: "Candidaturas do bico — teiyaa" },
      { property: "og:description", content: "Gerencie as candidaturas do seu bico no teiyaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GigApplicationsPage,
});

function GigApplicationsPage() {
  const { gigId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: gig } = useQuery(gigQuery(gigId));
  const isOwner = !!user && !!gig && user.id === gig.owner_id;
  const { data: apps = [] } = useQuery(gigApplicationsQuery(gigId, isOwner));
  const { data: reviews = [] } = useQuery(gigReviewsQuery(gigId));

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["gig-applications", gigId] });
    qc.invalidateQueries({ queryKey: ["gig", gigId] });
    qc.invalidateQueries({ queryKey: ["my-gigs"] });
  };

  const handleChat = async (app: GigApplicationWithProfile) => {
    if (!gig || !user) return;
    try {
      if (app.status === "sent") await setApplicationStatus(app.id, "seen");
      const id = await startGigConversation({
        gigId: gig.id,
        ownerId: gig.owner_id,
        applicantId: app.applicant_id,
        applicationId: app.id,
      });
      navigate({ to: "/mensagens/bico/$conversationId", params: { conversationId: id } });
    } catch {
      toast.error("Não consegui abrir a conversa");
    }
  };

  const handleAccept = async (app: GigApplicationWithProfile) => {
    try {
      await acceptApplication(app);
      toast.success("Candidato escolhido! O bico está em andamento.");
      refresh();
    } catch (err) {
      toast.error("Erro: " + (err as Error).message);
    }
  };

  const myReview = reviews.find((r) => r.reviewer_id === user?.id);

  if (loading || !gig) {
    return (
      <Shell>
        <p className="py-20 text-center text-muted-foreground">Carregando…</p>
      </Shell>
    );
  }

  if (!isOwner) {
    return (
      <Shell>
        <div className="py-20 text-center">
          <h1 className="text-xl font-bold">Este bico não é seu</h1>
          <Link to="/conta/freelances" className="mt-4 inline-block text-brand font-semibold">
            Ver meus bicos
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Link
        to="/conta/freelances"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4"
      >
        <ArrowLeft className="size-4" /> Meus bicos
      </Link>

      <div className="p-5 rounded-2xl border border-border bg-surface">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{gig.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {formatGigDate(gig)} · {formatBudget(gig)}
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-border whitespace-nowrap">
            {GIG_STATUS_LABELS[gig.status]}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat icon={<Users className="size-4" />} value={gig.applications_count} label="candidaturas" />
          <Stat icon={<Eye className="size-4" />} value={gig.view_count} label="visualizações" />
          <Stat
            icon={<CheckCircle2 className="size-4" />}
            value={apps.filter((a) => a.status === "shortlisted").length}
            label="pré-selecionados"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/freelances/$gigId"
            params={{ gigId: gig.id }}
            className="px-4 py-2 rounded-full border border-border text-sm font-semibold"
          >
            Ver anúncio
          </Link>
          {gig.status === "in_progress" && (
            <button
              type="button"
              onClick={async () => {
                await completeGig(gig.id);
                toast.success("Bico concluído! Avalie quem te ajudou.");
                refresh();
              }}
              className="px-4 py-2 rounded-full bg-brand text-primary-foreground text-sm font-bold"
            >
              Marcar como concluído
            </button>
          )}
          {gig.status === "open" && (
            <button
              type="button"
              onClick={async () => {
                await updateGig(gig.id, { status: "cancelled" });
                toast.success("Bico cancelado");
                refresh();
              }}
              className="px-4 py-2 rounded-full border border-border text-sm font-semibold"
            >
              Cancelar bico
            </button>
          )}
        </div>
      </div>

      {gig.status === "completed" && gig.assigned_user_id && !myReview && (
        <ReviewBox
          onSubmit={async (rating, comment) => {
            await submitGigReview({
              gigId: gig.id,
              reviewerId: user!.id,
              revieweeId: gig.assigned_user_id!,
              role: "contratante",
              rating,
              comment,
            });
            toast.success("Avaliação enviada!");
            qc.invalidateQueries({ queryKey: ["gig-reviews", gigId] });
          }}
        />
      )}

      <h2 className="mt-8 mb-3 font-bold text-lg">Candidaturas</h2>
      {apps.length === 0 ? (
        <div className="text-center py-14 bg-card border border-dashed border-border rounded-3xl text-sm text-muted-foreground">
          Ainda ninguém se candidatou. Compartilhe o bico com os vizinhos.
        </div>
      ) : (
        <ul className="space-y-3">
          {apps.map((app) => (
            <li key={app.id} className="p-4 rounded-2xl border border-border bg-card">
              <div className="flex items-start gap-3">
                <UserAvatar
                  src={app.profile?.avatar_url}
                  name={app.profile?.display_name}
                  className="size-12"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold truncate">{app.profile?.display_name ?? "Vizinho"}</p>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-border">
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                    {app.rating_count > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <RatingStars value={app.rating_avg ?? 0} size={12} />({app.rating_count})
                      </span>
                    ) : (
                      <span>Sem avaliações</span>
                    )}
                    <span>· {app.completed_gigs} bicos concluídos</span>
                    <span>· {timeAgo(app.created_at)}</span>
                  </div>
                  {app.message && <p className="mt-2 text-sm whitespace-pre-line">{app.message}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    {app.proposed_cents != null && (
                      <span className="font-bold text-cat-freelance">
                        Proposta:{" "}
                        {(app.proposed_cents / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    )}
                    {app.available_at && (
                      <span className="text-muted-foreground">Disponível: {app.available_at}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleChat(app)}
                  className="px-4 py-2 rounded-full bg-brand text-primary-foreground text-sm font-bold inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="size-4" /> Conversar
                </button>
                {gig.status === "open" && app.status !== "accepted" && (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        await setApplicationStatus(
                          app.id,
                          app.status === "shortlisted" ? "seen" : "shortlisted",
                        );
                        refresh();
                      }}
                      className={`px-4 py-2 rounded-full border text-sm font-semibold inline-flex items-center gap-1.5 ${
                        app.status === "shortlisted"
                          ? "bg-cat-freelance text-primary-foreground border-cat-freelance"
                          : "border-border"
                      }`}
                    >
                      <Star className="size-4" /> Pré-selecionar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccept(app)}
                      className="px-4 py-2 rounded-full border border-cat-freelance text-cat-freelance text-sm font-bold inline-flex items-center gap-1.5"
                    >
                      <Check className="size-4" /> Escolher
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await setApplicationStatus(app.id, "rejected");
                        refresh();
                      }}
                      className="px-4 py-2 rounded-full border border-border text-sm font-semibold inline-flex items-center gap-1.5"
                    >
                      <X className="size-4" /> Recusar
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="p-3 rounded-xl border border-border bg-card">
      <span className="text-cat-freelance flex justify-center">{icon}</span>
      <p className="font-bold text-lg leading-tight mt-1">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ReviewBox({
  onSubmit,
}: {
  onSubmit: (rating: number, comment: string | null) => Promise<void>;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <div className="mt-4 p-5 rounded-2xl border border-border bg-surface">
      <h2 className="font-bold">Como foi o serviço?</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Sua avaliação ajuda outros vizinhos a escolherem com confiança.
      </p>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} estrelas`}
            onClick={() => setRating(n)}
            className={n <= rating ? "text-cat-freelance" : "text-muted-foreground"}
          >
            <Star className="size-7" fill={n <= rating ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={600}
        placeholder="Conte como foi (opcional)"
        className="mt-3 w-full p-4 rounded-xl bg-card border border-border focus:border-brand outline-none"
      />
      <button
        type="button"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            await onSubmit(rating, comment.trim() || null);
          } finally {
            setSaving(false);
          }
        }}
        className="mt-3 px-6 py-3 rounded-full bg-brand text-primary-foreground font-bold shadow-brand disabled:opacity-60"
      >
        {saving ? "Enviando…" : "Enviar avaliação"}
      </button>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
