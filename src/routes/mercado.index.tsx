import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketItemCard } from "@/components/MarketItemCard";
import { marketItemsQuery, MARKET_CATEGORIES, MARKET_CATEGORY_LABELS } from "@/lib/market-api";
import { useHomeCommunitySlug } from "@/lib/community";
import { Search, Plus } from "lucide-react";

export const Route = createFileRoute("/mercado/")({
  head: () => ({
    meta: [
      { title: "Marketplace do bairro — teiyaa" },
      {
        name: "description",
        content:
          "Compre e venda itens novos e usados com vizinhos do seu bairro. Faça propostas e converse direto pelo chat do teiyaa.",
      },
      { property: "og:title", content: "Marketplace do bairro — teiyaa" },
      {
        property: "og:description",
        content: "Itens novos e usados anunciados por moradores da sua comunidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MercadoPage,
});

function MercadoPage() {
  const communitySlug = useHomeCommunitySlug();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [term, setTerm] = useState("");
  const [q, setQ] = useState("");

  const options = useMemo(
    () => marketItemsQuery({ communitySlug, category, q }),
    [communitySlug, category, q],
  );
  const { data: items = [], isLoading } = useQuery(options);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-brand-soft text-brand text-xs font-bold uppercase tracking-widest rounded-full">
              Entre vizinhos
            </span>
            <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight">Marketplace do bairro</h1>
            <p className="mt-2 text-muted-foreground max-w-xl">
              Itens novos e usados de moradores. Faça uma proposta e combine tudo pelo chat.
            </p>
          </div>
          <Link
            to="/mercado/novo"
            className="inline-flex items-center gap-2 px-5 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
          >
            <Plus className="size-4" /> Vender um item
          </Link>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(term.trim());
          }}
          className="mt-8 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="O que você procura?"
              className="w-full h-12 pl-11 pr-4 rounded-full bg-card border border-border focus:border-brand outline-none"
            />
          </div>
          <button className="px-5 h-12 rounded-full bg-foreground text-background font-bold text-sm">
            Buscar
          </button>
        </form>

        <div className="flex gap-2 overflow-x-auto py-4 -mx-4 px-4 md:mx-0 md:px-0">
          <button
            onClick={() => setCategory(undefined)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
              !category ? "bg-foreground text-background border-foreground" : "bg-card border-border"
            }`}
          >
            Tudo
          </button>
          {MARKET_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                category === cat
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border"
              }`}
            >
              {MARKET_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="py-16 text-center text-muted-foreground">Carregando…</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-3xl">
            <div className="text-4xl mb-3">🛒</div>
            <h2 className="font-bold text-lg mb-2">Nada por aqui ainda</h2>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
              Seja o primeiro a anunciar algo no marketplace do seu bairro.
            </p>
            <Link
              to="/mercado/novo"
              className="inline-block px-6 py-3 bg-brand text-primary-foreground rounded-full font-bold shadow-brand"
            >
              Anunciar item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {items.map((item) => (
              <MarketItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
