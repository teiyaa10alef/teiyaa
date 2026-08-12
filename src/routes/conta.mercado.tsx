import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  myMarketItemsQuery,
  myOffersQuery,
  formatBRL,
  MARKET_STATUS_LABELS,
  type MarketStatus,
} from "@/lib/market-api";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/conta/mercado")({
  head: () => ({
    meta: [
      { title: "Meus anúncios do mercado — teiyaa" },
      { name: "description", content: "Gerencie seus itens à venda e as propostas recebidas." },
      { property: "og:title", content: "Meus anúncios do mercado — teiyaa" },
      { property: "og:description", content: "Administre seus itens e propostas no teiyaa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContaMercado,
});

function ContaMercado() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: items = [] } = useQuery(myMarketItemsQuery(user?.id));
  const { data: offers = [] } = useQuery(myOffersQuery(user?.id));

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const updateStatus = async (id: string, status: MarketStatus) => {
    const { error } = await supabase.from("market_items").update({ status }).eq("id", id);
    if (error) return toast.error("Não consegui atualizar");
    qc.invalidateQueries({ queryKey: ["my-market-items", user?.id] });
    toast.success("Anúncio atualizado");
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from("market_items").delete().eq("id", id);
    if (error) return toast.error("Não consegui excluir");
    qc.invalidateQueries({ queryKey: ["my-market-items", user?.id] });
    toast.success("Anúncio excluído");
  };

  const pendingReceived = offers.filter((o) => o.seller_id === user?.id && o.status === "pending");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-6 py-8 md:py-14">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Meus anúncios</h1>
            <p className="mt-2 text-muted-foreground">
              {pendingReceived.length > 0
                ? `${pendingReceived.length} proposta(s) aguardando resposta.`
                : "Gerencie os itens que você está vendendo."}
            </p>
          </div>
          <Link
            to="/mercado/novo"
            className="inline-flex items-center gap-2 px-5 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
          >
            <Plus className="size-4" /> Novo item
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="mt-10 text-muted-foreground">Você ainda não anunciou nenhum item.</p>
        ) : (
          <ul className="mt-8 space-y-3">
            {items.map((item) => (
              <li key={item.id} className="p-4 rounded-2xl border border-border bg-card flex gap-4">
                <Link
                  to="/mercado/$itemId"
                  params={{ itemId: item.id }}
                  className="size-16 rounded-xl overflow-hidden bg-brand-soft flex items-center justify-center shrink-0"
                >
                  {item.images?.[0] ? (
                    <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to="/mercado/$itemId" params={{ itemId: item.id }} className="font-bold block truncate">
                    {item.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {formatBRL(item.price_cents)} •{" "}
                    {offers.filter((o) => o.item_id === item.id).length} proposta(s)
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => updateStatus(item.id, e.target.value as MarketStatus)}
                      className="h-9 px-3 rounded-full bg-surface border border-border text-sm"
                    >
                      {Object.entries(MARKET_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="h-9 px-4 rounded-full border border-border text-sm font-semibold text-destructive"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mt-12 text-2xl font-bold">Propostas que eu fiz</h2>
        {offers.filter((o) => o.buyer_id === user?.id).length === 0 ? (
          <p className="mt-3 text-muted-foreground text-sm">Você ainda não fez propostas.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {offers
              .filter((o) => o.buyer_id === user?.id)
              .map((o) => (
                <li
                  key={o.id}
                  className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold">{formatBRL(o.amount_cents)}</p>
                    <Link
                      to="/mercado/$itemId"
                      params={{ itemId: o.item_id }}
                      className="text-sm text-brand font-semibold"
                    >
                      Ver item
                    </Link>
                  </div>
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {o.status === "pending" ? "Pendente" : o.status === "accepted" ? "Aceita" : "Recusada"}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
