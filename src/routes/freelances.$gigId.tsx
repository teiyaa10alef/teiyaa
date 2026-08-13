import { DetailSkeleton } from "@/components/PageSkeletons";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Flame,
  MapPin,
  Users,
  Eye,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { RatingStars } from "@/components/RatingStars";
import { UserAvatar } from "@/components/UserAvatar";

import {
  applyToGig,
  APPLICATION_STATUS_LABELS,
  canApplicantChat,
  fetchReputation,
  formatBudget,
  formatGigDate,
  gigCategoryEmoji,
  gigCategoryLabel,
  gigQuery,
  myApplicationForGigQuery,
  startGigConversation,
  timeAgo,
  trackGigView,
  withdrawApplication,
} from "@/lib/gigs-api";
import { fetchProfiles, type PublicProfile } from "@/lib/market-api";

export const Route = createFileRoute("/freelances/$gigId")({
  head: () => ({
    meta: [
      { title: "Bico no bairro — teiyaa" },
      {
        name: "description",
        content: "Veja os detalhes do freelance, o valor oferecido e candidate-se em um clique.",
      },
      { property: "og:title", content: "Bico no bairro — teiyaa" },
      {
        property: "og:description",
        content: "Freelances rápidos perto de casa, com candidatura e chat pelo teiyaa.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  pendingComponent: DetailSkeleton,
  component: GigDetailPage,
});

function GigDetailPage() {
  const { gigId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: gig, isLoading } = useQuery(gigQuery(gigId));
  const { data: myApp } = useQuery(myApplicationForGigQuery(gigId, user?.id));
  const [owner, setOwner] = useState<PublicProfile | null>(null);
  const [ownerRep, setOwnerRep] = useState<{ avg: number | null; count: number } | null>(null);

  const [message, setMessage] = useState("");
  const [proposed, setProposed] = useState("");
  const [availability, setAvailability] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    trackGigView(gigId);
  }, [gigId]);

  useEffect(() => {
    if (!gig) return;
    fetchProfiles([gig.owner_id]).then((m) => setOwner(m[gig.owner_id] ?? null));
    fetchReputation([gig.owner_id]).then((r) =>
      setOwnerRep({ avg: r[gig.owner_id]?.avg ?? null, count: r[gig.owner_id]?.count ?? 0 }),
    );
  }, [gig]);

  const isOwner = !!user && !!gig && user.id === gig.owner_id;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate({ to: "/login" });
    if (!gig) return;
    if (message.trim().length < 5) return toast.error("Escreva uma mensagem para o anunciante");
    setSending(true);
    try {
      const cents = proposed ? Math.round(Number(proposed.replace(",", ".")) * 100) : null;
      await applyToGig({
        gigId: gig.id,
        applicantId: user.id,
        message: message.trim(),
        proposedCents: Number.isFinite(cents as number) ? cents : null,
        availableAt: availability.trim() || null,
      });
      toast.success("Candidatura enviada!");
      setMessage("");
      setProposed("");
      setAvailability("");
      qc.invalidateQueries({ queryKey: ["gig-application", gigId] });
      qc.invalidateQueries({ queryKey: ["gig", gigId] });
    } catch (err) {
      toast.error("Não consegui enviar: " + (err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const chatAllowed = canApplicantChat(myApp?.status);

  const handleChat = async () => {
    if (!user || !gig) return;
    try {
      const id = await startGigConversation({
        gigId: gig.id,
        ownerId: gig.owner_id,
        applicantId: user.id,
        applicationId: myApp?.id ?? null,
        asApplicantStatus: myApp?.status ?? null,
      });
      navigate({ to: "/mensagens/bico/$conversationId", params: { conversationId: id } });
    } catch (err) {
      toast.error((err as Error).message || "Não consegui abrir a conversa");
    }
  };

  const handleWithdraw = async () => {
    if (!myApp) return;
    await withdrawApplication(myApp.id);
    qc.invalidateQueries({ queryKey: ["gig-application", gigId] });
    toast.success("Candidatura retirada");
  };

  if (isLoading) {
    return (
      <Shell>
        <p className="py-20 text-center text-muted-foreground">Carregando…</p>
      </Shell>
    );
  }

  if (!gig) {
    return (
      <Shell>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold">Bico não encontrado</h1>
          <Link to="/freelances" className="mt-4 inline-block text-brand font-semibold">
            Ver outros bicos
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Link
        to="/freelances"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4"
      >
        <ArrowLeft className="size-4" /> Bicos do bairro
      </Link>

      {gig.images?.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-5">
          {gig.images.map((url, i) => (
            <img
              key={url}
              src={url}
              alt=""
              loading="lazy"
              className={`w-full rounded-2xl object-cover ${
                i === 0 ? "col-span-2 max-h-72" : "aspect-square"
              }`}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-full bg-cat-freelance-soft text-cat-freelance border border-cat-freelance/25 font-semibold">
          {gigCategoryEmoji(gig.category)} {gigCategoryLabel(gig.category)}
        </span>
        {gig.is_urgent && (
          <span className="px-2.5 py-1 rounded-full bg-cat-freelance text-primary-foreground font-semibold inline-flex items-center gap-1">
            <Flame className="size-3" /> Urgente
          </span>
        )}
        <span className="text-muted-foreground">publicado {timeAgo(gig.created_at)}</span>
      </div>

      <h1 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">{gig.title}</h1>
      <p className="mt-2 text-3xl font-bold text-cat-freelance">{formatBudget(gig)}</p>
      {gig.is_negotiable && gig.budget_type !== "negotiable" && (
        <p className="text-xs text-muted-foreground">Aberto a propostas</p>
      )}

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Info icon={<CalendarDays className="size-4" />} label={formatGigDate(gig)} />
        {gig.duration_hours != null && (
          <Info icon={<Clock className="size-4" />} label={`~${gig.duration_hours}h`} />
        )}
        <Info
          icon={<MapPin className="size-4" />}
          label={gig.address_hint || gig.community?.name || "Bairro"}
        />
        <Info
          icon={<Users className="size-4" />}
          label={`${gig.applications_count} ${gig.applications_count === 1 ? "candidato" : "candidatos"}`}
        />
      </div>

      <section className="mt-6">
        <h2 className="font-bold mb-2">Descrição</h2>
        <p className="text-muted-foreground whitespace-pre-line">{gig.description}</p>
      </section>

      {gig.requirements?.length > 0 && (
        <section className="mt-6">
          <h2 className="font-bold mb-2">Requisitos</h2>
          <div className="flex flex-wrap gap-2">
            {gig.requirements.map((r) => (
              <span
                key={r}
                className="px-3 py-1.5 rounded-full border border-border bg-card text-sm inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="size-3.5 text-cat-freelance" /> {r}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 p-4 rounded-2xl border border-border bg-surface flex items-center gap-3">
        <UserAvatar src={owner?.avatar_url} name={owner?.display_name} className="size-12" />

        <div className="min-w-0">
          <p className="font-bold truncate">{owner?.display_name ?? "Vizinho"}</p>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            {ownerRep && ownerRep.count > 0 ? (
              <>
                <RatingStars value={ownerRep.avg ?? 0} size={12} />
                <span>({ownerRep.count})</span>
              </>
            ) : (
              <span>Sem avaliações ainda</span>
            )}
            <span className="inline-flex items-center gap-1">
              · <Eye className="size-3" /> {gig.view_count}
            </span>
          </div>
        </div>
      </section>

      <section className="mt-6">
        {isOwner ? (
          <Link
            to="/conta/freelances/$gigId"
            params={{ gigId: gig.id }}
            className="block text-center px-6 py-3.5 rounded-full bg-brand text-primary-foreground font-bold shadow-brand"
          >
            Ver candidaturas ({gig.applications_count})
          </Link>
        ) : gig.status !== "open" ? (
          <div className="p-5 rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
            Este bico já não está aceitando candidaturas.
          </div>
        ) : myApp && myApp.status !== "withdrawn" ? (
          <div className="p-5 rounded-2xl border border-border bg-surface">
            <p className="font-bold">Você já se candidatou</p>
            <p className="text-sm text-muted-foreground mt-1">
              Situação: {APPLICATION_STATUS_LABELS[myApp.status]}
              {myApp.proposed_cents != null &&
                ` · sua proposta: ${(myApp.proposed_cents / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleChat}
                className="px-5 py-2.5 rounded-full bg-brand text-primary-foreground font-bold text-sm inline-flex items-center gap-2"
              >
                <MessageCircle className="size-4" /> Conversar
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                className="px-5 py-2.5 rounded-full border border-border font-semibold text-sm"
              >
                Retirar candidatura
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleApply} className="p-5 rounded-2xl border border-border bg-surface">
            <h2 className="font-bold text-lg">Quero fazer esse bico</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Conte como pode ajudar. Quem publicou escolhe entre os candidatos.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={800}
              placeholder="Ex.: Tenho carroça e já fiz vários carretos aqui no bairro. Posso hoje à tarde."
              className="mt-4 w-full p-4 rounded-xl bg-card border border-border focus:border-brand outline-none"
            />
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gig.is_negotiable && (
                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    Sua proposta (R$, opcional)
                  </label>
                  <input
                    value={proposed}
                    onChange={(e) => setProposed(e.target.value)}
                    inputMode="decimal"
                    placeholder="Ex.: 100"
                    className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-brand outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-1.5">Sua disponibilidade</label>
                <input
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  maxLength={80}
                  placeholder="Ex.: hoje depois das 15h"
                  className="w-full h-12 px-4 rounded-xl bg-card border border-border focus:border-brand outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={sending}
              className="mt-4 w-full px-6 py-3.5 rounded-full bg-brand text-primary-foreground font-bold shadow-brand disabled:opacity-60"
            >
              {sending ? "Enviando…" : "Enviar candidatura"}
            </button>
          </form>
        )}
      </section>
    </Shell>
  );
}

function Info({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="p-3 rounded-xl border border-border bg-card flex items-center gap-2 text-xs">
      <span className="text-cat-freelance">{icon}</span>
      <span className="font-semibold truncate">{label}</span>
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
