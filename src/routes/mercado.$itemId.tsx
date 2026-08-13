import { DetailSkeleton } from "@/components/PageSkeletons";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { UserAvatar } from "@/components/UserAvatar";

import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import {
  marketItemQuery,
  itemOffersQuery,
  fetchProfiles,
  startConversation,
  createOffer,
  respondOffer,
  formatBRL,
  CONDITION_LABELS,
  MARKET_CATEGORY_LABELS,
  MARKET_STATUS_LABELS,
  type PublicProfile,
} from "@/lib/market-api";
import { MessageCircle, Tag } from "lucide-react";

export const Route = createFileRoute("/mercado/$itemId")({
  head: () => ({
    meta: [
      { title: "Item no marketplace do bairro — teiyaa" },
      {
        name: "description",
        content: "Veja detalhes do item, faça uma proposta e converse com o vendedor pelo chat.",
      },
      { property: "og:title", content: "Item no marketplace do bairro — teiyaa" },
      { property: "og:description", content: "Negocie direto com o vizinho que está vendendo." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  pendingComponent: DetailSkeleton,
  component: ItemPage,
});

function ItemPage() {
  const { itemId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: item, isLoading } = useQuery(marketItemQuery(itemId));
  const [seller, setSeller] = useState<PublicProfile | null>(null);
  const [active, setActive] = useState(0);
  const [offerValue, setOfferValue] = useState("");
  const [offerMsg, setOfferMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const isOwner = !!user && !!item && user.id === item.seller_id;
  const { data: offers = [] } = useQuery(itemOffersQuery(itemId, !!user));
  const [buyers, setBuyers] = useState<Record<string, PublicProfile>>({});

  useEffect(() => {
    if (item?.seller_id) fetchProfiles([item.seller_id]).then((m) => setSeller(m[item.seller_id] ?? null));
  }, [item?.seller_id]);

  useEffect(() => {
    if (offers.length > 0) fetchProfiles(offers.map((o) => o.buyer_id)).then(setBuyers);
  }, [offers]);

  const requireLogin = () => {
    toast.error("Entre para negociar");
    navigate({ to: "/login" });
  };

  const handleChat = async () => {
    if (!user) return requireLogin();
    if (!item) return;
    setBusy(true);
    try {
      const convoId = await startConversation(item, user.id);
      navigate({ to: "/mensagens/$conversationId", params: { conversationId: convoId } });
    } catch {
      toast.error("Não consegui abrir a conversa");
    } finally {
      setBusy(false);
    }
  };

  const handleOffer = async () => {
    if (!user) return requireLogin();
    if (!item) return;
    const cents = Math.round(Number(offerValue.replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents <= 0) return toast.error("Informe um valor válido");
    setBusy(true);
    try {
      await createOffer({
        itemId: item.id,
        buyerId: user.id,
        sellerId: item.seller_id,
        amountCents: cents,
        message: offerMsg.trim() || undefined,
      });
      const convoId = await startConversation(item, user.id);
      const { sendMessage } = await import("@/lib/market-api");
      await sendMessage(
        convoId,
        user.id,
        `Fiz uma proposta de ${formatBRL(cents)}${offerMsg.trim() ? ` — ${offerMsg.trim()}` : ""}`,
      );
      toast.success("Proposta enviada!");
      setOfferValue("");
      setOfferMsg("");
      qc.invalidateQueries({ queryKey: ["market-offers", item.id] });
      navigate({ to: "/mensagens/$conversationId", params: { conversationId: convoId } });
    } catch {
      toast.error("Não consegui enviar a proposta");
    } finally {
      setBusy(false);
    }
  };

  const handleRespond = async (offerId: string, status: "accepted" | "rejected") => {
    try {
      await respondOffer(offerId, status);
      qc.invalidateQueries({ queryKey: ["market-offers", itemId] });
      toast.success(status === "accepted" ? "Proposta aceita" : "Proposta recusada");
    } catch {
      toast.error("Não consegui responder a proposta");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center text-muted-foreground">Carregando…</main>
        <SiteFooter />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <h1 className="text-2xl font-bold">Item não encontrado</h1>
          <Link to="/mercado" className="text-brand font-semibold">
            Voltar ao mercado
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const images = item.images ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-6 md:py-12 grid lg:grid-cols-[1.2fr_1fr] gap-8">
        <div>
          <div className="aspect-square w-full rounded-3xl overflow-hidden bg-brand-soft flex items-center justify-center border border-border">
            {images[active] ? (
              <img src={images[active]} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl">📦</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActive(i)}
                  className={`size-16 shrink-0 rounded-xl overflow-hidden border-2 ${
                    i === active ? "border-brand" : "border-border"
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand">
            {MARKET_CATEGORY_LABELS[item.category] ?? item.category} • {CONDITION_LABELS[item.condition]}
          </span>
          <h1 className="mt-2 text-2xl md:text-4xl font-bold leading-tight">{item.title}</h1>
          <p className="mt-3 text-3xl font-bold">{formatBRL(item.price_cents)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.is_negotiable ? "Aceita propostas" : "Preço fixo"} •{" "}
            {MARKET_STATUS_LABELS[item.status]} • {item.community?.name ?? "Bairro"}
          </p>

          {item.description && (
            <p className="mt-5 whitespace-pre-line text-muted-foreground">{item.description}</p>
          )}

          <div className="mt-6 flex items-center gap-3 p-4 rounded-2xl border border-border bg-surface">
            <UserAvatar src={seller?.avatar_url} name={seller?.display_name} className="size-11" />

            <div>
              <p className="font-bold leading-tight">{seller?.display_name ?? "Vizinho"}</p>
              <p className="text-xs text-muted-foreground">Vendedor</p>
            </div>
          </div>

          {!isOwner && (
            <div className="mt-6 space-y-4">
              <button
                onClick={handleChat}
                disabled={busy}
                className="w-full h-12 inline-flex items-center justify-center gap-2 bg-brand text-primary-foreground rounded-full font-bold shadow-brand disabled:opacity-60"
              >
                <MessageCircle className="size-4" /> Conversar com o vendedor
              </button>

              {item.is_negotiable && (
                <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
                  <p className="font-bold text-sm flex items-center gap-2">
                    <Tag className="size-4 text-brand" /> Fazer uma proposta
                  </p>
                  <input
                    value={offerValue}
                    onChange={(e) => setOfferValue(e.target.value)}
                    inputMode="decimal"
                    placeholder="Seu valor (R$)"
                    className="w-full h-11 px-4 rounded-xl bg-surface border border-border focus:border-brand outline-none"
                  />
                  <textarea
                    value={offerMsg}
                    onChange={(e) => setOfferMsg(e.target.value)}
                    rows={2}
                    placeholder="Mensagem (opcional)"
                    className="w-full p-3 rounded-xl bg-surface border border-border focus:border-brand outline-none text-sm"
                  />
                  <button
                    onClick={handleOffer}
                    disabled={busy}
                    className="w-full h-11 rounded-full bg-foreground text-background font-bold text-sm disabled:opacity-60"
                  >
                    Enviar proposta
                  </button>
                </div>
              )}
            </div>
          )}

          {isOwner && (
            <div className="mt-6">
              <h2 className="font-bold text-lg mb-3">Propostas recebidas</h2>
              {offers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma proposta ainda.</p>
              ) : (
                <ul className="space-y-3">
                  {offers.map((offer) => (
                    <li key={offer.id} className="p-4 rounded-2xl border border-border bg-card">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold">{formatBRL(offer.amount_cents)}</p>
                          <p className="text-xs text-muted-foreground">
                            {buyers[offer.buyer_id]?.display_name ?? "Vizinho"}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-brand uppercase">
                          {offer.status === "pending"
                            ? "Pendente"
                            : offer.status === "accepted"
                              ? "Aceita"
                              : "Recusada"}
                        </span>
                      </div>
                      {offer.message && (
                        <p className="mt-2 text-sm text-muted-foreground">{offer.message}</p>
                      )}
                      {offer.status === "pending" && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => handleRespond(offer.id, "accepted")}
                            className="flex-1 h-10 rounded-full bg-brand text-primary-foreground font-bold text-sm"
                          >
                            Aceitar
                          </button>
                          <button
                            onClick={() => handleRespond(offer.id, "rejected")}
                            className="flex-1 h-10 rounded-full border border-border font-bold text-sm"
                          >
                            Recusar
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/conta/mercado"
                className="mt-5 inline-block text-brand font-semibold text-sm"
              >
                Gerenciar meus anúncios
              </Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
